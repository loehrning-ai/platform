import type { Metadata } from "next";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { formatServiceAddress, LEGAL_IDENTITY } from "@/lib/legal-identity";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

const IMPRINT_COPY = {
  de: {
    title: "Impressum",
    description: "Impressum von loehrning.ai | Tim Löhr",
    legalBasis: "Angaben gemäß § 5 DDG",
    provider: "Anbieter",
    email: "E-Mail",
    contact: "Kontakt",
    contentResponsibility:
      "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV",
    fallbackResponsibility: (email: string) =>
      ". Erreichbar per E-Mail: " + email + ".",
    liability: "Haftungsausschluss",
    liabilityContent: "Haftung für Inhalte",
    liabilityContentText:
      "Für eigene Inhalte gelten die allgemeinen Gesetze. Die Lernmaterialien werden sorgfältig gepflegt, sind aber keine Rechts-, Steuer-, Sicherheits- oder Compliance-Beratung. Gesetzliche Haftungsregeln werden durch diesen Hinweis nicht eingeschränkt.",
    liabilityLinks: "Haftung für Links",
    liabilityLinksText:
      "Diese Website enthält Links zu externen Webseiten Dritter, auf deren Inhalte ich keinen Einfluss habe. Für die Inhalte der verlinkten Seiten ist der jeweilige Anbieter verantwortlich. Konkrete Hinweise auf rechtswidrige oder nicht mehr zutreffende Verlinkungen werden geprüft; betroffene Links werden entfernt oder korrigiert.",
    copyright: "Urheberrecht",
    copyrightText:
      "Der veröffentlichte Quellcode, Schriftdateien, importierte Materialien, redaktionelle Inhalte und Markenassets unterliegen unterschiedlichen Lizenzen und Nutzungsrechten. Maßgeblich sind die Lizenzhinweise des jeweiligen Materials und die öffentliche Lizenzrichtlinie des Projekts. Eine offene Quellcode-Lizenz gewährt nicht automatisch Rechte an Kursprosa, Büchern oder Marken.",
  },
  en: {
    title: "Legal notice",
    description: "Legal notice for loehrning.ai | Tim Löhr",
    legalBasis: "Information under Section 5 DDG",
    provider: "Provider",
    email: "Email",
    contact: "Contact",
    contentResponsibility:
      "Responsible for content under Section 18(2) MStV",
    fallbackResponsibility: (email: string) =>
      ". Available by email at " + email + ".",
    liability: "Liability notice",
    liabilityContent: "Liability for content",
    liabilityContentText:
      "The general laws apply to content published by the provider. The learning material is maintained with care, but it is not legal, tax, security, or compliance advice. This notice does not restrict statutory liability.",
    liabilityLinks: "Liability for links",
    liabilityLinksText:
      "This website links to external websites operated by third parties whose content is outside the provider's control. The operator of the linked page is responsible for that content. Specific reports of unlawful or outdated links are reviewed; affected links are removed or corrected.",
    copyright: "Copyright and licences",
    copyrightText:
      "Published source code, font files, imported material, editorial content, and brand assets are subject to different licences and usage rights. The licence notice attached to each item and the project's public licence policy determine the applicable terms. An open-source software licence does not automatically grant rights to course prose, books, or trademarks.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = IMPRINT_COPY[locale];
  const localizedPath = localizeHref("/impressum", locale);
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
        "/impressum",
        contentLocalesForPath("/impressum"),
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

export default async function ImpressumPage() {
  return <ImpressumContent locale={await getRequestLocale()} />;
}

function ImpressumContent({ locale }: { readonly locale: Locale }) {
  const copy = IMPRINT_COPY[locale];
  const address = LEGAL_IDENTITY.serviceAddress;
  const formattedAddress = formatServiceAddress(address);

  return (
    <section className="py-24" aria-labelledby="imprint-title">
      <div className="mx-auto max-w-3xl break-words px-6">
        <h1
          id="imprint-title"
          className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl"
        >
          {copy.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {copy.legalBasis}
        </p>

        <div className="mt-12 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <div
            data-testid="responsible-party"
            data-service-address={formattedAddress ?? ""}
            data-address-street={address?.streetAndNumber ?? ""}
            data-address-postal-code={address?.postalCode ?? ""}
            data-address-city={address?.city ?? ""}
            data-address-country={address?.country ?? ""}
          >
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              {copy.provider}
            </h2>
            <p>
              {LEGAL_IDENTITY.providerName}
              <br />
              {LEGAL_IDENTITY.projectName}
              {address ? (
                <>
                  <br />
                  {address.streetAndNumber}
                  <br />
                  {address.postalCode} {address.city}
                  <br />
                  {address.country}
                </>
              ) : null}
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              {copy.contact}
            </h2>
            <p>
              {copy.email}: {LEGAL_IDENTITY.email}
              <br />
              LinkedIn:{" "}
              <a
                href={LEGAL_IDENTITY.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-orange hover:underline"
              >
                linkedin.com/in/timloehr
              </a>
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              {copy.contentResponsibility}
            </h2>
            <p>
              {LEGAL_IDENTITY.providerName}
              {formattedAddress
                ? ", " + formattedAddress + "."
                : copy.fallbackResponsibility(LEGAL_IDENTITY.email)}
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              {copy.liability}
            </h2>
            <h3 className="mb-1 font-medium text-foreground">
              {copy.liabilityContent}
            </h3>
            <p>{copy.liabilityContentText}</p>

            <h3 className="mb-1 mt-4 font-medium text-foreground">
              {copy.liabilityLinks}
            </h3>
            <p>{copy.liabilityLinksText}</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              {copy.copyright}
            </h2>
            <p>{copy.copyrightText}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
