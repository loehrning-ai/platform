import type { AiNativeOperatorLesson } from "../../types";

export const ENGINEERING_LESSONS_DE: readonly AiNativeOperatorLesson[] = [
  {
    id: "engineering/1",
    moduleId: "engineering",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Technische Arbeit als kontrollierte Delegation",
    subtitle:
      "Trenne delegierbare Arbeit von Entscheidungen, die du selbst tragen musst.",
    objective:
      "Trenne delegierbare Arbeit von Entscheidungen, die du selbst tragen musst.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Aufgabe vor der Zuweisung einordnen",
        readTimeMinutes: 1,
        content:
          "Prüfe zuerst Umfang, Abhängigkeiten, Fehlerkosten und Prüfreferenz. Ein begrenztes Refactoring mit guten Tests ist delegierbar. Architekturentscheidung, Sicherheitsgrenze, unbekannte Migration oder Störung verlangen deine Analyse oder eine viel engere Modellrolle.",
      },
      {
        id: "s2",
        title: "Eine sichtbare Kontrollschleife verwenden",
        readTimeMinutes: 1,
        content:
          "Leg das Ergebnis fest, begrenze den Arbeitsbereich, lass den Agenten eine Änderung erzeugen, prüf Änderungsansicht und Nachweise und nimm an oder lehn ab. Die verantwortliche Person prüft Annahmen und Verhalten und verantwortet das Zusammenführen.",
      },
      {
        id: "s3",
        title: "Fähigkeiten für zuverlässige Delegation",
        readTimeMinutes: 1,
        content:
          "Wenn Erzeugen billig ist, zählen Aufgabenzerlegung, Schnittstellengestaltung, Spezifikation, Testentwurf, Codeprüfung, Beobachtbarkeit und Vorfallbehandlung. Sie begrenzen Änderungen, machen Fehler sichtbar und halten Ergebnisse lesbar.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "engineering/1",
          cpId: "exercise",
          scenario:
            "Nimm deine letzte ausgelieferte Änderung. Notiere, was delegierbar war, was dein Urteil brauchte, welche Nachweise die Freigabe trugen und welche Unsicherheit blieb.",
          rows: 4,
        },
      },
    ],
  },
  {
    id: "engineering/2",
    moduleId: "engineering",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Spezifikationsgeleitete Entwicklung",
    subtitle:
      "Begrenze Umsetzungsentscheidungen und leg beobachtbare Abnahmekriterien fest.",
    objective:
      "Begrenze Umsetzungsentscheidungen und leg beobachtbare Abnahmekriterien fest.",
    durationMinutes: 7,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Eine Spezifikation reduziert Mehrdeutigkeit",
        readTimeMinutes: 1,
        content:
          "Beschreibe vor der Umsetzung Verhalten, betroffene Schnittstellen, Vorgaben und Abnahmenachweis. Das gibt Umsetzung und Prüfung einen Maßstab, aber keine Garantie für korrekten Code. Schreib offene Entscheidungen auf, damit der Agent nicht rät.",
      },
      {
        id: "s2",
        title: "Fünf nützliche Teile einer Spezifikation",
        readTimeMinutes: 1,
        content:
          "(1) Ziel mit Ergebnis für Anwender oder System, (2) Schnittstellen wie API-Verträge, Funktionssignaturen, Datenformen und erlaubte Dateien, (3) unveränderliche Bedingungen, (4) Nichtziele und verbotene Änderungen, (5) Testfälle mit Eingaben und erwarteten Ergebnissen. Bei Bedarf dazu Sicherheit, Datenschutz, Migration oder Rücknahme.",
      },
      {
        id: "s3",
        title: "Vorgaben nach Risiko priorisieren",
        readTimeMinutes: 1,
        content:
          "Spezifiziere am genauesten, wo eine falsche Umsetzung schadet oder lange unentdeckt bliebe: Randbedingungen, Fehlerverhalten, Kompatibilität und geforderte Abnahmenachweise. Mehr Text lohnt nur gegen echte Mehrdeutigkeit.",
      },
    ],
    callout: {
      kind: "spec",
      h: "Beispiel: eine umsetzbare Spezifikation",
      lines: [
        "# Ziel",
        "Idempotenz für den POST-Endpunkt /api/orders über den Header Idempotency-Key ergänzen.",
        "",
        "# Schnittstellen",
        "- Datei: services/orders/handler.go",
        "- Header: Idempotency-Key (UUID)",
        '- Speicher: vorhandener Redis-Client; Schlüsselpräfix "idem:orders:"',
        "",
        "# Unveränderliche Bedingungen",
        "- Gleicher Idempotency-Key und gleicher Inhalt liefern innerhalb von 24 Stunden die ursprüngliche Antwort.",
        "- Gleicher Schlüssel und anderer Inhalt liefern 409.",
        "",
        "# Nichtziele",
        "- /api/payments NICHT ändern. Antwortform NICHT ändern.",
        "",
        "# Tests",
        "- Test: Wiederholung liefert dieselbe OrderID",
        "- Test: Wiederholung mit geändertem Inhalt liefert 409",
        "- Test: Ablaufzeit von 24 Stunden wird eingehalten",
      ],
    },
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "engineering/2",
          cpId: "exercise",
          title: "Spezifikation erstellen",
          scenario:
            "Schreibe eine fünfteilige Spezifikation für einen echten Eintrag aus deinem Arbeitsvorrat, mit mindestens einer unveränderlichen Bedingung, einem Nichtziel und einem Test für den Fehlerfall.",
          rows: 4,
        },
      },
    ],
  },
  {
    id: "engineering/3",
    moduleId: "engineering",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Parallele Arbeit mit Trennung",
    subtitle:
      "Lass unabhängige Agentenaufgaben gleichzeitig laufen, ohne verdeckte Konflikte.",
    objective:
      "Lass unabhängige Agentenaufgaben gleichzeitig laufen, ohne verdeckte Konflikte.",
    durationMinutes: 9,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Parallelität braucht unabhängige Grenzen",
        readTimeMinutes: 1,
        content:
          "Lass Agenten nur parallel arbeiten, wenn Umfang, Dateien, Daten, Berechtigungen und Abschlusskriterien je klar sind. Nutze getrennte Arbeitsbäume oder Umgebungen, teile keine veränderlichen Ressourcen und kläre Abhängigkeiten vorab; gekoppelte Aufgaben kosten mehr Abstimmung, als sie sparen.",
      },
      {
        id: "s2",
        title: "Ein begrenztes Einstiegsmuster",
        readTimeMinutes: 1,
        content:
          "Fang mit drei Rollen an: Ein Agent untersucht und schlägt eine Behebung vor, einer setzt eine kleine spezifizierte Änderung um, einer prüft Tests oder Dokumentation. Eine benannte Fachkraft prüft die Ergebnisse, löst Konflikte und entscheidet über das Weitere.",
      },
      {
        id: "s3",
        title: "Häufige Fehler paralleler Arbeit",
        readTimeMinutes: 1,
        content:
          "Parallele Arbeit scheitert, wenn Agenten überlappende Bereiche ändern, veralteten Annahmen folgen, Berechtigungen überschreiten oder schneller Änderungen erzeugen, als Menschen sie lesen. Dann senkst du die Gleichzeitigkeit, schärfst Spezifikationen, aktualisierst den gemeinsamen Kontext und stärkst Integrationstests.",
      },
    ],
    exerciseKind: "slot-fill",
    widgets: [
      {
        kind: "slot-fill",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "engineering/3",
          cpId: "exercise",
          title: "Deine erste Aufgabenverteilung",
          scenario:
            "Definiere drei unabhängige Agentenaufträge mit Rolle, Umfangsgrenze, erwartetem Ergebnis und menschlicher Verantwortung.",
          placeholders: ["Agent A, Rolle", "Agent B, Rolle", "Agent C, Rolle"],
        },
      },
    ],
  },
  {
    id: "engineering/4",
    moduleId: "engineering",
    lessonNumber: 4,
    number: 4,
    kind: "reading",
    title: "Evaluationen als Freigabekontrolle",
    subtitle:
      "Sichere Agentenänderungen mit repräsentativen Fällen, Regressionsprüfungen und Freigabekriterien ab.",
    objective:
      "Sichere Agentenänderungen mit repräsentativen Fällen, Regressionsprüfungen und Freigabekriterien ab.",
    durationMinutes: 10,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Evaluationen liefern begrenzte Nachweise",
        readTimeMinutes: 1,
        content:
          "Eine Evaluationssammlung prüft definiertes Verhalten an bekannten Fällen, zeigt Regressionen und vergleicht Versionen. Außerhalb der Sammlung beweist sie nichts. Je nach Risiko kommen Codeprüfung, Sicherheitskontrollen, gestufte Freigabe, Beobachtung und Vorfallbehandlung dazu.",
      },
      {
        id: "s2",
        title: "Fälle aus realer Arbeit und bekannten Risiken wählen",
        readTimeMinutes: 1,
        content:
          "Deck wichtige Normalfälle, Randbedingungen und beobachtete Fehlerarten mit der kleinsten Sammlung ab. Mit verlässlicher Referenz bewertest du automatisch, sonst nach schriftlichen Regeln, und misst die Einigkeit der Prüfenden, wenn sie eine Freigabe kippen könnte.",
      },
      {
        id: "s3",
        title: "Freigabe- und Rücknahmekriterien festlegen",
        readTimeMinutes: 1,
        content:
          "Nach jeder Änderung an Modell, Eingabe, Kontext, Werkzeugen oder Richtlinie laufen die relevanten Evaluationen. Lege fest, welche Regressionen sperren, wer Ausnahmen mit welchen Nachweisen genehmigt und wie die Rücknahme läuft, und speichere Version und Ergebnis.",
      },
    ],
    callout: {
      kind: "note",
      h: "Eine nützliche Fallgliederung",
      text: "Teile die Fälle in (1) kritische Bedingungen, die immer gelten müssen, (2) repräsentative Arbeitsfälle und (3) gegnerische oder früher beobachtete Fehler. Werte jede Gruppe einzeln aus, damit kein Durchschnitt eine kritische Regression verdeckt.",
    },
    exerciseKind: "slot-fill",
    widgets: [
      {
        kind: "slot-fill",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "engineering/4",
          cpId: "exercise",
          title: "Evaluationsfälle",
          scenario:
            "Lege fünf Fälle für einen Agentenarbeitsablauf fest: drei repräsentative und zwei gegnerische, je mit Eingabe, erwartetem Verhalten und Bewertungsmethode.",
          placeholders: [
            "Testfall 1 (typisch)",
            "Testfall 2 (typisch)",
            "Testfall 3 (typisch)",
            "Testfall 4 (gegnerisch)",
            "Testfall 5 (gegnerisch)",
          ],
        },
      },
    ],
  },
  {
    id: "engineering/5",
    moduleId: "engineering",
    lessonNumber: 5,
    number: 5,
    kind: "quiz",
    title: "Modul 2, Wissensprüfung",
    subtitle:
      "Drei Fragen zu Delegationsgrenzen, Spezifikationen, paralleler Arbeit und Freigabeevaluationen.",
    objective:
      "Drei Fragen zu Delegationsgrenzen, Spezifikationen, paralleler Arbeit und Freigabeevaluationen.",
    durationMinutes: 4,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-engineering-q1",
        questionText:
          "Welche Teile einer Spezifikation legen das gewünschte Ergebnis und seine Abnahme am direktesten fest?",
        answerOptions: [
          {
            id: "a",
            text: "Ziel und Testfälle.",
            isCorrect: true,
          },
          {
            id: "b",
            text: "Der längste erklärende Absatz.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Die Liste der verfügbaren Modelle.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Name und Zeitstempel der Verfasserin.",
            isCorrect: false,
          },
        ],
        explanation:
          "Das Ziel sagt, was herauskommen muss, Testfälle machen die Abnahme beobachtbar. Schnittstellen, Bedingungen und Nichtziele zählen auch; Länge und Urheberschaft definieren nichts.",
      },
      {
        id: "ano-engineering-q2",
        questionText:
          "Eine folgenreiche Agentenänderung ist an der geforderten Evaluationsschranke gescheitert. Was passiert jetzt?",
        answerOptions: [
          {
            id: "a",
            text: "Freigeben, Evaluationen bremsen nur die Auslieferung.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Sperren, außer die Ausnahmeverantwortung prüft Nachweise und trägt das Restrisiko.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Erst nach einer Anwenderbeschwerde evaluieren.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Zusammenführen und eine informelle Notiz hinterlassen.",
            isCorrect: false,
          },
        ],
        explanation:
          "Eine Schranke wirkt nur, wenn ihr Scheitern die Freigabe sperrt oder ein kontrolliertes Ausnahmeverfahren auslöst. Die Ausnahme braucht Verantwortung, Nachweise, benanntes Restrisiko und Rücknahmeweg.",
      },
      {
        id: "ano-engineering-q3",
        questionText:
          "Drei parallele Agenten liefern widersprüchliche, mangelhafte Änderungen. Was verbessert den Arbeitsablauf zuerst?",
        answerOptions: [
          {
            id: "a",
            text: "Alle Modelle austauschen, ohne die Aufträge anzusehen.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Mehr Agenten gleichzeitig laufen lassen, für mehr Alternativen.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Überlappung senken, Spezifikationen schärfen, Kontext aktualisieren, Integrationsprüfungen stärken.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Alles zusammenführen und die Fehler in Produktion beheben.",
            isCorrect: false,
          },
        ],
        explanation:
          "Konflikte und schwache Ausgaben kommen meist von gekoppelten Bereichen, vagen Anforderungen, veraltetem Kontext oder schwachen Integrationskontrollen. Behebe das, bevor du das Modell wechselst oder mehr Agenten einsetzt.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
