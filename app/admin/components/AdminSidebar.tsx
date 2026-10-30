"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Permission } from "@/lib/permissions";
import SierraLogo from "@/app/components/SierraLogo";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission?: Permission;
  children?: NavItem[];
}

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
    },
    {
      label: "Заказы",
      href: "/admin/orders",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
        </svg>
      ),
      permission: "orders.view",
    },
    {
      label: "Бронирования",
      href: "/admin/reservations",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8"  y1="2" x2="8"  y2="6"/>
          <line x1="3"  y1="10" x2="21" y2="10"/>
          <line x1="8"  y1="14" x2="8.01" y2="14" strokeWidth="2.5"/>
          <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="2.5"/>
          <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="2.5"/>
        </svg>
      ),
      permission: "reservations.view",
    },
    {
      // Аккордеон — показывает только Категории и Товары (Модификаторы убраны)
      label: "Меню",
      href: "/admin/menu",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 10h20v2a10 10 0 01-20 0v-2z" transform="scale(0.7) translate(3,2)"/>
          <path d="M10 10V7a6 6 0 0112 0v3" transform="scale(0.7) translate(3,2)"/>
        </svg>
      ),
      permission: "products.view",
      children: [
        { label: "Категории", href: "/admin/menu/categories", icon: null, permission: "categories.view" },
        { label: "Товары",    href: "/admin/menu/products",   icon: null, permission: "products.view"  },
      ],
    },
    {
      label: "Клиенты",
      href: "/admin/clients",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
      ),
      permission: "users.view",
    },
    {
      label: "Промокоды",
      href: "/admin/promocodes",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
        </svg>
      ),
      permission: "promocodes.view",
    },
    {
      label: "Отзывы",
      href: "/admin/reviews",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
      permission: "reviews.view",
    },
    {
      label: "Аудит",
      href: "/admin/audit",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
      permission: "audit.view",
    },
  ];

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#0f0d0b] border-r border-white/[0.06] z-50
          transition-transform duration-300 lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 h-16 px-4 border-b border-white/[0.06]">
          <SierraLogo href="/admin/dashboard" size="xs" />
          <p className="text-xs text-white/40 ml-1">Admin Panel</p>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-3 overflow-y-auto" style={{ height: "calc(100% - 64px)" }}>
          {navItems.map((item) => (
            <NavItemComponent
              key={item.href}
              item={item}
              isActive={isActive}
              onClose={onClose}
              // Открываем подменю сразу, если одна из дочерних страниц активна
              defaultOpen={
                item.children
                  ? item.children.some((c) => pathname.startsWith(c.href))
                  : false
              }
            />
          ))}
        </nav>
      </aside>
    </>
  );
}

// ─── Компонент одного пункта навигации ────────────────────────────────────────

function NavItemComponent({
  item,
  isActive,
  onClose,
  defaultOpen,
}: {
  item: NavItem;
  isActive: (href: string) => boolean;
  onClose: () => void;
  defaultOpen?: boolean;
}) {
  // Локальное состояние раскрытия аккордеона
  const [open, setOpen] = useState(defaultOpen ?? false);

  const active = isActive(item.href);

  // ── Пункт с подменю (аккордеон) ────────────────────────────────────────────
  if (item.children && item.children.length > 0) {
    return (
      <div>
        {/* Кнопка-переключатель — не делает навигацию */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
            ${active
              ? "bg-[#c9a96e]/10 text-[#c9a96e]"
              : "text-white/60 hover:bg-white/[0.04] hover:text-white"}
          `}
        >
          {item.icon}
          <span className="flex-1 text-left">{item.label}</span>
          {/* Шеврон — поворачивается при раскрытии */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>

        {/* Подменю — показывается/скрывается по флагу open */}
        {open && (
          <div className="ml-9 mt-1 space-y-1">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={onClose}
                className={`
                  block px-3 py-2 rounded-lg text-xs font-medium transition
                  ${isActive(child.href)
                    ? "bg-[#c9a96e]/10 text-[#c9a96e]"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/70"}
                `}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Обычный пункт без подменю ───────────────────────────────────────────────
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
        ${active
          ? "bg-[#c9a96e]/10 text-[#c9a96e]"
          : "text-white/60 hover:bg-white/[0.04] hover:text-white"}
      `}
    >
      {item.icon}
      <span>{item.label}</span>
    </Link>
  );
}
