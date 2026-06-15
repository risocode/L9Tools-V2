'use client';

import { useId } from 'react';
import { usePathname } from 'next/navigation';
import { shouldShowJulyFreeAccessBanner } from '@/lib/subscription-utils';

function CornerOrnament({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M2 2h11v2.5H6.5L2 9V2z" fill="currentColor" />
      <path
        d="M2 2h11M2 2v7M2 11h4M9 2v4"
        stroke="#ffb020"
        strokeWidth="0.85"
        strokeLinecap="round"
      />
      <path
        d="M5 5l4 4M9 5L5 9"
        stroke="#3dd6ff"
        strokeWidth="0.5"
        strokeLinecap="round"
        opacity="0.65"
      />
      <circle cx="11" cy="11" r="3" fill="#1a1204" stroke="#e2c56a" strokeWidth="0.85" />
      <circle cx="11" cy="11" r="1.35" fill="#ffb020" />
      <path d="M13 2l2 2-2 2" stroke="#3dd6ff" strokeWidth="0.65" strokeLinecap="round" />
    </svg>
  );
}

function PremiumCrownEmblem({ uid }: { uid: string }) {
  const gold = `july-crown-gold-${uid}`;
  const goldDeep = `july-crown-deep-${uid}`;
  const gemCyan = `july-gem-cyan-${uid}`;
  const gemAmber = `july-gem-amber-${uid}`;
  const gemViolet = `july-gem-violet-${uid}`;
  const highlight = `july-crown-highlight-${uid}`;
  const crystalRing = `july-crystal-ring-${uid}`;
  const bandInlay = `july-band-inlay-${uid}`;

  return (
    <svg
      className="july-event-banner__emblem-svg"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gold} x1="12" y1="8" x2="60" y2="62">
          <stop offset="0%" stopColor="#fffef8" />
          <stop offset="18%" stopColor="#ffe082" />
          <stop offset="42%" stopColor="#ffb020" />
          <stop offset="68%" stopColor="#e2c56a" />
          <stop offset="100%" stopColor="#5a4510" />
        </linearGradient>
        <linearGradient id={goldDeep} x1="36" y1="16" x2="36" y2="52">
          <stop offset="0%" stopColor="#b8921f" />
          <stop offset="100%" stopColor="#2a1f06" />
        </linearGradient>
        <linearGradient id={highlight} x1="16" y1="14" x2="34" y2="44">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffb020" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={bandInlay} x1="14" y1="44" x2="58" y2="44">
          <stop offset="0%" stopColor="#3dd6ff" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#3dd6ff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#3dd6ff" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id={gemCyan} cx="35%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#7eeaff" />
          <stop offset="100%" stopColor="#0a4a6e" />
        </radialGradient>
        <radialGradient id={gemAmber} cx="35%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#ffd54f" />
          <stop offset="100%" stopColor="#8b6914" />
        </radialGradient>
        <radialGradient id={gemViolet} cx="35%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#c4a0ff" />
          <stop offset="100%" stopColor="#4a2080" />
        </radialGradient>
        <linearGradient id={crystalRing} x1="0" y1="36" x2="72" y2="36">
          <stop offset="0%" stopColor="#3dd6ff" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#ffb020" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#9b6dff" stopOpacity="0.25" />
        </linearGradient>
        <filter id={`july-emblem-shadow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.65" />
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ffb020" floodOpacity="0.45" />
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#3dd6ff" floodOpacity="0.2" />
        </filter>
      </defs>

      <circle
        cx="36"
        cy="36"
        r="31"
        fill="none"
        stroke={`url(#${crystalRing})`}
        strokeWidth="1.1"
        strokeDasharray="5 3"
        opacity="0.8"
      />
      <circle
        cx="36"
        cy="36"
        r="26"
        fill="none"
        stroke="rgba(61, 214, 255, 0.18)"
        strokeWidth="0.75"
        opacity="0.7"
      />

      <ellipse cx="36" cy="52" rx="24" ry="5.5" fill="rgba(0,0,0,0.55)" />

      <path
        d="M8 44 C6 40 5 36 7 32 L12 44 Z M64 44 C66 40 67 36 65 32 L60 44 Z"
        fill={`url(#${goldDeep})`}
        opacity="0.85"
      />

      <path
        d="M12 44 L16 26 L22 34 L28 16 L36 8 L44 16 L50 34 L56 26 L60 44 Z"
        fill="#1a1204"
        transform="translate(0, 1.5)"
        opacity="0.75"
      />

      <path
        filter={`url(#july-emblem-shadow-${uid})`}
        d="M12 43 L16 25 L22 33 L28 15 L36 7 L44 15 L50 33 L56 25 L60 43 Z"
        fill={`url(#${goldDeep})`}
        stroke="#5a4510"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 43 L16 25 L22 33 L28 15 L36 7 L44 15 L50 33 L56 25 L60 43 Z"
        fill={`url(#${gold})`}
        stroke="#ffe082"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />

      <path
        d="M16 25 L22 33 L36 7 L36 43 L16 43 Z"
        fill={`url(#${highlight})`}
        opacity="0.55"
      />

      <path
        d="M28 15 L32 22 M44 15 L40 22 M36 7 L36 12"
        stroke="#fffef8"
        strokeWidth="0.55"
        strokeLinecap="round"
        opacity="0.45"
      />

      <rect x="14" y="42" width="44" height="8" rx="1.75" fill={`url(#${goldDeep})`} stroke="#5a4510" strokeWidth="0.7" />
      <rect x="15.5" y="43.25" width="41" height="5.5" rx="1.25" fill={`url(#${gold})`} stroke="#ffe082" strokeWidth="0.55" />
      <rect x="17" y="44.5" width="38" height="2.5" rx="0.75" fill={`url(#${bandInlay})`} opacity="0.85" />
      <path
        d="M20 46h32M22.5 48h27M25 50h22"
        stroke="#8b6914"
        strokeWidth="0.4"
        strokeLinecap="round"
        opacity="0.65"
      />

      <g className="july-event-banner__emblem-gem july-event-banner__emblem-gem--peak">
        <circle cx="16" cy="30" r="2.6" fill="#0a1520" stroke="#3dd6ff" strokeWidth="0.65" />
        <circle cx="16" cy="30" r="1.9" fill={`url(#${gemCyan})`} />
        <circle cx="15.4" cy="29.4" r="0.65" fill="#ffffff" opacity="0.95" />
      </g>
      <g className="july-event-banner__emblem-gem july-event-banner__emblem-gem--side">
        <circle cx="22" cy="28" r="2.8" fill="#0a1520" stroke="#9b6dff" strokeWidth="0.7" />
        <circle cx="22" cy="28" r="2.1" fill={`url(#${gemViolet})`} />
        <circle cx="21.3" cy="27.3" r="0.7" fill="#ffffff" opacity="0.92" />
      </g>
      <g className="july-event-banner__emblem-gem july-event-banner__emblem-gem--peak">
        <circle cx="36" cy="18" r="3.4" fill="#1a1204" stroke="#ffb020" strokeWidth="0.85" />
        <circle cx="36" cy="18" r="2.5" fill={`url(#${gemAmber})`} />
        <circle cx="35.1" cy="17.1" r="0.9" fill="#ffffff" opacity="0.95" />
      </g>
      <g className="july-event-banner__emblem-gem july-event-banner__emblem-gem--side">
        <circle cx="50" cy="28" r="2.8" fill="#0a1520" stroke="#3dd6ff" strokeWidth="0.7" />
        <circle cx="50" cy="28" r="2.1" fill={`url(#${gemCyan})`} />
        <circle cx="49.3" cy="27.3" r="0.7" fill="#ffffff" opacity="0.92" />
      </g>
      <g className="july-event-banner__emblem-gem july-event-banner__emblem-gem--peak">
        <circle cx="56" cy="30" r="2.6" fill="#0a1520" stroke="#ffb020" strokeWidth="0.65" />
        <circle cx="56" cy="30" r="1.9" fill={`url(#${gemAmber})`} />
        <circle cx="55.4" cy="29.4" r="0.65" fill="#ffffff" opacity="0.95" />
      </g>

      <path
        d="M36 4 L37.2 7.5 L36 6.8 L34.8 7.5 Z"
        fill="#ffe082"
        stroke="#ffb020"
        strokeWidth="0.35"
      />

      <g className="july-event-banner__emblem-gem july-event-banner__emblem-gem--center">
        <circle cx="36" cy="45.5" r="5.8" fill="#1a1204" stroke="#ffb020" strokeWidth="1.05" />
        <circle cx="36" cy="45.5" r="4.4" fill={`url(#${gemAmber})`} />
        <circle cx="34.4" cy="44" r="1.55" fill="#ffffff" opacity="0.93" />
        <circle cx="37.8" cy="47.2" r="0.65" fill="#3dd6ff" opacity="0.8" />
      </g>
    </svg>
  );
}

function CrownEmblemSlot({ uid, side }: { uid: string; side: 'left' | 'right' }) {
  return (
    <div className={`july-event-banner__emblem july-event-banner__emblem--${side}`} aria-hidden="true">
      <span className={`july-event-banner__crystal-halo july-event-banner__crystal-halo--${side}`} />
      <PremiumCrownEmblem uid={uid} />
    </div>
  );
}

function BgParticles({ isInline }: { isInline: boolean }) {
  const stars = isInline
    ? [1, 2, 3, 4, 7, 8, 11]
    : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const dust = isInline ? [1, 2, 3, 6, 7] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const sparkles = isInline ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <>
      {stars.map((n) => (
        <span
          key={`star-${n}`}
          className={`july-event-banner__bg-star july-event-banner__bg-star--${n}`}
        />
      ))}
      {dust.map((n) => (
        <span
          key={`dust-${n}`}
          className={`july-event-banner__bg-dust july-event-banner__bg-dust--${n}`}
        />
      ))}
      {sparkles.map((n) => (
        <span
          key={`sparkle-${n}`}
          className={`july-event-banner__bg-sparkle july-event-banner__bg-sparkle--${n}`}
        />
      ))}
    </>
  );
}

