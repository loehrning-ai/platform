import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/locale";
import { absoluteUrl } from "@/lib/seo/entity";

/** Alt text of the root social card (`app/opengraph-image.tsx`). */
export const DEFAULT_SOCIAL_IMAGE_ALT =
  "KI verstehen. Sicher anwenden. / Understand AI. Apply it safely. Pale yellow headline on an ultramarine poster beside a flat red globe with Germany marked, above the loehrning.ai wordmark.";

/**
 * The root social card for a page without a card of its own. A page that
 * sets `openGraph` replaces the layout's, so it has to name an image itself.
 * A config image also replaces a card file in the same segment, so a route
 * with its own opengraph-image file must not use this.
 */
export function defaultSocialImage(locale: Locale) {
  return {
    url: absoluteUrl(locale === "de" ? "/opengraph-image" : "/en/opengraph-image"),
    width: 1200,
    height: 630,
    alt: DEFAULT_SOCIAL_IMAGE_ALT,
  };
}

type PublicPageMetadataOptions = {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly locale: Locale;
  readonly documentTitle?: Metadata["title"];
  readonly robots?: Metadata["robots"];
  /** True when the route ships its own opengraph-image file. */
  readonly hasRouteCard?: boolean;
};

type NoindexPageMetadataOptions = {
  readonly title: string;
  readonly description: string;
};

export function createPublicPageMetadata({
  title,
  description,
  path,
  locale,
  documentTitle,
  robots = { index: true, follow: true },
  hasRouteCard = false,
}: PublicPageMetadataOptions): Metadata {
  // A config image would replace the route's own card, so name one only
  // when the route has none.
  const images = hasRouteCard ? {} : { images: [defaultSocialImage(locale)] };
  return {
    title: documentTitle ?? title,
    description,
    alternates: { canonical: path },
    robots,
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: "loehrning.ai",
      locale: locale === "de" ? "de_DE" : "en_GB",
      alternateLocale: [locale === "de" ? "en_GB" : "de_DE"],
      type: "website",
      ...images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...images,
    },
  };
}

export function createNoindexPageMetadata({
  title,
  description,
}: NoindexPageMetadataOptions): Metadata {
  return {
    title,
    description,
    robots: { index: false, follow: false },
    alternates: { canonical: null },
    openGraph: null,
    twitter: null,
  };
}
