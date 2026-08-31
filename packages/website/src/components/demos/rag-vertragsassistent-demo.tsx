"use client";

import { useEffect, useRef, useState } from "react";
import { DEMO } from "@/lib/demo-tokens";
import { DEMO_HEIGHT, usePrefersReducedMotion } from "./demo-utils";
import { useDemoLocale } from "./demo-locale";

type KonfidenzLevel = "hoch" | "mittel" | "niedrig";

interface Source {
  readonly t: string;
  readonly s: string;
  readonly konfidenz: KonfidenzLevel;
}

interface AnswerData {
  readonly answer: string;
  readonly sources: readonly Source[];
  readonly follow: readonly string[];
  readonly matchedTerms: readonly string[];
}

interface AnswerDataEmpty {
  readonly answer: null;
  readonly sources: readonly never[];
  readonly follow: readonly string[];
  readonly matchedTerms: readonly never[];
}

type AnswerResult = AnswerData | AnswerDataEmpty;

interface Message {
  readonly id: number;
  readonly role: "user" | "assistant";
  readonly text: string | null;
  readonly sources?: readonly Source[];
  readonly follow?: readonly string[];
  readonly matchedTerms?: readonly string[];
  readonly isEmpty?: boolean;
  readonly queryContext?: string;
}

const CHAT_Q: Readonly<Record<string, AnswerData>> = {
  "kuendigung|kuendigungsfrist|kündigung|kündigungsfrist": {
    answer:
      "Die Kündigungsfrist beträgt **3 Monate zum Quartalsende**. Bei Laufzeiten unter 12 Monaten gilt eine verkürzte Frist von 4 Wochen. Eine außerordentliche Kündigung ist bei wesentlicher Vertragsverletzung jederzeit möglich.",
    sources: [
      { t: "Rahmenvereinbarung v3.2", s: "§12.3 Kündigung", konfidenz: "hoch" },
      { t: "RV-2026-003", s: "Anlage B, Abs. 4", konfidenz: "mittel" },
    ],
    matchedTerms: ["Kündigung", "Kündigungsfrist", "Quartalsende"],
    follow: [
      "Gibt es Sonderkündigungsrechte?",
      "Welche Pflichten gelten während der Frist?",
    ],
  },
  "sonderkuendigung|ausserordentlich|sonderkündigung|außerordentlich": {
    answer:
      "Sonderkündigungsrechte bestehen bei: **(1)** Insolvenz des Vertragspartners, **(2)** wesentlicher Vertragsverletzung nach erfolgloser Abmahnung mit 14-Tage-Frist, **(3)** Force Majeure über 90 Tage. Die Kündigung muss schriftlich erfolgen.",
    sources: [
      { t: "Rahmenvereinbarung v3.2", s: "§12.5", konfidenz: "hoch" },
      { t: "AGB Projektverträge", s: "§8 Abs. 2", konfidenz: "mittel" },
    ],
    matchedTerms: ["Sonderkündigung", "außerordentlich", "Abmahnung"],
    follow: ["Welche Pflichten gelten während der Kündigungsfrist?"],
  },
  "haftung|haftungsgrenze": {
    answer:
      "Die Haftung ist auf das **3-fache des Jahreshonorars** begrenzt, maximal jedoch 500.000 EUR. Ausgeschlossen sind mittelbare Schäden und entgangener Gewinn. Bei Vorsatz und grober Fahrlässigkeit greift die Begrenzung nicht.",
    sources: [
      { t: "Rahmenvereinbarung v3.2", s: "§14 Haftung", konfidenz: "hoch" },
      { t: "D&O-Versicherung", s: "Police 2026/04", konfidenz: "niedrig" },
    ],
    matchedTerms: ["Haftung", "Haftungsgrenze", "Jahreshonorar"],
    follow: ["Wer haftet bei Subunternehmern?"],
  },
  "unterschr|zeichnung|signatur": {
    answer:
      "Im ausdrücklich fiktiven Vertragsbeispiel sind **Rolle Alpha (Geschäftsführung)** und **Rolle Beta (Finanzen)** einzelvertretungsberechtigt. Kollektivzeichnung zu zweien gilt für die Beispiel-Prokura. Bei Verträgen über 250k EUR ist laut Beispieldokument die Unterschrift der Geschäftsführung erforderlich.",
    sources: [
      { t: "Handelsregister", s: "HRB 82104", konfidenz: "hoch" },
      { t: "Unterschriftenregelung v2", s: "Abs. 3", konfidenz: "hoch" },
    ],
    matchedTerms: ["Unterschrift", "Zeichnung", "Vertretung"],
    follow: ["Darf ein Prokurist alleine unterzeichnen?"],
  },
};

