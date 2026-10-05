import type { Locale } from "./i18n/locale";
import type { Workshop } from "./workshops";

const base = "/workshops/datenbereitschaft-fuer-ki";

/**
 * Workshop 03. The agenda follows the deck's seven acts; its minutes are the
 * sums of the main-path `data-seconds` in slides.html (4.75 / 9.75 / 6.5 / 17
 * / 12 / 15 / 10 = 75), rounded to whole minutes that keep the 75-minute
 * total, plus 15 minutes of questions in a live session.
 */
export const DATA_READINESS_WORKSHOP: Readonly<Record<Locale, Workshop>> = {
  de: {
    slug: "datenbereitschaft-fuer-ki",
    number: "03",
    topic: "Datenbereitschaft",
    title: "Sind deine Daten bereit für KI?",
    eyebrow: "Workshop 03 · Datenbereitschaft",
    summary:
      "Eine KI meldet für April −19.960 € MRR-Endbestand. Du findest den Fehler und baust die Daten so um, dass die Zahl stimmt.",
    description:
      "Die erfundene Firma FOLDLINE fragt nach dem MRR-Endbestand (monatlich wiederkehrender Umsatz) pro Monat im letzten abgeschlossenen Quartal. Auf sieben Exporttabellen antwortet die KI mit −19.960 / 9.775 / 42.565, weil sie die Veränderungen addiert und Bestand mit Veränderung verwechselt. Mit freigegebenen Sichten, schriftlicher Kennzahl-Definition (semantische Schicht), reinen Leserechten und Tests stimmt die Antwort mit der Datenbank überein: 334.675 / 344.450 / 387.015. Zum Schluss prüfst du die Grenzen des Aufbaus und schreibst deine eigene Frage in fünf Felder.",
    format: "Live-Workshop mit Deck",
    duration: "~90 Minuten",
    accessNote:
      "Für Deck, Lernbegleiter und Praxisbeispiel brauchst du nur einen Browser; Material auf Englisch, Einführung auf Deutsch. Die KI-Antworten sind Aufzeichnungen vom August 2026.",
    outcome: "Fünf-Felder-Vorlage",
    audience: [
      "Analystinnen und Controller, die Zahlen aus KI-Antworten weitergeben",
      "Teams, die festlegen, welche Daten eine KI lesen darf",
      "Moderierende, die den Fall mit einer Gruppe durchgehen",
    ],
    notForYou:
      "Nicht für dich, wenn du ein Data Warehouse aufbauen willst; dafür gibt es den optionalen Builder-Leitfaden.",
    question:
      "Zeige den MRR-Endbestand pro Monat für das letzte abgeschlossene Quartal.",
    outcomes: [
      "Du erkennst, ob eine KI einen Bestand oder eine Veränderung ausgibt.",
      "Du legst für eine eigene Frage Zahlart, Zeilen, Zeitraum, Tabelle und Zählweise fest.",
      "Du sagst, ob eine Anweisung oder eine Datenbankberechtigung den Zugriff sperrt.",
      "Du schreibst einen Test mit erwarteter Antwort und ihrer Quelle.",
    ],
    agenda: [
      {
        label: "Die Frage und der Fall",
        minutes: 5,
        activity: "listen",
        description:
          "FOLDLINE stellt die eine Frage, die bis zum Schluss bleibt.",
      },
      {
        label: "Die falsche Antwort",
        minutes: 10,
        activity: "vote",
        description:
          "Die KI liefert −19.960 / 9.775 / 42.565; du stimmst ab, ob das ins Board-Pack geht.",
      },
      {
        label: "Warum sie falsch ist",
        minutes: 6,
        activity: "vote",
        description:
          "Du führst den April-Wert auf vier ungeschriebene Festlegungen zurück.",
      },
      {
        label: "Die Reparatur",
        minutes: 17,
        activity: "do",
        description:
          "Die KI bekommt freigegebene Sichten und reine Leserechte; du füllst die vier Lücken der Definition.",
      },
      {
        label: "Dieselbe Frage noch einmal",
        minutes: 12,
        activity: "listen",
        description:
          "Die Antwort stimmt mit der Datenbank überein, auch für Veränderung und Quote.",
      },
      {
        label: "Grenzen des Aufbaus",
        minutes: 15,
        activity: "vote",
        description:
          "Du stimmst über Grenzfälle ab: nachfragen, verweigern oder sperren, und Daten älter als 36 Stunden.",
      },
      {
        label: "Dein Fall",
        minutes: 10,
        activity: "write",
        description:
          "Du füllst fünf Felder für eine eigene, erfundene Frage und stimmst erneut über die Antwort vom Anfang ab.",
      },
      {
        label: "Fragen",
        minutes: 15,
        mode: "live",
        activity: "listen",
        description: "Fragen aus der Gruppe; der Anhang des Decks hat Folien dafür.",
      },
    ],
    agendaSource: "deck",
    minutesLive: 90,
    minutesSelfStudy: 75,
    needs: [
      "Ein Browser, fürs Deck am besten ein großer Querformat-Bildschirm",
      "Papier und Stift",
      "Optional ein Claude-Konto für den Versuch im Lernbegleiter (10 Min.)",
    ],
    notNeeded: [
      "SQL- oder Programmierkenntnisse",
      "Ein KI-Konto für Deck, Praxisbeispiel und Labor",
      "Eigene Firmendaten",
    ],
    notCovered: [
      "Ein SQL-Kurs",
      "Eine Aussage, ob ein bestimmtes KI-Produkt sicher ist",
      "Eine Freigabe für ein echtes System",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-09-26",
      aiOutputsRecordedAt: "2026-08",
      liveRunAt: "2026-09-25",
      data: "synthetic",
      note: "Live gehalten mit Brainster. Die Datenbankergebnisse stammen aus einem Lauf des Workshop-Kits auf PostgreSQL 16.",
    },
    steps: [
      {
        n: "01",
        title: "Eine Frage stellen",
        description:
          "Die Frage nach dem MRR-Endbestand pro Monat im letzten abgeschlossenen Quartal bleibt den ganzen Workshop über gleich.",
        tool: "Deck · Die Frage",
      },
      {
        n: "02",
        title: "Die plausible falsche Antwort prüfen",
        description:
          "Auf sieben Exporttabellen antwortet die KI mit −19.960 / 9.775 / 42.565, weil sie die Veränderungen addiert und Bestand mit Veränderung verwechselt.",
        tool: "Deck · Der Fehler",
      },
      {
        n: "03",
        title: "Die Daten umbauen",
        description:
          "Mit freigegebenen Sichten, schriftlicher Kennzahl-Definition (semantische Schicht) und reinem Leselogin stimmt die Antwort mit der Datenbank überein: 334.675 / 344.450 / 387.015.",
        tool: "Deck · Die Reparatur",
      },
      {
        n: "04",
        title: "Die Grenzen des Aufbaus prüfen",
        description:
          "Der Aufbau soll nachfragen oder verweigern und bei Daten über 36 Stunden warnen. 9 von 9 Tests prüfen den Aufbau, nicht die KI, und in keinem der 3 Läufe zitierte die KI die Definition. Das reicht für einen begrenzten Piloten, nicht für eine Freigabe.",
        tool: "Deck · Grenzen",
      },
      {
        n: "05",
        title: "Deine fünf Felder ausfüllen",
        description:
          "Für eine eigene, erfundene Frage füllst du fünf Felder, neben jedem das FOLDLINE-Beispiel.",
        tool: "Fragekarte",
      },
      {
        n: "06",
        title: "Optional: die Daten hinter beiden Antworten ansehen",
        description:
          "Du stellst dieselbe Frage an Rohtabellen und freigegebene Sichten aus einem echten PostgreSQL-Lauf.",
        tool: "Praxisbeispiel · etwa 10 Minuten",
      },
    ],
    caseStudy: {
      companyName: "FOLDLINE",
      isFictional: true,
      location: "Erfundenes Berliner Unternehmen",
      sector: "Abo-Software für Geschäftskunden",
      period: "Q2 2026, eingefrorener Übungsstand",
      narrative:
        "Dieselbe Frage läuft einmal gegen die Rohexporte und einmal gegen freigegebene Sichten mit schriftlicher Definition. KI-Antworten sind aufgezeichnet, Datenbankprüfungen laufen fest.",
      metrics: [
        { label: "Erfundene Konten", value: "144" },
        { label: "Exportierte Tabellen", value: "7" },
        { label: "Freigegebene Sichten", value: "5" },
        { label: "Monate im Vergleich", value: "3" },
      ],
      decisionQuestion:
        "Welche Definition und welche Grenzen braucht eine KI, bevor du ihrer Antwort auf diese Frage vertraust?",
      dataLimitations: [
        "Aufgezeichnete KI-Antworten sind einzelne Beobachtungen, kein Beleg für Zuverlässigkeit.",
        "Die Tests prüfen Datenbank und Regeln, nicht die KI.",
        "Nur eine Datenbankberechtigung sperrt eine Tabelle, ein Prompt nicht.",
      ],
    },
    materials: [
      {
        label: "Deck · 26 Szenen",
        href: `${base}/slides.html`,
        kind: "html",
        language: "en",
        role: "deck",
        phase: "during",
        minutes: 75,
        primary: true,
        description:
          "Für den Beamer. Pfeiltasten blättern, P öffnet die Moderationsansicht.",
      },
      {
        label: "Moderationsansicht",
        href: `${base}/presenter.html`,
        kind: "html",
        language: "en",
        role: "presenter",
        phase: "during",
        optional: true,
        description:
          "Für die Person, die moderiert: Notizen, Abstimmungsfragen und eine Uhr. Verbindet sich mit dem Deck, sobald du dort P drückst.",
      },
      {
        label: "Praxisbeispiel · 10 Min.",
        href: `${base}/demo.html`,
        kind: "html",
        language: "en",
        role: "demo",
        phase: "during",
        minutes: 10,
        optional: true,
        description:
          "Rohtabellen und freigegebene Sichten nebeneinander. Du stellst auf beiden Seiten dieselbe Frage und vergleichst mit der Definition.",
      },
      {
        label: "Readiness-Kit · .zip",
        href: `${base}/data-readiness-kit.zip`,
        kind: "zip",
        language: "en",
        role: "kit",
        phase: "during",
        sizeLabel: "1,1 MB",
        description:
          "Die Fragekarte zum Ausdrucken, dazu Testfälle, Definitionsvorlagen und Dateien für Datenteams. Nur Textdateien; START-HERE.md sagt, womit du anfängst.",
        short: "Die Fragekarte zum Ausdrucken, dazu Testfälle und Vorlagen.",
      },
      {
        label: "Lernbegleiter",
        href: `${base}/guide.html`,
        kind: "html",
        language: "en",
        role: "guide",
        phase: "after",
        description:
          "Der Workshop zum Nachlesen, mit Glossar, auch auf dem Smartphone.",
      },
      {
        label: "Browserlabor · 12 Min.",
        href: `${base}/data-readiness-kit/readiness-lab.html`,
        kind: "html",
        language: "en",
        role: "lab",
        phase: "after",
        minutes: 12,
        optional: true,
        description:
          "Du reparierst die falsche Antwort mit fünf Einstellungen im Browser. Das Labor prüft sechs Fälle und zehn Kontrollen.",
      },
      {
        label: "Builder-Leitfaden",
        href: `${base}/builder.html`,
        kind: "html",
        language: "en",
        role: "builder",
        phase: "after",
        optional: true,
        description:
          "Elf Module für Datenteams: freigegebene Sichten, Kennzahl-Definition und reiner Leselogin auf der eigenen Datenbank. Zählt nicht zur Workshop-Zeit.",
        short: "Elf Module für Datenteams, die das auf der eigenen Datenbank bauen.",
      },
    ],
  },
  en: {
    slug: "datenbereitschaft-fuer-ki",
    number: "03",
    topic: "Data readiness",
    title: "Are your data ready for AI?",
    eyebrow: "Workshop 03 · Data readiness",
    summary:
      "An AI reports April ending MRR as −€19,960. You find the mistake and restructure the data so the number is right.",
    description:
      "The invented company FOLDLINE asks: \"Show ending MRR by month for the last complete quarter\" (MRR is monthly recurring revenue). On seven export tables the AI answers −19,960 / 9,775 / 42,565, because it adds up the changes and mixes up a balance with a change. With approved views, a written metric definition (the semantic layer), read-only access and tests, the answer matches the database: 334,675 / 344,450 / 387,015. Finally you test the setup's limits and write your own question into five boxes.",
    format: "Live workshop with deck",
    duration: "~90 minutes",
    accessNote:
      "The deck, learner guide and demo need only a browser; materials are in English, the live session is introduced in German. The AI answers are recordings from August 2026.",
    outcome: "Five-box template",
    audience: [
      "Analysts and controllers who pass on figures from AI answers",
      "Teams that decide which data an AI may read",
      "Facilitators taking a group through the case",
    ],
    notForYou:
      "Not for you if you want to build a data warehouse; the optional builder guide covers that.",
    question: "Show ending MRR by month for the last complete quarter.",
    outcomes: [
      "Spot whether an AI returned a balance or a change.",
      "Set the number type, rows, period, table and counting rule for a question of your own.",
      "Say whether an instruction or a database permission blocks a read.",
      "Write a test with the expected answer and its source.",
    ],
    agenda: [
      {
        label: "The question and the case",
        minutes: 5,
        activity: "listen",
        description:
          "FOLDLINE asks the one question that stays to the end.",
      },
      {
        label: "The wrong answer",
        minutes: 10,
        activity: "vote",
        description:
          "The AI returns −19,960 / 9,775 / 42,565; you vote on whether it goes into the board pack.",
      },
      {
        label: "Why it is wrong",
        minutes: 6,
        activity: "vote",
        description:
          "You trace the April value to four unwritten decisions.",
      },
      {
        label: "The fix",
        minutes: 17,
        activity: "do",
        description:
          "The AI gets approved views and read-only access; you fill the four blanks in the definition.",
      },
      {
        label: "The same question again",
        minutes: 12,
        activity: "listen",
        description:
          "The answer matches the database, for a change and a rate too.",
      },
      {
        label: "Limits of the setup",
        minutes: 15,
        activity: "vote",
        description:
          "You vote on edge cases: ask back, refuse or block, and data older than 36 hours.",
      },
      {
        label: "Your case",
        minutes: 10,
        activity: "write",
        description:
          "You fill five boxes for an invented question of your own and vote again on the opening answer.",
      },
      {
        label: "Questions",
        minutes: 15,
        mode: "live",
        activity: "listen",
        description: "Questions from the group; the deck's appendix has slides for them.",
      },
    ],
    agendaSource: "deck",
    minutesLive: 90,
    minutesSelfStudy: 75,
    needs: [
      "A browser, ideally a large landscape screen for the deck",
      "Paper and a pen",
      "Optionally a Claude account for the learner-guide try (10 min)",
    ],
    notNeeded: [
      "SQL or programming skills",
      "An AI account for the deck, demo and lab",
      "Your own company data",
    ],
    notCovered: [
      "An SQL course",
      "A verdict on whether a particular AI product is safe",
      "Sign-off for a real system",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-09-26",
      aiOutputsRecordedAt: "2026-08",
      liveRunAt: "2026-09-25",
      data: "synthetic",
      note: "Run live with Brainster. The database results come from a run of the workshop kit on PostgreSQL 16.",
    },
    steps: [
      {
        n: "01",
        title: "Ask one question",
        description:
          "The question about ending MRR by month for the last complete quarter stays the same for the whole workshop.",
        tool: "Deck · The question",
      },
      {
        n: "02",
        title: "Check the plausible wrong answer",
        description:
          "On seven export tables the AI answers −19,960 / 9,775 / 42,565, because it adds up the changes and mixes up a balance with a change.",
        tool: "Deck · The mistake",
      },
      {
        n: "03",
        title: "Rebuild what the AI reads",
        description:
          "With approved views, a written metric definition (the semantic layer) and a read-only login, the answer matches the database: 334,675 / 344,450 / 387,015.",
        tool: "Deck · The fix",
      },
      {
        n: "04",
        title: "Test the limits of the setup",
        description:
          "The setup should ask back or refuse, and warn on data older than 36 hours. 9 of 9 tests check the setup, not the AI, and in none of the 3 runs did the AI cite the definition. That is enough for a limited pilot, not for sign-off.",
        tool: "Deck · Limits",
      },
      {
        n: "05",
        title: "Fill your five boxes",
        description:
          "For an invented question of your own you fill five boxes, each next to the FOLDLINE example.",
        tool: "Question card",
      },
      {
        n: "06",
        title: "Optional: look at the data behind both answers",
        description:
          "You run the same question on raw tables and approved views from a real PostgreSQL run.",
        tool: "Interactive demo · about 10 minutes",
      },
    ],
    caseStudy: {
      companyName: "FOLDLINE",
      isFictional: true,
      location: "Invented Berlin company",
      sector: "Business subscription software",
      period: "Q2 2026, frozen teaching snapshot",
      narrative:
        "The same question runs once against raw exports and once against approved views with a written definition. AI answers are recorded; database checks are fixed.",
      metrics: [
        { label: "Invented accounts", value: "144" },
        { label: "Export tables", value: "7" },
        { label: "Approved views", value: "5" },
        { label: "Compared months", value: "3" },
      ],
      decisionQuestion:
        "Which definition and boundaries does an AI need before you trust its answer to this question?",
      dataLimitations: [
        "Recorded AI answers are single observations, not proof of reliability.",
        "The tests check the database and rules, not the AI.",
        "Only a database permission blocks a table, a prompt does not.",
      ],
    },
    materials: [
      {
        label: "Deck · 26 scenes",
        href: `${base}/slides.html`,
        kind: "html",
        language: "en",
        role: "deck",
        phase: "during",
        minutes: 75,
        primary: true,
        description:
          "For the projector. Arrow keys move on; P opens the presenter view.",
      },
      {
        label: "Presenter view",
        href: `${base}/presenter.html`,
        kind: "html",
        language: "en",
        role: "presenter",
        phase: "during",
        optional: true,
        description:
          "For whoever presents: notes, room votes and a clock. Pairs with the deck when you press P there.",
      },
      {
        label: "Interactive demo · 10 min",
        href: `${base}/demo.html`,
        kind: "html",
        language: "en",
        role: "demo",
        phase: "during",
        minutes: 10,
        optional: true,
        description:
          "Raw tables and approved views side by side. Ask the same question on both sides and compare with the definition.",
      },
      {
        label: "Readiness kit · .zip",
        href: `${base}/data-readiness-kit.zip`,
        kind: "zip",
        language: "en",
        role: "kit",
        phase: "during",
        sizeLabel: "1.1 MB",
        description:
          "The question card to print, plus test cases, definition templates and files for data teams. Text files only; START-HERE.md tells you where to begin.",
        short: "The question card to print, plus test cases and templates.",
      },
      {
        label: "Learner guide",
        href: `${base}/guide.html`,
        kind: "html",
        language: "en",
        role: "guide",
        phase: "after",
        description:
          "The workshop to read at your own pace, with a glossary, on a phone too.",
      },
      {
        label: "Browser lab · 12 min",
        href: `${base}/data-readiness-kit/readiness-lab.html`,
        kind: "html",
        language: "en",
        role: "lab",
        phase: "after",
        minutes: 12,
        optional: true,
        description:
          "You repair the wrong answer with five settings in the browser. The lab checks six cases and ten controls.",
      },
      {
        label: "Builder guide",
        href: `${base}/builder.html`,
        kind: "html",
        language: "en",
        role: "builder",
        phase: "after",
        optional: true,
        description:
          "Eleven modules for data teams: approved views, a metric definition and a read-only login on your own database. Not part of the workshop time.",
        short: "Eleven modules for data teams who build this on their own database.",
      },
    ],
  },
};
