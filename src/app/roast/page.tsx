import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CloudBank } from "@/components/Clouds";
import { Nav } from "@/components/Nav";
import { RoastLive } from "@/components/RoastLive";

export const metadata: Metadata = { title: "Roasting…", robots: { index: false } };

export default async function RoastPage({ searchParams }: { searchParams: Promise<{ url?: string; check?: string }> }) {
  const { url, check } = await searchParams;
  if (!url?.trim() && !check) redirect("/#roast");

  return (
    <main className="sky-hero relative min-h-screen overflow-hidden">
      <Nav />
      <div className="relative z-10 px-4 pb-40 pt-8 sm:px-6 sm:pt-12">
        {check ? <RoastLive check={check} /> : <RoastLive url={url!.trim()} />}
        <p className="mx-auto mt-5 max-w-[520px] text-center text-[13px] text-ink/55">
          {check
            ? "We re-read your site and verify each finding from your original roast. Nothing new is added."
            : "We read your homepage, pricing and about pages, find your competitors and read theirs too. This takes about a minute."}
        </p>
      </div>
      <CloudBank id="roast-clouds" seed={5} className="pointer-events-none absolute inset-x-0 bottom-0 h-[200px] w-full sm:h-[280px]" />
    </main>
  );
}
