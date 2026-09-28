import type { Locale } from "./locale";

type Localized<T> = Readonly<Record<Locale, T>>;

export const ENTRY_COPY = {
  de: {
    metadata: {
      title: "Was ist KI? Ein Einstieg ohne Vorwissen",
      description:
        "Eine Arbeitsdefinition von KI mit drei Alltagsbeispielen und ihrer wichtigsten Grenze, lesbar in zehn Minuten ohne Konto.",
    },
    eyebrow: "Grundlagen / 01",
    title: "Was ist Künstliche Intelligenz?",
    intro:
      "Was ein KI-System tut und warum du seine Antworten prüfen musst.",
    facts: ["10 Minuten", "Ohne Konto", "Keine Vorkenntnisse"],
    definitionIndex: "02 / Definition",
    definitionHeading: "Eine brauchbare Arbeitsdefinition",
    definition:
      "Ein KI-System nimmt Eingaben und leitet daraus Ausgaben ab: Vorhersagen, Inhalte, Empfehlungen, Entscheidungen. Was herauskommt, hängt vom Modell ab, von seinen Daten und vom Einsatzkontext.",
    definitionSourceLabel: "Zur Einordnung",
    definitionSource:
      "Die rechtliche Definition steht in Artikel 3 der EU-KI-Verordnung und gilt bei Rechtsfragen.",
    examplesHeading: "Drei Anwendungen aus dem Alltag",
    examplesIndex: "03 / Beispiele",
    examples: [
      {
        id: "gesicht",
        number: "01",
        heading: "Gesichtserkennung",
        task: "Klassifizieren",
        body: "Beim Entsperren vergleicht dein Handy Merkmale deines Gesichts mit einem gespeicherten Muster. Das Ergebnis ist eine Wahrscheinlichkeit.",
      },
      {
        id: "route",
        number: "02",
        heading: "Routenplanung",
        task: "Schätzen",
        body: "Die Navi-App schätzt aus Kartendaten, aktuellem Verkehr und gelernten Mustern deine Fahrzeit und schlägt eine Route vor.",
      },
      {
        id: "empfehlungen",
        number: "03",
        heading: "Medienempfehlungen",
        task: "Ordnen",
        body: "Der Streamingdienst ordnet Inhalte nach deinen bisherigen Klicks und verstärkt so, was du ohnehin siehst. Deine Absicht kennt er nicht.",
      },
    ],
    boundaryLabel: "Die wichtigste Grenze",
    boundaryHeading: "Ein plausibles Ergebnis kann falsch sein.",
    boundaryBody:
      "Ein Modell gleicht seine Antwort nicht mit der Wirklichkeit ab. Bei wichtigen Entscheidungen prüfst du das Ergebnis an Quellen und mit Fachwissen, und ein Mensch trägt die Verantwortung.",
    faqHeading: "Kurze Antworten",
    faqIndex: "04 / Fragen",
    faqs: [
      {
        question: "Ist dieser Einstieg kostenlos?",
        answer:
          "Ja, und der KI-Check läuft wie diese Seite ohne Konto. Die Zugangsbedingungen der Kurse stehen am jeweiligen Kurs.",
      },
      {
        question: "Wer verantwortet die Inhalte?",
        answerBeforeLink:
          "Tim Löhr entwickelt und prüft die Plattform. Hintergrund und Kontakt stehen auf der ",
        linkLabel: "Seite über Tim Löhr",
        answerAfterLink: ".",
      },
    ],
    nextHeading: "Nächster Schritt",
    nextIndex: "01 / Auswahl",
    primaryLabel: "Stand einordnen",
    primaryTitle: "KI-Check",
    primaryMeta: "ca. 5 Minuten",
    primaryBody:
      "{count} Fragen, dann eine begründete Kursempfehlung, die nur in deinem Browser bleibt.",
    primaryCta: "KI-Check starten",
    courseLabel: "Grundkurs ansehen",
    courseTitle: "KI-Führerschein",
    courseBody:
      "Welche Daten in ein KI-Tool dürfen und wie du Antworten prüfst.",
    courseCta: "Zum Kurs",
    primerLabel: "Weiterlesen",
    primerTitle: "Blog",
    primerBody:
      "Artikel mit Quellen zu KI im Alltag, Regulierung und gesellschaftlichen Folgen.",
    primerCta: "Blog öffnen",
  },
  en: {
    metadata: {
      title: "What is AI? An introduction without prerequisites",
      description:
        "A working definition of AI with three everyday examples and its main limitation, readable in ten minutes without an account.",
    },
    eyebrow: "Foundations / 01",
    title: "What is artificial intelligence?",
    intro:
      "What an AI system does and why you need to check its answers.",
    facts: ["10 minutes", "No account", "No prerequisites"],
    definitionIndex: "02 / Definition",
    definitionHeading: "A useful working definition",
    definition:
      "An AI system takes inputs and derives outputs from them: predictions, content, recommendations, decisions. What comes out depends on the model, its data, and the context of use.",
    definitionSourceLabel: "Context",
    definitionSource:
      "The legal definition is in Article 3 of the EU AI Act and governs legal questions.",
    examplesHeading: "Three everyday applications",
    examplesIndex: "03 / Examples",
    examples: [
      {
        id: "gesicht",
        number: "01",
        heading: "Face recognition",
        task: "Classify",
        body: "When you unlock it, your phone compares features of your face with a stored pattern. The result is a probability.",
      },
      {
        id: "route",
        number: "02",
        heading: "Route planning",
        task: "Estimate",
        body: "The navigation app estimates your journey time from map data, current traffic and learned patterns, and suggests a route.",
      },
      {
        id: "empfehlungen",
        number: "03",
        heading: "Media recommendations",
        task: "Rank",
        body: "The streaming service ranks content by your past clicks and so reinforces what you already see. It does not know your intent.",
      },
    ],
    boundaryLabel: "The main limitation",
    boundaryHeading: "A plausible output can still be wrong.",
    boundaryBody:
      "A model does not check its answer against reality. For important decisions, you check it with sources and expertise, and a person takes responsibility.",
    faqHeading: "Short answers",
    faqIndex: "04 / Questions",
    faqs: [
      {
        question: "Is this introduction free?",
        answer:
          "Yes, and the AI check also runs without an account. Each course states its own access conditions.",
      },
      {
        question: "Who is responsible for the content?",
        answerBeforeLink:
          "Tim Löhr develops and reviews the platform. Background and contact details are on the ",
        linkLabel: "About Tim Löhr page",
        answerAfterLink: ".",
      },
    ],
    nextHeading: "Next step",
    nextIndex: "01 / Selection",
    primaryLabel: "Assess your level",
    primaryTitle: "AI check",
    primaryMeta: "about 5 minutes",
    primaryBody:
      "{count} questions, then a reasoned course recommendation that stays in your browser.",
    primaryCta: "Start the AI check",
    courseLabel: "Review a foundation course",
    courseTitle: "Everyday AI Literacy",
    courseBody:
      "Which data may go into an AI tool and how to check answers.",
    courseCta: "Open the course",
    primerLabel: "Continue reading",
    primerTitle: "Blog",
    primerBody:
      "Articles with sources on everyday AI, regulation and social impact.",
    primerCta: "Open the blog",
  },
} as const satisfies Localized<Record<string, unknown>>;

