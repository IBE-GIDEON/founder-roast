"use client";

import { Check, Download, Link2 } from "lucide-react";
import { useState } from "react";

const btn = "inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-white px-2.5 text-[12.5px] font-medium text-ink-2 transition-colors hover:bg-[#f7f8fa]";

export function ShareBar({ shareUrl, tweet, cardUrl }: { shareUrl: string; tweet: string; cardUrl: string }) {
  const [copied, setCopied] = useState(false);
  const intent = `https://x.com/intent/post?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="flex flex-wrap gap-1.5">
      <a href={intent} target="_blank" rel="noopener noreferrer" className={btn}>
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.36 5.77L17.75 3Z" />
        </svg>
        Post
      </a>
      <button
        type="button"
        className={btn}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {}
        }}
      >
        {copied ? <Check size={13} className="text-[#16a34a]" /> : <Link2 size={13} />}
        {copied ? "Copied" : "Copy link"}
      </button>
      <a href={`${cardUrl}?download=1`} className={btn}>
        <Download size={13} /> Card
      </a>
    </div>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={btn}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {}
      }}
    >
      {copied ? <Check size={13} className="text-[#16a34a]" /> : <Link2 size={13} />}
      {copied ? "Copied" : label}
    </button>
  );
}
