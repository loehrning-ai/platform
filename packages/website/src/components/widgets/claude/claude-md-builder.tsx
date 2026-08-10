"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "../tier-a/_frame";
import {
  buildClaudeMd,
  simulatedDelayMs,
} from "@/lib/claude-course/simulated-claude";
import { useClaudeWidgetLocale } from "./locale-context";

/**
 * ClaudeMdBuilder creates a local draft from typed fields. It does not call
 * a model or network service.
 */
export interface ClaudeMdBuilderWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
}

interface FieldDef {
  readonly key: "project" | "stack" | "conventions" | "avoid" | "commands";
  readonly label: string;
  readonly placeholder: string;
  readonly rows: number;
}

const FIELDS_EN: readonly FieldDef[] = [
  {
    key: "project",
    label: "Project name + one-line summary",
    placeholder:
      "e.g. Reporting dashboard, internal tool for build pipeline analytics",
    rows: 2,
  },
  {
    key: "stack",
    label: "Language, framework, important tools",
    placeholder: "e.g. TypeScript, React, GraphQL, Vitest, Vite",
    rows: 3,
  },
  {
    key: "conventions",
    label: "Coding + doc conventions",
    placeholder:
      "e.g. Functional components only, tests colocated, team style guide",
    rows: 3,
  },
  {
    key: "avoid",
    label: "Anti-patterns + things not to do",
    placeholder: "e.g. No new npm deps without approval, no any types",
    rows: 3,
  },
  {
    key: "commands",
    label: "Useful commands (build, test, lint)",
    placeholder: "e.g. yarn build, yarn test, arc lint",
    rows: 3,
  },
];

const FIELDS_DE: readonly FieldDef[] = [
  {
    key: "project",
    label: "Projektname und Kurzbeschreibung",
    placeholder: "z. B. Reporting-Dashboard für interne Build-Analysen",
    rows: 2,
  },
  {
    key: "stack",
    label: "Sprache, Framework und wichtige Tools",
    placeholder: "z. B. TypeScript, React, GraphQL, Vitest, Vite",
    rows: 3,
  },
  {
    key: "conventions",
    label: "Code- und Dokumentationsregeln",
    placeholder: "z. B. funktionale Komponenten, Tests neben dem Code",
    rows: 3,
  },
  {
    key: "avoid",
    label: "Zu vermeidende Muster",
    placeholder: "z. B. keine neuen npm-Pakete ohne Freigabe, kein any",
    rows: 3,
  },
  {
    key: "commands",
    label: "Befehle für Build, Tests und Linting",
    placeholder: "z. B. yarn build, yarn test, arc lint",
    rows: 3,
  },
];

export function ClaudeMdBuilderWidget({
  lessonId,
  cpId,
}: ClaudeMdBuilderWidgetProps): JSX.Element {
  const locale = useClaudeWidgetLocale();
  const german = locale === "de";
  const fieldsDefinition = german ? FIELDS_DE : FIELDS_EN;
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [fields, setFields] = useState({
    project: "",
    stack: "",
    conventions: "",
    avoid: "",
    commands: "",
  });
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const copyResetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copyResetTimer.current !== null) {
        window.clearTimeout(copyResetTimer.current);
      }
    },
    [],
  );

  const build = async () => {
    setLoading(true);
    setOutput(null);
    setCopyState("idle");
    await new Promise((resolve) =>
      setTimeout(resolve, simulatedDelayMs(fields.project)),
    );
    setOutput(buildClaudeMd(fields, locale));
    setLoading(false);
    complete();
  };

  const copy = async () => {
    if (!output) return;
    if (copyResetTimer.current !== null) {
      window.clearTimeout(copyResetTimer.current);
      copyResetTimer.current = null;
    }
    setCopyState("idle");
    try {
      if (typeof navigator.clipboard?.writeText !== "function") {
        setCopyState("error");
        return;
      }
      await navigator.clipboard.writeText(output);
      setCopyState("copied");
      copyResetTimer.current = window.setTimeout(() => {
        copyResetTimer.current = null;
        setCopyState("idle");
      }, 1400);
    } catch {
      // The generated document can contain private project details. Never log
      // either the clipboard error or the generated output.
      setCopyState("error");
    }
  };

  const canBuild =
    fields.project.trim().length > 0 && fields.stack.trim().length > 0;

  return (
    <WidgetFrame
      kindLabel={german ? "Vorlage" : "Builder"}
      title={german ? "CLAUDE.md-Entwurf erstellen" : "Draft a CLAUDE.md file"}
      scenario={
        german
          ? "Lokale Vorlage ohne Modell- oder API-Aufruf. Gib keine Geheimnisse ein und prüfe den erzeugten Entwurf."
          : "Local template with no model or API call. Do not enter secrets; review the generated draft."
      }
      done={done}
      xpLabel="+25 XP"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          {fieldsDefinition.map((field) => (
            <label key={field.key} className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                {field.label}
              </span>
              <textarea
                rows={field.rows}
                value={fields[field.key]}
                onChange={(e) =>
                  setFields((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                placeholder={field.placeholder}
                className="w-full border-2 border-border bg-background px-3 py-2 text-[13.5px] text-foreground placeholder:text-muted-foreground focus-visible:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              />
            </label>
          ))}
          <button
            type="button"
            onClick={build}
            disabled={loading || !canBuild}
            className={cn(
              "inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
            )}
          >
            {loading
              ? german
                ? "Wird erstellt…"
                : "Drafting…"
              : german
                ? "Entwurf erstellen →"
                : "Create draft →"}
          </button>
        </div>
        <div className="relative flex flex-col">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            {german ? "Ausgabe" : "Output"}
          </p>
          <pre className="min-h-[360px] flex-1 overflow-auto whitespace-pre-wrap break-words border border-border bg-card/40 p-3 font-mono text-[12.5px] text-foreground">
            {loading
              ? german
                ? "CLAUDE.md wird erstellt…"
                : "Creating CLAUDE.md draft…"
              : output ||
                (german
                  ? "// Der CLAUDE.md-Entwurf erscheint hier.\n// Fülle links die Felder aus und starte die Erstellung."
                  : "// The CLAUDE.md draft will appear here.\n// Fill in the fields on the left and select Create draft.")}
          </pre>
          {output && (
            <button
              type="button"
              onClick={copy}
              aria-describedby={
                copyState === "error" ? "claude-md-copy-error" : undefined
              }
              className="absolute right-2 top-8 border-2 border-foreground bg-background px-2 py-1 font-mono text-[10px] font-bold uppercase text-foreground shadow-[2px_2px_0_0_var(--color-foreground)]"
            >
              {copyState === "copied"
                ? german
                  ? "Kopiert"
                  : "Copied"
                : german
                  ? "Kopieren"
                  : "Copy"}
            </button>
          )}
          {copyState === "error" && (
            <p
              id="claude-md-copy-error"
              role="alert"
              className="mt-2 text-xs text-destructive"
            >
              {german
                ? "Kopieren fehlgeschlagen. Prüfe die Zwischenablage-Berechtigung und versuche es erneut."
                : "Copy failed. Check clipboard permission and try again."}
            </p>
          )}
        </div>
      </div>
    </WidgetFrame>
  );
}

export default ClaudeMdBuilderWidget;
