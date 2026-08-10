import type { Metadata } from "next";
import { UeberMichContent } from "./ueber-mich-content";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { PROFILE_COPY } from "@/lib/i18n/profile-copy";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { JsonLd, PERSON_ID, SITE_URL, WEBSITE_ID } from "@/lib/seo/json-ld";
import { PERSON_SAME_AS_URLS, TIM_ENTITY } from "@/lib/seo/entity";

const PATH = "/ueber-mich";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = PROFILE_COPY[locale].metadata;
  const localizedPath = localizeHref(PATH, locale);

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      ...buildLocaleAlternates(PATH, contentLocalesForPath(PATH)),
      canonical: localizedPath,
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: copy.socialTitle,
      description: copy.description,
      url: `${SITE_URL}${localizedPath}`,
      siteName: "loehrning.ai",
      locale: locale === "de" ? "de_DE" : "en_GB",
      type: "profile",
      firstName: TIM_ENTITY.givenName,
      lastName: TIM_ENTITY.familyName,
      images: [
        {
          url: TIM_ENTITY.portraitUrl,
          width: 800,
          height: 800,
          alt: copy.portraitAlt,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: copy.socialTitle,
      description: copy.description,
      images: [{ url: TIM_ENTITY.portraitUrl, alt: copy.portraitAlt }],
    },
  };
}

function profileGraph(locale: Locale) {
  const copy = PROFILE_COPY[locale];
  const path = localizeHref(PATH, locale);
  const homePath = localizeHref("/", locale);
  const pageUrl = `${SITE_URL}${path}`;

  return {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: copy.breadcrumbHome,
            item: `${SITE_URL}${homePath === "/" ? "" : homePath}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: copy.metadata.title,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "ProfilePage",
        url: pageUrl,
        name: copy.metadata.title,
        description: copy.metadata.description,
        inLanguage: locale === "de" ? "de-DE" : "en-GB",
        isPartOf: { "@id": WEBSITE_ID },
        mainEntity: { "@id": PERSON_ID },
      },
      {
        "@type": "Person",
        "@id": PERSON_ID,
        name: TIM_ENTITY.displayName,
        givenName: TIM_ENTITY.givenName,
        familyName: TIM_ENTITY.familyName,
        jobTitle: copy.personJobTitle,
        description: copy.personDescription,
        url: pageUrl,
        image: TIM_ENTITY.portraitUrl,
        sameAs: [...PERSON_SAME_AS_URLS],
        knowsAbout: [...copy.knowsAbout],
        alumniOf: {
          "@type": "CollegeOrUniversity",
          name: "Friedrich-Alexander-Universität Erlangen-Nürnberg",
          url: "https://www.fau.de",
        },
      },
    ],
  };
}

export default async function UeberMichPage() {
  const locale = await getRequestLocale();

  return (
    <>
      <JsonLd data={profileGraph(locale)} id="ueber-mich-jsonld" />
      <UeberMichContent locale={locale} />
    </>
  );
}
