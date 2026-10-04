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
  TimelineCheckWidget,
  daysUntil,
  localToday,
  parseIsoDay,
  timelineTruth,
} from "./timeline-check";
import {
  SequenceOrderWidget,
  correctPositions,
  initialSequence,
} from "./sequence-order";
import { BucketSortWidget, pyramidWidth } from "./bucket-sort";

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
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("timeline-check", () => {
  const props = {
    ...CP,
    milestones: [
      { id: "lit", date: "2025-02-02", title: "Art. 4 und Art. 5" },
      { id: "high", date: "2027-12-02", title: "Hochrisiko nach Anhang III" },
    ],
    questions: [
      { id: "q1", text: "KI-Kompetenz nach Art. 4", milestone: "lit", why: "Gilt seit Februar 2025." },
      { id: "q2", text: "Betreiberpflichten nach Art. 26", milestone: "high", why: "Verschoben durch die Änderungsverordnung." },
    ],
  };

  it("computes day counts and the answer key against a given day", () => {
    const today = parseIsoDay("2026-10-04");
    expect(daysUntil("2027-12-02", today)).toBe(424);
    expect(daysUntil("2025-02-02", today)).toBe(-609);
    expect(timelineTruth("2026-10-04", today)).toBe("applies");
    expect(timelineTruth("2027-12-02", today)).toBe("pending");
    expect(parseIsoDay("2026-02-30")).toBeNaN();
    expect(localToday(new Date(2026, 9, 4, 23, 30))).toBe(today);
  });

  it("reads today's date on the device, gives instant feedback and completes", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 4, 12, 0));
    const { onComplete } = renderEmbedded(<TimelineCheckWidget {...props} />);
    expect(screen.getByText("Heute: 4. Oktober 2026")).toBeInTheDocument();

    const first = screen.getByText("KI-Kompetenz nach Art. 4").closest("li") as HTMLElement;
    fireEvent.click(within(first).getByRole("button", { name: "Gilt schon" }));
    expect(within(first).getByText("Richtig.")).toBeInTheDocument();
    expect(within(first).getByText(/Gilt seit dem 2\. Februar 2025, vor 609 Tagen/)).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    const second = screen.getByText("Betreiberpflichten nach Art. 26").closest("li") as HTMLElement;
    fireEvent.click(within(second).getByRole("button", { name: "Gilt schon" }));
    expect(within(second).getByText("Daneben.")).toBeInTheDocument();
    expect(within(second).getByText(/Gilt ab dem 2\. Dezember 2027, in 424 Tagen/)).toBeInTheDocument();
    expect(screen.getByText("1 von 2 richtig eingeschätzt")).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(isCheckpointDone(CP.lessonId, CP.cpId)).toBe(true);
  });

  it("ages with the calendar: the same question flips once the date passes", () => {
    const { onComplete } = renderEmbedded(
      <TimelineCheckWidget {...props} today="2028-01-10" passRatio={1} locale="en" />,
    );
    expect(screen.getByText("Today: 10 January 2028")).toBeInTheDocument();
    for (const button of screen.getAllByRole("button", { name: "Applies already" })) {
      fireEvent.click(button);
    }
    expect(screen.getByText("2 of 2 judged correctly")).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("withholds completion below the pass ratio", () => {
    const { onComplete } = renderEmbedded(
      <TimelineCheckWidget {...props} today="2026-10-04" passRatio={1} />,
    );
    for (const button of screen.getAllByRole("button", { name: "Kommt noch" })) {
      fireEvent.click(button);
    }
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText(/Noch nicht sicher genug/)).toBeInTheDocument();
  });

  it("validates dates and milestone references", () => {
    expect(validateExerciseProps("timeline-check", props)).toEqual([]);
    expect(
      validateExerciseProps("timeline-check", {
        ...props,
        milestones: [{ id: "lit", date: "2025-13-01", title: "x" }, props.milestones[1]],
        questions: [...props.questions, { id: "q3", text: "x", milestone: "nope", why: "y" }],
      }),
    ).toEqual([
      "timeline-check: milestone lit needs an ISO date (YYYY-MM-DD)",
      "timeline-check: question q3 points to unknown milestone nope",
    ]);
  });
});

