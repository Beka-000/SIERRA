"use client";

/**
 * SierraLogo — единый компонент логотипа Sierra Coffee.
 *
 * Использует PNG с прозрачным фоном:
 *   logo-white.png — белый логотип для тёмных фонов
 *   logo-black.png — чёрный логотип для светлых фонов
 *
 * Размеры (сторона квадрата):
 *   xs  32px  — admin sidebar
 *   sm  44px  — navbar desktop, footer
 *   md  64px  — login / register
 *   lg  88px  — hero / splash
 *
 * "use client" гарантирует единый рендер и устраняет RSC/Client hydration mismatch.
 */

import Image from "next/image";
import Link from "next/link";

type LogoSize    = "xs" | "sm" | "md" | "lg";
type LogoVariant = "white" | "black" | "auto";

interface SierraLogoProps {
  size?:     LogoSize;
  variant?:  LogoVariant;
  href?:     string;
  className?: string;
  priority?:  boolean;
}

const SIZE_PX: Record<LogoSize, number> = {
  xs: 32,
  sm: 44,
  md: 64,
  lg: 88,
};

export default function SierraLogo({
  size      = "sm",
  variant   = "auto",
  href,
  className = "",
  priority  = false,
}: SierraLogoProps) {
  const px  = SIZE_PX[size];
  const src = variant === "black"
    ? "/images/logo-black.png"
    : "/images/logo-white.png";

  const img = (
    <Image
      src={src}
      alt="Sierra Coffee"
      width={px}
      height={px}
      priority={priority}
      className="object-contain select-none"
      draggable={false}
    />
  );

  if (!href) {
    return (
      <div className={`inline-flex items-center flex-shrink-0 ${className}`}>
        {img}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`inline-flex items-center flex-shrink-0 hover:opacity-85 active:opacity-70 transition-opacity ${className}`}
      aria-label="Sierra Coffee — на главную"
    >
      {img}
    </Link>
  );
}
