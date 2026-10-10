import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full h-11 rounded-xl 
            bg-white/[0.06] border border-white/[0.1] 
            text-white placeholder-white/25 px-4 text-sm 
            outline-none transition 
            focus:border-[#c9a96e]/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#c9a96e]/10
            disabled:opacity-40 disabled:cursor-not-allowed
            ${error ? "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/10" : ""}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-white/40">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
