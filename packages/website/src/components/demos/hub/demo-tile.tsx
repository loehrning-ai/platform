import Link from "next/link";
import { ArrowGlyph } from "@/components/werk";
import { cx } from "@/components/werk/cx";
import { takeHomeArtifacts, type TakeHomeArtifact } from "@/lib/demo-takehome";
import { DEMO_SLUGS, type LocalizedDemo } from "@/lib/demos";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { plakatClass } from "@/lib/plakat/palettes";
import { getWorkshopBySlug } from "@/lib/workshops";
import { TILES } from "./tiles";

/**
 * What a visitor takes home, in the words of the take-home rows. A demo
 * without a take-home entry yet still names the workshop's kit zip.
 */
function artifactsFor(demo: LocalizedDemo, locale: Locale): readonly TakeHomeArtifact[] {
  const fromTakeHome = takeHomeArtifacts(demo.slug);
  if (fromTakeHome.length > 0) return fromTakeHome;
  const workshop = getWorkshopBySlug(demo.workshopSlug, locale);
  const hasKit = workshop?.materials.some((material) => material.role === "kit" && material.kind === "zip") ?? false;
  return hasKit ? ["kit"] : [];
}

/**
 * One hub tile, read in five seconds on a phone: a live 16:9 miniature of
 * the demo's own object, the workshop kicker ("04 · ESG", its own link to the
 * workshop), the job line (the biggest text: what the demo does for you), the
 * demo name as the stretched link, then the artifacts you take home and the
 * time it takes. The miniature is aria-hidden; the `<li>` carries the
 * workshop's plakat class so its anti colour resolves for the offset block
 * (demo-tile.css); playback is the island's job (demo-tile-stage.tsx).
 */
export function DemoTile({
  demo,
  locale,
}: {
  readonly demo: LocalizedDemo;
  readonly locale: Locale;
}) {
  const copy = DEMOS_PAGE_COPY[locale];
  const Scene = TILES[demo.slug];
  const index = DEMO_SLUGS.indexOf(demo.slug);
  const headingId = `demo-${demo.slug}-heading`;
  const jobId = `demo-${demo.slug}-job`;
  const workshop = getWorkshopBySlug(demo.workshopSlug, locale);
  const kicker = copy.hub.kicker(demo.workshopNumber, workshop?.topic ?? copy.catalog.workshopNumber(demo.workshopNumber));
  const artifacts = artifactsFor(demo, locale);

  return (
    <li
      data-dt-tile=""
      data-scene={`w0${index + 1}`}
      data-demo={demo.slug}
      className={cx("dt-item", plakatClass(demo.plakat))}
    >
      <article aria-labelledby={headingId} className="dt-card" data-testid="demo-tile">
        <div className="dt-scene" aria-hidden="true">
          <Scene locale={locale} />
        </div>
        <div className="dt-cap">
          <p className="dt-kicker">
            <Link
              prefetch={false}
              href={localizeHref(`/workshops/${demo.workshopSlug}`, locale)}
              className="dt-kicker-link"
              data-demo-workshop-kicker=""
              aria-label={`${copy.catalog.workshopNumber(demo.workshopNumber)}: ${workshop?.title ?? kicker}`}
            >
              {kicker}
            </Link>
          </p>
          <p id={jobId} className="dt-job" data-demo-job="">
            {demo.job}
          </p>
          <h3 id={headingId} className="dt-title">
            <Link
              prefetch={false}
              href={`${localizeHref(`/demos/${demo.slug}`, locale)}?source=gallery`}
              aria-describedby={jobId}
              className="dt-link"
            >
              {demo.title}
            </Link>
            <ArrowGlyph className="dt-go" />
          </h3>
          <div className="dt-foot">
            {artifacts.length > 0 ? (
              <ul className="dt-artifacts" data-demo-artifacts="">
                {artifacts.map((artifact) => (
                  <li key={artifact} className="dt-artifact">
                    {copy.hub.artifacts[artifact]}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="dt-meta" data-demo-meta="">
              {copy.hub.meta(demo.minutes)}
            </p>
          </div>
        </div>
      </article>
    </li>
  );
}
