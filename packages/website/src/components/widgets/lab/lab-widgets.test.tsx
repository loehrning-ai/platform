import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetCacheForTests,
  continueWithAnonymousProgress,
  isCheckpointDone,
} from "@/lib/progress/store";
import { MotionProvider } from "@/components/motion-provider";
import { LabEmbedContext } from "./lab-context";
import { BucketSortWidget, scoreBucketSort } from "./bucket-sort";
import { ClaimCheckerWidget, scoreClaims } from "./claim-checker";
import { CalculatorWidget, computeCalculatorScope } from "./calculator";
import {
  ThresholdLabWidget,
  generateThresholdPopulation,
  groupMetrics,
} from "./threshold-lab";
import { DecisionWizardWidget, walkWizard } from "./decision-wizard";
import { LivePromptAbWidget, composePrompt, rubricAgreement } from "./live-prompt-ab";
import { DocBuilderWidget, renderDocTemplate } from "./doc-builder";
import { PiiRedactorWidget, detectPii, gradeRedaction, maskText } from "./pii-redactor";
import { formatLabValue } from "./_lab";

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

describe("bucket-sort", () => {
  const props = {
    ...CP,
    buckets: [
      { id: "public", label: "Öffentlich" },
      { id: "never", label: "Nie eingeben" },
    ],
    items: [
      { id: "press", text: "Pressetext", bucket: "public", why: "Schon veröffentlicht." },
      { id: "key", text: "API-Schlüssel", bucket: "never", why: "Zugangsdaten nie." },
    ],
  };

  it("explains each placement instantly and completes after the last card", () => {
    const { onComplete } = renderEmbedded(<BucketSortWidget {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /Pressetext/ }));
    fireEvent.click(screen.getByRole("button", { name: /Nie eingeben/ }));
    expect(screen.getByText(/Gehört zu: Öffentlich/)).toBeInTheDocument();
    expect(screen.getByText("Schon veröffentlicht.")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    const key = screen.getByRole("button", { name: /API-Schlüssel/ });
    fireEvent.keyDown(key, { key: "2" });
    expect(screen.getByText("1 von 2 beim ersten Versuch richtig")).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(isCheckpointDone(CP.lessonId, CP.cpId)).toBe(true);
    // The misplaced card is reviewed with its reason.
    expect(screen.getByText("Diese Karten lagen zuerst falsch")).toBeInTheDocument();
  });

  it("withholds completion below the pass ratio and offers a retry", () => {
    const { onComplete } = renderEmbedded(<BucketSortWidget {...props} passRatio={1} />);
    fireEvent.keyDown(screen.getByRole("button", { name: /Pressetext/ }), { key: "2" });
    fireEvent.keyDown(screen.getByRole("button", { name: /API-Schlüssel/ }), { key: "2" });
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Nochmal sortieren/ }));
    expect(screen.getByRole("button", { name: /Pressetext/ })).toBeInTheDocument();
  });

  it("scores first-try placements", () => {
    expect(
      scoreBucketSort(props.items, {
        press: { bucket: "public", picked: "public", firstTryCorrect: true },
      }),
    ).toEqual({ placed: 1, firstTryRight: 1 });
  });
});

describe("claim-checker", () => {
  const props = {
    ...CP,
    sources: [{ id: "A", label: "Quelle A", text: "Budget: 1,8 Mio. EUR." }],
    draft: [
      { text: "Budget " },
      { text: "18 Mio. EUR", claimId: "budget" },
      { text: ", Leitung " },
      { text: "Frau Keller", claimId: "lead" },
    ],
    claims: [
      { id: "budget", verdict: "contradicted" as const, sourceId: "A", evidence: "Budget: 1,8 Mio. EUR.", correction: "1,8 Mio. EUR", why: "Faktor zehn." },
      { id: "lead", verdict: "missing" as const, why: "Keine Quelle." },
    ],
  };

  it("lets the learner judge every claim, then reveals a scored answer key", () => {
    const { onComplete } = renderEmbedded(<ClaimCheckerWidget {...props} />);
    const evaluate = screen.getByRole("button", { name: "Auswerten" });
    expect(evaluate).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "widersprochen" }));
    fireEvent.click(screen.getByRole("button", { name: "belegt" }));
    expect(evaluate).toBeEnabled();
    fireEvent.click(evaluate);
    expect(onComplete).toHaveBeenCalledTimes(1);
    const results = document.querySelectorAll("[data-claim-result]");
    expect([...results].map((node) => node.getAttribute("data-claim-result"))).toEqual(["right", "wrong"]);
    expect(screen.getByText(/Korrekt: 1,8 Mio. EUR/)).toBeInTheDocument();
  });

  it("scores verdicts against the key", () => {
    expect(scoreClaims(props.claims, { budget: "contradicted", lead: "supported" })).toBe(1);
  });
});

