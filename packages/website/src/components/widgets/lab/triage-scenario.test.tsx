import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetCacheForTests,
  continueWithAnonymousProgress,
  isCheckpointDone,
} from "@/lib/progress/store";
import { MotionProvider } from "@/components/motion-provider";
import { validateExerciseProps } from "@/lib/lesson-engine/validate-exercise";
import { LabEmbedContext } from "./lab-context";
import {
  DEFAULT_TRIAGE_SCORE,
  TriageMatrixWidget,
  rankTriage,
  triageAgreement,
  type TriageItem,
} from "./triage-matrix";
import { ScenarioRunWidget, runScenario, type ScenarioRunProps } from "./scenario-run";

const CP = { lessonId: "test-course:lesson-1", cpId: "exercise" } as const;

function renderEmbedded(ui: React.ReactElement, onComplete = vi.fn()) {
  const result = render(
    <MotionProvider>
      <LabEmbedContext.Provider value={{ embedded: true, onComplete }}>{ui}</LabEmbedContext.Provider>
    </MotionProvider>,
  );
  return { ...result, onComplete };
}

beforeEach(() => {
  window.localStorage.clear();
  __resetCacheForTests();
  continueWithAnonymousProgress();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("triage-matrix", () => {
  const items: TriageItem[] = [
    { id: "faq", text: "FAQ-Antwort", reference: { f: 3, c: 1, k: 3 }, why: "Oft, billig, schnell prüfbar." },
    { id: "contract", text: "Vertragsklausel", reference: { f: 1, c: 3, k: 1 }, why: "Selten, teuer, schwer prüfbar." },
    { id: "minutes", text: "Protokoll", reference: { f: 2, c: 2, k: 2 }, why: "Mittel." },
    { id: "report", text: "Wochenbericht", reference: { f: 2, c: 1, k: 3 }, why: "Wöchentlich, prüfbar." },
  ];

  it("ranks by the transparent score and keeps authored order on ties", () => {
    const ranked = rankTriage(items, (item) => item.reference, DEFAULT_TRIAGE_SCORE);
    expect(ranked.map(({ entry }) => entry.id)).toEqual(["faq", "report", "minutes", "contract"]);
    expect(ranked[0].score).toBe(27);
    expect(ranked[3].score).toBe(1);
  });

  it("counts axis ratings that match the reference", () => {
    expect(triageAgreement(items, { faq: { f: 3, c: 1, k: 2 } })).toEqual({ same: 2, total: 12 });
  });

  it("evaluates once every task is rated, explains differences and completes", () => {
    const { onComplete } = renderEmbedded(<TriageMatrixWidget {...CP} items={items} pick={2} allowOwn={false} />);
    const evaluate = screen.getByRole("button", { name: "Auswerten" });
    expect(evaluate).toBeDisabled();
    for (const item of items) {
      fireEvent.click(screen.getByRole("radio", { name: `${item.text}: Wie oft? ${["selten", "wöchentlich", "täglich"][item.reference.f - 1]}` }));
      fireEvent.click(screen.getByRole("radio", { name: `${item.text}: Was kostet ein Fehler? ${["wenig", "spürbar", "hoch"][item.reference.c - 1]}` }));
      fireEvent.click(screen.getByRole("radio", { name: `${item.text}: Wie schnell prüfbar? ${["schwer", "mit Aufwand", "auf einen Blick"][item.reference.k - 1]}` }));
    }
    expect(screen.getByText("4 von 4 Aufgaben bewertet")).toBeInTheDocument();
    fireEvent.click(evaluate);
    expect(screen.getByRole("heading", { name: "Deine Top 2" })).toHaveFocus();
    expect(screen.getByText("12 von 12 Einschätzungen wie die Referenz")).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(isCheckpointDone(CP.lessonId, CP.cpId)).toBe(true);
  });

  it("lets learners add and rate a task of their own", () => {
    renderEmbedded(<TriageMatrixWidget {...CP} items={items} locale="en" />);
    fireEvent.change(screen.getByLabelText("Add a task of your own"), { target: { value: "Ticket digest" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("0 of 5 tasks rated")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Ticket digest" })).toBeInTheDocument();
  });

  it("validates reference ratings and the pick count", () => {
    expect(
      validateExerciseProps("triage-matrix", {
        items: [
          { id: "a", text: "A", why: "w", reference: { f: 1, c: 2, k: 4 } },
          { id: "b", text: "B", why: "w", reference: { f: 1, c: 2, k: 3 } },
        ],
        pick: 5,
        score: "f * z",
      }),
    ).toEqual(
      expect.arrayContaining([
        "triage-matrix: needs at least 4 items",
        "triage-matrix: item a reference.k must be 1, 2 or 3",
        "triage-matrix: pick must be at least 1 and below the item count",
        "triage-matrix score: unknown variable(s) z",
      ]),
    );
  });
});

describe("scenario-run", () => {
  const props: ScenarioRunProps = {
    ...CP,
    goalLabel: "Bring alle Fälle durch, ohne alles manuell zu prüfen.",
    successTitle: "Lauf bestanden",
    steps: [
      { id: "draft", label: "KI schreibt Entwurf", optional: false },
      { id: "mask", label: "Daten maskieren" },
      { id: "review", label: "Freigabe vor Versand" },
      { id: "manual", label: "Alles manuell prüfen" },
    ],
    cases: [
      { id: "pii", label: "Mail mit IBAN", text: "IBAN DE00", pass: "mask || manual", passText: "maskiert", failText: "IBAN geht raus" },
      { id: "wrong", label: "Falsche Zusage", text: "Rabatt?", pass: "review || manual", passText: "gestoppt", failText: "Zusage verschickt" },
    ],
    metrics: [{ id: "minutes", label: "Minuten pro Tag", formula: "manual ? 90 : review * 15", format: "int" }],
    goal: "passed == total && minutes <= 30",
    goalMissHint: "Alle Fälle bestehen, aber die Prüfzeit ist zu hoch.",
  };

  it("evaluates cases, metrics and the goal purely", () => {
    const miss = runScenario(props.steps, props.cases, props.metrics ?? [], props.goal, { manual: 1 });
    expect(miss.passed).toBe(2);
    expect(miss.scope.minutes).toBe(90);
    expect(miss.goalMet).toBe(false);
    const hit = runScenario(props.steps, props.cases, props.metrics ?? [], props.goal, { mask: 1, review: 1 });
    expect(hit.goalMet).toBe(true);
    expect(hit.scope.active).toBe(2);
  });

  it("runs, explains failures, marks stale results and completes on the goal", () => {
    const { onComplete } = renderEmbedded(<ScenarioRunWidget {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Testlauf starten" }));
    expect(screen.getByRole("heading", { name: "Ergebnis des Testlaufs" })).toHaveFocus();
    expect(screen.getByText("0 von 2 Fällen bestanden", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("IBAN geht raus")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("switch", { name: "Alles manuell prüfen" }));
    expect(screen.getByText(/Starte einen neuen Testlauf/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Neuer Testlauf" }));
    expect(screen.getByText("Alle Fälle bestehen, aber die Prüfzeit ist zu hoch.")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("switch", { name: "Alles manuell prüfen" }));
    fireEvent.click(screen.getByRole("switch", { name: "Daten maskieren" }));
    fireEvent.click(screen.getByRole("switch", { name: "Freigabe vor Versand" }));
    fireEvent.click(screen.getByRole("button", { name: "Neuer Testlauf" }));
    expect(screen.getByText("Lauf bestanden")).toBeInTheDocument();
    const pii = document.querySelector('[data-case-id="pii"]') as HTMLElement;
    expect(within(pii).getByText("maskiert")).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(isCheckpointDone(CP.lessonId, CP.cpId)).toBe(true);
  });

  it("rejects goals that the defaults already meet or that no switch setting reaches", () => {
    const base = {
      steps: props.steps,
      cases: props.cases,
      metrics: props.metrics,
      goalLabel: "x",
      successTitle: "y",
    };
    expect(validateExerciseProps("scenario-run", { ...base, goal: props.goal })).toEqual([]);
    expect(validateExerciseProps("scenario-run", { ...base, goal: "passed >= 0" })).toContain(
      "scenario-run: the default switches already meet the goal",
    );
    expect(validateExerciseProps("scenario-run", { ...base, goal: "passed == total && minutes < 0" })).toContain(
      "scenario-run: the goal is unreachable",
    );
    expect(validateExerciseProps("scenario-run", { ...base, goal: "nope == 1" })).toContain(
      "scenario-run goal: unknown variable(s) nope",
    );
  });
});
