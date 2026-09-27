import type { ReactNode } from "react";
import { getPostNumberLabel } from "@/lib/blog-metadata";

/**
 * The one header every blog post opens with, in Loehrning Sans on paper
 * (post-wz.css `.wz-hero*`): the series line ("Blog · Nº 01") on the page's
 * scene Kopflinie, the H1 in the scene line (Kobalt below the IDEA blog hub,
 * as a lesson H1 takes its track), the byline as one wrapping 14px line, then
 * optional actions, the lede and any further hero parts.
 *
 * The header carries `post-wz` itself, so a post whose body still uses the
 * older editorial stylesheet (Nº 01) gets the same header as a Werkzeichnung
 * post (Nº 02).
 */
export function PostHead({
  slug,
  title,
  byline,
  lede,
  actions,
  children,
}: {
  readonly slug: string;
  readonly title: ReactNode;
  readonly byline: readonly string[];
  readonly lede?: ReactNode;
  readonly actions?: ReactNode;
  readonly children?: ReactNode;
}) {
  return (
    <section className="post-wz wz-hero" id="hero" aria-labelledby="hero-h">
      <p className="wz-hero__kicker">Blog · Nº {getPostNumberLabel(slug)}</p>
      <h1 className="wz-hero__title" id="hero-h">
        {title}
      </h1>
      <p className="wz-hero__meta">
        {byline.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </p>
      {actions ? <div className="wz-hero__actions">{actions}</div> : null}
      {lede ? <p className="wz-hero__lede">{lede}</p> : null}
      {children}
    </section>
  );
}
