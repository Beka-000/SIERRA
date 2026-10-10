"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href: string;
}

export default function Breadcrumbs() {
  const pathname = usePathname();

  const pathMap: Record<string, string> = {
    dashboard: "Dashboard",
    orders: "Заказы",
    menu: "Меню",
    categories: "Категории",
    products: "Товары",
    modifiers: "Модификаторы",
    clients: "Клиенты",
    promocodes: "Промокоды",
    reviews: "Отзывы",
    analytics: "Аналитика",
    audit: "Аудит",
    settings: "Настройки",
  };

  const segments = pathname.split("/").filter(Boolean);
  
  // Убираем "admin" из начала
  if (segments[0] === "admin") segments.shift();

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Главная", href: "/admin/dashboard" },
  ];

  let currentPath = "/admin";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = pathMap[segment] || segment;
    breadcrumbs.push({ label, href: currentPath });
  }

  if (breadcrumbs.length === 1) return null;

  return (
    <nav className="flex items-center gap-2 text-sm mb-6">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <div key={item.href} className="flex items-center gap-2">
            {index > 0 && (
              <svg
                className="text-white/20"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6"/>
              </svg>
            )}
            {isLast ? (
              <span className="text-white/80 font-medium">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-white/40 hover:text-white/70 transition"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
