import Link from "next/link";
import type { ReactNode } from "react";
import { WorkshopMaterialLink } from "@/app/workshops/[slug]/workshop-material-link";
import { WORKSHOP_PAGE_COPY } from "@/app/workshops/workshop-copy";
import { ArrowGlyph, cx } from "@/components/werk";
import type { Locale } from "@/lib/i18n/locale";
import { plakatClass, type PlakatKey } from "@/lib/plakat/palettes";
import { workshopStage } from "@/lib/workshop-stage";
import type { Workshop } from "@/lib/workshops";
import { ActionPicture, type ActionPictureKind } from "./action-pictures";
import "./action-cards.css";

interface Props {
  readonly workshop: Workshop;
  readonly locale: Locale;
  readonly plakat: PlakatKey;
}

interface CardProps {
  readonly workshop: Workshop;
  readonly plakat: PlakatKey;
  readonly slot: "a" | "b";
  readonly kind: ActionPictureKind;
  readonly material: Parameters<typeof WorkshopMaterialLink>[0]["material"];
  readonly title: string;
  readonly meta: string;
  /** Spoken after the title, e.g. ": Prognosen, ZIP, 1,1 MB". */
  readonly spoken: string;
  readonly download: boolean;
  readonly secondary?: {
    readonly href: string;
    readonly label: string;
    /** Spoken after the label, e.g. ": Prognosen". */
    readonly spoken: string;
  };
}

function Card({
  workshop,
  plakat,
  slot,
  kind,
  material,
  title,
  meta,
  spoken,
  download,
  secondary,
}: CardProps): ReactNode {
  return (
    <li>
      <div
        data-action-card={kind}
        className={cx("ac-card", slot === "b" && "ac-card-b", plakatClass(plakat))}
      >
        <ActionPicture kind={kind} slug={workshop.slug} />
        <div className="ac-body">
          <div className="ac-head">
            <WorkshopMaterialLink
              workshopSlug={workshop.slug}
              material={material}
              className="ac-link"
            >
              <span className="ac-title">{title}</span>
              <span className="sr-only">{spoken}</span>
            </WorkshopMaterialLink>
            <ArrowGlyph direction={download ? "down" : "right"} className="ac-go" />
          </div>
          <div className="ac-sub">
            <p className="ac-meta">{meta}</p>
            {secondary ? (
              <Link href={secondary.href} className="ac-secondary">
                {secondary.label}
                {/* The topic gives the link its context in a list of links. */}
                <span className="sr-only">{secondary.spoken}</span>
                <ArrowGlyph direction="right" className="ac-secondary-go" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * The two big actions of a workshop page, right under the band: card A opens
 * the slides (or the lab for a workshop without a deck), card B downloads the
 * kit (or opens the case). Each is one real link with a stretched hit area;
 * a workshop with a kit page also gets one small secondary link to it (a 44px
 * target named with the workshop's topic). Server component, zero script: the pictures move in CSS only
 * (action-cards.css), and the stage's pause control stops them
 * (docs/workshop-standard.md, "The stage").
 */
export function ActionCards({ workshop, locale, plakat }: Props): ReactNode {
  const copy = WORKSHOP_PAGE_COPY[locale].detail;
  const stage = workshopStage(workshop, locale);
  const topic = workshop.topic;

  return (
    <ul className="ac-list" data-workshop-actions="">
      {stage.a ? (
        <Card
          workshop={workshop}
          plakat={plakat}
          slot="a"
          kind={stage.a.kind}
          material={stage.a.material}
          title={copy.stage[stage.a.kind]}
          meta={stage.a.meta}
          spoken={`: ${topic}`}
          download={stage.a.material.kind !== "html"}
        />
      ) : null}
      {stage.b ? (
        <Card
          workshop={workshop}
          plakat={plakat}
          slot="b"
          kind={stage.b.kind}
          material={stage.b.material}
          title={copy.stage[stage.b.kind]}
          meta={stage.b.meta}
          spoken={`: ${topic}${stage.b.fileFacts ?? ""}`}
          download={stage.b.download}
          {...(stage.b.kitPageHref
            ? {
                secondary: {
                  href: stage.b.kitPageHref,
                  label: copy.kitPageAction,
                  spoken: `: ${topic}`,
                },
              }
            : {})}
        />
      ) : null}
    </ul>
  );
}
