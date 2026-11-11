import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getReport } from "@/lib/reports";
import { scoreColor, watermarkHost } from "@/lib/site";

export const runtime = "nodejs";

let fontsCache: { name: string; data: Buffer; weight: 400 | 600 | 800; style: "normal" }[] | null = null;
async function fonts() {
  if (fontsCache) return fontsCache;
  const dir = path.join(process.cwd(), "assets", "fonts");
  const load = async (w: 400 | 600 | 800) => ({ name: "Inter", data: await readFile(path.join(dir, `inter-${w}.woff`)), weight: w, style: "normal" as const });
  try {
    fontsCache = await Promise.all([load(400), load(600), load(800)]);
  } catch {
    fontsCache = [];
  }
  return fontsCache;
}

/** Cloud silhouette from overlapping discs with top-lit shading (the OG renderer has no blur filter). */
function Puff({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  // [left, top, diameter] as fractions of w / h
  const bumps: [number, number, number][] = [
    [0.0, 0.45, 0.32],
    [0.14, 0.18, 0.42],
    [0.36, 0.0, 0.5],
    [0.6, 0.22, 0.38],
    [0.76, 0.42, 0.3],
  ];
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, display: "flex", opacity: 0.92 }}>
      {bumps.map(([l, t, d], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: l * w,
            top: t * h,
            width: d * w,
            height: d * w,
            borderRadius: "50%",
            background: "linear-gradient(180deg, #ffffff 0%, #ffffff 55%, #e3ecf8 100%)",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: w * 0.04,
          top: h * 0.62,
          width: w * 0.94,
          height: h * 0.5,
          borderRadius: h,
          background: "linear-gradient(180deg, #ffffff 0%, #e8eff9 100%)",
        }}
      />
    </div>
  );
}

/** 1200×630 roast card: used as the og:image and as the downloadable image for X posts. Watermarked. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const r = await getReport(id);
  if (!r) return new Response("Not found", { status: 404 });

  const host = watermarkHost(req);
  const color = scoreColor(r.overall);
  const roast = r.roast.length > 170 ? r.roast.slice(0, 167).trimEnd() + "…" : r.roast;
  const download = new URL(req.url).searchParams.get("download") === "1";

  const img = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "linear-gradient(180deg, #6a9fe6 0%, #8cb8ef 45%, #c9ddf6 100%)",
          fontFamily: "Inter",
        }}
      >
        {/* soft clouds */}
        <Puff x={-90} y={470} w={480} h={230} />
        <Puff x={300} y={510} w={520} h={220} />
        <Puff x={760} y={455} w={520} h={250} />
        <Puff x={980} y={-70} w={300} h={150} />

        <div style={{ display: "flex", flexDirection: "column", padding: "56px 64px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 26, color: "rgba(14,17,22,0.7)", fontWeight: 600 }}>
            <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, background: "#ff5a1f", marginRight: 12 }} />
            {r.domain} got roasted
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 28,
              background: "rgba(255,255,255,0.97)",
              borderRadius: 32,
              padding: "40px 44px",
              boxShadow: "0 30px 60px -20px rgba(30,70,140,0.45)",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 230, marginRight: 40 }}>
              <div style={{ display: "flex", fontSize: 150, fontWeight: 800, color, lineHeight: 1, letterSpacing: -6 }}>{r.overall}</div>
              <div style={{ display: "flex", fontSize: 24, color: "#98a1b0", marginTop: 6 }}>out of 100</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1, borderLeft: "2px solid #e6e9ef", paddingLeft: 40 }}>
              <div style={{ display: "flex", fontSize: 38, fontWeight: 700, color: "#0e1116", letterSpacing: -1, lineHeight: 1.1 }}>{r.verdict}</div>
              <div style={{ display: "flex", fontSize: 26, color: "#30363f", marginTop: 18, lineHeight: 1.4 }}>“{roast}”</div>
            </div>
          </div>
        </div>

        {/* watermark */}
        <div
          style={{
            position: "absolute",
            right: 48,
            bottom: 36,
            display: "flex",
            alignItems: "center",
            background: "#0e1116",
            color: "white",
            fontSize: 24,
            fontWeight: 600,
            padding: "12px 22px",
            borderRadius: 999,
          }}
        >
          <div style={{ display: "flex", width: 12, height: 12, borderRadius: 6, background: "#ff5a1f", marginRight: 10 }} />
          Roast yours at {host}
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: await fonts() },
  );

  const headers = new Headers(img.headers);
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
  if (download) headers.set("Content-Disposition", `attachment; filename="roast-${r.domain}.png"`);
  return new Response(img.body, { status: 200, headers });
}
