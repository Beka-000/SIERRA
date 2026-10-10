"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const checkAdminAccess = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth/session");

      if (!res.ok) {
        // Нет авторизации или сессия истекла
        router.push("/admin/login");
        return;
      }

      const data = await res.json();

      // Проверяем, что роль административная
      const adminRoles = ["admin", "manager", "staff"];
      if (!data.user || !adminRoles.includes(data.user.role)) {
        // Авторизован, но не админ
        router.push("/403?from=admin");
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error("[Admin Guard Error]", error);
      router.push("/admin/login");
    } finally {
      setIsChecking(false);
    }
  }, [router]);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0d0b]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/[0.1] border-t-[#c9a96e] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-white/40">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
