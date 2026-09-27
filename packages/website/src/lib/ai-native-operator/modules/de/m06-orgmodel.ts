import type { AiNativeOperatorLesson } from "../../types";

export const ORGMODEL_LESSONS_DE: readonly AiNativeOperatorLesson[] = [
  {
    id: "orgmodel/1",
    moduleId: "orgmodel",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Teams auf klar verantwortete Ergebnisse ausrichten",
    subtitle:
      "Leite die Teamgröße aus Arbeit, Leistungszusagen, Abhängigkeiten, Fähigkeiten und Risiko ab.",
    objective:
      "Leite die Teamgröße aus Arbeit, Leistungszusagen, Abhängigkeiten, Fähigkeiten und Risiko ab.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Mit dem Verantwortungsbereich beginnen",
        readTimeMinutes: 1,
        content:
          "Leg fest, welches Ergebnis ein Team verantwortet, mit Nutzergruppen, Leistungszusagen, Abhängigkeiten, Entscheidungsrechten und Kontrollpflichten, dann Arbeitslast und Fähigkeiten. Klare Verantwortung spart Übergaben. Die Größe folgt Nachfrage, Erreichbarkeit, Komplexität und Risiko.",
      },
      {
        id: "s2",
        title: "Kapazitätsoptionen ausdrücklich bewerten",
        readTimeMinutes: 1,
        content:
          "Ein Kapazitätsantrag zeigt Arbeitslast, Engpässe, Auswirkungen auf Leistungszusagen, Kontrollvorgaben und geprüfte Optionen: Prozess- oder Umfangsänderung, bessere Werkzeuge, Automatisierung, Schulung oder mehr Personen. Entschieden wird je Antrag anhand dieser Belege, ohne feste Regel, vor jeder Einstellung zu automatisieren.",
      },
      {
        id: "s3",
        title: "Die Struktur anhand von Betriebsdaten anpassen",
        readTimeMinutes: 1,
        content:
          "Regulierte Arbeit, Fachentscheidungen, physische Abläufe, Rufbereitschaft, Barrierefreiheit oder anhaltende Nachfrage brauchen oft größere oder anders besetzte Teams. Beobachte nach Änderungen Arbeitslast, Qualität, Störungen, Alter offener Vorgänge und Belastung, und vergrößere, teile oder verbinde Teams, wenn diese Signale es zeigen.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "orgmodel/1",
          cpId: "exercise",
          title: "Verantwortungsbereich eines Teams",
          scenario:
            "Erfasse für ein Team oder einen Produktbereich verantwortetes Ergebnis, Nutzergruppen, Leistungszusagen, Abhängigkeiten, Entscheidungsrechte, Kontrollpflichten, Arbeitslast, Fähigkeiten und Kapazitätssignale.",
          rows: 5,
        },
      },
    ],
  },
  {
    id: "orgmodel/2",
    moduleId: "orgmodel",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Breite Verantwortung mit fachlicher Prüfung verbinden",
    subtitle:
      "Spare Übergaben durch breite Zuständigkeit und behalte Fachverantwortung, wo Fehlerkosten sie verlangen.",
    objective:
      "Spare Übergaben durch breite Zuständigkeit und behalte Fachverantwortung, wo Fehlerkosten sie verlangen.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Breite Verantwortung braucht klare Grenzen",
        readTimeMinutes: 1,
        content:
          "Eine breit aufgestellte Person koordiniert über Fachgebiete und nutzt Werkzeuge für Kontext, Entwürfe oder begrenzte Analysen, was Übergaben spart. Werkzeuge liefern keine Fachkunde und keine Verantwortung, also legst du fest, welche Entscheidungen sie trifft und welche Fachleute brauchen.",
      },
      {
        id: "s2",
        title: "Fachliche Prüfpunkte nach Risiko setzen",
        readTimeMinutes: 1,
        content:
          "Fachleute verantworten folgenreiche Fachentscheidungen, prüfen ausgewählte Arbeit, untersuchen neuartige Fälle und machen wiederkehrende Hinweise zu Standards oder Evaluationskriterien. Ihre Einbindung folgt Fehlerkosten, Neuartigkeit, Regulierung und Umkehrbarkeit. Prüf danach, ob der Prüfpunkt Schäden verhindert, ohne unnötige Warteschlangen zu erzeugen.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "orgmodel/2",
          cpId: "exercise",
          scenario:
            "Wähle zwei Abläufe, die eine breit aufgestellte Person mit fachlichem Prüfpunkt verantworten kann. Lege Entscheidungsgrenze, Prüfauslöser, Belegpaket, Reaktionszeit und Eskalationsverantwortung fest.",
          rows: 3,
        },
      },
    ],
  },
  {
    id: "orgmodel/3",
    moduleId: "orgmodel",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Freigabeketten durch klare Befugnisse verkürzen",
    subtitle:
      "Streiche doppelte Freigaben und erhalte Fachkunde, Verantwortung und Funktionstrennung.",
    objective:
      "Streiche doppelte Freigaben und erhalte Fachkunde, Verantwortung und Funktionstrennung.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Jede Freigabe einem Zweck zuordnen",
        readTimeMinutes: 1,
        content:
          "Notiere je Freigabe Entscheidungsrecht, Risiko, nötige Belege und verantwortliche Rolle. Streiche Schritte, die eine Prüfung ohne neue Information oder Kontrolle wiederholen. Was Tragweite, Regulierung, unabhängige Aufsicht oder Funktionstrennung verlangen, bleibt.",
      },
      {
        id: "s2",
        title: "Entscheidungsvorlagen als ungeprüfte Hilfsmittel nutzen",
        readTimeMinutes: 1,
        content:
          "Ein Modell kann eine Vorlage aus belegten Fakten, Optionen, Annahmen, Risiken und offenen Punkten bauen. Freigebende müssen die Quellen öffnen und Lücken korrigieren können. Die Vorlage bestimmt weder die Zahl der Freigaben noch die Verantwortung.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "orgmodel/3",
          cpId: "exercise",
          scenario:
            "Zeichne eine Freigabekette mit Entscheidungsrecht, Risiko, Belegen und verantwortlicher Rolle je Schritt auf. Streiche Doppelungen und markiere, wo eine belegte Vorlage die übrigen Freigaben stützt.",
          rows: 4,
        },
      },
    ],
  },
  {
    id: "orgmodel/4",
    moduleId: "orgmodel",
    lessonNumber: 4,
    number: 4,
    kind: "quiz",
    title: "Modul 6, Wissensprüfung",
    subtitle: "Zwei Fragen zu Kapazität und Fachverantwortung.",
    objective: "Zwei Fragen zu Kapazität und Fachverantwortung.",
    durationMinutes: 3,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-orgmodel-q1",
        questionText:
          "Ein Team beantragt zusätzliche Stellen. Was tut die Geschäftsführerin zuerst?",
        answerOptions: [
          {
            id: "a",
            text: "Den Antrag genehmigen, sobald Mittel verfügbar sind.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Den Antrag ohne Prüfung der Arbeitslast ablehnen.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Arbeitslast, Engpässe und Optionen prüfen, dann nach Belegen entscheiden.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Nur Anträge für leitende Stellen genehmigen.",
            isCorrect: false,
          },
        ],
        explanation:
          "Kapazitätsentscheidungen brauchen Belege zu Nachfrage, Leistungsauswirkung, Engpässen, Risiko und Optionen, darunter Automatisierung. Weder Budget noch frühere Automatisierung taugen als Regel.",
      },
      {
        id: "ano-orgmodel-q2",
        questionText: "Wo wirken Fachleute organisatorisch am stärksten?",
        answerOptions: [
          {
            id: "a",
            text: "Indem sie jedes Ausführungsdetail allein verantworten.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Indem sie riskante Entscheidungen tragen oder prüfen und Hinweise zu Standards machen.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Indem sie jede Person führen, die fachliche Hinweise nutzt.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Indem sie aus Abläufen entfernt werden, sobald ein Modell verfügbar ist.",
            isCorrect: false,
          },
        ],
        explanation:
          "Fachleute zählen am meisten, wo Fehlerkosten, Neuartigkeit oder Regulierung tiefes Fachurteil verlangen. Sie tragen oder prüfen Entscheidungen, bearbeiten neue Fälle und machen Hinweise nutzbar.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
