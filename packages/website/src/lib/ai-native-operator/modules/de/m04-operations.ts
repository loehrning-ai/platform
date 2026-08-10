import type { AiNativeOperatorLesson } from "../../types";

export const OPERATIONS_LESSONS_DE: readonly AiNativeOperatorLesson[] = [
  {
    id: "operations/1",
    moduleId: "operations",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Synchrone und asynchrone Abstimmung gezielt wählen",
    subtitle:
      "Routineberichte schriftlich erfassen und Besprechungen für Aufgaben reservieren, die direkten Austausch erfordern.",
    objective:
      "Routineberichte schriftlich erfassen und Besprechungen für Aufgaben reservieren, die direkten Austausch erfordern.",
    durationMinutes: 14,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Zuerst den Zweck einordnen",
        readTimeMinutes: 5,
        content:
          "Ein Statusbericht, eine Entscheidung und ein sensibles Gespräch brauchen unterschiedliche Formen der Abstimmung. Routinedaten lassen sich meist asynchron dokumentieren. Strittige Entscheidungen, Störungen, Beziehungsthemen und unklare Sachverhalte erfordern häufig ein direktes Gespräch. Ordnen Sie zuerst den Zweck ein und wählen Sie danach das Format.",
      },
      {
        id: "s2",
        title: "Schriftliche Berichte nutzbar machen",
        readTimeMinutes: 5,
        content:
          "Verwenden Sie ein einheitliches Format: aktueller Stand, Belege oder Quellenverweise, Hindernisse, zuständige Person, Zeitstempel und offene Entscheidungen. Ein Modell kann die Einträge gruppieren und zusammenfassen. Die Zusammenfassung dient jedoch nur zur Lenkung der Aufmerksamkeit und ist nicht die maßgebliche Dokumentation. Die zugrunde liegenden Einträge müssen prüfbar bleiben, weil Zusammenfassungen Einzelheiten auslassen oder verzerren können.",
      },
      {
        id: "s3",
        title: "Ergebnisse direkter Abstimmung dokumentieren",
        readTimeMinutes: 4,
        content:
          "Wenn eine Besprechung begründet ist, legen Sie die Entscheidungsverantwortung und die benötigten Informationen vorher fest. Dokumentieren Sie anschließend Entscheidung, Begründung, abweichende Positionen, Maßnahmen und Zuständigkeiten. Planen Sie gesonderte Zeit für informellen Austausch ein, wenn das Team sie benötigt. Eine Statusbesprechung sollte diese Funktion nicht zufällig übernehmen.",
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
            "Listen Sie fünf wiederkehrende Besprechungen auf. Erfassen Sie jeweils Zweck, benötigte Informationen, erwartetes Ergebnis und Entscheidungsverantwortung. Kennzeichnen Sie, ob der Vorgang schriftlich, in einer direkten Besprechung oder in beiden Formen stattfinden soll.",
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
    title: "Dokumente aus klaren Aufträgen entwerfen",
    subtitle:
      "Zielgruppe, Zweck, Beleggrundlage, Einschränkungen und Zuständigkeit für den Entwurf festlegen.",
    objective:
      "Zielgruppe, Zweck, Beleggrundlage, Einschränkungen und Zuständigkeit für den Entwurf festlegen.",
    durationMinutes: 12,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Den Auftrag vor dem Entwurf schreiben",
        readTimeMinutes: 6,
        content:
          "Ein brauchbarer Auftrag nennt die Zielgruppe, die unterstützte Entscheidung oder das gewünschte Ergebnis, die maßgeblichen Quellen, geltende Einschränkungen und die verantwortliche Person. Er verringert Unklarheit für menschliche Verfasser ebenso wie für ein textgenerierendes Modell. Zugleich gibt er der Prüfung eine feste Grundlage.",
      },
      {
        id: "s2",
        title: "Erzeugten Text als ungeprüften Entwurf behandeln",
        readTimeMinutes: 6,
        content:
          "Erzeugter Text ist kein Beleg. Prüfen Sie Quellenangaben, Zahlen, Namen, Aussagen zu Richtlinien und sensible Behauptungen anhand der Originalquellen. Bewahren Sie Dokumentversionen auf und benennen Sie die menschliche Freigabeverantwortung. Das Werkzeug kann den Entwurf beschleunigen; die benannte Person bleibt für Richtigkeit, Kennzeichnung und Veröffentlichung verantwortlich.",
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
            "Wählen Sie ein Dokument, das diese Woche fällig ist. Schreiben Sie einen Auftrag mit Zielgruppe, gewünschtem Ergebnis, zugelassenen Quellen, Einschränkungen, Zuständigkeit und Prüfkriterien.",
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
          "Erfassen Sie für jedes Ticket Kategorie, Schweregrad, vorgeschlagene Zuständigkeit, Konfidenz und zugehörige Belege. Begrenzen Sie automatische Aktionen auf dokumentierte Regeln. Bewahren Sie die ursprüngliche Anfrage auf und verknüpfen Sie verwandte Tickets oder betriebliche Zusammenhänge, damit die Weiterleitung nachvollziehbar bleibt.",
      },
      {
        id: "s2",
        title: "Risikobasierte Prüfregeln festlegen",
        readTimeMinutes: 6,
        content:
          "Eskalieren Sie unsichere, widersprüchliche, neuartige, folgenreiche oder nach Richtlinie prüfpflichtige Fälle. Schwellenwerte sollten sich an den Kosten einer falschen Weiterleitung orientieren und nicht an einer angenommenen Automatisierungsquote. Prüfen Sie zusätzlich eine risikobasierte Stichprobe anderer Fälle. Konfidenzwerte allein belegen weder Richtigkeit noch das Fehlen systematischer Fehler.",
      },
      {
        id: "s3",
        title: "Den Korrekturkreislauf schließen",
        readTimeMinutes: 5,
        content:
          "Benennen Sie Zuständigkeiten für die Prüfung von Eskalationen, die Korrektur der Weiterleitung, die Pflege von Regeln oder Beispielen und die Kommunikation mit betroffenen Personen. Führen Sie ein Prüfprotokoll über Eingaben, Ausgaben, Übersteuerungen und Endergebnisse. Beobachten Sie Fehlermuster und setzen Sie automatische Aktionen aus, wenn die Kontrolle nicht mehr wie vorgesehen funktioniert.",
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
            "Skizzieren Sie einen Ablauf zur Ticket-Sichtung. Legen Sie Eingaben, Klassifizierungsfelder, Belegquellen, automatische Aktionen, Eskalationsregeln, Prüfstichprobe und Korrekturverantwortung fest.",
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
    title: "Wissensprüfung zu Modul 4",
    subtitle: "Prüfen Sie die betrieblichen Kontrollen dieses Moduls.",
    objective: "Prüfen Sie die betrieblichen Kontrollen dieses Moduls.",
    durationMinutes: 7,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-operations-q1",
        questionText:
          "Eine wöchentliche Statusbesprechung wiederholt überwiegend bereits schriftlich vorliegende Informationen. Welche Reaktion ist am besten?",
        answerOptions: [
          {
            id: "a",
            text: "Die Besprechung beibehalten und kürzer ansetzen.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Routineberichte in eine strukturierte schriftliche Dokumentation verlagern, Zusammenfassungen zur Lenkung nutzen und direkte Zeit für Entscheidungen oder Unklarheiten reservieren.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Das Format beibehalten und die Tagesordnung verlängern.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Den Zeitpunkt zwischen den Beteiligten wechseln.",
            isCorrect: false,
          },
        ],
        explanation:
          "Routinedaten gehören in eine prüfbare schriftliche Dokumentation. Eine Zusammenfassung kann Aufmerksamkeit lenken, ersetzt aber nicht das Ausgangsmaterial. Besprechungszeit bleibt angemessen, wenn eine strittige Entscheidung, eine Störung, ein sensibles Thema oder eine wesentliche Unklarheit geklärt werden muss.",
      },
      {
        id: "ano-operations-q2",
        questionText:
          "Welche Tickets sollte ein kontrolliertes Sichtungssystem zur menschlichen Prüfung weitergeben?",
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
          "Prüfregeln sollten sich an Fehlerkosten und Richtlinienpflichten orientieren. Unsicherheit ist ein Signal, aber nicht das einzige. Eine risikobasierte Stichprobe kann systematische Fehler in Fällen aufdecken, die das System mit hoher Konfidenz eingestuft hat.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
