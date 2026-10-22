import type { ReactNode } from "react";
import type { ForecastCopy } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy-types";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { getWorkshopBySlug } from "@/lib/workshops";
import { CaseStrip } from "./case-strip";
import { Sources } from "./sources";
import "./forecast-release.css";

const SLUG = "ki-prognosen-einschaetzen";
const CASE_FALLBACK = `/workshops/${SLUG}/case-study/index.html`;

/** The workshop page and the launch case, for this locale. */
export function demoLinks(locale: Locale): { readonly workshopHref: string; readonly caseHref: string } {
  const workshop = getWorkshopBySlug(SLUG, locale);
  return {
    workshopHref: localizeHref(`/workshops/${SLUG}`, locale),
    caseHref: workshop?.materials.find((material) => material.role === "case")?.href ?? CASE_FALLBACK,
  };
}

interface Props {
  readonly copy: ForecastCopy;
  readonly locale: Locale;
  readonly caseHref: string;
  /** The run: this locale's client entry. */
  readonly children: ReactNode;
}

/** Server frame: the case strip above the run, the sources below it. */
export function DemoFrame({ copy, locale, caseHref, children }: Props) {
  return (
    <div className="fr-root" data-demo={SLUG}>
      <CaseStrip copy={copy} locale={locale} />
      {children}
      <Sources copy={copy} caseHref={caseHref} hrefLang={locale === "en" ? undefined : "en"} />
    </div>
  );
}
