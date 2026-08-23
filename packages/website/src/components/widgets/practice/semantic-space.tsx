"use client";

import { useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "../tier-a/_frame";

/**
 * SemanticSpace, words live in a 2D meaning map; related words sit near each
 * other. This widget is deliberately local-only: a deterministic heuristic
 * places a word near a keyword-matched seed. It neither calls a provider nor
 * claims to calculate model embeddings.
 *
 * Ported from `claude/js/widgets.js:497` (SemanticSpace). Default vocabulary
 * is German Mittelstand (Technik / Vertrieb / Werkstatt / Verwaltung); the
 * cluster ids themselves stay German internally (they are never displayed),
 * but `seed`, `clusterKeywords`, `quadrantLabels`, and `copy` are all
 * additive, default-preserving override props; the claude
 * course wires its own English seed points and keyword lists so the
 * offline-heuristic MATCHING logic, not just the display labels, works
 * correctly for English words a learner types.
 */

export type Cluster =
  "technik" | "vertrieb" | "werkstatt" | "verwaltung" | "user";

export interface Point {
  readonly w: string;
  readonly x: number;
  readonly y: number;
  readonly cluster: Cluster;
  readonly why?: string;
  readonly near?: string;
}

export interface QuadrantLabel {
  readonly label: string;
  readonly x: number;
  readonly y: number;
}

const SEED: readonly Point[] = [
  { w: "Datenbank", x: 0.1, y: 0.16, cluster: "technik" },
  { w: "Server", x: 0.22, y: 0.12, cluster: "technik" },
  { w: "Schnittstelle", x: 0.1, y: 0.36, cluster: "technik" },
  { w: "Angebot", x: 0.72, y: 0.14, cluster: "vertrieb" },
  { w: "Kunde", x: 0.86, y: 0.22, cluster: "vertrieb" },
  { w: "Abschluss", x: 0.7, y: 0.38, cluster: "vertrieb" },
  { w: "Fräse", x: 0.12, y: 0.78, cluster: "werkstatt" },
  { w: "Schraube", x: 0.24, y: 0.9, cluster: "werkstatt" },
  { w: "Montage", x: 0.1, y: 0.92, cluster: "werkstatt" },
  { w: "Rechnung", x: 0.62, y: 0.76, cluster: "verwaltung" },
  { w: "Lohn", x: 0.78, y: 0.86, cluster: "verwaltung" },
  { w: "Ablage", x: 0.6, y: 0.92, cluster: "verwaltung" },
];

const CLUSTER_COLOR: Record<Cluster, string> = {
  technik: "#3b82f6",
  vertrieb: "#10b981",
  werkstatt: "#a16207",
  verwaltung: "#7c3aed",
  user: "#f97316",
};

const CLUSTER_KEYWORDS: Record<Exclude<Cluster, "user">, readonly string[]> = {
  technik: ["daten", "server", "schnitt", "api", "code", "software", "system"],
  vertrieb: ["angebot", "kunde", "abschluss", "verkauf", "preis", "umsatz"],
  werkstatt: ["fräse", "schraube", "montage", "werkzeug", "maschine", "bohr"],
  verwaltung: ["rechnung", "lohn", "ablage", "buchhaltung", "akte", "antrag"],
};

const DEFAULT_QUADRANT_LABELS: readonly QuadrantLabel[] = [
  { label: "Technik", x: 14, y: 4 },
  { label: "Vertrieb", x: 80, y: 4 },
  { label: "Werkstatt", x: 14, y: 70 },
  { label: "Verwaltung", x: 62, y: 70 },
];

export interface SemanticSpaceCopy {
  readonly kindLabel: string;
  readonly canvasAriaLabel: string;
  readonly placeholder: string;
  readonly inputAriaLabel: string;
  readonly placingLabel: string;
  readonly placeLabel: string;
  readonly landedNearText: string;
  readonly emptyStatusText: string;
  /** `{cluster}` is replaced with the matched cluster id. */
  readonly nearPlacedTemplate: string;
  /** `{cluster}` is replaced with the matched cluster id. */
  readonly heuristicTemplate: string;
}

const DEFAULT_COPY: SemanticSpaceCopy = {
  kindLabel: "Bedeutungsraum",
  canvasAriaLabel: "Bedeutungsraum mit platzierten Wörtern",
  placeholder: "Versuch: Lieferung, Datenschutz, Drehbank …",
  inputAriaLabel: "Neues Wort",
  placingLabel: "Platziere …",
  placeLabel: "Einordnen",
  landedNearText: "landete nahe",
  emptyStatusText: "Wirf ein Wort ein und sieh, wo es landet.",
  nearPlacedTemplate: 'Nahe an "{cluster}" platziert (Stichwort-Treffer).',
  heuristicTemplate:
    'Ohne Live-Modus heuristisch in den Bereich "{cluster}" gelegt.',
};

const DEFAULT_CLUSTER_LABELS: Record<Exclude<Cluster, "user">, string> = {
  technik: "technik",
  vertrieb: "vertrieb",
  werkstatt: "werkstatt",
  verwaltung: "verwaltung",
};

function fillCluster(template: string, clusterLabel: string): string {
  return template.replace("{cluster}", clusterLabel);
}

/** Deterministic offline placement: nearest cluster by keyword overlap. */
function localPlace(
  word: string,
  seed: readonly Point[],
  clusterKeywords: Record<Exclude<Cluster, "user">, readonly string[]>,
  clusterLabels: Record<Exclude<Cluster, "user">, string>,
  copy: SemanticSpaceCopy,
): Point {
  const lower = word.toLowerCase();
  const clusterIds = Object.keys(clusterKeywords) as Exclude<Cluster, "user">[];
  let best: Exclude<Cluster, "user"> = clusterIds[clusterIds.length - 1];
  let bestHits = -1;
  for (const cluster of clusterIds) {
    const hits = clusterKeywords[cluster].filter((k) =>
      lower.includes(k),
    ).length;
    if (hits > bestHits) {
      bestHits = hits;
      best = cluster;
    }
  }
  const anchors = seed.filter((p) => p.cluster === best);
  const cx = anchors.reduce((s, p) => s + p.x, 0) / anchors.length;
  const cy = anchors.reduce((s, p) => s + p.y, 0) / anchors.length;
  // Small deterministic jitter from the word length so repeats do not stack.
  const jitter = ((word.length % 7) - 3) / 40;
  return {
    w: word,
    x: Math.max(0.05, Math.min(0.95, cx + jitter)),
    y: Math.max(0.05, Math.min(0.95, cy - jitter)),
    cluster: "user",
    near: anchors[0]?.w,
    why:
      bestHits > 0
        ? fillCluster(copy.nearPlacedTemplate, clusterLabels[best])
        : fillCluster(copy.heuristicTemplate, clusterLabels[best]),
  };
}

export interface SemanticSpaceWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly title?: string;
  readonly scenario?: string;
  /** Override the default German seed points. */
  readonly seed?: readonly Point[];
  /** Override the default German keyword-matching lists (functional, not just cosmetic). */
  readonly clusterKeywords?: Record<
    Exclude<Cluster, "user">,
    readonly string[]
  >;
  /** Override the human-readable cluster names interpolated into the "why" text. */
  readonly clusterLabels?: Record<Exclude<Cluster, "user">, string>;
  /** Override the default German quadrant overlay labels. */
  readonly quadrantLabels?: readonly QuadrantLabel[];
  readonly copy?: Partial<SemanticSpaceCopy>;
}

