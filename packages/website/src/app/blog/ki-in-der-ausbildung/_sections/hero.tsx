import { BLOG_POSTS } from "@/lib/blog-metadata";
import { formatSheetDate } from "@/lib/vorlagen/question-sheet";
import { downloadPathFor } from "@/lib/vorlagen/registry";
import { keepLegalRefsTogether } from "../../_components/legal-text";
import { PostHead } from "../../_components/post-head";
import { PrintSheetButton } from "../../_components/print-sheet-button";
import { POST_SLUG, SHEET_SLUG } from "../post-copy";
import { Rich } from "./rich";
import { copyFor, type SectionProps } from "./shared";

/**
 * The shared post header plus the reason to visit, in the first phone view:
 * one action row (jump to the sheet, print it, download it) above a
 * one-sentence lede, then the three facts.
 */
export function Hero({ locale, context }: SectionProps) {
  const copy = copyFor(locale);
  const post = BLOG_POSTS.find((entry) => entry.slug === POST_SLUG);
  if (!post) throw new Error(`blog manifest has no entry for ${POST_SLUG}`);
  const byline = [
    "Tim Löhr",
    keepLegalRefsTogether(formatSheetDate(post.dateModified, locale)),
    `${post.readingTimeMin} ${copy.metaReading}`,
  ];

  return (
    <PostHead
      slug={POST_SLUG}
      title={copy.title}
      byline={byline}
      actions={
        <>
          <a className="wz-btn" href="#fragen">
            {copy.heroActions.jump}
            <span aria-hidden="true">↓</span>
          </a>
          <PrintSheetButton label={copy.heroActions.print} tone="secondary" />
          {/* A route handler serves the file, so this is a plain download link, never localized. */}
          <a
            className="wz-btn"
            href={downloadPathFor(SHEET_SLUG, locale)}
            download
            type="text/markdown"
          >
            {copy.heroActions.download}
          </a>
        </>
      }
      lede={<Rich source={copy.lede} context={context} />}
    >
      <dl className="wz-hero__facts">
        {copy.facts.map((fact) => (
          <div className="wz-hero__fact" key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>
              <Rich source={fact.value} context={context} />
            </dd>
          </div>
        ))}
      </dl>
    </PostHead>
  );
}
