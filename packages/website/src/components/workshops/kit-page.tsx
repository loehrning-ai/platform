import Link from "next/link";
import type { ReactNode } from "react";
import { WorkshopMaterialLink } from "@/app/workshops/[slug]/workshop-material-link";
import { CapsLine, PlakatBand, PosterArt } from "@/components/plakat";
import { ArrowGlyph, Callout, Pictogram, SectionHead, cx } from "@/components/werk";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { PLAKAT, workshopPlakat, type WorkshopPlakat } from "@/lib/plakat/palettes";
import { posterTitleFallbackStyle } from "@/lib/plakat/fit";
import type { Workshop } from "@/lib/workshops";
import { workshopKitMaterial } from "@/lib/workshops";
import { KIT_PAGE_COPY } from "./kit-copy";
import { KitStepper, type KitStepperLabels } from "./kit-stepper";

interface Props {
  readonly workshop: Workshop;
  readonly locale: Locale;
}

const CONTAINER = "mx-auto max-w-[75rem] px-4 sm:px-6";
const SECTION = "pt-10 sm:pt-20";
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

function StepNumber({ n }: { readonly n: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-8 shrink-0 items-center justify-center border-2 border-scene-line text-[0.9375rem] font-bold leading-none text-foreground tabular-nums"
    >
      {n}
    </span>
  );
}

function StepTitle({ n, children }: { readonly n: number; readonly children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-3">
      <StepNumber n={n} />
      <span>{children}</span>
    </span>
  );
}

