interface TokaLogoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export function TokaLogo({ size = 32, animated = true, className = '' }: TokaLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 ${animated ? 'toka-logo' : ''} ${className}`}
    >
      <circle
        cx="24"
        cy="24"
        r="17"
        stroke="var(--toka-border)"
        strokeWidth="3"
      />
      <g className={animated ? 'toka-logo-orbit' : ''}>
        <circle
          cx="24"
          cy="24"
          r="17"
          stroke="#C6FF69"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="86 22"
          className={animated ? 'toka-logo-ring' : ''}
          transform="rotate(-90 24 24)"
        />
      </g>
      <circle
        cx="24"
        cy="24"
        r="4.5"
        fill="#C6FF69"
        className={animated ? 'toka-logo-dot' : ''}
      />
    </svg>
  );
}
