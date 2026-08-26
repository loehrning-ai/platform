import type { Metadata } from "next";
import { EnglishPrivacyContent } from "./privacy-content-en";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { getRuntimeFeatures } from "@/lib/runtime-features";
import { formatServiceAddress, LEGAL_IDENTITY } from "@/lib/legal-identity";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

const PRIVACY_METADATA = {
  de: {
    title: "Datenschutz",
    description: "Datenschutzerklärung von loehrning.ai | Tim Löhr",
  },
  en: {
    title: "Privacy",
    description: "Privacy policy for loehrning.ai | Tim Löhr",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = PRIVACY_METADATA[locale];
  const localizedPath = localizeHref("/datenschutz", locale);
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
        "/datenschutz",
        contentLocalesForPath("/datenschutz"),
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

export default async function DatenschutzPage() {
  const locale = await getRequestLocale();
  const features = getRuntimeFeatures();
  return locale === "en" ? (
    <EnglishPrivacyContent features={features} />
  ) : (
    <GermanPrivacyContent />
  );
}

function GermanPrivacyContent() {
  const features = getRuntimeFeatures();
  const address = LEGAL_IDENTITY.serviceAddress;
  const formattedAddress = formatServiceAddress(address);

  return (
    <section className="py-12" aria-labelledby="privacy-title">
      <div className="mx-auto max-w-3xl break-words px-6">
        <h1
          id="privacy-title"
          className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl"
        >
          Datenschutzerklärung
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Stand: 13. August 2026
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
                Bereitstellung). Die Vercel-DPA-Annahme ist vor der Aktivierung
                datiert dokumentiert worden. Etwaige Drittlandübermittlungen
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
                einem getrennten serverseitigen Geheimnis ein HMAC-SHA-256-Wert
                gebildet und als Rate-Limit-Schlüssel verarbeitet. Der Schlüssel
                gilt höchstens 24 Stunden; abgelaufene Zähler werden ignoriert
                und bei einem späteren Limiter-Aufruf bereinigt. Eine
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
            {features.account ? (
              <p className="mt-2">
                Nach einer erfolgreich koordinierten Kontolöschung bleibt die
                technische Kontokennung als lokaler Löschmarker höchstens 30
                Tage gespeichert. Der Marker verhindert in dieser Zeit, dass ein
                pausierter Tab veraltete Lerndaten erneut synchronisiert, und
                veranlasst dort die Löschung der zugehörigen Browser-Lerndaten.
                Abgelaufene Marker werden in einem geöffneten Tab automatisch
                und sonst beim nächsten Plattformstart entfernt. Auch nach einer
                eindeutig gescheiterten und abgebrochenen Löschanfrage bleibt
                ein entsprechender Abbruchmarker höchstens 30 Tage bestehen,
                damit ein verspätetes Signal aus einem anderen Tab den neueren
                Zustand nicht überschreibt. Solange der Ausgang einer
                Löschanfrage technisch unklar ist, bleibt stattdessen ein
                Sicherheitsmarker bis zur Klärung oder bis zur manuellen
                Löschung der Website-Daten bestehen; er hält die
                Fortschrittssynchronisierung angehalten. Zusätzlich speichert
                der Browser für Kontodaten eine nicht ablaufende, zufällige
                technische Generation und höchstens 128 mit SHA-256 abgeleitete
                Löschkennungen. Rohe Kontokennungen werden dafür nicht dauerhaft
                gespeichert. Diese technischen Sperren verhindern, dass ein
                alter Tab nach einer Löschung oder Sicherheitsbereinigung
                ausgemusterte Daten wieder einliest oder schreibt. Bei Erreichen
                der Obergrenze ersetzt eine neue globale Generation die
                bisherigen einzelnen Löschkennungen; nur die Kennung des
                aktuellen Löschvorgangs bleibt für dessen wiederholbare
                Verarbeitung gespeichert.
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
                vollständig verworfen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f
                DSGVO. DPA und tatsächliche Aufbewahrungsdauer sind vor der
                Aktivierung dokumentiert worden.
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
            title="7. KI-Lernfeedback und isolierte Kursausführung"
          >
            {features.anthropic || features.gemini ? (
              <>
                <p>
                  Bei ausdrücklich gestarteten interaktiven KI-Übungen werden
                  die eingegebenen Lerntexte abhängig vom angefragten und in
                  dieser Bereitstellung freigegebenen Modell an den aktiven
                  Anbieter übermittelt, um Lernfeedback zu erzeugen. Die
                  Modellwahl überträgt nur eine öffentliche Modellkennung.
                  API-Schlüssel bleiben auf dem Server. Pfade, E-Mail-Adressen
                  und Kontokennungen werden nicht als Promptbestandteil
                  hinzugefügt; Prompt und Antwort werden nicht protokolliert.
                </p>
                {features.anthropic ? (
                  <p className="mt-2">
                    Anthropic Claude (Anthropic PBC, USA) ist aktiv. Die für
                    diesen API-Verkehr konfigurierte Aufbewahrungsdauer beträgt{" "}
                    {features.anthropicRetentionDays} Tage. Die Aktivierung
                    verlangt einen datierten DPA-Prüfmarker; dieser technische
                    Marker ist für sich kein Nachweis rechtlicher Konformität.
                  </p>
                ) : null}
                {features.gemini ? (
                  <p className="mt-2">
                    Google Gemini API (Google LLC, USA) ist für das Modell
                    Gemini 2.5 Flash-Lite aktiv. Die konfigurierte
                    Aufbewahrungsdauer beträgt {features.geminiRetentionDays}{" "}
                    Tage. Die Laufzeit verlangt vor Aktivierung datierte DPA-
                    und Paid-Tier-Prüfmarker; sie verwendet
                    Gemini-Free-Tier-Verkehr nicht als freigegebenen
                    Lerntextpfad. Der Paid-Tier-Marker ist eine vom Betreiber
                    gesetzte Prüfbestätigung; die Anwendung liest oder beweist
                    den Google-Abrechnungsstatus nicht. Diese technischen Marker
                    sind für sich kein Nachweis rechtlicher Konformität.
                  </p>
                ) : null}
                <p className="mt-2">
                  Nutzer dürfen keine personenbezogenen, vertraulichen oder
                  anderweitig nicht freigegebenen Echtdaten in Übungsfelder
                  eingeben. Ein nicht freigegebenes Modell, fehlende
                  Laufzeitbereitschaft oder ein ausgeschöpftes Tokenkontingent
                  beendet den Aufruf ohne erfundene Anbieterantwort.
                </p>
                <p className="mt-2">
                  Zur Vermeidung identischer Anbieteraufrufe hält jede einzelne
                  Funktions- oder Laufzeitinstanz höchstens 500 Antworten für
                  maximal eine Stunde im Arbeitsspeicher. Der Zwischenspeicher
                  wird nicht zwischen allen Instanzen geteilt. Gespeichert
                  werden ein SHA-256-Anfrageschlüssel und die Anbieterantwort,
                  nicht die Eingabe als separates Klartextfeld. Die Antwort kann
                  Bestandteile der Eingabe wiedergeben. Neustart oder
                  Verdrängung aus dem begrenzten Zwischenspeicher können die
                  Daten früher entfernen.
                </p>
                <p className="mt-2">
                  Für stündliche Missbrauchsgrenzen werden die authentifizierte
                  Kontokennung und die von Vercel vertrauenswürdig übergebene
                  Client-IP jeweils mit einem getrennten serverseitigen
                  Geheimnis in HMAC-SHA-256-Schlüssel umgewandelt. Für
                  Anbieteraufrufe werden zusätzlich tägliche, vor dem Aufruf
                  reservierte Tokenkontingente je pseudonymisiertem Konto
                  beziehungsweise bei offen zugänglicher KI-Bewertung je
                  pseudonymisierter IP sowie für die gesamte Bereitstellung
                  geführt. Supabase speichert Zähler und Ablaufzeiten, keine
                  Rohadresse und keinen Lerntext. Abgelaufene Zähler werden
                  ignoriert und bei einem späteren Limiter-Aufruf bereinigt;
                  eine sekundengenaue physische Löschung wird nicht zugesagt.
                </p>
              </>
            ) : (
              <p>
                Anthropic Claude und Google Gemini API sind in dieser
                Bereitstellung für KI-Lernfeedback deaktiviert. Übungen
                verwenden lokales oder regelbasiertes Feedback und übertragen
                keine Eingaben an diese Modellanbieter.
              </p>
            )}
            {features.courseTerminal ? (
              <p className="mt-2">
                Die Kursprojekte für Codex, Data Science, Data Engineering und
                Data Infrastructure können auf ausdrücklichen Start jeweils eine
                feste Folge erlaubter Befehlskennungen an Vercel Sandbox
                übertragen. Browserseitige Analysepläne werden nur strukturell
                geprüft; sie sind kein ausführbares SQL und werden nicht an die
                Sandbox gesendet. Jede Ausführung startet einen neuen, nicht
                persistenten Node-24-Arbeitsbereich mit ausschließlich vom
                Server erzeugten synthetischen Dateien, gesperrtem Netzwerk,
                höchstens 60 Sekunden Lebensdauer und 10 Sekunden Zeitlimit pro
                Befehl. Freie Shell-Eingaben, Lernenden-Repositories,
                Zugangsdaten und externe Installationen werden nicht angenommen.
                stdout, stderr, Exit-Codes und Git-Diff werden als private,
                nicht cachebare Antwort angezeigt und nicht im Lernfortschritt
                gespeichert. Datenkursläufe liefern zusätzlich feste
                synthetische Kennzahlenbelege. Der Server protokolliert bei
                Erfolg nur Route, Status, Befehlsanzahl und Laufzeit;
                Fehlerprotokolle verwenden ausschließlich begrenzte technische
                Schritt- und Fehlerklassen. Workspace-Inhalte und
                Ergebnisprotokolle werden nicht geloggt. Die Sandbox wird
                abschließend gestoppt; die nicht persistente Ausführung ist
                keine Zusage über eine sekundengenaue physische Löschung in
                Anbieter-Infrastruktur. Konto-, IP- und globale Laufkontingente
                zählen angenommene Ausführungen und werden über dieselben
                pseudonymisierten Supabase-Zähler begrenzt. Sie messen keine
                Kosten oder Ausgaben.
              </p>
            ) : (
              <p className="mt-2">
                Die echte isolierte Kursausführung über Vercel Sandbox ist in
                dieser Bereitstellung deaktiviert. Das Codex-Repository-Labor
                weist die getrennte Browser-Simulation ausdrücklich als
                Simulation aus. Die drei Datenlabore geben ohne echten Lauf
                keine simulierten Kennzahlen als Ausführung aus.
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
                  Aktivierung dokumentiert worden. Marketing-Leads und
                  Berichtsanfragen werden nicht im Lernkonto gespeichert.
                </p>
                {features.magicLink ? (
                  <p className="mt-2">
                    Vor dem Versand eines Magic-Links wird Cloudflare Turnstile
                    (Cloudflare, Inc., USA) als sichtbare, technisch
                    erforderliche Sicherheitsprüfung geladen. Turnstile
                    verarbeitet Verbindungsdaten sowie Signale aus Browser und
                    Endgerät, um automatisierte Anfragen von regulärer Nutzung
                    zu unterscheiden. Die Plattform übermittelt die eingegebene
                    E-Mail-Adresse nicht als Turnstile-Parameter. Das erzeugte,
                    kurzlebige Einmaltoken wird mit der OTP-Anfrage an Supabase
                    übergeben und dort gegen die in Supabase hinterlegte
                    Turnstile-Konfiguration geprüft. Die Funktion dient
                    ausschließlich dem Schutz des öffentlichen Login- und
                    E-Mail-Versandbudgets; Feedback-Erfassung im
                    Turnstile-Widget ist deaktiviert. Rechtsgrundlage ist Art. 6
                    Abs. 1 lit. f DSGVO. Der Zugriff auf Endgeräteinformationen
                    wird nur insoweit auf § 25 Abs. 2 Nr. 2 TDDDG gestützt, wie
                    er für diese ausdrücklich angeforderte, geschützte Anmeldung
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
                ) : null}
                {features.google ? (
                  <p className="mt-2">
                    Bei der Anmeldung mit Google leitet Supabase den Browser zu
                    Google und anschließend an den freigegebenen Rücksprungpfad
                    dieser Plattform weiter. Dabei verarbeiten Google und
                    Supabase die für die Anmeldung erforderlichen Verbindungs-,
                    Konto- und Profildaten einschließlich der E-Mail-Adresse.
                    Die Plattform fordert keine zusätzlichen
                    Google-Berechtigungen an und erhält insbesondere keinen
                    Zugriff auf Google Drive, Kalender oder andere
                    Google-Inhalte. Cloudflare Turnstile wird für diese
                    Google-Anmeldung weder geladen noch als Parameter
                    übermittelt. Die Provider- und Rücksprungkonfiguration ist
                    vor Aktivierung datiert verifiziert worden.
                  </p>
                ) : null}
                {!features.magicLink && !features.google ? (
                  <p className="mt-2">
                    Das Lernkonto-Backend ist aktiv, aber für neue Anmeldungen
                    ist derzeit weder Magic-Link noch Google als vollständig
                    verifizierte Anmeldemethode freigegeben.
                  </p>
                ) : null}
                <p className="mt-2">
                  Für Fortschrittssynchronisierung, Kurs-Reset, PDF-Download und
                  Kontolöschung verarbeitet Supabase außerdem routenbezogene
                  HMAC-SHA-256-Schlüssel. Sie werden mit einem getrennten
                  serverseitigen Geheimnis je nach Schutzstufe aus der
                  verifizierten Kontokennung oder der vertrauenswürdig
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
                Supabase-Lernkonto, Magic-Link- und Google-Anmeldung,
                serverseitige Fortschrittssynchronisierung und Kontoverwaltung
                sind in dieser Bereitstellung deaktiviert. Fortschritt verbleibt
                ausschließlich im jeweiligen Browser. Bei einer späteren
                Aktivierung verlangt das Lernkonto eine vollständige
                Serverkonfiguration, eine bestätigte EU-Region und ein datiertes
                Supabase-DPA. Jede Anmeldemethode bleibt zusätzlich deaktiviert,
                bis ihre eigene technische und rechtliche Konfiguration
                verifiziert ist.
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
                    Konto-Rate-Limits: Wirksamkeit höchstens eine Stunde, bei
                    Kontolöschungen 24 Stunden; physische Bereinigung spätestens
                    bis zu acht Tage nach Ablauf.
                  </li>
                  <li>
                    Lokale Abschlussmarker für erfolgreich bestätigte oder
                    eindeutig gescheiterte und abgebrochene Kontolöschanfragen:
                    höchstens 30 Tage; Entfernung beim Ablauf im geöffneten Tab
                    oder beim nächsten Plattformstart. Marker für einen
                    technisch ungeklärten Löschvorgang: bis zur Klärung oder
                    manuellen Löschung der Website-Daten. Eine zufällige
                    technische Kontodaten-Generation und höchstens 128 mit
                    SHA-256 aus der technischen Kontokennung abgeleitete
                    Löschkennungen: ohne feste Ablauffrist als dauerhafte Sperre
                    gegen alte Browser-Tabs. Rohe Kontokennungen werden in
                    diesen dauerhaften Sperren nicht gespeichert; bei Erreichen
                    der Obergrenze ersetzt eine globale Generation die
                    bisherigen einzelnen Löschkennungen. Nur die Kennung des
                    aktuellen Löschvorgangs bleibt für dessen wiederholbare
                    Verarbeitung gespeichert.
                  </li>
                </>
              ) : null}
              {features.anthropic ? (
                <li>
                  KI-Antwort-Zwischenspeicher: höchstens eine Stunde im
                  Arbeitsspeicher eines Serverprozesses, maximal 500 Einträge je
                  Funktion.
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