/**
 * The kit page of a workshop: what the kit does (a short stepper over its
 * prompts) and one big download. Generic: it renders whatever `workshop.kit`
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
    stepOf: kit.steps.map((_, index) => copy.stepOf(index + 1, kit.steps.length)),
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
            className="inline-flex min-h-11 items-center gap-2 text-label text-muted-foreground underline decoration-transparent underline-offset-4 transition-colors duration-[120ms] hover:text-foreground hover:decoration-foreground focus-visible:outline-offset-[-3px]"
          >
            <BackGlyph />
            {copy.backToWorkshop}
          </Link>
        </div>
      </nav>

      <PlakatBand
        plakat={scene.plakat}
        labelledBy="kit-title"
        artPhoneLayout="poster"
        className="[&>[data-plakat-art-phone]]:mt-4"
        cornerDots={PLAKAT[scene.plakat].cornerDots}
        contentClassName="max-sm:pt-5"
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
            format="landscape"
            cornerDots={false}
          />
        }
      >
        <Link
          href={detailPath}
          aria-label={copy.backAria(workshop.title)}
          className="-my-2 inline-flex min-h-11 items-center gap-2 text-[1.0625rem] font-semibold text-scene-ink underline decoration-transparent decoration-2 underline-offset-4 [-webkit-tap-highlight-color:transparent] hover:decoration-scene-ink sm:hidden"
        >
          <BackGlyph />
          {copy.backToWorkshop}
        </Link>
        <CapsLine className="mt-3 sm:mt-0">{`${workshop.eyebrow} · ${copy.kitKicker}`}</CapsLine>
        <h1
          id="kit-title"
          className="poster-title mt-3 max-w-[16ch] text-scene-ink max-[359px]:[--text-poster:2.625rem] sm:mt-4"
          style={posterTitleFallbackStyle(kit.title)}
        >
          {kit.title}
        </h1>
        <p className="mt-4 max-w-[40ch] text-body text-scene-ink text-pretty sm:mt-5 lg:max-w-[46ch]">
          {kit.lead}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-8">
          <a
            href="#download"
            className="group inline-flex min-h-12 items-center gap-2 border-2 border-scene-ink px-5 text-[1.0625rem] font-semibold text-scene-ink transition-colors duration-[120ms] hover:border-scene-button hover:bg-scene-button hover:text-scene-button-text motion-reduce:transition-none"
          >
            <span>{copy.toDownload}</span>
            <ArrowGlyph direction="down" />
          </a>
        </div>
      </PlakatBand>

      <section aria-label={copy.statsLabel} className="pt-8 sm:pt-12">
        <div className={CONTAINER}>
          <dl className="grid grid-cols-3 gap-3 sm:gap-6">
            {kit.stats.map((stat) => (
              <div key={stat.label} className="border-t-2 border-scene-line pt-3">
                <dt className="order-2 text-label text-muted-foreground">{stat.label}</dt>
                <dd className="font-mono text-[2.25rem] font-bold leading-none text-foreground tabular-nums sm:text-[3.5rem]">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="kit-rules-heading" className={SECTION}>
        <div className={CONTAINER}>
          <SectionHead
            id="kit-rules-heading"
            title={<StepTitle n={1}>{kit.rulesHeading}</StepTitle>}
            caption={copy.setupHeading}
            size="compact"
          />
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
        </div>
      </section>

      <section aria-labelledby="kit-steps-heading" className={cx(SECTION, "scroll-mt-20")}>
        <div className={CONTAINER}>
          <SectionHead
            id="kit-steps-heading"
            title={<StepTitle n={2}>{kit.stepsHeading}</StepTitle>}
            size="compact"
          />
          <div className="mt-4 sm:mt-6">
            <KitStepper steps={kit.steps} labels={labels} idPrefix="kit-step" />
          </div>
        </div>
      </section>

      <section aria-labelledby="kit-home-heading" className={SECTION}>
        <div className={CONTAINER}>
          <SectionHead
            id="kit-home-heading"
            title={<StepTitle n={3}>{copy.homeHeading}</StepTitle>}
            size="compact"
          />
          <div className="mt-4 grid gap-3 sm:mt-6 md:grid-cols-2 md:gap-5">
            <Callout variant="note" icon="guide">
              {kit.howTo}
            </Callout>
            <Callout variant="gap">{kit.fictionalNote}</Callout>
          </div>
        </div>
      </section>

      <section id="download" aria-labelledby="kit-download-heading" className={cx(SECTION, "scroll-mt-20")}>
        <div className={CONTAINER}>
          <SectionHead
            id="kit-download-heading"
            title={<StepTitle n={4}>{copy.downloadHeading}</StepTitle>}
            size="compact"
          />
          <div
            data-kit-download=""
            className="mt-4 grid gap-6 border-2 border-foreground bg-card p-5 sm:mt-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-x-12"
          >
            <div className="min-w-0">
              <p className="flex items-center gap-3">
                <Pictogram name="download" strokeWidth={2} className="size-8 shrink-0 text-foreground" />
                <span
                  data-kit-filename=""
                  className="min-w-0 break-all font-mono text-[0.8125rem] font-bold text-foreground min-[400px]:text-[0.9375rem] sm:text-[1.375rem]"
                >
                  {kit.fileName}
                </span>
              </p>
              <p className="mt-2 font-mono text-caption uppercase tracking-[0.08em] text-muted-foreground tabular-nums">
                {copy.downloadMeta(sizeLabel)} · {copy.freeNote}
              </p>
            </div>

            <div className="lg:row-span-2 lg:self-center">
              <WorkshopMaterialLink
                workshopSlug={workshop.slug}
                material={material}
                className="group flex min-h-[4.5rem] w-full items-center justify-between gap-4 bg-mennige px-6 py-4 text-paper transition-colors duration-[120ms] hover:bg-kupfer-dark focus-visible:outline-offset-4 motion-reduce:transition-none sm:min-h-24 sm:px-8"
              >
                <span className="text-[1.25rem] font-bold leading-tight sm:text-[1.5rem]">
                  {copy.downloadAction}
                  <span className="mt-1 block font-mono text-caption font-medium uppercase tracking-[0.08em] tabular-nums">
                    {copy.downloadMeta(sizeLabel)}
                  </span>
                </span>
                <ArrowGlyph direction="down" className="size-8 sm:size-10" />
              </WorkshopMaterialLink>
            </div>

            <div className="min-w-0 border-t border-hairline pt-5">
              <h3 className="font-mono text-caption font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {copy.insideHeading}
              </h3>
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
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
