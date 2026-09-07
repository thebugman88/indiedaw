import React from 'react';

interface IndieBrotherhoodBrandingProps {
  variant?: 'banner' | 'emblem' | 'compact' | 'badge';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const IndieBrotherhoodBranding: React.FC<IndieBrotherhoodBrandingProps> = ({
  variant = 'compact',
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  // 1. Square Emblem Variant (Matching Image 2: "ibh" with equalizer bars, music notes, soundwave)
  if (variant === 'emblem') {
    const sizeClasses = {
      sm: 'w-10 h-10',
      md: 'w-16 h-16',
      lg: 'w-24 h-24',
      xl: 'w-36 h-36',
    }[size];

    return (
      <div className={`flex flex-col items-center select-none ${className}`}>
        <img
          src="/ibh-emblem.svg"
          alt="Indie Brotherhood IBH Emblem"
          className={`${sizeClasses} object-contain filter drop-shadow-md`}
          referrerPolicy="no-referrer"
        />
        {showSubtitle && size !== 'sm' && (
          <div className="flex items-center gap-1 mt-1 font-black text-[11px] tracking-tight">
            <span className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">INDIE</span>
            <span className="text-red-500 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">BROTHERHOOD</span>
          </div>
        )}
      </div>
    );
  }

  // 2. Full Horizontal Banner Variant (Matching Image 1: "indiebrotherhood" with waveforms & notes)
  if (variant === 'banner') {
    const heightClasses = {
      sm: 'h-8',
      md: 'h-12 sm:h-14',
      lg: 'h-16 sm:h-20',
      xl: 'h-24 sm:h-28',
    }[size];

    return (
      <div className={`flex items-center justify-center select-none ${className}`}>
        <img
          src="/indiebrotherhood-banner.svg"
          alt="Indie Brotherhood Studio Banner"
          className={`w-auto max-w-full ${heightClasses} object-contain filter drop-shadow-lg`}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // 3. Header / Navbar Badge Variant (Responsive emblem + stylized text)
  if (variant === 'badge') {
    return (
      <div className={`flex items-center gap-2.5 select-none ${className}`}>
        <div className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-800 p-0.5 flex items-center justify-center shrink-0 shadow-inner">
          <img
            src="/ibh-emblem.svg"
            alt="IBH"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-baseline font-black tracking-tight text-xs sm:text-sm uppercase leading-tight">
            <span className="text-white">indie</span>
            <span className="text-red-500">brotherhood</span>
          </div>
          {showSubtitle && (
            <span className="text-[9px] text-neutral-400 font-mono tracking-wider uppercase">
              Studio DAW & Stems
            </span>
          )}
        </div>
      </div>
    );
  }

  // 4. Default: Compact Header Variant
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <div className="w-7 h-7 rounded-md bg-neutral-950/80 border border-neutral-800 p-0.5 flex items-center justify-center shrink-0 shadow-sm">
        <img
          src="/ibh-emblem.svg"
          alt="IBH"
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex items-center font-black tracking-tight text-xs sm:text-sm">
        <span className="text-white">indie</span>
        <span className="text-red-500">brotherhood</span>
      </div>
    </div>
  );
};