export const HELP_COPY = {
  de: {
    metadata: {
      title: "Hilfe und häufige Fragen",
      description:
        "Antworten zu Zugang, Lernfortschritt, Abschlussdokumenten, Büchern und deinen Daten auf loehrning.ai.",
    },
    eyebrow: "Hilfe / Referenz",
    title: "Hilfe und häufige Fragen",
    intro:
      "Kurze Antworten zu Zugang, Fortschritt, Abschluss und Daten.",
    indexLabel: "Themen auf dieser Seite",
    topics: [
      "Einstieg",
      "Konto und Zugang",
      "Lokaler Fortschritt",
      "Anmeldung",
      "Mehrere Geräte",
      "Quiz",
      "Abschlussdokumente",
      "Praxisbeispiele",
      "Bücher",
      "Datenverwaltung",
      "Fehler melden",
      "Einschränkungen",
    ],
    faqHeading: "Antworten",
    updatesHeading: "Inhaltsänderungen",
    updatesEyebrow: "Änderungen",
    updatesBody: "Veröffentlichte Änderungen stehen unter",
    updatesLink: "Neuigkeiten",
    questions: {
      start: "Wo fange ich an?",
      account: "Warum brauche ich ein Konto?",
      progress: "Mein Lernfortschritt ist weg.",
      signIn: "Wie melde ich mich an?",
      devices: "Kann ich auf mehreren Geräten lernen?",
      quiz: "Wie funktionieren Quiz und Neuversuche?",
      records: "Was bedeuten die Abschlussdokumente?",
      simulations: "Was ist ein Praxisbeispiel oder eine Sandbox?",
      books: "Bücher: Was kann ich lesen oder herunterladen?",
      data: "Wie lösche ich mein Konto oder exportiere meine Daten?",
      feedback: "Wo melde ich einen Fehler oder gebe Rückmeldung?",
      limits: "Welche Einschränkungen sind bekannt?",
    },
    answers: {
      startBeforeCheck: "Fang mit dem ",
      startCheckLink: "KI-Check",
      startBetween:
        " an: Er dauert etwa 5 Minuten und empfiehlt dir einen Kurs. Alle {courseCount} Kurse stehen in der ",
      startCatalogLink: "Kursübersicht",
      startAfterCatalog: ".",
      accountAvailable:
        "Bücher, Praxisbeispiele, KI-Check und 6 technische Kursreader laufen ohne Konto, die 4 Grundlagenkurse nur mit Lernkonto. Das Konto synchronisiert Fortschritt über deine Geräte.",
      accountUnavailable:
        "Bücher, Praxisbeispiele, KI-Check und 6 technische Kursreader laufen ohne Konto, die 4 Grundlagenkurse nur mit Lernkonto. Hier sind diese 4 Reader vorübergehend nicht erreichbar.",
      progressSynced:
        "Dein Fortschritt liegt im Browser und mit angemeldetem Lernkonto auch auf dem Server. Was den lokalen Stand löschen kann, steht unten unter „Einschränkungen“.",
      progressLocal:
        "Dein Fortschritt liegt nur in diesem Browser. Was ihn löschen kann, steht unten unter „Einschränkungen“.",
      signInBoth:
        "Die Login-Seite bietet Google und einen Einmal-Link per E-Mail. Ist ein Link abgelaufen oder benutzt, fordere einen neuen an und prüfe den Spam-Ordner.",
      signInGoogle:
        "Die Login-Seite bietet aktuell Google-Anmeldung. Der Einmal-Link per E-Mail ist hier nicht freigeschaltet.",
      signInMagic:
        "Die Login-Seite bietet aktuell einen Einmal-Link per E-Mail. Ist er abgelaufen oder benutzt, fordere einen neuen an und prüfe den Spam-Ordner.",
      signInUnavailable:
        "Aktuell ist keine Anmeldemethode freigeschaltet. Öffentliche Kurse, Bücher, Praxisbeispiele und der KI-Check funktionieren ohne Anmeldung.",
      devicesSynced:
        "Ja. Mit angemeldetem Lernkonto wird dein Fortschritt synchronisiert, ohne Anmeldung hat jedes Gerät seinen eigenen Stand.",
      devicesLocal:
        "Ja, aber jedes Gerät hat seinen eigenen Stand. Eine Synchronisierung gibt es aktuell nicht.",
      quiz: "Quizze laufen ohne Zeitdruck, und jeder Versuch zeigt eine Erklärung. Je nach Kurs zählt als Abschluss das bestandene Abschlussquiz, eine eingereichte Aufgabe oder alle Lektionen.",
      recordsBeforeLimits:
        "loehrning.ai stellt sie selbst aus, für einen hier abgeschlossenen Kurs. ",
      recordsLimitsLink:
        "Sie sind nicht servergeprüft und allein kein Nachweis für Artikel 4 der KI-Verordnung.",
      recordsAfterLimits: "",
      simulations:
        "Ein Praxisbeispiel erklärt ein Konzept mit synthetischen Daten und simulierten Abläufen. Seine Grenzen stehen unten unter „Einschränkungen“.",
      oneBookAvailable:
        "Das Buch ist kostenlos im Browser lesbar, mit Lernkonto auch als PDF. Es ist Lernmaterial, keine zitierfähige Rechtsquelle.",
      oneBookUnavailable:
        "Das Buch ist kostenlos im Browser lesbar und ist Lernmaterial, keine zitierfähige Rechtsquelle. Ein PDF-Download ist aktuell nicht verfügbar.",
      manyBooks:
        "Alle {bookCount} Bücher sind kostenlos im Browser lesbar. Sie sind Lernmaterialien, keine zitierfähigen Rechtsquellen.",
      dataAvailableBeforeLink: "Datenexport und Kontolöschung stehen unter ",
      dataLink: "Datenschutz und Datenverwaltung",
      dataAvailableAfterLink:
        ". Datenschutzanfragen gehen auch per E-Mail an tim@loehrning.ai.",
      dataUnavailable:
        "Ohne Lernkonto löschst du lokalen Fortschritt über die Website-Daten deines Browsers. Datenschutzanfragen gehen an tim@loehrning.ai.",
      feedbackAvailableBeforeLink: "Nutze das ",
      feedbackLink: "Feedback-Formular",
      feedbackAvailableAfterLink:
        ". Es ist ohne Konto nutzbar und fragt keine E-Mail-Adresse ab.",
      feedbackUnavailable:
        "Das Feedback-Formular ist deaktiviert. Fehler und Rückmeldungen gehen per E-Mail an tim@loehrning.ai.",
    },
  },
  en: {
    metadata: {
      title: "Help and frequently asked questions",
      description:
        "Answers about access, learning progress, completion documents, books and your data on loehrning.ai.",
    },
    eyebrow: "Help / Reference",
    title: "Help and frequently asked questions",
    intro:
      "Short answers about access, progress, completion and data.",
    indexLabel: "Topics on this page",
    topics: [
      "Starting point",
      "Account and access",
      "Local progress",
      "Sign-in",
      "Multiple devices",
      "Quizzes",
      "Completion documents",
      "Practical examples",
      "Books",
      "Data management",
      "Report an error",
      "Limitations",
    ],
    faqHeading: "Answers",
    updatesHeading: "Content changes",
    updatesEyebrow: "Changes",
    updatesBody: "Published changes are listed under",
    updatesLink: "What's new",
    questions: {
      start: "Where should I start?",
      account: "Why do I need an account?",
      progress: "My learning progress has disappeared.",
      signIn: "How do I sign in?",
      devices: "Can I learn on more than one device?",
      quiz: "How do quizzes and retries work?",
      records: "What do the completion documents mean?",
      simulations: "What is a practical example or sandbox?",
      books: "Books: what can I read or download?",
      data: "How do I delete my account or export my data?",
      feedback: "Where can I report an error or send feedback?",
      limits: "Which limitations are known?",
    },
    answers: {
      startBeforeCheck: "Start with the ",
      startCheckLink: "AI check",
      startBetween:
        ": it takes about 5 minutes and recommends a course. All {courseCount} courses are listed in the ",
      startCatalogLink: "course catalog",
      startAfterCatalog: ".",
      accountAvailable:
        "Books, practical examples, the AI check and 6 technical courses need no account, the 4 foundation courses do. An account syncs progress across your devices.",
      accountUnavailable:
        "Books, practical examples, the AI check and 6 technical courses need no account, the 4 foundation courses do. Here those 4 are temporarily unavailable.",
      progressSynced:
        "Progress is stored in your browser and, when signed in, on the server. Limitations below lists what can remove the local copy.",
      progressLocal:
        "Progress is stored only in this browser. What can remove it is listed under Limitations below.",
      signInBoth:
        "The sign-in page offers Google and a one-time email link. If a link has expired or was used, request a new one and check spam.",
      signInGoogle:
        "The sign-in page currently offers Google sign-in. One-time email links are not enabled here.",
      signInMagic:
        "The sign-in page offers a one-time email link. If it has expired or was used, request a new one and check spam.",
      signInUnavailable:
        "No sign-in method is currently enabled. Public courses, books, demos and the AI check work without signing in.",
      devicesSynced:
        "Yes. A signed-in learning account syncs your progress, otherwise each device keeps its own state.",
      devicesLocal:
        "Yes, but each device keeps its own state. Syncing is not currently available.",
      quiz: "Quizzes have no time limit, and each try shows an explanation. By course, completion means passing the final quiz, submitting a task or finishing all lessons.",
      recordsBeforeLimits:
        "loehrning.ai issues them itself for a course completed here. ",
      recordsLimitsLink:
        "They are not server-verified and alone are no proof of Article 4 AI Act compliance.",
      recordsAfterLimits: "",
      simulations:
        "A practical example explains a concept with synthetic data and simulated processes. Its limits are listed under Limitations below.",
      oneBookAvailable:
        "The book is free to read in the browser, and as a PDF when signed in. It is learning material, not a citable legal source.",
      oneBookUnavailable:
        "The book is free to read in the browser and is learning material, not a citable legal source. No PDF download is currently available.",
      manyBooks:
        "All {bookCount} books are free to read in the browser. They are learning materials, not citable legal sources.",
      dataAvailableBeforeLink:
        "Data export and account deletion are available under ",
      dataLink: "Privacy and data management",
      dataAvailableAfterLink:
        ". You can also email privacy requests to tim@loehrning.ai.",
      dataUnavailable:
        "Without a learning account, remove local progress through your browser's site data. Send privacy requests to tim@loehrning.ai.",
      feedbackAvailableBeforeLink: "Use the ",
      feedbackLink: "feedback form",
      feedbackAvailableAfterLink:
        ". It works without an account and does not request an email address.",
      feedbackUnavailable:
        "The feedback form is disabled. Send error reports and feedback to tim@loehrning.ai.",
    },
  },
} as const satisfies Localized<Record<string, unknown>>;

