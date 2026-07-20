"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { AnimatePresence, m } from "framer-motion";
import {
  WindowBar,
  ChatBubble,
  SourceCitation,
  DemoOverline,
  renderBoldInline,
} from "./_shared";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";

/**
 * ChatDemo — RAG Vertrags-Assistent.
 *
 * Simulated contract-QA chat with a 4-stage retrieval pipeline visualization
 * (embed → vector → re-rank → answer). Questions hitting known patterns
 * return authored answers with source citations + confidence scores +
 * suggested follow-up queries.
 *
 * Provenance: first-party loehrning.ai implementation by Tim Löhr.
 * Ported 2026-04-21 to Tailwind + brand tokens + Framer Motion.
 * See: AI-native demo gallery implementation.
 */

interface Source {
  readonly title: string;
  readonly section: string;
  readonly confidence: number;
}

interface KnownAnswer {
  readonly answer: string;
  readonly sources: readonly Source[];
  readonly follow: readonly string[];
}

const KNOWN_ANSWERS: readonly {
  readonly patterns: readonly string[];
  readonly data: KnownAnswer;
}[] = [
  {
    patterns: ["kündigung", "kündigungsfrist"],
    data: {
      answer:
        "Die Kündigungsfrist beträgt **3 Monate zum Quartalsende**. Bei Laufzeiten unter 12 Monaten gilt eine verkürzte Frist von 4 Wochen. Eine außerordentliche Kündigung ist bei wesentlicher Vertragsverletzung jederzeit möglich.",
      sources: [
        {
          title: "Rahmenvereinbarung v3.2",
          section: "§12.3 Kündigung",
          confidence: 0.94,
        },
        { title: "RV-2026-003", section: "Anlage B, Abs. 4", confidence: 0.88 },
      ],
      follow: [
        "Gibt es Sonderkündigungsrechte?",
        "Welche Pflichten gelten während der Frist?",
      ],
    },
  },
  {
    patterns: ["sonderkündigung", "außerordentlich"],
    data: {
      answer:
        "Sonderkündigungsrechte bestehen bei: **(1)** Insolvenz des Vertragspartners, **(2)** wesentlicher Vertragsverletzung nach erfolgloser Abmahnung mit 14-Tage-Frist, **(3)** Force Majeure über 90 Tage. Die Kündigung muss schriftlich erfolgen.",
      sources: [
        {
          title: "Rahmenvereinbarung v3.2",
          section: "§12.5",
          confidence: 0.91,
        },
        {
          title: "AGB Projektverträge",
          section: "§8 Abs. 2",
          confidence: 0.83,
        },
      ],
      follow: ["Welche Pflichten gelten während der Kündigungsfrist?"],
    },
  },
  {
    patterns: ["haftung", "haftungsgrenze"],
    data: {
      answer:
        "Die Haftung ist auf das **3-fache des Jahreshonorars** begrenzt, maximal jedoch 500.000 EUR. Ausgeschlossen sind mittelbare Schäden und entgangener Gewinn. Bei Vorsatz und grober Fahrlässigkeit greift die Begrenzung nicht.",
      sources: [
        {
          title: "Rahmenvereinbarung v3.2",
          section: "§14 Haftung",
          confidence: 0.96,
        },
        {
          title: "D&O-Versicherung",
          section: "Police 2026/04",
          confidence: 0.71,
        },
      ],
      follow: [
        "Wer haftet bei Subunternehmern?",
        "Gibt es eine Cyber-Haftung?",
      ],
    },
  },
  {
    patterns: ["unterschr", "zeichnung", "signatur"],
    data: {
      answer:
        "Im ausdrücklich fiktiven Vertragsbeispiel sind **Rolle Alpha (Geschäftsführung)** und **Rolle Beta (Finanzen)** einzelvertretungsberechtigt. Kollektivzeichnung zu zweien gilt für die Beispiel-Prokura. Bei Verträgen über 250k EUR ist laut Beispieldokument die Unterschrift der Geschäftsführung erforderlich.",
      sources: [
        { title: "Handelsregister", section: "HRB 82104", confidence: 0.99 },
        {
          title: "Unterschriftenregelung v2",
          section: "Abs. 3",
          confidence: 0.89,
        },
      ],
      follow: ["Darf ein Prokurist alleine unterzeichnen?"],
    },
  },
];

