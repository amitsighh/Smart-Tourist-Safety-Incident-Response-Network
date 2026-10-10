import React from 'react';

export default function SurakshaYatraLogo({ size = 'default', showSubtitle = true, light = false }) {
  const isCompact = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Brand Icon SVG: Shield + Safety Node + Emblem Aura */}
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-100 ${
        isCompact ? 'w-8 h-8 p-1.5' : isLarge ? 'w-12 h-12 p-2.5' : 'w-10 h-10 p-2'
      }`}>
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Outer Protective Shield */}
          <path
            d="M16 3L27 7.5V15.5C27 22.4 22.3 28.5 16 30C9.7 28.5 5 22.4 5 15.5V7.5L16 3Z"
            fill="currentColor"
            fillOpacity="0.25"
            stroke="white"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner Safety Star / Compass Node */}
          <circle cx="16" cy="14" r="3.5" fill="#FBBF24" stroke="white" strokeWidth="1" />
          <path
            d="M16 8V10.5M16 17.5V20M10.5 14H8M24 14H21.5"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Protective Arcs / Radar Waves */}
          <path
            d="M12 24C13.2 24.8 14.5 25.3 16 25.5C17.5 25.3 18.8 24.8 20 24"
            stroke="#93C5FD"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-tight leading-none ${
            light ? 'text-white' : 'text-slate-900'
          } ${isCompact ? 'text-base' : isLarge ? 'text-2xl' : 'text-lg'}`}>
            सुरक्षा<span className="text-blue-600">YATRA</span>
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            Gov
          </span>
        </div>
        {showSubtitle && (
          <span className={`text-[11px] font-medium tracking-tight leading-tight mt-0.5 ${
            light ? 'text-blue-200' : 'text-slate-500'
          }`}>
            Smart Tourist Safety & Incident Response
          </span>
        )}
      </div>
    </div>
  );
}
