import type { AiNativeOperatorLesson } from "../../types";

export const MEASUREMENT_LESSONS_DE: readonly AiNativeOperatorLesson[] = [
  {
    id: "measurement/1",
    moduleId: "measurement",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Nutzung von Ergebnismessung trennen",
    subtitle:
      "Nutze Aktivitätsdaten für den Betrieb und miss den Wert an vorab festgelegten Ergebnissen, Kosten und Schutzgrößen.",
    objective:
      "Nutze Aktivitätsdaten für den Betrieb und miss den Wert an vorab festgelegten Ergebnissen, Kosten und Schutzgrößen.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Aktivität dient der Diagnose",
        readTimeMinutes: 1,
        content:
          "Lizenzen, aktive Personen, Modellaufrufe, Tokenmenge und Funktionsnutzung zeigen Reichweite, Last, Kosten und Unterstützungsbedarf, aber nicht, ob die Arbeit besser wurde. Halte Nutzungs-, Betriebs-, Ergebnis- und Schutzgrößen getrennt, damit keine als andere durchgeht.",
      },
      {
        id: "s2",
        title: "Ein ausgewogenes Messgrößenset festlegen",
        readTimeMinutes: 1,
        content:
          "Fang beim erwarteten Wirkmechanismus an: Welches Verhalten ändert sich, welches Ergebnis folgt? Wähle wenige rollenbezogene Ergebnisse mit Qualitäts-, Risiko-, Gleichbehandlungs- und Kostenschutzgrößen. Lege Grundgesamtheit, Berechnung, Quelle, Zuständigkeit, Prüfrhythmus und Entscheidungsschwelle fest, bevor jemand Zahlen sieht.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "measurement/1",
          cpId: "exercise",
          title: "Messgrößenset",
          scenario:
            "Nenne für einen Ablauf Wirkmechanismus, wichtigstes Ergebnis, Qualitäts- und Risikoschutzgrößen, Kostenmaß, Grundgesamtheit, Datenquelle, Zuständigkeit, Prüfrhythmus und Entscheidungsschwelle.",
          rows: 4,
        },
      },
    ],
  },
  {
    id: "measurement/2",
    moduleId: "measurement",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Eine vergleichbare Ausgangslage schaffen",
    subtitle:
      "Lege Messgröße und Vergleich vor der Einführung fest, mit Blick auf Streuung, Saisonalität und andere Änderungen.",
    objective:
      "Lege Messgröße und Vergleich vor der Einführung fest, mit Blick auf Streuung, Saisonalität und andere Änderungen.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Den Ausgangszeitraum aus den Daten ableiten",
        readTimeMinutes: 1,
        content:
          "Die Beobachtungsdauer hängt an Ereignishäufigkeit, Streuung, Saisonalität und der Änderungsgröße, die die Entscheidung erkennen muss. Friere Messdefinition, Grundgesamtheit, Ausschlüsse und Datenqualitätsprüfungen vor der Einführung ein und dokumentiere die Unsicherheit jedes historischen Mittelwerts.",
      },
      {
        id: "s2",
        title: "Einen belastbaren Vergleich aufbauen",
        readTimeMinutes: 1,
        content:
          "Veränderungen bei Personal, Nachfrage, Richtlinien, Produkt oder Markt verzerren einen einfachen Vorher-nachher-Vergleich. Nutze wo möglich ein zufälliges, gestaffeltes, abgeglichenes oder unterbrochenes Zeitreihendesign und halte parallele Änderungen und Grenzen fest. Trägt der Vergleich keine Ursachenaussage, berichte einen Zusammenhang.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "measurement/2",
          cpId: "exercise",
          scenario:
            "Lege für eine Einführung Messgröße, Grundgesamtheit, Ausschlüsse, Ausgangszeitraum, Prüfungen auf Streuung und Saisonalität, Vergleichsdesign, parallele Änderungen und die stärkste belegbare Aussage fest.",
          rows: 3,
        },
      },
    ],
  },
  {
    id: "measurement/3",
    moduleId: "measurement",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Belegprüfungen in einem festgelegten Rhythmus durchführen",
    subtitle:
      "Prüfe in einem Entscheidungsforum Ergebnisse, Unsicherheit, Schutzgrößen, Kosten und den nächsten Schritt.",
    objective:
      "Prüfe in einem Entscheidungsforum Ergebnisse, Unsicherheit, Schutzgrößen, Kosten und den nächsten Schritt.",
    durationMinutes: 9,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Den Rhythmus aus dem Entscheidungszyklus ableiten",
        readTimeMinutes: 1,
        content:
          "Die Prüfhäufigkeit folgt daraus, wie schnell Belege entstehen, wie oft sich die Maßnahme ändert und was eine späte Korrektur kostet. Leg Beteiligte, Entscheidungsrechte, nötige Belege und Abgabetermine fest. Jede Prüfung endet mit einer Entscheidung.",
      },
      {
        id: "s2",
        title: "Ein einheitliches Belegpaket verwenden",
        readTimeMinutes: 1,
        content:
          "Zeig Hypothese, Maßnahme, Ausgangslage und Vergleich, Ergebnisse mit Unsicherheit, Schutzgrößen und Störungen, Betriebskosten, Grenzen und Entscheidungsvorschlag. Halte die Entscheidung über Fortsetzen, Ändern, Pausieren oder Beenden fest, samt Verantwortung und nächster Prüfbedingung.",
      },
    ],
    exerciseKind: "slot-fill",
    widgets: [
      {
        kind: "slot-fill",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "measurement/3",
          cpId: "exercise",
          title: "Belegpaket für die Prüfung",
          scenario:
            "Entwirf fünf Abschnitte für die nächste Prüfung, je mit Belegen und der Entscheidung, die sie stützen.",
          placeholders: [
            "1. Hypothese und Maßnahme",
            "2. Ausgangslage, Vergleich und Unsicherheit",
            "3. Ergebnisse, Schutzgrößen und Störungen",
            "4. Kosten, Grenzen und Alternativen",
            "5. Entscheidung, Zuständigkeit und nächste Prüfbedingung",
          ],
        },
      },
    ],
  },
  {
    id: "measurement/4",
    moduleId: "measurement",
    lessonNumber: 4,
    number: 4,
    kind: "quiz",
    title: "Modul 9, Wissensprüfung",
    subtitle: "Drei Fragen zu Nutzung, Ausgangslage und Belegprüfung.",
    objective: "Drei Fragen zu Nutzung, Ausgangslage und Belegprüfung.",
    durationMinutes: 4,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-measurement-q1",
        questionText:
          "Eine Einführung soll die Produktivität verbessert haben. Welche Frage prüft diese Aussage am unmittelbarsten?",
        answerOptions: [
          {
            id: "a",
            text: "Welcher Modellanbieter wurde gewählt?",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Wie wurde Produktivität definiert, gegen welche Ausgangslage verglichen, und was änderte sich sonst?",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Welcher Anbieter hat die Umsetzung verkauft?",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Wie viele Nutzungslizenzen wurden vergeben?",
            isCorrect: false,
          },
        ],
        explanation:
          "Eine bezifferte Verbesserung braucht stabile Definition, belastbare Ausgangslage, glaubwürdigen Vergleich und einen Blick auf andere Erklärungen. Anbieter, Partner und Lizenzzahl belegen keine Ursache.",
      },
      {
        id: "ano-measurement-q2",
        questionText:
          "Welche Belege stützen am stärksten, dass ein modellgestütztes Programm wirkt?",
        answerOptions: [
          {
            id: "a",
            text: "Die Anzahl aktiver Personen ist gestiegen.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Die monatliche Tokenmenge ist gestiegen.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Vorab festgelegte Ergebnis- und Schutzgrößen verbessern sich im glaubwürdigen Vergleich.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Eine interne Umfrage zeigt Begeisterung für das Werkzeug.",
            isCorrect: false,
          },
        ],
        explanation:
          "Nutzung und Stimmung erklären den Betrieb, nicht den Wert. Stärkere Belege verbinden vorab festgelegte Ergebnisse und Schutzgrößen mit einem glaubwürdigen Vergleich und nennen Kosten, Unsicherheit und andere Erklärungen.",
      },
      {
        id: "ano-measurement-q3",
        questionText: "Welches Ergebnis sollte eine Belegprüfung liefern?",
        answerOptions: [
          {
            id: "a",
            text: "Einen Projektstatusbericht ohne Entscheidung.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Eine dokumentierte Entscheidung mit Zuständigkeit und nächster Prüfbedingung.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Eine Vorführung der neuesten Modellfunktionen.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Eine Rückschau ohne Messdatensatz.",
            isCorrect: false,
          },
        ],
        explanation:
          "Die Prüfung entscheidet über Fortsetzen, Ändern, Pausieren oder Beenden. Einheitliches Belegpaket, benannte Entscheidungsverantwortung und klare nächste Bedingung machen sie prüfbar und wiederverwendbar.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
