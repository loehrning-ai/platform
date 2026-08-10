"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
  type KeyboardEvent,
} from "react";
// Scoped domMax load (performance hardening): the trace pulse uses `layoutId`
// (shared-element transition between nodes), which needs the projection
// engine from domMax, so this widget owns the required feature bundle.
// This widget is only ever loaded through the registry's dynamic import, so
// the static domMax bundle stays confined to the already-lazy widget chunk
// and never touches a route's First Load JS.
import { LazyMotion, domMax, m, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "./tier-a/_frame";

/**
 * InteractiveDiagram — reusable, course-agnostic diagram primitive
 * (shared course architecture). A React-idiomatic distillation of the GitHub course
 * canvas widgets:
 *   - `stack`   ← `data-infrastructure/js/data-widgets.js:47` (StackFlow): a
 *     vertical stack the learner can "trace" a pulse through, top to bottom.
 *   - `flow`    ← same source, but the pulse travels along explicit edges
 *     (left-to-right or branching steps) instead of a strict vertical stack.
 *   - `compare` ← `data-engineering-fundamentals/.../Ch0_StackSims.js:12`
 *     (LayerCake): a hover-to-inspect layered stack where each node carries a
 *     detail panel (what it does, its obligation, the "if absent" consequence).
 *
 * Why a rewrite and not a 1:1 port: the originals are imperative
 * `<canvas>` + unbounded requestAnimationFrame loops with a dark palette and a
 * global `window.Progress`. This monorepo is React 19 + Tailwind v4 + the
 * unified `useCheckpoint` store + CI v3.0 light palette. The teaching idea
 * (hover a layer to learn it, trace a pulse to feel the order, earn the
 * checkpoint once you have engaged) is preserved; the implementation is
 * declarative, keyboard-navigable, and reduced-motion safe.
 *
 *  - brand-orange accent, border-2 retro cards, no dark palette.
 *  - Every node is a real <button> → full keyboard nav (Tab + Enter/Space to
 *    inspect, arrow handling delegated to native focus order).
 *  - "Trace" steps through the nodes with a Framer pulse; under
 *    `prefers-reduced-motion` it resolves instantly to the final frame.
 *  - Awards the checkpoint once the learner traces the diagram (or inspects
 *    every node), so XP/badges stay in the one unified store.
 *
 * German copy throughout. No em dashes.
 */

export type DiagramVariant = "stack" | "flow" | "compare";

export interface DiagramNode {
  readonly id: string;
  readonly label: string;
  /** Short clarifier shown on the node itself. */
  readonly sub?: string;
  /** Detail-panel body shown when the node is inspected (compare variant). */
  readonly detail?: string;
  /** Optional obligation / consequence line for the detail panel. */
  readonly consequence?: string;
  /** Optional tier accent intensity 0..1 (drives the left bar opacity). */
  readonly weight?: number;
}

export interface DiagramEdge {
  readonly from: string;
  readonly to: string;
  /** Optional label rendered on the connector (flow variant). */
  readonly label?: string;
}

export interface InteractiveDiagramProps {
  readonly variant: DiagramVariant;
  readonly nodes: readonly DiagramNode[];
  readonly edges?: readonly DiagramEdge[];
  readonly title?: string;
  /** One-line instruction above the diagram. */
  readonly caption?: string;
  /** Checkpoint wiring — when both are present the diagram awards XP once. */
  readonly lessonId?: string;
  readonly cpId?: string;
  /** Force reduced motion (overrides the media query — used in tests). */
  readonly reducedMotion?: boolean;
  /** XP awarded on completion. Cosmetic label only; store value is fixed. */
  readonly xpOnComplete?: number;
  readonly copy?: Partial<InteractiveDiagramCopy>;
}

export interface InteractiveDiagramCopy {
  readonly kindLabel: string;
  readonly inspectHeading: string;
  readonly inspectBody: string;
  readonly consequencePrefix: string;
  readonly traceComplete: string;
  readonly tracing: string;
  readonly traceIdle: string;
  readonly traceButton: string;
}

const KIND_LABEL: Record<DiagramVariant, string> = {
  stack: "Schichten",
  flow: "Ablauf",
  compare: "Vergleich",
};

const DEFAULT_TITLE: Record<DiagramVariant, string> = {
  stack: "Der Stapel, in Bewegung",
  flow: "Der Weg durch das System",
  compare: "Schicht für Schicht",
};

const DEFAULT_CAPTION: Record<DiagramVariant, string> = {
  stack: "Klick auf Verlauf: ein Impuls läuft von oben nach unten durch jede Stufe.",
  flow: "Klick auf Verlauf: der Impuls folgt den Pfeilen Schritt für Schritt.",
  compare: "Tippe eine Schicht an: was sie tut und was passiert, wenn sie fehlt.",
};

const DEFAULT_COPY: Omit<InteractiveDiagramCopy, "kindLabel"> = {
  inspectHeading: "Schicht antippen",
  inspectBody:
    "Tipp eine Schicht an, um zu sehen, was sie tut und was passiert, wenn sie fehlt.",
  consequencePrefix: "Wenn diese Schicht fehlt:",
  traceComplete: "Durchlauf komplett. So fließt es durch den Stapel.",
  tracing: "Impuls läuft …",
  traceIdle: "Starte den Durchlauf.",
  traceButton: "Verlauf abspielen",
};

/** Step delay (ms) between nodes during a trace. Held short for snappiness. */
const STEP_MS = 420;

export function InteractiveDiagram({
  variant,
  nodes,
  edges,
  title,
  caption,
  lessonId,
  cpId,
  reducedMotion,
  xpOnComplete = 10,
  copy,
}: InteractiveDiagramProps): JSX.Element {
  const chrome: InteractiveDiagramCopy = {
    kindLabel: KIND_LABEL[variant],
    ...DEFAULT_COPY,
    ...copy,
  };
  const mediaReduced = useReducedMotion();
  const reduced = reducedMotion ?? mediaReduced ?? false;

  // Checkpoint is optional: a diagram can be a pure teaching exhibit. When no
  // lessonId/cpId is supplied the hook is still called (rules of hooks) with
  // empty ids; completing it is a harmless no-op that we never trigger.
  const hasCheckpoint = Boolean(lessonId && cpId);
  const { done, complete } = useCheckpoint(lessonId ?? "", cpId ?? "");

  const [activeId, setActiveId] = useState<string | null>(null);
  const [traceIdx, setTraceIdx] = useState<number | null>(null);
  const [tracing, setTracing] = useState(false);
  // Inspected node ids tracked in a ref: it only feeds the compare-mode
  // completion check, never the render, so it does not need to trigger a
  // re-render of its own.
  const inspected = useRef<Set<string>>(new Set());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const award = useCallback(() => {
    if (hasCheckpoint && !done) complete();
  }, [hasCheckpoint, done, complete]);

  const trace = useCallback(() => {
    if (tracing || nodes.length === 0) return;
    clearTimers();
    setTracing(true);
    if (reduced) {
      // Reduced motion: resolve to the final frame immediately.
      setTraceIdx(nodes.length - 1);
      setTracing(false);
      award();
      return;
    }
    nodes.forEach((_, i) => {
      const t = setTimeout(() => {
        setTraceIdx(i);
        if (i === nodes.length - 1) {
          setTracing(false);
          award();
        }
      }, i * STEP_MS);
      timers.current.push(t);
    });
  }, [tracing, nodes, reduced, clearTimers, award]);

  const inspect = useCallback(
    (id: string) => {
      setActiveId((prev) => (prev === id ? null : id));
      inspected.current.add(id);
      // In compare mode, inspecting every node also earns the checkpoint
      // (some learners explore rather than trace).
      if (
        variant === "compare" &&
        nodes.length > 0 &&
        inspected.current.size === nodes.length
      ) {
        award();
      }
    },
    [variant, nodes.length, award],
  );

  const onNodeKey = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        inspect(id);
      }
    },
    [inspect],
  );

  const activeNode = activeId ? nodes.find((n) => n.id === activeId) : null;
  const hasEdges = variant === "flow" && (edges?.length ?? 0) > 0;

  return (
    // Nested provider: loads domMax synchronously for this subtree only (the
    // `layoutId` pulse below needs it); `strict` keeps the dev-time guard
    // against accidental full `motion` components active here too.
    <LazyMotion features={domMax} strict>
    <WidgetFrame
      kindLabel={chrome.kindLabel}
      title={title ?? DEFAULT_TITLE[variant]}
      scenario={caption ?? DEFAULT_CAPTION[variant]}
      done={hasCheckpoint ? done : false}
      xpLabel={`+${xpOnComplete} XP`}
    >
      <div
        className={cn(
          "grid gap-4",
          variant === "compare" && "md:grid-cols-[1.4fr_1fr]",
        )}
      >
        <ol
          className="flex list-none flex-col gap-2"
          aria-label={title ?? DEFAULT_TITLE[variant]}
        >
          {nodes.map((node, i) => {
            const isActive = activeId === node.id;
            const isPulsing =
              traceIdx !== null && (reduced ? i <= traceIdx : i === traceIdx);
            const wasTraced = traceIdx !== null && i <= traceIdx;
            const edge = hasEdges
              ? edges?.find((ed) => ed.from === node.id)
              : undefined;
            return (
              <li key={node.id} className="flex flex-col gap-2">
                <button
                  type="button"
                  data-pos={i}
                  data-id={node.id}
                  data-active={isActive ? "1" : "0"}
                  data-traced={wasTraced ? "1" : "0"}
                  aria-pressed={isActive}
                  onClick={() => inspect(node.id)}
                  onKeyDown={(e) => onNodeKey(e, node.id)}
                  className={cn(
                    "group grid w-full grid-cols-[34px_1fr] items-center gap-3 border-2 bg-background p-3 text-left transition-[background-color,border-color,color,opacity,transform,box-shadow]",
                    isActive
                      ? "border-brand-orange shadow-[3px_3px_0_0_var(--color-foreground)]"
                      : "border-border hover:border-brand-orange/60",
                    wasTraced && !isActive && "border-brand-orange/50",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-full min-h-[34px] w-[5px] shrink-0",
                        isPulsing ? "bg-brand-orange" : "bg-brand-orange/30",
                      )}
                      style={{
                        opacity:
                          node.weight != null
                            ? Math.max(0.3, Math.min(1, node.weight))
                            : undefined,
                      }}
                    />
                    <span className="inline-flex h-7 w-7 items-center justify-center border-2 border-border font-mono text-[12px] font-bold text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block break-words text-[14.5px] font-bold leading-[1.25] text-foreground [overflow-wrap:anywhere]">
                      {node.label}
                    </span>
                    {node.sub && (
                      <span className="mt-0.5 block text-[12.5px] leading-[1.45] text-muted-foreground">
                        {node.sub}
                      </span>
                    )}
                  </span>
                  {isPulsing && !reduced && (
                    <m.span
                      aria-hidden="true"
                      layoutId="diagram-pulse"
                      className="pointer-events-none col-span-2 mt-1 block h-[2px] w-full bg-brand-orange"
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    />
                  )}
                </button>
                {edge?.label && i < nodes.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="ml-[17px] flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground"
                  >
                    <span className="text-brand-orange">↓</span>
                    {edge.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        {variant === "compare" && (
          <aside
            aria-live="polite"
            className="border-2 border-border bg-card/40 p-4"
          >
            {activeNode ? (
              <div>
                <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  {activeNode.label}
                </p>
                {activeNode.detail && (
                  <p className="mt-2 text-[13.5px] leading-[1.6] text-foreground">
                    {activeNode.detail}
                  </p>
                )}
                {activeNode.consequence && (
                  <p className="mt-3 border-l-[3px] border-destructive bg-destructive/5 p-2.5 text-[12.5px] leading-[1.5] text-foreground">
                    <span className="font-bold text-destructive">
                      {chrome.consequencePrefix}{" "}
                    </span>
                    {activeNode.consequence}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-[13px] leading-[1.55] text-muted-foreground">
                <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {chrome.inspectHeading}
                </p>
                <p className="mt-2">
                  {chrome.inspectBody}
                </p>
              </div>
            )}
          </aside>
        )}
      </div>

      {variant !== "compare" && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[12.5px] text-muted-foreground" aria-live="polite">
            {traceIdx === nodes.length - 1
              ? chrome.traceComplete
              : tracing
                ? chrome.tracing
                : chrome.traceIdle}
          </span>
          <button
            type="button"
            onClick={trace}
            disabled={tracing}
            className={cn(
              "inline-flex items-center gap-1.5 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow]",
              tracing
                ? "cursor-not-allowed opacity-60"
                : "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]",
            )}
          >
            <Play size={12} aria-hidden="true" />
            {chrome.traceButton}
          </button>
        </div>
      )}
    </WidgetFrame>
    </LazyMotion>
  );
}

export default InteractiveDiagram;
