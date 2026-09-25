"use client";

import type { ReactNode } from "react";
import { trackMaterialOpened } from "@/lib/analytics/events";
import {
  ANALYTICS_WORKSHOP_SLUGS,
  type AnalyticsWorkshopSlug,
} from "@/lib/analytics/registry";
import type { WorkshopMaterial } from "@/lib/workshops";

interface Props {
  readonly workshopSlug: string;
  readonly material: WorkshopMaterial;
  readonly className?: string;
  readonly children: ReactNode;
}

function isAnalyticsWorkshopSlug(slug: string): slug is AnalyticsWorkshopSlug {
  return (ANALYTICS_WORKSHOP_SLUGS as readonly string[]).includes(slug);
}

/**
 * One workshop material link. The only client behaviour is counting the open
 * by workshop and file kind; the href, label and language are never sent.
 */
export function WorkshopMaterialLink({
  workshopSlug,
  material,
  className,
  children,
}: Props) {
  function handleClick() {
    if (!isAnalyticsWorkshopSlug(workshopSlug)) return;
    trackMaterialOpened(workshopSlug, material.kind);
  }

  return (
    <a
      href={material.href}
      hrefLang={material.language}
      // HTML materials open in the same tab: every static page carries a
      // back link to this page, and the same-origin referrer tells it whether
      // to go back to the German or the English version. Files download under
      // their published name, the one the deck and the guides refer to.
      {...(material.kind === "html" ? {} : { download: "" })}
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
