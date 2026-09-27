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
      "Erfasse jedes eingesetzte System mit Zuständigkeit, Zweck, Datenzugriff, Werkzeugen, Kontrollen und Zustand.",
    objective:
      "Erfasse jedes eingesetzte System mit Zuständigkeit, Zweck, Datenzugriff, Werkzeugen, Kontrollen und Zustand.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Den Einsatz erfassen",
        readTimeMinutes: 9,
        content:
          "Erfasse jeden Einsatz mit Geschäftszweck, verantwortlicher Person, Anbieter und Version, Betriebsort, Datenklassen, verbundenen Werkzeugen, Nutzergruppen, Risikostufe und Lebenszyklusstatus. Extern betriebene und eingebettete Anbieterfunktionen gehören dazu, sobald sie Daten oder Entscheidungen berühren.",
      },
      {
        id: "s2",
        title: "Das Register an Lebenszyklusereignisse binden",
        readTimeMinutes: 9,
        content:
          "Der Eintrag entsteht oder ändert sich bei Aufnahme, Freigabe, Veröffentlichung, wesentlicher Änderung, regelmäßiger Prüfung, Störungsbearbeitung und Stilllegung. Speichere Evaluationsbelege, Freigabebedingungen, letzte und nächste Prüfung und offene Feststellungen. Eine Person verantwortet die Vollständigkeit, samt Verfahren für nicht eingetragene Systeme.",
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
            "Erfasse für ein eingesetztes System Zweck, Zuständigkeit, Anbieter und Version, Betriebsort, Datenklassen, Werkzeuge, Nutzergruppen, Risikostufe, Freigaben, Evaluationsbelege, Prüftermin und Stilllegungsbedingung. Markiere jedes unbekannte Feld.",
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
      "Passe Evaluation, Freigabe, Einführung, Überwachung und Rücknahme an das Risiko jeder Änderung an.",
    objective:
      "Passe Evaluation, Freigabe, Einführung, Überwachung und Rücknahme an das Risiko jeder Änderung an.",
    durationMinutes: 24,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Eine änderungsspezifische Freigabekontrolle festlegen",
        readTimeMinutes: 12,
        content:
          "Änderungen an Modell, Anbieter, Anweisung, Abruf, Werkzeug, Richtlinie oder Weiterleitung können das Verhalten verschieben. Ordne die Änderung ein, wähle repräsentative Qualitäts- und Sicherheitsevaluationen, setze Schwellen und benenne die menschliche Prüfung. Wiederholbare Kontrollen laufen automatisch, und ihr Ergebnis bleibt bei der veröffentlichten Version.",
      },
      {
        id: "s2",
        title: "Die Einführung nach der Freigabe kontrollieren",
        readTimeMinutes: 12,
        content:
          "Evaluationen vor der Veröffentlichung decken nicht jede Betriebsbedingung ab. Nutze wo möglich eine gestufte Einführung, beobachte Ergebnis- und Schutzsignale und lege Kriterien für Rücknahme oder Eindämmung vorab fest. Halte einen Notfallweg mit begrenzter Befugnis, Befristung, nachträglicher Prüfung und Folgetests schriftlich fest.",
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
            "Lege für einen eingesetzten Ablauf Änderungsklassen, Evaluationen, Schwellen, Freigaben, gestufte Einführung, Schutzsignale, Rücknahmekriterien und den Datensatz für Notfalländerungen fest.",
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
      "Nutze eigene Dienstidentitäten, ausdrückliche Delegation, geringste Rechte und geschützte Protokolle.",
    objective:
      "Nutze eigene Dienstidentitäten, ausdrückliche Delegation, geringste Rechte und geschützte Protokolle.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Ausführenden Dienst, vertretene Person und Befugnis trennen",
        readTimeMinutes: 10,
        content:
          "Handelt ein Agent, benennt das System den ausführenden Dienst, wen er vertritt und die Berechtigung dahinter. Jeder produktive Dienst bekommt eine eigene Identität mit geringsten Rechten, kurzlebigen Zugangsdaten, begrenzten Ressourcen und Aktionen und ausdrücklichem Widerruf.",
      },
      {
        id: "s2",
        title: "Genügend Belege zur Rekonstruktion erfassen",
        readTimeMinutes: 10,
        content:
          "Ein Prüfereignis enthält Ereigniskennung, Zeitstempel, Dienstidentität, vertretene Person oder vertretenen Dienst, Handlung, Ressource, Berechtigungsentscheidung, Richtlinienversion, Ergebnis und Verknüpfungskennungen. Schütze das Protokoll und speichere Verweise oder geschwärzte Werte statt Geheimnissen und personenbezogenen Daten.",
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
            "Bestimme für eine folgenreiche schreibende oder löschende Handlung Dienstidentität, vertretene Person oder vertretenen Dienst, Umfang der Zugangsdaten, Berechtigungsbeleg, Protokollfelder, Aufbewahrung, Protokollzugriff, Widerrufsweg und Störungsverantwortung.",
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
    subtitle: "Zwei Fragen zu Register und Prüfpfad.",
    objective: "Zwei Fragen zu Register und Prüfpfad.",
    durationMinutes: 8,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-governance-q1",
        questionText:
          "Das Sicherheitsteam fragt, welche Systeme personenbezogene Kundendaten nutzen, und niemand kann es vollständig beantworten. Welche Korrekturkontrolle kommt zuerst?",
        answerOptions: [
          {
            id: "a",
            text: "Alle modellgestützten Systeme abschalten, ohne sie zuerst zu erfassen.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Ein Systemregister führen, das an Lebenszyklusereignisse gebunden ist.",
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
          "Die Lücke ist ein fehlendes Verzeichnis. Ein Register verbindet jeden Einsatz mit Zuständigkeit, Datenklassen, Anbieter und Version, Werkzeugen, Kontrollen, Freigaben und Status, was keine andere Schutzmaßnahme ersetzt.",
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
            text: "Ein geschütztes Ereignisprotokoll mit Identität, Befugnis, Handlung und Ergebnis.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Eine nachträgliche Auswertung ohne Ereignisdatensätze.",
            isCorrect: false,
          },
        ],
        explanation:
          "Ein geschützter Ereignisdatensatz verbindet Dienst, vertretene Identität, Befugnis, Handlung, Ressource und Ergebnis zum Zeitpunkt des Ereignisses. Anzeigenamen und spätere Erinnerung belegen diese Kette nicht.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
