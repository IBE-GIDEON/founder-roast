import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  Check,
  CheckCircle2,
  Columns3,
  Lightbulb,
  Minus,
  Skull,
  Download,
  Eye,
  FileText,
  Gauge,
  Info,
  LayoutDashboard,
  ListChecks,
  Lock,
  PenLine,
  Rocket,
  Swords,
  XCircle,
} from "lucide-react";
import { Logo } from "@/components/Brand";
import { ScoreRing } from "@/components/ScoreRing";
import { scoreColor } from "@/lib/site";
import { SCORE_KEYS, SCORE_META, type FreeReport, type Report } from "@/lib/types";
import { CopyButton, ShareBar } from "./ShareBar";
import { UnlockButton } from "./UnlockButton";

type Props = {
  free: FreeReport;
  full: Report | null;
  price: string;
  shareUrl: string;
  tweet: string;
  cardUrl: string;
  pdfUrl?: string;
  privateUrl?: string;
  notice?: React.ReactNode;
  /** Owner-only fix check panel. */
  fixCheck?: React.ReactNode;
  /** Set when the site passed its last fix check. */
  upToDateSince?: string;
};

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, paid: false },
  { id: "blind-spots", label: "Blind spots", icon: Eye, paid: true },
  { id: "idea", label: "The idea", icon: Lightbulb, paid: true },
  { id: "competitors", label: "Competitors", icon: Swords, paid: true },
  { id: "page-vs-page", label: "Page vs page", icon: Columns3, paid: false },
  { id: "features", label: "Features", icon: Boxes, paid: true },
  { id: "graveyard", label: "Graveyard", icon: Skull, paid: true },
  { id: "scores", label: "Scores", icon: Gauge, paid: true },
  { id: "growth", label: "Growth plan", icon: Rocket, paid: true },
  { id: "rewrite", label: "Rewrite", icon: PenLine, paid: true },
  { id: "checks", label: "What we checked", icon: ListChecks, paid: false },
];

const impactStyle = {
  high: "bg-[#fef3f2] text-[#b42318] ring-[#fecdca]",
  medium: "bg-[#eff8ff] text-[#175cd3] ring-[#b2ddff]",
  low: "bg-[#f2f4f7] text-[#344054] ring-[#e4e7ec]",
} as const;

function SectionHead({ id, title, meta, locked }: { id: string; title: string; meta?: string; locked?: boolean }) {
  return (
    <div id={id} className="flex scroll-mt-20 items-end justify-between gap-4 pb-3">
      <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-ink">{title}</h2>
      {(meta || locked) && (
        <span className="flex items-center gap-1.5 text-[12.5px] text-muted">
          {locked && <Lock size={12} aria-hidden="true" />}
          {meta}
        </span>
      )}
    </div>
  );
}

