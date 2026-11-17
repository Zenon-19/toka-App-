interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  percentage,
  size = 116,
  strokeWidth = 9,
  label,
  sublabel,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--toka-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--toka-accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 360ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="tabular-nums text-2xl font-semibold tracking-tight text-[var(--toka-text-primary)]">
          {label ?? `${clamped}%`}
        </span>
        {sublabel ? (
          <span className="text-xs text-[var(--toka-text-secondary)] mt-0.5">
            {sublabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
