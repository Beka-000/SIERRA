import type { ReactNode } from "react";

type BadgeVariant =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "gold";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

export default function Badge({ children, variant = "default", size = "md" }: BadgeProps) {
  const variants = {
    default: "bg-white/[0.08] text-white/60 border-white/[0.1]",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    gold: "bg-[#c9a96e]/10 text-[#c9a96e] border-[#c9a96e]/20",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
}
