import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Founder Roast: get your startup's landing page roasted by AI",
    template: "%s · Founder Roast",
  },
  description:
    "Paste your URL. AI scores your design, trust, positioning and revenue potential, then tells you exactly what to fix. Free overall score, full report with rewrite and PDF.",
  openGraph: {
    type: "website",
    siteName: "Founder Roast",
    title: "Get your startup roasted",
    description: "AI scores your landing page on design, trust, positioning and revenue potential. Free score in 45 seconds.",
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12.6 1.8c.4 2.9-1 4.6-2.5 6.3C8.5 9.9 7 11.6 7 14.4A5 5 0 0 0 12 19.5a5 5 0 0 0 5-5.1c0-1.7-.7-3-1.6-4.1-.2 1.3-.9 2.2-1.9 2.6.6-3.6-.4-7.9-.9-11.1Z' fill='%23ff5a1f'/></svg>",
  },
};

export const viewport: Viewport = {
  themeColor: "#6a9fe6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
