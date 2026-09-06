import type { AiNativeOperatorLesson } from "../../types";

export const DATA_LESSONS_DE: readonly AiNativeOperatorLesson[] = [
  {
    id: "data/1",
    moduleId: "data",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Eine kontrollierte Retrieval-Schicht aufbauen",
    subtitle:
      "Freigegebene Quellen mit klaren Kontrollen für Identität, Berechtigung, Aktualität und Herkunft verbinden.",
    objective:
      "Freigegebene Quellen mit klaren Kontrollen für Identität, Berechtigung, Aktualität und Herkunft verbinden.",
    durationMinutes: 24,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Mit den unterstützten Entscheidungen beginnen",
        readTimeMinutes: 8,
        content:
          "Erst die Frage, dann der Konnektor. Lege fest, welche Fragen und Handlungen die Retrieval-Schicht stützen soll, und benenne je Anwendungsfall die maßgeblichen Datensätze, das zulässige Alter, die Datenklassifizierung und die nötigen Belege. Eine gemeinsame Suchoberfläche vereinfacht den Zugriff. Unterschiede bei Verbindlichkeit, Sensibilität und Aufbewahrung muss sie trotzdem abbilden.",
      },
      {
        id: "s2",
        title: "Nur begründete Quellen anbinden",
        readTimeMinutes: 8,
        content:
          "Dokumente, Quellcode, Tickets, Kundendaten, Nachrichten, Kalender: jede Quelle bringt ihr eigenes Risiko mit. Es gilt Zweckbindung und Datenminimierung. Hol Datenschutz, Sicherheit, Recht und Beschäftigtenvertretung dazu, wo es nötig ist. Ein verfügbarer Konnektor ist kein Grund, eine Quelle anzubinden.",
      },
      {
        id: "s3",
        title: "Belege mit dem Ergebnis ausgeben",
        readTimeMinutes: 8,
        content:
          "Ein abgerufenes Ergebnis zeigt Quellenverweise, maßgebliche Versionen oder Zeitstempel und die wesentlichen Zugriffs- und Aktualitätsgrenzen. Wer damit arbeitet, muss die Belege prüfen können. Reicht die Abdeckung nicht oder widersprechen sich die Quellen, nennt das System die Einschränkung oder antwortet nicht, statt eine unbelegte Zusammenfassung als Tatsache auszugeben.",
      },
    ],
    callout: {
      kind: "note",
      h: "Nach Nutzen und Risiko staffeln",
      text: "Fang mit Quellen an, die einen klaren Anwendungsfall, eine eindeutige Zuständigkeit, stabile Zugriffsregeln und beherrschbare Sensibilität haben. Betriebsdaten kommen dazu, sobald Aktualität und Löschungen kontrolliert sind. Kommunikation erst nach ausdrücklicher Prüfung von Datenschutz, Sicherheit, Aufbewahrung und Auswirkungen auf Beschäftigte.",
    },
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "data/1",
          cpId: "exercise",
          title: "Quellenregister",
          scenario:
            "Liste fünf mögliche Quellen auf. Erfasse je Anwendungsfall, Zuständigkeit, Verbindlichkeit, Datenklassifizierung, Zugriffsmodell, Aktualitätsanforderung, Aufbewahrungsregel und die für Nutzende sichtbaren Belege.",
          rows: 5,
        },
      },
    ],
  },
  {
    id: "data/2",
    moduleId: "data",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Berechtigungen beim Abruf durchsetzen",
    subtitle:
      "Rechte der anfragenden Person, Identität des ausführenden Dienstes und angeforderte Ressource vor der Ausgabe prüfen.",
    objective:
      "Rechte der anfragenden Person, Identität des ausführenden Dienstes und angeforderte Ressource vor der Ausgabe prüfen.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Die Kontrolle vor die Offenlegung setzen",
        readTimeMinutes: 7,
        content:
          "Die Berechtigungsprüfung gehört in den Abrufpfad und an die Grenze der Quelle. Ein Ausgabefilter greift erst, wenn die Inhalte längst geholt sind, und übersieht indirekte Offenlegungen. Prüfe den Zugriff, bevor Dokumente, Ausschnitte, Metadaten oder abgeleitete Ergebnisse herausgehen. Und teste die Richtlinie mit erlaubten wie abgelehnten Fällen.",
      },
      {
        id: "s2",
        title: "Person und ausführenden Dienst getrennt abbilden",
        readTimeMinutes: 7,
        content:
          "Das System erkennt, welche Person die Anfrage ausgelöst hat und welcher Agent oder Dienst sie ausführt. Der wirksame Zugriff reicht nie weiter als die Schnittmenge aus Rechten der Person, zugewiesenem Umfang des Dienstes und geltender Richtlinie. Nutze kurzlebige Zugangsdaten und ausdrückliche Delegation. Kein gemeinsames Konto mit erweiterten Rechten.",
      },
      {
        id: "s3",
        title: "Entscheidungen protokollieren, ohne ein neues Leck zu schaffen",
        readTimeMinutes: 6,
        content:
          "Protokolliere Person, Dienstidentität, Zeitpunkt, angeforderte Ressourcenkennungen, Richtlinienversion, Berechtigungsentscheidung und ausgegebene Quellenkennungen. Schütze das Protokoll selbst. Rohe Geheimnisse und unnötige sensible Anfragetexte gehören nicht hinein. Der Datensatz soll eine Störung nachvollziehbar machen, nicht zum zweiten unkontrollierten Datenspeicher werden.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "data/2",
          cpId: "exercise",
          scenario:
            "Bestimme für einen Abrufablauf Person, Dienstidentität, Berechtigungsquelle, Regel für wirksame Rechte, Gültigkeitsdauer der Zugangsdaten, Verhalten bei Ablehnung und Protokollfelder. Benenne jede Lücke, die sich heute nicht rekonstruieren lässt.",
          rows: 3,
        },
      },
    ],
  },
  {
    id: "data/3",
    moduleId: "data",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Aktualität als ausdrückliche Zusage steuern",
    subtitle:
      "Quellenspezifische Altersgrenzen festlegen, Änderungen und Löschungen übertragen und den Datenzeitpunkt ausweisen.",
    objective:
      "Quellenspezifische Altersgrenzen festlegen, Änderungen und Löschungen übertragen und den Datenzeitpunkt ausweisen.",
    durationMinutes: 22,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Aktualität an die Entscheidung anpassen",
        readTimeMinutes: 11,
        content:
          "Für stabiles Referenzmaterial genügt eine regelmäßige Momentaufnahme. Für einen Ablauf, der auf schnell veränderlichen Daten handelt, genügt sie nicht. Lege je Anwendungsfall und Quelle ein höchstens zulässiges Alter fest. Änderungen, Widerrufe und Löschungen gehören in dieselbe Zusage: eine veraltete Berechtigung wirkt genauso folgenreich wie ein veralteter Inhalt.",
      },
      {
        id: "s2",
        title: "Veraltete Zustände erkennen und ausweisen",
        readTimeMinutes: 11,
        content:
          "Ereignisgesteuerte, geplante oder bedarfsgesteuerte Synchronisierung: die Wahl folgt der nötigen Aktualität und den Betriebskosten. Überwache Verzögerungen und fehlgeschlagene Aktualisierungen. Gib Datenstand oder Version mit jedem Ergebnis aus. Und leg fest, ob der Ablauf bei Überschreitung warnt, eine Bestätigung verlangt, auf die Quelle zurückgreift oder stoppt.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "data/3",
          cpId: "exercise",
          scenario:
            "Erfasse je wichtiger Quelle Aktualisierungsverfahren, beobachtete Verzögerung, höchstes zulässiges Alter, Löschverhalten, Hinweis auf veraltete Daten und Reaktion des Ablaufs bei Überschreitung.",
          rows: 4,
        },
      },
    ],
  },
  {
    id: "data/4",
    moduleId: "data",
    lessonNumber: 4,
    number: 4,
    kind: "quiz",
    title: "Modul 7, Wissensprüfung",
    subtitle: "Zwei Fragen zu den Abrufkontrollen.",
    objective: "Zwei Fragen zu den Abrufkontrollen.",
    durationMinutes: 9,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-data-q1",
        questionText:
          "Ein Abrufsystem gibt ein vertrauliches Dokument aus, auf das die anfragende Person keinen Zugriff hat. Welche Architekturkorrektur behebt das?",
        answerOptions: [
          {
            id: "a",
            text: "Nach der Erzeugung einen Textfilter auf die Ausgabe anwenden.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Die Berechtigung im Abrufpfad anhand der Rechte der Person, des Dienstumfangs und der aktuellen Richtlinie durchsetzen.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Das System für Personen mit leitenden Rollen ausblenden.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Den Abruf abschalten, ohne die Berechtigungsarchitektur zu korrigieren.",
            isCorrect: false,
          },
        ],
        explanation:
          "Nicht berechtigte Inhalte weist das System vor der Offenlegung ab. Ein Ausgabefilter greift zu spät und übersieht indirekte Datenlecks. Der wirksame Zugriff berücksichtigt die Rechte der anfragenden Person und den ausdrücklich zugewiesenen Umfang des Dienstes.",
      },
      {
        id: "ano-data-q2",
        questionText:
          "Warum kann eine regelmäßige Momentaufnahme für einen handelnden Ablauf ungeeignet sein?",
        answerOptions: [
          {
            id: "a",
            text: "Eine Momentaufnahme lässt sich nie schnell erstellen.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Momentaufnahmen benötigen immer mehr Speicher als Ereignisströme.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Der Ablauf kann auf einem älteren Zustand als zulässig handeln, wenn Aktualität nicht gemessen und durchgesetzt wird.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Momentaufnahmen können keine neu erstellten Dateien enthalten.",
            isCorrect: false,
          },
        ],
        explanation:
          "Eine Momentaufnahme ist nur im Verhältnis zur geforderten Aktualität sicher. Die Kontrolle heißt: Anforderung festlegen, wirkliche Verzögerung messen, Datenstand zeigen und den Ablauf bei Überschreitung einschränken oder stoppen.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
