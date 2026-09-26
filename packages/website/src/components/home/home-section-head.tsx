import type { ReactNode } from "react";
import { SectionHead } from "@/components/werk/section-head";

/**
 * Section head for the home sections below the hero: the site's one werk
 * SectionHead in its compact size (a 2px ink Kopflinie, a 22px heading on a
 * phone and the fluid h2 from sm), with the home's phone rule on top.
 *
 * No kicker: the Kopflinie does that job. The note is an optional fact
 * ("57 Lektionen · kostenlos · DE + EN") on the heading's baseline, and the
 * introduction sits under the heading. Below lg both step out, so a phone
 * section opens with its heading and its rows.
 */
export function HomeSectionHead({
  id,
  title,
  introduction,
  note,
}: {
  readonly id?: string;
  readonly title: ReactNode;
  readonly introduction?: ReactNode;
  /** One factual caption on the heading's baseline, from lg only. */
  readonly note?: ReactNode;
}) {
  return (
    <SectionHead
      id={id}
      size="compact"
      title={title}
      caption={note}
      description={introduction}
      className="max-lg:[&_p]:hidden"
    />
  );
}
