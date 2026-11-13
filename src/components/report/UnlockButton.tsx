"use client";

import { Lock, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const EMAIL_KEY = "fr_email";

export function UnlockButton({
  id,
  price,
  variant = "dark",
  label,
  className = "",
  kind = "report",
  accessKey,
}: {
  id: string;
  price: string;
  variant?: "dark" | "light";
  label?: string;
  className?: string;
  kind?: "report" | "recheck";
  accessKey?: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    try {
      setEmail((e) => e || localStorage.getItem(EMAIL_KEY) || "");
    } catch {}
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && !busy && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy]);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setError("Enter a valid email.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      try {
        localStorage.setItem(EMAIL_KEY, value);
      } catch {}
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, kind, k: accessKey, email: value }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Couldn't start checkout.");
      window.location.href = data.url;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const styles = variant === "dark" ? "bg-ink text-white hover:bg-[#1f242c]" : "bg-white text-ink hover:bg-white/90";
  const title = kind === "recheck" ? "Run a fix check" : "Unlock the full report";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex h-9 items-center justify-center gap-2 rounded-md px-3.5 text-[13px] font-medium transition-colors ${styles} ${className}`}
      >
        {kind === "report" && <Lock size={13} aria-hidden="true" />}
        {label || `Unlock full report · ${price}`}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-labelledby={`pay-${id}-${kind}`} onMouseDown={(e) => e.target === e.currentTarget && !busy && setOpen(false)}>
          <form onSubmit={pay} className="w-full max-w-[400px] rounded-lg border border-line bg-white p-6 text-left shadow-[0_24px_60px_-20px_rgba(14,17,22,.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={`pay-${id}-${kind}`} className="text-[16px] font-semibold text-ink">
                  {title}
                </h2>
                <p className="mt-0.5 text-[13px] text-muted">{price}, one-time payment.</p>
              </div>
              <button type="button" onClick={() => !busy && setOpen(false)} aria-label="Close" className="rounded-md p-1 text-faint hover:bg-[#f2f4f7] hover:text-ink">
                <X size={16} />
              </button>
            </div>
            <label htmlFor={`email-${id}-${kind}`} className="mt-5 block text-[12.5px] font-medium text-ink-2">
              Email
            </label>
            <input
              id={`email-${id}-${kind}`}
              ref={inputRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@startup.com"
              className="mt-1.5 h-10 w-full rounded-md border border-line px-3 text-[14px] text-ink outline-none focus:border-[#8dbaf0] focus:ring-2 focus:ring-[#cfe1f7]"
            />
            <p className="mt-1.5 text-[12px] text-faint">Your receipt and private link go here.</p>
            {error && (
              <p role="alert" className="mt-3 rounded-md bg-[#fef3f2] px-3 py-2 text-[12.5px] text-[#b42318]">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-ink text-[13.5px] font-medium text-white hover:bg-[#1f242c] disabled:opacity-70"
            >
              {busy && <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/70 border-t-transparent" aria-hidden="true" />}
              {busy ? "Opening secure checkout…" : `Pay ${price}`}
            </button>
            <p className="mt-3 text-center text-[11.5px] text-faint">Secure payment by Paystack</p>
          </form>
        </div>
      )}
    </>
  );
}
