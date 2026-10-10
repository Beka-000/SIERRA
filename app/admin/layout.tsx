"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminSidebar from "./components/AdminSidebar";
import AdminTopBar from "./components/AdminTopBar";
import Breadcrumbs from "./components/Breadcrumbs";
import { ToastProvider } from "@/lib/ToastContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Не проверяем auth на страницах логина/OTP
    if (pathname === "/admin/login" || pathname === "/admin/otp") {
      return;
    }

    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/auth/session");
        if (!res.ok) {
          router.push("/admin/login");
          return;
        }
        const data = await res.json();

        // Проверяем админскую роль
        const adminRoles = ["admin", "manager", "staff"];
        if (!data.user || !adminRoles.includes(data.user.role)) {
          router.push("/403?from=admin");
          return;
        }

        setSession(data);
      } catch {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [pathname, router]);

  // Страницы логина/OTP рендерим без layout
  if (pathname === "/admin/login" || pathname === "/admin/otp") {
    return <ToastProvider>{children}</ToastProvider>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0d0b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="animate-spin text-[#c9a96e]"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25" />
            <path d="M21 12a9 9 0 00-9-9" />
          </svg>
          <p className="text-sm text-white/40">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#0f0d0b] flex">
        {/* Sidebar */}
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userRole={session.role}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col lg:ml-64">
          <AdminTopBar
            userName={session.name}
            userEmail={session.email}
            onMenuToggle={() => setSidebarOpen((v) => !v)}
          />

          <main className="flex-1 p-6">
            <Breadcrumbs />
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
