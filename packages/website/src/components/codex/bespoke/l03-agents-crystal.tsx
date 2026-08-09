"use client";

import { useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/**
 * L03 bespoke interactive — "AGENTS.md crystal".
 * Ported from `codex/js/lessons/L03.js` (functional parity; the source's
 * SVG hexagon facet-glow + particle burst is simplified to a facet-count
 * meter — the graded interaction is absorbing all 5 conventions, and each
 * absorption's effect on the preview PR panel, not the particle chrome).
 *
 * Five convention chips (test layout / error handling / lint command /
 * branch naming / review voice). Clicking one "absorbs" it once (disabled
 * afterward) and updates a small preview PR panel to reflect that
 * convention now being applied. The checkpoint awards once all 5 are
 * absorbed.
 */

interface Convention {
  readonly id: "test" | "error" | "lint" | "branch" | "review";
  readonly label: string;
}

const CONVENTION_IDS = ["test", "error", "lint", "branch", "review"] as const;

interface PrPreview {
  readonly title: string;
  readonly branch: string;
  readonly fileLine: string;
  readonly errorLine: string;
  readonly lintLine: string | null;
}

const DEFAULT_PREVIEW: PrPreview = {
  title: "Refactor auth",
  branch: "generic codex-refactor",
  fileLine: "test_underscore.js",
  errorLine: 'throw new Error("fail");',
  lintLine: null,
};

const COPY = {
  en: {
    heading: "◆ Exercise · Repository instructions",
    conventions: "conventions",
    labels: {
      test: "test layout",
      error: "error handling",
      lint: "lint command",
      branch: "branch naming",
      review: "review voice",
    },
    defaultTitle: DEFAULT_PREVIEW.title,
    complete: "STYLE CONFORMANT",
  },
  de: {
    heading: "◆ Praxis · AGENTS.md-Konventionen",
    conventions: "Konventionen",
    labels: {
      test: "Teststruktur",
      error: "Fehlerbehandlung",
      lint: "Lint-Befehl",
      branch: "Branch-Benennung",
      review: "Review-Sprache",
    },
    defaultTitle: "Authentifizierung refaktorisieren",
    complete: "KONVENTIONEN ANGEWENDET",
  },
} as const satisfies Record<
  Locale,
  {
    readonly heading: string;
    readonly conventions: string;
    readonly labels: Record<Convention["id"], string>;
    readonly defaultTitle: string;
    readonly complete: string;
  }
>;

function applyConvention(preview: PrPreview, id: Convention["id"]): PrPreview {
  switch (id) {
    case "test":
      return { ...preview, fileLine: "tests/spec.js" };
    case "error":
      return { ...preview, errorLine: 'throw new ServiceError("fail");' };
    case "lint":
      return { ...preview, lintLine: "// lint: eslint --fix applied" };
    case "branch":
      return { ...preview, branch: "feat codex-refactor-auth" };
    case "review":
      return {
        ...preview,
        title: "feat: auth, tighten rate-limit and error boundaries",
      };
  }
}

interface L03AgentsCrystalProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly locale?: Locale;
}

export function L03AgentsCrystal({
  lessonId,
  cpId,
  locale = "en",
}: L03AgentsCrystalProps): JSX.Element {
  const copy = COPY[locale];
  const conventions: readonly Convention[] = CONVENTION_IDS.map((id) => ({
    id,
    label: copy.labels[id],
  }));
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [absorbed, setAbsorbed] = useState<ReadonlySet<Convention["id"]>>(
    () => new Set(),
  );
  const [preview, setPreview] = useState<PrPreview>(() => ({
    ...DEFAULT_PREVIEW,
    title: copy.defaultTitle,
  }));

  const absorb = (id: Convention["id"]) => {
    if (absorbed.has(id)) return;
    const next = new Set(absorbed);
    next.add(id);
    setAbsorbed(next);
    setPreview((prev) => applyConvention(prev, id));
    if (next.size === conventions.length) complete();
  };

  return (
    <div className="min-w-0 max-w-full border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        {copy.heading}
      </p>
      <div className="grid min-w-0 gap-5 md:grid-cols-2">
        <div className="min-w-0">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            {copy.conventions}: {absorbed.size}/{conventions.length}
          </p>
          <div className="flex flex-col gap-2">
            {conventions.map((c) => {
              const isAbsorbed = absorbed.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => absorb(c.id)}
                  disabled={isAbsorbed}
                  aria-pressed={isAbsorbed}
                  className={cn(
                    "min-w-0 border-2 border-l-4 border-border bg-background px-3 py-2 text-left font-mono text-[12.5px] text-foreground transition-colors",
                    isAbsorbed
                      ? "border-l-risk-green text-muted-foreground line-through"
                      : "border-l-brand-orange hover:border-brand-orange",
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 border-2 border-border bg-background p-3">
          <div className="mb-1 break-words font-mono text-[13px] font-bold text-foreground">
            {preview.title}
          </div>
          <div className="mb-3 inline-block max-w-full break-words border border-border bg-card px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
            {preview.branch}
          </div>
          <div className="flex flex-col gap-1 font-mono text-[11.5px] text-foreground">
            <p className="break-words">M {preview.fileLine}</p>
            <p className="break-words">+ {preview.errorLine}</p>
            {preview.lintLine && (
              <p className="break-words">* {preview.lintLine}</p>
            )}
          </div>
          {absorbed.size === conventions.length && (
            <p className="mt-3 inline-block bg-risk-green px-2 py-1 font-mono text-[11px] font-bold text-white">
              {copy.complete} {done ? "✓" : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default L03AgentsCrystal;
