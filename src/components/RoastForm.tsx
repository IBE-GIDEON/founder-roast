"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function RoastForm({ size = "lg" }: { size?: "lg" | "md" }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = url.trim();
    if (!value) {
      inputRef.current?.focus();
      setError("Paste your startup's URL first.");
      return;
    }
    if (!/\.[a-z]{2,}/i.test(value)) {
      setError("That doesn't look like a website address.");
      return;
    }
    setError(null);
    setBusy(true);
    router.push(`/roast?url=${encodeURIComponent(value)}`);
  }

  const big = size === "lg";

  return (
    <form onSubmit={submit} className="w-full" noValidate>
      <div className={`prompt-card relative rounded-2xl text-left ${big ? "p-4 sm:p-5" : "p-3.5 sm:p-4"}`}>
        <label htmlFor={`url-${size}`} className="sr-only">
          Your startup URL
        </label>
        <div className={`flex items-start gap-1 ${big ? "min-h-[72px]" : "min-h-[56px]"}`}>
          <span className={`select-none pt-[3px] text-faint ${big ? "text-[17px]" : "text-[15px]"}`}>https://</span>
          <input
            id={`url-${size}`}
            ref={inputRef}
            type="text"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck={false}
            value={url}
            onChange={(e) => setUrl(e.target.value.replace(/^https?:\/\//i, ""))}
            placeholder="yourstartup.com"
            className={`w-full bg-transparent pt-[2px] text-ink outline-none placeholder:text-faint/80 ${big ? "text-[17px]" : "text-[15px]"}`}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-muted">Free score · No signup</span>
          <button
            type="submit"
            disabled={busy}
            aria-label="Roast my startup"
            className="group flex h-10 items-center gap-2 rounded-full bg-ink pl-4 pr-1.5 text-[13.5px] font-medium text-white transition-transform hover:-translate-y-px disabled:opacity-80"
          >
            {busy ? "Starting…" : "Roast it"}
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 transition-transform group-hover:translate-x-0.5">
              {busy ? (
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/70 border-t-transparent" aria-hidden="true" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M2 7h9M7.5 3 11 7l-3.5 4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="rise mt-3 rounded-lg bg-white/85 px-4 py-2.5 text-left text-[13.5px] text-[#b42318] shadow-sm">
          {error}
        </p>
      )}
    </form>
  );
}
