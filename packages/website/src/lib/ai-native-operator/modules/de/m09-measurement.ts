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
      "Aktivitätsdaten steuern den Betrieb. Den Wert belegen vorher festgelegte Ergebnisse, Kosten und Schutzgrößen.",
    objective:
      "Aktivitätsdaten steuern den Betrieb. Den Wert belegen vorher festgelegte Ergebnisse, Kosten und Schutzgrößen.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Aktivität ist Diagnose und kein Wertbeleg",
        readTimeMinutes: 9,
        content:
          "Lizenzen, aktive Personen, Modellaufrufe, Datenvolumen und Funktionsnutzung zeigen Reichweite, Last, Kosten und Unterstützungsbedarf. Ob die Arbeit besser geworden ist, zeigen sie nicht. Halte Nutzungsgrößen, Betriebsgrößen, Ergebnisgrößen und Schutzgrößen getrennt, damit keine Kategorie als eine andere verkauft wird.",
      },
      {
        id: "s2",
        title: "Ein ausgewogenes Messgrößenset festlegen",
        readTimeMinutes: 9,
        content:
          "Fang beim erwarteten Wirkmechanismus an: Welches Verhalten ändert sich, welches Ergebnis folgt daraus? Wähle wenige rollenbezogene Ergebnisse und stell ihnen Qualitäts-, Risiko-, Gleichbehandlungs- und Kostenschutzgrößen zur Seite. Grundgesamtheit, Berechnung, Quelle, Zuständigkeit, Prüfrhythmus und Entscheidungsschwelle stehen fest, bevor du die ersten Zahlen siehst.",
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
            "Nenne für einen Ablauf den erwarteten Wirkmechanismus, das wichtigste Ergebnis, Qualitäts- und Risikoschutzgrößen, Kostenmaß, Grundgesamtheit, Datenquelle, Zuständigkeit, Prüfrhythmus und Entscheidungsschwelle.",
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
      "Messgröße und Vergleichsdesign vor der Einführung festlegen und Streuung, Saisonalität sowie weitere Änderungen berücksichtigen.",
    objective:
      "Messgröße und Vergleichsdesign vor der Einführung festlegen und Streuung, Saisonalität sowie weitere Änderungen berücksichtigen.",
    durationMinutes: 14,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Den Ausgangszeitraum aus den Daten ableiten",
        readTimeMinutes: 7,
        content:
          "Wie lange du beobachten musst, hängt an Ereignishäufigkeit, Streuung, Saisonalität und der Änderungsgröße, die für die Entscheidung erkennbar sein muss. Messdefinition, Grundgesamtheit, Ausschlüsse und Datenqualitätsprüfungen frierst du vor der Einführung ein. Und die Unsicherheit gehört dokumentiert. Ein historischer Mittelwert ist nicht exakt.",
      },
      {
        id: "s2",
        title: "Einen belastbaren Vergleich aufbauen",
        readTimeMinutes: 7,
        content:
          "Ein Vorher-nachher-Vergleich verzerrt, sobald sich Personal, Nachfrage, Richtlinien, Produkt oder Markt mitbewegen. Nutze wo möglich ein zufälliges, gestaffeltes, abgeglichenes oder unterbrochenes Zeitreihendesign. Halte parallele Änderungen und die Grenzen der Auslegung fest. Trägt der Vergleich keine Ursachenaussage, berichte einen Zusammenhang.",
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
            "Nimm eine Einführung. Lege Messgröße, Grundgesamtheit, Ausschlüsse, Ausgangszeitraum, Prüfungen auf Streuung und Saisonalität, Vergleichsgruppe oder -design, parallele Änderungen und die stärkste Aussage fest, die die Belege tragen.",
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
      "In einem Entscheidungsforum Ergebnisse, Unsicherheit, Schutzgrößen, Kosten und die nächste kontrollierte Handlung prüfen.",
    objective:
      "In einem Entscheidungsforum Ergebnisse, Unsicherheit, Schutzgrößen, Kosten und die nächste kontrollierte Handlung prüfen.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Den Rhythmus aus dem Entscheidungszyklus ableiten",
        readTimeMinutes: 10,
        content:
          "Die Prüfhäufigkeit folgt daraus, wie schnell Belege entstehen, wie oft sich die Maßnahme ändern lässt und was eine späte Korrektur kostet. Leg Beteiligte, Entscheidungsrechte, nötige Belege und Abgabetermine fest. Die Prüfung trifft Entscheidungen. Sie zählt keine Aktivitäten auf und ist keine Produktvorführung.",
      },
      {
        id: "s2",
        title: "Ein einheitliches Belegpaket verwenden",
        readTimeMinutes: 10,
        content:
          "Zeig Hypothese, Maßnahme, Ausgangslage und Vergleich, Ergebnisse mit Unsicherheit, Schutzgrößen und Störungen, Betriebskosten, Grenzen und Entscheidungsvorschlag. Halte fest, ob fortgesetzt, geändert, pausiert oder beendet wird, wer dafür geradesteht und woran die nächste Prüfung hängt. Das Ergebnis bleibt erhalten, damit spätere Teams die Belege wiederverwenden.",
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
            "Entwirf fünf Abschnitte für die nächste Prüfung. Jeder Abschnitt nennt die gezeigten Belege und die Entscheidung, die sie stützen.",
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
    title: "Modul 9, Wissensprüfung und Abschlussaufgabe",
    subtitle: "Drei Fragen zu den Messpraktiken.",
    objective: "Drei Fragen zu den Messpraktiken.",
    durationMinutes: 15,
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
            text: "Wie wurde Produktivität definiert, welche Ausgangslage und welcher Vergleich wurden verwendet und welche parallelen Änderungen wurden berücksichtigt?",
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
          "Eine bezifferte Verbesserung braucht eine stabile Definition, eine belastbare Ausgangslage, einen glaubwürdigen Vergleich und einen Blick auf andere mögliche Erklärungen. Modellanbieter, Umsetzungspartner und Lizenzzahl belegen nicht, dass die Maßnahme dieses Ergebnis verursacht hat.",
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
            text: "Das monatliche Datenvolumen ist gestiegen.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Vorher festgelegte Ergebnis- und Schutzgrößen verbessern sich gegenüber einem glaubwürdigen Vergleich; Kosten, Unsicherheit und parallele Änderungen sind berücksichtigt.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Eine interne Umfrage zeigt Begeisterung für das Werkzeug.",
            isCorrect: false,
          },
        ],
        explanation:
          "Nutzung und Stimmung erklären den Betrieb, nicht den Wert. Stärkere Belege verbinden vorher festgelegte Ergebnisse und Schutzgrößen mit einem glaubwürdigen Vergleich und weisen Kosten, Unsicherheit und alternative Erklärungen aus.",
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
            text: "Eine dokumentierte Entscheidung auf Grundlage vorher festgelegter Messgrößen, Vergleich, Unsicherheit, Schutzgrößen, Kosten und Risiko mit Zuständigkeit und nächster Prüfbedingung.",
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
          "Die Prüfung entscheidet, ob eine Maßnahme fortgesetzt, verändert, pausiert oder beendet wird. Ein einheitliches Belegpaket, eine benannte Entscheidungsverantwortung und eine klare nächste Bedingung machen das Ergebnis prüfbar und wiederverwendbar.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
