/**
 * Procedural, photo-like clouds drawn in SVG: puffs with radial shading,
 * roughened by fractal-noise displacement. Fully original artwork, no image assets.
 */

export type Cluster = {
  x: number; // centre x in viewBox units
  y: number; // centre y
  w: number; // width
  h: number; // height
  puffs?: number;
  seed?: number;
  opacity?: number;
};

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Puff = { cx: number; cy: number; rx: number; ry: number };

function puffsFor(c: Cluster, i: number): { body: Puff[]; tops: Puff[] } {
  const r = rng((c.seed ?? 7) * 997 + i * 131);
  const n = c.puffs ?? 9;
  const body: Puff[] = [];
  const tops: Puff[] = [];
  for (let k = 0; k < n; k++) {
    const t = n === 1 ? 0.5 : k / (n - 1);
    const off = t * 2 - 1;
    const dome = 1 - off * off;
    const rad = (c.h * 0.26 + c.h * 0.36 * dome) * (0.82 + r() * 0.36);
    body.push({
      cx: c.x + off * c.w * 0.42 + (r() - 0.5) * c.w * 0.06,
      cy: c.y + c.h * 0.22 - c.h * 0.42 * dome * (0.75 + r() * 0.3),
      rx: rad * (1.15 + r() * 0.3),
      ry: rad,
    });
    if (dome > 0.45 && r() > 0.35) {
      const tr = rad * (0.45 + r() * 0.25);
      tops.push({ cx: c.x + off * c.w * 0.4 + (r() - 0.5) * c.w * 0.08, cy: c.y - c.h * 0.32 * dome, rx: tr * 1.2, ry: tr });
    }
  }
  // flat base so clouds sit on an invisible horizon
  body.push({ cx: c.x, cy: c.y + c.h * 0.3, rx: c.w * 0.5, ry: c.h * 0.2 });
  return { body, tops };
}

export function CloudField({
  id,
  clusters,
  width = 1600,
  height = 420,
  className,
  displacement = 70,
  preserve = "xMidYMax slice",
  tint = "#c9d8ee",
}: {
  id: string;
  clusters: Cluster[];
  width?: number;
  height?: number;
  className?: string;
  displacement?: number;
  preserve?: string;
  tint?: string;
}) {
  const shapes = clusters.map((c, i) => ({ c, ...puffsFor(c, i) }));
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={preserve}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`${id}-puff`} cx="0.45" cy="0.32" r="0.72" fx="0.42" fy="0.22">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#fbfcfe" />
          <stop offset="0.82" stopColor="#e9f0f9" />
          <stop offset="1" stopColor={tint} />
        </radialGradient>
        <radialGradient id={`${id}-top`} cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-rough`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={width + 400} height={height + 400}>
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed={(clusters[0]?.seed ?? 3) + 1} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={displacement} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="2.2" />
        </filter>
        <filter id={`${id}-soft`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={width + 400} height={height + 400}>
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed={(clusters[0]?.seed ?? 3) + 9} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={displacement * 0.8} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="10" />
        </filter>
        <filter id={`${id}-shadow`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={width + 400} height={height + 400}>
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>

      {shapes.map(({ c, body, tops }, i) => (
        <g key={i} opacity={c.opacity ?? 1}>
          {/* soft blue shadow under the cloud */}
          <g filter={`url(#${id}-shadow)`} opacity="0.35">
            <ellipse cx={c.x} cy={c.y + c.h * 0.35} rx={c.w * 0.5} ry={c.h * 0.22} fill="#5d84bf" />
          </g>
          {/* wispy halo */}
          <g filter={`url(#${id}-soft)`} opacity="0.75">
            {body.map((p, k) => (
              <ellipse key={k} cx={p.cx} cy={p.cy} rx={p.rx * 1.08} ry={p.ry * 1.08} fill="#ffffff" />
            ))}
          </g>
          {/* body */}
          <g filter={`url(#${id}-rough)`}>
            {body.map((p, k) => (
              <ellipse key={k} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill={`url(#${id}-puff)`} />
            ))}
          </g>
          {/* sunlit tops */}
          <g filter={`url(#${id}-soft)`} opacity="0.9">
            {tops.map((p, k) => (
              <ellipse key={k} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill={`url(#${id}-top)`} />
            ))}
          </g>
        </g>
      ))}
    </svg>
  );
}

/** Row of clouds sitting on the bottom edge of a section. */
export function CloudBank({ id, className, seed = 3 }: { id: string; className?: string; seed?: number }) {
  const clusters: Cluster[] = [
    { x: 120, y: 330, w: 520, h: 210, seed, puffs: 8 },
    { x: 560, y: 360, w: 460, h: 170, seed: seed + 1, puffs: 7, opacity: 0.95 },
    { x: 1000, y: 345, w: 560, h: 200, seed: seed + 2, puffs: 9 },
    { x: 1460, y: 320, w: 540, h: 230, seed: seed + 3, puffs: 8 },
    { x: 790, y: 410, w: 900, h: 160, seed: seed + 4, puffs: 10 },
  ];
  return <CloudField id={id} clusters={clusters} width={1600} height={440} className={className} />;
}
