import type { Bucket, DemoLocale, FridayNumber, L10n, Light, RouteKey, SceneId, Vote } from "./types";

/*
 * Every word the demo shows, in German and English. The Friday rows and the
 * three templates come from the kit (customer-email.md, company-notes.md,
 * ANSWERS.md mission 5 and its vendor questions) and deck slides 10 to 12.
 * The UI says "du"; the vendor mail says "Sie" on purpose, because it is a
 * business letter.
 */

export interface LightWords {
  readonly word: string;
  readonly rule: string;
}

export interface UiCopy {
  readonly templatesLink: string;
  readonly kitLine: string;
  readonly asOfLine: string;
  readonly scenesHeading: string;
  readonly scenesIntro: string;
  /** "{order} von 8" */
  readonly progress: string;
  readonly ask: string;
  readonly lights: Readonly<Record<Light, LightWords>>;
  readonly you: string;
  readonly answer: string;
  readonly direction: Readonly<Record<"exact" | "stricter" | "looser", string>>;
  readonly routeHeading: string;
  readonly routeKeys: Readonly<Record<"contract" | "training" | "company" | "stored", string>>;
  readonly missing: string;
  /** {from}, {to} */
  readonly routeFigure: string;
  readonly unknownBox: string;
  readonly usBox: string;
  readonly changeHeading: string;
  readonly goals: Readonly<Record<"leaveRed" | "shrinkTodo" | "findRed", string>>;
  readonly accountDial: string;
  readonly contentDial: string;
  readonly now: string;
  readonly todo: string;
  readonly found: string;
  readonly next: string;
  readonly toFriday: string;
  readonly tableHeading: string;
  readonly tableCols: Readonly<Record<"person" | "account" | "you" | "answer" | "tried", string>>;
  readonly yes: string;
  readonly open: string;
  readonly slotsLabel: string;
  /** {person}, {answer}, {you} */
  readonly slotName: string;
  /** {person} */
  readonly slotNameOpen: string;
  /** {person} */
  readonly openScene: string;
  readonly fridayHeading: string;
  readonly fridayIntro: string;
  readonly mailMeta: string;
  readonly mailAsks: string;
  readonly mailQuestions: readonly string[];
  readonly clause: string;
  readonly draftLabel: string;
  readonly votes: Readonly<Record<Vote, string>>;
  /** {n} */
  readonly voteLegend: string;
  readonly right: string;
  /** {key} */
  readonly wrong: string;
  readonly evidence: string;
  readonly trueWould: string;
  readonly owner: string;
  readonly fridayPending: string;
  readonly fridayClose: string;
  readonly fridayCloseLink: string;
  readonly takeawaysHeading: string;
  readonly takeawaysIntro: string;
  readonly toolField: string;
  readonly toolPlaceholder: string;
  readonly toolNote: string;
  readonly ownerField: string;
  readonly ownerPlaceholder: string;
  readonly fieldsNote: string;
  readonly cardReply: string;
  readonly cardRules: string;
  readonly cardMail: string;
  readonly inEnglish: string;
  readonly yourScenes: string;
  readonly youTooLoose: string;
  readonly copy: string;
  readonly copyEnglish: string;
  readonly copied: string;
  readonly selected: string;
  /** {name} */
  readonly replyNote: string;
  readonly mailNote: string;
  readonly sourcesHeading: string;
  readonly sourcesIntro: string;
  readonly deckLabel: string;
  readonly restart: string;
  readonly toWorkshop: string;
  readonly toKit: string;
  /** {word}, {line} */
  readonly announceNow: string;
}

