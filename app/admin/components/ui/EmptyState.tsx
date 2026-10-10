import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="text-white/20 mb-4">{icon}</div>}
      
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      
      {description && (
        <p className="text-sm text-white/40 max-w-md mb-6">{description}</p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="h-10 px-5 rounded-xl bg-[#c9a96e] text-[#0f0d0b] text-sm font-semibold hover:bg-[#d4b87a] transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
