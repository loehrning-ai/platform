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
      "Trenne delegierbare Arbeit von Entscheidungen, die technische Verantwortung verlangen.",
    objective:
      "Trenne delegierbare Arbeit von Entscheidungen, die technische Verantwortung verlangen.",
    durationMinutes: 15,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Aufgabe vor der Zuweisung einordnen",
        readTimeMinutes: 5,
        content:
          "Vier Fragen vor jeder Zuweisung: Umfang, Abhängigkeiten, Fehlerkosten, Prüfreferenz. Ein begrenztes Refactoring mit aussagekräftigen Tests eignet sich zur Delegation. Architekturentscheidung, Sicherheitsgrenze, unbekannte Migration oder Störung im Betrieb verlangen deinen eigenen Kopf oder eine sehr viel engere Modellrolle.",
      },
      {
        id: "s2",
        title: "Eine sichtbare Kontrollschleife verwenden",
        readTimeMinutes: 5,
        content:
          "Fünf Schritte, immer dieselben: Ergebnis definieren, Arbeitsbereich begrenzen, Änderung erzeugen lassen, Differenz und Nachweise prüfen, annehmen oder ablehnen. Die verantwortliche Person nickt nicht die letzte Ansicht ab. Sie prüft Annahmen und Verhalten und bleibt für die Zusammenführung verantwortlich.",
      },
      {
        id: "s3",
        title: "Fähigkeiten für zuverlässige Delegation",
        readTimeMinutes: 5,
        content:
          "Erzeugen ist billig geworden. Wertvoll sind jetzt Aufgabenzerlegung, Schnittstellengestaltung, Spezifikationen, Testentwurf, Codeprüfung, Beobachtbarkeit und Vorfallbehandlung. Diese Fähigkeiten begrenzen Änderungen, machen Fehler sichtbar und halten das Ergebnis für die nächste Fachkraft lesbar.",
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
            "Nimm deine letzte ausgelieferte Änderung. Was davon war delegierbar, was brauchte dein Urteil, welche Nachweise trugen die Freigabe, und welche Unsicherheit blieb?",
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
      "Schreibe eine Spezifikation, die Umsetzungsentscheidungen begrenzt und die Annahme beobachtbar macht.",
    objective:
      "Schreibe eine Spezifikation, die Umsetzungsentscheidungen begrenzt und die Annahme beobachtbar macht.",
    durationMinutes: 22,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Eine Spezifikation reduziert Mehrdeutigkeit",
        readTimeMinutes: 7,
        content:
          "Eine Spezifikation garantiert keinen korrekten Code. Sie gibt Umsetzung und Prüfung denselben Maßstab, und das reicht. Beschreibe vorher das gewünschte Verhalten, betroffene Schnittstellen, Vorgaben und den Nachweis, der die Annahme trägt. Ist eine wichtige Entscheidung offen, schreib das hin. Sonst trifft der Agent sie stillschweigend.",
      },
      {
        id: "s2",
        title: "Fünf nützliche Teile einer Spezifikation",
        readTimeMinutes: 8,
        content:
          "Fünf Teile: (1) das Ziel samt Ergebnis für Anwender oder System, (2) Schnittstellen wie API-Verträge, Funktionssignaturen, Datenformen und erlaubte Dateien, (3) unveränderliche Bedingungen, (4) ausdrückliche Nichtziele und verbotene Änderungen, (5) Testfälle mit konkreten Eingaben und erwarteten Ergebnissen. Wo nötig kommen Vorgaben für Sicherheit, Datenschutz, Migration oder Rücknahme dazu.",
      },
      {
        id: "s3",
        title: "Vorgaben nach Risiko priorisieren",
        readTimeMinutes: 7,
        content:
          "Steck den Spezifikationsaufwand dorthin, wo eine falsche Umsetzung Schaden anrichtet oder lange unentdeckt bliebe. Randbedingungen, Fehlerverhalten, Kompatibilität, geforderte Annahmenachweise. Zusätzlicher Text hilft nur, wenn er eine echte Mehrdeutigkeit beseitigt. Länge verbessert keine Spezifikation.",
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
            "Schreibe eine fünfteilige Spezifikation für einen echten Eintrag aus deinem Arbeitsvorrat. Mindestens eine unveränderliche Bedingung, ein Nichtziel und ein Test für den Fehlerfall.",
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
      "Lass unabhängige Agentenaufgaben gleichzeitig laufen, ohne verdeckte Konflikte oder ungeprüfte Änderungen zu erzeugen.",
    objective:
      "Lass unabhängige Agentenaufgaben gleichzeitig laufen, ohne verdeckte Konflikte oder ungeprüfte Änderungen zu erzeugen.",
    durationMinutes: 24,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Parallelität braucht unabhängige Grenzen",
        readTimeMinutes: 8,
        content:
          "Wann dürfen mehrere Agenten gleichzeitig arbeiten? Wenn Umfang, Dateien, Daten, Berechtigungen und Abschlusskriterien für jeden von ihnen klar sind. Getrennte Arbeitsbäume oder isolierte Umgebungen, keine gemeinsam veränderlichen Ressourcen, Abhängigkeiten vor dem Start geklärt. Gekoppelte Aufgaben zu parallelisieren kostet meist mehr Abstimmung, als es einbringt.",
      },
      {
        id: "s2",
        title: "Ein begrenztes Einstiegsmuster",
        readTimeMinutes: 8,
        content:
          "Fang mit drei unabhängigen Rollen an. Ein Agent untersucht einen Fehler und schlägt eine Behebung vor, ein zweiter setzt eine kleine spezifizierte Änderung um, ein dritter prüft Tests oder Dokumentation. Jede Rolle bekommt eine enge Eingabe und eine enge Ausgabe. Eine benannte technische Fachkraft prüft die Ergebnisse, löst Konflikte und entscheidet, wie es weitergeht.",
      },
      {
        id: "s3",
        title: "Häufige Fehler paralleler Arbeit",
        readTimeMinutes: 8,
        content:
          "Parallele Arbeit scheitert, wenn Agenten überlappende Bereiche ändern, mit veralteten Annahmen arbeiten, Berechtigungen überschreiten oder schneller Änderungen erzeugen, als Menschen sie lesen können. Dann hilft weniger Gleichzeitigkeit, engere Spezifikationen, aktualisierter gemeinsamer Kontext und stärkere Integrationstests. Die Zahl der Agenten ist kein Leistungsziel.",
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
            "Definiere drei unabhängige Agentenaufträge, jeweils mit Rolle, Umfangsgrenze, erwartetem Ergebnis und menschlicher Verantwortung.",
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
      "Repräsentative Fälle, Regressionsprüfungen und ausdrückliche Freigabekriterien für Agentenänderungen.",
    objective:
      "Repräsentative Fälle, Regressionsprüfungen und ausdrückliche Freigabekriterien für Agentenänderungen.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Evaluationen liefern begrenzte Nachweise",
        readTimeMinutes: 7,
        content:
          "Eine Evaluationssammlung prüft definiertes Verhalten an bekannten Fällen. Mehr nicht. Sie zeigt Regressionen und vergleicht Versionen, beweist aber keine Sicherheit außerhalb der Sammlung. Je nach Risiko der Aufgabe kommen Codeprüfung, Sicherheitskontrollen, gestufte Freigabe, Beobachtung und Vorfallbehandlung dazu.",
      },
      {
        id: "s2",
        title: "Fälle aus realer Arbeit und bekannten Risiken wählen",
        readTimeMinutes: 7,
        content:
          "Bau die kleinste Sammlung, die wichtige Normalfälle, Randbedingungen und schon beobachtete Fehlerarten abdeckt. Gibt es eine verlässliche Referenz, automatisiere die Bewertung. Braucht es Urteil, schreib die Bewertungsregeln auf und miss, wie einig sich die Prüfenden sind, sobald ihre Unterschiede eine Freigabe kippen könnten.",
      },
      {
        id: "s3",
        title: "Freigabe- und Rücknahmekriterien festlegen",
        readTimeMinutes: 6,
        content:
          "Modell, Eingabe, Kontext, Werkzeuge oder Richtlinie geändert? Dann laufen die relevanten Evaluationen. Lege fest, welche Regressionen die Freigabe sperren, wer eine Ausnahme genehmigen darf, welche Nachweise das kostet und wie die Rücknahme aussieht. Speichere Version und Ergebnis, damit sich ein Vorfall rekonstruieren lässt.",
      },
    ],
    callout: {
      kind: "note",
      h: "Eine nützliche Fallgliederung",
      text: "Drei Gruppen: (1) kritische Bedingungen, die immer gelten müssen, (2) repräsentative Arbeitsfälle, (3) gegnerische oder früher beobachtete Fehler. Werte jede Gruppe für sich aus. Ein Durchschnitt verdeckt sonst genau die Regression, die zählt.",
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
            "Fünf Fälle für einen Agentenarbeitsablauf, drei repräsentative und zwei gegnerische. Zu jedem: Eingabe, erwartetes Verhalten, Bewertungsmethode.",
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
    durationMinutes: 9,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-engineering-q1",
        questionText:
          "Welche Teile einer Spezifikation legen das gewünschte Ergebnis und seine Annahme am unmittelbarsten fest?",
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
          "Das Ziel sagt, was herauskommen muss, Testfälle machen die Annahme beobachtbar. Schnittstellen, unveränderliche Bedingungen und Nichtziele bleiben wichtige Vorgaben; Länge und Urheberschaft definieren keine Korrektheit.",
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
            text: "Die Freigabe bleibt gesperrt, es sei denn, die dokumentierte Ausnahmeverantwortung prüft die Nachweise und trägt das Restrisiko.",
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
          "Eine Freigabeschranke wirkt nur, wenn ihr Scheitern die Freigabe sperrt oder ein kontrolliertes Ausnahmeverfahren auslöst. Die Ausnahme braucht Verantwortung, Nachweise, eine benannte Restgefahr und einen Rücknahmeweg.",
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
            text: "Überlappung reduzieren, Spezifikationen schärfen, Kontext aktualisieren, Integrationsprüfungen verstärken.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Alles zusammenführen und die Fehler in Produktion beheben.",
            isCorrect: false,
          },
        ],
        explanation:
          "Konflikte und mangelhafte Ausgaben zeigen oft auf gekoppelte Bereiche, mehrdeutige Anforderungen, veralteten Kontext oder schwache Integrationskontrollen. Behebe das, bevor du das Modell wechselst oder noch mehr parallel laufen lässt.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