const DE: UiCopy = {
  templatesLink: "Zu den Vorlagen",
  kitLine: "Mit dem Kit? Erst auf Papier, dann hier.",
  asOfLine: "Anbieterstand: 18. Oktober 2026.",
  scenesHeading: "Acht Einfügungen",
  scenesIntro:
    "Erst deine Ampel, dann die Lösung, der Weg der Daten und was anders sein müsste.",
  progress: "{order} von 8",
  ask: "Welche Ampel gibst du?",
  lights: {
    green: { word: "Grün", rule: "öffentlich, jedes Werkzeug" },
    amber: {
      word: "Gelb",
      rule: "nur Firmenwerkzeug, Namen und Nummern raus, eine benannte Person prüft",
    },
    red: { word: "Rot", rule: "nicht ohne schriftliches Okay" },
  },
  you: "Du",
  answer: "Lösung",
  direction: {
    exact: "Stimmt.",
    stricter: "Sicher, aber strenger als nötig.",
    looser: "Zu locker.",
  },
  routeHeading: "Wohin geht es?",
  routeKeys: {
    contract: "Vertrag",
    training: "Training",
    company: "Firma sieht",
    stored: "Gespeichert",
  },
  missing: "Fehlt:",
  routeFigure: "Von {from} zu: {to}",
  unknownBox: "unbekannt",
  usBox: "USA",
  changeHeading: "Was müsste anders sein?",
  goals: {
    leaveRed: "Was müsste anders sein, damit es nicht mehr rot ist?",
    shrinkTodo: "Bereinige von Hand. Was bleibt auf der To-do-Liste?",
    findRed: "Was würde es rot machen?",
  },
  accountDial: "Konto",
  contentDial: "Inhalt",
  now: "Jetzt:",
  todo: "To-do:",
  found: "Gefunden.",
  next: "Nächste Szene",
  toFriday: "Zu Freitag",
  tableHeading: "Deine acht Ampeln",
  tableCols: { person: "Person", account: "Konto", you: "Du", answer: "Lösung", tried: "Ausprobiert" },
  yes: "ja",
  open: "offen",
  slotsLabel: "Szenen",
  slotName: "{person}, Lösung {answer}, du {you}",
  slotNameOpen: "{person}, offen",
  openScene: "Szene {person} öffnen",
  fridayHeading: "Zurück zu Freitag",
  fridayIntro: "Würdest du das so senden?",
  mailMeta: "Lena Keller, Tannwald Haustechnik, Montag 30. November 2026, 9:12. Antwort bis Freitag.",
  mailAsks: "Lena Keller fragt:",
  mailQuestions: [
    "Welche KI-Werkzeuge nutzt ihr mit unseren Daten?",
    "Wo liegen sie?",
    "Wird damit trainiert?",
  ],
  clause:
    "Klausel 7 (erfunden): KI-Werkzeuge nur nach schriftlicher Mitteilung. Kundendaten bleiben in der EU oder im EWR, außer der Kunde stimmt schriftlich zu.",
  draftLabel: "Der Entwurf des Chefs, noch nicht gesendet:",
  votes: { true: "Stimmt", half: "Halb", false: "Stimmt nicht" },
  voteLegend: "Satz {n}: Stimmt das?",
  right: "Richtig.",
  wrong: "Die Lösung: {key}.",
  evidence: "Belege:",
  trueWould: "Wahr wäre:",
  owner: "zuständig:",
  fridayPending: "Stimm bei jedem Satz ab, dann siehst du, was wahr wäre.",
  fridayClose:
    "Die Sätze unter „Wahr wäre“ sind wahr für Vardar Works. Für deine Firma füllst du unten die Vorlage aus.",
  fridayCloseLink: "Zu den Vorlagen",
  takeawaysHeading: "Zum Mitnehmen",
  takeawaysIntro: "Drei Vorlagen. Trag zwei Dinge ein, der Rest bleibt in eckigen Klammern.",
  toolField: "Name eures Firmenwerkzeugs",
  toolPlaceholder: "zum Beispiel Claude Team",
  toolNote: "Kein Firmenwerkzeug? Dann gilt nur Grün: öffentlicher Text in jedem Werkzeug.",
  ownerField: "Wen fragst du vorher?",
  ownerPlaceholder: "zum Beispiel Mia aus der IT",
  fieldsNote: "Was du hier einträgst, bleibt in diesem Fenster. Nichts wird gespeichert oder gesendet.",
  cardReply: "Antwort an den Kunden",
  cardRules: "Unsere KI-Regeln",
  cardMail: "Mail an den Anbieter",
  inEnglish: "Auf Englisch:",
  yourScenes: "Deine Szenen",
  youTooLoose: "du: zu locker",
  copy: "Kopieren",
  copyEnglish: "Englisch kopieren",
  copied: "Kopiert",
  selected: "Markiert: mit Strg+C kopieren",
  replyNote:
    "Vor dem Senden prüft {name} jeden Satz. Stimmt ein Satz noch nicht, schreib ab wann, zum Beispiel „ab 1. Dezember“. Nie schreiben: „bleibt in der EU“, „nie trainiert“, „konform“.",
  mailNote:
    "Lies vorher die Seiten des Anbieters neu: Die Fakten hier sind vom 18. Oktober 2026. Jede Frage schließt eine Lücke aus „Fehlt“: EU-Speicher, Auftragsverarbeitung, Aufbewahrung.",
  sourcesHeading: "Quellen",
  sourcesIntro: "Jede Anbieterzeile oben steht hier mit Quelle und Datum, so wie im Kit (facts.md).",
  deckLabel: "Workshop-Folie 05",
  restart: "Von vorn",
  toWorkshop: "Zum Workshop 05",
  toKit: "Kit ansehen",
  announceNow: "Jetzt {word}. {line}",
};

