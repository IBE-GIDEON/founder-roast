import Link from "next/link";
import { Logo } from "./Brand";
import { CONTACT_EMAIL, CONTACT_LABEL, X_HANDLE } from "@/lib/site";

export function Footer() {
  const cols: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
    {
      title: "Product",
      links: [
        { href: "/#roast", label: "Roast my site" },
        { href: "/#sample", label: "Sample roast" },
        { href: "/#report", label: "What you get" },
        { href: "/#pricing", label: "Pricing" },
      ],
    },
    {
      title: "Help",
      links: [
        { href: "/#faq", label: "FAQ" },
        ...(CONTACT_EMAIL ? [{ href: `mailto:${CONTACT_EMAIL}`, label: CONTACT_LABEL, external: true }] : []),
      ],
    },
    {
      title: "Legal",
      links: [
        { href: "/terms", label: "Terms & refunds" },
        { href: "/privacy", label: "Privacy" },
      ],
    },
  ];

  return (
    <footer className="mx-auto max-w-[1100px] px-4 pb-10 pt-20 sm:px-6">
      <div className="flex flex-col justify-between gap-12 md:flex-row">
        <div className="max-w-[260px]">
          <Logo />
          <p className="mt-3 text-[13.5px] leading-relaxed text-muted">Brutally honest, weirdly useful AI feedback on your startup&apos;s landing page.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-14 gap-y-8 sm:grid-cols-3">
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-[13px] font-semibold text-ink">{c.title}</p>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a href={l.href} className="text-[13.5px] text-muted hover:text-ink">
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="text-[13.5px] text-muted hover:text-ink">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-16 flex items-center justify-between border-t border-line pt-6 text-[12.5px] text-faint">
        <span>© {new Date().getFullYear()} Founder Roast</span>
        {X_HANDLE && (
          <a href={`https://x.com/${X_HANDLE}`} className="flex items-center gap-1.5 hover:text-ink" aria-label="Founder Roast on X">
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.36 5.77L17.75 3Zm-1.08 16.2h1.7L7.42 4.72H5.6l11.07 14.48Z" />
            </svg>
            @{X_HANDLE}
          </a>
        )}
      </div>
    </footer>
  );
}
