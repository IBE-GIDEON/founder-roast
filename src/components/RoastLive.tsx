"use client";

import { AlertTriangle, Check, CircleDashed, Info, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Level = "ok" | "warn" | "info";
type Ev =
  | { t: "meta"; domain: string; cached: boolean }
  | { t: "step"; text: string; detail?: string; level: Level }
  | { t: "market"; category: string; audience: string }
  | { t: "competitor"; domain: string; name: string; logo: string; status: "found" | "read" | "failed"; headline?: string }
  | { t: "done"; id: string; overall: number; href?: string }
  | { t: "error"; error: string };

type Line = { key: number; text: string; detail?: string; level: Level };
type Comp = { domain: string; name: string; logo: string; status: "found" | "read" | "failed"; headline?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EXPECTED_LINES = 22;

function prettyHost(raw: string) {
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname.replace(/^www\./, "");
  } catch {
    return raw;
  }
}

/** Live progress for a new roast (`url`) or a paid fix check (`check` token). */
export function RoastLive({ url = "", check }: { url?: string; check?: string }) {
  const router = useRouter();
  const isCheck = !!check;
  const [host, setHost] = useState(prettyHost(url));
  const [lines, setLines] = useState<Line[]>([]);
  const [comps, setComps] = useState<Comp[]>([]);
  const [market, setMarket] = useState<{ category: string; audience: string } | null>(null);
  const [finished, setFinished] = useState<{ id: string; overall: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [retry, setRetry] = useState(host);

  const queue = useRef<Ev[]>([]);
  const started = useRef(false);
  const cached = useRef(false);
  const streamEnded = useRef(false);
  const keyRef = useRef(0);
  const logRef = useRef<HTMLOListElement>(null);

  // 1. Fetch the stream once and buffer events.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const res = await fetch(check ? "/api/recheck" : "/api/roast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(check ? { token: check } : { url }),
        });
        if (!res.ok || !res.body) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          queue.current.push({ t: "error", error: j.error || "Something went wrong. Try again." });
          return;
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let sawEnd = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i: number;
          while ((i = buf.indexOf("\n")) >= 0) {
            const raw = buf.slice(0, i).trim();
            buf = buf.slice(i + 1);
            if (!raw) continue;
            const ev = JSON.parse(raw) as Ev;
            if (ev.t === "meta") {
              cached.current = ev.cached;
              setHost(ev.domain);
            }
            if (ev.t === "done" || ev.t === "error") sawEnd = true;
            queue.current.push(ev);
          }
        }
        if (!sawEnd) queue.current.push({ t: "error", error: "The connection dropped before your roast finished. Try again." });
      } catch {
        queue.current.push({ t: "error", error: "We couldn't reach the roaster. Check your connection and try again." });
      } finally {
        streamEnded.current = true;
      }
    })();
  }, [url, check]);

  // 2. Reveal events at a readable pace, like someone working through a checklist.
  useEffect(() => {
    let alive = true;
    (async () => {
      while (alive) {
        const ev = queue.current.shift();
        if (!ev) {
          await sleep(120);
          continue;
        }
        const fast = cached.current;
        if (ev.t === "step") {
          setLines((l) => [...l, { key: keyRef.current++, text: ev.text, detail: ev.detail, level: ev.level }]);
          await sleep(fast ? 380 : 1300 + Math.random() * 900);
        } else if (ev.t === "market") {
          setMarket({ category: ev.category, audience: ev.audience });
          await sleep(fast ? 150 : 450);
        } else if (ev.t === "competitor") {
          setComps((cs) => {
            const i = cs.findIndex((c) => c.domain === ev.domain);
            const next: Comp = { domain: ev.domain, name: ev.name, logo: ev.logo, status: ev.status, headline: ev.headline };
            if (i < 0) return [...cs, next];
            const copy = cs.slice();
            copy[i] = next;
            return copy;
          });
          await sleep(fast ? 120 : ev.status === "found" ? 420 : 650);
        } else if (ev.t === "done") {
          setFinished({ id: ev.id, overall: ev.overall });
          await sleep(1600);
          if (alive) router.replace(ev.href || `/r/${ev.id}`);
          return;
        } else if (ev.t === "error") {
          setError(ev.error);
          return;
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  // timer
  useEffect(() => {
    if (finished || error) return;
    const t0 = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 500);
    return () => clearInterval(id);
  }, [finished, error]);

  // keep the newest line in view
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  const progress = finished ? 100 : Math.min(94, Math.round((lines.length / (isCheck ? 24 : EXPECTED_LINES)) * 100));
  const tally = {
    fixed: lines.filter((l) => l.text.startsWith("Fixed:")).length,
    partial: lines.filter((l) => l.text.startsWith("Partly fixed:")).length,
    open: lines.filter((l) => l.text.startsWith("Still open:")).length,
  };
  const mm = String(Math.floor(elapsed / 60)).padStart(1, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[560px] rounded-xl border border-line bg-white p-6 shadow-[0_24px_60px_-30px_rgba(20,50,100,.35)] sm:p-8">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#fef3f2] text-[#d92d20]">
            <AlertTriangle size={16} />
          </span>
          <div>
            <h1 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">{isCheck ? "Your fix check stopped" : `We couldn't roast ${host}`}</h1>
            <p className="mt-1 text-[14px] leading-relaxed text-muted">{error}</p>
          </div>
        </div>
        {isCheck ? (
          <button onClick={() => window.location.reload()} className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-md bg-ink px-4 text-[13.5px] font-medium text-white">
            <RotateCcw size={14} /> Retry
          </button>
        ) : (
        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (retry.trim()) window.location.href = `/roast?url=${encodeURIComponent(retry.trim())}`;
          }}
        >
          <input
            value={retry}
            onChange={(e) => setRetry(e.target.value)}
            aria-label="Website to roast"
            className="h-10 w-full rounded-md border border-line px-3 text-[14px] outline-none focus:border-[#8dbaf0] focus:ring-2 focus:ring-[#cfe1f7]"
          />
          <button className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md bg-ink px-4 text-[13.5px] font-medium text-white">
            <RotateCcw size={14} /> Try again
          </button>
        </form>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[980px] overflow-hidden rounded-xl border border-line bg-white shadow-[0_30px_80px_-40px_rgba(20,50,100,.45)]">
      {/* header */}
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`} alt="" width={20} height={20} className="h-5 w-5 rounded-sm" referrerPolicy="no-referrer" />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-ink">
              {isCheck ? (finished ? `Fix check done: ${host}` : `Checking your fixes on ${host}`) : finished ? `Roast ready: ${host}` : `Roasting ${host}`}
            </p>
            <p className="truncate text-[12px] text-muted">
              {isCheck
                ? "Only your original findings are re-checked. Nothing new is added."
                : market
                  ? `${market.category}${market.audience ? ` · ${market.audience}` : ""}`
                  : "Reading your site the way a skeptical buyer would"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-[12.5px] tabular-nums text-muted">
            {mm}:{ss}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-medium ${finished ? "bg-[#ecfdf3] text-[#067647]" : "bg-[#eef4fd] text-[#2c5fa8]"}`}
          >
            {finished ? <Check size={12} /> : <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2c5fa8]" />}
            {finished ? `${finished.overall}/100` : "Working"}
          </span>
        </div>
      </div>
      <div className="h-[2px] bg-[#eef1f5]">
        <div className="h-full bg-ink transition-[width] duration-700 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="grid md:grid-cols-[1.45fr_1fr]">
        {/* live log */}
        <section className="border-b border-line md:border-b-0 md:border-r" aria-label="Live checks">
          <p className="px-5 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">Live checks</p>
          <ol ref={logRef} aria-live="polite" className="h-[380px] overflow-y-auto px-5 pb-5 sm:h-[440px]">
            {lines.map((l, i) => {
              const newest = i === lines.length - 1 && !finished;
              return (
                <li key={l.key} className="rise flex gap-3 border-b border-[#f1f3f6] py-2.5 last:border-b-0">
                  <span className="mt-[1px] grid h-[18px] w-[18px] shrink-0 place-items-center">
                    {newest ? (
                      <CircleDashed size={16} className="animate-spin text-[#5f97e3]" style={{ animationDuration: "1.6s" }} />
                    ) : l.level === "warn" ? (
                      <AlertTriangle size={15} className="text-[#dc6803]" />
                    ) : l.level === "info" ? (
                      <Info size={15} className="text-[#5f97e3]" />
                    ) : (
                      <Check size={16} className="text-[#16a34a]" strokeWidth={2.5} />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium text-ink">
                      {l.text}
                      {newest && <span className="text-faint">…</span>}
                    </p>
                    {l.detail && <p className="mt-0.5 break-words text-[12.5px] leading-relaxed text-muted">{l.detail}</p>}
                  </div>
                </li>
              );
            })}
            {finished && (
              <li className="rise flex gap-3 py-2.5">
                <span className="mt-[1px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-ink">
                  <Check size={11} className="text-white" strokeWidth={3} />
                </span>
                <p className="text-[13.5px] font-semibold text-ink">{isCheck ? "Fix check complete. Opening your results…" : "Roast ready. Opening your report…"}</p>
              </li>
            )}
            {!lines.length && (
              <li className="flex gap-3 py-2.5">
                <CircleDashed size={16} className="mt-[1px] animate-spin text-[#5f97e3]" style={{ animationDuration: "1.6s" }} />
                <p className="text-[13.5px] font-medium text-ink">
                  Connecting to {host}
                  <span className="text-faint">…</span>
                </p>
              </li>
            )}
          </ol>
        </section>

        {isCheck ? (
          <section aria-label="Fix tally" className="bg-[#fafbfc] p-5">
            <p className="pb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">Your findings</p>
            <dl className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
              {[
                ["Fixed", tally.fixed, "#12b76a"],
                ["Partly fixed", tally.partial, "#5f97e3"],
                ["Still open", tally.open, "#dc6803"],
              ].map(([label, n, color]) => (
                <div key={label as string} className="flex items-center justify-between px-4 py-3.5">
                  <dt className="flex items-center gap-2 text-[13.5px] text-ink-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: color as string }} />
                    {label}
                  </dt>
                  <dd className="font-mono text-[18px] font-semibold tabular-nums text-ink">{n as number}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[12.5px] leading-relaxed text-muted">If everything is fixed, we mark your site up to date and refund half your fix check automatically.</p>
          </section>
        ) : (
        <section aria-label="Competitors" className="bg-[#fafbfc]">
          <p className="px-5 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">Competitors</p>
          <ul className="space-y-2 px-5 pb-5">
            {comps.map((c) => (
              <li
                key={c.domain}
                className={`rise flex items-start gap-3 rounded-lg border border-line bg-white p-3 transition-opacity ${c.status === "failed" ? "opacity-45" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.logo} alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-md border border-line bg-white object-contain p-0.5" referrerPolicy="no-referrer" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13.5px] font-semibold text-ink">{c.name}</p>
                    <span className="shrink-0 font-mono text-[11px] text-faint">{c.domain}</span>
                  </div>
                  {c.status === "found" && (
                    <div className="mt-1.5 space-y-1">
                      <div className="shimmer h-2 w-11/12 rounded-sm" />
                      <div className="shimmer h-2 w-7/12 rounded-sm" />
                    </div>
                  )}
                  {c.status === "read" && c.headline && <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-muted">“{c.headline}”</p>}
                  {c.status === "failed" && <p className="mt-0.5 text-[12px] text-faint">Couldn&apos;t reach their site. Skipped.</p>}
                </div>
              </li>
            ))}
            {!comps.length &&
              [0, 1, 2].map((i) => (
                <li key={i} className="flex items-center gap-3 rounded-lg border border-dashed border-line p-3">
                  <div className="shimmer h-7 w-7 rounded-md" />
                  <div className="flex-1 space-y-1.5">
                    <div className="shimmer h-2.5 w-1/2 rounded-sm" />
                    <div className="shimmer h-2 w-3/4 rounded-sm" />
                  </div>
                </li>
              ))}
            {!comps.length && <p className="pt-1 text-[12px] text-faint">Competitors appear here once we&apos;ve mapped your market.</p>}
          </ul>
        </section>
        )}
      </div>
    </div>
  );
}
