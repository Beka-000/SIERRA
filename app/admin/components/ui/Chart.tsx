"use client";

/**
 * Простой компонент для отображения графиков
 * Использует SVG для построения базовых chart (bar, line, area)
 */

interface ChartDataPoint {
  label: string;
  value: number;
}

interface ChartProps {
  data: ChartDataPoint[];
  type?: "bar" | "line" | "area";
  height?: number;
  color?: string;
  showLabels?: boolean;
}

export default function Chart({
  data,
  type = "bar",
  height = 200,
  color = "#c9a96e",
  showLabels = true,
}: ChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-white/30 text-sm"
        style={{ height }}
      >
        Нет данных для отображения
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  const chartHeight = height - (showLabels ? 30 : 0);
  const barWidth = 100 / data.length;

  return (
    <div className="w-full">
      <svg width="100%" height={height} className="overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = chartHeight - ratio * chartHeight;
          return (
            <line
              key={i}
              x1="0"
              y1={y}
              x2="100%"
              y2={y}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          );
        })}

        {/* Bars */}
        {type === "bar" &&
          data.map((point, i) => {
            const barHeight = ((point.value - minValue) / range) * chartHeight;
            const x = (i * barWidth) + barWidth * 0.15;
            const y = chartHeight - barHeight;

            return (
              <g key={i}>
                <rect
                  x={`${x}%`}
                  y={y}
                  width={`${barWidth * 0.7}%`}
                  height={barHeight}
                  fill={color}
                  opacity="0.8"
                  rx="4"
                  className="transition-all duration-300 hover:opacity-100"
                />
                {showLabels && (
                  <text
                    x={`${i * barWidth + barWidth / 2}%`}
                    y={height - 5}
                    textAnchor="middle"
                    className="text-[10px] fill-white/40"
                  >
                    {point.label}
                  </text>
                )}
              </g>
            );
          })}

        {/* Line */}
        {(type === "line" || type === "area") && (
          <>
            {type === "area" && (
              <path
                d={buildPath(data, chartHeight, barWidth, minValue, range, true)}
                fill={`url(#gradient-${color})`}
                opacity="0.3"
              />
            )}
            <path
              d={buildPath(data, chartHeight, barWidth, minValue, range, false)}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {data.map((point, i) => {
              const x = (i * barWidth + barWidth / 2);
              const y = chartHeight - ((point.value - minValue) / range) * chartHeight;
              return (
                <circle
                  key={i}
                  cx={`${x}%`}
                  cy={y}
                  r="4"
                  fill={color}
                  className="transition-all hover:r-6"
                />
              );
            })}
            {showLabels &&
              data.map((point, i) => (
                <text
                  key={i}
                  x={`${i * barWidth + barWidth / 2}%`}
                  y={height - 5}
                  textAnchor="middle"
                  className="text-[10px] fill-white/40"
                >
                  {point.label}
                </text>
              ))}
          </>
        )}

        {/* Gradient for area chart */}
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function buildPath(
  data: ChartDataPoint[],
  chartHeight: number,
  barWidth: number,
  minValue: number,
  range: number,
  closeArea: boolean
): string {
  const points = data.map((point, i) => {
    const x = i * barWidth + barWidth / 2;
    const y = chartHeight - ((point.value - minValue) / range) * chartHeight;
    return `${x},${y}`;
  });

  let path = `M ${points.join(" L ")}`;

  if (closeArea) {
    const lastX = (data.length - 1) * barWidth + barWidth / 2;
    path += ` L ${lastX},${chartHeight} L ${barWidth / 2},${chartHeight} Z`;
  }

  return path;
}
