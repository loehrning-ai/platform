import type { Locale } from "./locale";

type Localized<T> = Readonly<Record<Locale, T>>;

export const ENTRY_COPY = {
  de: {
    metadata: {
      title: "Was ist KI? Ein Einstieg ohne Vorwissen",
      description:
        "Eine 10-minütige Einführung in Künstliche Intelligenz: Arbeitsdefinition, Alltagsbeispiele, Grenzen und nächste Lernschritte. Ohne Konto.",
    },
    eyebrow: "Grundlagen / 01",
    title: "Was ist Künstliche Intelligenz?",
    intro:
      "Eine Arbeitsdefinition, drei Beispiele und die wichtigste Grenze. Für diesen Einstieg brauchst du weder Vorwissen noch ein Konto.",
    facts: ["10 Minuten", "Ohne Konto", "Keine Vorkenntnisse"],
    definitionIndex: "01 / Definition",
    definitionHeading: "Eine brauchbare Arbeitsdefinition",
    definition:
      "KI-Systeme verarbeiten Eingaben und leiten daraus Ausgaben wie Vorhersagen, Inhalte, Empfehlungen oder Entscheidungen ab. Welche Ausgaben entstehen, hängt vom Modell, seinen Daten und seinem Einsatzkontext ab.",
    definitionSourceLabel: "Zur Einordnung",
    definitionSource:
      "Das ist eine vereinfachte Arbeitsdefinition. Die rechtliche Definition eines KI-Systems in Artikel 3 der EU-KI-Verordnung ist ausführlicher und für Rechtsfragen maßgeblich.",
    examplesHeading: "Drei Anwendungen aus dem Alltag",
    examplesIndex: "02 / Beispiele",
    examplesIntro:
      "Der Begriff KI beschreibt unterschiedliche Verfahren. Diese Beispiele zeigen drei typische Aufgaben: klassifizieren, schätzen und ordnen.",
    examples: [
      {
        id: "gesicht",
        number: "01",
        heading: "Gesichtserkennung",
        task: "Klassifizieren",
        body: "Beim Entsperren vergleicht das Gerät Merkmale des aufgenommenen Gesichts mit einem hinterlegten Muster. Das Ergebnis ist eine Wahrscheinlichkeitsaussage, keine Gewissheit.",
      },
      {
        id: "route",
        number: "02",
        heading: "Routenplanung",
        task: "Schätzen",
        body: "Navigationsdienste verbinden Kartendaten, aktuelle Verkehrssignale und gelernte Verkehrsmuster. Daraus schätzen sie Fahrzeiten und schlagen Routen vor.",
      },
      {
        id: "empfehlungen",
        number: "03",
        heading: "Medienempfehlungen",
        task: "Ordnen",
        body: "Empfehlungssysteme ordnen Inhalte anhand beobachteter Nutzungsmuster. Sie kennen weder deine Absicht noch deinen Geschmack vollständig und können bestehende Muster verstärken.",
      },
    ],
    boundaryLabel: "Die wichtigste Grenze",
    boundaryHeading: "Ein plausibles Ergebnis kann falsch sein.",
    boundaryBody:
      "Ein Modell prüft seine Ausgabe nicht automatisch gegen die Wirklichkeit. Bei wichtigen Entscheidungen brauchst du Quellen, fachliche Prüfung und einen klaren Verantwortlichen.",
    faqHeading: "Drei kurze Antworten",
    faqIndex: "03 / Fragen",
    faqs: [
      {
        question: "Brauche ich Programmierkenntnisse?",
        answer:
          "Nein. Diese Einführung und der KI-Check setzen kein technisches Vorwissen voraus.",
      },
      {
        question: "Ist dieser Einstieg kostenlos?",
        answer:
          "Ja. Diese Seite und der KI-Check sind ohne Konto zugänglich. Einzelne Kursreader haben eigene, offen ausgewiesene Zugangsbedingungen.",
      },
      {
        question: "Wer verantwortet die Inhalte?",
        answerBeforeLink:
          "Tim Löhr entwickelt und prüft die Plattform. Beruflicher Hintergrund, redaktioneller Ansatz und Kontakt stehen auf der ",
        linkLabel: "Seite über Tim Löhr",
        answerAfterLink: ".",
      },
    ],
    nextHeading: "Nächster Schritt",
    nextIndex: "04 / Auswahl",
    nextIntro:
      "Wähle nach deinem Ziel. Der KI-Check ordnet deinen Stand ein; die anderen Wege beginnen direkt mit Lernstoff.",
    primaryLabel: "Stand einordnen",
    primaryTitle: "KI-Check",
    primaryMeta: "ca. 5 Minuten",
    primaryBody:
      "{count} Fragen führen zu einer begründeten Kursempfehlung. Das Ergebnis bleibt in diesem Browser.",
    primaryCta: "KI-Check starten",
    courseLabel: "Grundkurs ansehen",
    courseTitle: "KI-Führerschein",
    courseBody:
      "Die Kursübersicht erklärt Inhalte, Umfang und Zugangsbedingungen vor dem Start.",
    courseCta: "Kursübersicht öffnen",
    primerLabel: "Weiterlesen",
    primerTitle: "Blog",
    primerBody:
      "Quellenbasierte Artikel erklären KI im Alltag, Regulierung und gesellschaftliche Folgen.",
    primerCta: "Blog öffnen",
  },
  en: {
    metadata: {
      title: "What is AI? An introduction without prerequisites",
      description:
        "A 10-minute introduction to artificial intelligence: a working definition, everyday examples, limitations, and next learning steps. No account required.",
    },
    eyebrow: "Foundations / 01",
    title: "What is artificial intelligence?",
    intro:
      "A working definition, three examples, and the main limitation. This introduction requires no prior knowledge and no account.",
    facts: ["10 minutes", "No account", "No prerequisites"],
    definitionIndex: "01 / Definition",
    definitionHeading: "A useful working definition",
    definition:
      "AI systems process inputs and infer outputs such as predictions, content, recommendations, or decisions. The output depends on the model, its data, and the context in which it is used.",
    definitionSourceLabel: "Context",
    definitionSource:
      "This is a simplified working definition. The legal definition of an AI system in Article 3 of the EU AI Act is more detailed and governs legal questions.",
    examplesHeading: "Three everyday applications",
    examplesIndex: "02 / Examples",
    examplesIntro:
      "AI covers different methods. These examples show three common tasks: classification, estimation, and ranking.",
    examples: [
      {
        id: "gesicht",
        number: "01",
        heading: "Face recognition",
        task: "Classify",
        body: "When unlocking a device, the system compares features from the captured face with a stored pattern. The result is probabilistic, not certain.",
      },
      {
        id: "route",
        number: "02",
        heading: "Route planning",
        task: "Estimate",
        body: "Navigation services combine map data, current traffic signals, and learned traffic patterns. They use this information to estimate journey times and suggest routes.",
      },
      {
        id: "empfehlungen",
        number: "03",
        heading: "Media recommendations",
        task: "Rank",
        body: "Recommendation systems rank content using observed usage patterns. They do not fully know your intent or preferences, and they can reinforce existing patterns.",
      },
    ],
    boundaryLabel: "The main limitation",
    boundaryHeading: "A plausible output can still be wrong.",
    boundaryBody:
      "A model does not automatically check its output against reality. Important decisions require sources, subject-matter review, and a clearly responsible person.",
    faqHeading: "Three short answers",
    faqIndex: "03 / Questions",
    faqs: [
      {
        question: "Do I need programming skills?",
        answer:
          "No. This introduction and the AI check require no technical background.",
      },
      {
        question: "Is this introduction free?",
        answer:
          "Yes. This page and the AI check are available without an account. Individual course readers state their own access conditions before entry.",
      },
      {
        question: "Who is responsible for the content?",
        answerBeforeLink:
          "Tim Löhr develops and reviews the platform. His professional background, editorial approach, and contact details are on the ",
        linkLabel: "About Tim Löhr page",
        answerAfterLink: ".",
      },
    ],
    nextHeading: "Next step",
    nextIndex: "04 / Selection",
    nextIntro:
      "Choose by objective. The AI check assesses your current level; the other routes begin directly with learning material.",
    primaryLabel: "Assess your level",
    primaryTitle: "AI check",
    primaryMeta: "about 5 minutes",
    primaryBody:
      "{count} questions lead to a reasoned course recommendation. The result stays in this browser.",
    primaryCta: "Start the AI check",
    courseLabel: "Review a foundation course",
    courseTitle: "AI Fundamentals",
    courseBody:
      "The course overview states its content, scope, and access conditions before you begin.",
    courseCta: "Open the course overview",
    primerLabel: "Continue reading",
    primerTitle: "Blog",
    primerBody:
      "Source-backed articles examine everyday AI, regulation, and social consequences.",
    primerCta: "Open the blog",
  },
} as const satisfies Localized<Record<string, unknown>>;