const CHAT_DEFAULT: AnswerDataEmpty = {
  answer: null,
  sources: [],
  follow: ["Was sind typische Klauseln?", "An Legal weiterleiten"],
  matchedTerms: [],
};

const CHAT_SUGGESTED = [
  "Wie ist die Kündigungsfrist?",
  "Welche Haftungsgrenzen gelten?",
  "Wer darf unterzeichnen?",
  "Gibt es Sonderkündigungsrechte?",
];

// Grenzfall query: no document in the archive matches this
const FAILURE_QUERY = "Wer hat Prokura für ausländische Verträge?";

function findAnswer(q: string): AnswerResult {
  const qL = q.toLowerCase();
  for (const [pattern, data] of Object.entries(CHAT_Q)) {
    if (pattern.split("|").some((p) => qL.includes(p))) return data;
  }
  return CHAT_DEFAULT;
}

const KONFIDENZ_CONFIG: Record<
  KonfidenzLevel,
  { label: string; color: string; bg: string }
> = {
  hoch: { label: "Hoch", color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  mittel: { label: "Mittel", color: "#d97706", bg: "rgba(217,119,6,0.1)" },
  niedrig: { label: "Niedrig", color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
};

function KonfidenzChip({ level }: { level: KonfidenzLevel }) {
  const cfg = KONFIDENZ_CONFIG[level];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        justifyContent: "center",
        flexShrink: 0,
        minWidth: 48,
      }}
    >
      <span
        style={
          {
            padding: "2px 6px",
            fontSize: 12,
            fontFamily: "var(--font-geist-mono, ui-monospace, monospace)",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: cfg.color,
            background: cfg.bg,
            title:
              "Konfidenz = Übereinstimmung mit Schlüsselbegriffen im Dokument",
          } as React.CSSProperties
        }
        title="Konfidenz = Übereinstimmung mit Schlüsselbegriffen im Dokument"
      >
        {cfg.label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-geist-mono, ui-monospace, monospace)",
          fontSize: 12,
          color: "#6b7280",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginTop: 2,
        }}
      >
        Konfidenz
      </span>
    </div>
  );
}

