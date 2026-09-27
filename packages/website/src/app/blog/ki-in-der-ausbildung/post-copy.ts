/**
 * Every visible string of blog post Nº 02, per locale. Source: SPEC
 * Appendices C and D after the claims ledger of 27 September 2026.
 *
 * Markup and tokens are rendered by ./_sections/rich.tsx:
 * [text](target) links, **bold** lead-ins, {date:claimId} and
 * {range:startId:endId} registry dates, {stand} the sheet's review date,
 * {de:Wort} a German term inside English copy (rendered with lang="de").
 * Statute links go to the first mention of each section in the prose.
 *
 * Named *-copy.ts so the voice rules in scripts/content-lint.mjs read it.
 */

import type { Locale } from "@/lib/i18n/locale";

export const POST_SLUG = "ki-in-der-ausbildung";
export const POST_PATH = "/blog/ki-in-der-ausbildung";
export const SHEET_SLUG = "ki-in-der-ausbildung-fragen";

export const JAV_ELECTION_START = "de-betrvg-64-jav-election-start-2026-10-01";
export const JAV_ELECTION_END = "de-betrvg-64-jav-election-end-2026-11-30";

export const SECTION_IDS = [
  "hero",
  "warum-jetzt",
  "rechte",
  "fragen",
  "berichtsheft",
  "grenzen",
  "weiterlernen",
  "quellen",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export interface RouteStation {
  /** One claim for a date, two for a window (start, end). */
  readonly claims: readonly [string] | readonly [string, string];
  readonly what: string;
}

export interface ListItem {
  readonly text: string;
  readonly ref?: string;
}

/** Language of a linked page, where it has only one. EUR-Lex has all. */
export type PageLanguage = "de" | "en";

export interface SourceRow {
  readonly title: string;
  readonly covers: string;
  readonly type: string;
  readonly href: string;
  readonly language?: PageLanguage;
}

export interface ExternalRow {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly language?: PageLanguage;
}

export interface PostCopy {
  readonly title: string;
  readonly description: string;
  readonly openGraphDescription: string;
  readonly breadcrumbHome: string;
  readonly breadcrumbTitle: string;
  readonly articleSection: string;
  readonly screenLabel: string;
  readonly railKicker: string;
  readonly rail: Readonly<Record<SectionId, string>>;
  readonly headings: Readonly<Record<Exclude<SectionId, "hero">, string>>;
  readonly keywords: readonly string[];
  /** Shown on a row whose linked page is in the other language. */
  readonly otherLanguage: Readonly<Partial<Record<PageLanguage, string>>>;
  readonly metaArticle: string;
  readonly metaReading: string;
  readonly lede: string;
  readonly intro: string;
  readonly facts: readonly {
    readonly label: string;
    readonly value: string;
  }[];
  readonly warumJetzt: {
    readonly paragraphs: readonly string[];
    readonly routeLabel: string;
    readonly states: Readonly<Record<"past" | "current" | "future", string>>;
    readonly stations: readonly RouteStation[];
    readonly legend: string;
  };
  readonly rechte: {
    readonly intro: string;
    readonly canTitle: string;
    readonly can: readonly ListItem[];
    readonly cannotTitle: string;
    readonly cannot: readonly ListItem[];
    readonly tableCaption: string;
    readonly columns: readonly [string, string, string];
    readonly rows: readonly (readonly [string, string, string])[];
    readonly note: string;
  };
  readonly fragen: {
    readonly intro: string;
    readonly print: string;
    readonly download: string;
    readonly printNote: string;
    readonly exerciseLabel: string;
    readonly exercise: string;
  };
  readonly berichtsheft: readonly string[];
  readonly grenzen: readonly string[];
  readonly weiterlernen: {
    readonly intro: string;
    readonly courses: readonly {
      readonly slug: "ki-und-gesellschaft" | "eu-ai-act-kurs" | "ki-fuehrerschein";
      readonly description: string;
    }[];
    readonly externalHeading: string;
    readonly external: readonly ExternalRow[];
  };
  readonly quellen: {
    readonly statusLabel: string;
    readonly rows: readonly SourceRow[];
  };
}

const IHK_DARMSTADT =
  "https://www.ihk.de/darmstadt/produktmarken/pruefungen/richtlinie-ki-6993696";
const HK_BREMEN =
  "https://www.ihk.de/bremen-bremerhaven/bilden-qualifizieren/berufliche-ausbildung/terminuebersichten-abschlusspruefungen/kuenstliche-intelligenz-ki-hinweise-zur-verwendung-7114046";
const BIBB = "https://www.bibb.de/de/207534.php";
const IMU =
  "https://www.imu-boeckler.de/de/betriebsvereinbarungen-15454-ki-algorithmische-systeme-44730.htm";
const BITKOM =
  "https://www.bitkom.org/sites/main/files/2026-02/bitkom-leitfaden-kuenstliche-intelligenz-und-mitbestimmung.pdf";
const SOURCES = {
  betrvg: "https://www.gesetze-im-internet.de/betrvg/",
  bbig: "https://www.gesetze-im-internet.de/bbig_2005/",
  jarbschg: "https://www.gesetze-im-internet.de/jarbschg/",
  gdpr: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
  aiAct: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
  omnibus: "https://eur-lex.europa.eu/eli/reg/2026/1744/oj",
  literacyFaq:
    "https://digital-strategy.ec.europa.eu/en/faqs/ai-literacy-questions-answers",
  prohibitedGuidelines:
    "https://digital-strategy.ec.europa.eu/en/library/commission-publishes-guidelines-prohibited-artificial-intelligence-ai-practices-defined-ai-act",
  edpbConsent:
    "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en",
} as const;

const STATIONS_DE: readonly RouteStation[] = [
  {
    claims: ["ai-act-article-5-prohibited-2025-02-02"],
    what: "Verbot der Emotionserkennung und Pflicht zu Maßnahmen für KI-Kompetenz ([Art. 5 und Art. 4 KI-VO](eli:2024/1689))",
  },
  {
    claims: ["ai-omnibus-entry-into-force-2026-07-27"],
    what: "Art. 4 KI-VO in neuer Fassung ([Verordnung (EU) 2026/1744](eli:2026/1744))",
  },
  {
    claims: [JAV_ELECTION_START, JAV_ELECTION_END],
    what: "JAV-Wahl in Betrieben mit Betriebsrat (§ 64 BetrVG)",
  },
  {
    claims: ["ai-act-high-risk-areas-adopted-2027-12-02"],
    what: "Hochrisiko-Pflichten für KI in Bildung und Beschäftigung ([Anhang III KI-VO](eli:2024/1689))",
  },
];

const STATIONS_EN: readonly RouteStation[] = [
  {
    claims: ["ai-act-article-5-prohibited-2025-02-02"],
    what: "Prohibition of emotion recognition and the duty to take AI literacy measures ([Article 5 and Article 4 AI Act](eli:2024/1689))",
  },
  {
    claims: ["ai-omnibus-entry-into-force-2026-07-27"],
    what: "New wording of Article 4 AI Act ([Regulation (EU) 2026/1744](eli:2026/1744))",
  },
  {
    claims: [JAV_ELECTION_START, JAV_ELECTION_END],
    what: "JAV elections in establishments with a works council (Section 64 BetrVG)",
  },
  {
    claims: ["ai-act-high-risk-areas-adopted-2027-12-02"],
    what: "High-risk obligations for AI in education and employment ([Annex III AI Act](eli:2024/1689))",
  },
];

export const POST_COPY: Readonly<Record<Locale, PostCopy>> = {
  de: {
    title: "KI in der Ausbildung: Fragen für JAV und Betriebsrat",
    description:
      "Welche Rechte JAV und Betriebsrat haben, wenn KI in die Ausbildung kommt, was für Berichtsheft und Prüfung gilt, und eine Fragenliste zum Drucken.",
    openGraphDescription:
      "Fragenliste für JAV und Betriebsrat mit Rechtsgrundlagen aus BetrVG, BBiG, JArbSchG, DSGVO und KI-Verordnung. Frei nutzbar unter CC BY 4.0.",
    breadcrumbHome: "Start",
    breadcrumbTitle: "KI in der Ausbildung",
    articleSection: "KI in der Ausbildung",
    screenLabel: "KI in der Ausbildung Artikel",
    railKicker: "§ Lesepunkte",
    rail: {
      hero: "Einstieg",
      "warum-jetzt": "Warum jetzt",
      rechte: "Rechte",
      fragen: "Die Fragen",
      berichtsheft: "Berichtsheft",
      grenzen: "Grenzen",
      weiterlernen: "Weiterlernen",
      quellen: "Quellen",
    },
    headings: {
      "warum-jetzt": "Die JAV-Wahl fällt in die Zeit, in der Betriebe KI einführen",
      rechte: "Was die JAV kann und welche Rechte der Betriebsrat hat",
      fragen: "Fragen, bevor das Werkzeug startet",
      berichtsheft: "Berichtsheft und Prüfung: was das Gesetz sagt",
      grenzen: "Was diese Liste nicht beweist",
      weiterlernen: "Weiterlernen",
      quellen: "Quellen",
    },
    keywords: [
      "JAV",
      "Jugend- und Auszubildendenvertretung",
      "KI in der Ausbildung",
      "Betriebsrat",
      "Berichtsheft KI",
      "BetrVG",
      "KI-Verordnung",
    ],
    otherLanguage: { en: "auf Englisch" },
    metaArticle: "Artikel",
    metaReading: "Min. Lesezeit",
    lede: "Wenn dein Betrieb einen KI-Tutor, eine Lernplattform oder einen Schreibassistenten für Azubis einführt, fallen die wichtigen Entscheidungen vor dem ersten Login. Es geht darum, welche Daten anfallen, wer Ergebnisse sieht und was im Berichtsheft erlaubt ist. Hier stehen die Rechte von JAV und Betriebsrat, die Regeln für Berichtsheft und Prüfung und eine Fragenliste zum Ausdrucken.",
    intro:
      "Nach dem Lesen kannst du die Fragen stellen, die bei einem KI-Werkzeug in der Ausbildung auf den Tisch gehören, und weißt, wer welches Recht hat.",
    facts: [
      {
        label: "Für",
        value:
          "Azubis, JAV-Mitglieder, Ausbildungspersonal und Betriebsräte. Kein Vorwissen nötig.",
      },
      { label: "Stand", value: "{stand}. Keine Rechtsberatung." },
      {
        label: "Fragenliste",
        value:
          "Frei nutzbar unter CC BY 4.0, [zum Drucken und Herunterladen](#fragen).",
      },
    ],
    warumJetzt: {
      paragraphs: [
        "Vom {range:de-betrvg-64-jav-election-start-2026-10-01:de-betrvg-64-jav-election-end-2026-11-30} laufen die regelmäßigen Wahlen der Jugend- und Auszubildendenvertretung, kurz JAV ([§ 64 Abs. 1 BetrVG](betrvg:64)). Gewählt wird in Betrieben, in denen in der Regel mindestens fünf Beschäftigte jünger als 18 sind oder eine Ausbildung machen ([§ 60 Abs. 1 BetrVG](betrvg:60)). Nach überwiegender Auffassung braucht es dafür außerdem einen Betriebsrat. Wählen dürfen alle Jugendlichen unter 18 und alle Azubis, unabhängig vom Alter ([§ 61 Abs. 1 BetrVG](betrvg:61)).",
        "Zur selben Zeit kommt KI in die Ausbildung, als Tutor, als Lernplattform oder als Hilfe beim Berichtsheft. Seit 2021 nennt das Betriebsverfassungsgesetz Künstliche Intelligenz an drei Stellen ausdrücklich ([§ 80 Abs. 3](betrvg:80), [§ 90 Abs. 1 Nr. 3](betrvg:90) und [§ 95 Abs. 2a BetrVG](betrvg:95)). Die KI-Verordnung der EU verbietet seit {date:ai-act-article-5-prohibited-2025-02-02} Emotionserkennung am Arbeitsplatz und in Bildungseinrichtungen. Für KI, die Lernergebnisse bewertet oder Personal auswählt, gelten ab {date:ai-act-high-risk-areas-adopted-2027-12-02} Hochrisiko-Pflichten.",
        "Im öffentlichen Dienst gelten andere Gesetze und andere Wahltermine.",
      ],
      routeLabel: "Termine",
      states: { past: "gilt schon", current: "läuft gerade", future: "kommt noch" },
      stations: STATIONS_DE,
      legend:
        "Stationen mit Stand {stand}. Gefüllt heißt, die Regel gilt schon. Markiert heißt, sie läuft gerade. Umrandet heißt, sie kommt noch.",
    },
    rechte: {
      intro:
        "Die JAV vertritt Jugendliche unter 18 und Azubis im Betrieb (§ 60 Abs. 2 BetrVG). Gegenüber dem Arbeitgeber hat sie keine eigenen Mitbestimmungsrechte und wirkt über den Betriebsrat. Dafür gibt ihr das Gesetz einen festen Platz in dessen Arbeit.",
      canTitle: "Die JAV kann",
      can: [
        {
          text: "beim Betriebsrat Maßnahmen beantragen, vor allem in Fragen der Berufsbildung und der Übernahme",
          ref: "[§ 70 Abs. 1 Nr. 1 BetrVG](betrvg:70)",
        },
        {
          text: "darüber wachen, dass Gesetze, Tarifverträge und Betriebsvereinbarungen zugunsten der Azubis eingehalten werden",
          ref: "§ 70 Abs. 1 Nr. 2 BetrVG",
        },
        {
          text: "Anregungen von Azubis entgegennehmen und beim Betriebsrat auf eine Erledigung hinwirken",
          ref: "§ 70 Abs. 1 Nr. 3 BetrVG",
        },
        {
          text: "mit allen Mitgliedern an Betriebsratssitzungen teilnehmen, wenn ein Punkt besonders Azubis betrifft, und mitstimmen, wenn ein Beschluss überwiegend Azubis betrifft",
          ref: "[§ 67 Abs. 1 und 2 BetrVG](betrvg:67)",
        },
        {
          text: "an Besprechungen zwischen Arbeitgeber und Betriebsrat teilnehmen, wenn es besonders um Azubis geht",
          ref: "[§ 68 BetrVG](betrvg:68)",
        },
        {
          text: "im Einvernehmen mit dem Betriebsrat eine Jugend- und Auszubildendenversammlung einberufen",
          ref: "[§ 71 BetrVG](betrvg:71)",
        },
      ],
      cannotTitle: "Die JAV kann nicht",
      cannot: [
        {
          text: "selbst mitbestimmen oder mit dem Arbeitgeber eine Betriebsvereinbarung abschließen, das macht der Betriebsrat",
        },
        {
          text: "selbst eine sachverständige Person nach § 80 Abs. 3 BetrVG hinzuziehen, dieses Recht hat der Betriebsrat",
        },
        {
          text: "verlangen, dass der Arbeitgeber Unterlagen direkt an sie gibt, denn Informationen bekommt sie über den Betriebsrat",
          ref: "§ 70 Abs. 2 BetrVG",
        },
      ],
      tableCaption: "Rechte des Betriebsrats bei KI",
      columns: ["Recht", "Art des Rechts", "Paragraf"],
      rows: [
        [
          "Information und Beratung bei der Planung von Arbeitsverfahren, einschließlich KI",
          "Information und Beratung",
          "§ 90 Abs. 1 Nr. 3 und Abs. 2 BetrVG",
        ],
        [
          "Sachverständige Person, wenn der Betriebsrat KI beurteilen muss",
          "Gilt als erforderlich, Einzelheiten nach Vereinbarung",
          "§ 80 Abs. 3 BetrVG",
        ],
        [
          "Einführung und Anwendung von Systemen, die Leistung oder Verhalten überwachen können",
          "Mitbestimmung",
          "[§ 87 Abs. 1 Nr. 6 BetrVG](betrvg:87)",
        ],
        [
          "Allgemeine Beurteilungsgrundsätze",
          "Zustimmung",
          "[§ 94 Abs. 2 BetrVG](betrvg:94)",
        ],
        [
          "Auswahlrichtlinien, auch wenn KI sie mit aufstellt",
          "Zustimmung, in Betrieben mit mehr als 500 Beschäftigten auch Initiativrecht",
          "§ 95 Abs. 1, 2 und 2a BetrVG",
        ],
        [
          "Qualifizierung, wenn Kenntnisse nach einer Änderung nicht mehr reichen",
          "Mitbestimmung",
          "[§ 97 Abs. 2 BetrVG](betrvg:97)",
        ],
        [
          "Durchführung der betrieblichen Berufsbildung, auch der Ausbildung",
          "Mitbestimmung",
          "[§ 98 Abs. 1 BetrVG](betrvg:98)",
        ],
      ],
      note: "Bei Information und Beratung muss der Arbeitgeber rechtzeitig informieren und beraten, entscheidet am Ende aber selbst. Bei Zustimmung und Mitbestimmung entscheidet die Einigungsstelle, wenn sich Arbeitgeber und Betriebsrat nicht einigen.",
    },
    fragen: {
      intro:
        "Die Liste unten ist für den Moment gedacht, in dem ein KI-Werkzeug für die Ausbildung geplant wird. Du kannst sie drucken, als Datei herunterladen und unter Nennung der Quelle frei weiterverwenden.",
      print: "Fragenliste drucken",
      download: "Als Markdown herunterladen",
      printNote: "Druckt auf A4, keine Frage wird auf zwei Seiten getrennt.",
      exerciseLabel: "Übung · 15 Minuten",
      exercise:
        "Wähl ein Werkzeug, das in eurer Ausbildung schon läuft, zum Beispiel eine Lernplattform. Beantworte die Fragen [3](#frage-3), [6](#frage-6) und [7](#frage-7) so weit, wie du es ohne Rückfrage kannst. Jede Lücke ist ein Punkt für die nächste JAV-Sitzung.",
    },
    berichtsheft: [
      "Das Berufsbildungsgesetz verlangt einen schriftlichen oder elektronischen Ausbildungsnachweis ([§ 13 S. 2 Nr. 7 BBiG](bbig:13)). Welche der beiden Formen gilt, steht im Ausbildungsvertrag ([§ 11 Abs. 1 BBiG](bbig:11)). Womit du ihn schreibst, regelt das Gesetz nicht. Der Eintrag muss trotzdem stimmen, denn dein Betrieb sieht den Nachweis regelmäßig durch ([§ 14 Abs. 2 BBiG](bbig:14)), und für die Zulassung zur Abschlussprüfung muss er über deinen Betrieb schriftlich oder elektronisch vorgelegt werden ([§ 43 Abs. 1 Nr. 2 BBiG](bbig:43)).",
      "Seit dem {date:de-bbig-43-record-without-signature-2024-08-01} verlangt das Gesetz für die Zulassung keine Unterschriften von Ausbilder und Azubi mehr. Wie deine Kammer die Vorlage regelt, steht in ihren Hinweisen zum Ausbildungsnachweis.",
      "Betriebs- und Geschäftsgeheimnisse musst du für dich behalten (§ 13 S. 2 Nr. 6 BBiG). Sie gehören deshalb nicht in ein KI-Werkzeug, das dein Betrieb nicht freigegeben hat.",
      `In der Prüfung gilt die Prüfungsordnung deiner Kammer ([§ 47 BBiG](bbig:47)). Welche Hilfsmittel erlaubt sind, legen Prüfungsordnung und Kammer fest, und nicht zugelassene Hilfsmittel können als Täuschung gewertet werden. Einige Kammern verlangen bei Haus- und Projektarbeiten, KI-Nutzung zu kennzeichnen und Prompts zu dokumentieren, zum Beispiel die [IHK Darmstadt](${IHK_DARMSTADT}) und die [Handelskammer Bremen](${HK_BREMEN}). Lies die Regel deiner Kammer, bevor du anfängst.`,
    ],
    grenzen: [
      "Die Liste zeigt, welche Fragen sich aus den Gesetzen ergeben. Ob ein bestimmtes Werkzeug in deinem Betrieb zulässig ist, kann sie nicht sagen, dafür braucht es die Antworten und den Einzelfall.",
      "Mehrere Punkte sind rechtlich offen. Dazu gehört, ob Lernplattformen im Ausbildungsbetrieb unter Anhang III der KI-Verordnung fallen, ob Schulungen nach Art. 4 KI-VO nach § 98 BetrVG mitbestimmt sind und wie das Tempoverbot für Jugendliche auf Lernwerkzeuge anzuwenden ist.",
      "Für deinen Fall helfen der Betriebsrat, die Gewerkschaft für ihre Mitglieder, die Ausbildungsberatung deiner Kammer und Anwältinnen und Anwälte für Arbeitsrecht.",
      "Diese Seite ersetzt keine Schulung nach [§ 37 Abs. 6 BetrVG](betrvg:37), die über [§ 65 Abs. 1 BetrVG](betrvg:65) auch JAV-Mitgliedern zusteht, wenn sie für die JAV-Arbeit erforderlich ist. Sie ist auch keine als geeignet anerkannte Schulung nach § 37 Abs. 7 BetrVG.",
      "**So prüfst du nach.** Öffne für zwei Rechtsgrundlagen aus der Liste den Gesetzestext und lies den Absatz selbst. Findest du einen Fehler, melde ihn über das [Feedback-Formular](/feedback). Korrekturen bekommen ein neues Prüfdatum oben auf dieser Seite.",
      "Recherche und erster Entwurf entstanden mit KI-Unterstützung. Stand: {stand}. Keine Rechtsberatung.",
    ],
    weiterlernen: {
      intro:
        "Die Kurse sind kostenlos. Zum Lesen der Lektionen brauchst du ein Lernkonto.",
      courses: [
        {
          slug: "ki-und-gesellschaft",
          description:
            "Die Lektion zum Betriebsrat zeigt, wann § 87 BetrVG bei KI greift, und nennt Fragen für den Betrieb.",
        },
        {
          slug: "eu-ai-act-kurs",
          description:
            "Risikoklassen, Anhang III und ein Fallbeispiel zu KI in der Bewerberauswahl.",
        },
        {
          slug: "ki-fuehrerschein",
          description:
            "Welche Daten in ein KI-Werkzeug dürfen, wie du Antworten prüfst und was eine KI-Richtlinie regelt.",
        },
      ],
      externalHeading: "Außerhalb dieser Seite",
      external: [
        {
          title: "Bundesinstitut für Berufsbildung (BIBB), öffentlich",
          description: "Themenseite zu KI in der beruflichen Bildung.",
          href: BIBB,
          language: "de",
        },
        {
          title: "Hans-Böckler-Stiftung, gewerkschaftsnah",
          description:
            "Auswertung von Betriebsvereinbarungen zu KI und algorithmischen Systemen.",
          href: IMU,
          language: "de",
        },
        {
          title: "Bitkom, Verband der Digitalwirtschaft",
          description:
            "Leitfaden „Künstliche Intelligenz und Mitbestimmung“ zu Eckpfeilern einer Betriebsvereinbarung für den KI-Einsatz.",
          href: BITKOM,
          language: "de",
        },
      ],
    },
    quellen: {
      statusLabel: "Stand",
      rows: [
        {
          title: "Betriebsverfassungsgesetz",
          covers: "§§ 37, 60 bis 71, 75, 80, 84, 85, 87, 90, 94 bis 98",
          type: "Gesetz",
          href: SOURCES.betrvg,
          language: "de",
        },
        {
          title: "Berufsbildungsgesetz",
          covers: "§§ 11, 13, 14, 43, 47, 76",
          type: "Gesetz",
          href: SOURCES.bbig,
          language: "de",
        },
        {
          title: "Jugendarbeitsschutzgesetz",
          covers: "§§ 8, 22, 23, 28a, 29",
          type: "Gesetz",
          href: SOURCES.jarbschg,
          language: "de",
        },
        {
          title: "Datenschutz-Grundverordnung",
          covers: "Art. 5, 7, 9, 13, 22, 28, 35, 44",
          type: "EU-Recht",
          href: SOURCES.gdpr,
        },
        {
          title: "KI-Verordnung",
          covers: "Art. 4, 5, 6 und Anhang III",
          type: "EU-Recht",
          href: SOURCES.aiAct,
        },
        {
          title: "Verordnung (EU) 2026/1744",
          covers: "Neue Fassung von Art. 4 und neue Termine für Anhang III",
          type: "EU-Recht",
          href: SOURCES.omnibus,
        },
        {
          title: "Europäische Kommission",
          covers: "Fragen und Antworten zu Art. 4 KI-VO",
          type: "Kommission",
          href: SOURCES.literacyFaq,
          language: "en",
        },
        {
          title: "Europäische Kommission",
          covers: "Leitlinien zu verbotenen KI-Praktiken nach Art. 5 KI-VO",
          type: "Kommission",
          href: SOURCES.prohibitedGuidelines,
          language: "en",
        },
        {
          title: "Europäischer Datenschutzausschuss",
          covers: "Leitlinien 05/2020 zur Einwilligung",
          type: "Datenschutzausschuss",
          href: SOURCES.edpbConsent,
          language: "en",
        },
        {
          title: "IHK Darmstadt",
          covers: "Richtlinie zum Einsatz von KI bei Haus- und Projektarbeiten",
          type: "Kammer",
          href: IHK_DARMSTADT,
          language: "de",
        },
        {
          title: "Handelskammer Bremen",
          covers: "Hinweise zur Verwendung von KI bei Haus- und Projektarbeiten",
          type: "Kammer",
          href: HK_BREMEN,
          language: "de",
        },
      ],
    },
  },
  en: {
    title:
      "AI in apprenticeships: questions for youth representatives and works councils",
    description:
      "Which rights the JAV and the works council have when AI enters apprenticeship training, what applies to the training record and exams, and a question list to print.",
    openGraphDescription:
      "A question list for youth representatives and works councils with legal bases from German law, the GDPR and the EU AI Act. Free to reuse under CC BY 4.0.",
    breadcrumbHome: "Home",
    breadcrumbTitle: "AI in apprenticeships",
    articleSection: "AI in apprenticeships",
    screenLabel: "AI in apprenticeships article",
    railKicker: "§ Reading points",
    rail: {
      hero: "Introduction",
      "warum-jetzt": "Why now",
      rechte: "Rights",
      fragen: "The questions",
      berichtsheft: "Training record",
      grenzen: "Limits",
      weiterlernen: "Keep learning",
      quellen: "Sources",
    },
    headings: {
      "warum-jetzt":
        "The JAV elections fall in the months when companies bring in AI",
      rechte: "What the JAV can do and which rights the works council has",
      fragen: "Questions before the tool goes live",
      berichtsheft: "Training record and exams: what the law says",
      grenzen: "What this list does not prove",
      weiterlernen: "Keep learning",
      quellen: "Sources",
    },
    keywords: [
      "JAV",
      "youth and trainee representation",
      "AI in apprenticeships",
      "works council",
      "training record",
      "BetrVG",
      "AI Act",
    ],
    otherLanguage: { de: "in German" },
    metaArticle: "Article",
    metaReading: "min read",
    lede: "When your company introduces an AI tutor, a learning platform or a writing assistant for trainees, the important decisions are made before the first login. They cover which data is recorded, who sees results and what is allowed in the training record. This page sets out the rights of the youth and trainee representation (JAV) and the works council, the rules for the training record and exams, and a question list you can print.",
    intro:
      "After reading, you can ask the questions that belong on the table when an AI tool enters apprenticeship training, and you know who holds which right.",
    facts: [
      {
        label: "For",
        value:
          "Trainees, JAV members, training staff and works council members in Germany. No prior knowledge needed.",
      },
      { label: "Status", value: "{stand}. Not legal advice." },
      {
        label: "Question list",
        value: "Free to reuse under CC BY 4.0, [to print and download](#fragen).",
      },
    ],
    warumJetzt: {
      paragraphs: [
        "The regular elections of the youth and trainee representation, the {de:Jugend- und Auszubildendenvertretung} or JAV, run from {range:de-betrvg-64-jav-election-start-2026-10-01:de-betrvg-64-jav-election-end-2026-11-30} ([Section 64(1) BetrVG](betrvg:64), the Works Constitution Act). Elections take place in establishments that normally employ at least five people who are under 18 or in vocational training ([Section 60(1) BetrVG](betrvg:60)). The prevailing view is that a works council must also exist. Everyone under 18 and every trainee, whatever their age, may vote ([Section 61(1) BetrVG](betrvg:61)).",
        "At the same time AI is entering apprenticeship training as a tutor, a learning platform or help with the training record. Since 2021 the Works Constitution Act has named artificial intelligence explicitly in three places ([Section 80(3)](betrvg:80), [Section 90(1) no. 3](betrvg:90) and [Section 95(2a) BetrVG](betrvg:95)). The EU AI Act has prohibited emotion recognition in the workplace and in education institutions since {date:ai-act-article-5-prohibited-2025-02-02}. High-risk obligations for AI that assesses learning outcomes or selects staff apply from {date:ai-act-high-risk-areas-adopted-2027-12-02}.",
        "The public sector has different laws and different election dates.",
      ],
      routeLabel: "Dates",
      states: {
        past: "already applies",
        current: "running now",
        future: "still to come",
      },
      stations: STATIONS_EN,
      legend:
        "Milestones as of {stand}. A filled station means the rule already applies. A marked station is running now. An outlined station means it is still to come.",
    },
    rechte: {
      intro:
        "The JAV represents employees under 18 and trainees in the establishment (Section 60(2) BetrVG). It has no co-determination rights of its own towards the employer and acts through the works council. Instead, the law gives it a fixed place in the works council's work.",
      canTitle: "The JAV can",
      can: [
        {
          text: "ask the works council to take measures, especially on vocational training and on keeping trainees on after training",
          ref: "[Section 70(1) no. 1 BetrVG](betrvg:70)",
        },
        {
          text: "see to it that laws, collective agreements and works agreements that protect trainees are applied",
          ref: "Section 70(1) no. 2 BetrVG",
        },
        {
          text: "take up suggestions from trainees and press the works council to act on them",
          ref: "Section 70(1) no. 3 BetrVG",
        },
        {
          text: "attend works council meetings with all its members when an item particularly concerns trainees, and vote when a resolution mainly concerns trainees",
          ref: "[Section 67(1) and (2) BetrVG](betrvg:67)",
        },
        {
          text: "take part in meetings between the employer and the works council when trainees are particularly affected",
          ref: "[Section 68 BetrVG](betrvg:68)",
        },
        {
          text: "call a youth and trainee assembly in agreement with the works council",
          ref: "[Section 71 BetrVG](betrvg:71)",
        },
      ],
      cannotTitle: "The JAV cannot",
      cannot: [
        {
          text: "co-determine on its own or conclude a works agreement with the employer, which is the works council's role",
        },
        {
          text: "bring in an expert under Section 80(3) BetrVG, a right that belongs to the works council",
        },
        {
          text: "demand documents directly from the employer, because it receives information through the works council",
          ref: "Section 70(2) BetrVG",
        },
      ],
      tableCaption: "Works council rights when AI arrives",
      columns: ["Right", "Type of right", "Section"],
      rows: [
        [
          "Information and consultation when work processes are planned, including AI",
          "Information and consultation",
          "Section 90(1) no. 3 and (2) BetrVG",
        ],
        [
          "An expert when the works council has to assess AI",
          "Counts as necessary, details by agreement",
          "Section 80(3) BetrVG",
        ],
        [
          "Introduction and use of systems that can monitor performance or behaviour",
          "Co-determination",
          "[Section 87(1) no. 6 BetrVG](betrvg:87)",
        ],
        [
          "General appraisal principles",
          "Consent",
          "[Section 94(2) BetrVG](betrvg:94)",
        ],
        [
          "Selection guidelines, also when AI helps draw them up",
          "Consent; in establishments with more than 500 employees also a right to demand them",
          "Section 95(1), (2) and (2a) BetrVG",
        ],
        [
          "Training when knowledge is no longer enough after a change",
          "Co-determination",
          "[Section 97(2) BetrVG](betrvg:97)",
        ],
        [
          "How in-company vocational training is carried out, including apprenticeships",
          "Co-determination",
          "[Section 98(1) BetrVG](betrvg:98)",
        ],
      ],
      note: "With information and consultation, the employer must inform and consult in good time but makes the final decision. With consent and co-determination, a conciliation committee ({de:Einigungsstelle}) decides if the employer and the works council cannot agree.",
    },
    fragen: {
      intro:
        "The list below is meant for the moment when an AI tool for apprenticeship training is being planned. You can print it, download it as a file and reuse it freely with attribution.",
      print: "Print the question list",
      download: "Download as Markdown",
      printNote: "Prints on A4, and no question breaks across two pages.",
      exerciseLabel: "Exercise · 15 minutes",
      exercise:
        "Pick a tool that already runs in your apprenticeship training, for example a learning platform. Answer questions [3](#frage-3), [6](#frage-6) and [7](#frage-7) as far as you can without asking anyone. Every gap is an item for the next JAV meeting.",
    },
    berichtsheft: [
      "The Vocational Training Act requires a written or electronic training record ([Section 13 sentence 2 no. 7 BBiG](bbig:13)). Which of the two applies is set in the training contract ([Section 11(1) BBiG](bbig:11)). The Act does not say what you write it with. The entry still has to be accurate, because your company reviews the record regularly ([Section 14(2) BBiG](bbig:14)) and, for admission to the final exam, the record has to be submitted in writing or electronically through your company ([Section 43(1) no. 2 BBiG](bbig:43)).",
      "Since {date:de-bbig-43-record-without-signature-2024-08-01} the Act no longer requires the record to be signed by the trainer and the trainee for admission. Your chamber's notes on the training record say how it handles the submission.",
      "You must keep trade and business secrets to yourself (Section 13 sentence 2 no. 6 BBiG). They therefore do not belong in an AI tool your company has not approved.",
      `In the exam, the exam regulations of your chamber apply ([Section 47 BBiG](bbig:47)). The exam regulations and the chamber decide which aids are allowed, and unauthorised aids can be treated as cheating. Some chambers require trainees to label AI use in home assignments and project work and to document their prompts, for example [IHK Darmstadt](${IHK_DARMSTADT}) and [Handelskammer Bremen](${HK_BREMEN}). Read your chamber's rule before you start.`,
    ],
    grenzen: [
      "The list shows which questions follow from the law. It cannot tell you whether a specific tool is lawful in your company, which depends on the answers and on the individual case.",
      "Several points are legally open. They include whether learning platforms in training companies fall under Annex III of the AI Act, whether training under Article 4 AI Act is co-determined under Section 98 BetrVG, and how the pace rule for young people applies to learning tools.",
      "For your case, help is available from the works council, the trade union for its members, the training advisers of your chamber and employment lawyers.",
      "This page does not replace training under [Section 37(6) BetrVG](betrvg:37), to which JAV members are also entitled through [Section 65(1) BetrVG](betrvg:65) when it is necessary for their JAV work. Nor is it training recognised as suitable under Section 37(7) BetrVG.",
      "**How to check.** Open the legal text for two of the legal bases in the list and read the paragraph yourself. If you find a mistake, report it through the [feedback form](/feedback). Corrections get a new review date at the top of this page.",
      "Research and a first draft were produced with AI assistance. Status: {stand}. Not legal advice.",
    ],
    weiterlernen: {
      intro:
        "The courses are free. You need a learning account to read the lessons.",
      courses: [
        {
          slug: "ki-und-gesellschaft",
          description:
            "The lesson on works councils shows when Section 87 BetrVG applies to AI and lists questions for the workplace.",
        },
        {
          slug: "eu-ai-act-kurs",
          description:
            "Risk classes, Annex III and a case study on AI in applicant selection.",
        },
        {
          slug: "ki-fuehrerschein",
          description:
            "Which data may go into an AI tool, how to check answers and what an AI policy covers.",
        },
      ],
      externalHeading: "Beyond this page",
      external: [
        {
          title:
            "Federal Institute for Vocational Education and Training (BIBB), public body",
          description:
            "Topic page on AI in vocational education and training.",
          href: BIBB,
          language: "de",
        },
        {
          title: "Hans-Böckler-Stiftung, trade-union foundation",
          description:
            "Analysis of works agreements on AI and algorithmic systems.",
          href: IMU,
          language: "de",
        },
        {
          title: "Bitkom, digital industry association",
          description:
            'Guide "{de:Künstliche Intelligenz und Mitbestimmung}" on the cornerstones of a works agreement on AI use.',
          href: BITKOM,
          language: "de",
        },
      ],
    },
    quellen: {
      statusLabel: "Status",
      rows: [
        {
          title: "Works Constitution Act",
          covers: "Sections 37, 60 to 71, 75, 80, 84, 85, 87, 90, 94 to 98",
          type: "Statute",
          href: SOURCES.betrvg,
          language: "de",
        },
        {
          title: "Vocational Training Act",
          covers: "Sections 11, 13, 14, 43, 47, 76",
          type: "Statute",
          href: SOURCES.bbig,
          language: "de",
        },
        {
          title: "Youth Employment Protection Act",
          covers: "Sections 8, 22, 23, 28a, 29",
          type: "Statute",
          href: SOURCES.jarbschg,
          language: "de",
        },
        {
          title: "General Data Protection Regulation",
          covers: "Articles 5, 7, 9, 13, 22, 28, 35, 44",
          type: "EU law",
          href: SOURCES.gdpr,
        },
        {
          title: "AI Act",
          covers: "Articles 4, 5, 6 and Annex III",
          type: "EU law",
          href: SOURCES.aiAct,
        },
        {
          title: "Regulation (EU) 2026/1744",
          covers: "New wording of Article 4 and new dates for Annex III",
          type: "EU law",
          href: SOURCES.omnibus,
        },
        {
          title: "European Commission",
          covers: "Questions and answers on Article 4 AI Act",
          type: "Commission",
          href: SOURCES.literacyFaq,
          language: "en",
        },
        {
          title: "European Commission",
          covers: "Guidelines on prohibited AI practices under Article 5 AI Act",
          type: "Commission",
          href: SOURCES.prohibitedGuidelines,
          language: "en",
        },
        {
          title: "European Data Protection Board",
          covers: "Guidelines 05/2020 on consent",
          type: "Data protection board",
          href: SOURCES.edpbConsent,
          language: "en",
        },
        {
          title: "IHK Darmstadt",
          covers: "Guideline on AI in home assignments and project work",
          type: "Chamber",
          href: IHK_DARMSTADT,
          language: "de",
        },
        {
          title: "Handelskammer Bremen",
          covers: "Notes on using AI in home assignments and project work",
          type: "Chamber",
          href: HK_BREMEN,
          language: "de",
        },
      ],
    },
  },
};
