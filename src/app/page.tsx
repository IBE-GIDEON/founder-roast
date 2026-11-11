import Link from "next/link";
import {
  BadgeCheck,
  Check,
  FileSearch,
  Gauge,
  Globe,
  MousePointerClick,
  Quote,
  Smartphone,
  Tag,
  Type,
  Wrench,
  ScanSearch,
  ClipboardPaste,
} from "lucide-react";
import { Mascot } from "@/components/Brand";
import { CloudBank, CloudField } from "@/components/Clouds";
import { Faq } from "@/components/Faq";
import { FeaturePanel } from "@/components/FeaturePanel";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { RoastForm } from "@/components/RoastForm";
import { SampleReport } from "@/components/SampleReport";
import { roastCount } from "@/lib/reports";
import { PRICE_LABEL, RECHECK_LABEL, RECHECK_REFUND_LABEL } from "@/lib/site";

export const revalidate = 300;

const SIGNALS = [
  { icon: Type, label: "Headline clarity" },
  { icon: MousePointerClick, label: "CTA strength" },
  { icon: Quote, label: "Social proof" },
  { icon: Tag, label: "Pricing" },
  { icon: Gauge, label: "Page weight" },
  { icon: BadgeCheck, label: "Trust signals" },
  { icon: Globe, label: "Meta & sharing" },
  { icon: Smartphone, label: "Mobile ready" },
];

const STEPS = [
  {
    icon: ClipboardPaste,
    title: "Paste your URL",
    body: "Any public landing page. No signup, no install, no ‘book a call’.",
  },
  {
    icon: ScanSearch,
    title: "We crawl and score it",
    body: "Homepage, pricing and about pages, read like a skeptical buyer would, in under a minute.",
  },
  {
    icon: Wrench,
    title: "Fix it and re-roast",
    body: "Ship the top fixes, run it again and post the before and after.",
  },
];

async function safeCount() {
  try {
    return await roastCount();
  } catch {
    return 0;
  }
}

