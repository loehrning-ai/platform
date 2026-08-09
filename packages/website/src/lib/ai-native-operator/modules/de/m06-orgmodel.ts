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
      "Die Teamstruktur aus Arbeit, Leistungszusagen, Abhängigkeiten, Fähigkeiten und Risiken statt aus einer allgemeinen Größenregel ableiten.",
    objective:
      "Die Teamstruktur aus Arbeit, Leistungszusagen, Abhängigkeiten, Fähigkeiten und Risiken statt aus einer allgemeinen Größenregel ableiten.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Mit dem Verantwortungsbereich beginnen",
        readTimeMinutes: 7,
        content:
          "Definieren Sie das Ergebnis, für das ein Team verantwortlich ist, die bedienten Nutzergruppen, die Leistungszusagen, Abhängigkeiten, Entscheidungsrechte und Kontrollpflichten. Ermitteln Sie danach Arbeitslast und benötigte Fähigkeiten. Klare Verantwortung kann Übergaben verringern; die Teamgröße hängt dennoch von Nachfrage, notwendiger Erreichbarkeit, Komplexität und Risiko ab.",
      },
      {
        id: "s2",
        title: "Kapazitätsoptionen ausdrücklich bewerten",
        readTimeMinutes: 7,
        content:
          "Ein Kapazitätsantrag sollte Arbeitslast, Engpässe, Auswirkungen auf zugesagte Leistungen, Kontrollvorgaben und bereits geprüfte Optionen zeigen. Mögliche Optionen sind Prozessänderungen, eine Begrenzung des Umfangs, bessere Werkzeuge, Automatisierung, Schulung oder zusätzliche Personen. Die Belege stützen eine Entscheidung; sie begründen keine Regel, nach der jedes Team vor einer Einstellung automatisieren muss.",
      },
      {
        id: "s3",
        title: "Die Struktur anhand von Betriebsdaten anpassen",
        readTimeMinutes: 6,
        content:
          "Größere oder anders zusammengesetzte Teams können für regulierte Arbeit, Fachentscheidungen, physische Abläufe, Rufbereitschaft, Barrierefreiheit oder anhaltende Nachfrage notwendig sein. Beobachten Sie nach einer Änderung Arbeitslast, Qualität, Störungen, Alter offener Vorgänge und Belastung der Beschäftigten. Vergrößern, teilen oder verbinden Sie das Team neu, wenn diese Signale zeigen, dass der Verantwortungsbereich nicht funktioniert.",
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
            "Wählen Sie ein Team oder einen Produktbereich. Erfassen Sie verantwortetes Ergebnis, Nutzergruppen, Leistungszusagen, Abhängigkeiten, Entscheidungsrechte, Kontrollpflichten, Arbeitslast, benötigte Fähigkeiten und Kapazitätssignale.",
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
      "Umfassende Zuständigkeit zur Verringerung von Übergaben nutzen und fachliche Verantwortung dort bewahren, wo Fehlerkosten sie erfordern.",
    objective:
      "Umfassende Zuständigkeit zur Verringerung von Übergaben nutzen und fachliche Verantwortung dort bewahren, wo Fehlerkosten sie erfordern.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Breite Verantwortung braucht klare Grenzen",
        readTimeMinutes: 9,
        content:
          "Eine breit aufgestellte Person kann Arbeit über mehrere Fachgebiete koordinieren und Werkzeuge einsetzen, um Kontext abzurufen, Artefakte zu entwerfen oder begrenzte Analysen auszuführen. Das kann Übergaben verringern, doch ein Modell erzeugt weder Fachkunde noch Verantwortung. Legen Sie fest, welche Entscheidungen diese Person treffen darf und welche fachliche Zuständigkeit oder Prüfung erfordern.",
      },
      {
        id: "s2",
        title: "Fachliche Prüfpunkte nach Risiko setzen",
        readTimeMinutes: 9,
        content:
          "Fachleute können fachliche Entscheidungen mit hohen Folgen verantworten, ausgewählte Arbeit prüfen, neuartige Fälle untersuchen und wiederkehrende Hinweise in Standards oder Evaluationskriterien überführen. Leiten Sie die Einbindung aus Fehlerkosten, Neuartigkeit, Regulierung und Umkehrbarkeit ab. Beobachten Sie, ob der Prüfpunkt Schäden verhindert, ohne eine vermeidbare Warteschlange zu erzeugen.",
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
            "Bestimmen Sie zwei Abläufe, in denen eine breit aufgestellte Person die Hauptverantwortung mit einem fachlichen Prüfpunkt übernehmen kann. Definieren Sie Entscheidungsgrenze, Prüfauslöser, Belegpaket, Reaktionszeit und Eskalationsverantwortung.",
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
          "Erfassen Sie für jede Freigabe das Entscheidungsrecht, das behandelte Risiko, die benötigten Belege und die verantwortliche Rolle. Entfernen Sie Schritte, die dieselbe Prüfung wiederholen, ohne Informationen oder Kontrolle hinzuzufügen. Erhalten Sie Freigaben, die wegen Tragweite, Regulierung, unabhängiger Aufsicht oder Funktionstrennung erforderlich sind.",
      },
      {
        id: "s2",
        title: "Entscheidungsvorlagen als ungeprüfte Hilfsmittel nutzen",
        readTimeMinutes: 7,
        content:
          "Ein Modell kann eine Vorlage mit durch Quellen belegten Fakten, Optionen, Annahmen, Risiken und offenen Punkten zusammenstellen. Freigabeverantwortliche müssen die Quellen prüfen und Auslassungen korrigieren können. Die Vorlage bestimmt weder die notwendige Zahl der Freigaben noch überträgt sie die Verantwortung von den Menschen mit den Entscheidungsrechten.",
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
            "Zeichnen Sie eine Freigabekette auf. Erfassen Sie für jeden Schritt Entscheidungsrecht, Risiko, Belege und verantwortliche Rolle. Entfernen Sie doppelte Schritte und legen Sie fest, wo eine durch Quellen belegte Entscheidungsvorlage die verbleibenden Freigaben unterstützt.",
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
    title: "Wissensprüfung zu Modul 6",
    subtitle: "Prüfen Sie die Organisationskontrollen dieses Moduls.",
    objective: "Prüfen Sie die Organisationskontrollen dieses Moduls.",
    durationMinutes: 8,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-orgmodel-q1",
        questionText:
          "Ein Team beantragt zusätzliche Stellen. Was sollte die Leitung zuerst tun?",
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
          "Eine Kapazitätsentscheidung braucht Belege zu Nachfrage, Auswirkungen auf zugesagte Leistungen, Engpässen, Risiko und möglichen Optionen. Automatisierung kann eine Option sein. Weder die Mittelverfügbarkeit noch der Nachweis früherer Automatisierung reichen jedoch als Regel für die Genehmigung oder Ablehnung zusätzlicher Personen.",
      },
      {
        id: "ano-orgmodel-q2",
        questionText:
          "Wo schaffen Fachleute den größten organisatorischen Wert?",
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
          "Fachleute sind besonders wertvoll, wenn Fehlerkosten, Neuartigkeit oder Regulierung fundierte Fachurteile erfordern. Sie können eine Entscheidung verantworten, begrenzte Arbeit prüfen, neuartige Fälle bearbeiten und wiederkehrende Hinweise nutzbar machen. Ihre Rolle folgt dem Risiko und nicht einem allgemeinen Beratungsmodell.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
