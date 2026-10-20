import "./stage/chapter-stage.css";

/**
 * The chapter's pause switch: one native checkbox with role="switch" under a
 * 48px outlined button, CSS only (see chapter-stage.css). It names its state in
 * words ("Bewegung anhalten" / "Bewegung starten", short on a phone: "Pause" /
 * "Start") and with a pause or play glyph. Checked, every stage and figure of
 * the chapter shows its finished frame and the steps stand stacked as text; the
 * stage script stops writing steps. It works without script. Printed pages,
 * reduced motion and no script never show it: nothing moves there.
 *
 * It sits in the chapter band (top right), so it is the same control the cover
 * reel carries.
 */

const COPY = {
  de: {
    name: "Bewegung anhalten",
    run: { long: "Bewegung anhalten", short: "Pause" },
    stop: { long: "Bewegung starten", short: "Start" },
    note: "Alle Abbildungen zeigen dann den fertigen Stand, die Schritte stehen untereinander.",
  },
  en: {
    name: "Pause motion",
    run: { long: "Pause motion", short: "Pause" },
    stop: { long: "Start motion", short: "Start" },
    note: "Every figure then shows its finished state and the steps stand one under the other.",
  },
} as const;

export function ChapterPauseSwitch({ locale, id }: { readonly locale: "de" | "en"; readonly id: string }) {
  const copy = COPY[locale];
  return (
    <div className="no-print cs-pause-wrap shrink-0" data-chapter-pause="">
      <label className="cs-pause" htmlFor={id}>
        <input id={id} className="cs-pause-input" type="checkbox" role="switch" aria-label={copy.name} aria-describedby={`${id}-note`} />
        <span className="cs-pause-glyph" aria-hidden="true" />
        <span className="cs-pause-text" aria-hidden="true">
          <span className="cs-pause-run">
            <span className="cs-pause-long">{copy.run.long}</span>
            <span className="cs-pause-short">{copy.run.short}</span>
          </span>
          <span className="cs-pause-stop">
            <span className="cs-pause-long">{copy.stop.long}</span>
            <span className="cs-pause-short">{copy.stop.short}</span>
          </span>
        </span>
      </label>
      <p id={`${id}-note`} className="sr-only">
        {copy.note}
      </p>
    </div>
  );
}