const EN: UiCopy = {
  templatesLink: "To the templates",
  kitLine: "Doing the kit? Paper first, then here.",
  asOfLine: "Vendor facts as of 18 October 2026.",
  scenesHeading: "Eight pastes",
  scenesIntro:
    "Your light first, then the answer, where the data goes and what would have to change.",
  progress: "{order} of 8",
  ask: "Which light do you give it?",
  lights: {
    green: { word: "Green", rule: "public, any tool" },
    amber: { word: "Amber", rule: "company tool only, names and numbers out, a named person checks" },
    red: { word: "Red", rule: "not without a written okay" },
  },
  you: "You",
  answer: "Answer",
  direction: {
    exact: "Right.",
    stricter: "Safe, but stricter than needed.",
    looser: "Too loose.",
  },
  routeHeading: "Where does it go?",
  routeKeys: {
    contract: "Contract",
    training: "Training",
    company: "Company sees",
    stored: "Stored",
  },
  missing: "Missing:",
  routeFigure: "From {from} to: {to}",
  unknownBox: "unknown",
  usBox: "US",
  changeHeading: "What would have to change?",
  goals: {
    leaveRed: "What would have to change so it is no longer red?",
    shrinkTodo: "Clean it by hand. What stays on the to-do list?",
    findRed: "What would turn it red?",
  },
  accountDial: "Account",
  contentDial: "Content",
  now: "Now:",
  todo: "To-do:",
  found: "Found.",
  next: "Next scene",
  toFriday: "On to Friday",
  tableHeading: "Your eight lights",
  tableCols: { person: "Person", account: "Account", you: "You", answer: "Answer", tried: "Tried" },
  yes: "yes",
  open: "open",
  slotsLabel: "Scenes",
  slotName: "{person}, answer {answer}, you {you}",
  slotNameOpen: "{person}, open",
  openScene: "Open the scene {person}",
  fridayHeading: "Back to Friday",
  fridayIntro: "Would you send this?",
  mailMeta: "Lena Keller, Tannwald Haustechnik, Monday 30 November 2026, 9:12. Answer by Friday.",
  mailAsks: "Lena Keller asks:",
  mailQuestions: [
    "Which AI tools do you use with our data?",
    "Where is it stored?",
    "Is it used for training?",
  ],
  clause:
    "Clause 7 (invented): AI tools only after written notice to the customer. Customer data stays in the EU or EEA unless the customer agrees in writing.",
  draftLabel: "The boss's draft reply, not sent yet:",
  votes: { true: "True", half: "Half", false: "Not true" },
  voteLegend: "Sentence {n}: is it true?",
  right: "Right.",
  wrong: "The answer: {key}.",
  evidence: "Evidence:",
  trueWould: "True would be:",
  owner: "owner:",
  fridayPending: "Vote on each sentence, then you see what would be true.",
  fridayClose:
    "The sentences under “True would be” are true for Vardar Works. For your company, fill in the template below.",
  fridayCloseLink: "To the templates",
  takeawaysHeading: "To take with you",
  takeawaysIntro: "Three templates. Fill in two things, the rest stays in square brackets.",
  toolField: "Your company tool's name",
  toolPlaceholder: "for example Claude Team",
  toolNote: "No company tool? Then only green applies: public text in any tool.",
  ownerField: "Who do you ask first?",
  ownerPlaceholder: "for example Mia from IT",
  fieldsNote: "What you type here stays in this window. Nothing is stored or sent.",
  cardReply: "Reply to the customer",
  cardRules: "Our AI rules",
  cardMail: "Mail to the vendor",
  inEnglish: "In English:",
  yourScenes: "Your scenes",
  youTooLoose: "you: too loose",
  copy: "Copy",
  copyEnglish: "Copy English",
  copied: "Copied",
  selected: "Selected: copy with Ctrl+C",
  replyNote:
    "Before it goes out, {name} checks every sentence. If a line is not true yet, say from when, for example “from 1 December”. Never write “stays in the EU”, “never trained” or “compliant”.",
  mailNote:
    "Re-read the vendor's pages first: the facts here are from 18 October 2026. Each question closes a gap from “Missing”: EU storage, data processing agreement, retention.",
  sourcesHeading: "Sources",
  sourcesIntro: "Every vendor line above is listed here with its source and date, as in the kit (facts.md).",
  deckLabel: "Workshop slide 05",
  restart: "Start over",
  toWorkshop: "To Workshop 05",
  toKit: "View the kit",
  announceNow: "Now {word}. {line}",
};

