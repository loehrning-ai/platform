import { BLOG_POSTS, getPostNumberLabel } from "@/lib/blog-metadata";
import { formatSheetDate } from "@/lib/vorlagen/question-sheet";
import { keepLegalRefsTogether } from "../../_components/legal-text";
import { POST_SLUG } from "../post-copy";
import { Rich } from "./rich";
import { copyFor, type SectionProps } from "./shared";

export function Hero({ locale, context }: SectionProps) {
  const copy = copyFor(locale);
  const post = BLOG_POSTS.find((entry) => entry.slug === POST_SLUG);
  if (!post) throw new Error(`blog manifest has no entry for ${POST_SLUG}`);
  const meta = [
    `${copy.metaArticle} Nº ${getPostNumberLabel(POST_SLUG)}`,
    "Tim Löhr",
    keepLegalRefsTogether(formatSheetDate(post.dateModified, locale)),
    `${post.readingTimeMin} ${copy.metaReading}`,
  ];

  return (
    <section className="wz-hero" id="hero" aria-labelledby="hero-h">
      <p className="wz-hero__meta">
        {meta.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </p>
      <h1 className="wz-hero__title" id="hero-h">
        {copy.title}
      </h1>
      <p className="wz-hero__lede">
        <Rich source={copy.lede} context={context} />
      </p>
      <p className="wz-hero__intro">
        <Rich source={copy.intro} context={context} />
      </p>
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
    </section>
  );
}
