"use client";

import { lazy, Suspense, type ComponentType } from "react";
import type { Widget, WidgetKind } from "@/lib/widgets/types";
import { isWidgetKind, isWidgetPlacement } from "@/lib/widgets/types";
import type { Locale } from "@/lib/i18n/locale";
import { DemoLocaleProvider } from "@/components/demos/demo-locale";
import { MotionProvider } from "@/components/motion-provider";

/**
 * Widget registry — maps a WidgetKind to a lazy-loaded component.
 *
 * Lazy-loading per kind keeps per-lesson bundle size small: a lesson that
 * uses only two widgets ships only those two components.
 *
 * Unknown kind:
 *   - Development: renders a bright debug card to surface authoring typos.
 *   - Production:  renders null + console.error (never crashes the reader).
 *
 * Invalid placement:
 *   - Runtime-validated at the call site (see resolveWidgetsForSlot);
 *     invalid placement falls back to 'end' with a console.warn.
 *
 */

type WidgetComponent = ComponentType<Record<string, unknown>>;

/**
 * Each entry uses React.lazy to defer the module import until the widget is
 * actually rendered. WidgetKind is exhaustive, so every declared kind must
 * have a real registered component.
 */
const REGISTRY: Record<WidgetKind, () => Promise<{ default: WidgetComponent }>> = {
  // ─── Demos (AI-native demo gallery implementation) ───
  "demo-chat-rag": () => import("@/components/ai-native/demos/chat-demo"),
  "demo-compliance": () => import("@/components/ai-native/demos/compliance-demo"),
  "demo-roi": () => import("@/components/ai-native/demos/roi-demo"),
  "demo-doc": () => import("@/components/ai-native/demos/doc-demo"),
  "demo-agent": () => import("@/components/ai-native/demos/agent-demo"),
  "demo-finetune": () => import("@/components/ai-native/demos/finetune-demo"),
  "demo-workflow": () => import("@/components/ai-native/demos/workflow-demo"),
  "demo-maturity": () => import("@/components/ai-native/demos/maturity-demo"),
  "demo-observ": () => import("@/components/ai-native/demos/observ-demo"),
  "demo-excel": () => import("@/components/ai-native/demos/excel-demo"),
  "demo-word": () => import("@/components/ai-native/demos/word-demo"),
  "demo-logistics": () => import("@/components/ai-native/demos/logistics-demo"),

  // ─── Exercises (AI-native lesson system) ───
  "exercise-fix-prompt": () =>
    import("@/components/ai-native/exercises/fix-prompt").then((m) => ({
      default: m.FixPromptExercise as unknown as WidgetComponent,
    })),
  "exercise-pii-spotter": () =>
    import("@/components/ai-native/exercises/pii-spotter").then((m) => ({
      default: m.PiiSpotterExercise as unknown as WidgetComponent,
    })),
  "exercise-context-budget": () =>
    import("@/components/ai-native/exercises/context-budget").then((m) => ({
      default: m.ContextBudgetExercise as unknown as WidgetComponent,
    })),
  "exercise-prompt-diff": () =>
    import("@/components/ai-native/exercises/prompt-diff").then((m) => ({
      default: m.PromptDiffExercise as unknown as WidgetComponent,
    })),
  "exercise-workflow-builder": () =>
    import("@/components/ai-native/exercises/workflow-builder").then((m) => ({
      default: m.WorkflowBuilderExercise as unknown as WidgetComponent,
    })),
  "exercise-role-scenario": () =>
    import("@/components/ai-native/exercises/role-scenario").then((m) => ({
      default: m.RoleScenarioExercise as unknown as WidgetComponent,
    })),
  "exercise-rctfc-checklist": () =>
    import("@/components/ai-native/exercises/rctfc-checklist").then((m) => ({
      default: m.RctfcChecklistExercise as unknown as WidgetComponent,
    })),
  "exercise-free-response": () =>
    import("@/components/ai-native/exercises/free-response").then((m) => ({
      default: m.FreeResponseExercise as unknown as WidgetComponent,
    })),

  // ─── Tier-A drop-ins (shared course architecture) ───
  quiz: () =>
    import("@/components/widgets/tier-a/quiz").then((m) => ({
      default: m.QuizWidget as unknown as WidgetComponent,
    })),
  flashcards: () =>
    import("@/components/widgets/tier-a/flashcards").then((m) => ({
      default: m.FlashcardsWidget as unknown as WidgetComponent,
    })),
  compare: () =>
    import("@/components/widgets/tier-a/compare").then((m) => ({
      default: m.CompareWidget as unknown as WidgetComponent,
    })),
  "task-spec": () =>
    import("@/components/widgets/tier-a/task-spec").then((m) => ({
      default: m.TaskSpecWidget as unknown as WidgetComponent,
    })),
  "self-rate": () =>
    import("@/components/widgets/tier-a/self-rate").then((m) => ({
      default: m.SelfRateWidget as unknown as WidgetComponent,
    })),
  plays: () =>
    import("@/components/widgets/tier-a/plays").then((m) => ({
      default: m.PlaysWidget as unknown as WidgetComponent,
    })),

  // ─── Tier-A+ exercise widgets (shared course architecture) ───
  "failure-tagger": () =>
    import("@/components/widgets/tier-a/failure-tagger").then((m) => ({
      default: m.FailureTaggerWidget as unknown as WidgetComponent,
    })),
  "redaction-drill": () =>
    import("@/components/widgets/tier-a/redaction-drill").then((m) => ({
      default: m.RedactionDrillWidget as unknown as WidgetComponent,
    })),
  "drag-reorder": () =>
    import("@/components/widgets/tier-a/drag-reorder").then((m) => ({
      default: m.DragReorderWidget as unknown as WidgetComponent,
    })),

  // ─── Interactive diagram primitive + presets (shared course architecture) ───
  "interactive-diagram": () =>
    import("@/components/widgets/interactive-diagram").then((m) => ({
      default: m.InteractiveDiagram as unknown as WidgetComponent,
    })),
  "risk-pyramid": () =>
    import("@/components/widgets/diagram-presets").then((m) => ({
      default: m.RiskPyramidDiagram as unknown as WidgetComponent,
    })),
  "obligation-layers": () =>
    import("@/components/widgets/diagram-presets").then((m) => ({
      default: m.ObligationLayersDiagram as unknown as WidgetComponent,
    })),

  // ─── Codex Course, two genuinely new Tier-A kinds ───
  "terminal-replay": () =>
    import("@/components/widgets/tier-a/terminal-replay").then((m) => ({
      default: m.TerminalReplayWidget as unknown as WidgetComponent,
    })),
  "diff-viewer": () =>
    import("@/components/widgets/tier-a/diff-viewer").then((m) => ({
      default: m.DiffViewerWidget as unknown as WidgetComponent,
    })),

  // ─── AI-Native Operator Course, three genuinely new Tier-A kinds ───
  "reflect-box": () =>
    import("@/components/widgets/tier-a/reflect-box").then((m) => ({
      default: m.ReflectBoxWidget as unknown as WidgetComponent,
    })),
  "matrix-grid": () =>
    import("@/components/widgets/tier-a/matrix-grid").then((m) => ({
      default: m.MatrixGridWidget as unknown as WidgetComponent,
    })),
  "slot-fill": () =>
    import("@/components/widgets/tier-a/slot-fill").then((m) => ({
      default: m.SlotFillWidget as unknown as WidgetComponent,
    })),

  // ─── Practice Room — live Claude widgets (shared course architecture) ───
  "prompt-orrery": () =>
    import("@/components/widgets/practice/prompt-orrery").then((m) => ({
      default: m.PromptOrreryWidget as unknown as WidgetComponent,
    })),
  "prompt-transform": () =>
    import("@/components/widgets/practice/prompt-transform").then((m) => ({
      default: m.PromptTransformWidget as unknown as WidgetComponent,
    })),
  "semantic-space": () =>
    import("@/components/widgets/practice/semantic-space").then((m) => ({
      default: m.SemanticSpaceWidget as unknown as WidgetComponent,
    })),

  // ─── Claude Course, simulated-Claude widgets ───
  // `CheckpointFooter` (claude/js/widgets.js) is deliberately NOT ported:
  // confirmed via `grep -o "mountWidget([^)]*CheckpointFooter" claude/lessons/*.html`
  // returning zero matches across all 12 source lessons, it is dead code in
  // the pinned source (every lesson's "mark complete" affordance is instead
  // driven by the individual widget checkpoints already wired below).
  "prompt-sandbox": () =>
    import("@/components/widgets/claude/prompt-sandbox").then((m) => ({
      default: m.PromptSandboxWidget as unknown as WidgetComponent,
    })),
  "prompt-compare": () =>
    import("@/components/widgets/claude/prompt-compare").then((m) => ({
      default: m.PromptCompareWidget as unknown as WidgetComponent,
    })),
  "prompt-grader": () =>
    import("@/components/widgets/claude/prompt-grader").then((m) => ({
      default: m.PromptGraderWidget as unknown as WidgetComponent,
    })),
  "rewrite-arena": () =>
    import("@/components/widgets/claude/rewrite-arena").then((m) => ({
      default: m.RewriteArenaWidget as unknown as WidgetComponent,
    })),
  "fill-blank": () =>
    import("@/components/widgets/claude/fill-blank").then((m) => ({
      default: m.FillBlankWidget as unknown as WidgetComponent,
    })),
  "prompt-diff": () =>
    import("@/components/widgets/claude/prompt-diff").then((m) => ({
      default: m.PromptDiffWidget as unknown as WidgetComponent,
    })),
  "socratic-tutor": () =>
    import("@/components/widgets/claude/socratic-tutor").then((m) => ({
      default: m.SocraticTutorWidget as unknown as WidgetComponent,
    })),
  "agent-loop": () =>
    import("@/components/widgets/claude/agent-loop").then((m) => ({
      default: m.AgentLoopWidget as unknown as WidgetComponent,
    })),
  tokenizer: () =>
    import("@/components/widgets/claude/tokenizer").then((m) => ({
      default: m.TokenizerWidget as unknown as WidgetComponent,
    })),
  "claude-md-builder": () =>
    import("@/components/widgets/claude/claude-md-builder").then((m) => ({
      default: m.ClaudeMdBuilderWidget as unknown as WidgetComponent,
    })),
  "prompt-library-shaper": () =>
    import("@/components/widgets/claude/prompt-library-shaper").then((m) => ({
      default: m.PromptLibraryShaperWidget as unknown as WidgetComponent,
    })),
} as const satisfies Record<WidgetKind, () => Promise<{ default: WidgetComponent }>>;

