import "server-only";
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { SCORE_KEYS, SCORE_META, type Report } from "./types";
import { scoreColor, SITE_NAME } from "./site";

// Never split words with hyphens.
Font.registerHyphenationCallback((word) => [word]);

const ink = "#0e1116";
const muted = "#5b6474";
const line = "#e6e9ef";
const sky = "#4f8fe6";

const s = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 64, paddingHorizontal: 48, fontFamily: "Helvetica", fontSize: 10.5, color: ink, lineHeight: 1.5 },
  cover: { padding: 0, fontFamily: "Helvetica", color: ink },
  coverSky: { backgroundColor: "#8fb9ef", height: 330, paddingHorizontal: 48, paddingTop: 56, position: "relative" },
  brand: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 0.4 },
  coverTitle: { fontSize: 30, fontFamily: "Helvetica-Bold", color: "#ffffff", marginTop: 60, lineHeight: 1.15 },
  coverSub: { fontSize: 12, color: "#eef4fd", marginTop: 10 },
  scoreCard: { marginHorizontal: 48, marginTop: -70, backgroundColor: "#ffffff", borderRadius: 14, padding: 28, borderWidth: 1, borderColor: line, flexDirection: "row", alignItems: "center" },
  bigScore: { fontSize: 64, fontFamily: "Helvetica-Bold", lineHeight: 1 },
  bigScoreOf: { fontSize: 14, color: muted, marginTop: 4 },
  verdict: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  roast: { fontSize: 11.5, color: "#30363f", fontFamily: "Helvetica-Oblique", lineHeight: 1.5 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: 48, marginTop: 24, gap: 10 },
  gridItem: { width: "48.5%", borderWidth: 1, borderColor: line, borderRadius: 10, padding: 14 },
  gridLabel: { fontSize: 9, color: muted, textTransform: "uppercase", letterSpacing: 0.8 },
  gridScore: { fontSize: 24, fontFamily: "Helvetica-Bold", marginTop: 4 },
  bar: { height: 4, backgroundColor: "#eef1f5", borderRadius: 2, marginTop: 8 },
  h2: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  h3: { fontSize: 12.5, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 6 },
  eyebrow: { fontSize: 9, color: sky, fontFamily: "Helvetica-Bold", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 },
  p: { color: "#30363f", marginBottom: 6 },
  bullet: { flexDirection: "row", marginBottom: 5 },
  dot: { width: 14, color: muted },
  section: { marginBottom: 26 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderBottomWidth: 1, borderBottomColor: line, paddingBottom: 8, marginBottom: 10 },
  pill: { fontSize: 8.5, paddingVertical: 2, paddingHorizontal: 7, borderRadius: 8, backgroundColor: "#eef4fd", color: "#2c5fa8", marginLeft: 6 },
  growth: { borderWidth: 1, borderColor: line, borderRadius: 10, padding: 14, marginBottom: 10 },
  rewriteBox: { borderWidth: 1, borderColor: "#cfe0f7", backgroundColor: "#f5f9ff", borderRadius: 12, padding: 22, marginTop: 8 },
  rwHeadline: { fontSize: 22, fontFamily: "Helvetica-Bold", lineHeight: 1.2 },
  rwSub: { fontSize: 12, color: "#3b4250", marginTop: 8 },
  rwCtas: { flexDirection: "row", marginTop: 14, gap: 8 },
  ctaDark: { backgroundColor: ink, color: "#fff", paddingVertical: 7, paddingHorizontal: 14, borderRadius: 14, fontSize: 10, fontFamily: "Helvetica-Bold" },
  ctaLight: { borderWidth: 1, borderColor: "#c5cfdd", paddingVertical: 7, paddingHorizontal: 14, borderRadius: 14, fontSize: 10 },
  vpRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  vp: { flex: 1, backgroundColor: "#ffffff", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: line },
  footer: { position: "absolute", bottom: 26, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", fontSize: 8.5, color: "#98a1b0" },
  watermark: { position: "absolute", top: 380, left: 40, right: 40, textAlign: "center", fontSize: 54, color: "#f1f4f8", fontFamily: "Helvetica-Bold", transform: "rotate(-28deg)" },
});