function MatchedTermsPanel({ terms }: { terms: readonly string[] }) {
  if (terms.length === 0) return null;
  return (
    <div
      style={{
        marginTop: 6,
        padding: "6px 10px",
        background: "rgba(37,99,235,0.05)",
        border: "1px solid rgba(37,99,235,0.2)",
        fontFamily: "var(--font-geist-mono, ui-monospace, monospace)",
        fontSize: 12,
        letterSpacing: "0.08em",
      }}
    >
      <span
        style={{
          color: "#6b7280",
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        {/* Carries the definition the shell badge cannot: this engine's
            "Konfidenz" is a keyword-hit count, not a model score. Relocated
            here from the engine's own SimulationDisclosure, which restated
            the simulation mode the detail shell already states once. */}
        Gefundene Schlüsselwörter (Konfidenz = Anzahl Treffer):{" "}
      </span>
      {terms.map((term, i) => (
        <span
          key={i}
          style={{ color: "#2563eb", fontWeight: 700, marginRight: 6 }}
        >
          {term}
        </span>
      ))}
    </div>
  );
}

function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((c, i) =>
    c.startsWith("**") ? (
      <strong key={i} style={{ color: "var(--color-brand-orange)" }}>
        {c.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{c}</span>
    ),
  );
}

export default function RagVertragsassistentDemo() {
  const { locale } = useDemoLocale();
  return locale === "en" ? (
    <RagContractAssistantEnglish />
  ) : (
    <RagVertragsassistentGerman />
  );
}

function RagVertragsassistentGerman() {
  const [msgs, setMsgs] = useState<readonly Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [expanded, setExpanded] = useState<Readonly<Record<number, boolean>>>(
    {},
  );
  const [searchStage, setSearchStage] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: reduced ? "auto" : "smooth",
    });
  }, [msgs, typing, searchStage, reduced]);

  function submit(text?: string) {
    const q = (text ?? input).trim();
    if (!q) return;
    setInput("");
    const userMsg: Message = { role: "user", text: q, id: Date.now() };
    setMsgs((m) => [...m, userMsg]);
    setTyping(true);
    setSearchStage(1);
    const d1 = reduced ? 0 : 350;
    const d2 = reduced ? 0 : 700;
    const d3 = reduced ? 200 : 1200;
    setTimeout(() => setSearchStage(2), d1);
    setTimeout(() => setSearchStage(3), d2);
    setTimeout(() => {
      const a = findAnswer(q);
      setTyping(false);
      setSearchStage(0);
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          text: a.answer,
          sources: "sources" in a ? a.sources : [],
          follow: a.follow,
          matchedTerms: "matchedTerms" in a ? a.matchedTerms : [],
          isEmpty: a.answer === null,
          queryContext: q,
          id: Date.now() + 1,
        },
      ]);
    }, d3);
  }

  return (
    <div
      data-demo-id="rag-vertragsassistent"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: DEMO_HEIGHT,
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          paddingBottom: 12,
          borderBottom: `1px solid ${DEMO.leinen}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              flexShrink: 0,
              background: "var(--color-brand-orange)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: DEMO.kalk,
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            KI
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Vertrags-Assistent
            </div>
            <div
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                color: DEMO.schiefer,
                letterSpacing: "0.08em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Keyword-Suche · 8 Beispieldokumente
            </div>
          </div>
        </div>
        <span
          style={{
            background: "rgba(34,197,94,0.12)",
            color: DEMO.statusGreen,
            padding: "3px 8px",
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            letterSpacing: "0.12em",
            fontWeight: 700,
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          ● DEMO-MODUS
        </span>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: "1 1 0",
          minHeight: 280,
          maxHeight: 400,
          overflowY: "auto",
          padding: "12px 4px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {msgs.length === 0 && !typing && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: 16,
            }}
          >
            <div
              style={{
                width: 140,
                height: 3,
                background: "var(--color-brand-orange)",
                marginBottom: 16,
              }}
            />
            <div
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                color: "#2563eb",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Keyword-Suche · Regelbasiert
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                marginTop: 8,
                maxWidth: 440,
                lineHeight: 1.15,
              }}
            >
              Fragen Sie das Beispielarchiv.{" "}
              <span style={{ color: "var(--color-brand-orange)" }}>
                Antworten mit Quelle.
              </span>
            </h2>
            <p
              style={{
                fontSize: 13,
                color: DEMO.schiefer,
                marginTop: 10,
                maxWidth: 420,
                lineHeight: 1.5,
              }}
            >
              Antworten zeigen passende Fundstellen; Fehler und fehlende Treffer
              bleiben möglich.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 6,
                marginTop: 18,
                width: "100%",
                maxWidth: 480,
              }}
            >
              {CHAT_SUGGESTED.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  style={{
                    minHeight: 44,
                    textAlign: "left",
                    padding: "7px 10px",
                    border: `1px solid ${DEMO.leinen}`,
                    background: DEMO.birke,
                    fontSize: 12,
                    lineHeight: 1.3,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    color: DEMO.ink,
                    flex: "1 1 auto",
                    minWidth: 0,
                    transition: reduced
                      ? "none"
                      : "background 150ms, border-color 150ms",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = DEMO.kupferMist;
                    e.currentTarget.style.borderColor =
                      "var(--color-brand-orange)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = DEMO.birke;
                    e.currentTarget.style.borderColor = DEMO.leinen;
                  }}
                >
                  <span
                    style={{
                      color: "var(--color-brand-orange)",
                      fontWeight: 700,
                      marginRight: 6,
                    }}
                  >
                    →
                  </span>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, idx) =>
          m.role === "user" ? (
            <div
              key={m.id}
              style={{ display: "flex", justifyContent: "flex-end" }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  background: DEMO.ink,
                  color: DEMO.kalk,
                  padding: "9px 13px",
                  fontSize: 13,
                  lineHeight: 1.55,
                  wordBreak: "break-word",
                }}
              >
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} style={{ maxWidth: "85%", minWidth: 0 }}>
              <div
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 12,
                  color: m.isEmpty ? "#6b7280" : "var(--color-brand-orange)",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                ⎯{" "}
                {m.isEmpty
                  ? "Kein Treffer"
                  : `Keyword-Suche · ${m.sources?.length ?? 0} Quellen`}
              </div>
              <div
                style={{
                  background: m.isEmpty ? "rgba(107,114,128,0.06)" : DEMO.birke,
                  padding: "11px 13px",
                  fontSize: 13,
                  lineHeight: 1.65,
                  borderLeft: `3px solid ${m.isEmpty ? "#6b7280" : "var(--color-brand-orange)"}`,
                  wordBreak: "break-word",
                  color: m.isEmpty ? "#6b7280" : "inherit",
                }}
              >
                {m.isEmpty
                  ? "Keine Übereinstimmung gefunden, das System kann hier keine Antwort verankern. Kein Dokument im Beispielarchiv enthält ausreichend passende Schlüsselbegriffe für diese Anfrage."
                  : renderBold(m.text ?? "")}
              </div>
              {!m.isEmpty && m.matchedTerms && m.matchedTerms.length > 0 && (
                <MatchedTermsPanel terms={m.matchedTerms} />
              )}
              {m.sources && m.sources.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((e) => ({ ...e, [m.id]: !e[m.id] }))
                    }
                    aria-expanded={!!expanded[m.id]}
                    aria-label={`${expanded[m.id] ? "Quellen ausblenden" : "Quellen anzeigen"}: ${m.sources.length} Quellen zur Antwort auf „${m.queryContext}“`}
                    style={{
                      minHeight: 44,
                      background: "transparent",
                      border: `1px solid ${DEMO.leinen}`,
                      padding: "4px 8px",
                      fontFamily: DEMO.font.mono,
                      fontSize: 12,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      color: DEMO.schiefer,
                      fontWeight: 700,
                    }}
                  >
                    {expanded[m.id] ? "▼" : "▶"} {m.sources.length}{" "}
                    {expanded[m.id] ? "Quellen ausblenden" : "Quellen anzeigen"}
                  </button>
                  {expanded[m.id] && (
                    <div
                      style={{
                        marginTop: 6,
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                      }}
                    >
                      {m.sources.map((s, i) => {
                        const parText = s.s.split("·")[0]?.trim() ?? s.s;
                        return (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "stretch",
                              gap: 8,
                              background: DEMO.kalk,
                              border: `1px solid ${DEMO.leinen}`,
                              padding: "7px 10px",
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                width: 22,
                                flexShrink: 0,
                                background: DEMO.kupferMist,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: DEMO.font.mono,
                                fontSize: 12,
                                fontWeight: 700,
                                color: "var(--color-brand-orange)",
                              }}
                            >
                              {String(i + 1).padStart(2, "0")}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: DEMO.ink,
                                  lineHeight: 1.35,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={s.t}
                              >
                                {s.t}
                              </div>
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  marginTop: 3,
                                  padding: "1px 6px",
                                  border: `1px solid ${DEMO.leinen}`,
                                  background: DEMO.birke,
                                  fontFamily: DEMO.font.mono,
                                  fontSize: 12,
                                  color: DEMO.ink,
                                  letterSpacing: "0.02em",
                                  maxWidth: "100%",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={parText}
                              >
                                {parText}
                              </div>
                            </div>
                            <KonfidenzChip level={s.konfidenz} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {m.follow && idx === msgs.length - 1 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  {m.follow.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => submit(f)}
                      style={{
                        minHeight: 44,
                        background: "transparent",
                        border: `1px solid var(--color-brand-orange)`,
                        color: "var(--color-brand-orange)",
                        padding: "5px 9px",
                        fontSize: 12,
                        lineHeight: 1.3,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontWeight: 600,
                        transition: reduced ? "none" : "background 150ms",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = DEMO.kupferMist;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {f} →
                    </button>
                  ))}
                </div>
              )}
            </div>
          ),
        )}

        {typing && (
          <div style={{ maxWidth: "85%", minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: "var(--color-brand-orange)",
              }}
              aria-live="polite"
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: "var(--color-brand-orange)",
                  animation: reduced
                    ? "none"
                    : "ragPulse 1.1s ease-in-out infinite",
                  boxShadow: "0 0 0 3px rgba(249,115,22,0.15)",
                }}
              />
              Simuliertes Retrieval · durchsucht Beispielarchiv…
            </div>
            <div
              style={{
                background: DEMO.birke,
                padding: "10px 12px",
                borderLeft: `3px solid #2563eb`,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(
                  [
                    {
                      stage: 1,
                      label: "Anfrage auflösen",
                      detail: "Suchbegriffe extrahieren",
                    },
                    {
                      stage: 2,
                      label: "8 Dokumente durchsuchen",
                      detail: "Schlüsselbegriff-Abgleich",
                    },
                    {
                      stage: 3,
                      label: "Treffer ranken",
                      detail: "Anzahl passender Begriffe",
                    },
                  ] as const
                ).map((s) => (
                  <div
                    key={s.stage}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      opacity: searchStage >= s.stage ? 1 : 0.35,
                      transition: reduced ? "none" : "opacity 200ms",
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        flexShrink: 0,
                        background:
                          searchStage > s.stage
                            ? DEMO.statusGreen
                            : searchStage === s.stage
                              ? "#2563eb"
                              : DEMO.leinen,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        color: DEMO.ink,
                        fontWeight: 600,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.label}
                    </span>
                    <span
                      style={{
                        fontFamily: DEMO.font.mono,
                        fontSize: 12,
                        color: DEMO.schiefer,
                        marginLeft: "auto",
                        flexShrink: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "55%",
                      }}
                    >
                      {s.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes ragPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.82); }
        }
      `}</style>

      {/* Failure mode beat */}
      <div
        style={{
          padding: "8px 12px",
          background: "rgba(107,114,128,0.06)",
          border: "1px solid rgba(107,114,128,0.2)",
          fontSize: 12,
          lineHeight: 1.5,
          fontFamily: DEMO.font.mono,
        }}
      >
        <span
          style={{
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#6b7280",
            fontSize: 12,
          }}
        >
          Grenzfall:{" "}
        </span>
        <button
          type="button"
          onClick={() => submit(FAILURE_QUERY)}
          style={{
            minHeight: 44,
            background: "transparent",
            border: "1px solid rgba(107,114,128,0.3)",
            padding: "2px 8px",
            fontSize: 12,
            color: DEMO.ink,
            cursor: "pointer",
            fontFamily: DEMO.font.mono,
            letterSpacing: "0.04em",
          }}
          aria-label={`Grenzfall testen: ${FAILURE_QUERY}`}
        >
          &ldquo;{FAILURE_QUERY}&rdquo; testen &rarr;
        </button>
      </div>

      <div
        style={{
          borderTop: `1px solid ${DEMO.leinen}`,
          paddingTop: 10,
          display: "flex",
          gap: 6,
          minWidth: 0,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--color-brand-orange)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = DEMO.leinen;
          }}
          placeholder="Frag zum Beispielarchiv…"
          style={{
            flex: "1 1 0",
            minWidth: 0,
            minHeight: 44,
            background: DEMO.birke,
            border: `1px solid ${DEMO.leinen}`,
            padding: "9px 12px",
            fontSize: 13,
            fontFamily: "inherit",
            outline: "none",
            color: DEMO.ink,
            transition: reduced ? "none" : "border-color 150ms",
          }}
          aria-label="Frage an den Vertrags-Assistenten"
        />
        <button
          type="button"
          onClick={() => submit()}
          disabled={typing || !input.trim()}
          style={{
            minHeight: 44,
            background: "var(--color-brand-orange)",
            color: DEMO.kalk,
            border: "none",
            padding: "9px 12px",
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: typing || !input.trim() ? "not-allowed" : "pointer",
            opacity: typing || !input.trim() ? 0.5 : 1,
            flexShrink: 0,
            transition: reduced ? "none" : "opacity 150ms",
          }}
          aria-label="Frage senden"
        >
          Senden →
        </button>
      </div>
    </div>
  );
}

interface EnglishContractAnswer {
  readonly answer: string;
  readonly terms: readonly string[];
  readonly sources: readonly {
    readonly document: string;
    readonly section: string;
    readonly confidence: "high" | "medium" | "low";
  }[];
}

const CONTRACT_ANSWERS_EN: Readonly<Record<string, EnglishContractAnswer>> = {
  termination: {
    answer:
      "The fictional framework agreement sets three months' notice to the end of a quarter. A material breach can trigger extraordinary termination after the stated cure process.",
    terms: ["termination", "notice", "quarter end"],
    sources: [
      {
        document: "Sample framework agreement v3.2",
        section: "§12.3 Termination",
        confidence: "high",
      },
      {
        document: "Sample schedule B",
        section: "Clause 4",
        confidence: "medium",
      },
    ],
  },
  liability: {
    answer:
      "The fictional liability cap is three times the annual fee, subject to a maximum of EUR 500,000. The sample excludes indirect loss and does not apply the cap to intent or gross negligence.",
    terms: ["liability", "annual fee", "cap"],
    sources: [
      {
        document: "Sample framework agreement v3.2",
        section: "§14 Liability",
        confidence: "high",
      },
      {
        document: "Sample insurance note",
        section: "Policy 2026/04",
        confidence: "low",
      },
    ],
  },
  signature: {
    answer:
      "In the fictional signature policy, Role Alpha and Role Beta may sign individually. The sample power-of-attorney rule requires two signatories; agreements above EUR 250,000 require management approval.",
    terms: ["signature", "authority", "approval"],
    sources: [
      {
        document: "Sample signature policy v2",
        section: "Clause 3",
        confidence: "high",
      },
      {
        document: "Fictional register extract",
        section: "Entry 82104",
        confidence: "high",
      },
    ],
  },
};

const CONTRACT_QUESTIONS_EN = [
  ["termination", "What is the notice period?"],
  ["liability", "What liability cap applies?"],
  ["signature", "Who may sign the agreement?"],
] as const;

function answerForEnglishContract(query: string): EnglishContractAnswer | null {
  const value = query.toLowerCase();
  if (value.includes("terminat") || value.includes("notice"))
    return CONTRACT_ANSWERS_EN.termination;
  if (value.includes("liab") || value.includes("cap"))
    return CONTRACT_ANSWERS_EN.liability;
  if (value.includes("sign") || value.includes("author"))
    return CONTRACT_ANSWERS_EN.signature;
  return null;
}

function RagContractAssistantEnglish() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [answer, setAnswer] = useState<
    EnglishContractAnswer | null | undefined
  >(undefined);

  const runQuery = (value?: string) => {
    const next = (value ?? query).trim();
    if (!next) return;
    setSubmitted(next);
    setQuery("");
    setAnswer(answerForEnglishContract(next));
  };

  return (
    <div
      data-demo-id="rag-vertragsassistent"
      role="region"
      aria-label="Contract retrieval example"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: DEMO_HEIGHT,
        minWidth: 0,
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            color: "var(--color-brand-orange)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          Contract archive · deterministic retrieval
        </div>
        <h2
          style={{
            margin: "6px 0 0",
            fontSize: "clamp(20px, 4vw, 28px)",
            lineHeight: 1.08,
          }}
        >
          Answer from the archive.{" "}
          <span style={{ color: "var(--color-brand-orange)" }}>
            Show the source and the gap.
          </span>
        </h2>
        <p
          style={{
            margin: "8px 0 0",
            maxWidth: 760,
            color: DEMO.schiefer,
            fontSize: 12,
            lineHeight: 1.55,
          }}
        >
          Three fictional contract records are searched with fixed keyword rules
          in the browser. This is not legal advice and no model or document
          service is called.
        </p>
      </div>

      <div
        aria-label="Suggested contract questions"
        style={{ display: "flex", flexWrap: "wrap", gap: 7 }}
      >
        {CONTRACT_QUESTIONS_EN.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => runQuery(label)}
            style={{
              minHeight: 44,
              border: `1px solid ${DEMO.ink}`,
              background: DEMO.kalk,
              color: DEMO.ink,
              padding: "7px 10px",
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        style={{
          border: `1px solid ${DEMO.ink}`,
          background: DEMO.kalk,
          boxShadow: `3px 3px 0 ${DEMO.ink}`,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: DEMO.ink,
            color: DEMO.kalk,
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          <span style={{ color: "var(--color-brand-orange)" }}>
            Local sample index
          </span>
          <span>3 records · 14 sample clauses</span>
          <span style={{ marginLeft: "auto" }}>no external connection</span>
        </div>

        <div
          aria-live="polite"
          style={{
            minHeight: 310,
            padding: "clamp(14px, 4vw, 24px)",
            minWidth: 0,
          }}
        >
          {answer === undefined ? (
            <div
              style={{
                minHeight: 250,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                color: DEMO.schiefer,
                fontSize: 12,
              }}
            >
              Select a sample question or enter a contract term below.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              <div
                style={{
                  borderLeft: "3px solid var(--color-brand-orange)",
                  paddingLeft: 12,
                }}
              >
                <div
                  style={{
                    fontFamily: DEMO.font.mono,
                    fontSize: 12,
                    color: DEMO.schiefer,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  Query
                </div>
                <strong
                  style={{
                    display: "block",
                    marginTop: 4,
                    overflowWrap: "anywhere",
                  }}
                >
                  {submitted}
                </strong>
              </div>
              {answer ? (
                <>
                  <p
                    style={{
                      margin: 0,
                      maxWidth: 800,
                      fontSize: 14,
                      lineHeight: 1.65,
                    }}
                  >
                    {answer.answer}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {answer.terms.map((term) => (
                      <span
                        key={term}
                        style={{
                          border: "1px solid rgba(37,99,235,0.3)",
                          background: "rgba(37,99,235,0.07)",
                          color: "#1d4ed8",
                          padding: "3px 7px",
                          fontFamily: DEMO.font.mono,
                          fontSize: 12,
                        }}
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
                      gap: 8,
                    }}
                  >
                    {answer.sources.map((source) => (
                      <div
                        key={`${source.document}-${source.section}`}
                        style={{
                          minWidth: 0,
                          border: `1px solid ${DEMO.leinen}`,
                          background: DEMO.birke,
                          padding: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: 8,
                          }}
                        >
                          <strong
                            style={{ fontSize: 12, overflowWrap: "anywhere" }}
                          >
                            {source.document}
                          </strong>
                          <span
                            style={{
                              flexShrink: 0,
                              color:
                                source.confidence === "high"
                                  ? "#166534"
                                  : source.confidence === "medium"
                                    ? "#b45309"
                                    : "#b91c1c",
                              fontFamily: DEMO.font.mono,
                              fontSize: 12,
                              textTransform: "uppercase",
                            }}
                            // Locale parity with the German engine, which
                            // defines this metric beside its own chip: the
                            // label is a keyword-hit count, not a model score.
                            title="Confidence = overlap with query keywords found in the document"
                          >
                            {source.confidence}
                          </span>
                        </div>
                        <div
                          style={{
                            marginTop: 4,
                            color: DEMO.schiefer,
                            fontFamily: DEMO.font.mono,
                            fontSize: 12,
                          }}
                        >
                          {source.section}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div
                  role="alert"
                  style={{
                    border: "1px solid rgba(220,38,38,0.35)",
                    background: "rgba(220,38,38,0.05)",
                    padding: 14,
                  }}
                >
                  <strong>No supporting clause found.</strong>
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: 12,
                      lineHeight: 1.55,
                    }}
                  >
                    The sample archive cannot answer this query. Do not infer
                    authority or legal effect; inspect the governing documents
                    and route the question to legal review.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 7,
            borderTop: `1px solid ${DEMO.leinen}`,
            padding: 10,
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") runQuery();
            }}
            aria-label="Question for the contract archive"
            placeholder="Enter a contract term…"
            style={{
              flex: "1 1 220px",
              minWidth: 0,
              minHeight: 44,
              boxSizing: "border-box",
              border: `1px solid ${DEMO.leinen}`,
              background: DEMO.birke,
              color: DEMO.ink,
              padding: "9px 11px",
              font: "inherit",
              fontSize: 12,
            }}
          />
          <button
            type="button"
            disabled={!query.trim()}
            onClick={() => runQuery()}
            style={{
              minHeight: 44,
              border: `1px solid ${DEMO.ink}`,
              background: "var(--color-brand-orange)",
              color: "white",
              padding: "9px 14px",
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              fontWeight: 700,
              cursor: query.trim() ? "pointer" : "not-allowed",
              opacity: query.trim() ? 1 : 0.5,
            }}
          >
            Search sample archive
          </button>
          <button
            type="button"
            onClick={() => runQuery("Which rules govern foreign contracts?")}
            style={{
              minHeight: 44,
              border: `1px solid ${DEMO.ink}`,
              background: DEMO.kalk,
              color: DEMO.ink,
              padding: "9px 12px",
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Run no-match case
          </button>
        </div>
      </div>
    </div>
  );
}
