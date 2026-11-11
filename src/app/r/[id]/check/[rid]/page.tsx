import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, BadgeCheck, CheckCircle2, CircleDot } from "lucide-react";
import { accessCookieName, isValidKey } from "@/lib/access";
import { getRecheck } from "@/lib/recheck";
import { getReport } from "@/lib/reports";
import { scoreColor } from "@/lib/site";
import { SCORE_KEYS, SCORE_META } from "@/lib/types";
import { Logo } from "@/components/Brand";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Fix check", robots: { index: false } };

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function FixCheckPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; rid: string }>;
  searchParams: Promise<{ k?: string }>;
}) {
  const { id, rid } = await params;
  const { k } = await searchParams;
  const [report, rc] = await Promise.all([getReport(id), getRecheck(rid)]);
  if (!report || !rc || rc.reportId !== id) notFound();

  const key = k || (await cookies()).get(accessCookieName(id))?.value;
  if (!isValidKey(id, key)) notFound();

  const fixed = rc.items.filter((i) => i.status === "fixed");
  const partial = rc.items.filter((i) => i.status === "partial");
  const open = rc.items.filter((i) => i.status === "open");
  const refunded = rc.refund.status === "refunded" || rc.refund.status === "simulated";
  const ordered = [...open, ...partial, ...fixed];

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[960px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5 text-[13.5px]">
            <Logo />
            <span className="hidden text-faint sm:inline">/</span>
            <Link href={`/r/${id}`} className="hidden truncate text-muted hover:text-ink sm:inline">
              {report.domain}
            </Link>
            <span className="hidden text-faint sm:inline">/</span>
            <span className="hidden font-medium text-ink sm:inline">Fix check</span>
          </div>
          <Link href={`/r/${id}`} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-white px-3 text-[13px] font-medium text-ink-2 hover:bg-[#f7f8fa]">
            <ArrowLeft size={14} /> Back to report
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[960px] space-y-8 px-4 py-10 sm:px-6">
        {rc.allClear ? (
          <section className="overflow-hidden rounded-lg border border-[#abefc6] bg-white">
            <div className="flex flex-col gap-6 bg-[#f6fef9] p-6 sm:flex-row sm:items-center sm:p-8">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#dcfae6]">
                <BadgeCheck size={26} className="text-[#079455]" aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-[26px] font-semibold tracking-display text-[#054f31] sm:text-[30px]">You&apos;re all done. No more fixes needed.</h1>
                <p className="mt-1.5 text-[14.5px] text-[#067647]">
                  Every finding from your {fmt(rc.baselineDate)} roast is resolved. {report.domain} is up to date. There&apos;s no need for another roast.
                </p>
              </div>
            </div>
            <div className="border-t border-[#abefc6] px-6 py-4 text-[13.5px] text-ink-2 sm:px-8">
              {refunded ? (
                <>
                  We&apos;ve refunded <span className="font-semibold">${(rc.refund.amount / 100).toFixed(2)}</span>, half your fix check, to your original payment method
                  {rc.refund.status === "simulated" ? " (simulated in development)" : ""}. Refunds usually land in 5 to 10 business days.
                </>
              ) : (
                <>Your half refund (${(rc.refund.amount / 100).toFixed(2)}) needs a manual review. We&apos;ll process it and email you.</>
              )}
            </div>
          </section>
        ) : (
          <section className="rounded-lg border border-line bg-white p-6 sm:p-8">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-faint">Fix check · {fmt(rc.createdAt)}</p>
            <h1 className="mt-2 text-[26px] font-semibold tracking-display text-ink sm:text-[30px]">
              {fixed.length} of {rc.items.length} fixed. {open.length + partial.length} to go.
            </h1>
            <p className="mt-1.5 text-[14.5px] text-muted">
              We only re-checked the findings from your original roast. Close the remaining items and run another fix check to get marked up to date.
            </p>
          </section>
        )}

        {/* score change */}
        <section className="overflow-hidden rounded-lg border border-line bg-white">
          <div className="grid grid-cols-2 sm:grid-cols-5">
            <div className="col-span-2 border-b border-line px-6 py-5 sm:col-span-1 sm:border-b-0 sm:border-r">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Overall</p>
              <p className="mt-1.5 flex items-baseline gap-2">
                <span className="text-[13px] tabular-nums text-faint line-through">{rc.before.overall}</span>
                <span className="text-[26px] font-semibold tabular-nums tracking-[-0.02em]" style={{ color: scoreColor(rc.after.overall) }}>
                  {rc.after.overall}
                </span>
              </p>
            </div>
            {SCORE_KEYS.map((k, i) => (
              <div key={k} className={`px-6 py-5 ${i % 2 ? "border-l border-line" : ""} ${i >= 2 ? "border-t border-line sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`}>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">{SCORE_META[k].label}</p>
                <p className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-[12px] tabular-nums text-faint">{rc.before.scores[k]}</span>
                  <span className="text-[20px] font-semibold tabular-nums" style={{ color: scoreColor(rc.after.scores[k]) }}>
                    {rc.after.scores[k]}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* checklist */}
        <section>
          <div className="flex items-end justify-between pb-3">
            <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-ink">Your findings</h2>
            <span className="text-[12.5px] text-muted">
              {fixed.length} fixed · {partial.length} partly · {open.length} open
            </span>
          </div>
          <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
            {ordered.map((it) => (
              <li key={it.id} className="grid grid-cols-[22px_1fr] gap-3 px-5 py-4 sm:grid-cols-[22px_1fr_120px]">
                <span className="mt-[2px]">
                  {it.status === "fixed" ? (
                    <CheckCircle2 size={17} className="text-[#12b76a]" aria-label="Fixed" />
                  ) : it.status === "partial" ? (
                    <CircleDot size={17} className="text-[#5f97e3]" aria-label="Partly fixed" />
                  ) : (
                    <AlertTriangle size={16} className="text-[#dc6803]" aria-label="Still open" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className={`text-[14px] font-medium ${it.status === "fixed" ? "text-ink-2" : "text-ink"}`}>{it.text}</p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{it.evidence}</p>
                </div>
                <span className="col-start-2 text-[12px] text-faint sm:col-start-3 sm:text-right">{it.group}</span>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <Footer />
    </div>
  );
}
