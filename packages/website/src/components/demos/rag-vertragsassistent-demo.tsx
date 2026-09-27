"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { DEMO } from "@/lib/demo-tokens";
import { DEMO_HEIGHT, usePrefersReducedMotion, useSmUp } from "./demo-utils";
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

// The chat opens on one answered exchange (final state first) instead of an
// empty "ask something" screen. It is the same keyword answer a click on the
// first suggestion produces.
const EXAMPLE_QUERY = CHAT_SUGGESTED[0];
const EXAMPLE_ANSWER = CHAT_Q["kuendigung|kuendigungsfrist|kündigung|kündigungsfrist"];
const INITIAL_MESSAGES: readonly Message[] = [
  { role: "user", text: EXAMPLE_QUERY, id: 1 },
  {
    role: "assistant",
    text: EXAMPLE_ANSWER.answer,
    sources: EXAMPLE_ANSWER.sources,
    follow: EXAMPLE_ANSWER.follow,
    matchedTerms: EXAMPLE_ANSWER.matchedTerms,
    isEmpty: false,
    queryContext: EXAMPLE_QUERY,
    id: 2,
  },
];

/**
 * Chip classes for the suggestion rail and the follow-ups: 44px targets,
 * 14px text below sm (12px from sm up, as before), square, ink on hover.
 */
const SUGGESTION_CHIP_CLASS =
  "inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap border px-2.5 text-left text-[14px] leading-tight transition-colors duration-150 motion-reduce:transition-none sm:shrink sm:whitespace-normal sm:text-[12px]";

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
  // One accent: ink for a strong match, Schiefer for a medium one, Mennige
  // only for the weak match a reader should question.
  hoch: { label: "Hoch", color: "#121212", bg: "transparent" },
  mittel: { label: "Mittel", color: "#4f4640", bg: "transparent" },
  niedrig: { label: "Niedrig", color: "var(--color-brand-orange)", bg: "transparent" },
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
            ...DEMO.label,
            padding: "2px 6px",
            color: cfg.color,
            background: cfg.bg,
            border: "1px solid currentColor",
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
          ...DEMO.label,
          color: "#4f4640",
          marginTop: 2,
        }}
      >
        Konfidenz
      </span>
    </div>
  );
}

/** The Konfidenz definition, shown beside the terms (sm up) and the sources. */
const KONFIDENZ_DEFINITION = "Konfidenz = Anzahl Treffer";

function MatchedTermsPanel({ terms }: { terms: readonly string[] }) {
  if (terms.length === 0) return null;
  return (
    // One unboxed caption line at every width, "Treffer: A · B · C" below
    // sm and the full label from sm up, wrapping between terms. It sits
    // under the answer sheet, not in a second box beside it. The Konfidenz
    // definition also sits in the title and in the expanded sources.
    <div
      className="text-[13px] [overflow-wrap:anywhere] sm:text-[12px]"
      title={`${KONFIDENZ_DEFINITION} im Dokument`}
      data-rag-matched-terms
      style={{
        marginTop: 6,
        fontFamily: "var(--font-geist-mono, ui-monospace, monospace)",
      }}
    >
      <span
        style={{
          ...DEMO.label,
          color: "#4f4640",
        }}
      >
        <span className="sm:hidden">Treffer: </span>
        {/* Carries the definition the shell badge cannot: this engine's
            "Konfidenz" is a keyword-hit count, not a model score. */}
        <span className="max-sm:hidden">
          Gefundene Schlüsselwörter ({KONFIDENZ_DEFINITION}):{" "}
        </span>
      </span>
      {terms.map((term, i) => (
        <Fragment key={term}>
          {i > 0 ? (
            <span style={{ color: "#4f4640" }}>{" · "}</span>
          ) : null}
          <b style={{ color: DEMO.ink, fontWeight: 700 }}>{term}</b>
        </Fragment>
      ))}
    </div>
  );
}

