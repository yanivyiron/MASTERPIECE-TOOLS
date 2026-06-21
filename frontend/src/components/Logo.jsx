import React from 'react';

// Recreated diamond logo — not the actual brand asset, custom SVG inspired by the brand mark
export const LogoMark = ({ className = 'w-9 h-9', accent = '#FF6B1A' }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="mptDiamondGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={accent} stopOpacity="1" />
        <stop offset="100%" stopColor="#C2410C" stopOpacity="1" />
      </linearGradient>
    </defs>
    <path d="M32 4 L60 24 L32 60 L4 24 Z" fill="url(#mptDiamondGrad)" stroke={accent} strokeWidth="1.2" />
    <path d="M32 4 L18 24 L32 24 L46 24 Z" fill="#FFA063" opacity="0.55" />
    <path d="M4 24 L18 24 L32 24 L32 60 Z" fill="#E5631A" opacity="0.55" />
    <path d="M18 24 L32 24 L32 60 Z" fill="#000" opacity="0.18" />
    <path d="M32 4 L46 24 L32 24 Z" fill="#FFF" opacity="0.18" />
  </svg>
);

const Logo = ({ compact = false, light = true }) => (
  <div className="flex items-center gap-3 select-none">
    <LogoMark />
    {!compact && (
      <div className={`leading-tight font-bold tracking-tight ${light ? 'text-white' : 'text-neutral-900'}`}>
        <div className="text-[17px] sm:text-[19px]">Masterpiece</div>
        <div className="text-[17px] sm:text-[19px] -mt-1">Tools</div>
      </div>
    )}
  </div>
);

export default Logo;
