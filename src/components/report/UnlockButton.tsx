"use client";

import { Lock } from "lucide-react";
import { useState } from "react";

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, kind, k: accessKey }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Couldn't start checkout.");
      window.location.href = data.url;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const styles =
    variant === "dark"
      ? "bg-ink text-white hover:bg-[#1f242c]"
      : "bg-white text-ink hover:bg-white/90";

  return (
    <span className="inline-flex flex-col items-stretch">
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className={`inline-flex h-9 items-center justify-center gap-2 rounded-md px-3.5 text-[13px] font-medium transition-colors disabled:opacity-70 ${styles} ${className}`}
      >
        {busy ? (
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70" aria-hidden="true" />
        ) : kind === "report" ? (
          <Lock size={13} aria-hidden="true" />
        ) : null}
        {busy ? "Opening checkout…" : label || `Unlock full report · ${price}`}
      </button>
      {error && (
        <span role="alert" className="mt-1.5 text-[12px] text-[#d92d20]">
          {error}
        </span>
      )}
    </span>
  );
}