function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((c, i) =>
    c.startsWith("**") ? (
      <strong key={i} style={{ color: DEMO.ink }}>
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
  const [msgs, setMsgs] = useState<readonly Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [expanded, setExpanded] = useState<Readonly<Record<number, boolean>>>(
    {},
  );
  const [searchStage, setSearchStage] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();
  // Below sm the follow-ups join the one rail above the input instead of
  // wrapping under the answer, so each chip still exists once.
  const smUp = useSmUp();

  // Follow the newest message, but leave the opening example at its top:
  // the question stays in view on first paint.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || (msgs === INITIAL_MESSAGES && !typing)) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: reduced ? "auto" : "smooth",
    });
  }, [msgs, typing, searchStage, reduced]);

  // Suggestions not asked yet and not already offered as follow-ups.
  const asked = new Set(
    msgs.filter((m) => m.role === "user").map((m) => m.text),
  );
  const lastFollow = new Set(msgs.at(-1)?.follow ?? []);
  const railSuggestions = CHAT_SUGGESTED.filter(
    (q) => !asked.has(q) && !lastFollow.has(q),
  );
  const railFollowUps = smUp || typing ? [] : [...lastFollow];
  const sendDisabled = typing || !input.trim();

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
      // The engine is as tall as its content at every width: no fixed frame
      // height that the chat log stretches into, so the suggestion rail sits
      // right under the conversation instead of below a dead gap. Below sm
      // there is no inner scroll box either, so the page scrolls once.
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
      }}
    >
      {/* The page H1 and lead name the demo; this heading only gives
          screen-reader users a landmark into the instrument. */}
      <h2 className="sr-only">Vertragsassistent: Fragen an das Beispielarchiv</h2>
      {/* Below sm the page H1 already names the assistant, so the avatar
          row gives its height to the conversation. */}
      <div
        className="flex max-sm:hidden"
        data-rag-header
        style={{
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
              background: DEMO.ink,
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
                letterSpacing: "-0.01em",
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
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Keyword-Suche · 6 Beispieldokumente
            </div>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-none sm:max-h-[400px] sm:min-h-[280px]"
        data-rag-chat-log
        style={{
          overflowY: "auto",
          overflowWrap: "anywhere",
          padding: "12px 4px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* What the answers below can and cannot do, said once above the
            conversation that opens with a worked example. */}
        <p
          className="text-caption"
          style={{ margin: 0, color: DEMO.schiefer, maxWidth: 520 }}
        >
          Die Suche vergleicht nur Schlüsselwörter und kann Treffer übersehen.
        </p>
        {msgs.map((m, idx) =>
          m.role === "user" ? (
            <div
              key={m.id}
              style={{ display: "flex", justifyContent: "flex-end" }}
            >
              <div
                className="text-[14px] sm:text-[13px]"
                style={{
                  maxWidth: "85%",
                  background: DEMO.ink,
                  color: DEMO.kalk,
                  padding: "9px 13px",
                  lineHeight: 1.55,
                  wordBreak: "break-word",
                }}
              >
                {m.text}
              </div>
            </div>
          ) : (
            <div
              key={m.id}
              className="max-sm:max-w-full sm:max-w-[85%]"
              style={{ minWidth: 0 }}
            >
              <div
                style={{
                  ...DEMO.label,
                  color: "#4f4640",
                  marginBottom: 4,
                }}
              >
                {m.isEmpty
                  ? "Kein Treffer"
                  : `Keyword-Suche · ${m.sources?.length ?? 0} Quellen`}
              </div>
              <div
                className="text-[14px] sm:text-[13px]"
                style={{
                  // An answer is an ink-framed sheet; "no match" is dashed
                  // (a known gap). No coloured left rule.
                  background: m.isEmpty ? "transparent" : DEMO.birke,
                  padding: "11px 13px",
                  lineHeight: 1.6,
                  border: `1px ${m.isEmpty ? "dashed" : "solid"} ${m.isEmpty ? "#4f4640" : DEMO.ink}`,
                  wordBreak: "break-word",
                  color: m.isEmpty ? "#4f4640" : "inherit",
                }}
              >
                {m.isEmpty
                  ? "Keine Übereinstimmung gefunden, das System kann hier keine Antwort verankern. Kein Dokument im Beispielarchiv enthält ausreichend passende Schlüsselbegriffe für diese Anfrage."
                  : renderBold(m.text ?? "")}
              </div>
              {/* Below sm the first Fundstelle sits right under the answer as
                  one caption line; the full list stays behind the link. */}
              {m.sources && m.sources.length > 0 && !expanded[m.id] ? (
                <p
                  className="text-[13px] sm:hidden"
                  data-rag-inline-source
                  style={{ margin: "6px 0 0", color: "#4f4640", lineHeight: 1.45 }}
                >
                  {`Quelle: ${m.sources[0].t}, ${m.sources[0].s}`}
                </p>
              ) : null}
              {!m.isEmpty && m.matchedTerms && m.matchedTerms.length > 0 && (
                <MatchedTermsPanel terms={m.matchedTerms} />
              )}
              {m.sources && m.sources.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  {/* A plain text link at every width, not a box under the
                      answer box. */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((e) => ({ ...e, [m.id]: !e[m.id] }))
                    }
                    aria-expanded={!!expanded[m.id]}
                    aria-label={`${expanded[m.id] ? "Quellen ausblenden" : `Alle ${m.sources.length} Quellen`}: zur Antwort auf „${m.queryContext}“`}
                    className="inline-flex min-h-11 items-center gap-1.5 border-0 bg-transparent p-0 underline decoration-[#4f4640]/50 underline-offset-4 hover:decoration-[#0B0908]"
                    style={{
                      ...DEMO.label,
                      cursor: "pointer",
                      color: DEMO.schiefer,
                    }}
                  >
                    <span aria-hidden="true" className="max-sm:hidden">
                      {expanded[m.id] ? "−" : "+"}
                    </span>
                    {expanded[m.id]
                      ? "Quellen ausblenden"
                      : `Alle ${m.sources.length} Quellen`}
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
                      <p
                        className="text-caption"
                        style={{ margin: 0, color: "#4f4640" }}
                      >
                        {KONFIDENZ_DEFINITION} im Dokument.
                      </p>
                      {m.sources.map((s, i) => {
                        const parText = s.s.split("·")[0]?.trim() ?? s.s;
                        return (
                          <div
                            key={i}
                            style={{
                              // A hairline-ruled list row, not a card: the
                              // answer sheet stays the only box.
                              display: "flex",
                              alignItems: "stretch",
                              gap: 8,
                              borderTop: `1px solid ${DEMO.leinen}`,
                              padding: "7px 0",
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                width: 22,
                                flexShrink: 0,
                                background: "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: DEMO.font.mono,
                                fontSize: 12,
                                fontWeight: 700,
                                color: DEMO.ink,
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
                                  fontFamily: DEMO.font.mono,
                                  fontSize: 12,
                                  color: DEMO.schiefer,
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
              {m.follow && idx === msgs.length - 1 && smUp && (
                // Follow-ups are underlined text actions, not bordered chips:
                // they sit beside the answer sheet, and a box never sits in
                // a box. Each keeps its 44px target.
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    columnGap: 18,
                    marginTop: 2,
                  }}
                >
                  {m.follow.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => submit(f)}
                      className="inline-flex min-h-11 items-center text-[14px] underline decoration-[#0B0908]/40 underline-offset-4 hover:decoration-[#0B0908] sm:text-[12px]"
                      style={{
                        background: "transparent",
                        border: 0,
                        color: DEMO.ink,
                        padding: 0,
                        lineHeight: 1.3,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontWeight: 600,
                        textAlign: "left",
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
                ...DEMO.label,
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
                color: "var(--color-muted-foreground)",
              }}
              aria-live="polite"
            >
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  border: `1px dashed ${DEMO.ink}`,
                }}
              />
              Simuliertes Retrieval · durchsucht Beispielarchiv…
            </div>
            <div
              style={{
                background: DEMO.birke,
                padding: "10px 12px",
                border: `1px dashed ${DEMO.ink}`,
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
                      label: "6 Dokumente durchsuchen",
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
                            ? DEMO.ink
                            : searchStage === s.stage
                              ? DEMO.ink
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

      {/* One rail above the input. Below sm it holds the follow-ups, then
          the questions not asked yet, then the Grenzfall (no document
          matches) as the last, dashed chip, all in one hairline style that
          scrolls sideways under a 24px fade. From sm up the follow-ups stay
          under the answer and the rail wraps at 12px, as before. */}
      <div
        aria-label="Weitere Beispielfragen"
        role="group"
        data-rag-rail
        className="flex gap-1.5 overflow-x-auto pb-2 pt-1 [scrollbar-width:none] max-sm:pr-6 max-sm:[mask-image:linear-gradient(to_right,#000_calc(100%-24px),transparent)] sm:flex-wrap sm:overflow-visible"
        style={{ overscrollBehaviorX: "contain" }}
      >
        {[...railFollowUps, ...railSuggestions].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => submit(q)}
            className={`${SUGGESTION_CHIP_CLASS} border-[#E3DFD6] bg-[#F7F4ED] hover:border-[#0B0908] hover:bg-[#F3F0E9] max-sm:bg-transparent`}
            style={{ minHeight: 44, color: DEMO.ink, fontFamily: "inherit", cursor: "pointer" }}
          >
            <span aria-hidden className="max-sm:hidden" style={{ fontWeight: 700 }}>
              →
            </span>
            {q}
          </button>
        ))}
        <button
          type="button"
          onClick={() => submit(FAILURE_QUERY)}
          className={`${SUGGESTION_CHIP_CLASS} border-dashed border-[#4f4640] bg-transparent hover:border-[#0B0908]`}
          style={{ minHeight: 44, color: DEMO.ink, fontFamily: "inherit", cursor: "pointer" }}
        >
          {/* The visible text is the accessible name (no aria-label), so a
              real space keeps "Grenzfall: …" identical for both. */}
          <span style={{ fontWeight: 600, color: "#4f4640" }}>Grenzfall:</span>{" "}
          {FAILURE_QUERY}
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
          // 16px below lg: iOS (phone and iPad) zooms into any focused field under 16px.
          className="text-base lg:text-[13px]"
          style={{
            flex: "1 1 0",
            minWidth: 0,
            minHeight: 44,
            background: DEMO.birke,
            border: `1px solid ${DEMO.leinen}`,
            padding: "9px 12px",
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
          disabled={sendDisabled}
          style={{
            ...DEMO.label,
            minHeight: 44,
            // Enabled: a solid ink button (the page's one Mennige button is
            // the course link). Disabled: the same ink outline at reduced
            // opacity, a faint frame rather than a grey block; disabled
            // controls are exempt from contrast minimums, and the enabled
            // ink edge on paper is far above 3:1.
            background: sendDisabled ? "transparent" : DEMO.ink,
            color: sendDisabled ? DEMO.ink : DEMO.kalk,
            border: `1px solid ${DEMO.ink}`,
            padding: "9px 12px",
            cursor: sendDisabled ? "not-allowed" : "pointer",
            opacity: sendDisabled ? 0.4 : 1,
            flexShrink: 0,
            transition: reduced ? "none" : "opacity 150ms, background 150ms",
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
      {
        document: "Sample project terms",
        section: "§8(2) Extraordinary termination",
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
  // Opens on one answered sample question (final state first), the same
  // answer the first question chip returns.
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState<string>(
    CONTRACT_QUESTIONS_EN[0][1],
  );
  const [answer, setAnswer] = useState<
    EnglishContractAnswer | null | undefined
  >(CONTRACT_ANSWERS_EN.termination);

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
        {/* The page H1 and lead name the demo; this heading only gives
          screen-reader users a landmark into the instrument. */}
        <h2 className="sr-only">Contract assistant: questions to the sample archive</h2>
        <p className="text-caption text-muted-foreground" style={{ margin: 0, maxWidth: 720 }}>
          Six fictional company documents are searched with fixed keyword rules
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
            className="text-[14px] sm:text-[12px]"
            style={{
              minHeight: 44,
              border: `1px solid ${DEMO.ink}`,
              background: DEMO.kalk,
              color: DEMO.ink,
              padding: "7px 10px",
              fontFamily: DEMO.font.mono,
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
          minWidth: 0,
        }}
      >
        <div
          style={{
            ...DEMO.label,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: DEMO.ink,
            color: DEMO.kalk,
          }}
        >
          <span style={{ fontWeight: 700 }}>Local sample index</span>
          <span>6 sample documents</span>
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
                  borderTop: `2px solid ${DEMO.ink}`,
                  paddingTop: 8,
                }}
              >
                <div
                  style={{
                    ...DEMO.label,
                    color: DEMO.schiefer,
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
                          border: `1px solid ${DEMO.leinen}`,
                          background: DEMO.birke,
                          color: DEMO.ink,
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
                              ...DEMO.label,
                              flexShrink: 0,
                              color:
                                source.confidence === "high"
                                  ? "#121212"
                                  : source.confidence === "medium"
                                    ? "#4f4640"
                                    : "var(--color-brand-orange)",
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
                    border: "1px dashed #4f4640",
                    background: "transparent",
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
            // 16px below lg: iOS (phone and iPad) zooms into any focused field under 16px.
            className="text-base lg:text-[12px]"
            style={{
              flex: "1 1 220px",
              minWidth: 0,
              minHeight: 44,
              boxSizing: "border-box",
              border: `1px solid ${DEMO.leinen}`,
              background: DEMO.birke,
              color: DEMO.ink,
              padding: "9px 11px",
              fontFamily: "inherit",
            }}
          />
          <button
            type="button"
            disabled={!query.trim()}
            onClick={() => runQuery()}
            style={{
              minHeight: 44,
              border: `1px solid ${DEMO.ink}`,
              background: DEMO.ink,
              color: DEMO.kalk,
              padding: "9px 14px",
              ...DEMO.label,
              cursor: query.trim() ? "pointer" : "not-allowed",
              opacity: query.trim() ? 1 : 0.5,
            }}
          >
            Search sample archive
          </button>
          <button
            type="button"
            onClick={() => runQuery("Which rules govern foreign contracts?")}
            className="text-[14px] sm:text-[12px]"
            style={{
              minHeight: 44,
              border: `1px solid ${DEMO.ink}`,
              background: DEMO.kalk,
              color: DEMO.ink,
              padding: "9px 12px",
              fontFamily: DEMO.font.mono,
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
