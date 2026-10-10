interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  return (
    <div
      className={`bg-white/[0.06] animate-pulse ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={100} height={16} />
        <Skeleton variant="circular" width={32} height={32} />
      </div>
      <Skeleton width={80} height={32} className="mb-2" />
      <Skeleton width={120} height={12} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden animate-pulse">
      <div className="border-b border-white/[0.06] px-6 py-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} width="100%" height={12} className="flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-white/[0.04] px-6 py-4">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} width="100%" height={16} className="flex-1" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
