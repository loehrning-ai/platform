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
      "Routineberichte gehören ins Dokument, Besprechungen den Fragen, die echten Austausch brauchen.",
    objective:
      "Routineberichte gehören ins Dokument, Besprechungen den Fragen, die echten Austausch brauchen.",
    durationMinutes: 14,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Zuerst den Zweck einordnen",
        readTimeMinutes: 5,
        content:
          "Montagmorgen, Statusrunde: jemand liest vor, was längst im Ticketsystem steht. Ein Statusbericht, eine Entscheidung und ein heikles Gespräch brauchen verschiedene Formen der Abstimmung. Routinedaten dokumentierst du schriftlich. Strittige Entscheidungen, Störungen, Beziehungsthemen und unklare Sachverhalte brauchen ein direktes Gespräch. Erst den Zweck einordnen, dann das Format wählen.",
      },
      {
        id: "s2",
        title: "Schriftliche Berichte nutzbar machen",
        readTimeMinutes: 5,
        content:
          "Ein Format für alle: aktueller Stand, Belege oder Quellenverweise, Hindernisse, zuständige Person, Zeitstempel, offene Entscheidungen. Ein Modell kann die Einträge gruppieren und zusammenfassen. Die Zusammenfassung lenkt Aufmerksamkeit, sie ist nicht die maßgebliche Dokumentation. Die Einträge darunter bleiben prüfbar, weil jede Zusammenfassung Einzelheiten auslässt oder verzerrt.",
      },
      {
        id: "s3",
        title: "Ergebnisse direkter Abstimmung dokumentieren",
        readTimeMinutes: 4,
        content:
          "Ist die Besprechung begründet, legst du vorher fest, wer die Entscheidungsverantwortung trägt und welche Informationen dafür vorliegen müssen. Danach hältst du Entscheidung, Begründung, abweichende Positionen, Maßnahmen und Zuständigkeiten fest. Braucht das Team informellen Austausch, plane ihn getrennt ein. Sonst übernimmt die Statusrunde diese Rolle nebenbei und taugt für keins von beidem.",
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
            "Liste fünf wiederkehrende Besprechungen auf. Notiere je Zweck, benötigte Informationen, erwartetes Ergebnis und Entscheidungsverantwortung. Markiere, ob der Vorgang schriftlich läuft, in einer direkten Besprechung oder in beidem.",
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
    title: "Kein Entwurf ohne Auftrag",
    subtitle:
      "Zielgruppe, Zweck, Beleggrundlage, Einschränkungen und Zuständigkeit vor dem ersten Satz festlegen.",
    objective:
      "Zielgruppe, Zweck, Beleggrundlage, Einschränkungen und Zuständigkeit vor dem ersten Satz festlegen.",
    durationMinutes: 12,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Den Auftrag vor dem Entwurf schreiben",
        readTimeMinutes: 6,
        content:
          "Ein brauchbarer Auftrag nennt die Zielgruppe, die unterstützte Entscheidung oder das gewünschte Ergebnis, die maßgeblichen Quellen, geltende Einschränkungen und die verantwortliche Person. Das nimmt menschlichen Verfassern und einem Modell dieselbe Unklarheit ab. Und die Prüfung bekommt einen festen Bezugspunkt.",
      },
      {
        id: "s2",
        title: "Erzeugten Text als Entwurf behandeln",
        readTimeMinutes: 6,
        content:
          "Erzeugter Text ist kein Beleg. Prüfe Quellenangaben, Zahlen, Namen, Aussagen zu Richtlinien und heikle Behauptungen an den Originalquellen. Bewahre Dokumentversionen auf und benenne die Freigabeverantwortung. Das Werkzeug beschleunigt den Entwurf; für Richtigkeit, Kennzeichnung und Veröffentlichung steht die benannte Person gerade.",
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
            "Nimm ein Dokument, das diese Woche fällig ist. Schreib den Auftrag dazu: Zielgruppe, gewünschtes Ergebnis, zugelassene Quellen, Einschränkungen, Zuständigkeit, Prüfkriterien.",
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
      "Begrenzte Klassifizierung und Weiterleitung automatisieren, während Unsicherheit, Auswirkung und Eskalation sichtbar bleiben.",
    objective:
      "Begrenzte Klassifizierung und Weiterleitung automatisieren, während Unsicherheit, Auswirkung und Eskalation sichtbar bleiben.",
    durationMinutes: 17,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Den Sichtungsdatensatz festlegen",
        readTimeMinutes: 6,
        content:
          "Jedes Ticket bekommt Kategorie, Schweregrad, vorgeschlagene Zuständigkeit, Konfidenz und die zugehörigen Belege. Automatische Aktionen laufen nur nach dokumentierten Regeln. Die ursprüngliche Anfrage bleibt erhalten, verwandte Tickets und betriebliche Zusammenhänge werden verknüpft. Sonst lässt sich später nicht nachvollziehen, warum ein Ticket dort landete, wo es landete.",
      },
      {
        id: "s2",
        title: "Risikobasierte Prüfregeln festlegen",
        readTimeMinutes: 6,
        content:
          "Eskaliere unsichere, widersprüchliche, neuartige, folgenreiche und nach Richtlinie prüfpflichtige Fälle. Die Schwellenwerte richten sich nach den Kosten einer falschen Weiterleitung, nicht nach einer Wunschquote für Automatisierung. Dazu prüfst du eine risikobasierte Stichprobe der übrigen Fälle. Ein hoher Konfidenzwert belegt weder Richtigkeit noch die Abwesenheit systematischer Fehler.",
      },
      {
        id: "s3",
        title: "Den Korrekturkreislauf schließen",
        readTimeMinutes: 5,
        content:
          "Benenne, wer Eskalationen prüft, wer die Weiterleitung korrigiert, wer Regeln und Beispiele pflegt und wer mit betroffenen Personen spricht. Führe ein Prüfprotokoll über Eingaben, Ausgaben, Übersteuerungen und Endergebnisse. Beobachte die Fehlermuster. Und wenn die Kontrolle nicht mehr greift, setzt du die automatischen Aktionen aus.",
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
            "Skizziere einen Ablauf zur Ticket-Sichtung: Eingaben, Klassifizierungsfelder, Belegquellen, automatische Aktionen, Eskalationsregeln, Prüfstichprobe, Korrekturverantwortung.",
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
    subtitle: "Zwei Fragen zu den Kontrollen dieses Moduls.",
    objective: "Zwei Fragen zu den Kontrollen dieses Moduls.",
    durationMinutes: 7,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-operations-q1",
        questionText:
          "Eine wöchentliche Statusrunde wiederholt überwiegend, was schon schriftlich vorliegt. Welche Reaktion ist die beste?",
        answerOptions: [
          {
            id: "a",
            text: "Die Besprechung behalten und kürzer ansetzen.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Routineberichte in eine strukturierte schriftliche Dokumentation verlagern, Zusammenfassungen zur Lenkung nutzen, direkte Zeit für Entscheidungen und Unklarheiten reservieren.",
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
          "Routinedaten gehören in eine prüfbare schriftliche Dokumentation. Eine Zusammenfassung lenkt Aufmerksamkeit, sie ersetzt das Ausgangsmaterial nicht. Besprechungszeit bleibt richtig, wenn eine strittige Entscheidung, eine Störung, ein heikles Thema oder eine echte Unklarheit im Raum steht.",
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
            text: "Unsichere, widersprüchliche, neuartige, folgenreiche oder vorgeschriebene Fälle sowie eine risikobasierte Stichprobe anderer Fälle.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Nur Tickets einer festgelegten Kundengruppe.",
            isCorrect: false,
          },
        ],
        explanation:
          "Prüfregeln folgen den Fehlerkosten und den Richtlinienpflichten. Unsicherheit ist ein Signal, aber nicht das einzige. Eine risikobasierte Stichprobe deckt systematische Fehler in genau den Fällen auf, die das System mit hoher Konfidenz eingestuft hat.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
