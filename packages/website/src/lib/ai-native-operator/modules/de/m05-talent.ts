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
      "Eine tätigkeitsnahe Aufgabe und ein Bewertungsraster mit klaren Kriterien nutzen, um die Arbeitsweise mit verfügbaren Werkzeugen zu beobachten.",
    objective:
      "Eine tätigkeitsnahe Aufgabe und ein Bewertungsraster mit klaren Kriterien nutzen, um die Arbeitsweise mit verfügbaren Werkzeugen zu beobachten.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Eine repräsentative Arbeitsprobe wählen",
        readTimeMinutes: 7,
        content:
          "Die Aufgabe sollte wichtige Tätigkeiten der Rolle abbilden, ohne unbezahlte Produktivarbeit oder internes Firmenwissen zu verlangen. Begrenzen Sie den Umfang passend zum angegebenen Zeitrahmen, stellen Sie allen Bewerbenden dieselben Materialien bereit und ermöglichen Sie angemessene Anpassungen. Bewerten Sie Anforderungen der Tätigkeit statt Vertrautheit mit einem Bewerbungsrätsel.",
      },
      {
        id: "s2",
        title: "Den Arbeitsprozess beobachten",
        readTimeMinutes: 7,
        content:
          "Bewerbende dürfen dieselben zugelassenen Werkzeuge verwenden, die ihnen in der Rolle zur Verfügung stünden. Beobachten Sie, wie sie den Auftrag klären, die Aufgabe zerlegen, Arbeit spezifizieren, Delegationsgrenzen wählen, Ausgaben prüfen, Annahmen testen und das Ergebnis erklären. Schützen Sie Daten und geistiges Eigentum der Bewerbenden. Verlangen Sie weder private Konten noch eine nicht offengelegte Datenweitergabe.",
      },
      {
        id: "s3",
        title: "Anhand klarer Kriterien bewerten",
        readTimeMinutes: 6,
        content:
          "Definieren Sie beobachtbare Merkmale für Spezifikationsqualität, Urteil beim Werkzeugeinsatz, Prüfqualität, Verifikation, Kommunikation und Endergebnis. Schulen Sie die Bewertenden am Raster und vergleichen Sie unabhängige Bewertungen. Leiten Sie Kompetenz nicht aus Tippgeschwindigkeit, Nutzungsmenge oder einer sprachlich überzeugenden Ausgabe ab, wenn die Person ihre Arbeit weder erklären noch verifizieren kann.",
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
            "Entwerfen Sie eine repräsentative Bewerbungsaufgabe. Erfassen Sie zugelassene Werkzeuge, bereitgestellte Materialien, Zeitrahmen, mögliche Anpassungen, Bewertungsdimensionen und beobachtbare Bewertungsanker.",
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
      "Rollenspezifische Erwartungen für Nutzung, Prüfung und Steuerung modellgestützter Abläufe festlegen.",
    objective:
      "Rollenspezifische Erwartungen für Nutzung, Prüfung und Steuerung modellgestützter Abläufe festlegen.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Ein vierstufiges Kompetenzraster",
        readTimeMinutes: 6,
        content:
          "Stufe 1 nutzt zugelassene Unterstützung für begrenzte Aufgaben und prüft das Ergebnis. Stufe 2 betreibt einen wiederholbaren Ablauf mit dokumentierten Eingaben, Prüfung und Eskalation. Stufe 3 entwirft Kontrollen, Evaluationen und Überwachung für gemeinsam genutzte Abläufe. Stufe 4 setzt Rollen- oder Organisationsstandards und trägt die Betriebsverantwortung. Passen Sie die Stufen an die tatsächliche Arbeit an; sie sind keine allgemeingültigen Beförderungskriterien.",
      },
      {
        id: "s2",
        title: "Artefakte und Entscheidungen messen",
        readTimeMinutes: 6,
        content:
          "Nutzen Sie Belege wie Spezifikationen, Evaluationssätze, Prüfprotokolle, Reaktionen auf Störungen, wiederverwendbare Abläufe und dokumentierte Entscheidungen. Bewerten Sie Begründung, Kontrollen und Ergebnisse der Person statt Eingabemenge oder behaupteter Produktivität. Gleichen Sie Beispiele zwischen Bewertenden ab, damit dasselbe Verhalten vergleichbare Einstufungen erhält.",
      },
      {
        id: "s3",
        title: "Zugang, Schulung und ein geregeltes Verfahren bereitstellen",
        readTimeMinutes: 6,
        content:
          "Bewerten Sie eine Kompetenz erst, wenn zugelassene Werkzeuge, rollenspezifische Schulung, Übungszeit und klare Erwartungen bereitstehen. Berücksichtigen Sie notwendige Anpassungen sowie Rollen, in denen ein Modelleinsatz eingeschränkt oder ungeeignet ist. Kommunizieren Sie Änderungen, bevor sie auf Beförderungs- oder Leistungsentscheidungen wirken, dokumentieren Sie Belege und sehen Sie ein Verfahren für Einwände gegen die Bewertung vor.",
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
            "Entwerfen Sie vier Kompetenzstufen für eine Rollenfamilie. Benennen Sie je Stufe die erwartete Verantwortung, ein beobachtbares Artefakt und die geltenden Kontrollen.",
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
      "Rollenbezogene Ergebnisse, Qualität, Zusammenarbeit und Risikokontrollen bewerten, ohne die Werkzeugnutzung selbst zu belohnen.",
    objective:
      "Rollenbezogene Ergebnisse, Qualität, Zusammenarbeit und Risikokontrollen bewerten, ohne die Werkzeugnutzung selbst zu belohnen.",
    durationMinutes: 22,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Werkzeugnutzung von Vergütung trennen",
        readTimeMinutes: 8,
        content:
          "Die Nutzung eines Modells ist eine Eingabe und kein Ergebnis. Eine direkte Belohnung der Nutzung kann unnötige Verarbeitung, das Verbergen manueller Arbeit und unsichere Delegation fördern. Vergütungsentscheidungen sollten rollenbezogene Ergebnisse, Qualität, Zusammenarbeit und Kontrollpflichten berücksichtigen, einschließlich der Fälle, in denen der Verzicht auf ein Modell die richtige Entscheidung ist.",
      },
      {
        id: "s2",
        title: "Ausgewogene Belege verwenden",
        readTimeMinutes: 7,
        content:
          "Wählen Sie Messgrößen passend zur Rolle und ergänzen Sie jede durch eine Gegenmessgröße. Kürzere Durchlaufzeit braucht Qualitäts- und Störungsdaten; Durchsatz braucht Angaben zu Umfang und Komplexität; gemeinsam genutzte Werkzeuge brauchen Belege zu Nutzung, Pflege und Unterstützung. Erzwingen Sie keine feste Formel für Teams mit unterschiedlicher Arbeit, unterschiedlichem Risiko und unterschiedlicher Messgüte.",
      },
      {
        id: "s3",
        title: "Ein folgenreiches Messverfahren kontrollieren",
        readTimeMinutes: 7,
        content:
          "Vergütungskennzahlen können unvollständig, manipulierbar oder verzerrt sein. Dokumentieren Sie Datenquellen und Ausschlüsse, prüfen Sie Muster zwischen Gruppen, nutzen Sie eine unabhängige Kalibrierung und erhalten Sie ein Einspruchsverfahren. Binden Sie Personal- und Rechtsverantwortliche ein, bevor Sie Vergütungskriterien ändern, besonders bei Regeln zu Beschäftigung, Diskriminierung, Datenschutz oder Beschäftigtenüberwachung.",
      },
    ],
    callout: {
      kind: "warn",
      h: "Aktivitätskennzahlen sind kein Leistungsbeleg",
      text: "Zahl der Modellanfragen, Datenvolumen, Zahl der Agenten und Nutzungszeit lassen sich erhöhen, ohne die Arbeit zu verbessern. Verwenden Sie diese Größen nicht direkt für Vergütungsentscheidungen. Bewerten Sie verifizierte Ergebnisse und Kontrollen mit genügend Kontext, um Qualitätsverlust, Risikoverlagerung und Kennzahlenmanipulation zu erkennen.",
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
            "Wählen Sie eine Rolle. Listen Sie Ergebnisse, Qualitätsindikatoren, Kooperationsbelege, Kontrollpflichten, Gegenmessgrößen, Kalibrierungsverfahren und Einspruchsweg für Vergütungsentscheidungen auf.",
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
    title: "Wissensprüfung zu Modul 5",
    subtitle: "Prüfen Sie die Personalpraktiken dieses Moduls.",
    objective: "Prüfen Sie die Personalpraktiken dieses Moduls.",
    durationMinutes: 8,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-talent-q1",
        questionText:
          "Was sollte eine Arbeitsprobe mit zugelassenen Werkzeugen bewerten?",
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
            text: "Klärung, Spezifikation, Urteil beim Werkzeugeinsatz, Prüfung, Verifikation, Kommunikation und Endergebnis.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Die Anzahl der im Lebenslauf genannten Berufsjahre.",
            isCorrect: false,
          },
        ],
        explanation:
          "Eine repräsentative Arbeitsprobe liefert Belege dafür, wie Bewerbende relevante Arbeit einordnen, ausführen, prüfen und erklären. Geschwindigkeit, Nutzungsmenge und ein sprachlich überzeugendes Ergebnis ohne nachvollziehbare Begründung reichen allein nicht aus.",
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
          "Die Anzahl der Eingaben misst Werkzeugaktivität und kann steigen, ohne Ergebnis oder Qualität zu verbessern. Auch die anderen Kennzahlen können isoliert irreführen. Deshalb brauchen sie Gegenmessgrößen, Kontext und Kalibrierung.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
