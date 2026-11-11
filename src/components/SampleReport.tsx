import { Download, Share2 } from "lucide-react";
import { ScoreBar, ScoreRing } from "./ScoreRing";

/** Static, clearly-labelled sample of a report, shown inside a browser frame on the landing page. */
export function SampleReport() {
  return (
    <div className="frame mx-auto max-w-[1060px] rounded-[14px] p-[5px]">
      <div className="overflow-hidden rounded-[10px] bg-white">
        {/* window chrome */}
        <div className="flex items-center gap-3 border-b border-line bg-[#f7f8fa] px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff6159]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c941]" />
          </div>
          <div className="mx-auto flex w-full max-w-[420px] items-center justify-center gap-1.5 rounded-md bg-white px-3 py-1 text-[11.5px] text-muted ring-1 ring-line">
            <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z" />
            </svg>
            founderroast.com/r/sample
          </div>
          <span className="hidden rounded-full bg-sky-3/70 px-2.5 py-0.5 text-[11px] font-medium text-[#2c5fa8] sm:block">Sample roast</span>
        </div>

        <div className="grid gap-0 md:grid-cols-[1.05fr_1fr]">
          {/* left: free view */}
          <div className="border-b border-line p-5 sm:p-7 md:border-b-0 md:border-r">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#111827] text-[13px] font-bold text-white">Y</span>
              <div>
                <p className="text-[14px] font-semibold leading-tight text-ink">yourstartup.com</p>
                <p className="text-[12px] text-muted">AI meeting notes for remote sales teams</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-5">
              <ScoreRing score={58} size={118} stroke={9} />
              <div>
                <p className="text-[11.5px] font-semibold uppercase tracking-wider text-faint">Verdict</p>
                <p className="mt-1 text-[19px] font-semibold leading-snug tracking-[-0.02em] text-ink">Pretty, but who is it for?</p>
              </div>
            </div>
            <blockquote className="mt-6 rounded-xl bg-[#f7f8fa] p-4 text-[14.5px] leading-relaxed text-ink-2">
              “Your hero says <em>‘The future of productivity’</em>. So does every other tab I have open. Tell me what you actually do before I close this one too.”
            </blockquote>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[12.5px] font-medium text-white">
                <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.36 5.77L17.75 3Z" />
                </svg>
                Share roast
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium text-ink-2 ring-1 ring-line">
                <Share2 size={12} /> Copy link
              </span>
            </div>
          </div>

          {/* right: paid view */}
          <div className="p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-ink">Full report</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf3] px-2.5 py-0.5 text-[11.5px] font-medium text-[#067647]">
                <Download size={11} /> PDF ready
              </span>
            </div>
            <div className="mt-4 space-y-3.5">
              <ScoreBar label="Design" score={71} />
              <ScoreBar label="Trust" score={44} />
              <ScoreBar label="Positioning" score={49} />
              <ScoreBar label="Revenue potential" score={63} />
            </div>
            <p className="mt-6 text-[11.5px] font-semibold uppercase tracking-wider text-faint">Top growth moves</p>
            <ul className="mt-2.5 space-y-2">
              {[
                ["Name the customer in your H1", "High"],
                ["Put 3 testimonials beside the CTA", "High"],
                ["Show pricing on the homepage", "Med"],
              ].map(([t, i]) => (
                <li key={t} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 ring-1 ring-line">
                  <span className="text-[13px] text-ink-2">{t}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${i === "High" ? "bg-[#fff1eb] text-[#c2410c]" : "bg-[#eef4fd] text-[#2c5fa8]"}`}>
                    {i} impact
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-xl border border-dashed border-[#cfe0f7] bg-[#f5f9ff] p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2c5fa8]">Rewritten headline</p>
              <p className="mt-1 text-[15px] font-semibold leading-snug text-ink">Never take call notes again. Your CRM updates itself.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
