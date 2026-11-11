import Link from "next/link";

export function FlameMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="fm-g" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ff4d1a" />
          <stop offset="0.6" stopColor="#ff7a2e" />
          <stop offset="1" stopColor="#ffb547" />
        </linearGradient>
      </defs>
      <path
        d="M12.6 1.8c.4 2.9-1 4.6-2.5 6.3C8.5 9.9 7 11.6 7 14.4A5 5 0 0 0 12 19.5a5 5 0 0 0 5-5.1c0-1.7-.7-3-1.6-4.1-.2 1.3-.9 2.2-1.9 2.6.6-3.6-.4-7.9-.9-11.1Z"
        fill="url(#fm-g)"
      />
      <path d="M12.2 12.6c-1.6 1.4-2.3 2.5-2.3 3.8a2.2 2.2 0 0 0 4.4 0c0-1.3-.8-2.3-2.1-3.8Z" fill="#fff3e0" opacity=".9" />
      <ellipse cx="12" cy="21.4" rx="6" ry="1.1" fill="#0e1116" opacity=".12" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-1.5" aria-label="Founder Roast home">
      <FlameMark size={22} />
      <span className={`text-[17px] font-semibold tracking-[-0.03em] ${light ? "text-white" : "text-ink"}`}>
        founder<span className="text-ink/55">roast</span>
      </span>
    </Link>
  );
}

/** Little cloud with a flame tuft. Floats above the hero headline. */
export function Mascot({ size = 64, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="ms-body" cx="0.42" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.65" stopColor="#f6f9fd" />
          <stop offset="1" stopColor="#d7e3f3" />
        </radialGradient>
        <linearGradient id="ms-flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ff4d1a" />
          <stop offset="1" stopColor="#ffb547" />
        </linearGradient>
        <filter id="ms-shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#2a5ea8" floodOpacity="0.28" />
        </filter>
      </defs>
      {/* flame tuft */}
      <path d="M33.5 6c.4 3.2-1.2 4.8-2.6 6.4-1.3 1.5-2.4 3-2.1 5.1.3 2 2 3.4 4 3.4 2.4 0 4.2-1.9 4.2-4.3 0-1.6-.6-2.8-1.4-3.9-.2 1.2-.8 2-1.7 2.3.5-2.9-.1-6.2-.4-9Z" fill="url(#ms-flame)" />
      <g filter="url(#ms-shadow)">
        <path
          d="M17 50c-6.1 0-10-4.2-10-9.3 0-5 3.9-8.9 8.9-9.1C17 25 22.4 20.5 28.8 20.5c5.4 0 10 3.2 11.9 7.9 1-.3 2-.4 3-.4 6.6 0 12.3 5.2 12.3 11.6C56 45.6 51.6 50 46 50H17Z"
          fill="url(#ms-body)"
        />
      </g>
      {/* face */}
      <circle cx="26.5" cy="38.5" r="1.9" fill="#1d2633" />
      <circle cx="37.5" cy="38.5" r="1.9" fill="#1d2633" />
      <path d="M29 43.2c1.8 1.6 4.2 1.6 6 0" stroke="#1d2633" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <ellipse cx="22.5" cy="42.5" rx="2.4" ry="1.4" fill="#ff9b8a" opacity=".45" />
      <ellipse cx="41.5" cy="42.5" rx="2.4" ry="1.4" fill="#ff9b8a" opacity=".45" />
    </svg>
  );
}
