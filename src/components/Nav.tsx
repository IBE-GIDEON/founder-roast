import Link from "next/link";
import { Logo } from "./Brand";

const links = [
  { href: "/#how", label: "How it works" },
  { href: "/#report", label: "What you get" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function Nav() {
  return (
    <header className="relative z-20">
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <ul className="hidden items-center gap-6 md:flex">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[13.5px] font-medium text-ink/70 transition-colors hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/#sample" className="hidden rounded-full px-3 py-1.5 text-[13.5px] font-medium text-ink/75 hover:text-ink sm:block">
            Sample roast
          </Link>
          <Link
            href="/#roast"
            className="rounded-full bg-ink px-4 py-2 text-[13.5px] font-medium text-white shadow-[0_6px_16px_-6px_rgba(14,17,22,.6)] transition-transform hover:-translate-y-px"
          >
            Roast my site
          </Link>
        </div>
      </nav>
    </header>
  );
}