export default async function Home() {
  const count = await safeCount();

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="sky-hero relative overflow-hidden">
        <Nav />
        <div className="relative z-10 mx-auto max-w-[660px] px-4 pb-[190px] pt-14 text-center sm:pb-[250px] sm:pt-20">
          <Mascot size={68} className="float mx-auto" />
          <h1 className="mt-5 text-[40px] font-semibold leading-[1.04] tracking-display text-ink sm:text-[58px]">
            Get your startup roasted.
          </h1>
          <p className="mx-auto mt-4 max-w-[500px] text-[16px] leading-relaxed text-ink/65 sm:text-[17px]">
            Paste your URL. AI tears apart your design, trust, positioning and revenue potential, then tells you exactly what to fix.
          </p>
          <div id="roast" className="mx-auto mt-8 max-w-[600px] scroll-mt-24">
            <RoastForm />
          </div>
        </div>
        <CloudBank id="hero-clouds" className="pointer-events-none absolute inset-x-0 bottom-0 h-[230px] w-full sm:h-[330px]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-bg" aria-hidden="true" />
      </section>

      {/* ── Product shot ─────────────────────────────────── */}
      <section id="sample" className="relative z-10 -mt-10 scroll-mt-10 px-4 sm:-mt-16 sm:px-6">
        <SampleReport />
      </section>

      {/* ── Signals strip (in place of a logo wall) ──────── */}
      <section className="mx-auto mt-20 max-w-[1100px] px-4 sm:px-6">
        <div className="grid items-center gap-10 border-y border-line py-10 md:grid-cols-[1.6fr_1fr]">
          <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
            {SIGNALS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-ink/45">
                <Icon size={18} strokeWidth={2} aria-hidden="true" />
                <span className="text-[14.5px] font-semibold tracking-[-0.01em]">{label}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[19px] font-semibold leading-snug tracking-[-0.02em] text-ink">
              40+ signals checked on every roast, across your homepage, pricing and about pages.
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">Built on what actually moves conversion, not on vibes.</p>
            <Link href="#report" className="mt-4 inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] font-medium text-ink ring-1 ring-line transition hover:bg-white">
              What you get
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section id="how" className="mx-auto max-w-[1100px] scroll-mt-10 px-4 py-24 sm:px-6 sm:py-32">
        <div className="max-w-[560px]">
          <p className="text-[13px] font-semibold text-[#2c5fa8]">How it works</p>
          <h2 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-display sm:text-[42px]">
            Five seconds is all a visitor gives you. We use forty-five.
          </h2>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="rounded-xl bg-white p-6 shadow-[0_1px_0_rgba(14,17,22,.04),0_12px_32px_-18px_rgba(30,60,110,.25)] ring-1 ring-line">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef4fd] text-[#2c5fa8]">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <span className="text-[13px] font-semibold tabular-nums text-faint">0{i + 1}</span>
              </div>
              <h3 className="mt-6 text-[18px] font-semibold tracking-[-0.02em]">{title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cloud band ───────────────────────────────────── */}
      <section className="sky-band relative h-[360px] overflow-hidden sm:h-[440px]" aria-label="Interlude">
        <CloudField
          id="band-clouds"
          preserve="xMidYMid slice"
          width={1600}
          height={440}
          className="drift absolute inset-0 h-full w-[calc(100%+60px)]"
          clusters={[
            { x: 90, y: 150, w: 380, h: 150, seed: 11, puffs: 7 },
            { x: 1540, y: 120, w: 380, h: 140, seed: 15, puffs: 6 },
            { x: 230, y: 440, w: 640, h: 210, seed: 16, puffs: 9 },
            { x: 800, y: 500, w: 760, h: 200, seed: 17, puffs: 10 },
            { x: 1380, y: 430, w: 660, h: 220, seed: 14, puffs: 9 },
          ]}
        />
        <div className="relative z-10 grid h-full place-items-start px-6 pt-[70px] text-center sm:pt-[90px]">
          <p className="mx-auto max-w-[720px] text-[26px] font-semibold leading-[1.15] tracking-display text-white drop-shadow-[0_2px_18px_rgba(30,70,140,.45)] sm:text-[38px]">
            Most startups don&apos;t have a product problem. They have a landing page problem.
          </p>
        </div>
      </section>

      {/* ── Feature panel ────────────────────────────────── */}
      <section id="report" className="mx-auto max-w-[1100px] scroll-mt-10 px-4 py-24 sm:px-6 sm:py-32">
        <FeaturePanel />
      </section>

      {/* ── Pricing ──────────────────────────────────────── */}
      <section id="pricing" className="mx-auto max-w-[1100px] scroll-mt-10 px-4 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1fr_1.6fr]">
          <div>
            <h2 className="text-[30px] font-semibold leading-[1.1] tracking-display sm:text-[38px]">
              Free to roast.
              <br />
              Cheap to fix.
            </h2>
            <p className="mt-4 max-w-[340px] text-[15px] leading-relaxed text-muted">
              One payment, no subscription. Cheaper than one hour with a conversion consultant, and faster.
            </p>
            {count >= 25 && (
              <div className="mt-10">
                <p className="text-[44px] font-semibold leading-none tracking-display">{count.toLocaleString()}+</p>
                <p className="mt-2 text-[13.5px] text-muted">startups roasted so far</p>
              </div>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col rounded-xl bg-white p-6 ring-1 ring-line">
              <p className="text-[14px] font-semibold text-ink">Free roast</p>
              <p className="mt-3 text-[40px] font-semibold leading-none tracking-display">$0</p>
              <ul className="mt-6 flex-1 space-y-2.5 text-[14px] text-ink-2">
                {["Overall score out of 100", "One-line verdict", "Shareable roast for X", "No signup"].map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-faint" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="#roast" className="mt-8 rounded-full px-4 py-2.5 text-center text-[14px] font-medium text-ink ring-1 ring-line transition hover:bg-bg">
                Roast my site
              </Link>
            </div>
            <div className="relative flex flex-col overflow-hidden rounded-xl bg-ink p-6 text-white">
              <div
                className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-60 blur-2xl"
                style={{ background: "radial-gradient(circle, rgba(141,186,240,.45), transparent 65%)" }}
                aria-hidden="true"
              />
              <div className="relative flex items-center justify-between">
                <p className="text-[14px] font-semibold">Full report</p>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11.5px] font-medium text-white/80">Recommended</span>
              </div>
              <p className="relative mt-3 text-[40px] font-semibold leading-none tracking-display">
                {PRICE_LABEL}
                <span className="ml-1.5 text-[14px] font-normal text-white/50">one time</span>
              </p>
              <ul className="relative mt-6 flex-1 space-y-2.5 text-[14px] text-white/85">
                {[
                  "Your blind spots, with evidence",
                  "Teardown vs your top competitors",
                  "4 scores with every issue and fix",
                  "Growth plan and rewritten hero",
                  "Branded PDF for your team",
                ].map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-sky-2" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="#roast" className="relative mt-8 rounded-full bg-white px-4 py-2.5 text-center text-[14px] font-medium text-ink transition hover:bg-white/90">
                Start with a free roast
              </Link>
            </div>
            <div className="flex flex-col justify-between gap-2 rounded-xl border border-line bg-white px-6 py-4 sm:col-span-2 sm:flex-row sm:items-center">
              <p className="text-[14px] font-semibold text-ink">
                Fix check <span className="font-normal text-muted">· {RECHECK_LABEL}</span>
              </p>
              <p className="text-[13.5px] text-muted">Re-checks only your original findings. All fixed? {RECHECK_REFUND_LABEL} back.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1100px] px-4 py-24 sm:px-6 sm:py-32">
        <div className="grid gap-10 md:grid-cols-3">
          {[
            ["~45s", "from URL to score"],
            ["40+", "signals checked per roast"],
            ["6", "sections in every full report"],
          ].map(([n, l]) => (
            <div key={l} className="border-t border-line pt-6">
              <p className="text-[48px] font-semibold leading-none tracking-display">{n}</p>
              <p className="mt-2 text-[14px] text-muted">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section id="faq" className="mx-auto max-w-[1100px] scroll-mt-10 px-4 sm:px-6">
        <Faq />
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="mx-auto max-w-[1100px] px-4 pt-24 sm:px-6 sm:pt-32">
        <div className="sky-card relative overflow-hidden rounded-2xl px-5 pb-[140px] pt-14 text-center sm:pb-[170px] sm:pt-20">
          <div className="relative z-10 mx-auto max-w-[560px]">
            <Mascot size={56} className="float mx-auto" />
            <h2 className="mt-4 text-[32px] font-semibold leading-[1.08] tracking-display text-ink sm:text-[44px]">Ready to get roasted?</h2>
            <p className="mx-auto mt-3 max-w-[420px] text-[15px] text-ink/65">Your free score is about 45 seconds away.</p>
            <div className="mt-7">
              <RoastForm size="md" />
            </div>
          </div>
          <CloudBank id="cta-clouds" seed={21} className="pointer-events-none absolute inset-x-0 bottom-0 h-[170px] w-full sm:h-[230px]" />
        </div>
      </section>

      <Footer />
    </main>
  );
}