const FALLBACK_ANSWER: KnownAnswer = {
  answer:
    "Ich habe zu dieser Frage keinen direkten Treffer in Ihrem Vertragsarchiv gefunden. Möchten Sie, dass ich **ähnliche Klauseln** vorschlage oder die Frage an Ihr Legal-Team weiterleite?",
  sources: [],
  follow: ["Was sind typische Klauseln?", "An Legal weiterleiten"],
};

const SUGGESTED: readonly string[] = [
  "Wie ist die Kündigungsfrist?",
  "Welche Haftungsgrenzen gelten?",
  "Wer darf unterzeichnen?",
  "Gibt es Sonderkündigungsrechte?",
];

const RETRIEVAL_STAGES: readonly {
  readonly stage: 1 | 2 | 3;
  readonly label: string;
  readonly detail: string;
}[] = [
  { stage: 1, label: "Anfrage auflösen", detail: "Suchbegriffe extrahieren" },
  {
    stage: 2,
    label: "8 Dokumente durchsuchen",
    detail: "Schlüsselbegriff-Abgleich",
  },
  { stage: 3, label: "Treffer ranken", detail: "Anzahl passender Begriffe" },
];

interface ChatMessage {
  readonly id: number;
  readonly role: "user" | "claude";
  readonly text: string;
  readonly sources?: readonly Source[];
  readonly follow?: readonly string[];
}

function findAnswer(q: string): KnownAnswer {
  const lowered = q.toLowerCase();
  for (const { patterns, data } of KNOWN_ANSWERS) {
    if (patterns.some((p) => lowered.includes(p))) return data;
  }
  return FALLBACK_ANSWER;
}

