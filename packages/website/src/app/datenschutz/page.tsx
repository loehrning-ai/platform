import { getRuntimeFeatures } from "@/lib/runtime-features";
import { formatServiceAddress, LEGAL_IDENTITY } from "@/lib/legal-identity";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

export const metadata = createPublicPageMetadata({
  title: "Datenschutz",
  description: "Datenschutzerklärung von loehrning.ai | Tim Löhr",
  path: "/datenschutz",
});

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
          Stand: 30. Juli 2026
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
                Bereitstellung). Die Vercel-DPA-Annahme ist vor der
                Aktivierung datiert dokumentiert worden. Etwaige Drittlandübermittlungen
                richten sich nach den im DPA dokumentierten Garantien.
              </p>
            ) : (
              <p>
                In dieser Bereitstellung ohne externe Anbieter ist kein
                Hostinganbieter aktiv konfiguriert. Vor einer öffentlichen
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
                Löschjob entfernt. Zur Missbrauchsbegrenzung wird aus der von
                der Hosting-Ebene vertrauenswürdig übergebenen Client-IP mit
                einem getrennten serverseitigen Geheimnis ein
                HMAC-SHA-256-Wert gebildet und als Rate-Limit-Schlüssel
                verarbeitet. Der Schlüssel gilt höchstens 24 Stunden;
                abgelaufene Zähler werden ignoriert und bei einem späteren
                Limiter-Aufruf bereinigt. Eine sekundengenaue Löschung nach
                Ablauf wird nicht zugesagt.
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
            {features.account ? (
              <p className="mt-2">
                Nach einer erfolgreich koordinierten Kontolöschung bleibt die
                technische Kontokennung als lokaler Löschmarker höchstens 30
                Tage gespeichert. Der Marker verhindert in dieser Zeit, dass
                ein pausierter Tab veraltete Lerndaten erneut synchronisiert,
                und veranlasst dort die Löschung der zugehörigen
                Browser-Lerndaten. Abgelaufene Marker werden in einem geöffneten
                Tab automatisch und sonst beim nächsten Plattformstart
                entfernt. Auch nach einer eindeutig gescheiterten und
                abgebrochenen Löschanfrage bleibt ein entsprechender
                Abbruchmarker höchstens 30 Tage bestehen, damit ein verspätetes
                Signal aus einem anderen Tab den neueren Zustand nicht
                überschreibt. Solange der Ausgang einer Löschanfrage technisch
                unklar ist, bleibt stattdessen ein Sicherheitsmarker bis zur
                Klärung oder bis zur manuellen Löschung der Website-Daten
                bestehen; er hält die Fortschrittssynchronisierung angehalten.
                Zusätzlich speichert der Browser für Kontodaten eine nicht
                ablaufende, zufällige technische Generation und höchstens 128
                mit SHA-256 abgeleitete Löschkennungen. Rohe Kontokennungen
                werden dafür nicht dauerhaft gespeichert. Diese technischen
                Sperren verhindern, dass ein alter Tab nach einer Löschung oder
                Sicherheitsbereinigung ausgemusterte Daten wieder einliest oder
                schreibt. Bei Erreichen der Obergrenze ersetzt eine neue
                globale Generation die bisherigen einzelnen Löschkennungen;
                nur die Kennung des aktuellen Löschvorgangs bleibt für dessen
                wiederholbare Verarbeitung gespeichert.
              </p>
            ) : null}
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
                Fehlerdiagnose aktiv. Übertragen werden ausschließlich
                Fehlerereignisse mit Zeitpunkt, stabiler Fehlerklasse,
                technischen Dateinamen und Zeilennummern sowie validierten
                technischen Kennungen. Freie Fehlermeldungen, Anfrage-URLs,
                Header, Cookies, Anfrageinhalte, Nutzerkontext und
                Interaktionsverläufe werden vor dem Versand verworfen.
                sendDefaultPii ist deaktiviert. Performance-Tracing,
                Release-Health-Sitzungen, Client-Berichte, Breadcrumbs und
                Session-Replay sind deaktiviert. Auf den
                Zertifikats-Verifizierungsseiten werden Fehlerereignisse
                vollständig verworfen.
                Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. DPA und
                tatsächliche Aufbewahrungsdauer sind vor der Aktivierung
                dokumentiert worden.
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
                  Anthropic-DPA-Annahme ist vor der Aktivierung datiert
                  dokumentiert worden. Nutzer dürfen keine personenbezogenen oder
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
                  Zur Vermeidung identischer Anbieteraufrufe hält jeder
                  laufende Serverprozess höchstens 500 Antworten für maximal
                  eine Stunde im Arbeitsspeicher. Gespeichert werden ein
                  SHA-256-Anfrageschlüssel und die Anbieterantwort, nicht die
                  Eingabe als separates Klartextfeld. Die Antwort kann
                  Bestandteile der Eingabe wiedergeben. Neustart oder
                  Verdrängung aus dem begrenzten Zwischenspeicher können die
                  Daten früher entfernen.
                </p>
                <p className="mt-2">
                  Zur Missbrauchsbegrenzung wird aus der von der Hosting-Ebene
                  vertrauenswürdig übergebenen Client-IP mit einem getrennten
                  serverseitigen Geheimnis ein HMAC-SHA-256-Wert gebildet und
                  als pseudonymisierter Rate-Limit-Schlüssel in Supabase
                  verarbeitet. Der Zähler gilt höchstens eine Stunde;
                  abgelaufene Einträge werden ignoriert und bei einem späteren
                  Limiter-Aufruf bereinigt. Eine sekundengenaue physische
                  Löschung nach Ablauf wird nicht zugesagt. Die Rohadresse wird
                  dabei nicht in der Rate-Limit-Tabelle gespeichert.
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
                  Zertifikatsstatus, XP, Abzeichen, Lernserien, absolvierte
                  Checkpoints und Aktivitätszeitpunkte.
                </p>
                <p className="mt-2">
                  Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO sowie für
                  Sicherheit und Missbrauchsschutz Art. 6 Abs. 1 lit. f DSGVO.
                  Die Supabase-DPA-Annahme und EU-Region sind vor der
                  Aktivierung dokumentiert worden. Marketing-Leads und Berichtsanfragen
                  werden nicht im Lernkonto gespeichert.
                </p>
                <p className="mt-2">
                  Vor dem Versand eines Magic-Links wird Cloudflare Turnstile
                  (Cloudflare, Inc., USA) als sichtbare, technisch erforderliche
                  Sicherheitsprüfung geladen. Turnstile verarbeitet
                  Verbindungsdaten sowie Signale aus Browser und Endgerät, um
                  automatisierte Anfragen von regulärer Nutzung zu
                  unterscheiden. Die Plattform übermittelt die eingegebene
                  E-Mail-Adresse nicht als Turnstile-Parameter. Das erzeugte,
                  kurzlebige Einmaltoken wird mit der Auth-Anfrage an Supabase
                  übergeben und dort gegen die in Supabase hinterlegte
                  Turnstile-Konfiguration geprüft. Die Funktion dient
                  ausschließlich dem Schutz des öffentlichen Login- und
                  E-Mail-Versandbudgets; Feedback-Erfassung im Turnstile-Widget
                  ist deaktiviert. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f
                  DSGVO. Der Zugriff auf Endgeräteinformationen wird nur
                  insoweit auf § 25 Abs. 2 Nr. 2 TDDDG gestützt, wie er für
                  diese ausdrücklich angeforderte, geschützte Anmeldung
                  unbedingt erforderlich ist. Hostnamenbeschränkung,
                  Anbieterbedingungen und{" "}
                  <a
                    href="https://www.cloudflare.com/turnstile-privacy-policy/"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    Turnstile Privacy Addendum
                  </a>{" "}
                  sind vor Aktivierung datiert dokumentiert worden.
                </p>
                <p className="mt-2">
                  Für Fortschrittssynchronisierung, Kurs-Reset, PDF-Download
                  und Kontolöschung verarbeitet Supabase außerdem
                  routenbezogene HMAC-SHA-256-Schlüssel. Sie werden mit einem
                  getrennten serverseitigen Geheimnis je nach Schutzstufe aus
                  der verifizierten Kontokennung oder der vertrauenswürdig
                  übergebenen Client-IP abgeleitet. Roh-IP und Kontokennung
                  werden dabei nicht in der Rate-Limit-Tabelle gespeichert. Die
                  Zähler wirken je nach Funktion höchstens eine Stunde oder bei
                  Kontolöschungen 24 Stunden. Abgelaufene Einträge werden beim
                  nächsten Limiter-Aufruf oder durch den täglichen
                  Bereinigungsjob entfernt; ohne weiteren Aufruf kann die
                  physische Entfernung bis zu acht Tage nach Ablauf dauern.
                </p>
              </>
            ) : (
              <p>
                Supabase, Magic-Link-Anmeldung, serverseitige
                Fortschrittssynchronisierung und Kontoverwaltung sind in dieser
                Bereitstellung deaktiviert. Fortschritt verbleibt ausschließlich
                im jeweiligen Browser. Bei einer späteren Aktivierung verlangt
                der Aktivierungsprozess eine vollständige Konfiguration, eine
                bestätigte EU-Region, ein datiertes Supabase-DPA sowie eine
                aktivierte und rechtlich geprüfte
                Turnstile-Missbrauchsbegrenzung.
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
                <>
                  <li>
                    Lernkonto, Kursfortschritt und historische
                    Bewertungsversuche: bis zur Kontolöschung oder einer
                    berechtigten Löschanfrage.
                  </li>
                  <li>
                    Konto-Rate-Limits: Wirksamkeit höchstens eine Stunde,
                    bei Kontolöschungen 24 Stunden; physische Bereinigung
                    spätestens bis zu acht Tage nach Ablauf.
                  </li>
                  <li>
                    Lokale Abschlussmarker für erfolgreich bestätigte oder
                    eindeutig gescheiterte und abgebrochene
                    Kontolöschanfragen: höchstens 30 Tage; Entfernung beim
                    Ablauf im geöffneten Tab oder beim nächsten
                    Plattformstart. Marker für einen technisch ungeklärten
                    Löschvorgang: bis zur Klärung oder manuellen Löschung der
                    Website-Daten. Eine zufällige technische
                    Kontodaten-Generation und höchstens 128 mit SHA-256 aus der
                    technischen Kontokennung abgeleitete Löschkennungen: ohne
                    feste Ablauffrist als dauerhafte Sperre gegen alte
                    Browser-Tabs. Rohe Kontokennungen werden in diesen
                    dauerhaften Sperren nicht gespeichert; bei Erreichen der
                    Obergrenze ersetzt eine globale Generation die bisherigen
                    einzelnen Löschkennungen. Nur die Kennung des aktuellen
                    Löschvorgangs bleibt für dessen wiederholbare Verarbeitung
                    gespeichert.
                  </li>
                </>
              ) : null}
              {features.anthropic ? (
                <li>
                  KI-Antwort-Zwischenspeicher: höchstens eine Stunde im
                  Arbeitsspeicher eines Serverprozesses, maximal 500 Einträge
                  je Funktion.
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
                  entsprechend der konfigurierten Aufbewahrungsdauer.
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
