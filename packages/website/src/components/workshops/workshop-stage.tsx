import type { ReactNode } from "react";
import { WORKSHOP_PAGE_COPY } from "@/app/workshops/workshop-copy";
import { cx } from "@/components/werk";
import { heroMotionScene, renderHeroScene } from "@/components/plakat/hero-motion";
import type { Locale } from "@/lib/i18n/locale";
import { plakatClass, type PlakatKey } from "@/lib/plakat/palettes";
import type { Workshop } from "@/lib/workshops";
import { ActionCards } from "./action-cards";
import "./workshop-stage.css";

interface Props {
  readonly workshop: Workshop;
  readonly locale: Locale;
  readonly plakat: PlakatKey;
}

/**
 * The stage under a workshop's poster band: two big animated action cards
 * (slides or lab, kit or case) and that workshop's own motion scene beside
 * them, with one pause control in the scene's top-right corner
 * (docs/workshop-standard.md, "The stage").
 *
 * Server component, zero script. The scene registry is `HERO_SCENES` in
 * components/plakat/hero-motion.tsx; a workshop whose scene is not wired yet
 * shows the cards across the full width, so the page is never broken.
 * Pause is a CSS-only checkbox with role "switch" (WCAG 2.2.2): on, every
 * animation and transition on the stage returns to its finished still frame,
 * the same frame reduced motion shows. Under
 * `prefers-reduced-motion: reduce` nothing moves and the control is hidden.
 */
export function WorkshopStage({ workshop, locale, plakat }: Props): ReactNode {
  const copy = WORKSHOP_PAGE_COPY[locale].detail.stage;
  const scene = renderHeroScene(workshop.slug);
  const sceneKey = scene ? heroMotionScene(workshop.slug) : undefined;

  return (
    <section
      aria-labelledby="workshop-stage-heading"
      data-workshop-stage=""
      data-stage-scene={sceneKey ?? "none"}
      className="ws-stage"
    >
      <div className="mx-auto max-w-[75rem] px-4 pt-3 sm:px-6 sm:pt-8">
        <h2 id="workshop-stage-heading" className="sr-only">
          {copy.heading}
        </h2>
        <div className="ws-grid">
          <div className="ws-cards">
            <ActionCards workshop={workshop} locale={locale} plakat={plakat} />
          </div>
          {/* One stable accessible name, so "checked" always means "paused";
              the two visible labels only show what a tap will do. */}
          <label className="ws-pause" data-stage-pause="">
            <input
              type="checkbox"
              role="switch"
              className="ws-pause-input"
              aria-label={copy.pauseLabel}
            />
            <span aria-hidden="true" className="ws-pause-icon" />
            <span aria-hidden="true" className="ws-pause-off">
              {copy.pauseOff}
            </span>
            <span aria-hidden="true" className="ws-pause-on">
              {copy.pauseOn}
            </span>
          </label>
          {scene ? (
            <div
              data-workshop-scene={sceneKey}
              className={cx("ws-scene", plakatClass(plakat))}
            >
              {scene}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
