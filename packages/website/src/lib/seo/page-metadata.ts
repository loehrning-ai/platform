import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo/entity";

type PublicPageMetadataOptions = {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly documentTitle?: Metadata["title"];
  readonly robots?: Metadata["robots"];
};

type NoindexPageMetadataOptions = {
  readonly title: string;
  readonly description: string;
};

export function createPublicPageMetadata({
  title,
  description,
  path,
  documentTitle,
  robots = { index: true, follow: true },
}: PublicPageMetadataOptions): Metadata {
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
      locale: "de_DE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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
