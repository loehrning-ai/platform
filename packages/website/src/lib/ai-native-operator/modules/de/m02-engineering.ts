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
      "Trenne delegierbare Arbeit von Entscheidungen, die technische Verantwortung erfordern.",
    objective:
      "Trenne delegierbare Arbeit von Entscheidungen, die technische Verantwortung erfordern.",
    durationMinutes: 15,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Aufgabe vor der Zuweisung einordnen",
        readTimeMinutes: 5,
        content:
          "Beginne mit Umfang, Abhängigkeiten, Fehlerkosten und der verfügbaren Prüfreferenz. Ein begrenztes Refactoring mit aussagekräftigen Tests kann für eine Delegation geeignet sein. Eine Architekturentscheidung, Sicherheitsgrenze, unbekannte Migration oder Störungsbehebung verlangt möglicherweise direkte menschliche Analyse oder eine deutlich engere Modellrolle.",
      },
      {
        id: "s2",
        title: "Eine sichtbare Kontrollschleife verwenden",
        readTimeMinutes: 5,
        content:
          "Eine kontrollierte Delegation hat fünf Schritte: Ergebnis definieren, Arbeitsbereich begrenzen, Änderung erstellen lassen, Differenz und Nachweise prüfen, dann annehmen oder ablehnen. Die verantwortliche Person bestätigt nicht nur die letzte Ansicht. Sie prüft Annahmen und Verhalten und bleibt für die Zusammenführung verantwortlich.",
      },
      {
        id: "s3",
        title: "Fähigkeiten für zuverlässige Delegation",
        readTimeMinutes: 5,
        content:
          "Aufgabenzerlegung, Schnittstellengestaltung, Spezifikationen, Testentwurf, Codeprüfung, Beobachtbarkeit und Vorfallbehandlung werden wichtiger, wenn Erzeugung günstig ist. Diese Fähigkeiten begrenzen Änderungen, machen Fehler sichtbar und halten das Ergebnis für die nächste Fachkraft nachvollziehbar.",
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
            "Prüfe deine letzte ausgelieferte Änderung. Bestimme, was delegierbar war, was dein Urteil erforderte, welche Nachweise die Freigabe stützten und welche Unsicherheit verblieb.",
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
      "Schreibe eine Spezifikation, die Umsetzungsentscheidungen begrenzt und beobachtbare Annahmekriterien festlegt.",
    objective:
      "Schreibe eine Spezifikation, die Umsetzungsentscheidungen begrenzt und beobachtbare Annahmekriterien festlegt.",
    durationMinutes: 22,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Eine Spezifikation reduziert Mehrdeutigkeit",
        readTimeMinutes: 7,
        content:
          "Beschreibe vor der Umsetzung das gewünschte Verhalten, betroffene Schnittstellen, Vorgaben und Annahmenachweise. Eine Spezifikation garantiert keinen korrekten Code. Sie gibt Umsetzung und Prüfung jedoch einen gemeinsamen Maßstab. Ist eine wichtige Entscheidung offen, kennzeichne sie als offen, statt sie stillschweigend vom Agenten ableiten zu lassen.",
      },
      {
        id: "s2",
        title: "Fünf nützliche Teile einer Spezifikation",
        readTimeMinutes: 8,
        content:
          "Verwende fünf Teile: (1) Ziel einschließlich Nutzer- oder Systemergebnis, (2) Schnittstellen wie API-Verträge, Funktionssignaturen, Datenformen und erlaubte Dateien, (3) unveränderliche Bedingungen, (4) ausdrückliche Nichtziele und verbotene Änderungen sowie (5) Testfälle mit konkreten Eingaben und erwarteten Ergebnissen. Ergänze bei Bedarf Vorgaben für Sicherheit, Datenschutz, Migration oder Rücknahme.",
      },
      {
        id: "s3",
        title: "Vorgaben nach Risiko priorisieren",
        readTimeMinutes: 7,
        content:
          "Investiere Spezifikationsaufwand dort, wo eine falsche Umsetzung schaden könnte oder schwer erkennbar wäre. Beschreibe Randbedingungen, Fehlerverhalten, Kompatibilitätsanforderungen und die erforderlichen Annahmenachweise. Zusätzlicher Text ist nur nützlich, wenn er eine echte Mehrdeutigkeit beseitigt. Länge allein verbessert keine Spezifikation.",
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
            "Schreibe eine fünfteilige Spezifikation für einen echten Eintrag im Arbeitsvorrat. Nenne mindestens eine unveränderliche Bedingung, ein Nichtziel und einen Test für den Fehlerfall.",
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
      "Führe unabhängige Agentenaufgaben gleichzeitig aus, ohne verdeckte Konflikte oder ungeprüfte Änderungen zu erzeugen.",
    objective:
      "Führe unabhängige Agentenaufgaben gleichzeitig aus, ohne verdeckte Konflikte oder ungeprüfte Änderungen zu erzeugen.",
    durationMinutes: 24,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Parallelität braucht unabhängige Grenzen",
        readTimeMinutes: 8,
        content:
          "Mehrere Agenten können nur dann gleichzeitig arbeiten, wenn Umfang, Dateien, Daten, Berechtigungen und Abschlusskriterien klar sind. Verwende getrennte Arbeitsbäume oder isolierte Umgebungen, vermeide gemeinsam veränderliche Ressourcen und kläre Abhängigkeiten vor dem Start. Die Parallelisierung gekoppelter Aufgaben erzeugt oft mehr Abstimmungsaufwand als Nutzen.",
      },
      {
        id: "s2",
        title: "Ein begrenztes Einstiegsmuster",
        readTimeMinutes: 8,
        content:
          "Beginne mit drei unabhängigen Rollen: Ein Agent untersucht einen Fehler und schlägt eine Behebung vor, ein zweiter setzt eine kleine spezifizierte Änderung um und ein dritter prüft Tests oder Dokumentation. Jede Rolle erhält eine enge Eingabe und Ausgabe. Eine benannte technische Fachkraft prüft die Ergebnisse, löst Konflikte und entscheidet über das weitere Vorgehen.",
      },
      {
        id: "s3",
        title: "Häufige Fehler paralleler Arbeit",
        readTimeMinutes: 8,
        content:
          "Parallele Arbeit scheitert, wenn Agenten überlappende Bereiche ändern, veraltete Annahmen verwenden, Berechtigungen überschreiten oder schneller Änderungen erzeugen, als Menschen sie prüfen können. Verringere die Gleichzeitigkeit, begrenze die Spezifikationen, aktualisiere gemeinsamen Kontext und verstärke Integrationstests. Die Zahl der Agenten ist kein Leistungsziel.",
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
            "Definiere drei unabhängige Agentenaufträge. Nenne jeweils Rolle, Umfangsgrenze, erwartetes Ergebnis und menschliche Verantwortung.",
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
      "Nutze repräsentative Fälle, Regressionsprüfungen und ausdrückliche Freigabekriterien für Agentenänderungen.",
    objective:
      "Nutze repräsentative Fälle, Regressionsprüfungen und ausdrückliche Freigabekriterien für Agentenänderungen.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Evaluationen liefern begrenzte Nachweise",
        readTimeMinutes: 7,
        content:
          "Eine Evaluationssammlung prüft definiertes Verhalten an bekannten Fällen. Sie kann Regressionen zeigen und Versionen vergleichen, beweist aber keine Sicherheit außerhalb dieser Sammlung. Ergänze sie je nach Aufgabenrisiko durch Codeprüfung, Sicherheitskontrollen, gestufte Freigabe, Beobachtung und Vorfallbehandlung.",
      },
      {
        id: "s2",
        title: "Fälle aus realer Arbeit und bekannten Risiken wählen",
        readTimeMinutes: 7,
        content:
          "Baue die kleinste Sammlung, die wichtige Normalfälle, Randbedingungen und beobachtete Fehlerarten abbildet. Automatisiere die Bewertung, wenn eine verlässliche Referenz vorhanden ist. Nutze dokumentierte menschliche Bewertungsregeln, wenn Urteil erforderlich ist, und miss die Übereinstimmung der Prüfenden, wenn Unterschiede eine Freigabeentscheidung verändern würden.",
      },
      {
        id: "s3",
        title: "Freigabe- und Rücknahmekriterien festlegen",
        readTimeMinutes: 6,
        content:
          "Führe die relevanten Evaluationen nach Änderungen an Modell, Eingabe, Kontext, Werkzeugen oder Richtlinien aus. Lege fest, welche Regressionen die Freigabe sperren, wer eine Ausnahme genehmigen darf, welche Nachweise dafür nötig sind und wie eine Rücknahme erfolgt. Speichere Version und Ergebnis, damit ein Vorfall rekonstruierbar bleibt.",
      },
    ],
    callout: {
      kind: "note",
      h: "Eine nützliche Fallgliederung",
      text: "Gliedere Fälle in: (1) kritische Bedingungen, die immer erfüllt sein müssen, (2) repräsentative Arbeitsfälle und (3) gegnerische oder zuvor beobachtete Fehler. Werte jede Gruppe getrennt aus, damit ein Durchschnitt keine kritische Regression verdeckt.",
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
            "Definiere für einen Agentenarbeitsablauf fünf Fälle: drei repräsentative und zwei gegnerische. Beschreibe Eingabe, erwartetes Verhalten und Bewertungsmethode.",
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
      "Prüfe dein Verständnis von Delegationsgrenzen, Spezifikationen, paralleler Arbeit und Freigabeevaluationen.",
    objective:
      "Prüfe dein Verständnis von Delegationsgrenzen, Spezifikationen, paralleler Arbeit und Freigabeevaluationen.",
    durationMinutes: 9,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-engineering-q1",
        questionText:
          "Welche Teile einer Spezifikation bestimmen das gewünschte Ergebnis und seine Annahme am unmittelbarsten?",
        answerOptions: [
          {
            id: "a",
            text: "Das Ziel und die Testfälle.",
            isCorrect: true,
          },
          {
            id: "b",
            text: "Der längste erklärende Absatz.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Die Liste verfügbarer Modelle.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Name und Zeitstempel der erstellenden Person.",
            isCorrect: false,
          },
        ],
        explanation:
          "Das Ziel beschreibt das erforderliche Ergebnis. Testfälle liefern beobachtbare Annahmenachweise. Schnittstellen, unveränderliche Bedingungen und Nichtziele bleiben wichtige Vorgaben; Länge oder Urheberschaft definieren keine Korrektheit.",
      },
      {
        id: "ano-engineering-q2",
        questionText:
          "Eine folgenreiche Agentenänderung hat die erforderliche Evaluationsschranke nicht bestanden. Was muss geschehen?",
        answerOptions: [
          {
            id: "a",
            text: "Freigeben, weil Evaluationen die Auslieferung verlangsamen.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Die Freigabe sperren, sofern nicht die dokumentierte Ausnahmeverantwortung Nachweise prüft und das verbleibende Risiko annimmt.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Erst nach einer Nutzerbeschwerde evaluieren.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Zusammenführen und nur eine informelle Notiz hinterlassen.",
            isCorrect: false,
          },
        ],
        explanation:
          "Eine Freigabeschranke wirkt nur, wenn ihr Fehlschlag die Freigabe sperrt oder ein kontrolliertes Ausnahmeverfahren auslöst. Die Ausnahme braucht Verantwortung, Nachweise, eine benannte Restgefahr und einen Rücknahmeweg.",
      },
      {
        id: "ano-engineering-q3",
        questionText:
          "Drei parallele Agenten erzeugen widersprüchliche, mangelhafte Änderungen. Welche Reaktion verbessert zuerst den Arbeitsablauf?",
        answerOptions: [
          {
            id: "a",
            text: "Alle Modelle austauschen, ohne die Aufträge zu prüfen.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Die Gleichzeitigkeit erhöhen, um mehr Alternativen zu erhalten.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Überlappung reduzieren, Spezifikationen schärfen, Kontext aktualisieren und Integrationsprüfungen verstärken.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Alle Änderungen zusammenführen und Fehler in Produktion beheben.",
            isCorrect: false,
          },
        ],
        explanation:
          "Konflikte und mangelhafte Ausgaben deuten oft auf gekoppelte Bereiche, mehrdeutige Anforderungen, veralteten Kontext oder schwache Integrationskontrollen hin. Behebe diese Bedingungen, bevor du das Modell wechselst oder die Gleichzeitigkeit erhöhst.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
