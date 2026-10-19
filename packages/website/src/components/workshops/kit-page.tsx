import Link from "next/link";
import { WorkshopMaterialLink } from "@/app/workshops/[slug]/workshop-material-link";
import { CapsLine, PlakatBand, PosterArt } from "@/components/plakat";
import { ArrowGlyph, Callout, Pictogram, SectionHead, cx } from "@/components/werk";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { plakatClass, workshopPlakat, type WorkshopPlakat } from "@/lib/plakat/palettes";
import { posterTitleFallbackStyle } from "@/lib/plakat/fit";
import type { Workshop } from "@/lib/workshops";
import { workshopKitMaterial } from "@/lib/workshops";
import { ActionPicture } from "./action-pictures";
import { KIT_PAGE_COPY } from "./kit-copy";
import { KitStepper, type KitStepperLabels } from "./kit-stepper";
import "./action-cards.css";
import "./kit-motion.css";

interface Props {
  readonly workshop: Workshop;
  readonly locale: Locale;
}

const CONTAINER = "mx-auto max-w-[75rem] px-4 sm:px-6";
// A closed disclosure leaves no empty strip: every section starts 32px (48px
// from sm) under the one before it.
const SECTION = "pt-8 sm:pt-12";
const FALLBACK_SCENE: WorkshopPlakat = { plakat: "lemons", motif: "fan" };

function BackGlyph() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className="size-4 shrink-0"
    >
      <path d="M17 10H4M9 5l-5 5 5 5" />
    </svg>
  );
}

/**
 * The kit page of a workshop: what the kit does (a short stepper over its
 * steps) and one big download. Lean on purpose: the three rules and the file
 * list wait behind closed disclosures, so the page is numbers, a motion
 * explainer and the button. Generic: it renders whatever `workshop.kit`
 * holds, so the next workshop adds a kit block and no page code. The zip's
 * path and size come from the workshop's kit material, and the download goes
 * through WorkshopMaterialLink, so it is counted like every other material
 * (workshop and file kind only).
 */
