import { scoreColor } from "@/lib/site";

export function ScoreRing({
  score,
  size = 140,
  stroke = 10,
  label = "/ 100",
  track = "#eef1f5",
}: {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
  track?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const color = scoreColor(score);
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-semibold leading-none tracking-display text-ink" style={{ fontSize: size * 0.3 }}>
            {score}
          </div>
          <div className="mt-1 text-faint" style={{ fontSize: Math.max(10, size * 0.085) }}>
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScoreBar({ label, score, locked = false }: { label: string; score: number; locked?: boolean }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="font-medium text-ink-2">{label}</span>
        <span className={`font-semibold tabular-nums ${locked ? "locked" : ""}`} style={{ color: scoreColor(score) }}>
          {score}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eef1f5]">
        <div className={`h-full rounded-full ${locked ? "locked" : ""}`} style={{ width: `${score}%`, background: scoreColor(score) }} />
      </div>
    </div>
  );
}
