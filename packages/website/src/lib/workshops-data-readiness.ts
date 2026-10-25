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
      "Aus einer richtigen Datei rechnet eine KI eine falsche Tabelle. Fünf Kästchen fangen den Fehler, bevor die Zahl weitergeht.",
    description:
      "Die erfundene Firma FOLDLINE fragt nach dem MRR-Endbestand (monatlich wiederkehrender Umsatz) pro Monat im letzten abgeschlossenen Quartal. Auf sieben Exporttabellen antwortet die KI mit −19.960 / 9.775 / 42.565, weil sie die Veränderungen addiert und Bestand mit Veränderung verwechselt. Mit freigegebenen Sichten, schriftlicher Kennzahl-Definition (semantische Schicht), reinen Leserechten und Tests stimmt die Antwort mit der Datenbank überein: 334.675 / 344.450 / 387.015. Zum Schluss prüfst du die Grenzen des Aufbaus und füllst die fünf Kästchen der Fragekarte für eine eigene Zahl aus.",
    format: "Live-Workshop mit Deck",
    duration: "~90 Minuten",
    accessNote:
      "Die Einführung im Deck ist auf Deutsch.",
    outcome: "Die Fragekarte",
    stageExplainer: {
      heading: "Was ist das Kit?",
      body:
        "Eine Zip mit der Fragekarte auf Deutsch und Englisch, die Dateien für deinen Claude (Skill, Projektanweisung, Prüfliste) im FOLDLINE-Beispiel und dem Aufbau für Datenteams. START-HIER.md sagt, womit du anfängst.",
      facts: ["Nur Textdateien", "5 Kästchen", "ca. 75 Min. allein"],
    },
    audience: [
      "Analystinnen und Controller, die Zahlen aus KI-Antworten weitergeben",
      "Teams, die festlegen, welche Daten eine KI lesen darf",
      "Moderierende, die den Fall mit einer Gruppe durchgehen",
    ],
    notForYou:
      "Nicht für dich, wenn du ein Data Warehouse aufbauen willst.",
    question:
      "Zeige den MRR-Endbestand pro Monat für das letzte abgeschlossene Quartal.",
    outcomes: [
      "Bevor du eine Zahl aus der KI weitergibst, füllst du fünf Kästchen aus: Frage, freigegebene Sicht, Art der Zahl und wer zählt, Grenze, Test.",
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
          "Die KI liefert −19.960 / 9.775 / 42.565; du stimmst ab, ob das in den Monatsbericht geht.",
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
          "Du füllst die fünf Kästchen der Fragekarte für eine eigene, erfundene Zahl und stimmst erneut über die Antwort vom Anfang ab.",
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
    ],
    notNeeded: [
      "SQL- oder Programmierkenntnisse",
      "Ein KI-Konto für das Deck",
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
      note: "Die Datenbankergebnisse stammen aus einem Lauf des Workshop-Kits auf PostgreSQL 16.",
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
        title: "Deine Fragekarte ausfüllen",
        description:
          "Für eine eigene, erfundene Zahl füllst du fünf Kästchen, neben jedem das FOLDLINE-Beispiel. In der Demo entstehen daraus die Dateien für deinen Claude.",
        tool: "Fragekarte",
      },
    ],
    caseStudy: {
      companyName: "FOLDLINE",
      isFictional: true,
      location: "Erfundenes Berliner Unternehmen",
      sector: "Abo-Software für Geschäftskunden",
      period: "Q2 2026, eingefrorener Übungsstand",
      narrative:
        "Dieselbe Frage läuft einmal gegen die Rohexporte und einmal gegen freigegebene Sichten mit schriftlicher Definition.",
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
        label: "Deck · 18 Szenen + Anhang",
        href: `${base}/slides.html`,
        kind: "html",
        language: "en",
        role: "deck",
        phase: "during",
        minutes: 75,
        primary: true,
        description:
          "Für den Beamer. Folien auf Englisch. Pfeiltasten blättern, R setzt auf Anfang, P öffnet die Moderationsansicht.",
      },
      {
        label: "Readiness-Kit · .zip",
        href: `${base}/data-readiness-kit.zip`,
        kind: "zip",
        language: "de",
        role: "kit",
        phase: "during",
        sizeLabel: "1,1 MB",
        description:
          "Die Fragekarte auf Deutsch und Englisch, eine Übung für deinen Claude, ein Claude-Skill, eine Projektanweisung und eine Prüfliste im FOLDLINE-Beispiel, dazu der Aufbau für Datenteams (englisch). Nur Textdateien; START-HIER.md sagt, womit du anfängst.",
        short: "Die Fragekarte, dazu die Dateien für deinen Claude.",
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
      "From a correct file, an AI builds a wrong table. Five boxes catch the mistake before the number goes out.",
    description:
      "The invented company FOLDLINE asks: \"Show ending MRR by month for the last complete quarter\" (MRR is monthly recurring revenue). On seven export tables the AI answers −19,960 / 9,775 / 42,565, because it adds up the changes and mixes up a balance with a change. With approved views, a written metric definition (the semantic layer), read-only access and tests, the answer matches the database: 334,675 / 344,450 / 387,015. Finally you test the setup's limits and fill the five boxes of the question card for a number of your own.",
    format: "Live workshop with deck",
    duration: "~90 minutes",
    accessNote:
      "The introduction in the deck is in German.",
    outcome: "The question card",
    stageExplainer: {
      heading: "What is the kit?",
      body:
        "A zip with the question card in German and English, three files for your Claude (skill, Project instructions, test list) in the FOLDLINE example, and the setup for data teams. START-HERE.md tells you where to begin.",
      facts: ["Text files only", "5 boxes", "about 75 min alone"],
    },
    audience: [
      "Analysts and controllers who pass on figures from AI answers",
      "Teams that decide which data an AI may read",
      "Facilitators taking a group through the case",
    ],
    notForYou:
      "Not for you if you want to build a data warehouse.",
    question: "Show ending MRR by month for the last complete quarter.",
    outcomes: [
      "Before you pass on a number an AI produced, fill five boxes: question, approved view, kind of number and who counts, boundary, test.",
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
          "The AI returns −19,960 / 9,775 / 42,565; you vote on whether it goes into the monthly report.",
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
          "You fill the five boxes of the question card for an invented number of your own and vote again on the opening answer.",
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
    ],
    notNeeded: [
      "SQL or programming skills",
      "An AI account for the deck",
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
      note: "The database results come from a run of the workshop kit on PostgreSQL 16.",
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
        title: "Fill your question card",
        description:
          "For an invented number of your own you fill five boxes, each next to the FOLDLINE example. In the demo they become three files for your Claude.",
        tool: "Question card",
      },
    ],
    caseStudy: {
      companyName: "FOLDLINE",
      isFictional: true,
      location: "Invented Berlin company",
      sector: "Business subscription software",
      period: "Q2 2026, frozen teaching snapshot",
      narrative:
        "The same question runs once against raw exports and once against approved views with a written definition.",
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
        label: "Deck · 18 scenes + appendix",
        href: `${base}/slides.html`,
        kind: "html",
        language: "en",
        role: "deck",
        phase: "during",
        minutes: 75,
        primary: true,
        description:
          "For the projector. Arrow keys move on, R goes back to the start, P opens the presenter view.",
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
          "The question card in German and English, a Claude skill, Project instructions and a test list in the FOLDLINE example, plus the setup for data teams. Text files only; START-HERE.md tells you where to begin.",
        short: "The question card, plus three files for your Claude.",
      },
    ],
  },
};
