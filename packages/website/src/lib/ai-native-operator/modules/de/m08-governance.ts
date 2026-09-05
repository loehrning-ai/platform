import type { AiNativeOperatorLesson } from "../../types";

export const GOVERNANCE_LESSONS_DE: readonly AiNativeOperatorLesson[] = [
  {
    id: "governance/1",
    moduleId: "governance",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Ein Modell- und Systemregister führen",
    subtitle:
      "Eingesetzte modellgestützte Systeme mit Zuständigkeit, Zweck, Datenzugriff, Werkzeugen, Kontrollen und aktuellem Zustand erfassen.",
    objective:
      "Eingesetzte modellgestützte Systeme mit Zuständigkeit, Zweck, Datenzugriff, Werkzeugen, Kontrollen und aktuellem Zustand erfassen.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Nicht das Modell zählt, sondern der Einsatz",
        readTimeMinutes: 9,
        content:
          "Ein Modellname beschreibt kein Betriebsrisiko. Erfasse jeden Einsatz mit Geschäftszweck, verantwortlicher Person, Anbieter und Version, Betriebsort, Datenklassen, verbundenen Werkzeugen, Nutzergruppen, Risikostufe und Lebenszyklusstatus. Extern betriebene Funktionen und eingebettete Anbieterfunktionen gehören dazu, sobald sie Daten oder Entscheidungen beeinflussen.",
      },
      {
        id: "s2",
        title: "Das Register an Lebenszyklusereignisse binden",
        readTimeMinutes: 9,
        content:
          "Der Eintrag entsteht oder ändert sich bei Aufnahme, Freigabe, Veröffentlichung, wesentlicher Änderung, regelmäßiger Prüfung, Störungsbearbeitung und Stilllegung. Speichere Evaluationsbelege, Freigabebedingungen, letzte und nächste Prüfung sowie offene Feststellungen. Eine Person verantwortet die Vollständigkeit. Und ein Verfahren findet die Systeme, die niemand eingetragen hat.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "governance/1",
          cpId: "exercise",
          scenario:
            "Nimm ein eingesetztes modellgestütztes System. Erfasse Zweck, Zuständigkeit, Anbieter und Version, Betriebsort, Datenklassen, Werkzeuge, Nutzergruppen, Risikostufe, Freigaben, Evaluationsbelege, Prüftermin und Stilllegungsbedingung. Markiere jedes Feld, das du nicht füllen kannst.",
          rows: 3,
        },
      },
    ],
  },
  {
    id: "governance/2",
    moduleId: "governance",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Änderungen über festgelegte Kontrollen freigeben",
    subtitle:
      "Evaluation, Freigabe, Einführung, Überwachung und Rücknahme an das Risiko der Änderung anpassen.",
    objective:
      "Evaluation, Freigabe, Einführung, Überwachung und Rücknahme an das Risiko der Änderung anpassen.",
    durationMinutes: 24,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Eine änderungsspezifische Freigabekontrolle festlegen",
        readTimeMinutes: 12,
        content:
          "Modell, Anbieter, Anweisung, Abruf, Werkzeug, Richtlinie, Weiterleitung: jede Änderung daran kann das Verhalten verschieben. Ordne die Änderung ein, wähle repräsentative Qualitäts- und Sicherheitsevaluationen, setze Annahmeschwellen und benenne die nötigen menschlichen Prüfungen. Wiederholbare Kontrollen laufen automatisch, und ihr Ergebnis bleibt bei der veröffentlichten Version.",
      },
      {
        id: "s2",
        title: "Die Einführung nach der Freigabe kontrollieren",
        readTimeMinutes: 12,
        content:
          "Keine Evaluation vor der Veröffentlichung deckt jede Bedingung im Betrieb ab. Nutze wo möglich eine gestufte Einführung, beobachte festgelegte Ergebnis- und Schutzsignale und halte Kriterien für Rücknahme oder Eindämmung bereit. Der Notfallweg steht schriftlich fest: begrenzte Befugnis, klare Befristung, nachträgliche Prüfung, ergänzende Tests.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "governance/2",
          cpId: "exercise",
          scenario:
            "Lege für einen eingesetzten Ablauf Änderungsklassen, nötige Evaluationen, Annahmeschwellen, Freigaben, gestufte Einführung, Schutzsignale im Betrieb, Rücknahmekriterien und den Datensatz für Notfalländerungen fest.",
          rows: 4,
        },
      },
    ],
  },
  {
    id: "governance/3",
    moduleId: "governance",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Agenten begrenzte Identitäten und Prüfpfade geben",
    subtitle:
      "Zuordenbare Dienstidentitäten, ausdrückliche Delegation, geringste Rechte und geschützte Ereignisprotokolle verwenden.",
    objective:
      "Zuordenbare Dienstidentitäten, ausdrückliche Delegation, geringste Rechte und geschützte Ereignisprotokolle verwenden.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Ausführenden Dienst, vertretene Person und Befugnis trennen",
        readTimeMinutes: 10,
        content:
          "Handelt ein Agent, benennt das System den ausführenden Dienst, die vertretene Person oder den vertretenen Dienst und die erlaubende Berechtigung. Jeder produktive Dienst bekommt eine eigene Identität. Dazu geringste Rechte, kurzlebige Zugangsdaten, begrenzte Ressourcen und Aktionen und ein ausdrücklicher Widerruf. Keine gemeinsamen Geheimnisse, keine weitreichenden Dienstkonten.",
      },
      {
        id: "s2",
        title: "Genügend Belege zur Rekonstruktion erfassen",
        readTimeMinutes: 10,
        content:
          "Ein Prüfereignis trägt eine eindeutige Ereigniskennung, Zeitstempel, Dienstidentität, vertretene Person oder vertretenen Dienst, Handlung, Ressource, Berechtigungsentscheidung, Richtlinienversion, Ergebnis und Verknüpfungskennungen. Schütze Integrität und Zugriff des Protokolls. Statt unnötiger Geheimnisse und personenbezogener Daten stehen dort Verweise oder geschwärzte Werte.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "governance/3",
          cpId: "exercise",
          scenario:
            "Nimm eine folgenreiche schreibende oder löschende Handlung. Bestimme Dienstidentität, vertretene Person oder vertretenen Dienst, Umfang der Zugangsdaten, Berechtigungsbeleg, Protokollfelder, Aufbewahrung, Protokollzugriff, Widerrufsweg und Störungsverantwortung.",
          rows: 3,
        },
      },
    ],
  },
  {
    id: "governance/4",
    moduleId: "governance",
    lessonNumber: 4,
    number: 4,
    kind: "quiz",
    title: "Modul 8, Wissensprüfung",
    subtitle: "Zwei Fragen zu den Steuerungskontrollen.",
    objective: "Zwei Fragen zu den Steuerungskontrollen.",
    durationMinutes: 8,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-governance-q1",
        questionText:
          "Das Sicherheitsteam fragt, welche eingesetzten Systeme personenbezogene Kundendaten nutzen. Niemand kann es vollständig beantworten. Welche Korrekturkontrolle kommt zuerst?",
        answerOptions: [
          {
            id: "a",
            text: "Alle modellgestützten Systeme abschalten, ohne sie zuerst zu erfassen.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Ein Systemregister einführen und mit Aufnahme, Freigabe, Änderung, Prüfung, Störung und Stilllegung verknüpfen.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Eine Sicherheitsleitung benennen, ohne ein Bestandsverfahren einzurichten.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Verschlüsselung ergänzen, ohne Einsätze, Zuständigkeiten, Datenflüsse oder Werkzeuge zu erfassen.",
            isCorrect: false,
          },
        ],
        explanation:
          "Die Lücke ist ein fehlendes gepflegtes Verzeichnis. Ein Register verbindet jeden Einsatz mit Zuständigkeit, Datenklassen, Anbieter und Version, Werkzeugen, Kontrollen, Freigaben und Lebenszyklusstatus. Andere Schutzmaßnahmen bleiben nötig, ersetzen diesen Datensatz aber nicht.",
      },
      {
        id: "ano-governance-q2",
        questionText:
          "Ein Agent löscht einen Datensatz. Welche Belege unterstützen Zuordnung und Rekonstruktion der Störung am besten?",
        answerOptions: [
          {
            id: "a",
            text: "Stimmungsanalyse der letzten Modelleingaben.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Eine Schätzung anhand des angezeigten Agentennamens.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Dienstidentität, vertretene Person oder vertretener Dienst, Handlung, Ressource, Berechtigung und Richtlinienversion, Zeitstempel, Ergebnis und Verknüpfungskennungen.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Eine nachträgliche Auswertung ohne Ereignisdatensätze.",
            isCorrect: false,
          },
        ],
        explanation:
          "Ein geschützter Ereignisdatensatz verbindet ausführenden Dienst, vertretene Identität, Befugnis, Handlung, Ressource und Ergebnis zum Zeitpunkt des Ereignisses. Anzeigenamen und spätere Erinnerung belegen diese Kette nicht.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
