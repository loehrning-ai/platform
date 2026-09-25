import type { Locale } from "./i18n/locale";
import type { Workshop } from "./workshops";

const base = "/workshops/datenbereitschaft-fuer-ki";

export const DATA_READINESS_WORKSHOP: Readonly<Record<Locale, Workshop>> = {
  de: {
    slug: "datenbereitschaft-fuer-ki",
    title: "Sind deine Daten bereit für KI?",
    eyebrow: "Workshop 03 · Daten verstehen und Antworten prüfen",
    summary:
      "Eine Frage, zwei Datenstände, zwei Antworten. Du siehst, wie eine KI eine plausible, aber falsche Zahl liefert und was sie repariert. Ohne Code und ohne KI-Konto; in der interaktiven Demo schaust du dir die Daten selbst an.",
    description:
      "Die fiktive Firma FOLDLINE stellt eine einzige Frage: den MRR-Endbestand pro Monat im letzten abgeschlossenen Quartal. Auf sieben exportierten Tabellen liefert die KI plausible, aber falsche Zahlen (−19.960 / 9.775 / 42.565): Sie hat die Veränderungen jedes Monats addiert und damit Veränderung und Bestand verwechselt. Die Reparatur: freigegebene Auswertungssichten, eine schriftliche Kennzahl-Definition (die semantische Schicht), reiner Lesezugriff und Tests. Danach stimmt dieselbe Frage mit der Datenbank überein (334.675 / 344.450 / 387.015). Der Kurs zeigt auch die ehrlichen Grenzen und endet mit deiner eigenen Frage in fünf Feldern. Alle Daten sind synthetisch.",
    format: "Interaktiver Kurs + Lernbegleiter",
    duration: "75 Minuten Kurs + 15 Minuten Fragen; interaktive Demo optional 10 Minuten",
    accessNote:
      "Für Kurs und Demo brauchst du kein Konto und keine Installation. Material auf Englisch, Einführung auf Deutsch. Die im Kurs gezeigten Modellantworten wurden im August 2026 aufgezeichnet und sind keine Live-Abfragen.",
    audience: [
      "Einsteiger ohne SQL- oder Programmierkenntnisse",
      "Teams, die KI-Antworten mit Daten prüfen möchten",
      "Moderatoren, die einen konkreten Datenfall erklären wollen",
    ],
    decisionLab: {
      kicker: "Aufwärmübung · Bestand und Veränderung",
      title: "100 Euro plus 20 Euro. Wirklich 120?",
      prompt:
        "Ein Datensatz enthält den Monatsendbestand von 100 Euro und die Veränderung von +20 Euro. Eine KI meldet 120 Euro Monatsendbestand. Was tust du?",
      facts: [
        "Endbestand 100 Euro",
        "Veränderung +20 Euro",
        "KI-Antwort 120 Euro",
      ],
      decisionLegend: "Deine Entscheidung",
      evidenceLegend: "Der stärkste Beleg",
      choices: [
        {
          id: "check-definition",
          label:
            "100 Euro verwenden und zuerst die Bedeutung der Felder prüfen.",
        },
        {
          id: "trust-sum",
          label: "120 Euro übernehmen: Zwei Zahlen kann man addieren.",
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
      submitLabel: "Antwort prüfen",
      resetLabel: "Noch einmal versuchen",
      privacyNote:
        "Diese Auswahl bleibt auf der Seite und wird weder gespeichert noch gesendet.",
      resultLabel: "Deine Auswertung",
      feedback: {
        aligned: {
          title: "Die Veränderung sitzt schon im Endbestand.",
          body: "Richtig: 100 Euro. Eine korrekte Addition kann die falsche Frage beantworten. Erst die Bedeutung klären, dann rechnen.",
        },
        decisionOnly: {
          title: "Richtige Zahl, Begründung fehlt.",
          body: "100 Euro stimmt, weil der Endbestand die Veränderung bereits enthält. Sprachliche Sicherheit und die Position in einer Tabelle beweisen das nicht.",
        },
        evidenceOnly: {
          title: "Dein Beleg widerspricht deiner Entscheidung.",
          body: "Wenn die Veränderung schon enthalten ist, sind 120 Euro eine Doppelzählung. Die Daten brauchen eine klare Definition.",
        },
        unsupported: {
          title: "Weder Addition noch größeres Modell klärt eine unklare Definition.",
          body: "Falsch ist die Bedeutung, nicht die Rechnung: 100 Euro sind bereits der Endbestand inklusive Veränderung.",
        },
        byChoice: {
          "trust-sum": {
            evidenceOnly: {
              title: "Dein Beleg widerspricht deiner Entscheidung.",
              body: "Wenn die Veränderung schon im Endbestand steckt, sind 120 Euro eine Doppelzählung. Richtig sind 100 Euro; die Daten brauchen eine klare Definition.",
            },
            unsupported: {
              title: "Zwei richtige Zahlen, falsche Bedeutung.",
              body: "Die Addition stimmt, aber 120 Euro zählen die Veränderung doppelt: Der Endbestand von 100 Euro enthält sie bereits. Ein sicherer Ton oder dieselbe Tabelle klären nicht, was ein Feld bedeutet.",
            },
          },
          "new-model": {
            evidenceOnly: {
              title: "Dein Beleg beantwortet die Frage schon.",
              body: "Wenn der Endbestand die Veränderung bereits enthält, lautet die Antwort 100 Euro. Auch ein größeres Modell braucht diese Definition; die Bedeutung der Felder zu prüfen klärt die Frage direkt.",
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
          "FOLDLINE will den MRR-Endbestand pro Monat im letzten abgeschlossenen Quartal wissen. Diese eine Frage zieht sich durch den ganzen Kurs.",
        tool: "Kurs · Die Frage",
      },
      {
        n: "02",
        title: "Die plausible falsche Antwort entlarven",
        description:
          "Auf sieben exportierten Tabellen antwortet die KI mit −19.960 / 9.775 / 42.565. Sie hat die Veränderungen jedes Monats addiert: Bestand und Veränderung verwechselt.",
        tool: "Kurs · Der Fehler",
      },
      {
        n: "03",
        title: "Die Reparatur verstehen",
        description:
          "Freigegebene Sichten, eine schriftliche Kennzahl-Definition (die semantische Schicht), reiner Lesezugriff und Tests. Dieselbe Frage stimmt danach mit der Datenbank überein: 334.675 / 344.450 / 387.015.",
        tool: "Kurs · Die Reparatur",
      },
      {
        n: "04",
        title: "Die ehrlichen Grenzen kennen",
        description:
          "Der Aufbau soll nachfragen oder verweigern und warnen, wenn die Daten älter als 36 Stunden sind. 9 von 9 Tests prüfen den Aufbau, nicht die KI; die Läufe zitierten die Definition 0 von 3 Mal. Urteil: begrenzter Pilot, nicht freigegeben.",
        tool: "Kurs · Grenzen",
      },
      {
        n: "05",
        title: "Du bist dran: fünf Felder",
        description:
          "Übertrage das Vorgehen auf eine eigene erfundene Frage. Der Lernbegleiter führt dich durch fünf Felder, von der Frage bis zum ersten Test. Ein gelungener Übungsfall ist keine Freigabe für ein reales System.",
        tool: "Lernbegleiter",
      },
      {
        n: "06",
        title: "Optional: die Daten hinter beiden Antworten ansehen",
        description:
          "In der interaktiven Demo öffnest du die Rohtabellen und die zertifizierten Sichten, führst dieselbe Frage auf beiden Seiten aus und prüfst das Ergebnis gegen die Definition. Die Tabellen und Ergebnisse stammen aus einem echten PostgreSQL-Lauf des Kurs-Kits.",
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
        "FOLDLINE hat 144 erfundene Kundenkonten. Eine Frage nach dem MRR-Endbestand wird in zwei Datenständen gestellt: sieben exportierte Tabellen gegen freigegebene Sichten mit schriftlicher Definition. Der Kurs zeigt aufgezeichnete Modellantworten und getrennt davon feste Datenbankprüfungen.",
      metrics: [
        { label: "Erfundene Konten", value: "144" },
        { label: "Frage", value: "1" },
        { label: "Datenstände", value: "2" },
        { label: "Monate im Vergleich", value: "3" },
      ],
      decisionQuestion:
        "Welche Definition und welche Grenzen braucht eine KI, bevor du ihrer Antwort auf genau diese Frage vertraust?",
      dataLimitations: [
        "Die Daten sind vollständig synthetisch und historisch eingefroren.",
        "Aufgezeichnete Modellantworten belegen einzelne Beobachtungen, keine allgemeine Zuverlässigkeit.",
        "9 von 9 Tests prüfen die Datenbank und die Kursregeln, nicht die KI. Anweisungen leiten, Rechte setzen durch.",
        "Ein bestandener Übungsfall ist keine Produktionsfreigabe oder Zertifizierung.",
      ],
    },
    materials: [
      {
        label: "Kurs öffnen (Englisch)",
        href: `${base}/slides.html`,
        kind: "html",
        language: "en",
        description:
          "26 Szenen mit schrittweisen Erklärungen. Pfeiltasten führen weiter; P öffnet die Moderationsansicht. Am besten auf einem großen Bildschirm im Querformat.",
      },
      {
        label: "Lernbegleiter (Englisch)",
        href: `${base}/guide.html`,
        kind: "html",
        language: "en",
        description:
          "Die Geschichte des Kurses zum Nachlesen: eine Frage, der Fehler, die Reparatur, die Grenzen und deine fünf Felder. Auch für das Smartphone.",
      },
      {
        label: "Interaktive Demo: Rohtabellen gegen zertifizierte Sichten (Englisch)",
        href: `${base}/demo.html`,
        kind: "html",
        language: "en",
        description:
          "10 Minuten, ohne Konto: Sieh dir die Tabellen an, führe dieselbe Frage auf beiden Seiten aus und vergleiche die Antworten mit der Definition.",
      },
    ],
  },
  en: {
    slug: "datenbereitschaft-fuer-ki",
    title: "Are your data ready for AI?",
    eyebrow: "Workshop 03 · Understand data and check answers",
    summary:
      "One question, two data setups, two answers. See how an AI returns a plausible but wrong number, and what fixes it. No code and no AI account; in the interactive demo you look at the data yourself.",
    description:
      "Fictional company FOLDLINE asks one question: \"Show ending MRR by month for the last complete quarter.\" On seven export tables the AI returns plausible but wrong numbers (-19,960 / 9,775 / 42,565): it added up each month's change, mixing up a level and a change. The fix: approved views, a written metric definition (the semantic layer), read-only access and tests. The same question then matches the database (334,675 / 344,450 / 387,015). The course also shows the honest limits and ends with your own question in five boxes. All data are synthetic.",
    format: "Interactive course + learner guide",
    duration: "75-minute course + 15-minute Q&A; optional 10-minute interactive demo",
    accessNote:
      "The course and the demo need no account or installation. Materials are in English; the live session is introduced in German. The model answers shown in the course were recorded in August 2026; they are not live requests.",
    audience: [
      "Beginners without SQL or programming experience",
      "Teams learning to check AI answers against data",
      "Facilitators explaining a concrete data problem",
    ],
    decisionLab: {
      kicker: "Warm-up · Balances and changes",
      title: "100 euros plus 20. Really 120?",
      prompt:
        "A record contains a month-end balance of 100 euros and a change of +20 euros. An AI reports a month-end balance of 120 euros. What do you do?",
      facts: [
        "Ending balance 100 euros",
        "Change +20 euros",
        "AI answer 120 euros",
      ],
      decisionLegend: "Your decision",
      evidenceLegend: "Your strongest evidence",
      choices: [
        {
          id: "check-definition",
          label: "Use 100 euros and check what the fields mean first.",
        },
        {
          id: "trust-sum",
          label: "Accept 120 euros: two numbers can be added.",
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
      submitLabel: "Check answer",
      resetLabel: "Try again",
      privacyNote:
        "Your selection stays on this page and is neither saved nor sent.",
      resultLabel: "Decision feedback",
      feedback: {
        aligned: {
          title: "The change is already in the ending balance.",
          body: "Correct: 100 euros. Correct arithmetic can answer the wrong question. Agree on meaning before calculating.",
        },
        decisionOnly: {
          title: "Right number, missing reason.",
          body: "100 euros is correct because the ending balance already includes the change. Confidence and table placement do not establish meaning.",
        },
        evidenceOnly: {
          title: "Your evidence contradicts your decision.",
          body: "If the change is already included, 120 euros double-counts it. The data need a clear definition.",
        },
        unsupported: {
          title: "Neither a sum nor a bigger model fixes an unclear definition.",
          body: "The meaning is wrong, not the arithmetic: 100 euros is already the ending balance, including the change.",
        },
        byChoice: {
          "trust-sum": {
            evidenceOnly: {
              title: "Your evidence contradicts your decision.",
              body: "If the change is already in the ending balance, 120 euros double-counts it. The answer is 100 euros; the data need a clear definition.",
            },
            unsupported: {
              title: "Two correct numbers, wrong meaning.",
              body: "The addition works, but 120 euros counts the change twice: the 100-euro ending balance already includes it. A confident tone or a shared table does not settle what a field means.",
            },
          },
          "new-model": {
            evidenceOnly: {
              title: "Your evidence already answers the question.",
              body: "If the ending balance already includes the change, the answer is 100 euros. A larger model still needs that definition; checking what the fields mean settles it directly.",
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
          "FOLDLINE wants ending MRR by month for the last complete quarter. This one question runs through the whole course.",
        tool: "Course · The question",
      },
      {
        n: "02",
        title: "Spot the plausible wrong answer",
        description:
          "On seven export tables the AI answers -19,960 / 9,775 / 42,565. It added up each month's change: a level and a change mixed up.",
        tool: "Course · The mistake",
      },
      {
        n: "03",
        title: "Understand the fix",
        description:
          "Approved views, a written metric definition (the semantic layer), read-only access and tests. The same question then matches the database: 334,675 / 344,450 / 387,015.",
        tool: "Course · The fix",
      },
      {
        n: "04",
        title: "Know the honest limits",
        description:
          "The setup should ask back or refuse, and warn when data are older than 36 hours. 9 of 9 tests check the setup, not the AI; the runs cited the definition 0 of 3 times. Verdict: limited pilot, not signed off.",
        tool: "Course · Limits",
      },
      {
        n: "05",
        title: "Your turn: five boxes",
        description:
          "Apply the method to one invented question of your own. The learner guide walks you through five boxes, from the question to the first test. A successful practice case does not approve a real system.",
        tool: "Learner guide",
      },
      {
        n: "06",
        title: "Optional: look at the data behind both answers",
        description:
          "In the interactive demo you open the raw tables and the certified views, run the same question on both sides and check the result against the definition. The tables and results come from a real PostgreSQL run of the course kit.",
        tool: "Interactive demo · about 10 minutes",
      },
    ],
    caseStudy: {
      companyName: "FOLDLINE",
      isFictional: true,
      location: "Fictional Berlin company",
      sector: "Business subscription software",
      period: "Q2 2026, frozen teaching snapshot",
      narrative:
        "FOLDLINE has 144 invented accounts. One question about ending MRR is asked in two data setups: seven export tables versus approved views with a written definition. The course shows recorded model answers and, separately, fixed database checks.",
      metrics: [
        { label: "Invented accounts", value: "144" },
        { label: "Question", value: "1" },
        { label: "Data setups", value: "2" },
        { label: "Compared months", value: "3" },
      ],
      decisionQuestion:
        "Which definition and boundaries does an AI need before you trust its answer to this particular question?",
      dataLimitations: [
        "All data are synthetic and historically frozen.",
        "Recorded model answers establish individual observations, not general reliability.",
        "9 of 9 tests check the database and course rules, not the AI. Instructions guide, grants enforce.",
        "Passing a practice case is not production approval or certification.",
      ],
    },
    materials: [
      {
        label: "Open course",
        href: `${base}/slides.html`,
        kind: "html",
        language: "en",
        description:
          "26 scenes with step-by-step explanations. Use the arrow keys; P opens the presenter view. Best on a large screen in landscape.",
      },
      {
        label: "Learner guide",
        href: `${base}/guide.html`,
        kind: "html",
        language: "en",
        description:
          "The course story to read at your own pace: one question, the mistake, the fix, the limits and your five boxes. Works on a phone too.",
      },
      {
        label: "Interactive demo: raw tables vs certified views",
        href: `${base}/demo.html`,
        kind: "html",
        language: "en",
        description:
          "10 minutes, no account: look at the tables, run the same question on both sides and compare the answers with the definition.",
      },
    ],
  },
};
