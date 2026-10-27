import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { allocateLiveLayers, budgetForWidth, GLAS_PRIORITY } from "./budget";
import { GlasButton } from "./button";
import { GlasChip } from "./chip";
import { GlasDropZone } from "./drop-zone";
import { escapeLayerCount, ESCAPE_PRIORITY, pushEscapeLayer } from "./escape-stack";
import { feldFor, FELD_REST, frostImage, hubFeld } from "./feld-math";
import { frameVerdict } from "./frame-monitor";
import { GlasRoot, LESS_GLASS_KEY } from "./glas-root";
import { DemoIntro, introWordCount } from "./intro";
import { LessGlassRow } from "./less-glass";
import { GlasProgress } from "./progress";
import { GlasSegmented, nearestSegment, pillStretch } from "./segmented";
import { GlasSheet, shouldDismiss } from "./sheet";
import { GlasSlider } from "./slider";
import { keyToValue, lensTransform, pointerToValue, snapValue, valueToShare } from "./slider-math";
import { GlasToggle } from "./toggle";
import { GlasWeg } from "./weg";

afterEach(() => {
  window.localStorage.clear();
});

function inGlas(node: React.ReactNode) {
  return render(<GlasRoot tone="hell">{node}</GlasRoot>);
}

describe("live budget (glass-spec 6)", () => {
  it("allows 3 live layers on a phone and 5 from 1024px", () => {
    expect(budgetForWidth(390)).toBe(3);
    expect(budgetForWidth(1023)).toBe(3);
    expect(budgetForWidth(1024)).toBe(5);
  });

  it("gives the slots to the visible surfaces with the highest priority, within the area share", () => {
    const claims = [
      { id: "chip", priority: GLAS_PRIORITY.chip, visible: true, area: 100 },
      { id: "dock", priority: GLAS_PRIORITY.dock, visible: true, area: 100 },
      { id: "sheet", priority: GLAS_PRIORITY.sheet, visible: false, area: 100 },
      { id: "panel", priority: GLAS_PRIORITY.panel, visible: true, area: 100 },
      { id: "huge", priority: GLAS_PRIORITY.caption, visible: true, area: 10_000 },
    ];
    const live = allocateLiveLayers(claims, { budget: 3, reserved: 1, viewportArea: 1000 });
    expect([...live]).toEqual(["dock", "panel"]);
    expect(allocateLiveLayers(claims, { budget: 3, reserved: 3, viewportArea: 1000 }).size).toBe(0);
  });

  it("calls a drag slow when more than 10% of at least 20 frames take over 24ms", () => {
    expect(frameVerdict([30, 30], 500)).toBe("pending");
    expect(frameVerdict([30, 30], 2000)).toBe("ok");
    expect(frameVerdict([...Array(18).fill(16), 30, 30, 30], 2000)).toBe("slow");
    expect(frameVerdict([...Array(19).fill(16), 30], 2000)).toBe("ok");
  });
});

