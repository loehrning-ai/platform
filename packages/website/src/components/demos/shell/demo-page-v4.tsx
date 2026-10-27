import type { ComponentType } from "react";
import Link from "next/link";
import { ClaudeDesktopScene } from "@/components/demos/claude-scene/claude-desktop-scene";
import { localScene } from "@/components/demos/claude-scene/claude-scene-section";
import { GlasRoot } from "@/components/demos/glas/glas-root";
import { LessGlassRow } from "@/components/demos/glas/less-glass";
import { TAKEHOME_TARGET_ID, type Beat } from "@/lib/demo-beats";
import { introSentences } from "@/lib/demo-intro";
import { DEMO_INTROS } from "@/lib/demo-intros";
import { demoLede, type LocalizedDemo } from "@/lib/demos";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { glasToneFor } from "@/lib/glas";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { getWorkshopBySlug } from "@/lib/workshops";
import { DemoOpenTracker } from "../demo-open-tracker";
import type { DemoComponentProps } from "../demo-page";
import { DemoBackLink } from "./back-link";
import { BeatClockProvider } from "./beat-clock";
import { ClosingGlass } from "./closing-glass";
import { DemoV4Provider } from "./demo-v4-context";
import "./shell-v4.css";

/**
 * The v4 demo page (Glas). Phone first: a 44px bar (back, title, workshop
 * chip), then the stage owns the first screen at 390 x 664: the intro card
 * over the living field, with "Starten" in reach. After the start the dock
 * rises and the guided path runs; "Frei ausprobieren" opens every control.
 * The last beat ends in the stage with the depicted Claude window replaying a
 * recorded run (the stage draws it under the demo's take-home), unless the
 * demo draws its own window (TAKEHOME_IN_STAGE in its intro.ts). Below the
 * stage: the question in one sentence, the "Weniger Glas" row and the way
 * back into the workshop, all in glass. Nothing below repeats the take-home.
 *
 * A demo opts in with SHELL = "v4" in src/lib/demo-cases/<slug>/intro.ts and
 * renders <DemoGlasStage> and <DemoDock> from @/components/demos/shell.
 */
export function DemoPageV4({
  demo,
  locale,
  beats,
  Demo,
}: {
  readonly demo: LocalizedDemo;
  readonly locale: Locale;
  readonly beats: readonly Beat[];
  readonly Demo: ComponentType<DemoComponentProps>;
}) {
  const pageCopy = DEMOS_PAGE_COPY[locale];
  const copy = pageCopy.v4;
  const workshop = getWorkshopBySlug(demo.workshopSlug, locale);
  const workshopHref = localizeHref(`/workshops/${demo.workshopSlug}`, locale);
  const intro = DEMO_INTROS[demo.slug].INTRO[locale];
  const takeHomeInStage = DEMO_INTROS[demo.slug].TAKEHOME_IN_STAGE === true;
  const scene = takeHomeInStage ? null : localScene(demo.slug, locale);
  const claude = scene ? (
    <div className="demo4-finale-claude" id={TAKEHOME_TARGET_ID} data-claude-scene-section="">
      <div className="demo4-finale-head">
        <h2 className="demo4-finale-title">{pageCopy.claudeScene.heading}</h2>
        <p className="demo4-finale-lead">{scene.scene.prompts.some((prompt) => prompt.withoutSkill.length > 0) ? pageCopy.claudeScene.lead : pageCopy.claudeScene.leadSingle}</p>
      </div>
      <ClaudeDesktopScene scene={scene.scene} locale={locale} skillName={scene.skillName} kitFiles={scene.kitFiles} />
    </div>
  ) : null;

  return (
    <GlasRoot
      as="article"
      tone="hell"
      data-plakat-page={demo.plakat}
      data-demo-page={demo.slug}
      data-demo-v4=""
      className="demo4-page"
    >
      <header className="demo4-bar" data-demo-bar="">
        <DemoBackLink
          demosHref={localizeHref("/demos", locale)}
          demosLabel={pageCopy.shell.back}
          workshopHref={workshop ? workshopHref : null}
          workshopLabel={pageCopy.shell.backToWorkshop(demo.workshopNumber)}
        />
        <h1 id="demo-title" className="demo4-title">
          {demo.title}
        </h1>
        {workshop ? (
          <Link
            prefetch={false}
            href={workshopHref}
            className="demo4-chip"
            data-demo-workshop-link=""
            aria-label={pageCopy.detail.toWorkshop(demo.workshopNumber, workshop.title)}
          >
            {`Workshop ${demo.workshopNumber}`}
          </Link>
        ) : null}
      </header>

      <BeatClockProvider beats={beats} locale={locale} shell="v4">
        <DemoV4Provider
          value={{
            stageTone: glasToneFor(demo.plakat),
            claude,
            intro: {
              kicker: `${demo.title} · ${copy.kicker(demo.workshopNumber)}`,
              title: intro.title,
              sentences: introSentences(intro, demo.minutes),
              start: intro.start,
              explore: copy.explore,
              footnote: copy.footnote,
            },
          }}
        >
          <section aria-label={copy.demoRegion} data-demo-mount={demo.slug} className="demo4-mount">
            <Demo locale={locale} />
          </section>
        </DemoV4Provider>
      </BeatClockProvider>

      <div className="demo4-below">
        <p className="demo4-question" data-demo-question="">
          {demoLede(demo)}
        </p>
        <p className="demo4-note" data-demo-synthetic="">
          {demo.syntheticDataLabel}
        </p>
        <p className="demo4-note max-lg:hidden">{copy.keys}</p>
        <div className="demo4-less">
          <LessGlassRow label={copy.lessGlass} description={copy.lessGlassNote} />
        </div>
      </div>

      <ClosingGlass demo={demo} workshop={workshop} locale={locale} />
      <DemoOpenTracker slug={demo.slug} />
    </GlasRoot>
  );
}