/** Blurred stand-in for paid content. Contains no real report data. */
function Locked({ id, price, rows = 3, label }: { id: string; price: string; rows?: number; label: string }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-white">
      <div className="divide-y divide-line" aria-hidden="true">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-4">
            <div className="shimmer h-3 w-6 rounded-sm" />
            <div className="flex-1 space-y-2">
              <div className="shimmer h-3 rounded-sm" style={{ width: `${62 - i * 9}%` }} />
              <div className="shimmer h-2.5 rounded-sm" style={{ width: `${88 - i * 6}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 grid place-items-center bg-white/55 backdrop-blur-[1.5px]">
        <div className="flex flex-col items-center gap-2.5 px-4 text-center">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
            <Lock size={13} aria-hidden="true" /> {label}
          </p>
          <UnlockButton id={id} price={price} label={`Unlock · ${price}`} />
        </div>
      </div>
    </div>
  );
}

export function ReportView({ free, full, price, shareUrl, tweet, cardUrl, pdfUrl, privateUrl, notice, fixCheck, upToDateSince }: Props) {
  const unlocked = !!full;
  const date = new Date(free.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const compNames = free.competitors.map((c) => c.name);
  // Only list sections that exist for this report.
  const present: Record<string, boolean> = {
    idea: free.teasers.hasIdea,
    "page-vs-page": !!free.selfSignals && free.competitors.some((c) => c.signals),
    features: free.teasers.gaps > 0 || !!full?.features,
    graveyard: free.teasers.graveyard > 0,
  };
  const nav = NAV.filter((n) => present[n.id] ?? true);

  return (
    <div className="min-h-screen bg-bg">
      {/* app header */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5 text-[13.5px]">
            <Logo />
            <span className="hidden text-faint sm:inline">/</span>
            <span className="hidden text-muted sm:inline">Reports</span>
            <span className="hidden text-faint sm:inline">/</span>
            <span className="hidden truncate font-medium text-ink sm:inline">{free.domain}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/#roast" className="hidden h-9 items-center rounded-md border border-line bg-white px-3 text-[13px] font-medium text-ink-2 hover:bg-[#f7f8fa] sm:inline-flex">
              New roast
            </Link>
            {unlocked && pdfUrl ? (
              <a href={pdfUrl} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-ink px-3.5 text-[13px] font-medium text-white hover:bg-[#1f242c]">
                <Download size={14} /> Download PDF
              </a>
            ) : (
              <UnlockButton id={free.id} price={price} />
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[196px_1fr] lg:py-10">
        {/* sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24" aria-label="Report sections">
            <ul className="space-y-0.5">
              {nav.map(({ id, label, icon: Icon, paid }) => (
                <li key={id}>
                  <a href={`#${id}`} className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13.5px] text-ink-2 transition-colors hover:bg-white hover:text-ink">
                    <Icon size={15} className="text-faint" aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    {paid && !unlocked && <Lock size={12} className="text-faint" aria-label="Locked" />}
                  </a>
                </li>
              ))}
            </ul>
            <dl className="mt-8 space-y-3 border-t border-line pt-5 text-[12.5px]">
              <div>
                <dt className="text-faint">Roasted</dt>
                <dd className="mt-0.5 text-ink-2">{date}</dd>
              </div>
              <div>
                <dt className="text-faint">Pages read</dt>
                <dd className="mt-0.5 text-ink-2">{free.site.pagesCrawled.length}</dd>
              </div>
              <div>
                <dt className="text-faint">Checks run</dt>
                <dd className="mt-0.5 text-ink-2">{free.trace.length}</dd>
              </div>
              {free.mode === "demo" && (
                <div>
                  <dt className="text-faint">Engine</dt>
                  <dd className="mt-0.5 text-[#b54708]">Demo (no AI key)</dd>
                </div>
              )}
            </dl>
          </nav>
        </aside>

        <main className="min-w-0 space-y-12">
          {notice}

          {/* ── Overview ─────────────────────────── */}
          <section aria-labelledby="overview-title">
            <div id="overview" className="scroll-mt-20 overflow-hidden rounded-lg border border-line bg-white">
              <div className="flex flex-col gap-8 p-6 sm:p-8 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(free.domain)}&sz=64`} alt="" width={16} height={16} className="h-4 w-4 rounded-sm" referrerPolicy="no-referrer" />
                    <a href={free.url} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-ink hover:underline">
                      {free.domain}
                    </a>
                    {free.category && <span className="rounded-md bg-[#f2f4f7] px-2 py-0.5 text-[12px] text-ink-2">{free.category}</span>}
                    {upToDateSince && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#ecfdf3] px-2 py-0.5 text-[12px] font-medium text-[#067647]">
                        <Check size={12} strokeWidth={2.5} aria-hidden="true" /> Up to date since {upToDateSince}
                      </span>
                    )}
                  </div>
                  <h1 id="overview-title" className="mt-3 text-[26px] font-semibold leading-tight tracking-display text-ink sm:text-[32px]">
                    {free.verdict}
                  </h1>
                  <p className="mt-1.5 text-[14px] text-muted">{free.oneLiner}</p>
                  <blockquote className="mt-5 border-l-2 border-ink pl-4 text-[15px] leading-relaxed text-ink-2">{free.roast}</blockquote>
                </div>
                <div className="flex shrink-0 justify-center md:w-[180px] md:border-l md:border-line md:pl-8">
                  <ScoreRing score={free.overall} size={136} stroke={8} label="overall" />
                </div>
              </div>

              <dl className={`grid grid-cols-2 divide-line border-t border-line sm:divide-x ${free.teasers.hasIdea ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
                {[
                  ...(free.teasers.hasIdea ? [{ key: "idea", label: "Idea", score: full?.idea?.score }] : []),
                  ...SCORE_KEYS.map((k) => ({ key: k, label: SCORE_META[k].label, score: full?.scores[k].score })),
                ].map((m, i) => (
                  <div key={m.key} className={`px-6 py-4 ${i % 2 ? "border-l border-line sm:border-l-0" : ""} ${i >= 2 ? "border-t border-line sm:border-t-0" : ""}`}>
                    <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">{m.label}</dt>
                    <dd className="mt-1.5 flex items-baseline gap-1">
                      {typeof m.score === "number" ? (
                        <>
                          <span className="text-[24px] font-semibold tabular-nums tracking-[-0.02em]" style={{ color: scoreColor(m.score) }}>
                            {m.score}
                          </span>
                          <span className="text-[12px] text-faint">/100</span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[14px] text-faint">
                          <Lock size={13} aria-hidden="true" /> Locked
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-[#fafbfc] px-6 py-3">
                <span className="text-[12.5px] text-muted">Share this roast</span>
                <ShareBar shareUrl={shareUrl} tweet={tweet} cardUrl={cardUrl} />
              </div>
            </div>

            {!unlocked && (
              <div className="mt-4 flex flex-col justify-between gap-4 rounded-lg bg-ink px-6 py-5 text-white sm:flex-row sm:items-center">
                <div>
                  <p className="text-[15px] font-semibold">
                    {free.blindSpotCount ? `${free.blindSpotCount} blind spots found on ${free.domain}.` : `Your full report on ${free.domain} is ready.`}
                  </p>
                  <p className="mt-0.5 text-[13px] text-white/60">
                    {[
                      free.teasers.hasIdea ? "An idea roast" : null,
                      compNames.length ? `teardown vs ${compNames.join(", ")}` : null,
                      free.teasers.gaps ? `${free.teasers.gaps} feature gaps` : null,
                      free.teasers.graveyard ? `${free.teasers.graveyard} failed startups to learn from` : null,
                      "scores, a growth plan and a rewritten hero",
                    ]
                      .filter(Boolean)
                      .join(", ")
                      .replace(/^./, (c) => c.toUpperCase())}
                    . PDF included.
                  </p>
                </div>
                <UnlockButton id={free.id} price={price} variant="light" />
              </div>
            )}

            {unlocked && privateUrl && (
              <div className="mt-4 flex flex-col justify-between gap-3 rounded-lg border border-line bg-white px-5 py-4 sm:flex-row sm:items-center">
                <p className="text-[13px] text-muted">
                  <span className="font-medium text-ink">Full report unlocked.</span> Bookmark this page; its link is private.
                </p>
                <CopyButton text={privateUrl} label="Copy private link" />
              </div>
            )}
            {unlocked && fixCheck && <div className="mt-4">{fixCheck}</div>}
          </section>

          {/* ── Blind spots ──────────────────────── */}
          <section>
            <SectionHead id="blind-spots" title="Blind spots" meta={free.blindSpotCount ? `${free.blindSpotCount} found` : undefined} locked={!unlocked} />
            {full && full.blindSpots.length ? (
              <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
                {full.blindSpots.map((b, i) => (
                  <li key={b.title} className="grid gap-4 px-5 py-5 sm:grid-cols-[40px_1fr]">
                    <span className="font-mono text-[12.5px] text-faint">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="text-[15.5px] font-semibold tracking-[-0.01em] text-ink">{b.title}</p>
                      <div className="mt-3 grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Evidence</p>
                          <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{b.evidence}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Fix</p>
                          <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{b.fix}</p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : !unlocked && free.blindSpotTeaser ? (
              <div className="overflow-hidden rounded-lg border border-line bg-white">
                <div className="grid gap-4 px-5 py-5 sm:grid-cols-[40px_1fr]">
                  <span className="font-mono text-[12.5px] text-faint">01</span>
                  <div>
                    <p className="text-[15.5px] font-semibold tracking-[-0.01em] text-ink">{free.blindSpotTeaser}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
                      <Lock size={12} aria-hidden="true" /> Evidence and fix are in the full report.
                    </p>
                  </div>
                </div>
                <div className="border-t border-line">
                  <Locked id={free.id} price={price} rows={Math.max(1, free.blindSpotCount - 1)} label={`${Math.max(1, free.blindSpotCount - 1)} more blind spots`} />
                </div>
              </div>
            ) : (
              <p className="text-[13.5px] text-muted">No blind spots recorded for this roast.</p>
            )}
          </section>

          {/* ── The idea ─────────────────────────── */}
          {free.teasers.hasIdea && (
            <section>
              <SectionHead id="idea" title="The idea" meta="Problem · timing · money · moat · distribution" locked={!unlocked} />
              {full?.idea ? (
                <div className="overflow-hidden rounded-lg border border-line bg-white">
                  <div className="flex items-start justify-between gap-6 px-5 py-5">
                    <div>
                      <p className="text-[15.5px] font-semibold tracking-[-0.01em] text-ink">{full.idea.verdict}</p>
                      <p className="mt-1 max-w-[620px] text-[13.5px] leading-relaxed text-muted">{full.idea.summary}</p>
                    </div>
                    <span className="shrink-0 text-[28px] font-semibold leading-none tabular-nums tracking-[-0.02em]" style={{ color: scoreColor(full.idea.score) }}>
                      {full.idea.score}
                    </span>
                  </div>
                  <dl className="grid border-t border-line sm:grid-cols-2">
                    {(
                      [
                        ["Problem", full.idea.problem],
                        ["Timing", full.idea.timing],
                        ["Money", full.idea.money],
                        ["Moat", full.idea.moat],
                        ["Distribution", full.idea.distribution],
                      ] as const
                    )
                      .filter(([, v]) => v)
                      .map(([k, v], i) => (
                        <div key={k} className={`border-line px-5 py-4 ${i ? "border-t" : ""} ${i === 1 ? "sm:border-t-0" : ""} ${i % 2 ? "sm:border-l" : ""}`}>
                          <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">{k}</dt>
                          <dd className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{v}</dd>
                        </div>
                      ))}
                  </dl>
                  {full.idea.hardQuestion && (
                    <div className="border-t border-line bg-[#fafbfc] px-5 py-4">
                      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">The question an investor will ask</p>
                      <p className="mt-1 border-l-2 border-ink pl-3 text-[14px] font-medium text-ink">{full.idea.hardQuestion}</p>
                    </div>
                  )}
                  {full.idea.risks.length > 0 && (
                    <ul className="space-y-1.5 border-t border-line px-5 py-4">
                      {full.idea.risks.map((r) => (
                        <li key={r} className="flex gap-2 text-[13px] leading-relaxed text-muted">
                          <AlertTriangle size={14} className="mt-[3px] shrink-0 text-[#dc6803]" aria-hidden="true" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Locked id={free.id} price={price} rows={3} label="Idea score, the hard question and top risks" />
              )}
            </section>
          )}

          {/* ── Competitors ──────────────────────── */}
          <section>
            <SectionHead id="competitors" title="Competitors" meta={free.competitors.length ? `${free.competitors.length} compared` : undefined} locked={!unlocked} />
            {free.competitors.length ? (
              <div className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
                {free.competitors.map((c) => {
                  const insight = full?.comparison.find((x) => x.domain === c.domain);
                  return (
                    <div key={c.domain} className="px-5 py-5">
                      <div className="flex items-start gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.logo} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-md border border-line bg-white object-contain p-0.5" referrerPolicy="no-referrer" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <p className="text-[14.5px] font-semibold text-ink">{c.name}</p>
                            <a href={`https://${c.domain}`} target="_blank" rel="noopener noreferrer nofollow" className="font-mono text-[12px] text-faint hover:text-ink">
                              {c.domain}
                            </a>
                          </div>
                          <p className="mt-0.5 text-[13.5px] text-muted">Their headline: “{c.headline}”</p>
                        </div>
                      </div>
                      {insight ? (
                        <dl className={`mt-4 grid gap-px overflow-hidden rounded-md border border-line bg-line ${insight.whyWinning ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
                          {[
                            ...(insight.whyWinning ? [["Why they're winning", insight.whyWinning]] : []),
                            ["They do better", insight.theyDoBetter],
                            ["Where you win", insight.youDoBetter],
                            ["Steal this", insight.steal],
                          ].map(([k, v]) => (
                            <div key={k} className="bg-white p-3.5">
                              <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">{k}</dt>
                              <dd className="mt-1 text-[13px] leading-relaxed text-ink-2">{v}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : !unlocked ? (
                        <div className="mt-4 grid gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-3" aria-hidden="true">
                          {["They do better", "Where you win", "Steal this"].map((k) => (
                            <div key={k} className="bg-white p-3.5">
                              <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.08em] text-faint">
                                <Lock size={10} /> {k}
                              </p>
                              <div className="mt-2 space-y-1.5">
                                <div className="shimmer h-2.5 w-11/12 rounded-sm" />
                                <div className="shimmer h-2.5 w-8/12 rounded-sm" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-lg border border-line bg-white px-5 py-4 text-[13.5px] text-muted">We couldn&apos;t confidently identify and read competitors for this site.</p>
            )}
          </section>

          {/* ── Page vs page (free: objective facts read off each site) ── */}
          {free.selfSignals && free.competitors.some((c) => c.signals) && (
            <section>
              <SectionHead id="page-vs-page" title="Page vs page" meta="Read straight off each homepage" />
              <div className="overflow-x-auto rounded-lg border border-line bg-white">
                <table className="w-full min-w-[640px] text-left text-[13px]">
                  <thead className="border-b border-line bg-[#fafbfc] text-[11px] font-medium uppercase tracking-[0.08em] text-faint">
                    <tr>
                      <th className="px-5 py-2.5 font-medium">Site</th>
                      <th className="px-4 py-2.5 font-medium">Prices shown</th>
                      <th className="px-4 py-2.5 font-medium">Free plan or trial</th>
                      <th className="px-4 py-2.5 font-medium">Proof on page</th>
                      <th className="px-4 py-2.5 font-medium">Main button</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {[
                      { name: "You", domain: free.domain, s: free.selfSignals, you: true },
                      ...free.competitors.filter((c) => c.signals).map((c) => ({ name: c.name, domain: c.domain, s: c.signals!, you: false })),
                    ].map((row) => (
                      <tr key={row.domain} className={row.you ? "bg-[#f7f9fc]" : ""}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(row.domain)}&sz=64`} alt="" width={16} height={16} className="h-4 w-4 rounded-sm" referrerPolicy="no-referrer" />
                            <span className="font-medium text-ink">{row.name}</span>
                            {row.you && <span className="font-mono text-[11px] text-faint">{row.domain}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-2">{row.s.pricing[0] || (row.s.hasPricingPage ? "On pricing page" : <Minus size={14} className="text-faint" aria-label="No" />)}</td>
                        <td className="px-4 py-3">{row.s.freeOffer ? <Check size={15} strokeWidth={2.5} className="text-[#12b76a]" aria-label="Yes" /> : <Minus size={14} className="text-faint" aria-label="No" />}</td>
                        <td className="px-4 py-3 tabular-nums text-ink-2">{row.s.proof ? `${row.s.proof} signals` : <Minus size={14} className="text-faint" aria-label="None" />}</td>
                        <td className="max-w-[180px] truncate px-4 py-3 text-ink-2">{row.s.primaryCta ? `“${row.s.primaryCta}”` : <Minus size={14} className="text-faint" aria-label="None" />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ── Features ─────────────────────────── */}
          {(free.teasers.gaps > 0 || full?.features) && (
            <section>
              <SectionHead id="features" title="Features" meta={free.teasers.gaps ? `${free.teasers.gaps} gaps vs competitors` : undefined} locked={!unlocked} />
              {full?.features ? (
                <div className="overflow-hidden rounded-lg border border-line bg-white">
                  <div className="px-5 py-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">What you offer</p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {full.features.yours.map((f) => (
                        <li key={f} className="rounded-md border border-line px-2 py-0.5 text-[12.5px] text-ink-2">
                          {f}
                        </li>
                      ))}
                    </ul>
                    {full.features.unique.length > 0 && (
                      <p className="mt-3 text-[12.5px] text-muted">
                        <span className="font-medium text-ink">Only you:</span> {full.features.unique.join(", ")}
                      </p>
                    )}
                  </div>
                  {full.features.gaps.length > 0 && (
                    <table className="w-full border-t border-line text-left text-[13px]">
                      <thead className="border-b border-line bg-[#fafbfc] text-[11px] font-medium uppercase tracking-[0.08em] text-faint">
                        <tr>
                          <th className="px-5 py-2.5 font-medium">They have, you don&apos;t</th>
                          <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Who</th>
                          <th className="px-4 py-2.5 font-medium">Why it matters</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {full.features.gaps.map((g) => (
                          <tr key={g.feature}>
                            <td className="px-5 py-3 font-medium text-ink">
                              {g.feature}
                              <span className="mt-0.5 block text-[12px] font-normal text-faint sm:hidden">{g.who.join(", ")}</span>
                            </td>
                            <td className="hidden px-4 py-3 text-ink-2 sm:table-cell">{g.who.join(", ")}</td>
                            <td className="px-4 py-3 text-muted">{g.why}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                <Locked id={free.id} price={price} rows={3} label={`${free.teasers.gaps} features they have that you don't`} />
              )}
            </section>
          )}

          {/* ── Graveyard ────────────────────────── */}
          {(free.teasers.graveyard > 0 || (full?.graveyard?.length ?? 0) > 0) && (
            <section>
              <SectionHead id="graveyard" title="Graveyard" meta={`${free.teasers.graveyard} startups that didn't make it`} locked={!unlocked} />
              {full?.graveyard?.length ? (
                <>
                  <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
                    {full.graveyard.map((g) => (
                      <li key={g.name} className="px-5 py-4">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <p className="text-[14.5px] font-semibold text-ink">{g.name}</p>
                          {g.years && <span className="font-mono text-[12px] text-faint">{g.years}</span>}
                        </div>
                        <p className="mt-0.5 text-[13px] text-muted">{g.what}</p>
                        <dl className="mt-3 grid gap-4 md:grid-cols-2">
                          <div>
                            <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">What went wrong</dt>
                            <dd className="mt-1 text-[13px] leading-relaxed text-ink-2">{g.whyFailed}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Don&apos;t repeat it</dt>
                            <dd className="mt-1 text-[13px] leading-relaxed text-ink-2">{g.lesson}</dd>
                          </div>
                        </dl>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-[12px] text-faint">Based on public reporting about these companies. Verify before citing.</p>
                </>
              ) : (
                <Locked id={free.id} price={price} rows={2} label={`${free.teasers.graveyard} failed startups and what killed them`} />
              )}
            </section>
          )}

          {/* ── Scores ───────────────────────────── */}
          <section>
            <SectionHead id="scores" title="Scores" meta="Design · Trust · Positioning · Revenue" locked={!unlocked} />
            {full ? (
              <div className="grid gap-4 md:grid-cols-2">
                {SCORE_KEYS.map((k) => {
                  const s = full.scores[k];
                  return (
                    <article key={k} className="rounded-lg border border-line bg-white p-5">
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-[14.5px] font-semibold text-ink">{SCORE_META[k].label}</h3>
                        <span className="text-[22px] font-semibold tabular-nums tracking-[-0.02em]" style={{ color: scoreColor(s.score) }}>
                          {s.score}
                        </span>
                      </div>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#eef1f5]">
                        <div className="h-full" style={{ width: `${s.score}%`, background: scoreColor(s.score) }} />
                      </div>
                      <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">{s.summary}</p>
                      <ul className="mt-4 space-y-2 border-t border-line pt-4">
                        {s.issues.map((t) => (
                          <li key={t} className="flex gap-2 text-[13px] leading-relaxed text-muted">
                            <XCircle size={14} className="mt-[3px] shrink-0 text-[#f04438]" aria-hidden="true" />
                            {t}
                          </li>
                        ))}
                        {s.fixes.map((t) => (
                          <li key={t} className="flex gap-2 text-[13px] leading-relaxed text-ink-2">
                            <CheckCircle2 size={14} className="mt-[3px] shrink-0 text-[#12b76a]" aria-hidden="true" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </div>
            ) : (
              <Locked id={free.id} price={price} rows={4} label="Four scores with every issue and fix" />
            )}
          </section>

          {/* ── Growth plan ──────────────────────── */}
          <section>
            <SectionHead id="growth" title="Growth plan" meta="Ranked by impact" locked={!unlocked} />
            {full ? (
              <div className="overflow-hidden rounded-lg border border-line bg-white">
                <div className="hidden grid-cols-[40px_1fr_90px_90px] gap-4 border-b border-line bg-[#fafbfc] px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-faint sm:grid">
                  <span>#</span>
                  <span>Move</span>
                  <span>Impact</span>
                  <span>Effort</span>
                </div>
                <ol className="divide-y divide-line">
                  {full.growth.map((g, i) => (
                    <li key={g.title} className="grid gap-x-4 gap-y-2 px-5 py-4 sm:grid-cols-[40px_1fr_90px_90px]">
                      <span className="hidden font-mono text-[12.5px] text-faint sm:block">{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <p className="text-[14px] font-semibold text-ink">{g.title}</p>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{g.detail}</p>
                      </div>
                      <span className="self-start">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[11.5px] font-medium capitalize ring-1 ring-inset ${impactStyle[g.impact]}`}>{g.impact}</span>
                      </span>
                      <span className="self-start text-[12.5px] capitalize text-muted">{g.effort}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <Locked id={free.id} price={price} rows={4} label="5 to 7 moves, ranked by impact" />
            )}
          </section>

          {/* ── Rewrite ──────────────────────────── */}
          <section>
            <SectionHead id="rewrite" title="Landing page rewrite" meta={full ? undefined : "Hero, CTAs, value props"} locked={!unlocked} />
            {full ? (
              <div className="overflow-hidden rounded-lg border border-line bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-line bg-[#fafbfc] px-4 py-2.5">
                  <div className="flex gap-1.5" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#e4e7ec]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#e4e7ec]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#e4e7ec]" />
                  </div>
                  <span className="truncate font-mono text-[11.5px] text-faint">{free.domain} · proposed hero</span>
                  <CopyButton
                    label="Copy copy"
                    text={[
                      full.rewrite.headline,
                      full.rewrite.subheadline,
                      `Primary CTA: ${full.rewrite.primaryCta}`,
                      `Secondary CTA: ${full.rewrite.secondaryCta}`,
                      full.rewrite.proofLine,
                      ...full.rewrite.valueProps.map((v) => `${v.title}: ${v.body}`),
                      full.rewrite.closingLine,
                    ].join("\n\n")}
                  />
                </div>
                <div className="px-6 py-12 text-center sm:px-12">
                  <p className="mx-auto max-w-[640px] text-[28px] font-semibold leading-[1.1] tracking-display text-ink sm:text-[38px]">{full.rewrite.headline}</p>
                  <p className="mx-auto mt-4 max-w-[540px] text-[15px] leading-relaxed text-muted">{full.rewrite.subheadline}</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <span className="rounded-md bg-ink px-4 py-2 text-[13.5px] font-medium text-white">{full.rewrite.primaryCta}</span>
                    <span className="rounded-md border border-line px-4 py-2 text-[13.5px] font-medium text-ink">{full.rewrite.secondaryCta}</span>
                  </div>
                  <p className="mt-4 text-[12.5px] text-faint">{full.rewrite.proofLine}</p>
                </div>
                <div className="grid border-t border-line sm:grid-cols-3">
                  {full.rewrite.valueProps.map((v, i) => (
                    <div key={v.title} className={`p-5 ${i ? "border-t border-line sm:border-l sm:border-t-0" : ""}`}>
                      <p className="text-[14px] font-semibold text-ink">{v.title}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted">{v.body}</p>
                    </div>
                  ))}
                </div>
                <p className="border-t border-line bg-[#fafbfc] px-6 py-4 text-center text-[14px] font-medium text-ink">{full.rewrite.closingLine}</p>
              </div>
            ) : (
              <Locked id={free.id} price={price} rows={3} label="A new hero you can paste today" />
            )}
          </section>

          {/* ── What we checked (free: proof of work) ── */}
          <section>
            <SectionHead id="checks" title="What we checked" meta={`${free.trace.length} checks · ${free.site.pagesCrawled.length} pages`} />
            {free.trace.length ? (
              <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
                {free.trace.map((l, i) => (
                  <li key={i} className="grid grid-cols-[20px_1fr] gap-3 px-5 py-3 sm:grid-cols-[20px_minmax(0,0.9fr)_minmax(0,1.3fr)]">
                    <span className="mt-[2px]">
                      {l.level === "warn" ? (
                        <AlertTriangle size={14} className="text-[#dc6803]" aria-label="Warning" />
                      ) : l.level === "info" ? (
                        <Info size={14} className="text-[#5f97e3]" aria-label="Info" />
                      ) : (
                        <Check size={15} className="text-[#12b76a]" strokeWidth={2.5} aria-label="Passed" />
                      )}
                    </span>
                    <span className="text-[13px] font-medium text-ink">{l.text}</span>
                    {l.detail && <span className="col-start-2 break-words text-[12.5px] text-muted sm:col-start-3">{l.detail}</span>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[13.5px] text-muted">This roast was created before check logs were recorded.</p>
            )}
          </section>

          {!unlocked && (
            <section className="flex flex-col items-start justify-between gap-4 rounded-lg border border-line bg-white px-6 py-5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <FileText size={18} className="mt-0.5 text-faint" aria-hidden="true" />
                <div>
                  <p className="text-[14.5px] font-semibold text-ink">Get the full report</p>
                  <p className="text-[13px] text-muted">Blind spots, competitor teardown, scores, growth plan, rewrite and a PDF. One-time {price}.</p>
                </div>
              </div>
              <UnlockButton id={free.id} price={price} />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
