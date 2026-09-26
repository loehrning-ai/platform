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
      "Eine KI meldet für April einen MRR-Endbestand von −19.960 €. Du findest heraus, warum die Zahl falsch ist und welcher Umbau der Daten die richtige liefert.",
    description:
      "Die erfundene Firma FOLDLINE stellt eine Frage: den MRR-Endbestand pro Monat im letzten abgeschlossenen Quartal. MRR ist der monatlich wiederkehrende Umsatz. Auf sieben exportierten Tabellen antwortet die KI mit −19.960 / 9.775 / 42.565, weil sie die Veränderungen jedes Monats addiert und damit Bestand und Veränderung verwechselt. Danach liest die KI nur freigegebene Sichten, bekommt eine schriftliche Kennzahl-Definition (die semantische Schicht) und darf nur lesen; Tests prüfen den Aufbau. Dieselbe Frage stimmt dann mit der Datenbank überein: 334.675 / 344.450 / 387.015. Zum Schluss siehst du, was der Aufbau nicht absichert, und schreibst deine eigene Frage in fünf Felder.",
    format: "Live-Workshop mit Deck",
    duration: "~90 Minuten",
    accessNote:
      "Für Deck, Lernbegleiter und Demo brauchst du nur einen Browser; Material auf Englisch, Einführung auf Deutsch. Die gezeigten KI-Antworten wurden im August 2026 aufgezeichnet und sind keine Live-Abfragen.",
    outcome: "Fünf-Felder-Vorlage",
    audience: [
      "Analystinnen und Controller, die Zahlen aus KI-Antworten weitergeben, auch ohne SQL-Kenntnisse",
      "Teams, die festlegen, welche Daten eine KI lesen darf",
      "Moderatorinnen und Moderatoren, die den Fall mit einer Gruppe durchgehen wollen",
    ],
    notForYou:
      "Eher nicht für dich, wenn du eine Anleitung zum Aufbau eines Data Warehouse suchst; dafür gibt es den optionalen Builder-Leitfaden.",
    question:
      "Zeige den MRR-Endbestand pro Monat für das letzte abgeschlossene Quartal.",
    outcomes: [
      "Du erkennst, ob eine KI einen Bestand oder eine Veränderung ausgegeben hat.",
      "Du schreibst für eine eigene Frage fest, welche Art Zahl, welche Zeilen, welcher Zeitraum und welche Tabelle gemeint sind, und wer mitzählt.",
      "Du unterscheidest eine Anweisung an die KI von einer Datenbankberechtigung und sagst, welche von beiden einen Zugriff verhindert.",
      "Du schreibst einen Test mit erwarteter Antwort und der Quelle des richtigen Werts.",
    ],
    agenda: [
      {
        label: "Die Frage und der Fall",
        minutes: 5,
        activity: "listen",
        description:
          "Du lernst FOLDLINE und die eine Frage kennen, die bis zum Schluss gleich bleibt.",
      },
      {
        label: "Die falsche Antwort",
        minutes: 10,
        activity: "vote",
        description:
          "Die KI liefert aus sieben Exporttabellen −19.960 / 9.775 / 42.565, und du stimmst ab, ob du das ins Board-Pack legst.",
      },
      {
        label: "Warum sie falsch ist",
        minutes: 6,
        activity: "vote",
        description:
          "Du verfolgst den April-Wert zu vier Festlegungen zurück, die niemand aufgeschrieben hat.",
      },
      {
        label: "Die Reparatur",
        minutes: 17,
        activity: "do",
        description:
          "Freigegebene Sichten, ein Login mit reinen Leserechten und eine Kennzahl-Definition, deren vier Lücken du mit ausfüllst.",
      },
      {
        label: "Dieselbe Frage noch einmal",
        minutes: 12,
        activity: "listen",
        description:
          "Über die freigegebenen Sichten stimmt die Antwort mit der Datenbank überein, auch für eine Veränderung und eine Quote.",
      },
      {
        label: "Grenzen des Aufbaus",
        minutes: 15,
        activity: "vote",
        description:
          "Du stimmst über Grenzfälle ab: nachfragen, verweigern oder sperren, und was bei Daten gilt, die älter als 36 Stunden sind.",
      },
      {
        label: "Dein Fall",
        minutes: 10,
        activity: "write",
        description:
          "Du füllst die fünf Felder für eine eigene, erfundene Frage und stimmst noch einmal über die Antwort vom Anfang ab.",
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
    minutesSelfStudy: 60,
    needs: [
      "Ein Browser, für das Deck am besten ein großer Bildschirm im Querformat",
      "Papier und Stift für die fünf Felder",
      "Optional ein Claude-Konto für den 10-Minuten-Versuch im Lernbegleiter",
    ],
    notNeeded: [
      "SQL- oder Programmierkenntnisse",
      "Ein KI-Konto für Deck, Demo und Labor",
      "Eigene Firmendaten, denn FOLDLINE ist erfunden",
    ],
    notCovered: [
      "Ein SQL-Kurs",
      "Der Aufbau eines Data Warehouse; dafür gibt es den optionalen Builder-Leitfaden",
      "Eine Aussage, ob ein bestimmtes KI-Produkt sicher ist",
      "Eine Freigabe für ein echtes System",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-09-26",
      aiOutputsRecordedAt: "2026-08",
      liveRunAt: "2026-09-25",
      data: "synthetic",
      note: "FOLDLINE und alle Daten sind erfunden. Live gehalten am 25. September 2026 mit Brainster; die Datenbankergebnisse stammen aus einem Lauf des Workshop-Kits auf PostgreSQL 16.",
    },
    decisionLab: {
      kicker: "Entscheidung 01 · Bestand",
      title: "100 Euro plus 20 Euro. Wirklich 120?",
      prompt:
        "Ein Datensatz enthält den Monatsendbestand von 100 Euro und die Veränderung von +20 Euro. Eine KI meldet 120 Euro Monatsendbestand. Was tust du?",
      facts: [
        "Endbestand 100 €",
        "Veränderung +20 €",
        "KI-Antwort 120 €",
      ],
      decisionLegend: "Deine erste Entscheidung",
      evidenceLegend: "Der stärkste Beleg",
      choices: [
        {
          id: "check-definition",
          label:
            "100 Euro verwenden und zuerst die Bedeutung der Felder prüfen.",
        },
        {
          id: "trust-sum",
          label: "120 Euro übernehmen, weil sich zwei Zahlen addieren lassen.",
        },
        {
          id: "new-model",
          label: "Ohne weitere Prüfung ein größeres KI-Modell wählen.",
        },
      ],
      evidence: [
        {
          id: "included-change",
          label:
            "Der Endbestand enthält die Veränderung bereits. Noch einmal addieren zählt sie doppelt.",
        },
        {
          id: "confident-answer",
          label: "Die Antwort klingt sicher und enthält eine Rechnung.",
        },
        { id: "same-data", label: "Beide Zahlen stehen in derselben Tabelle." },
      ],
      recommendedChoiceId: "check-definition",
      strongestEvidenceId: "included-change",
      submitLabel: "Entscheidung prüfen",
      resetLabel: "Neu entscheiden",
      privacyNote:
        "Läuft nur auf dieser Seite. Auswahl und Ergebnis werden weder gespeichert noch gesendet.",
      resultLabel: "Auswertung der Entscheidung",
      feedback: {
        aligned: {
          title: "Die Veränderung sitzt schon im Endbestand.",
          body: "Richtig sind 100 Euro. Der Endbestand enthält die +20 Euro schon; wer sie noch einmal addiert, zählt sie doppelt.",
        },
        decisionOnly: {
          title: "Richtige Zahl, Begründung fehlt.",
          body: "100 Euro stimmen, weil der Endbestand die Veränderung bereits enthält. Ein sicherer Ton und die Position in einer Tabelle belegen das nicht.",
        },
        evidenceOnly: {
          title: "Dein Beleg widerspricht deiner Entscheidung.",
          body: "Wenn die Veränderung schon enthalten ist, sind 120 Euro eine Doppelzählung. Die Daten brauchen eine schriftliche Definition.",
        },
        unsupported: {
          title: "Erst die Definition sagt, ob 100 oder 120 Euro stimmen.",
          body: "Die Rechnung stimmt, die Bedeutung nicht. 100 Euro sind bereits der Endbestand einschließlich der Veränderung.",
        },
        byChoice: {
          "trust-sum": {
            evidenceOnly: {
              title: "Dein Beleg widerspricht deiner Entscheidung.",
              body: "Wenn die Veränderung schon im Endbestand steckt, sind 120 Euro eine Doppelzählung. Richtig sind 100 Euro; die Daten brauchen eine schriftliche Definition.",
            },
            unsupported: {
              title: "Zwei richtige Zahlen, falsche Bedeutung.",
              body: "Die Addition stimmt, aber 120 Euro zählen die Veränderung doppelt, denn der Endbestand von 100 Euro enthält sie bereits. Ein sicherer Ton oder dieselbe Tabelle sagen nicht, was ein Feld bedeutet.",
            },
          },
          "new-model": {
            evidenceOnly: {
              title: "Dein Beleg beantwortet die Frage schon.",
              body: "Wenn der Endbestand die Veränderung bereits enthält, lautet die Antwort 100 Euro. Auch ein größeres Modell braucht diese Definition; wer die Bedeutung der Felder prüft, hat die Antwort direkt.",
            },
            unsupported: {
              title: "Auch ein größeres Modell braucht die Definition.",
              body: "Die Modellgröße entscheidet nicht, was ein Feld bedeutet. Der Endbestand von 100 Euro enthält die Veränderung bereits; 120 Euro zählen sie doppelt.",
            },
          },
        },
      },
    },
    steps: [
      {
        n: "01",
        title: "Eine Frage stellen",
        description:
          "FOLDLINE will den MRR-Endbestand pro Monat im letzten abgeschlossenen Quartal wissen. Diese Frage bleibt im ganzen Workshop dieselbe.",
        tool: "Deck · Die Frage",
      },
      {
        n: "02",
        title: "Die plausible falsche Antwort prüfen",
        description:
          "Auf sieben exportierten Tabellen antwortet die KI mit −19.960 / 9.775 / 42.565. Sie hat die Veränderungen jedes Monats addiert und damit Bestand und Veränderung verwechselt.",
        tool: "Deck · Der Fehler",
      },
      {
        n: "03",
        title: "Die Daten umbauen",
        description:
          "Die KI liest nur noch freigegebene Sichten, bekommt eine schriftliche Kennzahl-Definition (die semantische Schicht) und einen Login, der nur lesen darf. Dieselbe Frage stimmt danach mit der Datenbank überein: 334.675 / 344.450 / 387.015.",
        tool: "Deck · Die Reparatur",
      },
      {
        n: "04",
        title: "Die Grenzen des Aufbaus prüfen",
        description:
          "Der Aufbau soll nachfragen oder verweigern und warnen, wenn die Daten älter als 36 Stunden sind. 9 von 9 Tests prüfen den Aufbau, nicht die KI; die Läufe zitierten die Definition 0 von 3 Mal. Das Urteil bleibt ein begrenzter Pilot ohne Freigabe.",
        tool: "Deck · Grenzen",
      },
      {
        n: "05",
        title: "Deine fünf Felder ausfüllen",
        description:
          "Du überträgst das Vorgehen auf eine eigene, erfundene Frage und füllst fünf Felder aus, von der Frage bis zum ersten Test. Die Fragekarte im Kit zeigt neben jedem Feld ein ausgefülltes Beispiel von FOLDLINE. Ein gelungener Übungsfall ist keine Freigabe für ein echtes System.",
        tool: "Fragekarte",
      },
      {
        n: "06",
        title: "Optional: die Daten hinter beiden Antworten ansehen",
        description:
          "In der interaktiven Demo öffnest du die Rohtabellen und die freigegebenen Sichten, führst dieselbe Frage auf beiden Seiten aus und prüfst das Ergebnis gegen die Definition. Tabellen und Ergebnisse stammen aus einem echten PostgreSQL-Lauf des Workshop-Kits.",
        tool: "Interaktive Demo · etwa 10 Minuten",
      },
    ],
    caseStudy: {
      companyName: "FOLDLINE",
      isFictional: true,
      location: "Erfundenes Berliner Unternehmen",
      sector: "Abo-Software für Geschäftskunden",
      period: "Q2 2026, eingefrorener Übungsstand",
      narrative:
        "FOLDLINE hat 144 erfundene Kundenkonten. Dieselbe Frage nach dem MRR-Endbestand läuft gegen zwei Datenstände: sieben exportierte Tabellen und fünf freigegebene Sichten mit schriftlicher Definition. Du siehst aufgezeichnete KI-Antworten und getrennt davon feste Prüfungen gegen die Datenbank.",
      metrics: [
        { label: "Erfundene Konten", value: "144" },
        { label: "Exportierte Tabellen", value: "7" },
        { label: "Freigegebene Sichten", value: "5" },
        { label: "Monate im Vergleich", value: "3" },
      ],
      decisionQuestion:
        "Welche Definition und welche Grenzen braucht eine KI, bevor du ihrer Antwort auf genau diese Frage vertraust?",
      dataLimitations: [
        "Die Daten sind vollständig erfunden und auf einem festen Stand eingefroren.",
        "Aufgezeichnete KI-Antworten belegen einzelne Beobachtungen, keine allgemeine Zuverlässigkeit.",
        "9 von 9 Tests prüfen die Datenbank und die festen Regeln des Aufbaus, nicht die KI. Ein Prompt kann die KI nur bitten, eine Tabelle nicht zu lesen; blockieren kann das nur eine Datenbankberechtigung.",
        "Ein bestandener Übungsfall ist keine Freigabe für ein echtes System.",
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
          "Etwa 75 Minuten Programm und 15 Minuten Fragen; die Demo ist optional (10 Min.). Pfeiltasten führen weiter, P öffnet die Moderationsansicht. Am besten auf einem großen Bildschirm im Querformat.",
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
          "Für die Person, die moderiert: Notizen, Abstimmungsfragen und eine Uhr für die 75 Minuten. Sie verbindet sich mit dem Deck, sobald du dort P drückst.",
      },
      {
        label: "Interaktive Demo · 10 Min.",
        href: `${base}/demo.html`,
        kind: "html",
        language: "en",
        role: "demo",
        phase: "during",
        minutes: 10,
        optional: true,
        description:
          "Rohtabellen und freigegebene Sichten nebeneinander. Du siehst dir die Tabellen an, führst dieselbe Frage auf beiden Seiten aus und vergleichst die Antworten mit der Definition.",
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
          "Die Fragekarte mit den fünf Feldern zum Ausdrucken, dazu Testfälle, Vorlagen für Definitionen und die Dateien für Datenteams. Nur Textdateien; START-HERE.md sagt, womit du anfängst.",
      },
      {
        label: "Lernbegleiter",
        href: `${base}/guide.html`,
        kind: "html",
        language: "en",
        role: "guide",
        phase: "after",
        description:
          "Der Workshop zum Nachlesen: die Frage, der Fehler, die Reparatur, die Grenzen, deine fünf Felder und ein Glossar. Funktioniert auch auf dem Smartphone.",
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
          "Du reparierst die falsche Antwort auf den erfundenen Daten, indem du fünf Einstellungen wählst. Das Labor prüft sechs Fälle und zehn Kontrollen, alles im Browser.",
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
          "Für Datenteams, optional: elf Module dazu, wie ihr freigegebene Sichten, eine Kennzahl-Definition und einen Login mit reinen Leserechten auf der eigenen Datenbank aufbaut. Zählt nicht zur Workshop-Zeit.",
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
      "An AI reports April ending MRR as −€19,960. You find out why that number is wrong and which change to the data produces the right one.",
    description:
      "The invented company FOLDLINE asks one question: \"Show ending MRR by month for the last complete quarter.\" MRR is monthly recurring revenue. On seven export tables the AI answers -19,960 / 9,775 / 42,565, because it added up each month's change and so mixed up a balance and a change. Then the AI reads only approved views, gets a written metric definition (the semantic layer) and may only read; tests check the setup. The same question now matches the database: 334,675 / 344,450 / 387,015. Finally you see what the setup does not cover, and you write your own question into five boxes.",
    format: "Live workshop with deck",
    duration: "~90 minutes",
    accessNote:
      "The deck, learner guide and demo need only a browser; materials are in English, the live session is introduced in German. The AI answers shown were recorded in August 2026; they are not live requests.",
    outcome: "Five-field template",
    audience: [
      "Analysts and controllers who pass on figures from AI answers, including those without SQL",
      "Teams that decide which data an AI may read",
      "Facilitators who want to take a group through the case",
    ],
    notForYou:
      "Probably not for you if you are looking for a guide to building a data warehouse; the optional builder guide covers that.",
    question: "Show ending MRR by month for the last complete quarter.",
    outcomes: [
      "Spot whether an AI returned a balance or a change.",
      "Write down, for a question of your own, which kind of number, which rows, which period and which table are meant, and who counts.",
      "Tell an instruction to the AI apart from a database permission, and say which of the two blocks a read.",
      "Write a test with the expected answer and the source of the correct value.",
    ],
    agenda: [
      {
        label: "The question and the case",
        minutes: 5,
        activity: "listen",
        description:
          "You meet FOLDLINE and the one question that stays the same to the end.",
      },
      {
        label: "The wrong answer",
        minutes: 10,
        activity: "vote",
        description:
          "The AI returns -19,960 / 9,775 / 42,565 from seven export tables, and you vote on whether it goes into the board pack.",
      },
      {
        label: "Why it is wrong",
        minutes: 6,
        activity: "vote",
        description:
          "You trace the April value back to four decisions nobody wrote down.",
      },
      {
        label: "The fix",
        minutes: 17,
        activity: "do",
        description:
          "Approved views, a read-only login and a metric definition whose four blanks you help fill.",
      },
      {
        label: "The same question again",
        minutes: 12,
        activity: "listen",
        description:
          "Through the approved views the answer matches the database, for a change and a rate too.",
      },
      {
        label: "Limits of the setup",
        minutes: 15,
        activity: "vote",
        description:
          "You vote on edge cases: ask back, refuse or block, and what happens when data are older than 36 hours.",
      },
      {
        label: "Your case",
        minutes: 10,
        activity: "write",
        description:
          "You fill the five boxes for an invented question of your own and vote again on the opening answer.",
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
    minutesSelfStudy: 60,
    needs: [
      "A browser, ideally a large landscape screen for the deck",
      "Paper and a pen for the five boxes",
      "Optionally a Claude account for the 10-minute try in the learner guide",
    ],
    notNeeded: [
      "SQL or programming skills",
      "An AI account for the deck, demo and lab",
      "Your own company data, because FOLDLINE is invented",
    ],
    notCovered: [
      "An SQL course",
      "Building a data warehouse; the optional builder guide covers that",
      "A verdict on whether a particular AI product is safe",
      "Sign-off for a real system",
    ],
    provenance: {
      author: "Tim Löhr",
      reviewedAt: "2026-09-26",
      aiOutputsRecordedAt: "2026-08",
      liveRunAt: "2026-09-25",
      data: "synthetic",
      note: "FOLDLINE and all its data are invented. Run live on 25 September 2026 with Brainster; the database results come from a run of the workshop kit on PostgreSQL 16.",
    },
    decisionLab: {
      kicker: "Decision 01 · Balance",
      title: "100 euros plus 20. Really 120?",
      prompt:
        "A record contains a month-end balance of 100 euros and a change of +20 euros. An AI reports a month-end balance of 120 euros. What do you do?",
      facts: [
        "Ending balance €100",
        "Change +€20",
        "AI answer €120",
      ],
      decisionLegend: "Your first decision",
      evidenceLegend: "The strongest evidence",
      choices: [
        {
          id: "check-definition",
          label: "Use 100 euros and check what the fields mean first.",
        },
        {
          id: "trust-sum",
          label: "Accept 120 euros, because two numbers can be added.",
        },
        {
          id: "new-model",
          label: "Pick a larger AI model without checking the definition.",
        },
      ],
      evidence: [
        {
          id: "included-change",
          label:
            "The ending balance already includes the change. Adding it again counts it twice.",
        },
        {
          id: "confident-answer",
          label: "The answer sounds confident and includes arithmetic.",
        },
        { id: "same-data", label: "Both numbers appear in the same table." },
      ],
      recommendedChoiceId: "check-definition",
      strongestEvidenceId: "included-change",
      submitLabel: "Check decision",
      resetLabel: "Decide again",
      privacyNote:
        "Runs only on this page. Your selection and result are neither stored nor sent.",
      resultLabel: "Decision feedback",
      feedback: {
        aligned: {
          title: "The change is already in the ending balance.",
          body: "The answer is 100 euros. The ending balance already contains the +20 euros; adding them again counts them twice.",
        },
        decisionOnly: {
          title: "Right number, missing reason.",
          body: "100 euros is correct because the ending balance already includes the change. A confident tone and a place in a table do not show that.",
        },
        evidenceOnly: {
          title: "Your evidence contradicts your decision.",
          body: "If the change is already included, 120 euros double-counts it. The data need a written definition.",
        },
        unsupported: {
          title: "Only the definition tells you whether 100 or 120 euros is right.",
          body: "The arithmetic is right and the meaning is wrong. 100 euros is already the ending balance, including the change.",
        },
        byChoice: {
          "trust-sum": {
            evidenceOnly: {
              title: "Your evidence contradicts your decision.",
              body: "If the change is already in the ending balance, 120 euros double-counts it. The answer is 100 euros; the data need a written definition.",
            },
            unsupported: {
              title: "Two correct numbers, wrong meaning.",
              body: "The addition works, but 120 euros counts the change twice, because the 100-euro ending balance already includes it. A confident tone or a shared table does not tell you what a field means.",
            },
          },
          "new-model": {
            evidenceOnly: {
              title: "Your evidence already answers the question.",
              body: "If the ending balance already includes the change, the answer is 100 euros. A larger model still needs that definition; checking what the fields mean gives you the answer directly.",
            },
            unsupported: {
              title: "A bigger model still needs the definition.",
              body: "Model size does not decide what a field means. The 100-euro ending balance already includes the change, so 120 euros counts it twice.",
            },
          },
        },
      },
    },
    steps: [
      {
        n: "01",
        title: "Ask one question",
        description:
          "FOLDLINE wants ending MRR by month for the last complete quarter. The question stays the same for the whole workshop.",
        tool: "Deck · The question",
      },
      {
        n: "02",
        title: "Check the plausible wrong answer",
        description:
          "On seven export tables the AI answers -19,960 / 9,775 / 42,565. It added up each month's change and so mixed up a balance and a change.",
        tool: "Deck · The mistake",
      },
      {
        n: "03",
        title: "Rebuild what the AI reads",
        description:
          "The AI now reads only approved views, gets a written metric definition (the semantic layer) and a login that may only read. The same question then matches the database: 334,675 / 344,450 / 387,015.",
        tool: "Deck · The fix",
      },
      {
        n: "04",
        title: "Test the limits of the setup",
        description:
          "The setup should ask back or refuse, and warn when data are older than 36 hours. 9 of 9 tests check the setup, not the AI; the runs cited the definition 0 of 3 times. The verdict stays a limited pilot, not signed off.",
        tool: "Deck · Limits",
      },
      {
        n: "05",
        title: "Fill your five boxes",
        description:
          "You apply the method to an invented question of your own and fill five boxes, from the question to the first test. The question card in the kit shows a filled FOLDLINE example next to each box. A successful practice case does not approve a real system.",
        tool: "Question card",
      },
      {
        n: "06",
        title: "Optional: look at the data behind both answers",
        description:
          "In the interactive demo you open the raw tables and the approved views, run the same question on both sides and check the result against the definition. The tables and results come from a real PostgreSQL run of the workshop kit.",
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
        "FOLDLINE has 144 invented customer accounts. The same question about ending MRR runs against two data setups: seven export tables and five approved views with a written definition. You see recorded AI answers and, separately, fixed checks against the database.",
      metrics: [
        { label: "Invented accounts", value: "144" },
        { label: "Export tables", value: "7" },
        { label: "Approved views", value: "5" },
        { label: "Compared months", value: "3" },
      ],
      decisionQuestion:
        "Which definition and boundaries does an AI need before you trust its answer to this particular question?",
      dataLimitations: [
        "All data are invented and frozen at one point in time.",
        "Recorded AI answers establish individual observations, not general reliability.",
        "9 of 9 tests check the database and the fixed rules of the setup, not the AI. A prompt can only ask the AI not to read a table; only a database permission can block the read.",
        "Passing a practice case does not approve a real system.",
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
          "About 75 minutes of content and 15 minutes of questions; the demo is optional (10 min). Use the arrow keys; P opens the presenter view. Best on a large screen in landscape.",
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
          "For whoever presents: notes, room votes and a clock for the 75 minutes. It pairs with the deck as soon as you press P there.",
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
          "Raw tables and approved views side by side. Look at the tables, run the same question on both sides and compare the answers with the definition.",
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
          "The question card with the five boxes to print, plus test cases, definition templates and the files for data teams. Text files only; START-HERE.md tells you where to begin.",
      },
      {
        label: "Learner guide",
        href: `${base}/guide.html`,
        kind: "html",
        language: "en",
        role: "guide",
        phase: "after",
        description:
          "The workshop to read at your own pace: the question, the mistake, the fix, the limits, your five boxes and a glossary. Works on a phone too.",
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
          "You repair the wrong answer on the invented data by choosing five settings. The lab checks six cases and ten controls, all in the browser.",
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
          "For data teams, optional: eleven modules on building approved views, a metric definition and a read-only login on your own database. Not part of the workshop time.",
      },
    ],
  },
};
