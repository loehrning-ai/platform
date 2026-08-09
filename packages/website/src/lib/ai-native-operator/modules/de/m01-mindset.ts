import type { AiNativeOperatorLesson } from "../../types";

export const MINDSET_LESSONS_DE: readonly AiNativeOperatorLesson[] = [
  {
    id: "mindset/1",
    moduleId: "mindset",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Erst die Aufgabe wählen, dann das Werkzeug",
    subtitle:
      "Prüfe vor der Delegation, ob eine Aufgabe für Modellunterstützung geeignet ist.",
    objective:
      "Prüfe vor der Delegation, ob eine Aufgabe für Modellunterstützung geeignet ist.",
    durationMinutes: 14,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Mit dem erforderlichen Ergebnis beginnen",
        readTimeMinutes: 5,
        content:
          "Beginne nicht mit der Frage, wo sich KI ergänzen lässt. Bestimme zuerst das Ergebnis, die zulässige Fehlerquote und die Person, die dafür verantwortlich ist. Modellunterstützung ist sinnvoll, wenn sie Aufwand reduziert, ohne diese Bedingungen zu schwächen. Ist das Ergebnis unklar, kläre es vor der Werkzeugwahl.",
      },
      {
        id: "s2",
        title: "Eignung für eine Delegation prüfen",
        readTimeMinutes: 5,
        content:
          "Gute erste Kandidaten haben definierte Eingaben, beobachtbare Ausgaben und einen Prüfschritt, der weniger kostet als die vollständige manuelle Bearbeitung. Ungeeignet sind zunächst Aufgaben mit unklarer Entscheidungsbefugnis, unumkehrbaren Folgen, sensiblen Daten ohne freigegebene Schutzmaßnahmen oder nicht prüfbaren Ergebnissen. Durch bessere Spezifikationen und Kontrollen kann sich diese Einordnung ändern.",
      },
      {
        id: "s3",
        title: "Einen begrenzten ersten Schritt delegieren",
        readTimeMinutes: 4,
        content:
          "Gib dem Modell eine eng begrenzte Aufgabe, eine klare Abbruchbedingung und ausdrückliche Vorgaben. Entscheidungen, Freigaben und externe Nebenwirkungen bleiben bei einer benannten Person, bis der Arbeitsablauf seine Kontrollen anhand realer Ergebnisse belegt hat. Erweitere den Umfang erst nach der Prüfung von Ausgaben und Fehlerfällen.",
      },
    ],
    callout: {
      kind: "quote",
      text: "Delegiere Arbeit nur, wenn der erwartete Nutzen die Kosten für Spezifikation, Prüfung und Korrektur übersteigt.",
      attr: "Arbeitsregel",
    },
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "mindset/1",
          cpId: "exercise",
          scenario:
            "Liste drei Aufgaben aus dieser Woche auf, die länger als 30 Minuten dauerten. Notiere jeweils das erwartete Ergebnis, die Kosten eines Fehlers und einen begrenzten Teil, der sicher delegiert werden könnte.",
          rows: 3,
        },
      },
    ],
  },
  {
    id: "mindset/2",
    moduleId: "mindset",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Vier Stufen betrieblicher Kontrolle",
    subtitle:
      "Bewerte auf vier Stufen, wie konsequent du modellgestützte Arbeit definierst, prüfst und steuerst.",
    objective:
      "Bewerte auf vier Stufen, wie konsequent du modellgestützte Arbeit definierst, prüfst und steuerst.",
    durationMinutes: 11,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "L0, Ungeprüft",
        readTimeMinutes: 3,
        content:
          "Aufgaben werden mit bestehenden manuellen Verfahren erledigt. Das Team hat noch nicht bewertet, wo Modellunterstützung geeignet oder ungeeignet wäre. Für einzelne Aufgaben kann das richtig sein. Die Entscheidung sollte aber auf Risiko und Kosten beruhen und nicht auf einer ungeprüften Gewohnheit.",
      },
      {
        id: "s2",
        title: "L1, Unterstützt",
        readTimeMinutes: 3,
        content:
          "Eine Person nutzt ein Modell für begrenzte Entwürfe, Zusammenfassungen oder Umformungen. Sie bleibt in der Aufgabe, liefert das Ausgangsmaterial und prüft das Ergebnis vor der Nutzung. Die Praxis ist individuell und im Team noch nicht zwingend wiederholbar.",
      },
      {
        id: "s3",
        title: "L2, Kontrollierter Arbeitsablauf",
        readTimeMinutes: 3,
        content:
          "Wiederkehrende Aufgaben haben Spezifikationen, freigegebenen Kontext, Prüfkriterien und klare Zuständigkeiten. Modellergebnisse durchlaufen die üblichen technischen oder betrieblichen Kontrollen, statt sie zu umgehen. Fehler werden erfasst und zur Verbesserung des Arbeitsablaufs verwendet.",
      },
      {
        id: "s4",
        title: "L3, Orchestriertes Aufgabenportfolio",
        readTimeMinutes: 2,
        content:
          "Mehrere unabhängige Aufgaben können parallel in getrennten Arbeitsbereichen mit klaren Berechtigungen, Freigabeschranken und benannten menschlichen Verantwortlichen laufen. Parallelität wird nur genutzt, wenn Abhängigkeiten verstanden sind. Eine Person bleibt für Annahme, Ablehnung oder Veröffentlichung jedes Ergebnisses verantwortlich.",
      },
    ],
    callout: {
      kind: "note",
      h: "Kontrollen statt Werkzeugnutzung bewerten",
      text: "Häufige Modellnutzung belegt keine hohe Reifestufe. Suche nach wiederholbaren Spezifikationen, Prüfnachweisen, Vorfallbehandlung und klarer Verantwortung. Bewerte Aufgabenfamilien getrennt, wenn sich die Praxis unterscheidet.",
    },
    exerciseKind: "self-rate",
    widgets: [
      {
        kind: "self-rate",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "mindset/2",
          cpId: "exercise",
          title: "Selbsteinschätzung der Kontrollen",
          scenario:
            "Bewerte deine heutige Arbeitsweise anhand kürzlich erledigter Aufgaben, nicht anhand geplanter Verbesserungen.",
          axes: [
            {
              id: "tasks",
              label: "Praxis der Aufgabenauswahl",
              anchors: [
                "Nicht bewertet",
                "Einzelne Versuche",
                "Definierte Aufgabenkriterien",
                "Kontrollen auf Portfolioebene",
              ],
            },
            {
              id: "tools",
              label: "Einbindung in Arbeitsabläufe",
              anchors: [
                "Manuelles Verfahren",
                "Begrenzte Unterstützung",
                "Kontrollierter Arbeitsablauf",
                "Getrennte parallele Arbeit",
              ],
            },
            {
              id: "trust",
              label: "Prüfpraxis",
              anchors: [
                "Keine Kalibrierung",
                "Informelle Prüfung",
                "Aufgabenspezifische Kontrollen",
                "Gemessene Freigabeschranken",
              ],
            },
          ],
        },
      },
    ],
  },
  {
    id: "mindset/3",
    moduleId: "mindset",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Prüfaufwand an Fehlerkosten ausrichten",
    subtitle:
      "Lege die Prüftiefe anhand von Wahrscheinlichkeit, Auswirkung und Erkennbarkeit eines Fehlers fest.",
    objective:
      "Lege die Prüftiefe anhand von Wahrscheinlichkeit, Auswirkung und Erkennbarkeit eines Fehlers fest.",
    durationMinutes: 16,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Vertrauen gilt für Aufgabe und Kontrollsatz",
        readTimeMinutes: 5,
        content:
          "Ein Modell ist nicht allgemein vertrauenswürdig oder unzuverlässig. Nachweise gelten für eine bestimmte Aufgabe, Modellversion, Eingabe, Kontextquelle, Werkzeugausstattung und Prüfmethode. Ändert sich eine dieser Bedingungen, sagt das bisherige Ergebnis möglicherweise wenig über das aktuelle Verhalten aus.",
      },
      {
        id: "s2",
        title: "Fehlerkosten systematisch bewerten",
        readTimeMinutes: 6,
        content:
          "Schätze die Fehlerwahrscheinlichkeit, ihre Auswirkung und die Erkennbarkeit durch eine prüfende Person. Ein umkehrbarer interner Entwurf braucht vielleicht nur eine kurze Durchsicht. Eine Sicherheitsänderung, Kundenentscheidung, Finanzkennzahl oder Offenlegung kann Quellenprüfung, Tests, eine zweite Prüfung oder den Verzicht auf Modellunterstützung verlangen. Der Prüfaufwand steigt mit dem verbleibenden Risiko.",
      },
      {
        id: "s3",
        title: "Nachweise aus geprüften Fällen aufbauen",
        readTimeMinutes: 5,
        content:
          "Beginne mit Aufgaben, für die eine verlässliche Referenz oder ein eindeutiger Test existiert. Vergleiche Ausgaben mit dieser Referenz, kennzeichne die Fehlerart und dokumentiere die Bedingungen. Prüfe die Stichprobe nach Änderungen an Modell, Eingabe, Daten oder Werkzeugen erneut. So wird allgemeines Vertrauen durch aufgabenspezifische Nachweise ersetzt.",
      },
    ],
    callout: {
      kind: "warn",
      h: "Verantwortung geht nicht auf das Modell über",
      text: "Eine selbstsichere Ausgabe und eine erfahrene prüfende Person können trotzdem zu einem akzeptierten Fehler führen. Die benannte verantwortliche Person muss die Kontrollen für das verbleibende Risiko durchführen und die Annahmeentscheidung erklären können.",
    },
    exerciseKind: "matrix-grid",
    widgets: [
      {
        kind: "matrix-grid",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "mindset/3",
          cpId: "exercise",
          title: "Prüfmatrix",
          scenario:
            "Wähle für jede Aufgabenart eine Mindestprüfung in deinem aktuellen Kontext. Erhöhe sie, wenn Fehler teuer oder schwer erkennbar sind.",
          rows: [
            "Interner E-Mail-Entwurf",
            "Externe Kunden-E-Mail",
            "Codeänderung unter 50 Zeilen",
            "Codeänderung über 200 Zeilen",
            "Kennzahl für die Unternehmensleitung",
            "Entwurf einer Leistungsbeurteilung",
          ],
          cols: [
            "Überfliegen",
            "Sorgfältig lesen",
            "Gegen Quelle prüfen",
            "Durch zweite Person prüfen lassen",
          ],
        },
      },
    ],
  },
  {
    id: "mindset/4",
    moduleId: "mindset",
    lessonNumber: 4,
    number: 4,
    kind: "reading",
    title: "Zuverlässige Systeme statt Heldentum belohnen",
    subtitle:
      "Richte Anerkennung im Team an klarer Verantwortung, wiederholbarer Arbeit und kontrollierten Ergebnissen aus.",
    objective:
      "Richte Anerkennung im Team an klarer Verantwortung, wiederholbarer Arbeit und kontrollierten Ergebnissen aus.",
    durationMinutes: 12,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Manueller Aufwand ist kein Qualitätsmaß",
        readTimeMinutes: 4,
        content:
          "Arbeitsstunden und geschriebene Zeilen zeigen nicht, ob eine Änderung korrekt, wartbar oder nützlich ist. Modellnutzung zeigt es ebenfalls nicht. Bewerte das Ergebnis, die zugrunde liegenden Nachweise, die Betriebskosten und die Frage, ob eine andere Person das Verfahren verstehen und wiederholen kann.",
      },
      {
        id: "s2",
        title: "Teamwirksame Kontrollen anerkennen",
        readTimeMinutes: 4,
        content:
          "Erkenne Beiträge an, die Spezifikationen klären, Regressionstests ergänzen, Fehlerarten dokumentieren, unnötige Schritte entfernen oder unsichere Arbeit stoppen. Diese Maßnahmen verbessern mehr als eine Auslieferung. Belohne weder Personalabbau noch Ausgabemenge, ohne Qualität, Belastung und Folgerisiken zu prüfen.",
      },
      {
        id: "s3",
        title: "Erfahrung an Prüfgrenzen einsetzen",
        readTimeMinutes: 4,
        content:
          "Erfahrene Fachkräfte bringen Domänenwissen, Architekturkontext und ein Gespür für schwer erkennbare Fehler ein. Nutze diese Erfahrung, um Vorgaben zu definieren, Ausnahmen zu prüfen und anderen die Bewertung von Ergebnissen zu vermitteln. Das Werkzeug kann ein Arbeitsergebnis erzeugen; die verantwortliche Person entscheidet über seine Eignung.",
      },
    ],
    exerciseKind: "plays",
    widgets: [
      {
        kind: "plays",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "mindset/4",
          cpId: "exercise",
          title: "Deine nächsten Kontrollen",
          scenario: "Wähle drei Praktiken für den kommenden Monat.",
          kindLabel: "Festlegung",
          selectedLabel: "gewählt",
          confirmedLabel: "Festgelegt",
          minPick: 3,
          options: [
            "Vor einer modellgestützten Aufgabe die Delegationsgrenze in einem Satz festhalten.",
            "Jede Woche einen modellgestützten Arbeitsablauf auf Fehler und Kontrolllücken prüfen.",
            "Wöchentlich ein geprüftes Beispiel einschließlich Fehler und Erkennungsmethode teilen.",
            "Wiederholbare Ergebnisse statt langer Arbeitszeit oder Ausgabemenge anerkennen.",
            "Eine andere Person bitten, eine Annahme bei einer folgenreichen Entscheidung zu hinterfragen.",
          ],
        },
      },
    ],
  },
  {
    id: "mindset/5",
    moduleId: "mindset",
    lessonNumber: 5,
    number: 5,
    kind: "quiz",
    title: "Modul 1, Wissensprüfung",
    subtitle:
      "Prüfe dein Verständnis von Aufgabenauswahl, Betriebskontrollen, Prüfung und Verantwortung.",
    objective:
      "Prüfe dein Verständnis von Aufgabenauswahl, Betriebskontrollen, Prüfung und Verantwortung.",
    durationMinutes: 8,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-mindset-q1",
        questionText:
          "Eine Person im Team lehnt nach einem falschen Ergebnis jede Modellunterstützung ab. Welche Antwort ist am hilfreichsten?",
        answerOptions: [
          {
            id: "a",
            text: "Zustimmen, dass Modelle für ernsthafte Arbeit ungeeignet sind.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Die konkrete Aufgabe, Fehlerkosten und verfügbaren Prüfkontrollen bewerten.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Ohne Änderung des Arbeitsablaufs ein neueres Modell verwenden.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Warten, bis Modelle keine Fehler mehr erzeugen.",
            isCorrect: false,
          },
        ],
        explanation:
          "Ein Ergebnis belegt keine Zuverlässigkeit für alle Aufgaben. Entscheide anhand aufgabenspezifischer Nachweise, der Auswirkung und Erkennbarkeit eines Fehlers sowie der Kontrollen für das verbleibende Risiko.",
      },
      {
        id: "ano-mindset-q2",
        questionText:
          "Welche Praxis beschreibt L3, ein orchestriertes Aufgabenportfolio, am besten?",
        answerOptions: [
          {
            id: "a",
            text: "Täglich automatische Codevervollständigung nutzen.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Für jedes Dokument einen Modellentwurf erstellen lassen.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Unabhängige Aufgaben getrennt und parallel mit Freigabeschranken und benannten menschlichen Verantwortlichen ausführen.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Agenten unbegrenzten Zugriff geben, damit keine Aufsicht nötig ist.",
            isCorrect: false,
          },
        ],
        explanation:
          "L3 verbindet begrenzte parallele Arbeit mit Trennung, Berechtigungen, Prüfkontrollen und ausdrücklicher Annahmeverantwortung. Parallele Werkzeugnutzung ohne diese Kontrollen erfüllt die Definition nicht.",
      },
      {
        id: "ano-mindset-q3",
        questionText:
          "Eine erfahrene Person setzt allein über Nacht eine Änderung um. Was sollte die Führungskraft prüfen?",
        answerOptions: [
          {
            id: "a",
            text: "Ob der hohe Zeitaufwand öffentlich gelobt werden sollte.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Ob das Ergebnis korrekt, prüfbar und wartbar ist und auf einem wiederholbaren Verfahren beruht.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Ob beim nächsten Mal Modellnutzung vorgeschrieben werden kann.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Nur wie schnell die Änderung die Produktion erreicht hat.",
            isCorrect: false,
          },
        ],
        explanation:
          "Weder manueller Aufwand noch Modellnutzung sind Qualitätsmaße. Prüfe Ergebnis, Nachweise, Wartbarkeit, Betriebsrisiko und die Nachvollziehbarkeit des Verfahrens.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
