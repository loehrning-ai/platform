import { WORKSHOP_PAGE_COPY } from "@/app/workshops/workshop-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { workshopKitPath } from "@/lib/workshop-kit";
import {
  primaryWorkshopMaterial,
  workshopKitMaterial,
  type Workshop,
  type WorkshopMaterial,
} from "@/lib/workshops";

/**
 * The two big actions under a workshop's band (docs/workshop-standard.md,
 * "The stage"): card A opens the first material (the slides, or the lab for
 * a workshop without a deck), card B hands over the second one (the kit zip,
 * or the case for a workshop without a kit). Card A also carries the
 * workshop's practice demo as its small secondary link: a workshop is its
 * slides and its kit, and the demo (the kit, performed) is one link away,
 * never card A. All of it is derived from the registry, so a new workshop
 * needs no page code.
 */
export type WorkshopStageKindA = "slides" | "lab";
export type WorkshopStageKindB = "kit" | "case";

export interface WorkshopStageCardA {
  readonly kind: WorkshopStageKindA;
  readonly material: WorkshopMaterial;
  readonly href: string;
  readonly minutes?: number;
  /** "Deck · 60 Min." or "45 Min." for a lab: time, never a slide count. */
  readonly meta: string;
  /** Set when the workshop has a practice demo: card A's one small secondary link. */
  readonly demoHref?: string;
}

export interface WorkshopStageCardB {
  readonly kind: WorkshopStageKindB;
  readonly material: WorkshopMaterial;
  readonly href: string;
  /** True for a file (the kit zip): the link carries a bare `download` attribute. */
  readonly download: boolean;
  /** "ZIP · 1,1 MB" for a file, "30 Min." for a case. */
  readonly meta: string;
  /** Set when the workshop has a kit page: the one small secondary link. */
  readonly kitPageHref?: string;
  /** Spoken file facts for a download, ", ZIP, 1,1 MB". */
  readonly fileFacts?: string;
}

export interface WorkshopStage {
  readonly a?: WorkshopStageCardA;
  readonly b?: WorkshopStageCardB;
}

/** "HTML · EN", "ZIP · 1,1 MB", "CSV · 1,6 KB": format and size as data. */
/** Said on a deck card when the deck is in the other language than the page (W02, W03 and W06 have one edition). */
const OTHER_LANGUAGE: Readonly<Record<Locale, Readonly<Record<Locale, string>>>> = {
  de: { de: "auf Deutsch", en: "auf Englisch" },
  en: { de: "in German", en: "in English" },
};

export function materialMeta(material: WorkshopMaterial): string {
  return [material.kind.toUpperCase(), material.sizeLabel ?? material.language.toUpperCase()].join(" · ");
}

export function workshopStage(workshop: Workshop, locale: Locale): WorkshopStage {
  const copy = WORKSHOP_PAGE_COPY[locale].detail;
  const primary = primaryWorkshopMaterial(workshop) ?? workshop.materials[0];

  // A deck without its own minutes (a self-paced workshop) shows the
  // workshop's own length, marked as approximate when it is the self-study
  // time. Never the page language: "Deck · EN" says nothing about effort.
  const approx = locale === "de" ? "ca." : "about";
  const minutesOf = (material: WorkshopMaterial): string | undefined => {
    if (material.minutes) return copy.minutes(material.minutes);
    if (material.role !== "deck") return undefined;
    if (workshop.minutesLive) return copy.minutes(workshop.minutesLive);
    return `${approx} ${copy.minutes(workshop.minutesSelfStudy)}`;
  };
  const timeOrLanguage = (material: WorkshopMaterial): string =>
    minutesOf(material) ?? material.language.toUpperCase();
  // The title already names a lab or a case, so its meta line is the time alone.
  // A deck in the other language says so, so nobody opens English slides from a German page unwarned.
  const metaOf = (material: WorkshopMaterial): string =>
    material.role === "deck"
      ? [
          copy.roleLabels[material.role],
          timeOrLanguage(material),
          ...(material.language === locale ? [] : [OTHER_LANGUAGE[locale][material.language]]),
        ].join(" · ")
      : timeOrLanguage(material);

  // The demo material's href is already in the page's language.
  const demo = workshop.materials.find((material) => material.role === "demo");
  const a: WorkshopStageCardA | undefined = primary
    ? {
        kind: primary.role === "deck" ? "slides" : "lab",
        material: primary,
        href: primary.href,
        ...(primary.minutes ? { minutes: primary.minutes } : {}),
        meta: metaOf(primary),
        ...(demo ? { demoHref: demo.href } : {}),
      }
    : undefined;

  const kitMaterial =
    workshopKitMaterial(workshop) ??
    workshop.materials.find((material) => material.role === "kit" && material.kind === "zip");
  const second =
    kitMaterial ??
    workshop.materials.find(
      (material) => material !== primary && material.role !== "demo" && material.kind === "html",
    );

  let b: WorkshopStageCardB | undefined;
  if (kitMaterial) {
    b = {
      kind: "kit",
      material: kitMaterial,
      href: kitMaterial.href,
      download: true,
      meta: materialMeta(kitMaterial),
      ...(workshop.kit
        ? { kitPageHref: localizeHref(workshopKitPath(workshop.slug), locale) }
        : {}),
      fileFacts: `, ${materialMeta(kitMaterial).replace(" · ", ", ")}`,
    };
  } else if (second) {
    b = {
      kind: "case",
      material: second,
      href: second.href,
      download: second.kind !== "html",
      meta: metaOf(second),
    };
  }

  return { ...(a ? { a } : {}), ...(b ? { b } : {}) };
}
