import React from 'react';

interface PhoenixLogoProps {
  className?: string;
  size?: number;
  variant?: 'full' | 'mark';
  theme?: 'light' | 'dark';
}

export const PhoenixLogo: React.FC<PhoenixLogoProps> = ({
  className = '',
  size = 32,
  variant = 'mark',
  theme = 'light',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Geometric Phoenix-Wing + Return-Arrow SVG Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 group-hover:scale-105"
        aria-hidden="true"
      >
        {/* Rounded Container Plate */}
        <rect width="48" height="48" rx="10" fill={theme === 'dark' ? '#0F1A15' : '#E8F5E9'} />
        <rect
          x="0.75"
          y="0.75"
          width="46.5"
          height="46.5"
          rx="9.25"
          stroke={theme === 'dark' ? '#1E3A2F' : '#C8E6C9'}
          strokeWidth="1.5"
        />

        {/* Primary Geometric Phoenix Wing Arch */}
        <path
          d="M12 28.5C12 20.4919 18.4919 14 26.5 14H34L28.5 19.5"
          stroke="#0F5132"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Secondary Feather / Wing Facet */}
        <path
          d="M16 32C16 26.4772 20.4772 22 26 22H31"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Tertiary Accent Feather (Ascending Wingtip) */}
        <path
          d="M20 35.5C22 35.5 24.5 34 26 31"
          stroke="#34D399"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Return Arrow Head (Signifying Reverse Logistics & Value Reclamation) */}
        <path
          d="M27 10L35 14L27 18"
          stroke="#0B4632"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center Geometric Core / Reclaimed Energy Spark */}
        <circle cx="26.5" cy="14" r="1.5" fill="#34D399" />
      </svg>

      {variant === 'full' && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-mono text-sm sm:text-base font-bold tracking-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              RETRACE<span className="text-emerald-700">.AI</span>
            </span>
          </div>
          <span
            className={`text-[9.5px] uppercase font-mono tracking-wider font-medium ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Commerce Recovery Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