describe("Escape stack", () => {
  it("closes the top layer first: sheet, then drag, then popover", () => {
    const calls: string[] = [];
    const offPopover = pushEscapeLayer(ESCAPE_PRIORITY.popover, () => calls.push("popover"));
    const offSheet = pushEscapeLayer(ESCAPE_PRIORITY.sheet, () => calls.push("sheet"));
    const offDrag = pushEscapeLayer(ESCAPE_PRIORITY.drag, () => calls.push("drag"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(calls).toEqual(["sheet"]);
    offSheet();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(calls).toEqual(["sheet", "drag"]);
    offDrag();
    offPopover();
    expect(escapeLayerCount()).toBe(0);
  });
});

describe("slider math", () => {
  it("snaps to the step grid without float noise and maps pointer and keys", () => {
    expect(snapValue(0.1 + 0.2, 0, 1, 0.05)).toBe(0.3);
    expect(snapValue(5, 0, 1, 0.1)).toBe(1);
    expect(snapValue(Number.NaN, 2, 4, 1)).toBe(2);
    expect(valueToShare(5, 0, 10)).toBe(0.5);
    expect(pointerToValue(150, 100, 100, 0, 10, 1)).toBe(5);
    expect(keyToValue("ArrowRight", 1, 0, 10, 1)).toBe(2);
    expect(keyToValue("PageDown", 5, 0, 10, 1)).toBe(0);
    expect(keyToValue("End", 5, 0, 10, 1)).toBe(10);
    expect(keyToValue("a", 5, 0, 10, 1)).toBeNull();
    expect(lensTransform(100, 64, 44, 22)).toBe("translate(-93.00px, -5.50px) scale(1.25)");
  });

  it("picks the nearest segment and stretches the pill by at most 12%", () => {
    expect(nearestSegment(70, [20, 60, 100])).toBe(1);
    expect(pillStretch(0)).toBe(1);
    expect(pillStretch(100_000)).toBeCloseTo(1.12);
  });

  it("dismisses a sheet past 35% of its height or faster than 500px/s", () => {
    expect(shouldDismiss(100, 0, 400)).toBe(false);
    expect(shouldDismiss(141, 0, 400)).toBe(true);
    expect(shouldDismiss(10, 600, 400)).toBe(true);
  });
});

describe("field", () => {
  it("rests three pools and paints a frost copy without any filter", () => {
    const feld = feldFor("lemons");
    expect(feld.pools).toHaveLength(3);
    expect(feld.pools[0]).toMatchObject(FELD_REST[0] as object);
    expect(feldFor("lemons", [{ x: 0.5 }]).pools[0]?.x).toBe(0.5);
    expect(feldFor("lemons", [], 0.5).pools[0]?.alpha).toBeCloseTo((feld.pools[0]?.alpha ?? 0) / 2);
    const image = frostImage(hubFeld(), 400, 300);
    expect(image).toMatch(/radial-gradient/);
    expect(image).not.toMatch(/blur|filter/);
  });
});

describe("components", () => {
  it("GlasButton: an icon button carries its name; a link button downloads", () => {
    inGlas(
      <>
        <GlasButton variant="icon" icon="close" label="Schließen" />
        <GlasButton href="/skills/x.zip" download="x.zip" icon="download">
          Laden
        </GlasButton>
      </>,
    );
    expect(screen.getByRole("button", { name: "Schließen" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Laden" })).toHaveAttribute("download", "x.zip");
  });

  it("GlasToggle is a switch", () => {
    const onChange = vi.fn();
    inGlas(<GlasToggle checked={false} onChange={onChange} label="Spanne zeigen" description="Ein Satz." />);
    const toggle = screen.getByRole("switch", { name: /Spanne zeigen/ });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("GlasSegmented is a radiogroup that moves with the arrow keys", () => {
    function Host() {
      const [value, setValue] = useState<"a" | "b" | "c">("a");
      return (
        <GlasSegmented
          label="Vergleich"
          options={[
            { value: "a", label: "Prognose" },
            { value: "b", label: "Letzte Woche" },
            { value: "c", label: "Vorjahr" },
          ]}
          value={value}
          onChange={setValue}
        />
      );
    }
    inGlas(<Host />);
    const group = screen.getByRole("radiogroup", { name: "Vergleich" });
    expect(screen.getByRole("radio", { name: "Prognose" })).toHaveAttribute("aria-checked", "true");
    fireEvent.keyDown(group, { key: "ArrowRight" });
    expect(screen.getByRole("radio", { name: "Letzte Woche" })).toHaveAttribute("aria-checked", "true");
    fireEvent.keyDown(group, { key: "End" });
    expect(screen.getByRole("radio", { name: "Vorjahr" })).toHaveAttribute("aria-checked", "true");
  });

  it("GlasSlider is a slider with a value phrase and keyboard steps", () => {
    const onChange = vi.fn();
    inGlas(
      <GlasSlider
        label="Kosten für ein übriges Glas, in Euro"
        value={0.4}
        min={0}
        max={1.6}
        step={0.05}
        onChange={onChange}
        format={(v) => `${v.toFixed(2)} €`}
        valueText={(v) => `${Math.round(v * 100)} Cent`}
      />,
    );
    const slider = screen.getByRole("slider", { name: "Kosten für ein übriges Glas, in Euro" });
    expect(slider).toHaveAttribute("aria-valuetext", "40 Cent");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith(0.45);
  });

  it("GlasSheet is a dialog that Escape closes", () => {
    const onClose = vi.fn();
    inGlas(
      <GlasSheet open onClose={onClose} title="Ein Sheet" closeLabel="Schließen" resizeLabel="Größe ändern">
        <p>Inhalt.</p>
      </GlasSheet>,
    );
    expect(screen.getByRole("dialog", { name: "Ein Sheet" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("DemoIntro shows four sentences, the start and the free path", () => {
    const onStart = vi.fn();
    const onExplore = vi.fn();
    const sentences = ["Eins ist hier.", "Zwei ist da.", "Drei kommt noch.", "Vier zum Schluss."] as const;
    inGlas(
      <DemoIntro
        content={{ kicker: "Workshop 01", title: "Titel", sentences, start: "Mit der Schätzung starten", explore: "Frei ausprobieren", footnote: "Alles bleibt im Browser." }}
        onStart={onStart}
        onExplore={onExplore}
      />,
    );
    expect(screen.getByRole("heading", { name: "Titel" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mit der Schätzung starten" }));
    fireEvent.click(screen.getByRole("button", { name: "Frei ausprobieren" }));
    expect(onStart).toHaveBeenCalledOnce();
    expect(onExplore).toHaveBeenCalledOnce();
    expect(introWordCount(sentences)).toBe(12);
  });

  it("GlasWeg names every dot and the current step as a sentence", () => {
    const onJump = vi.fn();
    inGlas(
      <GlasWeg
        steps={[
          { id: "a", label: "Schätzen" },
          { id: "b", label: "Auflösung" },
        ]}
        current={0}
        doneUpTo={0}
        sentence="Schritt 1 von 2: Du schätzt."
        onJump={onJump}
        onPrev={() => undefined}
        onNext={() => undefined}
        nextReady={false}
        free={false}
        onToGuide={() => undefined}
        copy={{ stepOf: (n, total) => `Schritt ${n} von ${total}`, prev: "Zurück", next: "Weiter", toGuide: "Zur Führung", nav: "Schritte" }}
      />,
    );
    expect(screen.getByRole("navigation", { name: "Schritte" })).toBeInTheDocument();
    expect(screen.getByText("Schritt 1 von 2: Du schätzt.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zurück" })).toBeDisabled();
  });

  it("GlasChip, GlasProgress and GlasDropZone expose their state", () => {
    const onFile = vi.fn();
    inGlas(
      <>
        <GlasChip kind="filter" selected onClick={() => undefined}>
          Woche 52
        </GlasChip>
        <GlasProgress value={0.5} label="Fortschritt" valueText="Schritt 2 von 4" />
        <GlasDropZone text="Zieh deine CSV hierher." buttonLabel="Datei wählen" accept=".csv" onFile={onFile} error="Die Datei hat keine Spalte woche. Benenne sie um und lade sie neu." />
      </>,
    );
    expect(screen.getByRole("progressbar", { name: "Fortschritt" })).toHaveAttribute("aria-valuetext", "Schritt 2 von 4");
    expect(screen.getByRole("alert")).toHaveTextContent("keine Spalte");
    expect(screen.getByRole("button", { name: /Woche 52/ })).toBeInTheDocument();
  });

  it("GlasRoot drops the live filter (frost) when the visitor asks for less glass, and remembers it", () => {
    const { container } = inGlas(<LessGlassRow label="Weniger Glas" />);
    const root = container.querySelector("[data-glas-mode]") as HTMLElement;
    expect(root).toHaveAttribute("data-glas-mode", "live");
    act(() => {
      fireEvent.click(screen.getByRole("switch", { name: /Weniger Glas/ }));
    });
    expect(root).toHaveAttribute("data-glas-mode", "frost");
    expect(window.localStorage.getItem(LESS_GLASS_KEY)).toBe("1");
  });
});
