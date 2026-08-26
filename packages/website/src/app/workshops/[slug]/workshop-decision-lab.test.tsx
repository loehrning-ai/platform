import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getWorkshopBySlug } from "@/lib/workshops";
import { WorkshopDecisionLab } from "./workshop-decision-lab";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("<WorkshopDecisionLab>", () => {
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