describe("sequence-order", () => {
  const steps = [
    { id: "ack", text: "Eingang bestätigen", why: "Frist sichern." },
    { id: "scope", text: "Umfang prüfen", why: "Erst wissen, was verlangt ist." },
    { id: "collect", text: "Nachweise sammeln", why: "Nur Belegtes zählt." },
    { id: "answer", text: "Wahr antworten", why: "Falsche Angaben kosten." },
  ];

  it("starts from a deterministic order that is never the solution", () => {
    const start = initialSequence(steps);
    expect(start).toEqual(initialSequence(steps));
    expect(start).not.toEqual(steps.map((step) => step.id));
    expect([...start].sort()).toEqual(steps.map((step) => step.id).sort());
    expect(correctPositions(steps.map((step) => step.id), steps)).toBe(4);
  });

  it("moves steps with buttons, marks positions on check and completes when solved", () => {
    const { onComplete } = renderEmbedded(<SequenceOrderWidget {...CP} steps={steps} />);
    fireEvent.click(screen.getByRole("button", { name: "Reihenfolge prüfen" }));
    expect(screen.getByText(/Schritten an der richtigen Stelle/)).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    // Bubble-sort the list into the authored order with the move buttons.
    const target = steps.map((step) => step.id);
    for (let pass = 0; pass < steps.length; pass += 1) {
      for (let index = 0; index < steps.length - 1; index += 1) {
        const items = Array.from(document.querySelectorAll("[data-step-id]")).map(
          (node) => node.getAttribute("data-step-id") as string,
        );
        if (target.indexOf(items[index]) > target.indexOf(items[index + 1])) {
          const text = steps.find((step) => step.id === items[index])?.text ?? "";
          fireEvent.click(screen.getByRole("button", { name: `„${text}“ nach unten` }));
        }
      }
    }
    fireEvent.click(screen.getByRole("button", { name: "Reihenfolge prüfen" }));
    expect(screen.getByText(/Die Reihenfolge stimmt\. nach 2 Prüfungen/)).toBeInTheDocument();
    expect(screen.getByText(/Frist sichern/)).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(isCheckpointDone(CP.lessonId, CP.cpId)).toBe(true);
  });

  it("validates steps", () => {
    expect(validateExerciseProps("sequence-order", { steps })).toEqual([]);
    expect(validateExerciseProps("sequence-order", { steps: steps.slice(0, 2) })).toEqual([
      "sequence-order: needs at least 3 steps",
    ]);
  });
});

describe("bucket-sort pyramid layout", () => {
  it("widens tiers from the top bucket to the base", () => {
    expect([0, 1, 2, 3].map((index) => pyramidWidth(index, 4))).toEqual([
      "sm:w-1/2",
      "sm:w-2/3",
      "sm:w-5/6",
      "sm:w-full",
    ]);
  });

  it("renders the piles as stacked tiers", () => {
    renderEmbedded(
      <BucketSortWidget
        {...CP}
        layout="pyramid"
        buckets={[
          { id: "top", label: "Verboten" },
          { id: "base", label: "Minimal" },
        ]}
        items={[
          { id: "a", text: "Emotionserkennung am Arbeitsplatz", bucket: "top", why: "Art. 5." },
          { id: "b", text: "Spamfilter", bucket: "base", why: "Minimal." },
          { id: "c", text: "Lagerverwaltung", bucket: "base", why: "Minimal." },
        ]}
      />,
    );
    const layout = document.querySelector("[data-layout]");
    expect(layout?.getAttribute("data-layout")).toBe("pyramid");
    expect(document.querySelector('[data-bucket-id="base"]')?.className).toContain("sm:w-full");
    expect(validateExerciseProps("bucket-sort", { layout: "circle", buckets: [], items: [] })).toContain(
      'bucket-sort: layout must be "grid" or "pyramid"',
    );
  });
});
