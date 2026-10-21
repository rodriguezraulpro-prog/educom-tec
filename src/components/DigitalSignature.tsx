import React from 'react';

interface DigitalSignatureProps {
  variant?: 'compact' | 'full' | 'badge' | 'stamp';
  className?: string;
  color?: string; // blue accent or custom
  showSubtitle?: boolean;
}

/**
 * High-fidelity vector recreation of the official Educom-Tec logo
 * based on the user's uploaded brand mark.
 */
export const EducomTecIcon: React.FC<{
  className?: string;
  color?: string;
  primaryColor?: string;
  secondaryColor?: string;
  size?: number;
}> = ({
  className = 'w-10 h-10',
  color,
  primaryColor = '#2563eb',
  secondaryColor = '#ff7a00',
  size,
}) => {
  const effectiveColor = color || primaryColor;

  return (
    <svg
      viewBox="0 0 100 120"
      className={className}
      style={size ? { width: size, height: (size * 120) / 100 } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer hexagon network lines */}
      <polygon
        points="50,16 84,35.5 84,74.5 50,94 16,74.5 16,35.5"
        stroke={effectiveColor}
        strokeWidth="3.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Inner solid outline hexagon */}
      <polygon
        points="50,31 71,43 71,67 50,79 29,67 29,43"
        stroke={effectiveColor}
        strokeWidth="4.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Upper outer node dots (6 nodes) */}
      <circle cx="50" cy="16" r="4.2" fill={secondaryColor} />
      <circle cx="84" cy="35.5" r="4.2" fill={effectiveColor} />
      <circle cx="84" cy="74.5" r="4.2" fill={effectiveColor} />
      <circle cx="50" cy="94" r="4.2" fill={secondaryColor} />
      <circle cx="16" cy="74.5" r="4.2" fill={effectiveColor} />
      <circle cx="16" cy="35.5" r="4.2" fill={effectiveColor} />

      {/* Lower cradle bracket lines */}
      <polyline
        points="28,95 50,107 72,95"
        stroke={effectiveColor}
        strokeWidth="3.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const DigitalSignature: React.FC<DigitalSignatureProps> = ({
  variant = 'compact',
  className = '',
  color = '#2563eb',
  showSubtitle = true,
}) => {
  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs ${className}`}
      >
        <EducomTecIcon className="w-6 h-7 shrink-0" color={color} />
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black font-sans text-slate-900 dark:text-white">
              Educom-Tec
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none">
            Raul Eduardo Rodriguez &bull; Soporte TI & Web
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div
        className={`flex flex-col sm:flex-row items-center gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs ${className}`}
      >
        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
          <EducomTecIcon className="w-12 h-14" color={color} />
        </div>
        <div className="flex flex-col text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xl sm:text-2xl font-black font-sans text-slate-900 dark:text-white tracking-tight">
              Educom-Tec
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2563eb] text-[10px] font-bold">
              VERIFICADO
            </span>
          </div>
          <span className="text-xs text-[#2563eb] dark:text-[#38bdf8] font-semibold">
            - Soluciones Informáticas -
          </span>
          {showSubtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Firma Digital de <span className="text-slate-900 dark:text-white font-semibold">Raul Eduardo Rodriguez</span> &bull; Soporte TI, Web, Sistemas & Redes
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default 'compact' variant for Navbar and inline badges
  return (
    <div className={`flex items-center gap-2 sm:gap-2.5 ${className}`}>
      <div className="relative flex items-center justify-center p-1.5 sm:p-2 rounded-xl bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 group-hover:border-blue-400 transition-colors shadow-xs shrink-0">
        <EducomTecIcon className="w-5 h-6 sm:w-6 sm:h-7" color={color} />
      </div>

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-sans font-black text-sm sm:text-base tracking-tight text-slate-900 dark:text-white leading-none">
            Educom-Tec
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a00] shrink-0" />
        </div>
        <span className="text-[9px] sm:text-[10px] text-[#2563eb] dark:text-[#38bdf8] font-semibold leading-tight mt-0.5 truncate">
          Soluciones Informáticas
        </span>
        {showSubtitle && (
          <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-0.5 truncate hidden xs:block">
            Raul Eduardo Rodriguez
          </span>
        )}
      </div>
    </div>
  );
};
