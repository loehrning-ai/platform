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
  it("requires one decision and one evidence choice before evaluating", () => {
    const workshop = getWorkshopBySlug("ki-prognosen-einschaetzen", "de");
    expect(workshop).toBeDefined();
    render(<WorkshopDecisionLab config={workshop!.decisionLab} />);

    const submit = screen.getByRole("button", {
      name: "Entscheidung prüfen",
    });
    expect(submit).toBeDisabled();

    fireEvent.click(
      screen.getByRole("radio", {
        name: /Proportional nach geschätzter Nachfrage/,
      }),
    );
    expect(submit).toBeDisabled();

    fireEvent.click(
      screen.getByRole("radio", {
        name: /Liefergrenze liegt 130 Stück unter/,
      }),
    );
    expect(submit).toBeEnabled();
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
    ).toBeDisabled();
    expect(status).toBeEmptyDOMElement();
  });

  it("uses the selected evidence to challenge an unsupported English decision", () => {
    const workshop = getWorkshopBySlug(
      "geschaeftsberichte-mit-ki-lesen",
      "en",
    );
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
    const workshop = getWorkshopBySlug(
      "geschaeftsberichte-mit-ki-lesen",
      "en",
    );
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

  it("limits authored transitions to transform and opacity and disables them for reduced motion", () => {
    const workshop = getWorkshopBySlug("ki-prognosen-einschaetzen", "en");
    expect(workshop).toBeDefined();
    render(<WorkshopDecisionLab config={workshop!.decisionLab} />);

    const choice = screen.getByRole("radio", {
      name: /Allocate proportionally/,
    }).closest("label");
    expect(choice).not.toBeNull();
    expect(choice).toHaveClass("motion-safe:transition-[opacity,transform]");
    expect(choice).toHaveClass("motion-reduce:transition-none");
    expect(
      screen.getByText(workshop!.decisionLab.kicker),
    ).toHaveClass("text-kupfer-light");
  });
});
