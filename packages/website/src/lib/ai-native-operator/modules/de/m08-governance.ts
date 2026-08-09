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
        title: "Das eingesetzte System statt nur das Modell erfassen",
        readTimeMinutes: 9,
        content:
          "Ein Modellname allein beschreibt das Betriebsrisiko nicht. Erfassen Sie jeden Einsatz mit Geschäftszweck, verantwortlicher Person, Anbieter und Version, Betriebsort, Datenklassen, verbundenen Werkzeugen, Nutzergruppen, Risikostufe und Lebenszyklusstatus. Beziehen Sie extern betriebene Funktionen und eingebettete Anbieterfunktionen ein, wenn sie Daten oder Entscheidungen beeinflussen.",
      },
      {
        id: "s2",
        title: "Das Register an Lebenszyklusereignisse binden",
        readTimeMinutes: 9,
        content:
          "Erstellen oder aktualisieren Sie den Eintrag bei Aufnahme, Freigabe, Veröffentlichung, wesentlicher Änderung, regelmäßiger Prüfung, Störungsbearbeitung und Stilllegung. Speichern Sie Evaluationsbelege, Freigabebedingungen, letzte und nächste Prüfung sowie offene Feststellungen. Benennen Sie eine Verantwortung für Vollständigkeit und ein Verfahren zum Auffinden nicht registrierter Systeme.",
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
            "Wählen Sie ein eingesetztes modellgestütztes System. Erfassen Sie Zweck, Zuständigkeit, Anbieter und Version, Betriebsort, Datenklassen, Werkzeuge, Nutzergruppen, Risikostufe, Freigaben, Evaluationsbelege, Prüftermin und Bedingung für die Stilllegung. Markieren Sie jedes unbekannte Feld.",
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
          "Änderungen an Modell, Anbieter, Anweisung, Abruf, Werkzeug, Richtlinie oder Weiterleitung können das Verhalten verändern. Ordnen Sie die Änderung ein, wählen Sie repräsentative Qualitäts- und Sicherheitsevaluationen, setzen Sie Annahmeschwellen und benennen Sie erforderliche menschliche Prüfungen. Automatisieren Sie wiederholbare Kontrollen und bewahren Sie das Ergebnis mit der veröffentlichten Version auf.",
      },
      {
        id: "s2",
        title: "Die Einführung nach der Freigabe kontrollieren",
        readTimeMinutes: 12,
        content:
          "Evaluationen vor der Veröffentlichung können nicht jede Bedingung im Betrieb abdecken. Nutzen Sie nach Möglichkeit eine gestufte Einführung, beobachten Sie festgelegte Ergebnis- und Schutzsignale und bereiten Sie Kriterien für Rücknahme oder Eindämmung vor. Dokumentieren Sie einen Notfallweg mit begrenzter Befugnis, klarer Befristung, nachträglicher Prüfung und ergänzenden Tests.",
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
            "Definieren Sie für einen eingesetzten Ablauf Änderungsklassen, erforderliche Evaluationen, Annahmeschwellen, Freigaben, gestufte Einführung, Schutzsignale im Betrieb, Rücknahmekriterien und den Datensatz für Notfalländerungen.",
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
          "Wenn ein Agent handelt, sollte das System den ausführenden Dienst, die vertretene Person oder den vertretenen Dienst und die erlaubende Berechtigung benennen. Geben Sie jedem produktiven Dienst eine eigene Identität. Verwenden Sie geringste Rechte, kurzlebige Zugangsdaten, begrenzte Ressourcen und Aktionen sowie ausdrücklichen Widerruf statt gemeinsamer Geheimnisse oder weitreichender Dienstkonten.",
      },
      {
        id: "s2",
        title: "Genügend Belege zur Rekonstruktion erfassen",
        readTimeMinutes: 10,
        content:
          "Ein Prüfereignis sollte eine eindeutige Ereigniskennung, Zeitstempel, Dienstidentität, vertretene Person oder vertretenen Dienst, Handlung, Ressource, Berechtigungsentscheidung, Richtlinienversion, Ergebnis und Verknüpfungskennungen enthalten. Schützen Sie Integrität und Zugriff des Protokolls. Speichern Sie Verweise oder geschwärzte Werte statt unnötiger Geheimnisse und personenbezogener Daten.",
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
            "Wählen Sie eine folgenreiche schreibende oder löschende Handlung. Bestimmen Sie Dienstidentität, vertretene Person oder vertretenen Dienst, Umfang der Zugangsdaten, Berechtigungsbeleg, Protokollfelder, Aufbewahrung, Protokollzugriff, Widerrufsweg und Störungsverantwortung.",
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
    title: "Wissensprüfung zu Modul 8",
    subtitle: "Prüfen Sie die Steuerungskontrollen dieses Moduls.",
    objective: "Prüfen Sie die Steuerungskontrollen dieses Moduls.",
    durationMinutes: 8,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-governance-q1",
        questionText:
          "Das Sicherheitsteam fragt, welche eingesetzten Systeme personenbezogene Kundendaten nutzen. Eine vollständige Antwort fehlt. Welche Korrekturkontrolle ist vorrangig?",
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
          "Die unmittelbare Lücke ist ein fehlendes gepflegtes Verzeichnis. Ein Register verbindet jeden Einsatz mit Zuständigkeit, Datenklassen, Anbieter und Version, Werkzeugen, Kontrollen, Freigaben und Lebenszyklusstatus. Weitere Schutzmaßnahmen bleiben notwendig, ersetzen diesen Datensatz aber nicht.",
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
          "Ein geschützter Ereignisdatensatz verbindet ausführenden Dienst, vertretene Identität, Befugnis, Handlung, Ressource und Ergebnis zum Zeitpunkt des Ereignisses. Anzeigenamen und spätere Erinnerung können diese Kette nicht verlässlich belegen.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
