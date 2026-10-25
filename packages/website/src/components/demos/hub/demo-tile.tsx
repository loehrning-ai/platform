import Link from "next/link";
import { ArrowGlyph } from "@/components/werk";
import { cx } from "@/components/werk/cx";
import { DEMO_SLUGS, type LocalizedDemo } from "@/lib/demos";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { plakatClass } from "@/lib/plakat/palettes";
import { TILES } from "./tiles";

/**
 * One hub tile: a live miniature of the demo's own object on the workshop's
 * ground, then the name, the surprise in one sentence and what you take away.
 * The miniature is aria-hidden; the title link (stretched over the tile) is
 * the one tab stop. The `<li>` carries the workshop's plakat class so its
 * anti colour resolves for the offset block (demo-tile.css); playback is the
 * island's job (demo-tile-stage.tsx).
 */
export function DemoTile({
  demo,
  locale,
}: {
  readonly demo: LocalizedDemo;
  readonly locale: Locale;
}) {
  const copy = DEMOS_PAGE_COPY[locale].catalog;
  const Scene = TILES[demo.slug];
  const index = DEMO_SLUGS.indexOf(demo.slug);
  const headingId = `demo-${demo.slug}-heading`;
  const hookId = `demo-${demo.slug}-hook`;
  const workshop = copy.workshopNumber(demo.workshopNumber);

  return (
    <li
      data-dt-tile=""
      data-scene={`w0${index + 1}`}
      data-demo={demo.slug}
      className={cx("dt-item", plakatClass(demo.plakat))}
    >
      <article aria-labelledby={headingId} className="dt-card" data-testid="demo-tile">
        <div className="dt-scene" aria-hidden="true">
          <span className="dt-chip">{demo.workshopNumber}</span>
          <Scene locale={locale} />
        </div>
        <div className="dt-cap">
          <p className="dt-kicker">
            <span>{workshop}</span>
            <ArrowGlyph className="dt-go" />
          </p>
          <h3 id={headingId} className="dt-title">
            <Link
              prefetch={false}
              href={`${localizeHref(`/demos/${demo.slug}`, locale)}?source=gallery`}
              aria-label={`${demo.title}, ${workshop}`}
              aria-describedby={hookId}
              className="dt-link"
            >
              {demo.title}
            </Link>
          </h3>
          <p id={hookId} className="dt-hook" data-demo-hook="">
            {demo.tile.hook}
          </p>
          <p className="dt-take" data-demo-take="">
            {(demo.tile.takeLabel ?? copy.takeLabel) === "" ? null : (
              <>
                <span className="dt-take-label">{demo.tile.takeLabel ?? copy.takeLabel}</span>{" "}
              </>
            )}
            {demo.tile.take}
          </p>
        </div>
      </article>
    </li>
  );
}