export const HELP_COPY = {
  de: {
    metadata: {
      title: "Hilfe und häufige Fragen",
      description:
        "Antworten zu Einstieg, Kurszugang, Lernfortschritt, Abschlussdokumenten, Büchern, Simulationen und Datenverwaltung auf loehrning.ai.",
    },
    eyebrow: "Hilfe / Referenz",
    title: "Hilfe und häufige Fragen",
    intro:
      "Kurze Antworten zu Zugang, Fortschritt, Abschluss und Daten. Die Angaben zur Anmeldung richten sich nach der aktuell verfügbaren Serverkonfiguration.",
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
    updatesLink: "/neuigkeiten",
    questions: {
      start: "Wo fange ich an?",
      account: "Warum brauche ich ein Konto?",
      progress: "Mein Lernfortschritt ist weg.",
      signIn: "Wie melde ich mich an?",
      devices: "Kann ich auf mehreren Geräten lernen?",
      quiz: "Wie funktionieren Quiz und Neuversuche?",
      records: "Was bedeuten Teilnahmebestätigung und Lernnachweis?",
      simulations: "Was ist ein Praxisbeispiel oder eine Sandbox?",
      books: "Bücher: Was kann ich lesen oder herunterladen?",
      data: "Wie lösche ich mein Konto oder exportiere meine Daten?",
      feedback: "Wo melde ich einen Fehler oder gebe Rückmeldung?",
      limits: "Welche Einschränkungen sind bekannt?",
    },
    answers: {
      startBeforeCheck: "Der ",
      startCheckLink: "KI-Check",
      startBetween:
        " dauert etwa 5 Minuten und ordnet deinen Ausgangspunkt ein. Alle {courseCount} Kurse stehen in der ",
      startCatalogLink: "Kursübersicht",
      startAfterCatalog: ".",
      accountAvailable:
        "Bücher, Demos, KI-Check und 6 technische Kursreader funktionieren ohne Konto. 4 Grundlagen-Kursreader erfordern ein kostenloses Lernkonto. Das Konto synchronisiert Fortschritt und Abschlussstatus zwischen Geräten. Abschlussdokumente bleiben selbst ausgestellt und sind nicht servergeprüft.",
      accountUnavailable:
        "Bücher, Demos, KI-Check und 6 technische Kursreader funktionieren ohne Konto. 4 Grundlagen-Kursreader erfordern ein Lernkonto. Da aktuell keine vollständig freigeschaltete Anmeldemethode vorliegt, sind diese 4 Reader vorübergehend nicht erreichbar.",
      progressSynced:
        "Fortschritt wird zuerst im Browser gespeichert und bei angemeldetem Lernkonto zusätzlich serverseitig synchronisiert. Gelöschte Website-Daten, private Tabs oder ein anderer Browser können den lokalen Stand entfernen.",
      progressLocal:
        "Fortschritt wird nur im Browser gespeichert. Gelöschte Website-Daten, private Tabs oder ein anderes Gerät können diesen Stand entfernen. Serverseitige Synchronisierung ist aktuell nicht verfügbar.",
      signInBoth:
        "Die Login-Seite bietet Google-Anmeldung und einen Einmal-Link per E-Mail. Einmal-Links laufen ab und sind nur einmal nutzbar. Fordere bei einem abgelaufenen Link einen neuen an und prüfe den Spam-Ordner.",
      signInGoogle:
        "Die Login-Seite bietet aktuell Google-Anmeldung. Der Einmal-Link per E-Mail ist in dieser Konfiguration nicht freigeschaltet.",
      signInMagic:
        "Die Login-Seite bietet aktuell einen Einmal-Link per E-Mail. Der Link läuft ab und ist nur einmal nutzbar. Fordere bei einem abgelaufenen Link einen neuen an und prüfe den Spam-Ordner.",
      signInUnavailable:
        "Aktuell ist keine Anmeldemethode vollständig freigeschaltet. Öffentliche Kurse, Bücher, Demos und der KI-Check bleiben ohne Anmeldung erreichbar.",
      devicesSynced:
        "Ja. Bei einem angemeldeten Lernkonto wird der Kursfortschritt synchronisiert. Ohne Anmeldung verwaltet jedes Gerät einen eigenen lokalen Stand.",
      devicesLocal:
        "Ja, aber jedes Gerät verwaltet einen eigenen lokalen Stand. Eine geräteübergreifende Synchronisierung ist aktuell nicht verfügbar.",
      quiz: "Quizze lassen sich wiederholen; es gibt keinen Zeitdruck. Nach dem Absenden siehst du Ergebnis und Erklärung. Je nach Kurs gilt ein bestandenes Abschlussquiz, eine eingereichte Abschlussaufgabe oder der Abschluss aller Lektionen als Kursabschluss.",
      recordsBeforeLimits:
        "Diese selbst ausgestellten Dokumente halten einen Abschluss innerhalb der Plattform fest. Je nach Kurs beruhen sie auf einem Quiz, einer eingereichten Aufgabe oder abgeschlossenen Lektionen. ",
      recordsLimitsLink:
        "Sie sind nicht servergeprüft und belegen für sich allein keine Erfüllung von Artikel 4 der EU-KI-Verordnung.",
      recordsAfterLimits: "",
      simulations:
        "Interaktive Praxisbeispiele verwenden synthetische Daten und simulierte Abläufe. Sie versenden keine echten E-Mails, rufen keine produktiven Drittanbieter-APIs auf und verarbeiten keine echten Kundendaten. Sie erklären ein Konzept; sie sind kein produktives System.",
      oneBookAvailable:
        "Das Buch ist kostenlos im Browser lesbar. Angemeldete Nutzer können die angebotene PDF-Datei herunterladen. Das Buch ist Lernmaterial, keine zitierfähige Rechtsquelle.",
      oneBookUnavailable:
        "Das Buch ist kostenlos im Browser lesbar. Der kontogebundene PDF-Download ist aktuell nicht verfügbar. Das Buch ist Lernmaterial, keine zitierfähige Rechtsquelle.",
      manyBooks:
        "Alle {bookCount} Bücher sind kostenlos im Browser lesbar. Sie sind Lernmaterialien, keine zitierfähigen Rechtsquellen.",
      dataAvailableBeforeLink: "Datenexport und Kontolöschung stehen unter ",
      dataLink: "Datenschutz und Datenverwaltung",
      dataAvailableAfterLink:
        ". Datenschutzanfragen sind zusätzlich per E-Mail an tim@loehrning.ai möglich.",
      dataUnavailable:
        "Aktuell ist kein nutzbares serverseitiges Lernkonto freigeschaltet. Lokalen Fortschritt entfernst du über die Website-Daten deines Browsers. Datenschutzanfragen gehen an tim@loehrning.ai.",
      feedbackAvailableBeforeLink: "Nutze das ",
      feedbackLink: "Feedback-Formular",
      feedbackAvailableAfterLink:
        ". Es ist ohne Konto nutzbar und fragt keine E-Mail-Adresse ab.",
      feedbackUnavailable:
        "Das serverseitige Feedback-Formular ist deaktiviert. Fehler und Rückmeldungen gehen per E-Mail an tim@loehrning.ai.",
      limitsBeforeLink: "Bekannte Einschränkungen: ",
      limitsLink:
        "Abschlussdokumente sind selbst ausgestellt, Praxisbeispiele simuliert, Inhalte an einen ausgewiesenen Prüfstand gebunden und Fortschritt kann nur lokal gespeichert sein",
      limitsAfterLink:
        ". Die jeweilige Kurs- oder Ressourcenseite weist die konkrete Grenze aus.",
    },
  },
  en: {
    metadata: {
      title: "Help and frequently asked questions",
      description:
        "Answers about course access, learning progress, completion records, books, simulations, and data management on loehrning.ai.",
    },
    eyebrow: "Help / Reference",
    title: "Help and frequently asked questions",
    intro:
      "Short answers about access, progress, completion, and data. Sign-in information reflects the server configuration currently available.",
    indexLabel: "Topics on this page",
    topics: [
      "Starting point",
      "Account and access",
      "Local progress",
      "Sign-in",
      "Multiple devices",
      "Quizzes",
      "Completion records",
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
    updatesLink: "/en/neuigkeiten",
    questions: {
      start: "Where should I start?",
      account: "Why do I need an account?",
      progress: "My learning progress has disappeared.",
      signIn: "How do I sign in?",
      devices: "Can I learn on more than one device?",
      quiz: "How do quizzes and retries work?",
      records: "What are participation records and learning records?",
      simulations: "What is a practical example or sandbox?",
      books: "Books: what can I read or download?",
      data: "How do I delete my account or export my data?",
      feedback: "Where can I report an error or send feedback?",
      limits: "Which limitations are known?",
    },
    answers: {
      startBeforeCheck: "The ",
      startCheckLink: "AI check",
      startBetween:
        " takes about 5 minutes and identifies a suitable starting point. All {courseCount} courses are listed in the ",
      startCatalogLink: "course catalog",
      startAfterCatalog: ".",
      accountAvailable:
        "Books, demos, the AI check, and 6 technical course readers work without an account. 4 foundation course readers require a free learning account. The account synchronizes progress and completion status between devices. Completion documents remain self-issued and are not server-verified.",
      accountUnavailable:
        "Books, demos, the AI check, and 6 technical course readers work without an account. 4 foundation course readers require a learning account. Because no sign-in method is currently fully enabled, these 4 readers are temporarily unavailable.",
      progressSynced:
        "Progress is stored in the browser first and is also synchronized server-side when you are signed in. Clearing site data, using a private tab, or changing browsers can remove the local copy.",
      progressLocal:
        "Progress is stored only in this browser. Clearing site data, using a private tab, or changing devices can remove it. Server-side synchronization is not currently available.",
      signInBoth:
        "The sign-in page offers Google sign-in and a one-time email link. Email links expire and work once. Request a new link if it has expired and check the spam folder.",
      signInGoogle:
        "The sign-in page currently offers Google sign-in. One-time email links are not enabled in this configuration.",
      signInMagic:
        "The sign-in page currently offers a one-time email link. The link expires and works once. Request a new link if it has expired and check the spam folder.",
      signInUnavailable:
        "No sign-in method is currently fully enabled. Public courses, books, demos, and the AI check remain available without signing in.",
      devicesSynced:
        "Yes. A signed-in learning account synchronizes course progress. Without signing in, each device keeps its own local state.",
      devicesLocal:
        "Yes, but each device keeps its own local state. Cross-device synchronization is not currently available.",
      quiz: "Quizzes can be repeated and have no time limit. After submission, the page shows the result and an explanation. Depending on the course, completion means passing a final quiz, submitting a final task, or completing every lesson.",
      recordsBeforeLimits:
        "These self-issued documents record completion within the platform. Depending on the course, they are based on a quiz, a submitted task, or completed lessons. ",
      recordsLimitsLink:
        "They are not server-verified and do not by themselves establish compliance with Article 4 of the EU AI Act.",
      recordsAfterLimits: "",
      simulations:
        "Interactive examples use synthetic data and simulated processes. They do not send real email, call production third-party APIs, or process real customer data. They explain a concept; they are not production systems.",
      oneBookAvailable:
        "The book is free to read in the browser. Signed-in users can download the offered PDF. The book is learning material, not a citable legal source.",
      oneBookUnavailable:
        "The book is free to read in the browser. The account-bound PDF download is not currently available. The book is learning material, not a citable legal source.",
      manyBooks:
        "All {bookCount} books are free to read in the browser. They are learning materials, not citable legal sources.",
      dataAvailableBeforeLink:
        "Data export and account deletion are available under ",
      dataLink: "Privacy and data management",
      dataAvailableAfterLink:
        ". Privacy requests can also be sent to tim@loehrning.ai.",
      dataUnavailable:
        "No usable server-side learning account is currently enabled. Remove local progress through your browser's site-data controls. Send privacy requests to tim@loehrning.ai.",
      feedbackAvailableBeforeLink: "Use the ",
      feedbackLink: "feedback form",
      feedbackAvailableAfterLink:
        ". It works without an account and does not request an email address.",
      feedbackUnavailable:
        "The server-side feedback form is disabled. Send error reports and feedback to tim@loehrning.ai.",
      limitsBeforeLink: "Known limitations: ",
      limitsLink:
        "completion records are self-issued, interactive examples are simulated, content is tied to a stated review date, and progress may be stored only locally",
      limitsAfterLink:
        ". Each course or resource page states its specific limitation.",
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
      "Lernhilfe, technische Funktion und belastbarer Nachweis sind verschiedene Dinge. Jede Grenze nennt deshalb die praktische Folge und den nächsten Prüfschritt.",
    scopeLabel: "Grenze",
    consequenceLabel: "Was du tun kannst:",
    sourceLabel: "Amtliche Quelle zum Rechtsstand",
    reviewedLabel: "Rechtsstand geprüft",
    reviewedDate: "8. August 2026",
    limitations: {
      record: {
        title: "Selbst ausgestellte Abschlussdokumente",
        description:
          "Teilnahmebestätigungen und Lernnachweise werden im Browser erstellt. Sie haben keine serverseitige Prüfung, keine digitale Signatur und keine externe Zertifizierungsstelle. Ein solches Dokument belegt für sich allein nicht, dass eine Organisation Artikel 4 der EU-KI-Verordnung erfüllt.",
        mitigation:
          "Behandle das Dokument als persönliche Lernaufzeichnung. Artikel 4 verlangt Maßnahmen zur Förderung von KI-Kompetenz unter Berücksichtigung von Kenntnissen, Erfahrung, Bildung, Nutzungskontext und betroffenen Personen; er verlangt keine Garantie eines bestimmten individuellen Kompetenzniveaus. Organisationen müssen ihre eigenen Maßnahmen und Nachweise festlegen und rechtlich prüfen.",
      },
      simulations: {
        title: "Simulierte Praxisbeispiele",
        description:
          "Interaktive Demos und Sandboxen verwenden synthetische Daten und simulierte Schnittstellen. Sie versenden keine echten E-Mails, rufen keine produktiven Drittanbieter-APIs auf und verarbeiten keine echten Kundendaten.",
        mitigation:
          "Nutze die Beispiele zum Verstehen des Ablaufs. Prüfe vor einer realen Implementierung Anbieter-Dokumentation, Datenflüsse, Berechtigungen, Protokollierung und interne Freigaben separat.",
      },
      freshness: {
        title: "Keine Echtzeit-Aktualisierung",
        description:
          "Rechtslage, Produkte, Preise und Statistiken können sich zwischen redaktionellen Prüfungen ändern. Die Plattform überwacht externe Quellen nicht in Echtzeit. Ein sichtbares Prüfdatum ist deshalb kein Aktualitätsversprechen.",
        mitigation:
          "Prüfe vor Entscheidungen die jeweils aktuelle Primärquelle. Für EU-Recht sind EUR-Lex und das Amtsblatt maßgeblich. Veröffentlichte inhaltliche Änderungen stehen unter /neuigkeiten.",
      },
      progress: {
        title: "Lokaler Lernfortschritt ohne Anmeldung",
        description:
          "Ohne angemeldetes Lernkonto liegt der Fortschritt im Browser-Speicher. Gelöschte Website-Daten, private Tabs, ein anderer Browser oder ein anderes Gerät können diesen Stand entfernen.",
        mitigationAvailable:
          "Ein angemeldetes Lernkonto synchronisiert Fortschritt serverseitig. Der lokale Stand bleibt trotzdem von den Website-Daten des jeweiligen Browsers abhängig.",
        mitigationUnavailable:
          "Die serverseitige Synchronisierung ist aktuell nicht vollständig freigeschaltet. Behandle den lokalen Stand nicht als dauerhaftes Backup und sichere wichtige Ergebnisse unmittelbar.",
      },
      books: {
        title: "Lernbücher sind keine Primärquellen",
        descriptionOne:
          "Das verfügbare Buch ist eine redaktionell bearbeitete Lernfassung. Es ist kein amtliches Dokument, keine zitierfähige Rechtsquelle und kein Ersatz für Rechtsberatung.",
        descriptionMany:
          "Die {bookCount} verfügbaren Bücher sind redaktionell bearbeitete Lernfassungen. Sie sind keine amtlichen Dokumente, keine zitierfähigen Rechtsquellen und kein Ersatz für Rechtsberatung.",
        mitigation:
          "Nutze bei Rechtsfragen den konsolidierten Rechtsakt und das Amtsblatt auf EUR-Lex. Ziehe bei einer konkreten rechtlichen Entscheidung qualifizierte Beratung hinzu.",
      },
    },
  },
  en: {
    intro:
      "Learning support, technical function, and reliable evidence are different things. Each limitation therefore states its practical consequence and the next verification step.",
    scopeLabel: "Limitation",
    consequenceLabel: "What you can do:",
    sourceLabel: "Official source for the legal position",
    reviewedLabel: "Legal position reviewed",
    reviewedDate: "8 August 2026",
    limitations: {
      record: {
        title: "Self-issued completion documents",
        description:
          "Participation records and learning records are created in the browser. They have no server-side verification, digital signature, or external certification body. Such a document does not by itself establish that an organisation complies with Article 4 of the EU AI Act.",
        mitigation:
          "Treat the document as a personal learning record. Article 4 requires measures that support AI literacy while taking knowledge, experience, education, use context, and affected persons into account; it does not require a guaranteed individual level of AI literacy. Organisations must define and legally review their own measures and evidence.",
      },
      simulations: {
        title: "Simulated practical examples",
        description:
          "Interactive demos and sandboxes use synthetic data and simulated interfaces. They do not send real email, call production third-party APIs, or process real customer data.",
        mitigation:
          "Use the examples to understand the process. Before a real implementation, review provider documentation, data flows, permissions, logging, and internal approvals separately.",
      },
      freshness: {
        title: "No real-time updates",
        description:
          "Law, products, prices, and statistics can change between editorial reviews. The platform does not monitor external sources in real time. A visible review date is therefore not a guarantee of current accuracy.",
        mitigation:
          "Check the current primary source before making a decision. For EU law, EUR-Lex and the Official Journal are authoritative. Published content changes are listed under /en/neuigkeiten.",
      },
      progress: {
        title: "Local learning progress without sign-in",
        description:
          "Without a signed-in learning account, progress is stored in the browser. Clearing site data, using a private tab, changing browsers, or changing devices can remove it.",
        mitigationAvailable:
          "A signed-in learning account synchronizes progress server-side. The local copy still depends on site data in the current browser.",
        mitigationUnavailable:
          "Server-side synchronization is not currently fully enabled. Do not treat local progress as a permanent backup; save important results immediately.",
      },
      books: {
        title: "Learning books are not primary sources",
        descriptionOne:
          "The available book is an edited learning edition. It is not an official document, a citable legal source, or a substitute for legal advice.",
        descriptionMany:
          "The {bookCount} available books are edited learning editions. They are not official documents, citable legal sources, or substitutes for legal advice.",
        mitigation:
          "For legal questions, use the consolidated act and the Official Journal on EUR-Lex. Obtain qualified advice for a specific legal decision.",
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
      "Datierte Hinweise zu neuen Inhalten und redaktionellen Änderungen. Ein Eintrag beschreibt eine Veröffentlichung, nicht die laufende Vollständigkeit der gesamten Plattform.",
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
    title: "What is new",
    intro:
      "Dated notes on new material and editorial changes. An entry records a release; it does not claim that the entire platform is complete at that date.",
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
        "Fehler oder Unklarheiten auf loehrning.ai melden. Das optionale Formular fragt weder Name noch E-Mail-Adresse ab und bleibt ohne freigeschaltete Speicherung deaktiviert.",
    },
    eyebrow: "Rückmeldung / Beta",
    title: "Rückmeldung zu Fehlern oder Unklarheiten",
    introAvailable:
      "Das Formular fragt weder Namen noch E-Mail-Adresse ab. Eine Antwort ist deshalb nicht möglich. Gib keine personenbezogenen, vertraulichen oder urheberrechtlich geschützten Inhalte ein.",
    introUnavailable:
      "Die serverseitige Speicherung ist in dieser Konfiguration nicht freigeschaltet. Das Formular bleibt ausgeblendet und es werden keine Formulardaten angenommen.",
    emailBefore: "Direkter Kontakt: ",
    boundaryHeading: "Datenumfang",
    boundaryEyebrow: "01 / Datenumfang",
    boundaryItems: [
      "Kategorie und Nachricht",
      "Optional: Pfad der vorherigen Seite auf loehrning.ai",
      "Keine eigenen Felder für Name oder E-Mail-Adresse",
      "Keine Anfrageparameter oder URL-Fragmente im Seitenpfad",
    ],
    disabledStatus:
      "Es werden keine Formulardaten gespeichert. Nutze für Rückmeldungen die angegebene E-Mail-Adresse.",
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
        "Die Nachricht wurde ohne Kontaktdaten gespeichert. Veröffentlichte Korrekturen stehen unter Neuigkeiten.",
      sending: "Wird gesendet…",
      submit: "Rückmeldung senden",
      privacyNote:
        "Keine personenbezogenen oder vertraulichen Daten eingeben. Ohne Konto. Keine Antwortmöglichkeit.",
    },
  },
  en: {
    metadata: {
      title: "Feedback",
      description:
        "Report an error or unclear passage on loehrning.ai. The optional form requests neither a name nor an email address and stays disabled until storage is explicitly enabled.",
    },
    eyebrow: "Feedback / Beta",
    title: "Report an error or unclear passage",
    introAvailable:
      "The form does not request a name or email address, so a reply is not possible. Do not enter personal, confidential, or copyrighted material.",
    introUnavailable:
      "Server-side storage is not enabled in this configuration. The form remains hidden and no form data is accepted.",
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
      "No form data is stored. Use the stated email address to send feedback.",
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
        "The message was stored without contact details. Published corrections are listed under Updates.",
      sending: "Sending…",
      submit: "Send feedback",
      privacyNote:
        "Do not enter personal or confidential data. No account. No reply channel.",
    },
  },
} as const satisfies Localized<Record<string, unknown>>;
