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
      {...(material.kind === "zip"
        ? { download: `${workshopSlug}-kit.zip` }
        : // Materials are same-origin files. Keeping the referrer lets the
          // learner guide send a visitor back to the German or English page.
          { target: "_blank", rel: "noopener" })}
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