/**
 * The retired `/bekannte-grenzen` route now lands on Hilfe. Keep its complete
 * safety record here so that route retirement does not compress five distinct
 * limitations into a generic disclaimer.
 */
export const HELP_LIMITATIONS_COPY = {
  de: {
    intro:
      "Jede Grenze nennt, was sie bedeutet und was du als Nächstes prüfst.",
    scopeLabel: "Grenze",
    consequenceLabel: "Was du tun kannst:",
    sourceLabel: "Amtliche Quelle zum Rechtsstand",
    reviewedLabel: "Rechtsstand geprüft",
    reviewedDate: "8. August 2026",
    limitations: {
      record: {
        title: "Selbst ausgestellte Abschlussdokumente",
        description:
          "Abschlussdokumente entstehen in deinem Browser, ohne Serverprüfung, Signatur oder Zertifizierungsstelle. Allein belegen sie nicht, dass eine Organisation Artikel 4 der KI-Verordnung erfüllt.",
        mitigation:
          "Behandle sie als persönliche Lernaufzeichnung. Welche Nachweise Artikel 4 genügen, entscheidet deine Organisation mit rechtlicher Prüfung.",
      },
      simulations: {
        title: "Simulierte Praxisbeispiele",
        description:
          "Praxisbeispiele und Sandboxen nutzen synthetische Daten und simulierte Schnittstellen. Sie senden keine echten E-Mails und berühren keine Produktivsysteme oder Kundendaten.",
        mitigation:
          "Nutze die Beispiele, um den Ablauf zu verstehen. Vor echtem Einsatz prüfst du Anbieter-Doku, Datenflüsse, Berechtigungen, Protokolle und interne Freigaben.",
      },
      freshness: {
        title: "Keine Echtzeit-Aktualisierung",
        description:
          "Recht, Produkte, Preise und Statistiken ändern sich, und die Plattform überwacht Quellen nicht laufend. Ein Prüfdatum sagt nur, wann geprüft wurde.",
        mitigation:
          "Prüfe vor Entscheidungen die aktuelle Primärquelle, für EU-Recht EUR-Lex und das Amtsblatt.",
      },
      progress: {
        title: "Lokaler Lernfortschritt ohne Anmeldung",
        description:
          "Ohne Anmeldung liegt der Fortschritt im Browser. Gelöschte Website-Daten, private Tabs, ein anderer Browser oder ein anderes Gerät können ihn entfernen.",
        mitigationAvailable:
          "Mit angemeldetem Lernkonto liegt der Fortschritt auch auf dem Server. Der lokale Stand hängt weiter an den Website-Daten des Browsers.",
        mitigationUnavailable:
          "Sichere wichtige Ergebnisse sofort; der lokale Stand ist kein Backup.",
      },
      books: {
        title: "Lernbücher sind keine Primärquellen",
        descriptionOne:
          "Jedes Lernbuch ist eine redaktionell bearbeitete Lernfassung, kein amtliches Dokument, keine zitierfähige Rechtsquelle und kein Ersatz für Rechtsberatung.",
        descriptionMany:
          "Die {bookCount} Bücher sind redaktionell bearbeitete Lernfassungen, keine amtlichen Dokumente, keine zitierfähigen Rechtsquellen und kein Ersatz für Rechtsberatung.",
        mitigation:
          "Bei Rechtsfragen zählen der konsolidierte Rechtsakt und das Amtsblatt auf EUR-Lex. Vor einer rechtlichen Entscheidung hol dir qualifizierte Beratung.",
      },
    },
  },
  en: {
    intro:
      "Each limitation states what it means and what you check next.",
    scopeLabel: "Limitation",
    consequenceLabel: "What you can do:",
    sourceLabel: "Official source for the legal position",
    reviewedLabel: "Legal position reviewed",
    reviewedDate: "8 August 2026",
    limitations: {
      record: {
        title: "Self-issued completion documents",
        description:
          "Your browser creates completion documents with no server check, signature or certifier. Alone they do not prove an organisation meets AI Act Article 4.",
        mitigation:
          "Treat them as a personal learning record. Your organisation decides, with legal review, which evidence meets Article 4.",
      },
      simulations: {
        title: "Simulated practical examples",
        description:
          "Practical examples and sandboxes use synthetic data and simulated interfaces. They send no real email and touch no production systems or customer data.",
        mitigation:
          "Use the examples to understand the process. Before real use, check provider docs, data flows, permissions, logs and internal approvals.",
      },
      freshness: {
        title: "No real-time updates",
        description:
          "Law, products, prices and statistics change, and the platform does not monitor sources continuously. A review date only says when the check happened.",
        mitigation:
          "Check the current primary source before a decision, for EU law EUR-Lex and the Official Journal.",
      },
      progress: {
        title: "Local learning progress without sign-in",
        description:
          "Without signing in, progress is stored in the browser. Clearing site data, private tabs, another browser or another device can remove it.",
        mitigationAvailable:
          "With a signed-in learning account, progress is also stored on the server. The local copy still depends on the browser's site data.",
        mitigationUnavailable:
          "Save important results right away; local progress is not a backup.",
      },
      books: {
        title: "Learning books are not primary sources",
        descriptionOne:
          "Each learning book is an edited learning edition, not an official document, a citable legal source or a substitute for legal advice.",
        descriptionMany:
          "The {bookCount} books are edited learning editions, not official documents, citable legal sources or substitutes for legal advice.",
        mitigation:
          "For legal questions, the consolidated act and the Official Journal on EUR-Lex apply. Get qualified advice before a legal decision.",
      },
    },
  },
} as const satisfies Localized<Record<string, unknown>>;