const ENGLISH_DEMO_REGISTRY: Partial<
  Record<WidgetKind, () => Promise<{ default: WidgetComponent }>>
> = {
  "demo-chat-rag": () => import("@/components/demos/rag-vertragsassistent-demo"),
  "demo-compliance": () => import("@/components/demos/prompt-scanner-demo"),
  "demo-roi": () => import("@/components/demos/roi-rechner-demo"),
  "demo-doc": () => import("@/components/demos/rechnung-zu-sap-demo"),
  "demo-agent": () => import("@/components/demos/agent-pipeline-demo"),
  "demo-finetune": () => import("@/components/demos/fine-tune-playground-demo"),
  "demo-workflow": () => import("@/components/demos/n8n-supply-chain-demo"),
  "demo-maturity": () => import("@/components/demos/roi-rechner-demo"),
  "demo-observ": () => import("@/components/demos/llm-observability-demo"),
  "demo-excel": () => import("@/components/demos/excel-demo"),
  "demo-word": () => import("@/components/demos/word-demo"),
  "demo-logistics": () => import("@/components/demos/n8n-supply-chain-demo"),
};

const lazyCache = new Map<string, ComponentType<Record<string, unknown>>>();

function getLazyComponent(
  kind: WidgetKind,
  locale: Locale,
): ComponentType<Record<string, unknown>> {
  const cacheKey = `${locale}:${kind}`;
  const cached = lazyCache.get(cacheKey);
  if (cached) return cached;
  const loader =
    locale === "en" ? ENGLISH_DEMO_REGISTRY[kind] ?? REGISTRY[kind] : REGISTRY[kind];
  const Component = lazy(loader);
  lazyCache.set(cacheKey, Component);
  return Component;
}

