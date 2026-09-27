import type { AiNativeOperatorLesson } from "../../types";

export const TALENT_LESSONS_DE: readonly AiNativeOperatorLesson[] = [
  {
    id: "talent/1",
    moduleId: "talent",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Arbeitsproben mit zugelassenen Werkzeugen",
    subtitle:
      "Zeig mit echter Aufgabe und Raster, wie jemand mit den Werkzeugen arbeitet.",
    objective:
      "Zeig mit echter Aufgabe und Raster, wie jemand mit den Werkzeugen arbeitet.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Eine repräsentative Arbeitsprobe wählen",
        readTimeMinutes: 7,
        content:
          "Die Aufgabe bildet wichtige Tätigkeiten der Rolle ab, ohne unbezahlte Produktivarbeit oder internes Wissen zu verlangen. Passe den Umfang an den Zeitrahmen an, gib allen dieselben Materialien und ermögliche angemessene Anpassungen. Geprüft werden die Anforderungen der Tätigkeit.",
      },
      {
        id: "s2",
        title: "Den Arbeitsprozess beobachten",
        readTimeMinutes: 7,
        content:
          "Bewerbende nutzen die zugelassenen Werkzeuge der Rolle. Schau zu, wie sie den Auftrag klären, die Arbeit zerlegen und spezifizieren, Delegationsgrenzen setzen, Ausgaben prüfen, Annahmen testen und das Ergebnis erklären. Private Konten oder verdeckte Datenweitergabe verlangst du nicht.",
      },
      {
        id: "s3",
        title: "Anhand klarer Kriterien bewerten",
        readTimeMinutes: 6,
        content:
          "Lege beobachtbare Merkmale für Spezifikationsqualität, Werkzeugurteil, Prüfqualität, Verifikation, Kommunikation und Endergebnis fest. Schule die Bewertenden am Raster und vergleiche unabhängige Bewertungen. Tempo und Glätte zählen nichts ohne Erklärung und Verifikation.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "talent/1",
          cpId: "exercise",
          title: "Bewertungsraster für eine Arbeitsprobe",
          scenario:
            "Entwirf eine Bewerbungsaufgabe mit zugelassenen Werkzeugen, Materialien, Zeitrahmen, Anpassungen, Bewertungsdimensionen und beobachtbaren Ankern.",
          rows: 5,
        },
      },
    ],
  },
  {
    id: "talent/2",
    moduleId: "talent",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Modellgestützte Arbeit in Laufbahnmodellen",
    subtitle:
      "Lege Rollenerwartungen für Nutzung, Prüfung und Steuerung modellgestützter Arbeit fest.",
    objective:
      "Lege Rollenerwartungen für Nutzung, Prüfung und Steuerung modellgestützter Arbeit fest.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Ein vierstufiges Kompetenzraster",
        readTimeMinutes: 6,
        content:
          "Stufe 1 nutzt zugelassene Unterstützung für begrenzte Aufgaben und prüft Ergebnisse. Stufe 2 betreibt einen wiederholbaren Ablauf mit dokumentierten Eingaben, Prüfung und Eskalation. Stufe 3 entwirft Kontrollen, Evaluationen und Überwachung für gemeinsame Abläufe. Stufe 4 setzt Standards und trägt die Betriebsverantwortung.",
      },
      {
        id: "s2",
        title: "Artefakte und Entscheidungen messen",
        readTimeMinutes: 6,
        content:
          "Belege sind Spezifikationen, Evaluationssätze, Prüfprotokolle, Reaktionen auf Störungen, wiederverwendbare Abläufe und dokumentierte Entscheidungen. Bewertet werden Begründung, Kontrollen und Ergebnisse, nie Eingabemenge oder behauptete Produktivität. Gleiche Beispiele zwischen Bewertenden ab, damit dasselbe Verhalten dieselbe Einstufung bekommt.",
      },
      {
        id: "s3",
        title: "Erst Zugang und Schulung, dann Bewertung",
        readTimeMinutes: 6,
        content:
          "Bewerte eine Kompetenz erst, wenn Werkzeuge, Schulung, Übungszeit und klare Erwartungen bereitstehen, mit Rücksicht auf Anpassungen und eingeschränkte Rollen. Kündige Änderungen vor Beförderungs- oder Leistungsentscheidungen an, dokumentiere Belege und sieh ein Einspruchsverfahren vor.",
      },
    ],
    exerciseKind: "slot-fill",
    widgets: [
      {
        kind: "slot-fill",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "talent/2",
          cpId: "exercise",
          title: "Kompetenzstufen",
          scenario:
            "Entwirf vier Kompetenzstufen für eine Rollenfamilie, je mit Verantwortung, einem beobachtbaren Artefakt und den geltenden Kontrollen.",
          placeholders: [
            "Stufe 1: begrenzte Nutzung mit Ergebnisprüfung",
            "Stufe 2: wiederholbarer Ablauf mit Prüfung",
            "Stufe 3: Kontrollen, Evaluationen und Überwachung",
            "Stufe 4: Standards und Betriebsverantwortung",
          ],
        },
      },
    ],
  },
  {
    id: "talent/3",
    moduleId: "talent",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Vergütung an Ergebnissen und Kontrollen ausrichten",
    subtitle:
      "Vergüte Ergebnisse, Qualität, Zusammenarbeit und Kontrollen statt Werkzeugaktivität.",
    objective:
      "Vergüte Ergebnisse, Qualität, Zusammenarbeit und Kontrollen statt Werkzeugaktivität.",
    durationMinutes: 22,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Werkzeugnutzung von Vergütung trennen",
        readTimeMinutes: 8,
        content:
          "Modellnutzung ist eine Eingabe. Wer sie belohnt, bekommt unnötige Verarbeitung, versteckte Handarbeit und unsichere Delegation. Vergütung folgt Ergebnissen, Qualität, Zusammenarbeit und Kontrollpflichten der Rolle, auch wenn der Verzicht auf ein Modell richtig war.",
      },
      {
        id: "s2",
        title: "Ausgewogene Belege verwenden",
        readTimeMinutes: 7,
        content:
          "Jede passende Messgröße bekommt eine Gegenmessgröße: Durchlaufzeit mit Qualitäts- und Störungsdaten, Durchsatz mit Umfang und Komplexität, gemeinsame Werkzeuge mit Belegen zu Nutzung, Pflege und Unterstützung. Nutze keine feste Formel über Teams mit unterschiedlicher Arbeit, Risiko und Messgüte.",
      },
      {
        id: "s3",
        title: "Ein folgenreiches Messverfahren kontrollieren",
        readTimeMinutes: 7,
        content:
          "Vergütungskennzahlen können unvollständig, manipulierbar oder verzerrt sein. Dokumentiere Quellen und Ausschlüsse, vergleiche Gruppen, kalibriere unabhängig und halte ein Einspruchsverfahren offen. Hol Personal- und Rechtsverantwortliche vor jeder Kriterienänderung dazu, besonders bei Regeln zu Beschäftigung, Diskriminierung, Datenschutz oder Beschäftigtenüberwachung.",
      },
    ],
    callout: {
      kind: "warn",
      h: "Aktivitätskennzahlen raus aus der Vergütung",
      text: "Zahl der Modellanfragen, Datenvolumen, Zahl der Agenten und Nutzungszeit steigen auch ohne bessere Arbeit. Lass sie aus der Vergütung heraus und achte auf Qualitätsverlust, Risikoverlagerung und Kennzahlenmanipulation.",
    },
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "talent/3",
          cpId: "exercise",
          title: "Beleggrundlage für Vergütung",
          scenario:
            "Liste für eine Rolle Ergebnisse, Qualitätsindikatoren, Kooperationsbelege, Kontrollpflichten, Gegenmessgrößen, Kalibrierung und Einspruchsweg für die Vergütung auf.",
          rows: 5,
        },
      },
    ],
  },
  {
    id: "talent/4",
    moduleId: "talent",
    lessonNumber: 4,
    number: 4,
    kind: "quiz",
    title: "Modul 5, Wissensprüfung",
    subtitle: "Zwei Fragen zu Einstellung und Vergütung.",
    objective: "Zwei Fragen zu Einstellung und Vergütung.",
    durationMinutes: 8,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-talent-q1",
        questionText:
          "Was bewertet eine Arbeitsprobe mit zugelassenen Werkzeugen?",
        answerOptions: [
          {
            id: "a",
            text: "Die Tippgeschwindigkeit während der Aufgabe.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Das Auswendiglernen eines fachfremden Bewerbungsrätsels.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Wie die Person spezifiziert, Werkzeuge beurteilt, verifiziert und erklärt.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Die Anzahl der im Lebenslauf genannten Berufsjahre.",
            isCorrect: false,
          },
        ],
        explanation:
          "Eine Arbeitsprobe zeigt, wie Bewerbende relevante Arbeit einordnen, ausführen, prüfen und erklären. Tempo, Nutzungsmenge oder ein glattes Ergebnis ohne Begründung zeigen das nicht.",
      },
      {
        id: "ano-talent-q2",
        questionText:
          "Welche direkte Vergütungskennzahl ist am wenigsten vertretbar?",
        answerOptions: [
          {
            id: "a",
            text: "Durchlaufzeit mit ergänzenden Angaben zu Qualität und Umfang.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Fehlerquote mit ergänzenden Angaben zu Schweregrad und Erkennung.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Anzahl der wöchentlich gesendeten Modelleingaben.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Durchsatz mit ergänzenden Angaben zu Komplexität und Kontrollen.",
            isCorrect: false,
          },
        ],
        explanation:
          "Die Zahl der Eingaben misst Werkzeugaktivität und steigt ohne bessere Ergebnisse. Die anderen Kennzahlen täuschen allein ebenfalls, deshalb brauchen sie Gegenmessgrößen, Kontext und Kalibrierung.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
