import Link from "next/link";
import { Mascot } from "@/components/Brand";
import { Nav } from "@/components/Nav";

export default function NotFound() {
  return (
    <main className="sky-hero min-h-screen">
      <Nav />
      <div className="mx-auto max-w-[520px] px-4 pt-24 text-center">
        <Mascot size={64} className="float mx-auto" />
        <h1 className="mt-5 text-[36px] font-semibold tracking-display">Nothing to roast here.</h1>
        <p className="mt-3 text-[15px] text-ink/65">That page or report doesn&apos;t exist, or it drifted off with the clouds.</p>
        <Link href="/" className="mt-8 inline-block rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-white">
          Roast a site
        </Link>
      </div>
    </main>
  );
}