export function JulyFreeAccessBanner({ variant = 'standalone' }: { variant?: 'standalone' | 'inline' }) {
  const pathname = usePathname();
  const uid = useId().replace(/:/g, '');

  if (!shouldShowJulyFreeAccessBanner(pathname)) {
    return null;
  }

  const isInline = variant === 'inline';

  return (
    <div
      className={isInline ? 'july-event-banner july-event-banner--inline' : 'july-event-banner'}
      role="status"
      aria-live="polite"
    >
      <div className="july-event-banner__shell">
        <span className="july-event-banner__rarity-aura" aria-hidden="true" />
        <span className="july-event-banner__frame-bevel" aria-hidden="true" />

        <div className="july-event-banner__inner">
          <div className="july-event-banner__bg-scene" aria-hidden="true">
            <span className="july-event-banner__bg-glow-core" />
            <span className="july-event-banner__bg-runes" />
            <span className="july-event-banner__bg-arcane-mist" />
            <span className="july-event-banner__bg-energy-stream" />
            <span className="july-event-banner__bg-light-sweep" />
            <span className="july-event-banner__bg-crown-energy july-event-banner__bg-crown-energy--left" />
            <span className="july-event-banner__bg-crown-energy july-event-banner__bg-crown-energy--right" />
            <BgParticles isInline={isInline} />
            <span className="july-event-banner__bg-corner-flash july-event-banner__bg-corner-flash--tl" />
            <span className="july-event-banner__bg-corner-flash july-event-banner__bg-corner-flash--tr" />
            <span className="july-event-banner__bg-corner-flash july-event-banner__bg-corner-flash--bl" />
            <span className="july-event-banner__bg-corner-flash july-event-banner__bg-corner-flash--br" />
          </div>

          <CornerOrnament className="july-event-banner__corner july-event-banner__corner--tl" />
          <CornerOrnament className="july-event-banner__corner july-event-banner__corner--tr" />
          <CornerOrnament className="july-event-banner__corner july-event-banner__corner--bl" />
          <CornerOrnament className="july-event-banner__corner july-event-banner__corner--br" />

          <div className="july-event-banner__center">
            <CrownEmblemSlot uid={`${uid}-L`} side="left" />

            <div className="july-event-banner__copy">
              <p className="july-event-banner__title">
                FREE PRO ACCESS FOR EVERYONE
              </p>
              <p className="july-event-banner__subtitle">
                From{' '}
                <span className="july-event-banner__subtitle-highlight">July 1–31</span>
                , unlock the complete{' '}
                <span className="july-event-banner__subtitle-highlight">Pro</span>{' '}
                toolkit at no cost.
              </p>
            </div>

            <CrownEmblemSlot uid={`${uid}-R`} side="right" />
          </div>
        </div>
      </div>
    </div>
  );
}
