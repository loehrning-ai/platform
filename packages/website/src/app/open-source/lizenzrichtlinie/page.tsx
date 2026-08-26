import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { readRootLicensePolicy } from "@/lib/open-source/license-policy.server";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

const LICENSE_PAGE_COPY = {
  de: {
    title: "Lizenzrichtlinie",
    description:
      "Verbindliche Lizenzzuordnung für Code, Lerninhalte, Medien, Schriften und Marken der loehrning.ai Lernplattform.",
    back: "Open Source",
    eyebrow: "Repository-Richtlinie",
    introduction:
      "Diese Seite wird beim Build direkt aus der verbindlichen Datei",
    introductionAfter:
      "im Repository-Stamm erzeugt. Der folgende Richtlinientext steht im englischen Original; er ist keine getrennte redaktionelle Kopie.",
    digest: "SHA-256 des Richtlinientexts",
  },
  en: {
    title: "License policy",
    description:
      "Binding license allocation for code, course content, media, fonts, and trademarks in the loehrning.ai learning platform.",
    back: "Open source",
    eyebrow: "Repository policy",
    introduction:
      "This page is generated at build time directly from the binding",
    introductionAfter:
      "file at the repository root. The policy below is the English original, not a separate editorial copy.",
    digest: "SHA-256 of the policy text",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = LICENSE_PAGE_COPY[locale];
  const localizedPath = localizeHref("/open-source/lizenzrichtlinie", locale);
  const metadata = createPublicPageMetadata({
    title: copy.title,
    description: copy.description,
    path: localizedPath,
    locale,
  });

  return {
    ...metadata,
    alternates: {
      ...buildLocaleAlternates(
        "/open-source/lizenzrichtlinie",
        contentLocalesForPath("/open-source/lizenzrichtlinie"),
      ),
      canonical: localizedPath,
    },
    openGraph: metadata.openGraph
      ? {
          ...metadata.openGraph,
          locale: locale === "de" ? "de_DE" : "en_GB",
        }
      : metadata.openGraph,
  };
}

export default async function LicensePolicyPage() {
  const locale = await getRequestLocale();
  const copy = LICENSE_PAGE_COPY[locale];
  const policy = readRootLicensePolicy();

  return (
    <section className="py-8 sm:py-12" aria-labelledby="license-policy-title">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link
          href={localizeHref("/open-source", locale)}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          {copy.back}
        </Link>
        <div className="mt-4 h-[3px] w-16 bg-brand-orange" />
        <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
          {copy.eyebrow}
        </p>
        <h1
          id="license-policy-title"
          className="mt-3 text-[clamp(2.25rem,4vw,4rem)] font-bold leading-[0.96] tracking-[-0.04em]"
        >
          {copy.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
          {copy.introduction}{" "}
          <code className="text-foreground">LICENSE_POLICY.md</code>{" "}
          {copy.introductionAfter}
        </p>
        <dl className="mt-4 border border-border border-l-[3px] border-l-brand-orange bg-card p-4 text-sm">
          <div>
            <dt className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
              {copy.digest}
            </dt>
            <dd className="mt-2 break-all font-mono text-xs text-foreground">
              {policy.sha256}
            </dd>
          </div>
        </dl>
        <pre className="mt-6 overflow-x-auto whitespace-pre-wrap border border-border bg-card p-4 font-mono text-sm leading-relaxed text-foreground sm:p-5">
          <code>{policy.markdown}</code>
        </pre>
      </div>
    </section>
  );
}
