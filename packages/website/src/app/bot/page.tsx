import type { Metadata } from "next";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { LEGAL_IDENTITY } from "@/lib/legal-identity";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

const BOT_USER_AGENT = "loehrningBot/1.0 (+https://loehrning.ai/bot)";

interface BotSection {
  readonly id: string;
  readonly heading: string;
  readonly paragraphs: readonly string[];
}

interface BotCopy {
  readonly title: string;
  readonly description: string;
  readonly lead: string;
  readonly userAgentLabel: string;
  readonly sections: readonly BotSection[];
  readonly optOutHeading: string;
  readonly optOutRobots: string;
  readonly optOutMail: (email: string) => string;
  readonly legalHeading: string;
  readonly legalText: string;
}

const BOT_COPY: Readonly<Record<Locale, BotCopy>> = {
  de: {
    title: "loehrningBot",
    description:
      "Wer hinter dem loehrningBot steckt, was er abruft, was er speichert und wie du ihn mit zwei Zeilen aussperrst.",
    lead: "Auf deiner Website war ein Besuch von loehrningBot? Hier steht in einfachen Worten, wer dahintersteckt, was er tut und wie du ihn stoppst.",
    userAgentLabel: "So meldet sich der Bot",
    sections: [
      {
        id: "wer",
        heading: "Wer ihn betreibt",
        paragraphs: [
          "loehrningBot läuft bei loehrning.ai und wird von Tim Löhr betrieben.",
        ],
      },
      {
        id: "warum",
        heading: "Wofür das gut ist",
        paragraphs: [
          "Ich forsche daran, wie deutsche Unternehmen auf ihren Websites über KI sprechen. Veröffentlicht werden nur anonymisierte Summen. Gruppen mit weniger als 5 Einträgen zeige ich nie, und es gibt weder Namen noch Ranglisten.",
        ],
      },
      {
        id: "abruf",
        heading: "Was er abruft",
        paragraphs: [
          "Zuerst deine robots.txt, dann die Startseite und höchstens eine Seite wie „Über uns“, „Karriere“ oder „Impressum“. Jede Seite wird einmal geladen.",
        ],
      },
      {
        id: "speicher",
        heading: "Was er speichert",
        paragraphs: [
          "Nur Ja-Nein-Merkmale, zum Beispiel ob eine Seite ein bestimmtes Thema erwähnt. Texte, Namen, E-Mail-Adressen und Telefonnummern werden nicht gespeichert.",
        ],
      },
      {
        id: "verhalten",
        heading: "Wie er sich verhält",
        paragraphs: [
          "Er hält sich an deine robots.txt und an das Signal tdm-reservation. Pro Server schickt er höchstens eine Anfrage pro Sekunde. Er meldet sich nirgends an und umgeht kein CAPTCHA.",
        ],
      },
    ],
    optOutHeading: "So sperrst du ihn aus",
    optOutRobots: "Trage das in deine robots.txt ein:",
    optOutMail: (email) =>
      `Oder schreib an ${email}. Dann nehme ich deine Domain aus der Untersuchung und lösche, was dazu gespeichert ist.`,
    legalHeading: "Rechtsgrundlage",
    legalText:
      "Berechtigtes Interesse an Forschung, dazu Text- und Data-Mining nach § 44b UrhG unter Beachtung von Nutzungsvorbehalten. Das ist keine Rechtsberatung.",
  },
  en: {
    title: "loehrningBot",
    description:
      "Who runs loehrningBot, what it fetches, what it stores and how to block it with two lines.",
    lead: "Did loehrningBot visit your website? This page explains in plain words who runs it, what it does and how to stop it.",
    userAgentLabel: "How the bot identifies itself",
    sections: [
      {
        id: "who",
        heading: "Who runs it",
        paragraphs: [
          "loehrningBot is run by loehrning.ai, operated by Tim Löhr.",
        ],
      },
      {
        id: "why",
        heading: "Why it exists",
        paragraphs: [
          "I research how German companies talk about AI on their websites. Only anonymised totals are published. Groups with fewer than 5 entries are never shown, and there are no names and no rankings.",
        ],
      },
      {
        id: "fetch",
        heading: "What it fetches",
        paragraphs: [
          "First your robots.txt, then your homepage and at most one page such as “About”, “Careers” or “Imprint”. Each page is loaded once.",
        ],
      },
      {
        id: "store",
        heading: "What it stores",
        paragraphs: [
          "Only yes-or-no flags, for example whether a page mentions a certain topic. It does not store text, names, email addresses or phone numbers.",
        ],
      },
      {
        id: "behaviour",
        heading: "How it behaves",
        paragraphs: [
          "It obeys your robots.txt and the tdm-reservation signal. It sends at most one request per second to any host. It never logs in and does not bypass CAPTCHAs.",
        ],
      },
    ],
    optOutHeading: "How to block it",
    optOutRobots: "Add this to your robots.txt:",
    optOutMail: (email) =>
      `Or write to ${email}. I will remove your domain from the study and delete whatever was stored about it.`,
    legalHeading: "Legal basis",
    legalText:
      "Legitimate interest in research, plus text and data mining under § 44b UrhG, respecting opt-outs. This is not legal advice.",
  },
};

const ROBOTS_SNIPPET = "User-agent: loehrningBot\nDisallow: /";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = BOT_COPY[locale];
  const localizedPath = localizeHref("/bot", locale);
  const metadata = createPublicPageMetadata({
    title: copy.title,
    description: copy.description,
    path: localizedPath,
    locale,
  });

  return {
    ...metadata,
    alternates: {
      ...buildLocaleAlternates("/bot", contentLocalesForPath("/bot")),
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

export default async function BotPage() {
  return <BotContent locale={await getRequestLocale()} />;
}

function BotContent({ locale }: { readonly locale: Locale }) {
  const copy = BOT_COPY[locale];

  return (
    <section className="py-12" aria-labelledby="bot-title">
      <div className="mx-auto max-w-3xl break-words px-6">
        <h1
          id="bot-title"
          className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl"
        >
          {copy.title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {copy.lead}
        </p>

        <div className="mt-8" data-testid="bot-user-agent">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {copy.userAgentLabel}
          </h2>
          <code className="block overflow-x-auto rounded-xl border border-border bg-paper/70 px-4 py-3 text-sm text-foreground">
            {BOT_USER_AGENT}
          </code>
        </div>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          {copy.sections.map((section) => (
            <div key={section.id} data-testid={`bot-${section.id}`}>
              <h2 className="mb-2 text-lg font-semibold text-foreground">
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ))}

          <div data-testid="bot-opt-out">
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              {copy.optOutHeading}
            </h2>
            <p>{copy.optOutRobots}</p>
            <pre className="mt-2 overflow-x-auto rounded-xl border border-border bg-paper/70 px-4 py-3 text-sm text-foreground">
              <code>{ROBOTS_SNIPPET}</code>
            </pre>
            <p className="mt-3">{copy.optOutMail(LEGAL_IDENTITY.email)}</p>
          </div>

          <div data-testid="bot-legal">
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              {copy.legalHeading}
            </h2>
            <p>{copy.legalText}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
