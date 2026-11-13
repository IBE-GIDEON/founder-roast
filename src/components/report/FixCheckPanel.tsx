import Link from "next/link";
import { BadgeCheck, RefreshCcw } from "lucide-react";
import type { RecheckSummary } from "@/lib/recheck";
import { RECHECK_LABEL, RECHECK_REFUND_LABEL } from "@/lib/site";
import { UnlockButton } from "./UnlockButton";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Owner-only: run a paid fix check, or see that the site is already up to date. */
export function FixCheckPanel({
  reportId,
  accessKey,
  findings,
  history,
}: {
  reportId: string;
  accessKey: string;
  findings: number;
  history: RecheckSummary[];
}) {
  const last = history[history.length - 1];

  if (last?.allClear) {
    return (
      <section className="flex flex-col justify-between gap-4 rounded-lg border border-[#abefc6] bg-[#f6fef9] px-6 py-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <BadgeCheck size={20} className="mt-0.5 shrink-0 text-[#079455]" aria-hidden="true" />
          <div>
            <p className="text-[15px] font-semibold text-[#054f31]">You&apos;re all done. Your landing page is up to date.</p>
            <p className="mt-0.5 text-[13px] text-[#067647]">
              Your fix check on {fmt(last.createdAt)} found nothing left to fix. No need for another roast.
            </p>
          </div>
        </div>
        <Link
          href={`/r/${reportId}/check/${last.id}`}
          className="inline-flex h-9 shrink-0 items-center rounded-md border border-[#abefc6] bg-white px-3.5 text-[13px] font-medium text-[#054f31] hover:bg-[#ecfdf3]"
        >
          View fix check
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-line bg-white">
      <div className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <RefreshCcw size={18} className="mt-0.5 shrink-0 text-faint" aria-hidden="true" />
          <div>
            <p className="text-[15px] font-semibold text-ink">Fixed things? Run a fix check.</p>
            <p className="mt-0.5 max-w-[560px] text-[13px] leading-relaxed text-muted">
              We re-check only the {findings} findings in this report. Nothing new gets added. If everything is fixed, you&apos;re marked up to date and we refund {RECHECK_REFUND_LABEL}.
            </p>
          </div>
        </div>
        <UnlockButton id={reportId} price={RECHECK_LABEL} kind="recheck" accessKey={accessKey} label={`Run fix check · ${RECHECK_LABEL}`} />
      </div>
      {history.length > 0 && (
        <ul className="divide-y divide-line border-t border-line">
          {history
            .slice()
            .reverse()
            .map((h) => (
              <li key={h.id}>
                <Link href={`/r/${reportId}/check/${h.id}`} className="flex items-center justify-between gap-4 px-6 py-3 text-[13px] hover:bg-[#fafbfc]">
                  <span className="text-ink-2">Fix check · {fmt(h.createdAt)}</span>
                  <span className="text-muted">
                    {h.fixed}/{h.total} fixed · <span className="font-medium text-ink">{h.overall}</span>/100
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}
