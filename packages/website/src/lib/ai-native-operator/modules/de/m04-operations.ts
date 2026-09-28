import type { AiNativeOperatorLesson } from "../../types";

export const OPERATIONS_LESSONS_DE: readonly AiNativeOperatorLesson[] = [
  {
    id: "operations/1",
    moduleId: "operations",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Wann eine Besprechung sich lohnt",
    subtitle:
      "Schreib Routineberichte auf und triff dich nur dann direkt, wenn es nötig ist.",
    objective:
      "Schreib Routineberichte auf und triff dich nur dann direkt, wenn es nötig ist.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Zuerst den Zweck einordnen",
        readTimeMinutes: 1,
        content:
          "Statusbericht, Entscheidung und heikles Gespräch brauchen verschiedene Formen. Routinedaten dokumentierst du schriftlich. Strittige Entscheidungen, Störungen, Beziehungsthemen und unklare Sachverhalte brauchen oft ein direktes Gespräch, also klärst du erst den Zweck und wählst dann das Format.",
      },
      {
        id: "s2",
        title: "Schriftliche Berichte nutzbar machen",
        readTimeMinutes: 1,
        content:
          "Nutze ein Format: aktueller Stand, Belege oder Quellenverweise, Hindernisse, zuständige Person, Zeitstempel und offene Entscheidungen. Ein Modell kann Einträge gruppieren und zusammenfassen. Die Zusammenfassung zeigt nur, wo du hinschauen solltest; die Einträge bleiben für alle lesbar, weil Zusammenfassungen weglassen und verzerren.",
      },
      {
        id: "s3",
        title: "Ergebnisse direkter Abstimmung dokumentieren",
        readTimeMinutes: 1,
        content:
          "Leg vor der Besprechung fest, wer die Entscheidungsverantwortung trägt und welche Informationen vorliegen müssen. Danach hältst du Entscheidung, Begründung, abweichende Positionen, Maßnahmen und Zuständigkeiten fest. Informellen Austausch planst du bei Bedarf getrennt ein.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "operations/1",
          cpId: "exercise",
          title: "Besprechungen prüfen",
          scenario:
            "Liste fünf wiederkehrende Besprechungen mit Zweck, benötigten Informationen, erwartetem Ergebnis und Entscheidungsverantwortung auf. Markiere, ob sie schriftlich, direkt oder beides laufen sollen.",
          rows: 5,
        },
      },
    ],
  },
  {
    id: "operations/2",
    moduleId: "operations",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Entwürfe aus klaren Aufträgen",
    subtitle:
      "Lege Zielgruppe, Zweck, Belege, Einschränkungen und Zuständigkeit vor dem ersten Satz fest.",
    objective:
      "Lege Zielgruppe, Zweck, Belege, Einschränkungen und Zuständigkeit vor dem ersten Satz fest.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Den Auftrag vor dem Entwurf schreiben",
        readTimeMinutes: 1,
        content:
          "Ein Auftrag nennt Zielgruppe, unterstützte Entscheidung, maßgebliche Quellen, geltende Einschränkungen und die verantwortliche Person. Menschen, Modelle und Prüfende arbeiten damit.",
      },
      {
        id: "s2",
        title: "Erzeugten Text als Entwurf behandeln",
        readTimeMinutes: 1,
        content:
          "Prüfe Quellenangaben, Zahlen, Namen, Aussagen zu Richtlinien und heikle Behauptungen an den Originalquellen. Bewahre Dokumentversionen auf und benenne die Freigabeverantwortung. Für Richtigkeit, Kennzeichnung und Veröffentlichung steht die benannte Person gerade.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "operations/2",
          cpId: "exercise",
          scenario:
            "Schreib den Auftrag für ein Dokument, das diese Woche fällig ist: Zielgruppe, Ergebnis, zugelassene Quellen, Einschränkungen, Zuständigkeit und Prüfkriterien.",
          rows: 4,
        },
      },
    ],
  },
  {
    id: "operations/3",
    moduleId: "operations",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Kontrollierte Ticket-Sichtung",
    subtitle:
      "Automatisiere Klassifizierung und Weiterleitung so, dass Unsicherheit und Eskalation sichtbar bleiben.",
    objective:
      "Automatisiere Klassifizierung und Weiterleitung so, dass Unsicherheit und Eskalation sichtbar bleiben.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Den Sichtungsdatensatz festlegen",
        readTimeMinutes: 1,
        content:
          "Jedes Ticket bekommt Kategorie, Schweregrad, vorgeschlagene Zuständigkeit, Konfidenz und Belege. Automatische Aktionen folgen nur dokumentierten Regeln. Die ursprüngliche Anfrage bleibt, verwandte Tickets und Zusammenhänge werden verknüpft, damit die Prüfung den Weg nachvollziehen kann.",
      },
      {
        id: "s2",
        title: "Risikobasierte Prüfregeln festlegen",
        readTimeMinutes: 1,
        content:
          "Eskaliere unsichere, widersprüchliche, neuartige, folgenreiche und prüfpflichtige Fälle und prüfe eine risikobasierte Stichprobe der übrigen. Schwellen folgen den Kosten einer falschen Weiterleitung, nie einer Wunschquote für Automatisierung; hohe Konfidenz belegt weder Richtigkeit noch das Fehlen systematischer Fehler.",
      },
      {
        id: "s3",
        title: "Den Korrekturkreislauf schließen",
        readTimeMinutes: 1,
        content:
          "Benenne, wer Eskalationen prüft, Weiterleitungen korrigiert, Regeln und Beispiele pflegt und Betroffene informiert. Protokolliere Eingaben, Ausgaben, Übersteuerungen und Endergebnisse, beobachte Fehlermuster und setz automatische Aktionen aus, wenn die Kontrolle nicht mehr greift.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "operations/3",
          cpId: "exercise",
          title: "Ablauf der Ticket-Sichtung",
          scenario:
            "Skizziere einen Ablauf zur Ticket-Sichtung: Eingaben, Klassifizierungsfelder, Belegquellen, automatische Aktionen, Eskalationsregeln, Prüfstichprobe und Korrekturverantwortung.",
          rows: 5,
        },
      },
    ],
  },
  {
    id: "operations/4",
    moduleId: "operations",
    lessonNumber: 4,
    number: 4,
    kind: "quiz",
    title: "Modul 4, Wissensprüfung",
    subtitle: "Zwei Fragen zu Abstimmung und Ticket-Sichtung.",
    objective: "Zwei Fragen zu Abstimmung und Ticket-Sichtung.",
    durationMinutes: 3,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-operations-q1",
        questionText:
          "Eine wöchentliche Statusrunde wiederholt meist, was schon schriftlich vorliegt. Welche Reaktion ist die beste?",
        answerOptions: [
          {
            id: "a",
            text: "Die Besprechung behalten und kürzer ansetzen.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Berichte schriftlich führen und sich nur für Entscheidungen oder Unklarheiten direkt treffen.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Das Format behalten und die Tagesordnung verlängern.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Den Zeitpunkt zwischen den Beteiligten wechseln.",
            isCorrect: false,
          },
        ],
        explanation:
          "Routinedaten gehören in die schriftliche Dokumentation; Zusammenfassungen zeigen nur, wo man hinschauen sollte. Besprechungszeit ist für strittige Entscheidungen, Störungen, heikle Themen oder echte Unklarheit.",
      },
      {
        id: "ano-operations-q2",
        questionText:
          "Welche Tickets gibt ein kontrolliertes Sichtungssystem zur menschlichen Prüfung weiter?",
        answerOptions: [
          {
            id: "a",
            text: "Nur eine feste Zufallsstichprobe ohne Berücksichtigung der Auswirkung.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Nur die ältesten Tickets in der Warteschlange.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Unsichere, widersprüchliche, neuartige, folgenreiche oder prüfpflichtige Fälle plus risikobasierte Stichprobe.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Nur Tickets einer festgelegten Kundengruppe.",
            isCorrect: false,
          },
        ],
        explanation:
          "Prüfregeln folgen Fehlerkosten und Richtlinienpflichten; Unsicherheit ist ein Signal unter mehreren. Eine risikobasierte Stichprobe deckt systematische Fehler in Fällen mit hoher Konfidenz auf.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
