import { PRICE_LABEL, RECHECK_LABEL, RECHECK_REFUND_LABEL } from "@/lib/site";

const QA: [string, string][] = [
  ["What do I get for free?", "Your overall score out of 100, a one-line verdict and a shareable roast. No signup, no email."],
  [
    "What’s in the full report?",
    `A roast of the idea itself (problem, timing, money, moat, distribution), your blind spots, a teardown of the competitors who are winning, lessons from startups in your space that failed, the features they have that you don't, four page scores, a growth plan, a rewritten hero and a PDF. ${PRICE_LABEL}, one time.`,
  ],
  [
    "How does the AI judge my site?",
    "We read your homepage, pricing and about pages, identify your closest competitors and read their sites too, then judge every finding against real evidence. You watch each check happen live.",
  ],
  ["Is it actually a roast?", "Yes, but a useful one. We roast the page, never the people. Every jab comes with a fix."],
  [
    "I fixed things. Do I pay for a whole new roast?",
    `No. A fix check (${RECHECK_LABEL}) re-checks only the findings from your original roast. We never invent new problems. If everything is fixed, we mark you up to date and refund ${RECHECK_REFUND_LABEL} automatically.`,
  ],
  ["My site is built with JavaScript. Will it work?", "Usually, yes. If the raw HTML is empty we fall back to a rendered read of the page."],
  [
    "Can I get a refund?",
    "If your report fails to generate or is clearly broken, email us within 7 days and we’ll refund you in full.",
  ],
  [
    "Who can see my report?",
    "Anyone with the public link sees the free score. The full report lives at a private link that’s only shown after payment.",
  ],
];

export function Faq() {
  return (
    <div className="grid gap-10 md:grid-cols-[1fr_1.6fr]">
      <h2 className="text-[30px] font-semibold leading-[1.1] tracking-display sm:text-[34px]">Questions, answered.</h2>
      <div className="divide-y divide-line border-y border-line">
        {QA.map(([q, a]) => (
          <details key={q} className="group">
            <summary className="flex cursor-pointer items-center justify-between gap-6 py-4 text-[15px] font-medium text-ink">
              {q}
              <span className="faq-plus grid h-6 w-6 shrink-0 place-items-center text-faint transition-transform duration-200" aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
            </summary>
            <p className="-mt-1 pb-5 pr-10 text-[14.5px] leading-relaxed text-muted">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
