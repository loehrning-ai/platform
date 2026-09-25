import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getWorkshopBySlug, getWorkshops } from "@/lib/workshops";
import {
  orderDecisionOptions,
  selectFeedback,
  WorkshopDecisionLab,
} from "./workshop-decision-lab";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("<WorkshopDecisionLab>", () => {
  for (const locale of ["de", "en"] as const) {
    for (const workshop of getWorkshops(locale)) {
      it(`keeps ${locale}/${workshop.slug} inert in server-rendered HTML`, () => {
        const container = document.createElement("div");
        container.innerHTML = renderToStaticMarkup(
          <WorkshopDecisionLab config={workshop.decisionLab} locale={locale} />,
        );

        expect(container.querySelector("form")).toHaveAttribute("aria-busy", "true");
        const fieldsets = container.querySelectorAll("fieldset");
        expect(fieldsets).toHaveLength(2);
        for (const fieldset of fieldsets) expect(fieldset).toBeDisabled();
        for (const radio of container.querySelectorAll('input[type="radio"]')) {
          expect(radio).toBeDisabled();
        }
        expect(container.querySelector('button[type="submit"]')).toBeDisabled();
        expect(container.textContent).toContain(locale === "en"
          ? "The choices unlock once JavaScript has loaded."
          : "Die Auswahl wird freigeschaltet, sobald JavaScript geladen ist.");
        expect(container.querySelector("noscript")?.textContent).toContain(locale === "en"
          ? "JavaScript is required for this exercise."
          : "Diese Übung benötigt JavaScript.");
      });
    }
  }

  it("takes its interface copy from the locale prop, not from the config text", () => {
    const workshop = getWorkshopBySlug("ki-prognosen-einschaetzen", "en")!;
    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(
      <WorkshopDecisionLab config={workshop.decisionLab} locale="de" />,
    );
    expect(container.textContent).toContain(
      "Die Auswahl wird freigeschaltet, sobald JavaScript geladen ist.",
    );
    const source = readFileSync(
      resolve(process.cwd(), "src/app/workshops/[slug]/workshop-decision-lab.tsx"),
      "utf8",
    );
    expect(source).not.toContain('=== "Decision feedback"');
  });

  it("uses one set of lab labels across all three workshops", () => {
    for (const [locale, labels] of [
      ["de", { kicker: /^Entscheidung 01 · /, decision: "Deine erste Entscheidung", evidence: "Der stärkste Beleg", submit: "Entscheidung prüfen" }],
      ["en", { kicker: /^Decision 01 · /, decision: "Your first decision", evidence: "The strongest evidence", submit: "Check decision" }],
    ] as const) {
      for (const workshop of getWorkshops(locale)) {
        const lab = workshop.decisionLab;
        expect(lab.kicker, workshop.slug).toMatch(labels.kicker);
        expect(lab.decisionLegend, workshop.slug).toBe(labels.decision);
        expect(lab.evidenceLegend, workshop.slug).toBe(labels.evidence);
        expect(lab.submitLabel, workshop.slug).toBe(labels.submit);
      }
    }
  });

  it("does not turn the activated submit element into a native reset button", () => {
    const workshop = getWorkshopBySlug("datenbereitschaft-fuer-ki", "en")!;
    render(<WorkshopDecisionLab config={workshop.decisionLab} locale="en" />);
    const submit = screen.getByRole("button", { name: "Check decision" });
    fireEvent.click(screen.getByRole("radio", { name: workshop.decisionLab.choices[0].label }));
    fireEvent.click(screen.getByRole("radio", { name: workshop.decisionLab.evidence[0].label }));
    fireEvent.submit(submit.closest("form")!);

    const reset = screen.getByRole("button", { name: "Reset" });
    expect(reset).not.toBe(submit);
    expect(submit).toHaveAttribute("type", "submit");
    expect(reset).toHaveAttribute("type", "reset");
    expect(screen.getByRole("radio", { name: workshop.decisionLab.choices[0].label })).toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent(workshop.decisionLab.feedback.aligned.title);
    expect(reset).toHaveFocus();
  });

  it("announces submit-time validation and focuses the first missing choice", async () => {
    const workshop = getWorkshopBySlug("ki-prognosen-einschaetzen", "de");
    expect(workshop).toBeDefined();
    render(<WorkshopDecisionLab config={workshop!.decisionLab} locale="de" />);

    const submit = screen.getByRole("button", {
      name: "Entscheidung prüfen",
    });
    // Validation focuses whichever option is rendered first in each group.
    const [decisionGroup, evidenceGroup] = screen.getAllByRole("group");
    const firstChoice = within(decisionGroup).getAllByRole("radio")[0];
    const firstEvidence = within(evidenceGroup).getAllByRole("radio")[0];
    expect(submit).toBeEnabled();
    expect(firstChoice).toBeRequired();

    fireEvent.click(submit);
    const decisionAlert = screen.getByRole("alert");
    expect(decisionAlert).toHaveTextContent(
      "Wähle eine Entscheidung aus, bevor du das Ergebnis prüfst.",
    );
    await waitFor(() => expect(firstChoice).toHaveFocus());
    expect(firstChoice.closest("fieldset")).toHaveAttribute(
      "aria-describedby",
      decisionAlert.id,
    );

    fireEvent.click(firstChoice);
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(submit);
    const evidenceAlert = screen.getByRole("alert");
    expect(evidenceAlert).toHaveTextContent(
      "Wähle den stärksten Beleg aus, bevor du das Ergebnis prüfst.",
    );
    await waitFor(() => expect(firstEvidence).toHaveFocus());
    expect(firstEvidence.closest("fieldset")).toHaveAttribute(
      "aria-describedby",
      evidenceAlert.id,
    );

    fireEvent.click(firstEvidence);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("returns evidence-based feedback through a polite live region and resets cleanly", async () => {
    const workshop = getWorkshopBySlug("ki-prognosen-einschaetzen", "de");
    expect(workshop).toBeDefined();
    render(<WorkshopDecisionLab config={workshop!.decisionLab} locale="de" />);

    const firstChoice = screen.getByRole("radio", {
      name: /Proportional nach geschätzter Nachfrage/,
    });
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLInputElement.prototype, "scrollIntoView", {
      configurable: true,
      writable: true,
      value: scrollIntoView,
    });
    fireEvent.click(firstChoice);
    fireEvent.click(
      screen.getByRole("radio", {
        name: /Liefergrenze liegt 130 Stück unter/,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Entscheidung prüfen" }),
    );

    const status = screen.getByRole("status", {
      name: "Auswertung der Entscheidung",
    });
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(within(status).getByText("Freigabe mit Tor")).toBeInTheDocument();
    expect(status).toHaveTextContent(/Knappheit.*Zuteilungsregel/);
    expect(
      screen.queryByRole("button", { name: "Entscheidung prüfen" }),
    ).toBeNull();
    // A fully correct answer resets instead of inviting another try.
    expect(
      screen.getByRole("button", { name: "Zurücksetzen" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Zurücksetzen" }));
    expect(firstChoice).not.toBeChecked();
    // A retry reorders the options; focus returns to whichever is first now.
    const firstRendered = within(
      screen.getAllByRole("group")[0],
    ).getAllByRole("radio")[0];
    await waitFor(() => {
      expect(firstRendered).toHaveFocus();
      expect(scrollIntoView).toHaveBeenCalledWith({
        block: "center",
        inline: "nearest",
      });
    });
    expect(
      screen.getByRole("button", { name: "Entscheidung prüfen" }),
    ).toBeEnabled();
    expect(status).toBeEmptyDOMElement();
    delete (HTMLInputElement.prototype as { scrollIntoView?: unknown })
      .scrollIntoView;
  });

  it("uses the selected evidence to challenge an unsupported English decision", () => {
    const workshop = getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "en");
    expect(workshop).toBeDefined();
    render(<WorkshopDecisionLab config={workshop!.decisionLab} locale="en" />);

    fireEvent.click(
      screen.getByRole("radio", {
        name: /Increase Q3 marketing immediately/,
      }),
    );
    fireEvent.click(
      screen.getByRole("radio", {
        name: /most quality defects.*second month/i,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Check decision" }));

    expect(
      within(
        screen.getByRole("status", { name: "Decision feedback" }),
      ).getByText("The evidence contradicts the decision"),
    ).toBeInTheDocument();
  });

  it("does not persist or transmit the learner's selections", () => {
    const workshop = getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "en");
    expect(workshop).toBeDefined();
    const localStorageWrite = vi.spyOn(window.localStorage, "setItem");
    const sessionStorageWrite = vi.spyOn(window.sessionStorage, "setItem");
    const fetchCall = vi.fn();
    vi.stubGlobal("fetch", fetchCall);

    render(<WorkshopDecisionLab config={workshop!.decisionLab} locale="en" />);
    fireEvent.click(
      screen.getByRole("radio", { name: /Hold the budget increase/ }),
    );
    fireEvent.click(
      screen.getByRole("radio", {
        name: /most quality defects.*second month/i,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Check decision" }));

    expect(localStorageWrite).not.toHaveBeenCalled();
    expect(sessionStorageWrite).not.toHaveBeenCalled();
    expect(fetchCall).not.toHaveBeenCalled();
    expect(
      screen.getByText(/selection and result are neither stored nor sent/i),
    ).toBeInTheDocument();
  });

  it("uses flat state changes without authored motion or undersized labels", () => {
    const workshop = getWorkshopBySlug("ki-prognosen-einschaetzen", "en");
    expect(workshop).toBeDefined();
    render(<WorkshopDecisionLab config={workshop!.decisionLab} locale="en" />);

    const choice = screen
      .getByRole("radio", {
        name: /Allocate proportionally/,
      })
      .closest("label");
    expect(choice).not.toBeNull();
    expect(choice).toHaveClass("transition-colors");
    expect(choice?.className).not.toMatch(
      /translate|motion-safe|motion-reduce/,
    );
    expect(screen.getByText(workshop!.decisionLab.kicker)).toHaveClass(
      "text-xs",
      "text-brand-orange",
    );

    const source = readFileSync(
      resolve(
        process.cwd(),
        "src/app/workshops/[slug]/workshop-decision-lab.tsx",
      ),
      "utf8",
    );
    expect(source).not.toMatch(/text-\[(?:9|10|11)(?:\.\d+)?px\]/);
    expect(source).not.toMatch(/motion-safe|motion-reduce|animate-|shadow-/);
    expect(source).toContain(
      "grid grid-cols-1 border-y border-border sm:grid-cols-3",
    );
  });
});

describe("<WorkshopDecisionLab> option order and outcome feedback", () => {
  for (const locale of ["de", "en"] as const) {
    for (const workshop of getWorkshops(locale)) {
      it(`${locale}/${workshop.slug}: never opens with the answers on top, identically on server and client`, () => {
        const lab = workshop.decisionLab;
        const first = orderDecisionOptions(lab, 0);
        expect(first.choices[0].id).not.toBe(lab.recommendedChoiceId);
        expect(first.evidence[0].id).not.toBe(lab.strongestEvidenceId);
        expect(
          first.choices.findIndex(({ id }) => id === lab.recommendedChoiceId),
        ).not.toBe(
          first.evidence.findIndex(({ id }) => id === lab.strongestEvidenceId),
        );
        expect(orderDecisionOptions(lab, 0)).toEqual(first);

        const server = document.createElement("div");
        server.innerHTML = renderToStaticMarkup(<WorkshopDecisionLab config={lab} locale={locale} />);
        const serverValues = [...server.querySelectorAll<HTMLInputElement>('input[type="radio"]')].map((input) => input.value);
        const { container, unmount } = render(<WorkshopDecisionLab config={lab} locale={locale} />);
        const clientValues = [...container.querySelectorAll<HTMLInputElement>('input[type="radio"]')].map((input) => input.value);
        expect(clientValues).toEqual(serverValues);
        expect(serverValues).toEqual([...first.choices, ...first.evidence].map(({ id }) => id));
        unmount();

        let previous = first;
        for (let attempt = 1; attempt < 6; attempt += 1) {
          const next = orderDecisionOptions(lab, attempt, previous);
          expect(next).not.toEqual(previous);
          previous = next;
        }
      });
    }
  }

  it("reorders the options after a retry", () => {
    const workshop = getWorkshopBySlug("datenbereitschaft-fuer-ki", "en")!;
    const { container } = render(<WorkshopDecisionLab config={workshop.decisionLab} locale="en" />);
    const values = () => [...container.querySelectorAll<HTMLInputElement>('input[type="radio"]')].map((input) => input.value);
    const before = values();
    fireEvent.click(screen.getByRole("radio", { name: workshop.decisionLab.choices[1].label }));
    fireEvent.click(screen.getByRole("radio", { name: workshop.decisionLab.evidence[1].label }));
    fireEvent.click(screen.getByRole("button", { name: "Check decision" }));
    fireEvent.click(screen.getByRole("button", { name: "Decide again" }));
    expect(values()).not.toEqual(before);
    expect(values().slice().sort()).toEqual(before.slice().sort());
  });

  for (const locale of ["de", "en"] as const) {
    it(`${locale}: names the decision the learner actually picked in every combination`, () => {
      const lab = getWorkshopBySlug("datenbereitschaft-fuer-ki", locale)!.decisionLab;
      const modelWords = locale === "en" ? /model/i : /Modell/;
      for (const choice of lab.choices) {
        for (const evidence of lab.evidence) {
          const { outcome, feedback } = selectFeedback(lab, choice.id, evidence.id);
          const text = `${feedback.title} ${feedback.body}`;
          const label = `${choice.id}+${evidence.id}`;
          if (choice.id === "check-definition") {
            expect(outcome, label).toBe(evidence.id === "included-change" ? "correct" : "partial");
            expect(text, label).not.toMatch(modelWords);
          } else {
            expect(outcome, label).toBe("wrong");
          }
          if (choice.id === "trust-sum") {
            expect(feedback.title, label).not.toMatch(modelWords);
            expect(feedback.title, label).not.toMatch(/calculator|Taschenrechner/i);
            expect(text, label).toMatch(/120/);
          }
          if (choice.id === "new-model") {
            expect(text, label).toMatch(modelWords);
            expect(feedback.body, label).toMatch(/100/);
          }
        }
      }
      // Every wrong decision gets its own message; no combination reuses one
      // written for the other distractor.
      const wrongTitles = new Set(
        lab.choices
          .filter(({ id }) => id !== lab.recommendedChoiceId)
          .flatMap((choice) => lab.evidence.map((evidence) => `${choice.id}:${selectFeedback(lab, choice.id, evidence.id).feedback.title}`)),
      );
      const titlesOnly = [...wrongTitles].map((entry) => entry.split(":").slice(1).join(":"));
      expect(new Set(titlesOnly).size).toBe(4);
    });
  }

  it("makes right and wrong answers distinct by icon, colour and wording", () => {
    const workshop = getWorkshopBySlug("datenbereitschaft-fuer-ki", "en")!;
    const lab = workshop.decisionLab;
    const { container } = render(<WorkshopDecisionLab config={lab} locale="en" />);

    fireEvent.click(screen.getByRole("radio", { name: lab.choices[1].label }));
    fireEvent.click(screen.getByRole("radio", { name: lab.evidence[1].label }));
    fireEvent.click(screen.getByRole("button", { name: "Check decision" }));
    let outcome = container.querySelector("[data-outcome]")!;
    expect(outcome).toHaveAttribute("data-outcome", "wrong");
    expect(outcome).toHaveClass("border-destructive");
    expect(outcome).toHaveTextContent(/^Not quite/);
    expect(outcome.querySelector("svg")).not.toBeNull();
    const wrongPick = screen.getByRole("radio", { name: lab.choices[1].label });
    expect(wrongPick).toHaveAccessibleDescription("Your pick · not the strongest");
    expect(wrongPick.closest("label")).toHaveAttribute("data-option-mark", "wrong-pick");
    const rightChoice = screen.getByRole("radio", { name: lab.choices[0].label });
    expect(rightChoice).toHaveAccessibleDescription("Correct answer");
    expect(rightChoice.closest("label")).toHaveClass("border-brand-teal");
    expect(screen.getByRole("button", { name: "Decide again" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Decide again" }));
    fireEvent.click(screen.getByRole("radio", { name: lab.choices[0].label }));
    fireEvent.click(screen.getByRole("radio", { name: lab.evidence[0].label }));
    fireEvent.click(screen.getByRole("button", { name: "Check decision" }));
    outcome = container.querySelector("[data-outcome]")!;
    expect(outcome).toHaveAttribute("data-outcome", "correct");
    expect(outcome).toHaveClass("border-brand-teal");
    expect(outcome).toHaveTextContent(/^Correct/);
    expect(screen.getByRole("radio", { name: lab.choices[0].label })).toHaveAccessibleDescription("Your pick · correct");
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    fireEvent.click(screen.getByRole("radio", { name: lab.choices[0].label }));
    fireEvent.click(screen.getByRole("radio", { name: lab.evidence[2].label }));
    fireEvent.click(screen.getByRole("button", { name: "Check decision" }));
    outcome = container.querySelector("[data-outcome]")!;
    expect(outcome).toHaveAttribute("data-outcome", "partial");
    expect(outcome).toHaveClass("border-brand-amber");
    expect(outcome).toHaveTextContent(/^Almost/);
  });
});
