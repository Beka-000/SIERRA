import type { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading,
  fullWidth,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-[#c9a96e] text-[#0f0d0b] hover:bg-[#d4b87a] active:bg-[#c9a96e]",
    secondary: "bg-white/[0.08] text-white border border-white/[0.1] hover:bg-white/[0.12]",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15",
    ghost: "text-white/60 hover:bg-white/[0.06] hover:text-white",
    outline: "bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08]",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 
        rounded-xl font-semibold transition
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25" />
            <path d="M21 12a9 9 0 00-9-9" />
          </svg>
          Загрузка...
        </>
      ) : (
        children
      )}
    </button>
  );
}