function Bullets({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((t, i) => (
        <View key={i} style={s.bullet}>
          <Text style={s.dot}>•</Text>
          <Text style={{ flex: 1, color: "#30363f" }}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

function Footer({ host, domain }: { host: string; domain: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>
        {SITE_NAME} · {host}
      </Text>
      <Text>{domain}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function ReportPdf({ r, host }: { r: Report; host: string }) {
  const date = new Date(r.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return (
    <Document title={`${SITE_NAME}: ${r.domain}`} author={SITE_NAME} subject="Landing page roast">
      {/* Cover */}
      <Page size="A4" style={s.cover}>
        <View style={s.coverSky}>
          <Text style={s.brand}>{SITE_NAME.toUpperCase()}</Text>
          <Text style={s.coverTitle}>The full roast of{"\n"}{r.domain}</Text>
          <Text style={s.coverSub}>
            {r.company} · {date}
          </Text>
        </View>
        <View style={s.scoreCard}>
          <View style={{ width: 130 }}>
            <Text style={[s.bigScore, { color: scoreColor(r.overall) }]}>{r.overall}</Text>
            <Text style={s.bigScoreOf}>overall / 100</Text>
          </View>
          <View style={{ flex: 1, paddingLeft: 16, borderLeftWidth: 1, borderLeftColor: line }}>
            <Text style={s.verdict}>{r.verdict}</Text>
            <Text style={s.roast}>“{r.roast}”</Text>
          </View>
        </View>
        <View style={s.grid}>
          {SCORE_KEYS.map((k) => (
            <View key={k} style={s.gridItem}>
              <Text style={s.gridLabel}>{SCORE_META[k].label}</Text>
              <Text style={[s.gridScore, { color: scoreColor(r.scores[k].score) }]}>{r.scores[k].score}</Text>
              <View style={s.bar}>
                <View style={{ height: 4, borderRadius: 2, width: `${r.scores[k].score}%`, backgroundColor: scoreColor(r.scores[k].score) }} />
              </View>
            </View>
          ))}
        </View>
        <View style={{ marginHorizontal: 48, marginTop: 22 }}>
          <Text style={s.eyebrow}>What they do</Text>
          <Text style={s.p}>{r.oneLiner}</Text>
          <Text style={[s.eyebrow, { marginTop: 10 }]}>Pages analysed</Text>
          <Text style={[s.p, { fontSize: 9, color: muted }]}>{r.site.pagesCrawled.join("\n")}</Text>
        </View>
        <Footer host={host} domain={r.domain} />
      </Page>

      {/* Blind spots + competitors */}
      <Page size="A4" style={s.page}>
        <Text style={s.watermark} fixed>
          {host}
        </Text>
        <Text style={s.eyebrow}>Part 1</Text>
        <Text style={[s.h2, { marginBottom: 14 }]}>Blind spots</Text>
        {r.blindSpots.map((b, i) => (
          <View key={i} style={s.growth} wrap={false}>
            <Text style={{ fontSize: 12.5, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>
              {i + 1}. {b.title}
            </Text>
            <Text style={[s.p, { color: muted }]}>Evidence: {b.evidence}</Text>
            <Text style={s.p}>Fix: {b.fix}</Text>
          </View>
        ))}
        {r.competitors.length > 0 && (
          <View>
            <Text style={[s.eyebrow, { marginTop: 16 }]}>Part 2</Text>
            <Text style={[s.h2, { marginBottom: 14 }]}>You vs. your competitors</Text>
            {r.competitors.map((c) => {
              const ins = r.comparison.find((x) => x.domain === c.domain);
              return (
                <View key={c.domain} style={s.growth} wrap={false}>
                  <Text style={{ fontSize: 12.5, fontFamily: "Helvetica-Bold" }}>
                    {c.name} <Text style={{ color: muted, fontFamily: "Helvetica", fontSize: 10 }}>· {c.domain}</Text>
                  </Text>
                  <Text style={[s.p, { color: muted, marginTop: 3 }]}>Their headline: “{c.headline}”</Text>
                  {ins?.whyWinning ? <Text style={[s.p, { marginTop: 3 }]}>Why they&apos;re winning: {ins.whyWinning}</Text> : null}
                  {ins && (
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                      {[
                        ["They do better", ins.theyDoBetter],
                        ["Where you win", ins.youDoBetter],
                        ["Steal this", ins.steal],
                      ].map(([k, v]) => (
                        <View key={k} style={{ flex: 1 }}>
                          <Text style={{ fontSize: 8, color: muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>{k}</Text>
                          <Text style={{ fontSize: 9.5, color: "#30363f" }}>{v}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
        <Footer host={host} domain={r.domain} />
      </Page>

      {/* The business: idea, features, graveyard */}
      {(r.idea || r.features || (r.graveyard?.length ?? 0) > 0) && (
        <Page size="A4" style={s.page}>
          <Text style={s.watermark} fixed>
            {host}
          </Text>
          <Text style={s.eyebrow}>Part 3</Text>
          <Text style={[s.h2, { marginBottom: 14 }]}>The business</Text>
          {r.idea && (
            <View style={s.growth} wrap={false}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", flex: 1 }}>The idea: {r.idea.verdict}</Text>
                <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold", color: scoreColor(r.idea.score) }}>{r.idea.score}</Text>
              </View>
              <Text style={[s.p, { color: muted }]}>{r.idea.summary}</Text>
              {(
                [
                  ["Problem", r.idea.problem],
                  ["Timing", r.idea.timing],
                  ["Money", r.idea.money],
                  ["Moat", r.idea.moat],
                  ["Distribution", r.idea.distribution],
                ] as const
              )
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <Text key={k} style={s.p}>
                    <Text style={{ fontFamily: "Helvetica-Bold" }}>{k}: </Text>
                    {v}
                  </Text>
                ))}
              {r.idea.hardQuestion ? (
                <Text style={[s.p, { marginTop: 4 }]}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>The investor question: </Text>
                  {r.idea.hardQuestion}
                </Text>
              ) : null}
              {r.idea.risks.length > 0 && <Bullets items={r.idea.risks} />}
            </View>
          )}
          {r.features && (
            <View style={s.growth} wrap={false}>
              <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>Features</Text>
              <Text style={s.p}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>You offer: </Text>
                {r.features.yours.join(", ")}
              </Text>
              {r.features.unique.length > 0 && (
                <Text style={s.p}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>Only you: </Text>
                  {r.features.unique.join(", ")}
                </Text>
              )}
              {r.features.gaps.map((g) => (
                <Text key={g.feature} style={s.p}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>Gap: {g.feature}</Text> ({g.who.join(", ")}). {g.why}
                </Text>
              ))}
            </View>
          )}
          {(r.graveyard?.length ?? 0) > 0 && (
            <View>
              <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 6, marginBottom: 8 }}>The graveyard</Text>
              {r.graveyard!.map((g) => (
                <View key={g.name} style={s.growth} wrap={false}>
                  <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold" }}>
                    {g.name} <Text style={{ color: muted, fontFamily: "Helvetica", fontSize: 10 }}>{g.years}</Text>
                  </Text>
                  <Text style={[s.p, { color: muted }]}>{g.what}</Text>
                  <Text style={s.p}>What went wrong: {g.whyFailed}</Text>
                  <Text style={s.p}>Don&apos;t repeat it: {g.lesson}</Text>
                </View>
              ))}
              <Text style={{ fontSize: 8.5, color: muted }}>Based on public reporting about these companies.</Text>
            </View>
          )}
          <Footer host={host} domain={r.domain} />
        </Page>
      )}

      {/* Scores */}
      <Page size="A4" style={s.page}>
        <Text style={s.watermark} fixed>
          {host}
        </Text>
        <Text style={s.eyebrow}>Part 4</Text>
        <Text style={[s.h2, { marginBottom: 18 }]}>The four scores</Text>
        {SCORE_KEYS.map((k) => {
          const sc = r.scores[k];
          return (
            <View key={k} style={s.section} wrap={false}>
              <View style={s.sectionHead}>
                <View>
                  <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold" }}>{SCORE_META[k].label}</Text>
                  <Text style={{ fontSize: 9, color: muted }}>{SCORE_META[k].blurb}</Text>
                </View>
                <Text style={{ fontSize: 22, fontFamily: "Helvetica-Bold", color: scoreColor(sc.score) }}>{sc.score}</Text>
              </View>
              <Text style={s.p}>{sc.summary}</Text>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.h3}>What's hurting you</Text>
                  <Bullets items={sc.issues} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.h3}>Fix it this week</Text>
                  <Bullets items={sc.fixes} />
                </View>
              </View>
            </View>
          );
        })}
        <Footer host={host} domain={r.domain} />
      </Page>

      {/* Growth */}
      <Page size="A4" style={s.page}>
        <Text style={s.watermark} fixed>
          {host}
        </Text>
        <Text style={s.eyebrow}>Part 5</Text>
        <Text style={[s.h2, { marginBottom: 18 }]}>Growth plan</Text>
        {r.growth.map((g, i) => (
          <View key={i} style={s.growth} wrap={false}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
              <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", flex: 1 }}>
                {i + 1}. {g.title}
              </Text>
              <Text style={s.pill}>Impact: {g.impact}</Text>
              <Text style={s.pill}>Effort: {g.effort}</Text>
            </View>
            <Text style={s.p}>{g.detail}</Text>
          </View>
        ))}
        <Footer host={host} domain={r.domain} />
      </Page>

      {/* Rewrite */}
      <Page size="A4" style={s.page}>
        <Text style={s.watermark} fixed>
          {host}
        </Text>
        <Text style={s.eyebrow}>Part 6</Text>
        <Text style={s.h2}>Landing page rewrite</Text>
        <Text style={[s.p, { color: muted }]}>Copy you can paste into your hero today. Replace anything in [brackets] with your real numbers.</Text>
        <View style={s.rewriteBox}>
          <Text style={s.rwHeadline}>{r.rewrite.headline}</Text>
          <Text style={s.rwSub}>{r.rewrite.subheadline}</Text>
          <View style={s.rwCtas}>
            <Text style={s.ctaDark}>{r.rewrite.primaryCta}</Text>
            <Text style={s.ctaLight}>{r.rewrite.secondaryCta}</Text>
          </View>
          <Text style={{ fontSize: 9.5, color: muted, marginTop: 12 }}>{r.rewrite.proofLine}</Text>
          <View style={s.vpRow}>
            {r.rewrite.valueProps.map((v, i) => (
              <View key={i} style={s.vp}>
                <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>{v.title}</Text>
                <Text style={{ color: "#3b4250", fontSize: 9.5 }}>{v.body}</Text>
              </View>
            ))}
          </View>
          <Text style={{ marginTop: 18, fontSize: 13, fontFamily: "Helvetica-Bold" }}>{r.rewrite.closingLine}</Text>
        </View>
        <View style={{ marginTop: 28, padding: 16, borderRadius: 10, backgroundColor: "#0e1116" }}>
          <Text style={{ color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 12 }}>Fixed it? Roast it again.</Text>
          <Text style={{ color: "#aab3c2", fontSize: 10, marginTop: 4 }}>
            Ship the changes, then run {r.domain} through {host} again to see your new score.
          </Text>
        </View>
        <Footer host={host} domain={r.domain} />
      </Page>
    </Document>
  );
}

export function renderReportPdf(r: Report, host: string): Promise<Buffer> {
  return renderToBuffer(<ReportPdf r={r} host={host} />);
}
