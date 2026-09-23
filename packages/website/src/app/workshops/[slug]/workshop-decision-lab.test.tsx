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
import { WorkshopDecisionLab } from "./workshop-decision-lab";

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
          <WorkshopDecisionLab config={workshop.decisionLab} />,
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

  it("does not turn the activated submit element into a native reset button", () => {
    const workshop = getWorkshopBySlug("datenbereitschaft-fuer-ki", "en")!;
    render(<WorkshopDecisionLab config={workshop.decisionLab} />);
    const submit = screen.getByRole("button", { name: "Check answer" });
    fireEvent.click(screen.getByRole("radio", { name: workshop.decisionLab.choices[0].label }));
    fireEvent.click(screen.getByRole("radio", { name: workshop.decisionLab.evidence[0].label }));
    fireEvent.submit(submit.closest("form")!);

    const reset = screen.getByRole("button", { name: "Try again" });
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
    render(<WorkshopDecisionLab config={workshop!.decisionLab} />);

    const submit = screen.getByRole("button", {
      name: "Entscheidung prüfen",
    });
    const firstChoice = screen.getByRole("radio", {
      name: /Proportional nach geschätzter Nachfrage/,
    });
    const firstEvidence = screen.getByRole("radio", {
      name: /Liefergrenze liegt 130 Stück unter/,
    });
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
    render(<WorkshopDecisionLab config={workshop!.decisionLab} />);

    const firstChoice = screen.getByRole("radio", {
      name: /Proportional nach geschätzter Nachfrage/,
    });
    const scrollIntoView = vi.fn();
    Object.defineProperty(firstChoice, "scrollIntoView", {
      configurable: true,
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
    expect(
      screen.getByRole("button", { name: "Neu entscheiden" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Neu entscheiden" }));
    expect(firstChoice).not.toBeChecked();
    await waitFor(() => {
      expect(firstChoice).toHaveFocus();
      expect(scrollIntoView).toHaveBeenCalledWith({
        block: "center",
        inline: "nearest",
      });
    });
    expect(
      screen.getByRole("button", { name: "Entscheidung prüfen" }),
    ).toBeEnabled();
    expect(status).toBeEmptyDOMElement();
  });

  it("uses the selected evidence to challenge an unsupported English decision", () => {
    const workshop = getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "en");
    expect(workshop).toBeDefined();
    render(<WorkshopDecisionLab config={workshop!.decisionLab} />);

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

    render(<WorkshopDecisionLab config={workshop!.decisionLab} />);
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
    render(<WorkshopDecisionLab config={workshop!.decisionLab} />);

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