/**
 * Render a widget. Safe against unknown kinds.
 */
export function RenderWidget({
  kind,
  props = {},
  locale = "de",
}: {
  readonly kind: string;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly locale?: Locale;
}) {
  if (!isWidgetKind(kind)) {
     
    console.error(`[ai-native] Unknown widget kind: ${kind}`);
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="border-2 border-destructive bg-destructive/10 p-4 font-mono text-[12px] text-destructive">
          <p className="font-bold uppercase tracking-[0.14em]">
            Unknown widget kind
          </p>
          <p className="mt-1 break-all">{kind}</p>
          <p className="mt-1 text-[10.5px]">
            Add it to REGISTRY in <code>widgets/registry.tsx</code>.
          </p>
        </div>
      );
    }
    return null;
  }
  const Component = getLazyComponent(kind, locale);
  return (
    <Suspense fallback={<WidgetSkeleton locale={locale} />}>
      <DemoLocaleProvider locale={locale}>
        <MotionProvider>
          <Component {...props} locale={locale} />
        </MotionProvider>
      </DemoLocaleProvider>
    </Suspense>
  );
}

/**
 * Given the full widgets list on a lesson, return those matching a given
 * placement slot. Invalid placements fall back to 'end' with a warning.
 */
export function resolveWidgetsForSlot(
  widgets: readonly Widget[] | undefined,
  slot: Widget["placement"],
): readonly Widget[] {
  if (!widgets) return [];
  return widgets.filter((w) => {
    if (!isWidgetPlacement(w.placement)) {
       
      console.warn(
        `[ai-native] Invalid widget placement "${w.placement}", falling back to 'end'.`,
      );
      return slot === "end";
    }
    return w.placement === slot;
  });
}

/** Light skeleton while the lazy component loads. */
function WidgetSkeleton({ locale }: { readonly locale: Locale }) {
  return (
    <div
      aria-label={locale === "en" ? "Widget is loading" : "Widget wird geladen"}
      className="h-[120px] w-full animate-pulse border border-border bg-card/40"
    />
  );
}
