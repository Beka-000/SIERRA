import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string | number; label: string }[];
  children?: React.ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, children, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full h-11 rounded-xl 
            bg-white/[0.06] border border-white/[0.1] 
            text-white px-4 text-sm 
            outline-none transition 
            focus:border-[#c9a96e]/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#c9a96e]/10
            disabled:opacity-40 disabled:cursor-not-allowed
            ${error ? "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/10" : ""}
            ${className}
          `}
          {...props}
        >
          {options ? options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#161411] text-white">
              {opt.label}
            </option>
          )) : children}
        </select>
        {error && (
          <p className="mt-1.5 text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
