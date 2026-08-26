"use client";

import { useMemo, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "../tier-a/_frame";
import { RunConsole } from "./_run-console";
import {
  shareabilityFeedback,
  simulatedDelayMs,
} from "@/lib/claude-course/simulated-claude";
import { useClaudeWidgetLocale } from "./locale-context";
import type { Locale } from "@/lib/i18n/locale";

/**
 * PromptLibraryShaper, turn a personal prompt into a team-shareable one.
 * Ported from `claude/js/widgets.js:1246` (PromptLibraryShaper).
 */
export interface PromptLibraryShaperWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
}

const SAMPLE =
  "Write a PR review for the change in my auth-service repo. Use the style we agreed on in last week's #eng-chat thread. Focus on the stuff Jane and I care about.";

const IDEAL = `# When to use: drafting a PR review on any repo the team maintains.
# Known failure: the opening may contain unrequested praise; remove it.

You review changes in the <PROJECT> codebase against its documented standards.

CONTEXT
We follow the team conventions in the project's CLAUDE.md. The change is in <AREA>.

TASK
Review the diff below. Prioritize: correctness, test coverage, naming, and whether it matches our existing patterns.

FORMAT
Three sections: "Must fix", "Worth considering", "Nits". Bullet points, <=10 words each.

EXAMPLE OUTPUT
## Must fix
- Null check on line 42, config can be undefined from loadEnv().
## Worth considering
- Extract retry loop into helper; it's now duplicated in 3 files.
## Nits
- Prefer const over let on line 17.

DIFF
<paste diff here>`;

const SAMPLE_DE =
  "Erstelle ein PR-Review für die Änderung in meinem auth-service-Repository. Verwende den Stil aus dem #eng-chat-Thread der letzten Woche. Konzentriere dich auf die Punkte, die Jane und mir wichtig sind.";

const IDEAL_DE = `# Einsatz: PR-Review für ein Repository des Teams.
# Bekanntes Fehlerbild: Einleitungen können unaufgefordertes Lob enthalten; entferne es.

Du prüfst Änderungen im <PROJEKT>-Repository anhand der dokumentierten Standards.

KONTEXT
Es gelten die Regeln aus der CLAUDE.md des Projekts. Die Änderung betrifft <BEREICH>.

AUFGABE
Prüfe den folgenden Diff. Priorisiere Korrektheit, Testabdeckung, Benennung und Konsistenz mit bestehenden Mustern.

FORMAT
Drei Abschnitte: "Muss geändert werden", "Prüfenswert", "Kleinigkeiten". Stichpunkte mit höchstens zehn Wörtern.

BEISPIELAUSGABE
## Muss geändert werden
- Null-Prüfung in Zeile 42; loadEnv() kann undefined liefern.
## Prüfenswert
- Retry-Schleife extrahieren; sie steht jetzt in drei Dateien.
## Kleinigkeiten
- In Zeile 17 const statt let verwenden.

DIFF
<Diff hier einfügen>`;

interface Check {
  readonly id: string;
  readonly label: string;
  readonly ok: boolean;
  readonly partial: boolean;
  readonly hint: string;
}

