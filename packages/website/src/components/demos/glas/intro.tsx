"use client";

import { useEffect, useRef } from "react";
import { cx } from "@/components/werk/cx";
import type { GlasTone } from "@/lib/glas";
import { GLAS_PRIORITY } from "./budget";
import { GlasButton } from "./button";
import { GlasPanel } from "./panel";

export interface DemoIntroContent {
  /** "Workshop 01 · etwa 6 Minuten" (footnote style). */
  readonly kicker: string;
  /** One sentence that says what this is. */
  readonly title: string;
  /**
   * The four intro sentences (language-standard B.8): what this is, what you
   * do, what you take away, how long and that nothing is sent. 50 to 75 words.
   */
  readonly sentences: readonly [string, string, string, string];
  /** Names the first action ("Mit der Schätzung starten"). */
  readonly start: string;
  /** "Frei ausprobieren" / "Explore freely". */
  readonly explore: string;
  /** "Alles läuft in deinem Browser. Nichts wird gesendet." */
  readonly footnote: string;
  /** Optional real news the case rests on, one short paragraph above the sentences. */
  readonly news?: readonly string[];
}

/**
 * The intro card (glass-spec 4.10, language-standard B.8): thick glass, the
 * kicker, the title, four sentences, "Starten" (prominent, focused default)
 * and "Frei ausprobieren", the privacy footnote. Fits the first screen at
 * 390 x 664 with its start button. Leaving it fades the card, never the
 * stage behind it.
 */
export function DemoIntro({
  content,
  onStart,
  onExplore,
  leaving,
  headingId,
  className,
  autoFocus,
  tone,
}: {
  readonly content: DemoIntroContent;
  readonly onStart: () => void;
  readonly onExplore?: () => void;
  /** True while it materializes out. */
  readonly leaving?: boolean;
  readonly headingId?: string;
  readonly className?: string;
  /** Focus "Starten" on mount (only after a visitor action, never on page load). */
  readonly autoFocus?: boolean;
  /** Overrides the stage tone (light reading glass over a dark field). */
  readonly tone?: GlasTone;
}) {
  const start = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (autoFocus) start.current?.focus({ preventScroll: true });
  }, [autoFocus]);
  return (
    <GlasPanel
      as="section"
      material="thick"
      live={GLAS_PRIORITY.intro}
      elevation={3}
      tone={tone}
      appear={leaving ? "out" : "in"}
      className={cx("glas-intro", className)}
      aria-labelledby={headingId}
      data-demo-intro=""
    >
      {/* The text scrolls on a short screen; the two buttons and the footnote always stay in view. */}
      <div className="glas-intro-text">
        <p className="glas-intro-kicker">{content.kicker}</p>
        <h2 id={headingId} className="glas-intro-title">
          {content.title}
        </h2>
        {content.news && content.news.length > 0 ? (
          <p className="glas-intro-news" data-demo-intro-news="">
            {content.news.join(" ")}
          </p>
        ) : null}
        <p className="glas-intro-body" data-demo-intro-body="">
          {content.sentences.join(" ")}
        </p>
      </div>
      <div className="glas-intro-actions">
        <GlasButton buttonRef={start} variant="prominent" size="large" block onClick={onStart} data-demo-start="">
          {content.start}
        </GlasButton>
        {onExplore ? (
          <GlasButton variant="plain" size="regular" block onClick={onExplore} data-demo-explore="">
            {content.explore}
          </GlasButton>
        ) : null}
      </div>
      <p className="glas-intro-foot">{content.footnote}</p>
    </GlasPanel>
  );
}

/** Words in the four intro sentences (B.8 asks for 50 to 75). */
export function introWordCount(sentences: readonly string[]): number {
  return sentences.join(" ").split(/\s+/).filter(Boolean).length;
}