export function KitPage({ workshop, locale }: Props) {
  const kit = workshop.kit;
  const material = workshopKitMaterial(workshop);
  if (!kit || !material) return null;

  const copy = KIT_PAGE_COPY[locale];
  const scene = workshopPlakat(workshop.slug) ?? FALLBACK_SCENE;
  const detailPath = localizeHref(`/workshops/${workshop.slug}`, locale);
  const sizeLabel = material.sizeLabel ?? "";

  const labels: KitStepperLabels = {
    stepperLabel: copy.stepperLabel,
    inLabel: copy.inLabel,
    claudeLabel: copy.claudeLabel,
    outLabel: copy.outLabel,
    resultLabel: copy.resultLabel,
    fileLabel: copy.fileLabel,
    restart: copy.restart,
    next: kit.steps.map((_, index) =>
      copy.nextPrompt(kit.steps[(index + 1) % kit.steps.length].title),
    ),
  };

  return (
    <article
      data-plakat-page={scene.plakat}
      data-kit-page=""
      className="bg-background pb-16 sm:pb-24"
    >
      <nav aria-label={workshop.title} className="border-b border-hairline max-sm:hidden">
        <div className={CONTAINER}>
          <Link
            href={detailPath}
            aria-label={copy.backAria(workshop.title)}
            className="inline-flex min-h-11 items-center gap-2 text-[0.875rem] font-bold text-muted-foreground underline decoration-transparent underline-offset-4 transition-colors duration-[120ms] hover:text-foreground hover:decoration-foreground focus-visible:outline-offset-[-3px]"
          >
            <BackGlyph />
            {copy.backToWorkshop}
          </Link>
        </div>
      </nav>

      <PlakatBand
        plakat={scene.plakat}
        labelledBy="kit-title"
        artPhoneLayout="strip"
        // The same strip as the detail page (the numeral flush left, the motif
        // bleeding off the bottom right), 88px on a phone, with 24px of air
        // between the button above it and the numeral.
        className="[&>[data-plakat-art-phone]]:mt-4 max-sm:[&>[data-plakat-art-phone]]:mt-4 max-sm:[&>[data-plakat-art-phone]]:h-[4.75rem] sm:[&>[data-plakat-art-phone]]:h-28 lg:min-h-[19rem]"
        // No corner dots on a workshop page (see the detail page).
        cornerDots={false}
        contentClassName="max-sm:pt-2"
        art={
          <PosterArt
            plakat={scene.plakat}
            motif={scene.motif}
            numeral={workshop.number}
            format="portrait"
            cornerDots={false}
          />
        }
        artPhone={
          <PosterArt
            plakat={scene.plakat}
            motif={scene.motif}
            numeral={workshop.number}
            format="strip"
            cornerDots={false}
          />
        }
      >
        <Link
          href={detailPath}
          aria-label={copy.backAria(workshop.title)}
          className="-my-2.5 inline-flex min-h-11 items-center gap-2 text-[0.875rem] font-bold text-scene-ink underline decoration-transparent decoration-2 underline-offset-4 [-webkit-tap-highlight-color:transparent] hover:decoration-scene-ink sm:hidden"
        >
          <BackGlyph />
          {copy.backToWorkshop}
        </Link>
        <CapsLine className="mt-2 max-[379px]:text-[0.75rem]! max-[379px]:tracking-[0.1em]! sm:mt-0">
          {`${workshop.eyebrow} · ${copy.kitKicker}`}
        </CapsLine>
        <h1
          id="kit-title"
          className="poster-title mt-2 max-w-[16ch] text-scene-ink min-[380px]:max-sm:[--text-poster:2.5rem] max-[379px]:[--text-poster:min(2.5rem,10vw)] sm:mt-4"
          style={posterTitleFallbackStyle(kit.title)}
        >
          {kit.title}
        </h1>
        <p className="mt-2.5 max-w-[40ch] text-body text-scene-ink text-balance max-sm:leading-[1.4] sm:mt-5 lg:max-w-[52ch]">
          {kit.lead}
        </p>
        {/* A phone gets the one strong target in the band: full width, 52px. */}
        <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-6">
          <a
            href="#download"
            className="group inline-flex min-h-[3.25rem] items-center justify-between gap-2 border-2 border-scene-button bg-scene-button px-6 text-[1.0625rem] font-semibold text-scene-button-text transition-colors duration-[120ms] hover:border-scene-ink hover:bg-transparent hover:text-scene-ink motion-reduce:transition-none max-sm:w-full"
          >
            <span>{copy.toDownload}</span>
            <ArrowGlyph direction="down" className="kit-bob" />
          </a>
        </div>
      </PlakatBand>

      <section aria-label={copy.statsLabel} className="pt-8 sm:pt-12">
        <div className={CONTAINER}>
          <dl className="grid grid-cols-3 gap-3 sm:gap-6">
            {kit.stats.map((stat, index) => (
              <div
                key={stat.label}
                data-kit-stat=""
                className="kit-rise flex flex-col border-t-2 border-scene-line pt-3"
                style={{ ["--i" as string]: index }}
              >
                <dt className="order-2 mt-1 text-label text-muted-foreground">{stat.label}</dt>
                <dd className="order-1 font-mono text-[2.5rem] font-bold leading-none text-foreground tabular-nums sm:text-[4rem]">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="kit-steps-heading" className={cx(SECTION, "scroll-mt-20")}>
        <div className={CONTAINER}>
          <SectionHead id="kit-steps-heading" title={kit.stepsHeading} size="compact" />
          <div className="mt-4 sm:mt-6">
            <KitStepper steps={kit.steps} labels={labels} idPrefix="kit-step" />
          </div>
        </div>
      </section>

      <section aria-labelledby="kit-rules-heading" className={SECTION}>
        <div className={CONTAINER}>
          <details data-kit-rules="" className="group border-t-2 border-scene-line pt-3 sm:pt-4">
            <summary className="flex min-h-14 cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 after:ml-auto after:inline-grid after:size-9 after:place-items-center after:border-2 after:border-foreground after:font-mono after:text-[1.25rem] after:font-bold after:leading-none after:content-['+'] group-open:after:rotate-45">
              <h2
                id="kit-rules-heading"
                className="text-[1.125rem]/[1.2] font-bold text-foreground sm:text-fluid-h3"
              >
                {kit.rulesHeading}
              </h2>
            </summary>
            <ol className="mt-4 grid gap-3 sm:mt-6 md:grid-cols-3 md:gap-5">
              {kit.rules.map((rule, index) => (
                <li
                  key={rule}
                  className="flex gap-4 border border-hairline bg-card p-4 sm:p-5"
                >
                  <span
                    aria-hidden="true"
                    className="font-mono text-[1.75rem] font-bold leading-none text-kupfer-dark tabular-nums"
                  >
                    {index + 1}
                  </span>
                  <span className="text-[1rem] leading-snug text-foreground text-pretty">{rule}</span>
                </li>
              ))}
            </ol>
          </details>
        </div>
      </section>

      <section aria-labelledby="kit-home-heading" className={SECTION}>
        <div className={CONTAINER}>
          <SectionHead id="kit-home-heading" title={copy.homeHeading} size="compact" />
          <div className="mt-4 grid gap-3 sm:mt-6 md:grid-cols-2 md:gap-5">
            <Callout variant="note" icon="guide">
              {kit.howTo}
            </Callout>
            <Callout variant="gap">{kit.fictionalNote}</Callout>
          </div>
        </div>
      </section>

      <section id="download" aria-label={copy.downloadHeading} className={cx(SECTION, "scroll-mt-20")}>
        <div className={CONTAINER}>
          <div
            data-kit-download=""
            className="grid gap-6 border-2 border-foreground bg-card p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center lg:gap-x-12"
          >
            <div className="flex min-w-0 items-center gap-4 sm:gap-6">
              {/* The kit's own four files drop into the zip box (the stage's
                  kit picture), so the download is shown, not only named. */}
              <div aria-hidden="true" className={cx("kit-chips-pic", plakatClass(scene.plakat))}>
                <ActionPicture kind="kit" slug={workshop.slug} />
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-3">
                  <Pictogram name="download" strokeWidth={2} className="size-8 shrink-0 text-foreground max-sm:hidden" />
                  <span
                    data-kit-filename=""
                    className="min-w-0 break-all font-mono text-[0.8125rem] font-bold text-foreground min-[400px]:text-[0.9375rem] sm:text-[1.375rem]"
                  >
                    {kit.fileName}
                  </span>
                </p>
                {/* The size is the one new fact here; "free" is said once, on its own line. */}
                <p className="mt-2 font-mono text-[0.875rem]/[1.45] uppercase tracking-[0.03em] text-foreground/80 tabular-nums">
                  <span className="block sm:inline">{sizeLabel}</span>
                  <span className="hidden sm:inline"> · </span>
                  <span className="block sm:inline">{copy.freeNote}</span>
                </p>
              </div>
            </div>

            <WorkshopMaterialLink
              workshopSlug={workshop.slug}
              material={material}
              className="group flex min-h-[4.5rem] w-full items-center justify-between gap-4 bg-mennige px-6 py-4 text-paper transition-colors duration-[120ms] hover:bg-kupfer-dark focus-visible:outline-offset-4 motion-reduce:transition-none sm:min-h-24 sm:px-8"
            >
              <span className="text-[1.25rem] font-bold leading-tight sm:text-[1.5rem]">
                {copy.downloadAction}
              </span>
              <ArrowGlyph direction="down" className="kit-bob size-8 sm:size-10" />
            </WorkshopMaterialLink>

            <details data-kit-contents="" className="group min-w-0 border-t border-hairline pt-3 lg:col-span-2">
              <summary className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 font-mono text-[0.875rem] font-semibold uppercase tracking-[0.04em] text-foreground/80 underline decoration-border underline-offset-4 hover:decoration-foreground after:inline-grid after:size-9 after:place-items-center after:border-2 after:border-foreground after:text-[1rem] after:font-bold after:leading-none after:content-['+'] group-open:after:rotate-45">
                {copy.insideHeading}
              </summary>
              <ul className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {kit.contents.map((item) => (
                  <li key={item.name} className="min-w-0">
                    <span className="block break-all font-mono text-[0.9375rem] font-bold text-foreground">
                      {item.name}
                    </span>
                    <span className="block text-[0.9375rem] leading-snug text-muted-foreground text-pretty">
                      {item.description}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </section>
    </article>
  );
}