describe("calculator", () => {
  const props = {
    ...CP,
    inputs: [
      {
        id: "impact",
        label: "Wirkung",
        type: "select" as const,
        default: 1,
        options: [
          { value: 1, label: "Kosmetisch" },
          { value: 3, label: "Folgenreich" },
        ],
      },
      { id: "audience", label: "Empfänger", type: "slider" as const, min: 1, max: 3, step: 1, default: 1 },
    ],
    outputs: [
      { id: "points", label: "Punkte", formula: "impact + audience", format: "int" as const },
      { id: "level", label: "Stufe", formula: "impact == 3 ? 3 : 1", format: "int" as const, emphasis: true },
    ],
    verdicts: [
      { when: "level == 3", tone: "bad" as const, title: "Stufe 3: Freigabe" },
      { when: "true", tone: "good" as const, title: "Stufe 1: Gegenlesen" },
    ],
    goals: [{ id: "c", label: "Fall C", when: "impact == 3 && audience == 3", insight: "Stufe 3." }],
  };

  it("recomputes outputs, switches the verdict and completes when every goal is met", async () => {
    const { onComplete } = renderEmbedded(<CalculatorWidget {...props} />);
    expect(screen.getByText("Stufe 1: Gegenlesen")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Folgenreich" }));
    expect(await screen.findByText("Stufe 3: Freigabe")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Empfänger"), { target: { value: "3" } });
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(document.querySelector('[data-goal-id="c"]')).toHaveAttribute("data-goal-met", "1");
    expect(screen.getByText("Stufe 3.")).toBeInTheDocument();
  });

  it("evaluates outputs in order against the input values", () => {
    expect(computeCalculatorScope(props.inputs, props.outputs, { impact: 3 })).toEqual({
      impact: 3,
      audience: 1,
      points: 4,
      level: 3,
    });
  });

  it("formats values per locale", () => {
    expect(formatLabValue(1234.5, "eur", "de")).toMatch(/1\.235\s?€/);
    expect(formatLabValue(0.25, "percent", "en")).toBe("25%");
    expect(formatLabValue(Number.NaN, "int", "de")).toBe("—");
  });
});

describe("threshold-lab", () => {
  const groups = [
    { id: "a", label: "Gruppe A", baseRate: 0.5, n: 100 },
    { id: "b", label: "Gruppe B", baseRate: 0.2, n: 100 },
  ] as const;

  it("generates deterministic populations with the requested base rate", () => {
    const first = generateThresholdPopulation(groups[0]);
    expect(first).toEqual(generateThresholdPopulation(groups[0]));
    expect(first.filter((person) => person.positive)).toHaveLength(50);
  });

  it("shows equal error rates but unequal precision under one shared threshold", () => {
    const a = groupMetrics(generateThresholdPopulation(groups[0]), 0.5);
    const b = groupMetrics(generateThresholdPopulation(groups[1]), 0.5);
    expect(Math.abs(a.fpr - b.fpr)).toBeLessThan(0.03);
    expect(Math.abs(a.fnr - b.fnr)).toBeLessThan(0.03);
    expect(a.ppv - b.ppv).toBeGreaterThan(0.15);
  });

  it("renders the metrics table and completes when the goals are met", async () => {
    const { onComplete } = renderEmbedded(
      <ThresholdLabWidget
        {...CP}
        groups={groups}
        goals={[{ id: "split", label: "Trenne die Schwellen", when: "split == 1" }]}
      />,
    );
    expect(document.querySelector('[data-metric="ppv"]')).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: /Getrennte Schwellen/ }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(screen.getAllByRole("slider")).toHaveLength(2);
  });
});

describe("decision-wizard", () => {
  const props = {
    ...CP,
    start: "q1",
    nodes: [
      {
        id: "q1",
        question: "Ist das Tool freigegeben?",
        options: [
          { label: "Ja", next: "q2" },
          { label: "Nein", result: "ask" },
        ],
      },
      { id: "q2", question: "Datenklasse?", options: [{ label: "Intern", result: "go" }] },
    ],
    results: [
      { id: "go", tone: "good" as const, title: "Los, mit Prüfung", body: "Weiter." },
      { id: "ask", tone: "warn" as const, title: "Freigabe anfragen", body: "Fragen." },
    ],
    scenarios: [
      { id: "s1", text: "Fall eins", expected: "go" },
      { id: "s2", text: "Fall zwei", expected: "go", why: "Weil." },
    ],
  };

  it("walks branches, compares each case with the expected result and completes after all cases", () => {
    const { onComplete } = renderEmbedded(<DecisionWizardWidget {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Ja" }));
    fireEvent.click(screen.getByRole("button", { name: "Intern" }));
    expect(screen.getByText("Passt zum Fall.")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Nächster Fall" }));
    fireEvent.click(screen.getByRole("button", { name: "Nein" }));
    expect(screen.getByText(/Für diesen Fall wäre richtig: Los, mit Prüfung/)).toBeInTheDocument();
    expect(screen.getByText("Weil.")).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText("1 von 2 Fällen richtig entschieden")).toBeInTheDocument();
  });

  it("resolves paths purely", () => {
    expect(walkWizard("q1", props.nodes, [{ nodeId: "q1", optionIndex: 0 }])).toEqual({ nodeId: "q2", resultId: null });
    expect(walkWizard("q1", props.nodes, [{ nodeId: "q1", optionIndex: 1 }])).toEqual({ nodeId: null, resultId: "ask" });
  });
});

describe("live-prompt-ab", () => {
  const props = {
    ...CP,
    task: "Antwort entwerfen",
    input: { label: "Mail", text: "Lieferung zu spät." },
    variants: [
      { label: "Schwach", prompt: "Schreib was.", recorded: "Rabatt 10 %." },
      { label: "Stark", prompt: "Nur Fakten.", recorded: "[Ursache]" },
    ] as const,
    rubric: [
      { id: "cause", label: "Erfindet nichts", expected: { a: false, b: true } },
      { id: "tone", label: "Höflich", expected: { a: true, b: true } },
    ],
  };

  it("falls back to labelled recorded outputs when live mode is unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 503 }));
    const { onComplete } = renderEmbedded(<LivePromptAbWidget {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Beide ausführen" }));
    expect(await screen.findByText("Rabatt 10 %.")).toBeInTheDocument();
    expect(screen.getAllByText("Aufgezeichnetes Beispiel")).toHaveLength(2);
    expect(screen.getByText(/Live-Modus nicht verfügbar/)).toBeInTheDocument();

    for (const criterion of ["Erfindet nichts", "Höflich"]) {
      for (const side of ["A", "B"]) {
        const group = screen.getByRole("group", { name: `${criterion}: ${side}` });
        fireEvent.click(within(group).getByRole("button", { name: "erfüllt" }));
      }
    }
    fireEvent.click(screen.getByRole("button", { name: "Auswerten" }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText("3 von 4 Urteilen stimmen mit der Musterlösung überein")).toBeInTheDocument();
  });

  it("shows live outputs when the practice API answers", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response(JSON.stringify({ text: "Live-Antwort" }), { status: 200 }),
    );
    renderEmbedded(<LivePromptAbWidget {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Beide ausführen" }));
    expect(await screen.findAllByText("Live-Antwort")).toHaveLength(2);
    expect(screen.getAllByText("Live-Modell")).toHaveLength(2);
  });

  it("composes prompts with the material and scores agreement", () => {
    expect(composePrompt("Nur Fakten.", props.input)).toBe("Nur Fakten.\n\nMail:\nLieferung zu spät.");
    expect(rubricAgreement(props.rubric, { cause: { a: false, b: true }, tone: { a: true } })).toBe(3);
  });
});

describe("doc-builder", () => {
  const props = {
    ...CP,
    filename: "richtlinie.md",
    template: "# {{org}}\n\nNie:\n{{never}}\n\nKanal: {{incident}}",
    fields: [
      { id: "org", label: "Organisation", type: "text" as const, required: true },
      { id: "never", label: "Nie eingeben", type: "checkboxes" as const, options: ["Passwörter", "Gehalt"], default: ["Passwörter"] },
      { id: "incident", label: "Meldekanal", type: "text" as const, required: true },
    ],
  };

  it("renders a live preview with visible placeholders and completes on copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const { onComplete } = renderEmbedded(<DocBuilderWidget {...props} />);
    const preview = document.querySelector("[data-doc-preview]") as HTMLElement;
    await waitFor(() => expect(screen.getByLabelText(/Organisation/)).toBeEnabled());
    expect(preview.textContent).toContain("[Meldekanal]");
    expect(screen.getByRole("button", { name: /Text kopieren/ })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Organisation/), { target: { value: "Team Nord" } });
    fireEvent.change(screen.getByLabelText(/Meldekanal/), { target: { value: "Ticket KI-Vorfall" } });
    expect(preview.textContent).toContain("# Team Nord");
    expect(preview.textContent).toContain("- Passwörter");
    fireEvent.click(screen.getByRole("button", { name: /Text kopieren/ }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Kanal: Ticket KI-Vorfall"));
  });

  it("keeps fields disabled until a learning owner is resolved", async () => {
    const { activateUnknownProgress } = await import("@/lib/progress/store");
    act(() => {
      activateUnknownProgress();
    });
    renderEmbedded(<DocBuilderWidget {...props} />);
    expect(screen.getByLabelText(/Organisation/)).toBeDisabled();
  });

  it("renders templates purely", () => {
    expect(renderDocTemplate("{{org}} / {{never}} / {{x}}", props.fields, { org: " A ", never: [] })).toBe(
      "A / [Nie eingeben] / [x]",
    );
  });
});

describe("pii-redactor", () => {
  const props = {
    ...CP,
    segments: [
      { text: "Hallo, " },
      { text: "Petra Sommerfeld", pii: "Name" },
      { text: " meldet " },
      { text: "acht Tage Verzug" },
    ],
  };

  it("grades a redaction and completes only when it is clean", () => {
    const { onComplete } = renderEmbedded(<PiiRedactorWidget {...props} freeText={false} />);
    fireEvent.click(screen.getByRole("button", { name: "acht Tage Verzug" }));
    fireEvent.click(screen.getByRole("button", { name: /Einfügen prüfen/ }));
    expect(screen.getByText(/1 Angabe ist noch offen/)).toBeInTheDocument();
    expect(screen.getByText(/unnötig geschwärzt/)).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /acht Tage Verzug/ }));
    fireEvent.click(screen.getByRole("button", { name: "Petra Sommerfeld" }));
    fireEvent.click(screen.getByRole("button", { name: /Einfügen prüfen/ }));
    expect(screen.getByText(/Sauber/)).toBeInTheDocument();
    expect(screen.getByText(/Hallo, \[Name\] meldet acht Tage Verzug/)).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("detects and masks patterns in free text", () => {
    const text = "Mail a.b@example.com, Tel. 0171 5550123, IBAN DE00 1111 2222 3333 4444 55, geb. 01.02.1990";
    const hits = detectPii(text);
    expect(hits.map((hit) => hit.type)).toEqual(["E-Mail", "Telefon", "IBAN", "Datum"]);
    expect(maskText(text, hits)).toBe("Mail [E-Mail], Tel. [Telefon], IBAN [IBAN], geb. [Datum]");
  });

  it("grades misses and over-redactions", () => {
    expect(gradeRedaction(props.segments, new Set([3]))).toEqual({ missed: [1], over: [3], caught: 0 });
  });
});
