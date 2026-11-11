"use client";

import {
  BadgeCheck,
  DollarSign,
  Eye,
  Flame,
  Gauge,
  LayoutGrid,
  Lock,
  Megaphone,
  MessageSquare,
  MousePointerClick,
  PenLine,
  Quote,
  Rocket,
  Search,
  Smartphone,
  Star,
  Swords,
  Tag,
  Target,
  Type,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

const ITEMS: { title: string; body: string; tiles: number[] }[] = [
  { title: "Blind spots", body: "The things you stopped seeing.", tiles: [2, 8, 13, 17] },
  { title: "Competitor teardown", body: "You vs. your top rivals, side by side.", tiles: [3, 9, 14, 18] },
  { title: "Four scores", body: "Design, trust, positioning, revenue.", tiles: [0, 6, 10, 15] },
  { title: "Growth plan", body: "Ranked by impact. Ship the top three.", tiles: [4, 11, 16, 19] },
  { title: "Landing page rewrite", body: "A new hero you can paste today.", tiles: [1, 5, 7, 11] },
];

const TILES: { icon: LucideIcon; color: string }[] = [
  { icon: Type, color: "#f5b971" },
  { icon: PenLine, color: "#fcd34d" },
  { icon: Eye, color: "#67e8f9" },
  { icon: Swords, color: "#fca5a5" },
  { icon: Rocket, color: "#fda4af" },
  { icon: MousePointerClick, color: "#fda4af" },
  { icon: LayoutGrid, color: "#7dd3fc" },
  { icon: Quote, color: "#c4b5fd" },
  { icon: Search, color: "#93c5fd" },
  { icon: Target, color: "#fca5a5" },
  { icon: BadgeCheck, color: "#6ee7b7" },
  { icon: Megaphone, color: "#f9a8d4" },
  { icon: Flame, color: "#ffffff" }, // hero tile, centre of the grid
  { icon: Star, color: "#fde68a" },
  { icon: Users, color: "#fdba74" },
  { icon: Gauge, color: "#6ee7b7" },
  { icon: DollarSign, color: "#86efac" },
  { icon: Lock, color: "#c4b5fd" },
  { icon: MessageSquare, color: "#a5b4fc" },
  { icon: Tag, color: "#86efac" },
];
const HERO_TILE = 12;

export function FeaturePanel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((a) => (a + 1) % ITEMS.length), 3800);
    return () => clearInterval(t);
  }, [paused]);

  const lit = new Set(ITEMS[active].tiles);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-panel px-6 py-10 text-white sm:px-12 sm:py-14"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="pointer-events-none absolute -right-48 -top-48 h-[560px] w-[560px] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(95,151,227,.35), transparent 65%)" }}
        aria-hidden="true"
      />
      <div className="relative grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-white/40">The full report</p>
          <h2 className="mt-3 text-[30px] font-semibold leading-[1.08] tracking-display sm:text-[40px]">
            Everything your
            <br />
            page is hiding.
          </h2>

          <ul className="mt-10 border-t border-white/[0.08]">
            {ITEMS.map((it, i) => {
              const on = i === active;
              return (
                <li key={it.title} className="border-b border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    onFocus={() => setPaused(true)}
                    aria-expanded={on}
                    className="flex w-full items-baseline justify-between gap-6 py-4 text-left"
                  >
                    <span className={`text-[15px] font-medium transition-colors ${on ? "text-white" : "text-white/40 hover:text-white/70"}`}>{it.title}</span>
                    <span
                      className={`hidden text-right text-[13px] text-white/50 transition-opacity duration-300 sm:block ${on ? "opacity-100" : "opacity-0"}`}
                    >
                      {it.body}
                    </span>
                  </button>
                  <p className={`-mt-2 pb-4 text-[13px] text-white/50 sm:hidden ${on ? "block" : "hidden"}`}>{it.body}</p>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mx-auto grid w-full max-w-[420px] grid-cols-5 gap-2 sm:gap-2.5" aria-hidden="true">
          {TILES.map((t, i) => {
            const Icon = t.icon;
            const hero = i === HERO_TILE;
            const on = lit.has(i);
            return (
              <div key={i} className={`grid aspect-square place-items-center rounded-[10px] ${hero ? "tile-hero" : on ? "tile tile-on" : "tile"}`}>
                <Icon
                  size={hero ? 22 : 18}
                  strokeWidth={hero ? 2.2 : 1.7}
                  style={{ color: hero ? "#fff" : on ? t.color : "rgba(255,255,255,.22)", transition: "color .35s ease" }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
