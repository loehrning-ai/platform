"use client";

import { DEMO } from "@/lib/demo-tokens";

const PV: React.CSSProperties = { padding: "0 16px 12px" };
const MONO = DEMO.font.mono;
const SANS = DEMO.font.sans;
const ACCENT = "var(--color-brand-orange)"; // #A5370F, AA on the light preview surfaces
// Kupfer #A5370F is only ~2.98:1 on the near-black (#0B0908) blocks/dark tiles;
// the lighter copper #E07050 reaches >=6:1 there. Use ACCENT_DARK for kupfer
// text/marks that sit on a dark background.
const ACCENT_DARK = "var(--color-kupfer-light)"; // #E07050
const STATUS_GREEN = DEMO.statusGreen; // #22c55e, bright green for dots/fills + text on dark
// #22c55e is only ~2:1 as TEXT on the light preview surface; green-800 #166534
// reaches >=5.6:1 there. Use for green status TEXT on light backgrounds.
const GREEN_TEXT_LIGHT = "#166534";

// Light-on-dark token set for tiles with `dark: true`
const DK = {
  text: "rgba(243,240,233,0.9)",
  muted: "rgba(243,240,233,0.55)",
  border: "rgba(243,240,233,0.2)",
  fill: "rgba(243,240,233,0.07)",
};

