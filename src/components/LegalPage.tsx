import { Footer } from "./Footer";
import { Nav } from "./Nav";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main>
      <section className="sky-hero">
        <Nav />
        <div className="mx-auto max-w-[720px] px-4 pb-16 pt-12 sm:px-6">
          <h1 className="text-[36px] font-semibold tracking-display sm:text-[44px]">{title}</h1>
          <p className="mt-2 text-[14px] text-ink/60">Last updated {updated}</p>
        </div>
      </section>
      <article className="mx-auto max-w-[720px] space-y-5 px-4 pt-8 text-[15px] leading-relaxed text-ink-2 sm:px-6 [&_h2]:mt-10 [&_h2]:text-[19px] [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-ink [&_a]:underline">
        {children}
      </article>
      <Footer />
    </main>
  );
}
