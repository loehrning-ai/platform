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
      "Eine tätigkeitsnahe Aufgabe und ein klares Bewertungsraster zeigen, wie jemand mit den vorhandenen Werkzeugen arbeitet.",
    objective:
      "Eine tätigkeitsnahe Aufgabe und ein klares Bewertungsraster zeigen, wie jemand mit den vorhandenen Werkzeugen arbeitet.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Eine repräsentative Arbeitsprobe wählen",
        readTimeMinutes: 7,
        content:
          "Die Aufgabe bildet wichtige Tätigkeiten der Rolle ab, ohne unbezahlte Produktivarbeit oder internes Firmenwissen zu verlangen. Begrenze den Umfang auf den angegebenen Zeitrahmen, gib allen Bewerbenden dieselben Materialien und ermögliche angemessene Anpassungen. Geprüft werden die Anforderungen der Tätigkeit, nicht die Vertrautheit mit einem Bewerbungsrätsel.",
      },
      {
        id: "s2",
        title: "Den Arbeitsprozess beobachten",
        readTimeMinutes: 7,
        content:
          "Bewerbende arbeiten mit denselben zugelassenen Werkzeugen, die sie in der Rolle hätten. Schau zu, wie sie den Auftrag klären, die Aufgabe zerlegen, Arbeit spezifizieren, Delegationsgrenzen setzen, Ausgaben prüfen, Annahmen testen und das Ergebnis erklären. Ihre Daten und ihr geistiges Eigentum bleiben geschützt. Kein privates Konto, keine nicht offengelegte Datenweitergabe.",
      },
      {
        id: "s3",
        title: "Anhand klarer Kriterien bewerten",
        readTimeMinutes: 6,
        content:
          "Lege beobachtbare Merkmale fest für Spezifikationsqualität, Urteil beim Werkzeugeinsatz, Prüfqualität, Verifikation, Kommunikation und Endergebnis. Schule die Bewertenden am Raster und vergleiche unabhängige Bewertungen. Tippgeschwindigkeit, Nutzungsmenge und eine sprachlich glatte Ausgabe belegen keine Kompetenz, wenn die Person ihre Arbeit weder erklären noch verifizieren kann.",
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
            "Entwirf eine repräsentative Bewerbungsaufgabe. Halte fest: zugelassene Werkzeuge, Materialien, Zeitrahmen, mögliche Anpassungen, Bewertungsdimensionen und beobachtbare Anker.",
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
          "Stufe 1 nutzt zugelassene Unterstützung für begrenzte Aufgaben und prüft das Ergebnis. Stufe 2 betreibt einen wiederholbaren Ablauf mit dokumentierten Eingaben, Prüfung und Eskalation. Stufe 3 entwirft Kontrollen, Evaluationen und Überwachung für gemeinsam genutzte Abläufe. Stufe 4 setzt Rollen- oder Organisationsstandards und trägt die Betriebsverantwortung. Passe die Stufen an die echte Arbeit an; Beförderungskriterien sind sie nicht.",
      },
      {
        id: "s2",
        title: "Artefakte und Entscheidungen messen",
        readTimeMinutes: 6,
        content:
          "Belege sind Spezifikationen, Evaluationssätze, Prüfprotokolle, Reaktionen auf Störungen, wiederverwendbare Abläufe und dokumentierte Entscheidungen. Bewertet werden Begründung, Kontrollen und Ergebnisse einer Person, nicht ihre Eingabemenge oder behauptete Produktivität. Gleiche Beispiele zwischen den Bewertenden ab, damit dasselbe Verhalten dieselbe Einstufung bekommt.",
      },
      {
        id: "s3",
        title: "Erst Zugang und Schulung, dann Bewertung",
        readTimeMinutes: 6,
        content:
          "Bewerte eine Kompetenz erst, wenn zugelassene Werkzeuge, rollenspezifische Schulung, Übungszeit und klare Erwartungen bereitstehen. Berücksichtige notwendige Anpassungen und Rollen, in denen ein Modelleinsatz eingeschränkt oder ungeeignet ist. Kündige Änderungen an, bevor sie auf Beförderungs- oder Leistungsentscheidungen wirken, dokumentiere die Belege und sieh ein Verfahren für Einwände vor.",
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
            "Entwirf vier Kompetenzstufen für eine Rollenfamilie. Benenne je Stufe die erwartete Verantwortung, ein beobachtbares Artefakt und die geltenden Kontrollen.",
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
          "Die Nutzung eines Modells ist eine Eingabe, kein Ergebnis. Wer Nutzung direkt belohnt, bekommt unnötige Verarbeitung, verstecktes Handarbeiten und unsichere Delegation. Vergütung folgt rollenbezogenen Ergebnissen, Qualität, Zusammenarbeit und Kontrollpflichten. Auch dann, wenn der Verzicht auf ein Modell die richtige Entscheidung war.",
      },
      {
        id: "s2",
        title: "Ausgewogene Belege verwenden",
        readTimeMinutes: 7,
        content:
          "Jede Messgröße bekommt eine Gegenmessgröße, passend zur Rolle. Kürzere Durchlaufzeit braucht Qualitäts- und Störungsdaten. Durchsatz braucht Umfang und Komplexität. Gemeinsam genutzte Werkzeuge brauchen Belege zu Nutzung, Pflege und Unterstützung. Und keine feste Formel über Teams hinweg, deren Arbeit, Risiko und Messgüte sich unterscheiden.",
      },
      {
        id: "s3",
        title: "Ein folgenreiches Messverfahren kontrollieren",
        readTimeMinutes: 7,
        content:
          "Vergütungskennzahlen können unvollständig, manipulierbar oder verzerrt sein. Dokumentiere Datenquellen und Ausschlüsse, prüfe Muster zwischen Gruppen, nutze eine unabhängige Kalibrierung und halte ein Einspruchsverfahren offen. Personal- und Rechtsverantwortliche sitzen mit am Tisch, bevor du Vergütungskriterien änderst. Erst recht bei Regeln zu Beschäftigung, Diskriminierung, Datenschutz oder Beschäftigtenüberwachung.",
      },
    ],
    callout: {
      kind: "warn",
      h: "Aktivitätskennzahlen sind kein Leistungsbeleg",
      text: "Zahl der Modellanfragen, Datenvolumen, Zahl der Agenten und Nutzungszeit lassen sich steigern, ohne dass die Arbeit besser wird. Solche Größen gehören nicht direkt in eine Vergütungsentscheidung. Bewerte verifizierte Ergebnisse und Kontrollen, mit genug Kontext, um Qualitätsverlust, Risikoverlagerung und Kennzahlenmanipulation zu sehen.",
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
            "Nimm eine Rolle. Liste Ergebnisse, Qualitätsindikatoren, Kooperationsbelege, Kontrollpflichten, Gegenmessgrößen, Kalibrierungsverfahren und Einspruchsweg für Vergütungsentscheidungen auf.",
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
    subtitle: "Zwei Fragen zu den Personalpraktiken.",
    objective: "Zwei Fragen zu den Personalpraktiken.",
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
          "Eine repräsentative Arbeitsprobe zeigt, wie Bewerbende relevante Arbeit einordnen, ausführen, prüfen und erklären. Geschwindigkeit, Nutzungsmenge und ein glattes Ergebnis ohne nachvollziehbare Begründung reichen dafür nicht.",
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
          "Die Anzahl der Eingaben misst Werkzeugaktivität und kann steigen, ohne Ergebnis oder Qualität zu verbessern. Die anderen Kennzahlen können isoliert ebenfalls irreführen. Deshalb brauchen sie Gegenmessgrößen, Kontext und Kalibrierung.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
