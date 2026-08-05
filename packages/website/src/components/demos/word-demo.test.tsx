import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import WordDemo from "./word-demo";

/**
 * word-demo.test.tsx (regression coverage)
 *
 * Drives the real default-export <WordDemo> in src/components/demos (distinct
 * from the ai-native word-demo). Its own logic:
 *
 *  - the four Eckdaten inputs (wrapped-label controls) carry the INITIAL values;
 *  - fileName is derived live from the first token of the Adressat via useMemo;
 *  - handleGenerate runs a setTimeout ladder (600/1200/1800/2400ms under normal
 *    motion) that flips genStep to 4, after which the preview fills from the
 *    current form state (project title, timeframe, and the de-DE-formatted
 *    budget) and the SIMULIERT badge + "Neu erstellen" label appear.
 *
 * matchMedia's default polyfill reports normal motion, so we drive the ladder
 * with fake timers. The metric labels ("Erstellzeit" ...) render in every state
 * (only their values are visibility-toggled), so generation is detected via the
 * filled brief, the badge and the button label instead.
 */

afterEach(() => {
  vi.useRealTimers();
});

describe("<WordDemo>", () => {
  it("renders the header, the default Eckdaten and the empty preview state", () => {
    render(<WordDemo />);

    expect(screen.getByText("Word-Lab mit KI-Assistent")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "prüfbar bleiben.",
    );

    // Wrapped-label inputs carry their INITIAL values.
    expect(screen.getByLabelText("Adressat")).toHaveValue("Fiktivwerk Beispiel GmbH (rein fiktiv)");
    expect(screen.getByLabelText("Projekt-Titel")).toHaveValue(
      "Wartungs-KI Produktionslinie",
    );
    expect(screen.getByLabelText("Rahmenwert")).toHaveValue("68000");
    expect(screen.getByLabelText("Zeitraum")).toHaveValue("Juli-September 2026");

    // Filename stub = first token of the explicitly fictional addressee.
    expect(screen.getByText(/Projektbrief_Fiktivwerk_/)).toBeInTheDocument();

    // Ungenerated: placeholder shown, brief + SIMULIERT badge absent.
    expect(screen.getByText(/Eckdaten ausfüllen und/)).toBeInTheDocument();
    expect(
      screen.queryByText(/Projektbrief: Wartungs-KI Produktionslinie/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("◆ SIMULIERT")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Projektbrief erstellen/ }),
    ).toBeEnabled();
  });

  it("re-derives the doc filename live when the Adressat changes", () => {
    render(<WordDemo />);

    fireEvent.change(screen.getByLabelText("Adressat"), {
      target: { value: "Neukunde AG" },
    });

    expect(screen.getByText(/Projektbrief_Neukunde_/)).toBeInTheDocument();
    expect(screen.queryByText(/Projektbrief_Fiktivwerk_/)).not.toBeInTheDocument();
  });

  it("runs the generate ladder and fills the brief from the form once the timers elapse", () => {
    vi.useFakeTimers();
    try {
      render(<WordDemo />);

      fireEvent.click(
        screen.getByRole("button", { name: /Projektbrief erstellen/ }),
      );

      // Generation enters the busy state synchronously.
      const busy = screen.getByRole("button", { name: /Wird erstellt/ });
      expect(busy).toBeDisabled();
      // Preview is still the placeholder before the ladder finishes.
      expect(screen.getByText(/Eckdaten ausfüllen und/)).toBeInTheDocument();

      // Final timer fires at 2400ms and sets genStep = 4.
      act(() => {
        vi.advanceTimersByTime(2400);
      });

      // Brief is filled from the current form state.
      expect(
        screen.getByText(/Projektbrief: Wartungs-KI Produktionslinie/),
      ).toBeInTheDocument();
      expect(screen.getByText("Juli-September 2026")).toBeInTheDocument();
      // Budget "68000" rendered through toLocaleString("de-DE").
      expect(screen.getByText("68.000 €")).toBeInTheDocument();
      // Generated affordances appear.
      expect(screen.getByText("◆ SIMULIERT")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Neu erstellen/ }),
      ).toBeEnabled();
      // Placeholder is replaced by the real doc.
      expect(
        screen.queryByText(/Eckdaten ausfüllen und/),
      ).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("re-formats the budget from the current input when generating", () => {
    vi.useFakeTimers();
    try {
      render(<WordDemo />);

      fireEvent.change(screen.getByLabelText("Rahmenwert"), {
        target: { value: "125000" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: /Projektbrief erstellen/ }),
      );
      act(() => {
        vi.advanceTimersByTime(2400);
      });

      // Number("125000").toLocaleString("de-DE") -> "125.000 €".
      expect(screen.getByText("125.000 €")).toBeInTheDocument();
      expect(screen.queryByText("68.000 €")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