export const NEWS_COPY = {
  de: {
    metadata: {
      title: "Neuigkeiten und Inhaltsänderungen",
      description:
        "Datierte Veröffentlichungen, Inhaltsänderungen und Korrekturen auf loehrning.ai.",
    },
    eyebrow: "Änderungsprotokoll",
    title: "Was ist neu",
    intro:
      "Datierte Hinweise zu neuen Inhalten und Änderungen.",
    statusLabel: "Einträge",
    statusValue: "{count} dokumentiert",
    sourceLabel: "Quelle",
    sourceValue: "Redaktionelles Changelog",
    catalogLink: "Aktuellen Kurskatalog öffnen",
  },
  en: {
    metadata: {
      title: "Updates and content changes",
      description:
        "Dated releases, content changes, and corrections on loehrning.ai.",
    },
    eyebrow: "Change log",
    title: "What's new",
    intro:
      "Dated notes on new material and changes.",
    statusLabel: "Entries",
    statusValue: "{count} documented",
    sourceLabel: "Source",
    sourceValue: "Editorial changelog",
    catalogLink: "Open the current course catalog",
  },
} as const satisfies Localized<Record<string, unknown>>;

export const FEEDBACK_COPY = {
  de: {
    metadata: {
      title: "Rückmeldung",
      description:
        "Fehler oder Unklarheiten auf loehrning.ai melden. Das Formular fragt weder Name noch E-Mail-Adresse ab.",
    },
    eyebrow: "Rückmeldung / Beta",
    title: "Rückmeldung zu Fehlern oder Unklarheiten",
    introAvailable:
      "Das Formular fragt weder Namen noch E-Mail-Adresse ab, eine Antwort ist also nicht möglich. Gib keine personenbezogenen, vertraulichen oder urheberrechtlich geschützten Inhalte ein.",
    introUnavailable:
      "Das Formular ist hier nicht freigeschaltet.",
    emailBefore: "Direkter Kontakt: ",
    boundaryHeading: "Was gesendet wird",
    boundaryEyebrow: "01 / Datenumfang",
    boundaryItems: [
      "Kategorie und Nachricht",
      "Optional: Pfad der vorherigen Seite auf loehrning.ai",
      "Keine eigenen Felder für Name oder E-Mail-Adresse",
      "Keine Anfrageparameter oder URL-Fragmente im Seitenpfad",
    ],
    disabledStatus:
      "Hier wird nichts gespeichert. Schick deine Rückmeldung per E-Mail.",
    disabledCodeLabel: "Status / Formular deaktiviert",
    form: {
      categoryLegend: "Art der Rückmeldung",
      categories: [
        { value: "inhalt", label: "Inhaltsfehler oder Unklarheit" },
        { value: "technik", label: "Technisches Problem" },
        { value: "lernweg", label: "Lernweg oder Bedienung" },
        { value: "sonstiges", label: "Sonstiges" },
      ],
      messageLabel: "Nachricht",
      requirement: "mindestens 10 Zeichen",
      placeholder: "Beispiel: Die Quellenangabe in Abschnitt 2 ist unklar …",
      validationError: "Gib mindestens 10 Zeichen ein.",
      genericError:
        "Die Rückmeldung konnte nicht gesendet werden. Sende sie stattdessen an tim@loehrning.ai.",
      rateLimitError:
        "Das Sendelimit für 24 Stunden ist erreicht. Sende die Rückmeldung stattdessen an tim@loehrning.ai.",
      successTitle: "Rückmeldung gespeichert",
      successBody:
        "Die Nachricht wurde ohne Kontaktdaten gespeichert. Korrekturen stehen unter Neuigkeiten.",
      sending: "Wird gesendet…",
      submit: "Rückmeldung senden",
      privacyNote: "Ohne Konto nutzbar. Keine personenbezogenen Daten eingeben.",
    },
  },
  en: {
    metadata: {
      title: "Feedback",
      description:
        "Report an error or unclear passage on loehrning.ai. The form requests neither a name nor an email address.",
    },
    eyebrow: "Feedback / Beta",
    title: "Report an error or unclear passage",
    introAvailable:
      "The form does not ask for a name or email address, so a reply is not possible. Do not enter personal, confidential or copyrighted material.",
    introUnavailable:
      "The form is not enabled here.",
    emailBefore: "Direct contact: ",
    boundaryHeading: "Data submitted",
    boundaryEyebrow: "01 / Scope",
    boundaryItems: [
      "Category and message",
      "Optional: path of the previous page on loehrning.ai",
      "No dedicated name or email fields",
      "No query parameters or URL fragments in the page path",
    ],
    disabledStatus:
      "Nothing is stored here. Send your feedback by email.",
    disabledCodeLabel: "Status / Form disabled",
    form: {
      categoryLegend: "Feedback category",
      categories: [
        { value: "inhalt", label: "Content error or unclear passage" },
        { value: "technik", label: "Technical problem" },
        { value: "lernweg", label: "Learning path or interface" },
        { value: "sonstiges", label: "Other" },
      ],
      messageLabel: "Message",
      requirement: "at least 10 characters",
      placeholder: "Example: The source in section 2 is unclear …",
      validationError: "Enter at least 10 characters.",
      genericError:
        "The feedback could not be sent. Send it to tim@loehrning.ai instead.",
      rateLimitError:
        "The 24-hour submission limit has been reached. Send the feedback to tim@loehrning.ai instead.",
      successTitle: "Feedback stored",
      successBody:
        "The message was stored without contact details. Corrections are listed under Updates.",
      sending: "Sending…",
      submit: "Send feedback",
      privacyNote: "Works without an account. Do not enter personal data.",
    },
  },
} as const satisfies Localized<Record<string, unknown>>;
