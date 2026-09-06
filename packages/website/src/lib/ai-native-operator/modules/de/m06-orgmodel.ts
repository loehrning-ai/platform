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
      "Teamgröße folgt aus Arbeit, Leistungszusagen, Abhängigkeiten, Fähigkeiten und Risiko, nicht aus einer Faustregel.",
    objective:
      "Teamgröße folgt aus Arbeit, Leistungszusagen, Abhängigkeiten, Fähigkeiten und Risiko, nicht aus einer Faustregel.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Mit dem Verantwortungsbereich beginnen",
        readTimeMinutes: 7,
        content:
          "Beginne beim Ergebnis, für das ein Team verantwortlich ist: bediente Nutzergruppen, Leistungszusagen, Abhängigkeiten, Entscheidungsrechte, Kontrollpflichten. Erst danach Arbeitslast und benötigte Fähigkeiten. Klare Verantwortung spart Übergaben. Die Teamgröße hängt trotzdem an Nachfrage, notwendiger Erreichbarkeit, Komplexität und Risiko.",
      },
      {
        id: "s2",
        title: "Kapazitätsoptionen ausdrücklich bewerten",
        readTimeMinutes: 7,
        content:
          "Ein Kapazitätsantrag zeigt Arbeitslast, Engpässe, Auswirkungen auf zugesagte Leistungen, Kontrollvorgaben und die bereits geprüften Optionen. Optionen sind Prozessänderungen, weniger Umfang, bessere Werkzeuge, Automatisierung, Schulung oder zusätzliche Personen. Die Belege stützen eine Entscheidung. Eine Regel, nach der jedes Team vor jeder Einstellung erst automatisieren muss, folgt daraus nicht.",
      },
      {
        id: "s3",
        title: "Die Struktur anhand von Betriebsdaten anpassen",
        readTimeMinutes: 6,
        content:
          "Regulierte Arbeit, Fachentscheidungen, physische Abläufe, Rufbereitschaft, Barrierefreiheit und anhaltende Nachfrage brauchen oft größere oder anders zusammengesetzte Teams. Beobachte nach jeder Änderung Arbeitslast, Qualität, Störungen, Alter offener Vorgänge und Belastung der Beschäftigten. Zeigen diese Signale, dass der Verantwortungsbereich nicht trägt, vergrößerst, teilst oder verbindest du das Team neu.",
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
            "Nimm ein Team oder einen Produktbereich. Erfasse verantwortetes Ergebnis, Nutzergruppen, Leistungszusagen, Abhängigkeiten, Entscheidungsrechte, Kontrollpflichten, Arbeitslast, benötigte Fähigkeiten und Kapazitätssignale.",
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
      "Breite Zuständigkeit spart Übergaben. Fachliche Verantwortung bleibt dort, wo Fehlerkosten sie verlangen.",
    objective:
      "Breite Zuständigkeit spart Übergaben. Fachliche Verantwortung bleibt dort, wo Fehlerkosten sie verlangen.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Breite Verantwortung braucht klare Grenzen",
        readTimeMinutes: 9,
        content:
          "Eine breit aufgestellte Person koordiniert Arbeit über mehrere Fachgebiete und nutzt Werkzeuge, um Kontext abzurufen, Artefakte zu entwerfen oder begrenzte Analysen zu fahren. Das spart Übergaben. Fachkunde und Verantwortung erzeugt kein Modell. Also leg fest, welche Entscheidungen diese Person selbst trifft und welche fachliche Zuständigkeit oder Prüfung brauchen.",
      },
      {
        id: "s2",
        title: "Fachliche Prüfpunkte nach Risiko setzen",
        readTimeMinutes: 9,
        content:
          "Fachleute verantworten folgenreiche Fachentscheidungen, prüfen ausgewählte Arbeit, untersuchen neuartige Fälle und überführen wiederkehrende Hinweise in Standards oder Evaluationskriterien. Ihre Einbindung folgt Fehlerkosten, Neuartigkeit, Regulierung und Umkehrbarkeit. Prüf danach, ob der Prüfpunkt Schäden verhindert oder nur eine Warteschlange erzeugt.",
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
            "Bestimme zwei Abläufe, in denen eine breit aufgestellte Person die Hauptverantwortung mit einem fachlichen Prüfpunkt trägt. Lege Entscheidungsgrenze, Prüfauslöser, Belegpaket, Reaktionszeit und Eskalationsverantwortung fest.",
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
      "Doppelte Freigaben entfernen und notwendige Fachkunde, Verantwortung und Funktionstrennung erhalten.",
    objective:
      "Doppelte Freigaben entfernen und notwendige Fachkunde, Verantwortung und Funktionstrennung erhalten.",
    durationMinutes: 14,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Jede Freigabe einem Zweck zuordnen",
        readTimeMinutes: 7,
        content:
          "Notiere zu jeder Freigabe das Entscheidungsrecht, das behandelte Risiko, die nötigen Belege und die verantwortliche Rolle. Streiche jeden Schritt, der dieselbe Prüfung wiederholt, ohne Information oder Kontrolle hinzuzufügen. Was wegen Tragweite, Regulierung, unabhängiger Aufsicht oder Funktionstrennung nötig ist, bleibt.",
      },
      {
        id: "s2",
        title: "Entscheidungsvorlagen als ungeprüfte Hilfsmittel nutzen",
        readTimeMinutes: 7,
        content:
          "Ein Modell kann eine Vorlage bauen: belegte Fakten, Optionen, Annahmen, Risiken, offene Punkte. Freigabeverantwortliche müssen die Quellen prüfen und Auslassungen korrigieren können. Die Vorlage bestimmt nicht, wie viele Freigaben nötig sind. Und sie nimmt niemandem die Verantwortung ab, der ein Entscheidungsrecht hält.",
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
            "Zeichne eine Freigabekette auf. Notiere je Schritt Entscheidungsrecht, Risiko, Belege und verantwortliche Rolle. Streiche doppelte Schritte und markiere, wo eine belegte Entscheidungsvorlage die verbleibenden Freigaben stützt.",
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
    subtitle: "Zwei Fragen zu den Organisationskontrollen.",
    objective: "Zwei Fragen zu den Organisationskontrollen.",
    durationMinutes: 8,
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
            text: "Arbeitslast, Leistungszusagen, Engpässe, Kontrollen und Kapazitätsoptionen prüfen und dann anhand der Belege entscheiden.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Nur Anträge für leitende Stellen genehmigen.",
            isCorrect: false,
          },
        ],
        explanation:
          "Eine Kapazitätsentscheidung braucht Belege zu Nachfrage, Auswirkung auf zugesagte Leistungen, Engpässen, Risiko und möglichen Optionen. Automatisierung ist eine dieser Optionen. Weder verfügbare Mittel noch der Nachweis früherer Automatisierung taugen als Regel für Zusage oder Absage.",
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
            text: "Indem sie riskante Sachentscheidungen verantworten oder prüfen und wiederkehrende Hinweise in nutzbare Standards überführen.",
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
          "Fachleute zählen dort am meisten, wo Fehlerkosten, Neuartigkeit oder Regulierung ein fundiertes Fachurteil verlangen. Sie verantworten eine Entscheidung, prüfen begrenzte Arbeit, bearbeiten neuartige Fälle und machen wiederkehrende Hinweise nutzbar. Ihre Rolle folgt dem Risiko, nicht einem allgemeinen Beratungsmodell.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
