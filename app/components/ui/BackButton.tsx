"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  /** Явный fallback-маршрут, если истории нет. По умолчанию "/" */
  fallback?: string;
  /** Текст кнопки. По умолчанию "Назад" */
  label?: string;
  /** Дополнительные CSS-классы */
  className?: string;
  /** Вариант: default (полная кнопка) | ghost (только иконка + текст, без рамки) */
  variant?: "default" | "ghost";
}

/**
 * BackButton — универсальная кнопка «Назад».
 *
 * Использует router.back() для SPA-навигации без перезагрузки страницы.
 * Если истории нет (прямой заход по URL), перенаправляет на `fallback`.
 *
 * Использование:
 *   <BackButton />                                // → /
 *   <BackButton fallback="/menu" />               // → /menu
 *   <BackButton fallback="/admin/orders" label="К заказам" />
 *   <BackButton variant="ghost" />
 */
export default function BackButton({
  fallback  = "/",
  label     = "Назад",
  className = "",
  variant   = "ghost",
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    // window.history.length <= 2 означает: нет предыдущей страницы в рамках сайта
    if (window.history.length <= 2) {
      router.push(fallback);
    } else {
      router.back();
    }
  };

  if (variant === "default") {
    return (
      <button
        onClick={handleClick}
        aria-label={label}
        className={`
          inline-flex items-center gap-2 h-9 px-4 rounded-xl
          bg-white/[0.05] border border-white/[0.08]
          text-sm text-[rgba(245,240,232,0.65)]
          hover:bg-white/[0.09] hover:text-[#f5f0e8] hover:border-white/[0.15]
          active:scale-[0.97] transition-all
          ${className}
        `}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        {label}
      </button>
    );
  }

  // ghost — минималистичный вариант (используется над заголовками)
  return (
    <button
      onClick={handleClick}
      aria-label={label}
      className={`
        inline-flex items-center gap-1.5
        text-sm text-white/40 hover:text-white/70
        active:scale-[0.97] transition-all
        ${className}
      `}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  );
}
