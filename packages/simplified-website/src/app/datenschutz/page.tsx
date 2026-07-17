import type { Metadata } from "next";
import { getRuntimeFeatures } from "@/lib/runtime-features";
import { formatServiceAddress, LEGAL_IDENTITY } from "@/lib/legal-identity";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: "Datenschutzerklärung von loehrning.ai | Tim Löhr",
  alternates: { canonical: "/datenschutz" },
};

export default function DatenschutzPage() {
  const features = getRuntimeFeatures();
  const address = LEGAL_IDENTITY.serviceAddress;
  const formattedAddress = formatServiceAddress(address);

  return (
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
          Datenschutzerklärung
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Stand: 14. Juli 2026
        </p>

        <div className="mt-12 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <LegalSection title="1. Verantwortlicher">
            <p
              data-testid="responsible-party"
              data-service-address={formattedAddress ?? ""}
              data-address-street={address?.streetAndNumber ?? ""}
              data-address-postal-code={address?.postalCode ?? ""}
              data-address-city={address?.city ?? ""}
              data-address-country={address?.country ?? ""}
            >
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
              <br />
              E-Mail: {LEGAL_IDENTITY.email}
            </p>
            <p className="mt-2">
              Diese Plattform richtet sich an Personen ab 16 Jahren. Jüngere
              Personen sollten die Zustimmung eines Erziehungsberechtigten
              einholen.
            </p>
          </LegalSection>

          <LegalSection title="2. Allgemeines zur Datenverarbeitung">
            <p>
              Personenbezogene Daten werden nur verarbeitet, soweit dies für die
              angeforderte Funktion, die sichere Bereitstellung oder die
              Beantwortung einer Anfrage erforderlich ist und eine
              Rechtsgrundlage besteht. Optionale Anbieterfunktionen bleiben
              deaktiviert, solange ihre technische Konfiguration und die
              erforderlichen Auftragsverarbeitungsvereinbarungen nicht belegt
              sind.
            </p>
          </LegalSection>

          <LegalSection title="3. Hosting">
            {features.vercelHosting ? (
              <p>
                Diese Bereitstellung wird bei Vercel Inc. (USA) gehostet. Dabei
                fallen technisch erforderliche Verbindungs- und Serverdaten wie
                IP-Adresse, Browsertyp und Zugriffszeit an. Rechtsgrundlage ist
                Art. 6 Abs. 1 lit. f DSGVO (sichere und effiziente
                Bereitstellung). Die Vercel-DPA-Annahme ist durch das
                Produktions-Gate datiert belegt. Etwaige Drittlandübermittlungen
                richten sich nach den im DPA dokumentierten Garantien.
              </p>
            ) : (
              <p>
                In dieser providerfreien Bereitstellung ist kein externer
                Hostinganbieter als aktiv konfiguriert. Vor einer öffentlichen
                Bereitstellung muss der tatsächliche Betreiber den verwendeten
                Hostinganbieter, die Rechtsgrundlage und etwaige
                Drittlandübermittlungen hier eintragen.
              </p>
            )}
          </LegalSection>

          <LegalSection title="4. Kontaktaufnahme und Feedback">
            <p>
              Bei einer Kontaktaufnahme per E-Mail werden die mitgeteilten Daten
              zur Bearbeitung der Anfrage verarbeitet. Rechtsgrundlage ist je
              nach Kontext Art. 6 Abs. 1 lit. b oder lit. f DSGVO.
            </p>
            {features.feedback ? (
              <p className="mt-2">
                Das aktive Feedback-Formular speichert Kategorie, Nachricht,
                optional nur den Seitenpfad ohne Query-String oder Fragment und
                den Zeitpunkt in Supabase. Name und E-Mail-Adresse werden nicht
                als eigene Felder abgefragt. Freitext kann dennoch
                personenbezogene oder vertrauliche Angaben enthalten; solche
                Angaben sollen nicht eingegeben werden. Nachrichten werden
                spätestens nach 180 Tagen durch einen täglich ausgeführten
                Löschjob entfernt. Zur Missbrauchsbegrenzung wird ein
                SHA-256-Hash der vom Hostingrand als vertrauenswürdig
                übergebenen Client-IP als Rate-Limit-Schlüssel verarbeitet. Der
                Schlüssel gilt höchstens 24 Stunden; abgelaufene Zähler werden
                ignoriert und bei einem späteren Limiter-Aufruf bereinigt. Eine
                sekundengenaue Löschung nach Ablauf wird nicht zugesagt.
              </p>
            ) : (
              <p className="mt-2">
                Das serverseitige Feedback-Formular ist in dieser Bereitstellung
                deaktiviert. Rückmeldungen können per E-Mail an tim@loehrning.ai
                gesendet werden.
              </p>
            )}
          </LegalSection>

          <LegalSection title="5. Cookies, lokale Speicherung und Reichweitenmessung">
            <p>
              Kursfortschritt und Übungsentwürfe werden für die vom Nutzer
              angeforderte Lernfunktion im Browser über localStorage oder
              sessionStorage gespeichert. Bei aktivem Lernkonto können technisch
              erforderliche Session-Cookies gesetzt werden.{" "}
              <a
                href="https://www.gesetze-im-internet.de/ttdsg/__25.html"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                § 25 Abs. 1 TDDDG
              </a>{" "}
              verlangt grundsätzlich eine Einwilligung, wenn Informationen auf
              einem Endgerät gespeichert oder daraus ausgelesen werden. Die
              Ausnahme des § 25 Abs. 2 Nr. 2 TDDDG gilt nur, soweit dies für
              einen ausdrücklich gewünschten Telemediendienst unbedingt
              erforderlich ist. Die Plattform leitet eine Einwilligungsfreiheit
              nicht allein daraus ab, dass eine Technik ohne Cookies arbeitet.
            </p>
            {features.vercelTelemetry ? (
              <p className="mt-2">
                Vercel Web Analytics und Speed Insights sind in dieser
                Bereitstellung ausdrücklich aktiviert. Sie dienen der
                Reichweitenmessung und technischen Beobachtung. Die
                datenschutzrechtliche Rechtsgrundlage sowie die technische
                Einordnung nach § 25 TDDDG wurden vor Aktivierung datiert
                dokumentiert. Es findet kein Werbetracking durch diese Plattform
                statt.
              </p>
            ) : (
              <p className="mt-2">
                Vercel Web Analytics und Speed Insights sind in dieser
                Bereitstellung deaktiviert. Es werden keine Werbe- oder
                Reichweitenmessungs-Cookies gesetzt.
              </p>
            )}
          </LegalSection>

          <LegalSection title="6. Technische Fehlerdiagnose (Sentry)">
            {features.sentry ? (
              <p>
                Sentry (Functional Software, Inc., USA) ist zur technischen
                Fehlerdiagnose aktiv. Fehlerereignisse können Seite, Browsertyp,
                Zeitpunkt und Fehlermeldung enthalten. sendDefaultPii ist
                deaktiviert, die erfasste Remote-Adresse wird vor dem Versand
                entfernt, URL-Query-Strings und Fragmente werden verworfen und
                Session-Replay ist deaktiviert. Auf den
                Zertifikats-Verifizierungsseiten wird Telemetrie nicht beprobt;
                Ereignisse, Transaktionen und Navigationsspuren mit Bezug zu
                diesen Seiten werden vor dem Versand verworfen oder redigiert.
                Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. DPA und
                tatsächliche Aufbewahrungsdauer sind durch das Produktions-Gate
                belegt.
              </p>
            ) : (
              <p>
                Sentry ist in dieser Bereitstellung deaktiviert. Es werden keine
                Fehlerereignisse an Sentry übertragen.
              </p>
            )}
          </LegalSection>

          <LegalSection
            id="ki"
            title="7. KI-gestütztes Lernfeedback (Anthropic Claude)"
          >
            {features.anthropic ? (
              <>
                <p>
                  Bei ausdrücklich gestarteten interaktiven KI-Übungen werden
                  die eingegebenen Lerntexte an die Claude-API von Anthropic PBC
                  (USA) übermittelt, um automatisiertes Lernfeedback zu
                  erzeugen. Pfade, E-Mail-Adressen und Kontokennungen werden vom
                  Anwendungsprotokoll nicht als Promptbestandteil hinzugefügt.
                </p>
                <p className="mt-2">
                  Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Die
                  Anthropic-DPA-Annahme ist durch das Produktions-Gate datiert
                  belegt. Nutzer dürfen keine personenbezogenen oder
                  vertraulichen Echtdaten in Übungsfelder eingeben.
                </p>
                <p className="mt-2">
                  Die vertraglich geprüfte Aufbewahrungsdauer für Ein- und
                  Ausgaben dieser API-Nutzung beträgt{" "}
                  {features.anthropicRetentionDays} Tage. Eine Änderung dieses
                  Werts erfordert eine erneute Prüfung des Anbieter-Vertrags und
                  der öffentlichen Erklärung.
                </p>
                <p className="mt-2">
                  Zur Missbrauchsbegrenzung wird ein SHA-256-Hash der vom
                  Hostingrand als vertrauenswürdig übergebenen Client-IP als
                  pseudonymer Rate-Limit-Schlüssel in Supabase verarbeitet. Der
                  Zähler gilt höchstens eine Stunde; abgelaufene Einträge werden
                  ignoriert und bei einem späteren Limiter-Aufruf bereinigt.
                  Eine sekundengenaue physische Löschung nach Ablauf wird nicht
                  zugesagt. Die Rohadresse wird nicht als Rate-Limit-Schlüssel
                  gespeichert.
                </p>
              </>
            ) : (
              <p>
                Anthropic Claude ist in dieser Bereitstellung deaktiviert.
                Übungen verwenden lokales oder regelbasiertes Lernfeedback und
                übertragen keine Eingaben an Anthropic.
              </p>
            )}
          </LegalSection>

          <LegalSection title="8. Lernkonto und Datenspeicherung (Supabase)">
            {features.account ? (
              <>
                <p>
                  Supabase (Supabase, Inc., USA) stellt Authentifizierung,
                  Lernkonto und serverseitige Hilfsfunktionen bereit. Das
                  konfigurierte Projekt ist mit der Region{" "}
                  <strong className="text-foreground">
                    {features.supabaseRegion}
                  </strong>{" "}
                  als EU-Region ausgewiesen. Verarbeitet werden bei Nutzung des
                  Lernkontos E-Mail-Adresse, Sessiondaten, Kursfortschritt,
                  Zertifikatsstatus und Aktivitätszeitpunkte.
                </p>
                <p className="mt-2">
                  Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO sowie für
                  Sicherheit und Missbrauchsschutz Art. 6 Abs. 1 lit. f DSGVO.
                  Die Supabase-DPA-Annahme und EU-Region sind durch das
                  Produktions-Gate belegt. Marketing-Leads und Berichtsanfragen
                  werden nicht im Lernkonto gespeichert.
                </p>
              </>
            ) : (
              <p>
                Supabase, Magic-Link-Anmeldung, serverseitige
                Fortschrittssynchronisierung und Kontoverwaltung sind in dieser
                Bereitstellung deaktiviert. Fortschritt verbleibt ausschließlich
                im jeweiligen Browser. Bei einer späteren Aktivierung verlangt
                das Produktions-Gate eine vollständige Konfiguration, eine
                bestätigte EU-Region und ein datiertes Supabase-DPA.
              </p>
            )}
          </LegalSection>

          <LegalSection title="9. Ihre Rechte">
            <p>
              Betroffene Personen haben insbesondere Rechte auf Auskunft,
              Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und
              Widerspruch nach Art. 15 bis 21 DSGVO. Anfragen können an
              tim@loehrning.ai gerichtet werden.
            </p>
            {features.account ? (
              <p className="mt-2">
                Für Daten eines aktiven Lernkontos steht nach Login zusätzlich{" "}
                <a
                  href="/konto/datenschutz"
                  className="text-brand-orange underline underline-offset-4 hover:text-foreground"
                >
                  /konto/datenschutz
                </a>{" "}
                zur Verfügung.
              </p>
            ) : null}
          </LegalSection>

          <LegalSection title="10. Aufbewahrungsfristen">
            <ul className="list-inside list-disc space-y-1">
              <li>
                Kontakt-E-Mails: bis zum Abschluss der Bearbeitung, soweit keine
                gesetzlichen Pflichten entgegenstehen.
              </li>
              <li>
                Browserdaten: auf dem Endgerät, bis die Person sie oder die
                Browserdaten löscht.
              </li>
              {features.account ? (
                <li>
                  Lernkonto und Kursfortschritt: bis zur Kontolöschung oder
                  einer berechtigten Löschanfrage.
                </li>
              ) : null}
              {features.feedback ? (
                <>
                  <li>
                    Feedback-Nachrichten: höchstens 180 Tage; ein täglich
                    ausgeführter Löschjob entfernt ältere Einträge.
                  </li>
                  <li>
                    Feedback-Rate-Limit: Gültigkeit 24 Stunden; abgelaufene
                    Zähler werden bei späteren Limiter-Aufrufen bereinigt.
                  </li>
                </>
              ) : null}
              {features.sentry && features.sentryRetentionDays ? (
                <li>
                  Sentry-Fehlerereignisse: {features.sentryRetentionDays} Tage
                  entsprechend der verifizierten Projekteinstellung.
                </li>
              ) : null}
            </ul>
          </LegalSection>

          <LegalSection title="11. Beschwerderecht">
            <p>
              Nach{" "}
              <a
                href="https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=de"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Art. 77 DSGVO
              </a>{" "}
              besteht ein Beschwerderecht bei einer Aufsichtsbehörde,
              insbesondere im Mitgliedstaat des gewöhnlichen Aufenthaltsorts,
              des Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes. Eine
              konkrete Landesbehörde wird nicht behauptet, solange der
              Betreiberstandort nicht abschließend eingetragen ist.
            </p>
          </LegalSection>

          <LegalSection title="12. Transportverschlüsselung">
            <p>
              Öffentliche Bereitstellungen müssen vertrauliche Inhalte per
              HTTPS/TLS übertragen. Der konkrete Hostingbetreiber ist für die
              korrekte TLS-Konfiguration verantwortlich.
            </p>
          </LegalSection>
        </div>
      </div>
    </section>
  );
}

function LegalSection({
  id,
  title,
  children,
}: {
  readonly id?: string;
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div id={id} className={id ? "scroll-mt-24" : undefined}>
      <h2 className="mb-2 text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  );
}