export function ExcelPreview() {
  // s-hero (2x2) — largest tile. Full Excel mockup with formula bar + data + forecast.
  const rows = [
    ["KW 15", "West", "188", "911.800"],
    ["KW 16", "Nord", "161", "780.850"],
    ["KW 16", "West", "203", "984.550"],
    ["KW 17", "Süd",  "174", "843.200"],
  ] as const;
  return (
    <div style={PV}>
      <div style={{ background: DEMO.kalk, border: `1px solid ${DEMO.ink}`, fontFamily: MONO, fontSize: 10, overflow: "hidden" }}>
        {/* Chrome: filename tab */}
        <div style={{ background: "#107C41", color: "white", padding: "3px 8px", fontSize: 9, letterSpacing: "0.1em", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, background: "white", color: "#107C41", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>X</span>
          Absatz-KW.xlsx
          <span style={{ marginLeft: "auto", fontSize: 8, opacity: 0.7 }}>SHEET1</span>
        </div>
        {/* Formula bar */}
        <div style={{ background: "white", borderBottom: `1px solid ${DEMO.leinen}`, padding: "3px 8px", display: "flex", alignItems: "center", gap: 6, fontSize: 9, color: DEMO.ink }}>
          <span style={{ color: DEMO.schiefer, fontWeight: 700 }}>E5</span>
          <span style={{ color: DEMO.schiefer }}>ƒx</span>
          <span style={{ color: ACCENT, fontWeight: 700 }}>=CLAUDE(</span>
          <span style={{ color: DEMO.ink }}>&quot;Prognose&nbsp;KW18&quot;, B2:D17</span>
          <span style={{ color: ACCENT, fontWeight: 700 }}>)</span>
        </div>
        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "34%" }} />
          </colgroup>
          <thead>
            <tr style={{ background: DEMO.birke, borderBottom: `1px solid ${DEMO.leinen}` }}>
              {["KW", "Region", "Menge", "Umsatz €"].map((h, i) => (
                <th key={i} style={{ padding: "3px 6px", borderRight: `1px solid ${DEMO.leinen}`, textAlign: i > 1 ? "right" : "left", fontSize: 8, color: DEMO.schiefer, letterSpacing: "0.08em", fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${DEMO.leinen}` }}>
                {r.map((c, j) => (
                  <td key={j} style={{ padding: "3px 6px", borderRight: `1px solid ${DEMO.leinen}`, textAlign: j > 1 ? "right" : "left" }}>{c}</td>
                ))}
              </tr>
            ))}
            {/* Prognose row — highlighted */}
            <tr style={{ background: "rgba(249,115,22,0.08)", borderBottom: `1px solid ${ACCENT}` }}>
              <td style={{ padding: "3px 6px", borderRight: `1px solid ${DEMO.leinen}`, color: ACCENT, fontWeight: 700 }}>KW 18</td>
              <td style={{ padding: "3px 6px", borderRight: `1px solid ${DEMO.leinen}`, color: ACCENT, fontWeight: 700 }}>Alle</td>
              <td style={{ padding: "3px 6px", borderRight: `1px solid ${DEMO.leinen}`, textAlign: "right", color: ACCENT, fontWeight: 700 }}>195</td>
              <td style={{ padding: "3px 6px", borderRight: `1px solid ${DEMO.leinen}`, textAlign: "right", color: ACCENT, fontWeight: 800 }}>938.240 ◆</td>
            </tr>
          </tbody>
        </table>
        {/* Status bar */}
        <div style={{ background: DEMO.birke, padding: "3px 8px", borderTop: `1px solid ${DEMO.leinen}`, fontSize: 8, color: DEMO.schiefer, fontWeight: 700, letterSpacing: "0.08em", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: ACCENT }}>◆ CLAUDE-ADD-IN · AKTIV</span>
          <span>PROGNOSE · KONF. 94%</span>
        </div>
      </div>
    </div>
  );
}

export function WordPreview() {
  // s-tall (1x2) — vertical project brief document preview.
  return (
    <div style={PV}>
      <div style={{ background: "white", border: `1px solid ${DEMO.ink}`, overflow: "hidden" }}>
        {/* Chrome */}
        <div style={{ background: "#2B579A", color: "white", padding: "3px 8px", fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, background: "white", color: "#2B579A", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>W</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Projektbrief_Fiktivwerk_Demo.docx</span>
        </div>
        {/* Letterhead */}
        <div style={{ padding: "10px 14px", fontFamily: "Georgia, serif", fontSize: 10, lineHeight: 1.5, color: "#222" }}>
          <div style={{ fontFamily: MONO, fontSize: 7, color: "#666", letterSpacing: "0.14em", marginBottom: 6, textTransform: "uppercase", display: "flex", justifyContent: "space-between" }}>
            <span>Fiktivwerk Beispiel GmbH · Musterstadt</span>
            <span>23. 04. 2026</span>
          </div>
          <strong style={{ fontSize: 11, display: "block", lineHeight: 1.3, color: "#111" }}>Projektbrief: Wartungs-KI Produktionslinie 3</strong>
          <p style={{ marginTop: 6, fontSize: 9, color: "#444", lineHeight: 1.5 }}>Guten Tag, Fiktivkontakt Alpha,</p>
          <p style={{ marginTop: 4, fontSize: 9, color: "#444", lineHeight: 1.5 }}>anbei der neutrale Projektbrief zur Prüfung einer predictiven Wartungs-KI auf Ihrer PL-3…</p>
          {/* Signature hint */}
          <div style={{ marginTop: 8, borderTop: `1px solid #eee`, paddingTop: 6, fontFamily: MONO, fontSize: 7, color: "#666", letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", justifyContent: "space-between" }}>
            <span>Interne Freigabe</span>
            <span style={{ color: ACCENT, fontWeight: 700 }}>◆ FIKTIV</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OutboundWorkflowPreview() {
  // s-med (1x1) — compact public-signal review card.
  return (
    <div style={{ ...PV, display: "flex", flexDirection: "column", gap: 5, fontFamily: MONO, fontSize: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ background: DEMO.ink, color: ACCENT_DARK, padding: "2px 6px", fontSize: 8, letterSpacing: "0.12em", fontWeight: 800 }}>SIGNALPRÜFUNG</div>
        <div style={{ fontSize: 8, color: DEMO.schiefer, letterSpacing: "0.1em" }}>#0414</div>
        <div style={{ marginLeft: "auto", color: ACCENT, fontWeight: 700, fontSize: 12, letterSpacing: "-0.02em" }}>
          91<span style={{ color: DEMO.schiefer, fontSize: 9, fontWeight: 400 }}>/100</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: DEMO.ink, fontWeight: 700, letterSpacing: "-0.02em", fontFamily: SANS, lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        Fiktivkontakt Gamma · Fiktivwerk Gamma
      </div>
      <div style={{ background: DEMO.birke, border: `1px dashed ${ACCENT}`, padding: "4px 7px", fontSize: 9, color: DEMO.ink, lineHeight: 1.3 }}>
        <span style={{ color: ACCENT, fontWeight: 800, letterSpacing: "0.1em" }}>SIGNAL</span>
        <span style={{ color: DEMO.schiefer }}>{" · "}</span>
        Fiktives Fördersignal · ungeprüft
      </div>
      <div style={{ fontSize: 8, color: GREEN_TEXT_LIGHT, letterSpacing: "0.1em", fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
        <span>✓ NOTIZ · 08:42</span>
        <span style={{ color: DEMO.schiefer }}>→ REVIEW 09:07</span>
      </div>
    </div>
  );
}

export function AgentPipelinePreview() {
  // s-wide (2x1) dark tile — horizontal 4-agent flow with arrow connectors.
  const roles = [
    { n: "01", role: "SCOUT", sub: "Quellen · 14", active: true, dotColor: ACCENT_DARK },
    { n: "02", role: "ANALYST", sub: "Synthese", active: true, dotColor: ACCENT_DARK },
    { n: "03", role: "KRITIKER", sub: "Red-Team", active: false, dotColor: "rgba(243,240,233,0.4)" },
    { n: "04", role: "REDAKTEUR", sub: "Memo v3", active: false, dotColor: "rgba(243,240,233,0.25)" },
  ] as const;
  const cells: React.ReactNode[] = [];
  roles.forEach((r, i) => {
    cells.push(
      <div
        key={r.n}
        style={{
          background: i === 0 ? ACCENT : DK.fill,
          color: i === 0 ? DEMO.kalk : DK.text,
          borderTop: `2px solid ${i === 0 ? ACCENT : DK.border}`,
          padding: "6px 7px",
          display: "flex",
          flexDirection: "column",
          gap: 3,
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 8, opacity: i === 0 ? 1 : 0.55, fontWeight: 700 }}>{r.n}</span>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: r.dotColor, display: "inline-block", marginLeft: "auto" }} />
        </div>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", lineHeight: 1 }}>{r.role}</div>
        <div style={{ fontSize: 8, opacity: 0.65, letterSpacing: "0.04em" }}>{r.sub}</div>
      </div>,
    );
    if (i < roles.length - 1) {
      cells.push(
        <div
          key={`arr-${i}`}
          style={{ color: i === 0 ? ACCENT_DARK : DK.border, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}
        >
          →
        </div>,
      );
    }
  });
  return (
    <div style={{ ...PV, fontFamily: MONO }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 10px 1fr 10px 1fr 10px 1fr", gap: 4, alignItems: "stretch" }}>
        {cells}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 8, color: DK.muted, letterSpacing: "0.12em", fontWeight: 700 }}>
        <span>MEMO · REV 3</span>
        <span style={{ color: ACCENT_DARK }}>4:31 MIN</span>
      </div>
    </div>
  );
}

export function N8nSupplyChainPreview() {
  // s-wide (2x1) dark tile — 3-node horizontal workflow: DHL → Claude → Actions.
  return (
    <div style={{ ...PV, fontFamily: MONO, fontSize: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 10px 1fr 10px 1fr", gap: 6, alignItems: "stretch" }}>
        <div style={{ background: DK.fill, padding: "6px 8px", border: `1px solid ${ACCENT_DARK}`, color: ACCENT_DARK, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: ACCENT_DARK, display: "inline-block" }} />
            <span style={{ letterSpacing: "0.04em" }}>DHL</span>
          </div>
          <div style={{ fontSize: 8, color: DK.muted, letterSpacing: "0.06em" }}>VERZUG · 31H</div>
        </div>
        <div style={{ color: ACCENT_DARK, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>→</div>
        <div style={{ background: ACCENT, padding: "6px 8px", color: DEMO.kalk, borderTop: `2px solid ${ACCENT}`, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <div style={{ fontWeight: 800, letterSpacing: "0.04em" }}>◈ CLAUDE</div>
          <div style={{ fontSize: 8, opacity: 0.75, letterSpacing: "0.06em" }}>BRIEF + ACTION</div>
        </div>
        <div style={{ color: ACCENT_DARK, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>→</div>
        <div style={{ background: DK.fill, padding: "6px 8px", border: `1px solid ${DK.border}`, color: DK.text, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <div style={{ fontWeight: 700, letterSpacing: "0.04em" }}>✉ · ◉ · SAP</div>
          <div style={{ fontSize: 8, color: DK.muted, letterSpacing: "0.06em" }}>MAIL · SLACK · MM</div>
        </div>
      </div>
      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 8, color: DK.muted, letterSpacing: "0.12em", fontWeight: 700 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: STATUS_GREEN }}>
          <span style={{ width: 5, height: 5, background: STATUS_GREEN, borderRadius: "50%", display: "inline-block" }} />
          SIM
        </span>
        <span style={{ color: ACCENT_DARK }}>REAKTION · 4 SEK</span>
      </div>
    </div>
  );
}

export function RagVertragsassistentPreview() {
  // s-med (1x1) — compact chat snippet with citation.
  return (
    <div style={{ ...PV, display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ alignSelf: "flex-end", background: DEMO.ink, color: DEMO.kalk, padding: "4px 9px", fontSize: 11, maxWidth: "82%", fontFamily: SANS, lineHeight: 1.25 }}>
        Kündigungsfrist?
      </div>
      <div style={{ background: DEMO.birke, borderLeft: `3px solid ${ACCENT}`, padding: "5px 9px", fontSize: 11, lineHeight: 1.35, fontFamily: SANS, color: DEMO.ink }}>
        <div style={{ fontFamily: MONO, fontSize: 8, color: ACCENT, letterSpacing: "0.12em", fontWeight: 800, marginBottom: 2, display: "flex", justifyContent: "space-between" }}>
          <span>§ 5 · 2 QUELLEN</span>
          <span>94%</span>
        </div>
        3 Monate zum Quartalsende…
      </div>
    </div>
  );
}

export function RechnungZuSapPreview() {
  // s-med (1x1) — invoice document → SAP IDoc JSON flow.
  return (
    <div style={{ ...PV, display: "flex", gap: 8, alignItems: "stretch" }}>
      {/* Invoice thumb */}
      <div style={{ width: 46, background: DEMO.birke, border: `1px solid ${DEMO.leinen}`, padding: "5px 4px", display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 6, color: ACCENT, letterSpacing: "0.1em", fontWeight: 800, marginBottom: 2 }}>RE</div>
        {([1, 0.85, 1, 0.55, 1, 0.75] as const).map((w, i) => (
          <div key={i} style={{ height: 1.5, width: `${w * 100}%`, background: DEMO.schiefer }} />
        ))}
        <div style={{ marginTop: "auto", fontFamily: MONO, fontSize: 7, color: DEMO.ink, fontWeight: 700, textAlign: "right" }}>100.317</div>
      </div>
      <div style={{ color: ACCENT, fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center" }}>→</div>
      {/* IDoc JSON */}
      <div style={{ fontFamily: MONO, fontSize: 10, flex: 1, background: DEMO.ink, color: DEMO.kalk, padding: "6px 8px", lineHeight: 1.45, minWidth: 0 }}>
        <div style={{ fontSize: 7, color: ACCENT_DARK, letterSpacing: "0.14em", fontWeight: 800, marginBottom: 3 }}>IDOC · INVOIC02</div>
        <div style={{ color: DK.muted, fontSize: 8 }}><span style={{ color: ACCENT_DARK }}>nr</span> RE-2026-04211</div>
        <div style={{ color: DK.muted, fontSize: 8 }}><span style={{ color: ACCENT_DARK }}>brutto</span> 100.317 €</div>
        <div style={{ color: STATUS_GREEN, fontSize: 8, fontWeight: 700 }}>✓ conf 0.97</div>
      </div>
    </div>
  );
}

export function PromptScannerPreview() {
  // s-med (1x1) dark — redacted prompt highlighting PII + blocked status.
  return (
    <div style={PV}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.04em", color: DK.text, padding: "4px 6px", background: "rgba(255,255,255,0.03)", border: `1px solid ${DK.border}`, lineHeight: 1.6 }}>
        <span style={{ background: `${DEMO.statusRed}40`, borderBottom: `1px solid ${DEMO.statusRed}`, padding: "0 3px", color: DEMO.kalk }}>Fiktivperson Alpha</span>
        {", IBAN "}
        <span style={{ background: DEMO.kalk, color: DEMO.ink, padding: "1px 5px", fontWeight: 800 }}>▓▓▓▓▓▓</span>
        {" fragt zu "}
        <span style={{ background: `${DEMO.statusAmber}40`, borderBottom: `1px solid ${DEMO.statusAmber}`, padding: "0 3px", color: DEMO.kalk }}>Vertragsdetail</span>.
      </div>
      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: MONO, fontSize: 8, fontWeight: 800, letterSpacing: "0.14em" }}>
        <span style={{ color: DEMO.statusRed }}>■ BLOCKIERT</span>
        <span style={{ color: DK.muted }}>1 PII</span>
        <span style={{ color: ACCENT_DARK }}>42 MS</span>
      </div>
    </div>
  );
}

export function CostDriftObservabilityPreview() {
  // s-med (1x1) — spend sparkline + live indicator. Compact observability readout.
  return (
    <div style={PV}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: MONO, marginBottom: 4 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: ACCENT, letterSpacing: "-0.02em" }}>1.247k</span>
        <span style={{ fontSize: 8, color: DEMO.schiefer, letterSpacing: "0.12em", fontWeight: 700 }}>TOKENS · 24H</span>
      </div>
      <svg width="100%" height="38" viewBox="0 0 220 38" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        <defs>
          <linearGradient id="gcd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.28" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points="0,30 20,25 40,28 60,17 80,22 100,11 120,18 140,6 160,14 180,3 200,11 220,8"
          fill="none"
          stroke={ACCENT}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points="0,38 0,30 20,25 40,28 60,17 80,22 100,11 120,18 140,6 160,14 180,3 200,11 220,8 220,38"
          fill="url(#gcd)"
        />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: MONO, fontSize: 8, color: DEMO.schiefer, marginTop: 4, letterSpacing: "0.12em", fontWeight: 700 }}>
        <span>p95 · 2.4 s</span>
        <span style={{ color: GREEN_TEXT_LIGHT, display: "inline-flex", alignItems: "center", gap: 3 }}>
          <span style={{ width: 5, height: 5, background: STATUS_GREEN, borderRadius: "50%", display: "inline-block" }} />
          SIM
        </span>
      </div>
    </div>
  );
}

export function FineTunePlaygroundPreview() {
  // s-med (1x1) — side-by-side BASIS vs FINE-TUNED comparison.
  return (
    <div style={{ ...PV, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, position: "relative" }}>
      <div style={{ background: DEMO.birke, border: `1px solid ${DEMO.leinen}`, padding: "5px 7px", fontFamily: MONO, display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.12em", color: DEMO.schiefer, borderBottom: `1px solid ${DEMO.leinen}`, paddingBottom: 3 }}>BASIS</div>
        <div style={{ fontSize: 9, lineHeight: 1.4, color: DEMO.ink, fontFamily: SANS }}>„Leider keine Auskunft…&ldquo;</div>
        <div style={{ fontSize: 7, color: DEMO.schiefer, letterSpacing: "0.1em", marginTop: "auto", fontWeight: 700 }}>KONF · 41%</div>
      </div>
      <div style={{ background: DEMO.kalk, border: `2px solid ${ACCENT}`, padding: "5px 7px", fontFamily: MONO, display: "flex", flexDirection: "column", gap: 3, boxShadow: `2px 2px 0 0 ${ACCENT}` }}>
        <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.12em", color: ACCENT, borderBottom: `1px solid ${DEMO.leinen}`, paddingBottom: 3, display: "flex", justifyContent: "space-between" }}>
          <span>SIMULIERT</span>
          <span>+38%</span>
        </div>
        <div style={{ fontSize: 9, lineHeight: 1.4, color: DEMO.ink, fontFamily: SANS }}>„Laut § 5 Abs. 2 AGB…&ldquo;</div>
        <div style={{ fontSize: 7, color: ACCENT, letterSpacing: "0.1em", marginTop: "auto", fontWeight: 800 }}>KONF · 96%</div>
      </div>
    </div>
  );
}

export function RoiRechnerPreview() {
  // s-med (1x1) — hero ROI number + transparent formula.
  return (
    <div style={{ ...PV, display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, letterSpacing: "-0.045em", color: ACCENT, lineHeight: 0.95, fontVariantNumeric: "tabular-nums" }}>
        247 h
      </div>
      <div style={{ fontFamily: MONO, fontSize: 8, color: DEMO.schiefer, letterSpacing: "0.14em", fontWeight: 700 }}>PRO JAHR · MODELLANNAHME</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontFamily: MONO, fontSize: 8, color: DEMO.schiefer, borderTop: `1px solid ${DEMO.leinen}`, paddingTop: 5, marginTop: 2, letterSpacing: "0.04em" }}>
        <span style={{ color: DEMO.ink, fontWeight: 700 }}>42 Rollen</span>
        <span>×</span>
        <span style={{ color: DEMO.ink, fontWeight: 700 }}>1,8h/Wo</span>
        <span>×</span>
        <span style={{ color: DEMO.ink, fontWeight: 700 }}>Freigabegrad</span>
      </div>
    </div>
  );
}

export function LlmObservabilityPreview() {
  // s-med (1x1) — eval/drift summary strip.
  return (
    <div style={{ ...PV, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontFamily: MONO, fontSize: 8, color: DEMO.schiefer, letterSpacing: "0.14em", fontWeight: 700 }}>EVAL · DRIFT · FEEDBACK</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        {[["HOCH", "#166534", "#dcfce7"], ["MITTEL", "#a16207", "#fef9c3"], ["HOCH", "#166534", "#dcfce7"], ["DRIFT", "#b45309", "#fef3c7"]].map(([label, fg, bg], i) => (
          <div key={i} style={{ border: `1px solid ${fg}`, background: bg, padding: "2px 5px", fontFamily: MONO, fontSize: 8, fontWeight: 700, color: fg, letterSpacing: "0.08em" }}>
            {label}
          </div>
        ))}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 8, color: DEMO.schiefer, letterSpacing: "0.04em", borderTop: `1px solid ${DEMO.leinen}`, paddingTop: 4 }}>
        <span style={{ color: DEMO.ink, fontWeight: 700 }}>2</span> Auto/Mensch Abweichungen
      </div>
    </div>
  );
}