export function ChatDemo(): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [searchStage, setSearchStage] = useState<0 | 1 | 2 | 3>(0);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  /** Cleanup any in-flight timers on unmount. */
  useEffect(() => {
    const refs = timerRefs.current;
    return () => {
      refs.forEach(clearTimeout);
    };
  }, []);

  /** Auto-scroll to latest message. */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [messages, typing, searchStage, expanded]);

  function submit(text?: string) {
    const q = (text ?? input).trim();
    if (!q) return;
    setInput("");
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      text: q,
    };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);
    setSearchStage(1);

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scale = reducedMotion ? 0.2 : 1;

    timerRefs.current.push(
      setTimeout(() => setSearchStage(2), 350 * scale),
      setTimeout(() => setSearchStage(3), 700 * scale),
      setTimeout(() => {
        const a = findAnswer(q);
        setTyping(false);
        setSearchStage(0);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "claude",
            text: a.answer,
            sources: a.sources,
            follow: a.follow,
          },
        ]);
      }, 1200 * scale),
    );
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div
      className="flex h-[740px] flex-col overflow-hidden border border-border bg-background"
      role="region"
      aria-label="Praxisbeispiel: RAG-Vertragsassistent"
    >
      {/* Window chrome */}
      <WindowBar title="vertragsarchiv.internal / Assistant" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center bg-brand-orange text-[13px] font-bold tracking-[-0.02em] text-background">
            KI
          </div>
          <div>
            <div className="text-[15px] font-bold tracking-[-0.02em] text-foreground">
              Vertrags-Assistent
            </div>
            <div className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
              Keyword-Suche · 8 Beispieldokumente
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 border border-[#22c55e]/40 bg-[#22c55e]/10 px-2 py-0.5 text-[11px] text-[#22c55e]">
          <span
            className="h-1.5 w-1.5 rounded-full bg-[#22c55e]"
            aria-hidden="true"
          />
          Online
        </span>
      </div>

      {/* Message scrollback */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto p-4 md:p-5"
      >
        {messages.length === 0 && !typing && (
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
            <div
              className="mb-4 h-[3px] w-[154px] bg-brand-orange"
              aria-hidden="true"
            />
            <DemoOverline>Retrieval Augmented Generation</DemoOverline>
            <h3 className="mt-2.5 max-w-[460px] text-[24px] font-bold leading-[1.1] tracking-[-0.03em] text-foreground md:text-[28px]">
              Fragen Sie Ihre Verträge.{" "}
              <span className="text-brand-orange">Antworten mit Quelle.</span>
            </h3>
            <p className="mt-3 max-w-[420px] text-[13.5px] leading-[1.5] text-muted-foreground">
              Jede Antwort verweist auf Beispielquellen. Kein Rechtsrat, keine
              Garantie auf Vollständigkeit.
            </p>
            <div className="mt-6 grid w-full max-w-[480px] grid-cols-1 gap-1.5 md:grid-cols-2">
              {SUGGESTED.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => submit(s)}
                  className={cn(
                    "border border-border bg-card/60 px-3 py-2.5 text-left text-[12px] transition-[background-color,border-color,color,opacity,transform,box-shadow]",
                    "hover:border-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--color-foreground)]",
                  )}
                >
                  <span className="mr-1.5 font-bold text-brand-orange">→</span>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isLast = idx === messages.length - 1;
            if (msg.role === "user") {
              return (
                <m.div
                  key={msg.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                >
                  <ChatBubble role="user">{msg.text}</ChatBubble>
                </m.div>
              );
            }
            return (
              <m.div
                key={msg.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                className="max-w-[92%] space-y-2.5"
              >
                <DemoOverline>
                  ⎯ Claude · {msg.sources?.length ?? 0} Quellen
                </DemoOverline>
                <ChatBubble role="claude">
                  {renderBoldInline(msg.text)}
                </ChatBubble>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((e) => ({ ...e, [msg.id]: !e[msg.id] }))
                      }
                      className="inline-flex items-center gap-2 border border-border bg-transparent px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                      aria-expanded={!!expanded[msg.id]}
                    >
                      {expanded[msg.id] ? "▼" : "▶"} {msg.sources.length}{" "}
                      Quellen zeigen
                    </button>
                    {expanded[msg.id] && (
                      <div className="grid gap-1.5 pt-1">
                        {msg.sources.map((s, i) => (
                          <SourceCitation
                            key={i}
                            index={i}
                            title={s.title}
                            section={s.section}
                            confidence={s.confidence}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {msg.follow && isLast && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.follow.map((f, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => submit(f)}
                        className="border border-brand-orange bg-transparent px-2.5 py-1.5 text-[12px] font-semibold text-brand-orange transition-colors hover:bg-brand-orange hover:text-white"
                      >
                        {f} →
                      </button>
                    ))}
                  </div>
                )}
              </m.div>
            );
          })}
        </AnimatePresence>

        {typing && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-l-[3px] border-brand-orange bg-card/60 p-3"
          >
            <DemoOverline>⎯ Claude · sucht</DemoOverline>
            <div className="mt-2 flex flex-col gap-1.5">
              {RETRIEVAL_STAGES.map((s) => {
                const done = searchStage > s.stage;
                const active = searchStage === s.stage;
                return (
                  <div
                    key={s.stage}
                    className={cn(
                      "flex items-center gap-2.5 transition-opacity duration-200",
                      active || done ? "opacity-100" : "opacity-30",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-2.5 w-2.5 transition-colors",
                        done
                          ? "bg-[#22c55e]"
                          : active
                            ? "animate-pulse bg-brand-orange"
                            : "bg-border",
                      )}
                      aria-hidden="true"
                    />
                    <span className="text-[12px] font-semibold text-foreground">
                      {s.label}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                      {s.detail}
                    </span>
                  </div>
                );
              })}
            </div>
          </m.div>
        )}
      </div>

      {/* Composer */}
      <div className="flex gap-2 border-t border-border p-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          maxLength={500}
          placeholder="Fragen Sie zu Ihren Verträgen…"
          className="flex-1 border border-border bg-card/40 px-3.5 py-2.5 text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange"
          aria-label="Frage eingeben"
        />
        <button
          type="button"
          onClick={() => submit()}
          className="bg-brand-orange px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-brand-amber"
        >
          Senden →
        </button>
      </div>
    </div>
  );
}

export default ChatDemo;
