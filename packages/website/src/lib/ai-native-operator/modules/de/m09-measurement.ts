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
      "Aktivitätsdaten für den Betrieb nutzen, den Wert jedoch mit vorher festgelegten Ergebnissen, Kosten und Schutzgrößen bewerten.",
    objective:
      "Aktivitätsdaten für den Betrieb nutzen, den Wert jedoch mit vorher festgelegten Ergebnissen, Kosten und Schutzgrößen bewerten.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Aktivität ist Diagnose und kein Wertbeleg",
        readTimeMinutes: 9,
        content:
          "Lizenzen, aktive Personen, Modellaufrufe, Datenvolumen und Funktionsnutzung können Reichweite, Last, Kosten und Unterstützungsbedarf zeigen. Sie zeigen nicht, ob die Maßnahme die Arbeit verbessert hat. Trennen Sie Nutzungsgrößen, Betriebsgrößen, Ergebnisgrößen und Schutzgrößen, damit keine Kategorie als eine andere ausgegeben wird.",
      },
      {
        id: "s2",
        title: "Ein ausgewogenes Messgrößenset festlegen",
        readTimeMinutes: 9,
        content:
          "Beginnen Sie mit dem erwarteten Wirkmechanismus: Welches Verhalten ändert sich und welches Ergebnis sollte daraus folgen? Wählen Sie wenige rollenbezogene Ergebnisse und ergänzen Sie Qualitäts-, Risiko-, Gleichbehandlungs- und Kostenschutzgrößen. Definieren Sie Grundgesamtheit, Berechnung, Quelle, Zuständigkeit, Prüfrhythmus und Entscheidungsschwelle, bevor Sie Ergebnisse betrachten.",
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
            "Nennen Sie für einen Ablauf den erwarteten Wirkmechanismus, das wichtigste Ergebnis, Qualitäts- und Risikoschutzgrößen, Kostenmaß, Grundgesamtheit, Datenquelle, Zuständigkeit, Prüfrhythmus und Entscheidungsschwelle.",
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
          "Der notwendige Beobachtungszeitraum hängt von Ereignishäufigkeit, Streuung, Saisonalität und der für die Entscheidung erkennbaren Änderungsgröße ab. Frieren Sie Messdefinition, Grundgesamtheit, Ausschlüsse und Datenqualitätsprüfungen vor der Einführung ein. Dokumentieren Sie Unsicherheit, statt einen einzelnen historischen Mittelwert als exakt zu behandeln.",
      },
      {
        id: "s2",
        title: "Einen belastbaren Vergleich aufbauen",
        readTimeMinutes: 7,
        content:
          "Ein Vorher-nachher-Vergleich kann durch Änderungen bei Personal, Nachfrage, Richtlinien, Produkt oder Markt verzerrt werden. Nutzen Sie nach Möglichkeit ein zufälliges, gestaffeltes, abgeglichenes oder unterbrochenes Zeitreihendesign. Erfassen Sie parallele Änderungen und Grenzen der Auslegung. Wenn der Vergleich keine Ursachenaussage trägt, berichten Sie nur einen Zusammenhang.",
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
            "Wählen Sie eine Einführung. Definieren Sie Messgröße, Grundgesamtheit, Ausschlüsse, Ausgangszeitraum, Prüfungen auf Streuung und Saisonalität, Vergleichsgruppe oder -design, parallele Änderungen und die stärkste durch die Belege tragbare Aussage.",
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
          "Die Prüfhäufigkeit sollte dazu passen, wie schnell Belege entstehen, wie oft die Maßnahme geändert werden kann und welche Kosten eine späte Korrektur verursacht. Legen Sie Beteiligte, Entscheidungsrechte, erforderliche Belege und Abgabetermine fest. Die Prüfung dient Entscheidungen und nicht der Aufzählung von Aktivitäten oder einer Produktvorführung.",
      },
      {
        id: "s2",
        title: "Ein einheitliches Belegpaket verwenden",
        readTimeMinutes: 10,
        content:
          "Zeigen Sie Hypothese, Maßnahme, Ausgangslage und Vergleich, Ergebnisse mit Unsicherheit, Schutzgrößen und Störungen, Betriebskosten, Grenzen und Entscheidungsvorschlag. Dokumentieren Sie Fortsetzung, Änderung, Pause oder Beendigung, benennen Sie die Zuständigkeit und die Bedingung für die nächste Prüfung. Bewahren Sie das Ergebnis auf, damit spätere Teams die Belege wiederverwenden können.",
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
            "Entwerfen Sie fünf Abschnitte für die nächste Prüfung. Jeder Abschnitt soll die gezeigten Belege und die damit unterstützte Entscheidung nennen.",
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
    title: "Wissensprüfung und Abschlussaufgabe zu Modul 9",
    subtitle: "Prüfen Sie die Messpraktiken dieses Moduls.",
    objective: "Prüfen Sie die Messpraktiken dieses Moduls.",
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
          "Eine bezifferte Verbesserung braucht eine stabile Definition, eine belastbare Ausgangslage und einen glaubwürdigen Vergleich sowie eine Betrachtung anderer möglicher Erklärungen. Modellanbieter, Umsetzungspartner und Lizenzzahl belegen nicht, dass die Maßnahme das berichtete Ergebnis verursacht hat.",
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
          "Nutzung und Stimmung können den Betrieb erklären, belegen aber keinen Wert. Stärkere Belege verbinden vorher festgelegte Ergebnisse und Schutzgrößen mit einem glaubwürdigen Vergleich und weisen Kosten, Unsicherheit sowie alternative Erklärungen aus.",
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
          "Die Prüfung soll entscheiden, ob eine Maßnahme fortgesetzt, verändert, pausiert oder beendet wird. Ein einheitliches Belegpaket, eine benannte Entscheidungsverantwortung und eine klare nächste Bedingung machen das Ergebnis prüfbar und wiederverwendbar.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