function computeChecks(value: string, locale: Locale): readonly Check[] {
  const lower = value.toLowerCase();
  const german = locale === "de";
  const hasPlaceholder = /<[A-Z_]{2,}>|\{\{[^}]+\}\}|\[YOUR[_ ][A-Z]+\]/i.test(
    value,
  );
  const hasHardcoded =
    /auth-service|jane|my |#eng-chat|last week|my team|my repo/i.test(lower);
  const hasWhenToUse = german
    ? /einsatz|verwenden wenn|geeignet für|# einsatz/i.test(lower)
    : /when to use|use this when|for:|# when/i.test(lower);
  const hasOutputExample =
    (german
      ? /beispiel(ausgabe)?:|muster(ausgabe)?:|→/i.test(lower)
      : /example( output)?:|sample output|here's an example|→/i.test(lower)) ||
    /```/.test(value);
  const hasFailureNote = german
    ? /fehlerbild|neigt zu|hinweis|beachte|einschränkung/i.test(lower)
    : /failure mode|known failure|tends to|watch out|caveat|note:/i.test(lower);
  const hasRole = german
    ? /du prüfst|du bist|deine rolle|als .*review/i.test(lower)
    : /you are|you review|act as|your role/i.test(lower);
  const hasStructure =
    value.split(/\n\n+/).length >= 3 ||
    /(CONTEXT|TASK|CONSTRAINTS|FORMAT|EXAMPLE)/i.test(value);

  return [
    {
      id: "parameterized",
      label: german ? "Parametrisiert" : "Parameterized",
      ok: hasPlaceholder && !hasHardcoded,
      partial: hasPlaceholder && hasHardcoded,
      hint: hasHardcoded
        ? german
          ? "Ersetze feste Namen, Repositories und Kanäle durch <PLATZHALTER>."
          : "Swap hardcoded names, repositories, and channels for <PLACEHOLDERS>."
        : hasPlaceholder
          ? german
            ? "Platzhalter sind vorhanden."
            : "Placeholders are present."
          : german
            ? "Füge Platzhalter wie <PROJEKT> oder <TEAMMITGLIED> ein."
            : "Add placeholders such as <PROJECT> or <TEAMMATE>.",
    },
    {
      id: "when",
      label: german ? "Einsatzhinweis" : '"When to use" note',
      ok: hasWhenToUse,
      partial: false,
      hint: hasWhenToUse
        ? german
          ? "Der Einsatzbereich ist benannt."
          : "The use case is explicit."
        : german
          ? 'Ergänze oben eine Zeile "# Einsatz: …".'
          : 'Add a one-line "# When to use: …" at the top.',
    },
    {
      id: "example",
      label: german ? "Beispielausgabe" : "Sample output",
      ok: hasOutputExample,
      partial: false,
      hint: hasOutputExample
        ? german
          ? "Die erwartete Form ist anhand eines Beispiels sichtbar."
          : "The expected form is visible in an example."
        : german
          ? "Füge eine Beispielausgabe ein."
          : "Add a sample output.",
    },
    {
      id: "failure",
      label: german ? "Fehlerhinweis" : "Failure-mode note",
      ok: hasFailureNote,
      partial: false,
      hint: hasFailureNote
        ? german
          ? "Eine bekannte Schwachstelle ist dokumentiert."
          : "A known limitation is documented."
        : german
          ? 'Ergänze einen "# Hinweis: …" zu einer bekannten Schwachstelle.'
          : 'Add a "# Watch out: …" note about a known limitation.',
    },
    {
      id: "structure",
      label: german ? "Klare Struktur" : "Structured shape",
      ok: hasStructure && hasRole,
      partial: !(hasStructure && hasRole) && (hasStructure || hasRole),
      hint:
        hasStructure && hasRole
          ? german
            ? "Rolle und Abschnitte sind vorhanden."
            : "Role and sections are present."
          : german
            ? "Ergänze eine Rolle und klar benannte Abschnitte."
            : "Add a role and clearly named sections.",
    },
  ];
}

export function PromptLibraryShaperWidget({
  lessonId,
  cpId,
}: PromptLibraryShaperWidgetProps): JSX.Element {
  const locale = useClaudeWidgetLocale();
  const german = locale === "de";
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [value, setValue] = useState(german ? SAMPLE_DE : SAMPLE);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checks = useMemo(() => computeChecks(value, locale), [locale, value]);
  const score = Math.round(
    ((checks.filter((c) => c.ok).length +
      checks.filter((c) => c.partial).length * 0.5) /
      checks.length) *
      100,
  );
  const scoreColor =
    score >= 80
      ? "text-risk-green"
      : score >= 50
        ? "text-brand-amber"
        : "text-destructive";

  const showGuidance = async () => {
    setLoading(true);
    setFeedback(null);
    await new Promise((resolve) =>
      setTimeout(resolve, simulatedDelayMs(value)),
    );
    setFeedback(shareabilityFeedback(locale));
    setLoading(false);
    if (score >= 80) complete();
  };

  return (
    <WidgetFrame
      kindLabel={german ? "Für Teams aufbereiten" : "Shape for sharing"}
      title={
        german
          ? "Vom persönlichen zum teilbaren Prompt"
          : "From personal prompt to team prompt"
      }
      scenario={
        german
          ? "Fünf feste lokale Regeln aktualisieren sich direkt. Der Abschluss wird ab 80 Punkten registriert."
          : "Five fixed local rules update immediately. Completion is recorded at 80 points."
      }
      done={done}
      doneLabel={german ? "Erledigt" : "Done"}
    >
      {/* minmax(0, …) rather than a bare fr: a grid item's automatic minimum
          size is min-content, so the monospace prompt column refuses to
          shrink past its longest line and overflows the lesson column at high
          browser zoom, where the shell has less width to give. */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="flex flex-col">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
              {german ? "Prompt" : "Prompt"}
            </span>
            <button
              type="button"
              onClick={() => setValue(german ? IDEAL_DE : IDEAL)}
              className="min-h-11 border border-border bg-background px-2 py-1 font-mono text-xs font-bold uppercase text-muted-foreground transition-colors hover:border-brand-orange/60"
            >
              {german ? "Muster laden" : "Load example"}
            </button>
          </div>
          <textarea
            rows={16}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label={
              german ? "Teilbarer Prompt-Entwurf" : "Shareable prompt draft"
            }
            className="min-h-[360px] flex-1 border-2 border-border bg-background px-3 py-2 font-mono text-[13px] text-foreground focus-visible:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
            {german ? "Prüfungen" : "Shareability checks"}
          </span>
          {checks.map((check) => (
            <div
              key={check.id}
              className={cn(
                "grid grid-cols-[18px_1fr] gap-2 border p-2.5",
                check.ok
                  ? "border-risk-green bg-risk-green/5"
                  : check.partial
                    ? "border-brand-amber bg-brand-amber/10"
                    : "border-border bg-card/40",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white",
                  check.ok
                    ? "bg-risk-green"
                    : check.partial
                      ? "bg-brand-amber"
                      : "bg-border",
                )}
              >
                {check.ok ? "✓" : check.partial ? "~" : ""}
              </span>
              <span>
                <span className="block text-[13px] font-semibold text-foreground">
                  {check.label}
                </span>
                <span className="block text-[12px] leading-[1.4] text-muted-foreground">
                  {check.hint}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span
          className={cn(
            "font-mono text-xs font-bold uppercase tracking-[0.1em]",
            scoreColor,
          )}
        >
          {german ? "Regelabdeckung" : "Rule coverage"} · {score}
        </span>
        <button
          type="button"
          onClick={showGuidance}
          disabled={loading}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
          )}
        >
          {loading
            ? german
              ? "Wird geprüft…"
              : "Reviewing…"
            : german
              ? "Festen Hinweis anzeigen →"
              : "Show fixed guidance →"}
        </button>
      </div>
      <RunConsole
        loading={loading}
        output={feedback}
        onClear={() => setFeedback(null)}
        label={german ? "Fester Hinweis" : "Fixed guidance"}
        tone="amber"
      />
    </WidgetFrame>
  );
}

export default PromptLibraryShaperWidget;
