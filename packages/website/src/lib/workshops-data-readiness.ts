import type { Locale } from "./i18n/locale";
import type { Workshop } from "./workshops";

const base = "/workshops/datenbereitschaft-fuer-ki";

export const DATA_READINESS_WORKSHOP: Readonly<Record<Locale, Workshop>> = {
  de: {
    slug: "datenbereitschaft-fuer-ki",
    title: "Sind deine Daten bereit für KI?",
    eyebrow: "Workshop 03 · Daten verstehen und Antworten prüfen",
    summary:
      "Gleiche Frage, gleiche Daten, andere Antwort. Du entlarvst eine plausible falsche Zahl und reparierst fünf Regeln im Browserlabor. Ohne Code oder KI-Konto.",
    description:
      "Die fiktive Firma FOLDLINE will ihren monatlichen Abo-Umsatz wissen. Eine KI liefert eine überzeugende Zahl, verwechselt aber monatliche Veränderungen mit Endbeständen. Du prüfst ein Paket aus klar benannten Auswertungsdaten, Definitionen, Kontext und begrenzten Zugriffen. Anschließend baust du fünf Regeln selbst zusammen. Alle Zahlen sind synthetisch. Die Vorführung nutzt aufgezeichnete Ergebnisse; das Übungslabor berechnet feste Fälle direkt im Browser.",
    format: "Interaktiver Kurs + Browserlabor",
    duration: "75 Minuten Kurs + 15 Minuten Fragen; Labor optional 12 Minuten",
    accessNote:
      "Ohne Konto, Installation oder KI-Zugang. Material auf Englisch, Einführung auf Deutsch. Aufgezeichnete Modellantworten vom August 2026 sind keine Live-Abfragen. Im Labor nur erfundene Beispiele verwenden.",
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
      resetLabel: "Noch einmal",
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
          title: "Ein größerer Taschenrechner löst keine unklare Frage.",
          body: "Die Rechenoperation funktioniert. Falsch ist die Bedeutung: 100 Euro sind bereits der Endbestand inklusive Veränderung.",
        },
      },
    },
    steps: [
      {
        n: "01",
        title: "Eine plausible falsche Antwort entdecken",
        description:
          "Lerne FOLDLINE und den monatlich wiederkehrenden Abo-Umsatz kennen. Stimme ab, bevor der Denkfehler sichtbar wird.",
        tool: "Kurs · Einstieg",
      },
      {
        n: "02",
        title: "Die Frage gleich lassen, die Daten erklären",
        description:
          "Vergleiche dieselbe Frage vor und nach der Reparatur. Auswertungsdaten, Definitionen, Kontext und Zugriffsrechte ändern sich gemeinsam; ein einzelner Lauf beweist keine allgemeine Zuverlässigkeit.",
        tool: "Kurs · Vergleich",
      },
      {
        n: "03",
        title: "Drei Arten von Grenzen unterscheiden",
        description:
          "Eine Anleitung empfiehlt einen Weg. Eine Regel stoppt unzulässige Fragen. Datenbankrechte verhindern den Zugriff tatsächlich.",
        tool: "Kurs · Grenzen",
      },
      {
        n: "04",
        title: "Alter und Gegenproben prüfen",
        description:
          "Eine Zahl kann rechnerisch stimmen und trotzdem veraltet sein. Prüfe auch unklare Fragen, fehlende Daten und verweigerten Zugriff.",
        tool: "Kurs · Prüfungen",
      },
      {
        n: "05",
        title: "Eine eigene erfundene Frage abgrenzen",
        description:
          "Halte Frage, Daten, Definition, Grenze und nächsten Test auf den Arbeitsblättern fest. Ein erfolgreicher Übungsfall ist keine Freigabe für ein reales System.",
        tool: "Arbeitsblätter",
      },
      {
        n: "06",
        title: "Optional: fünf Regeln im Labor reparieren",
        description:
          "Wähle Datenquelle, Berechnung, Zugriffsgrenze, Aktualität und Prüffälle. Führe sie aus, ändere eine Regel und beobachte, welche Ergebnisse ungültig werden.",
        tool: "Browserlabor · weitere 12 Minuten",
      },
    ],
    caseStudy: {
      companyName: "FOLDLINE",
      isFictional: true,
      location: "Erfundenes Berliner Unternehmen",
      sector: "Abo-Software für Geschäftskunden",
      period: "Q2 2026, eingefrorener Übungsstand",
      narrative:
        "FOLDLINE hat 144 erfundene Kundenkonten. Für dieselbe Frage nach dem Abo-Umsatz werden unklare Rohdaten mit klar definierten Auswertungsdaten verglichen. Der Kurs zeigt historische Modellantworten und getrennt davon feste Datenbankprüfungen. Das Labor ist eine Simulation dieser Regeln.",
      metrics: [
        { label: "Erfundene Konten", value: "144" },
        { label: "Monate im Vergleich", value: "3" },
        { label: "Regeln im Labor", value: "5" },
        { label: "Feste Laborfälle", value: "6" },
      ],
      decisionQuestion:
        "Welche Definition und welche Grenzen braucht eine KI, bevor du ihrer Antwort auf genau diese Frage vertraust?",
      dataLimitations: [
        "Die Daten sind vollständig synthetisch und historisch eingefroren.",
        "Aufgezeichnete Modellantworten belegen einzelne Beobachtungen, keine allgemeine Zuverlässigkeit.",
        "Das Browserlabor führt weder KI-Modelle noch SQL oder Datenbankrechte aus.",
        "Ein bestandener Übungsfall ist keine Produktionsfreigabe oder Zertifizierung.",
      ],
    },
    materials: [
      {
        label: "Lernbegleiter (Englisch)",
        href: `${base}/guide.html`,
        kind: "html",
        language: "en",
        description:
          "Lesbare Zusammenfassung mit Begriffen, Ablauf und Übungsanleitung. Auch für das Smartphone.",
      },
      {
        label: "Kurs öffnen (Englisch)",
        href: `${base}/slides.html`,
        kind: "html",
        language: "en",
        description:
          "26 Szenen mit schrittweisen Erklärungen. Pfeiltasten führen weiter; P öffnet die Moderationsansicht. Am besten auf einem großen Bildschirm im Querformat.",
      },
      {
        label: "Browserlabor (Englisch)",
        href: `${base}/data-readiness-kit/readiness-lab.html`,
        kind: "html",
        language: "en",
        description:
          "Fünf Entscheidungen, sechs feste Fälle. Funktioniert ohne Installation. Nur Auswahlwerte bleiben lokal; eigene Freitexte werden nicht gespeichert.",
      },
      {
        label: "Arbeitsblätter und Vorlagen · ZIP (Englisch)",
        href: `${base}/data-readiness-kit.zip`,
        kind: "zip",
        language: "en",
        description:
          "Fragekarte, Prüfbogen, Szenariokarten und kommentierte Definitionsvorlagen. Das interaktive Labor ist separat verlinkt.",
      },
    ],
  },
  en: {
    slug: "datenbereitschaft-fuer-ki",
    title: "Are your data ready for AI?",
    eyebrow: "Workshop 03 · Understand data and check answers",
    summary:
      "Same question, same data, different answer. Spot a plausible wrong number and repair five rules in a browser lab. No code or AI account needed.",
    description:
      "Fictional company FOLDLINE wants its monthly subscription revenue. An AI returns convincing numbers but mistakes monthly changes for ending balances. Examine a repair combining clearly named analytical data, definitions, context and limited access. Then assemble five rules yourself. All data are synthetic. The walkthrough uses recorded results; the practice lab computes fixed cases in your browser.",
    format: "Interactive course + browser lab",
    duration: "75-minute course + 15-minute Q&A; optional 12-minute lab",
    accessNote:
      "No account, installation or AI subscription. Course and materials are in English. Model answers were recorded in August 2026; they are not live requests. Use invented examples in the lab.",
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
          title: "A bigger calculator cannot fix an unclear question.",
          body: "The addition works. The meaning is wrong: 100 euros is already the ending balance, including the change.",
        },
      },
    },
    steps: [
      {
        n: "01",
        title: "Spot a plausible wrong answer",
        description:
          "Meet FOLDLINE and monthly recurring subscription revenue. Vote before the mistake is revealed.",
        tool: "Course · Opening",
      },
      {
        n: "02",
        title: "Keep the question, explain the data",
        description:
          "Compare the same question before and after the repair. Analytical data, definitions, context and permissions change together; one run does not establish general reliability.",
        tool: "Course · Comparison",
      },
      {
        n: "03",
        title: "Separate three kinds of boundary",
        description:
          "Guidance recommends a path. Policy stops unsupported questions. Database permissions make forbidden reads fail.",
        tool: "Course · Boundaries",
      },
      {
        n: "04",
        title: "Check age and counterexamples",
        description:
          "A number can be mathematically correct and still be stale. Check ambiguous requests, missing data and denied access too.",
        tool: "Course · Checks",
      },
      {
        n: "05",
        title: "Bound one invented question",
        description:
          "Record the question, data, definition, boundary and next test on the worksheets. A successful practice case does not approve a real system.",
        tool: "Worksheets",
      },
      {
        n: "06",
        title: "Optional: repair five rules in the lab",
        description:
          "Choose a data surface, calculation, permission boundary, freshness rule and set of checks. Run them, change a rule and see which results become invalid.",
        tool: "Browser lab · 12 more minutes",
      },
    ],
    caseStudy: {
      companyName: "FOLDLINE",
      isFictional: true,
      location: "Fictional Berlin company",
      sector: "Business subscription software",
      period: "Q2 2026, frozen teaching snapshot",
      narrative:
        "FOLDLINE has 144 invented accounts. The same subscription-revenue question is compared across unclear raw data and clearly defined analytical data. Historical model answers and fixed database checks are shown separately. The browser lab simulates the rules.",
      metrics: [
        { label: "Invented accounts", value: "144" },
        { label: "Compared months", value: "3" },
        { label: "Lab decisions", value: "5" },
        { label: "Fixed lab cases", value: "6" },
      ],
      decisionQuestion:
        "Which definition and boundaries does an AI need before you trust its answer to this particular question?",
      dataLimitations: [
        "All data are synthetic and historically frozen.",
        "Recorded model answers establish individual observations, not general reliability.",
        "The browser lab runs neither AI models nor SQL or database permissions.",
        "Passing a practice case is not production approval or certification.",
      ],
    },
    materials: [
      {
        label: "Learner guide",
        href: `${base}/guide.html`,
        kind: "html",
        language: "en",
        description:
          "Readable summary, glossary and exercise instructions. Works on a phone too.",
      },
      {
        label: "Open course",
        href: `${base}/slides.html`,
        kind: "html",
        language: "en",
        description:
          "26 scenes with step-by-step explanations. Use the arrow keys; P opens the presenter view. Best on a large screen in landscape.",
      },
      {
        label: "Browser lab",
        href: `${base}/data-readiness-kit/readiness-lab.html`,
        kind: "html",
        language: "en",
        description:
          "Five decisions, six fixed cases. No installation. Only choices stay in local browser storage; custom text is not saved.",
      },
      {
        label: "Worksheets and templates · ZIP",
        href: `${base}/data-readiness-kit.zip`,
        kind: "zip",
        language: "en",
        description:
          "Question card, review canvas, scenario cards and definition templates. The interactive lab is linked separately.",
      },
    ],
  },
};