export function SemanticSpaceWidget({
  lessonId,
  cpId,
  title = "Bedeutung lebt im Raum",
  scenario = "Claude stellt Wörter als Vektoren dar. Verwandte Wörter liegen nah beieinander. Wirf ein Wort ein.",
  seed = SEED,
  clusterKeywords = CLUSTER_KEYWORDS,
  clusterLabels = DEFAULT_CLUSTER_LABELS,
  quadrantLabels = DEFAULT_QUADRANT_LABELS,
  copy,
}: SemanticSpaceWidgetProps): JSX.Element {
  const chrome = { ...DEFAULT_COPY, ...copy };
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [points, setPoints] = useState<readonly Point[]>(seed);
  const [input, setInput] = useState("");
  const [highlight, setHighlight] = useState<string | null>(null);
  const place = () => {
    const word = input.trim();
    if (!word) return;

    const next = localPlace(word, seed, clusterKeywords, clusterLabels, chrome);

    setPoints((prev) => [...prev, next]);
    setHighlight(word);
    setInput("");
    complete();
  };

  const highlighted = points.find((p) => p.w === highlight);

  return (
    <WidgetFrame
      kindLabel={chrome.kindLabel}
      title={title}
      scenario={scenario}
      done={done}
      xpLabel="+15 XP"
    >
      <div
        className="relative w-full overflow-hidden rounded-lg border-2 border-border bg-card/40"
        style={{ aspectRatio: "5 / 3" }}
        aria-label={chrome.canvasAriaLabel}
        role="img"
      >
        {quadrantLabels.map((q) => (
          <span
            key={q.label}
            className="pointer-events-none absolute select-none font-mono text-[10px] font-semibold uppercase tracking-[0.16em] opacity-50"
            style={{ left: `${q.x}%`, top: `${q.y}%` }}
          >
            {q.label}
          </span>
        ))}
        {points.map((p, i) => {
          const isUser = p.cluster === "user";
          const color = CLUSTER_COLOR[p.cluster];
          return (
            <span
              key={`${p.w}-${i}`}
              title={p.why ?? p.cluster}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[12px]",
                isUser ? "font-bold" : "font-normal",
                highlight === p.w && "ring-2 ring-brand-orange ring-offset-1",
              )}
              style={{
                left: `${p.x * 100}%`,
                top: `${p.y * 100}%`,
                borderColor: color,
                color: isUser ? "var(--color-foreground)" : color,
                background: isUser
                  ? "rgba(249,115,22,0.15)"
                  : "var(--color-background)",
              }}
            >
              {p.w}
            </span>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              place();
            }
          }}
          placeholder={chrome.placeholder}
          aria-label={chrome.inputAriaLabel}
          className="min-w-0 flex-1 border-2 border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
        />
        <button
          type="button"
          onClick={place}
          disabled={!input.trim()}
          className={cn(
            "w-full border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-foreground shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0 sm:w-auto sm:shrink-0",
          )}
        >
          {chrome.placeLabel}
        </button>
      </div>

      <div
        role="status"
        className="mt-3 min-h-[44px] border-2 border-border bg-background px-3 py-2 text-[13px] leading-[1.5] text-foreground"
      >
        {highlighted?.why ? (
          <span>
            <span className="font-semibold">{highlighted.w}</span>
            {highlighted.near ? (
              <>
                {" "}
                {chrome.landedNearText}{" "}
                <span className="font-semibold">{highlighted.near}</span>.{" "}
              </>
            ) : (
              ". "
            )}
            {highlighted.why}
          </span>
        ) : (
          <span className="italic text-muted-foreground">
            {chrome.emptyStatusText}
          </span>
        )}
      </div>
    </WidgetFrame>
  );
}

export default SemanticSpaceWidget;