export const UI: Readonly<Record<DemoLocale, UiCopy>> = { de: DE, en: EN };

/* ------------------------------------------------------------------ */
/* Freitag: deck slide 12, ANSWERS.md mission 5 sample page             */
/* ------------------------------------------------------------------ */

export interface FridayLight {
  readonly light: Light;
  readonly label?: L10n;
}

export interface FridayRow {
  readonly n: FridayNumber;
  readonly sentence: L10n;
  readonly evidence: readonly L10n[];
  readonly trueSentence: L10n;
  readonly lights: readonly FridayLight[];
  readonly owner?: L10n;
}

export const FRIDAY_ROWS: readonly FridayRow[] = [
  {
    n: 1,
    sentence: {
      de: "Wir nutzen nur den Firmen-Claude-Plan.",
      en: "We use only the company Claude plan.",
    },
    evidence: [
      { de: "Ana: privates Handy.", en: "Ana: personal phone." },
      { de: "Stefan: privater Chatbot.", en: "Stefan: personal chatbot." },
      { de: "Marko: privates Pro.", en: "Marko: personal Pro." },
      {
        de: "Petar: Claude Desktop mit verbundenem Ordner, auch das gehört in die Antwort.",
        en: "Petar: Claude Desktop with a connected folder, which belongs in the answer too.",
      },
      {
        de: "IT-Notiz: Einige Support-Leute nutzen einen kostenlosen Chatbot auf dem Handy.",
        en: "IT notes: some support agents use a free chatbot on their phones.",
      },
      {
        de: "Umfrage, erfunden, nur Summen: 38 der 61 wöchentlichen Nutzer nutzen manchmal ein privates Konto.",
        en: "Survey, invented, aggregates only: 38 of the 61 weekly users sometimes use a personal account.",
      },
    ],
    trueSentence: {
      de: "Unser Arbeitswerkzeug ist Claude Team mit 25 Plätzen. Einige Mitarbeitende haben auch private Konten genutzt. Ab 1. Dezember gehen Kundendaten nur in Team.",
      en: "Our work tool is Claude Team, 25 seats. Some staff also used personal accounts. From 1 December customer data goes only into Team.",
    },
    lights: [{ light: "amber" }],
    owner: { de: "IT-Leitung", en: "IT lead" },
  },
  {
    n: 2,
    sentence: { de: "Alle eure Daten bleiben in der EU.", en: "All your data stays in the EU." },
    evidence: [
      {
        de: "Jede Claude-Zeile hieß „gespeichert in den USA“ (Anthropic, 15.06.2026). Die Seite bietet keine reine EU-Option an.",
        en: "Every Claude row said “stored in the US” (Anthropic, 15 Jun 2026). The page offers no EU-only option.",
      },
      {
        de: "„Daten bleiben in Europa“ sagte ein Vertreter, schriftlich gibt es nichts.",
        en: "“Data stays in Europe” was said by a vendor rep. There is nothing in writing.",
      },
      {
        de: "Klausel 7 (erfunden) verlangt EU oder EWR, außer der Kunde stimmt schriftlich zu.",
        en: "Clause 7 (invented) asks for the EU or EEA, unless the customer agrees in writing.",
      },
    ],
    trueSentence: {
      de: "Laut Anthropic-Seite vom 15. Juni 2026 werden Daten in den USA gespeichert und können in anderen Regionen verarbeitet werden. Wir fragen den Anbieter schriftlich und antworten bis 4. Dezember.",
      en: "Anthropic's page of 15 June 2026 says data is stored in the US and may be processed in other regions. We will ask the vendor in writing and answer by 4 December.",
    },
    lights: [{ light: "amber" }],
    owner: { de: "Geschäftsführung", en: "CEO" },
  },
  {
    n: 3,
    sentence: {
      de: "Claude wird nie mit unseren Chats trainiert.",
      en: "Claude is never trained on our chats.",
    },
    evidence: [
      {
        de: "Team: standardmäßig nicht, Daumen-Feedback ausgenommen (18.08.2026).",
        en: "Team: not by default, thumbs feedback excepted (18 Aug 2026).",
      },
      {
        de: "Privat: eine Einstellung, deren Standard die Seite nicht nennt (03.08.2026).",
        en: "Personal: a setting whose default the page does not state (3 Aug 2026).",
      },
    ],
    trueSentence: {
      de: "Team-Chats werden standardmäßig nicht fürs Training genutzt (Anthropic, 18. August 2026). Private Konten haben eine eigene Einstellung und sind für Kundendaten tabu.",
      en: "Team chats are not used for training by default (Anthropic, 18 August 2026). Personal accounts have their own setting and are off limits for customer data.",
    },
    lights: [
      { light: "green", label: { de: "für Team", en: "for Team" } },
      { light: "amber", label: { de: "für privat", en: "for personal" } },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Zum Mitnehmen: the three templates (spec 8)                          */
/* ------------------------------------------------------------------ */

/**
 * Template tokens: {TOOL} is the company tool, {NAME} the person to ask.
 * Square-bracket slots stay for the reader to fill.
 */
export interface CardTemplates {
  readonly reply: string;
  readonly rules: string;
  readonly mail: string;
}

export const CARD_TEMPLATES: Readonly<Record<DemoLocale, CardTemplates>> = {
  de: {
    reply: [
      "1. Wir nutzen {TOOL} für die Arbeit. Kundendaten gehen nur dorthin.",
      "2. Laut Anbieterseite vom [DATUM] werden die Daten in [ORT] gespeichert. Wir fragen schriftlich nach [WAS FEHLT] und antworten bis [DATUM].",
      "3. Nicht fürs Training genutzt: [WELCHE CHATS, LAUT ANBIETER]. Unsere Regel für private Konten: [REGEL].",
    ].join("\n"),
    rules: [
      "Erlaubt: öffentlicher Text in jedem Werkzeug. Bereinigte Entwürfe in {TOOL}.",
      "Erst fragen bei {NAME}: Kundennamen oder Kundennummern in {TOOL}. Kundenverträge, Bewerbungen, jeder verbundene Ordner.",
      "Nie: Kundendaten auf einem privaten Konto. Schlüssel oder Passwörter in einem Chat.",
      "Vor dem Einfügen: Welches Konto? Was steht drin? Bereinige von Hand.",
    ].join("\n"),
    mail: [
      "Betreff: Drei Fragen zu unseren Daten in {TOOL}",
      "",
      "Guten Tag,",
      "wir nutzen {TOOL} für unsere Arbeit. Bitte beantworten Sie uns schriftlich:",
      "1. Wo werden unsere Chat-Daten gespeichert und verarbeitet?",
      "2. Welcher Vertrag gilt für unseren Plan? Enthält er einen Auftragsverarbeitungsvertrag?",
      "3. Wie lange werden unsere Chats aufbewahrt, und wer kann sie löschen?",
      "Vielen Dank.",
    ].join("\n"),
  },
  en: {
    reply: [
      "1. We use {TOOL} for work. Customer data goes only there.",
      "2. The vendor's page of [DATE] says data is stored in [PLACE]. We are asking in writing about [WHAT IS MISSING] and will answer by [DATE].",
      "3. Not used for training: [WHICH CHATS, PER THE VENDOR]. Our rule for personal accounts: [RULE].",
    ].join("\n"),
    rules: [
      "Allowed: public text in any tool. Cleaned drafts in {TOOL}.",
      "Ask {NAME} first: customer names or numbers in {TOOL}. Customer contracts, CVs, any connected folder.",
      "Never: customer data on a personal account. Keys or passwords in any chat.",
      "Before you paste: which account? What is in it? Clean it by hand.",
    ].join("\n"),
    mail: [
      "Subject: Three questions about our data in {TOOL}",
      "",
      "Hello,",
      "we use {TOOL} for our work. Please answer in writing:",
      "1. Where is our chat data stored and processed?",
      "2. Which contract applies to our plan? Does it include a data processing agreement?",
      "3. How long are our chats kept, and who can delete them?",
      "Thank you.",
    ].join("\n"),
  },
};

/** What an empty field leaves in the text. */
export const EMPTY_SLOT: Readonly<Record<DemoLocale, { readonly tool: string; readonly owner: string }>> = {
  de: { tool: "[FIRMENWERKZEUG]", owner: "[NAME]" },
  en: { tool: "[COMPANY TOOL]", owner: "[NAME]" },
};

/** The rule buckets of "Deine Szenen" (ANSWERS.md rules plus deck slide 12). */
export const RULE_BUCKETS: Readonly<Record<Bucket, L10n>> = {
  allowed: { de: "Erlaubt", en: "Allowed" },
  askFirst: { de: "Erst fragen", en: "Ask first" },
  never: { de: "Nie", en: "Never" },
};

/** Notes after a person in "Deine Szenen". */
export const BUCKET_NOTES: Readonly<Partial<Record<SceneId, L10n>>> = {
  dario: { de: "mit erfundenen Zeilen", en: "with made-up rows" },
};

/* ------------------------------------------------------------------ */
/* Words the logic joins into sentences (route change, ledger summary)  */
/* ------------------------------------------------------------------ */

export interface LogicWords {
  readonly routeNames: Readonly<Record<RouteKey, string>>;
  readonly route: {
    readonly changed: string;
    readonly same: string;
    readonly before: string;
    readonly nowOnRecord: string;
    readonly beforeOnRecord: string;
    readonly nowNothing: string;
  };
  /** Index = count, 0 to 8. */
  readonly numberWords: readonly string[];
  /** Last joint of a list: "Ana, Stefan und Marko". */
  readonly and: string;
  readonly ledger: {
    /** {matched} */
    readonly matched: string;
    readonly good: string;
    readonly readAll: string;
    /** {rest} */
    readonly readOthers: string;
    /** {people} */
    readonly tooLoose: string;
    /** {people} */
    readonly stillOpen: string;
  };
  readonly quote: { readonly open: string; readonly close: string };
}

export const LOGIC_WORDS: Readonly<Record<DemoLocale, LogicWords>> = {
  de: {
    routeNames: {
      contract: "Vertrag",
      training: "Training",
      company: "Firma sieht",
      stored: "gespeichert in den USA",
    },
    route: {
      changed: "Geändert",
      same: "Gleich",
      before: "Vorher: nichts in den Dateien.",
      nowOnRecord: "Jetzt belegt: gespeichert in den USA.",
      beforeOnRecord: "Vorher belegt: gespeichert in den USA.",
      nowNothing: "Jetzt: nichts in den Dateien.",
    },
    numberWords: ["null", "eine", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht"],
    and: "und",
    ledger: {
      matched: "{matched} von 8 wie die Lösung.",
      good: "Ab sechs von acht ist gut.",
      readAll: "Lies alle acht Gründe noch einmal.",
      readOthers: "Lies die Gründe der anderen {rest} noch einmal.",
      tooLoose: "Zu locker bei {people}: Das ist der Fehler, der passiert.",
      stillOpen: "Noch offen: {people}.",
    },
    quote: { open: "\u201e", close: "\u201c" },
  },
  en: {
    routeNames: {
      contract: "contract",
      training: "training",
      company: "company sees",
      stored: "stored in the US",
    },
    route: {
      changed: "Changed",
      same: "Same",
      before: "Before: nothing in the files.",
      nowOnRecord: "Now on record: stored in the US.",
      beforeOnRecord: "Before, on record: stored in the US.",
      nowNothing: "Now: nothing in the files.",
    },
    numberWords: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"],
    and: "and",
    ledger: {
      matched: "{matched} of 8 match the answer.",
      good: "Six or more of eight is good.",
      readAll: "Read all eight reasons again.",
      readOthers: "Read the reasons of the other {rest} again.",
      tooLoose: "Too loose on {people}: that is the mistake that happens.",
      stillOpen: "Still open: {people}.",
    },
    quote: { open: "\u201c", close: "\u201d" },
  },
};
