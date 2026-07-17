import type { Metadata } from "next";
import { formatServiceAddress, LEGAL_IDENTITY } from "@/lib/legal-identity";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum von loehrning.ai | Tim Löhr",
  alternates: { canonical: "/impressum" },
};

export default function ImpressumPage() {
  const address = LEGAL_IDENTITY.serviceAddress;
  const formattedAddress = formatServiceAddress(address);

  return (
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
          Impressum
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Angaben gemäß § 5 DDG
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
              Anbieter
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
              Kontakt
            </h2>
            <p>
              E-Mail: {LEGAL_IDENTITY.email}
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
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </h2>
            <p>
              {LEGAL_IDENTITY.providerName}
              {formattedAddress
                ? `, ${formattedAddress}.`
                : `. Erreichbar per E-Mail: ${LEGAL_IDENTITY.email}.`}
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              Haftungsausschluss
            </h2>
            <h3 className="mb-1 font-medium text-foreground">
              Haftung für Inhalte
            </h3>
            <p>
              Für eigene Inhalte gelten die allgemeinen Gesetze. Die
              Lernmaterialien werden sorgfältig gepflegt, sind aber keine
              Rechts-, Steuer-, Sicherheits- oder Compliance-Beratung.
              Gesetzliche Haftungsregeln werden durch diesen Hinweis nicht
              eingeschränkt.
            </p>

            <h3 className="mb-1 mt-4 font-medium text-foreground">
              Haftung für Links
            </h3>
            <p>
              Diese Website enthält Links zu externen Webseiten Dritter, auf
              deren Inhalte ich keinen Einfluss habe. Für die Inhalte der
              verlinkten Seiten ist der jeweilige Anbieter verantwortlich.
              Konkrete Hinweise auf rechtswidrige oder nicht mehr zutreffende
              Verlinkungen werden geprüft; betroffene Links werden entfernt oder
              korrigiert.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              Urheberrecht
            </h2>
            <p>
              Der veröffentlichte Quellcode, Lernvorlagen, Schriftdateien,
              importierte Materialien, redaktionelle Inhalte und Markenassets
              unterliegen unterschiedlichen Lizenzen und Nutzungsrechten.
              Maßgeblich sind die Lizenzhinweise des jeweiligen Materials und
              die öffentliche Lizenzrichtlinie des Projekts. Eine offene
              Quellcode-Lizenz gewährt nicht automatisch Rechte an Kursprosa,
              Büchern oder Marken.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
