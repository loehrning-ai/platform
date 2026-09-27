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
      "Binde freigegebene Quellen mit Kontrollen für Identität, Berechtigung, Aktualität und Herkunft an.",
    objective:
      "Binde freigegebene Quellen mit Kontrollen für Identität, Berechtigung, Aktualität und Herkunft an.",
    durationMinutes: 24,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Mit den unterstützten Entscheidungen beginnen",
        readTimeMinutes: 8,
        content:
          "Lege zuerst fest, welche Entscheidungen die Schicht stützt. Benenne je Anwendungsfall maßgebliche Datensätze, zulässiges Alter, Datenklassifizierung und nötige Belege, und bilde Unterschiede bei Verbindlichkeit, Sensibilität und Aufbewahrung auch in der gemeinsamen Suche ab.",
      },
      {
        id: "s2",
        title: "Nur begründete Quellen anbinden",
        readTimeMinutes: 8,
        content:
          "Dokumente, Quellcode, Tickets, Kundendaten, Nachrichten und Kalender bringen je eigene Risiken mit. Es gelten Zweckbindung und Datenminimierung; hol bei Bedarf Datenschutz, Sicherheit, Recht und Beschäftigtenvertretung dazu. Binde eine Quelle nur für einen festgelegten Zweck an.",
      },
      {
        id: "s3",
        title: "Belege mit dem Ergebnis ausgeben",
        readTimeMinutes: 8,
        content:
          "Ein abgerufenes Ergebnis zeigt Quellenverweise, Versionen oder Zeitstempel und wesentliche Zugriffs- und Aktualitätsgrenzen. Bei dünner Abdeckung oder widersprüchlichen Quellen nennt das System die Einschränkung oder antwortet nicht, statt Unbelegtes als Tatsache auszugeben.",
      },
    ],
    callout: {
      kind: "note",
      h: "Nach Nutzen und Risiko staffeln",
      text: "Fang mit Quellen an, die einem klaren Anwendungsfall dienen, mit eindeutiger Zuständigkeit, stabilen Zugriffsregeln und beherrschbarer Sensibilität. Betriebsdaten kommen dazu, wenn Aktualität und Löschungen kontrolliert sind, Kommunikation erst nach Prüfung von Datenschutz, Sicherheit, Aufbewahrung und Auswirkungen auf Beschäftigte.",
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
            "Liste fünf mögliche Quellen mit Anwendungsfall, Zuständigkeit, Verbindlichkeit, Datenklassifizierung, Zugriffsmodell, Aktualitätsanforderung, Aufbewahrungsregel und sichtbaren Belegen auf.",
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
      "Prüfe Rechte der Person, Dienstidentität und Ressource vor jeder Ausgabe.",
    objective:
      "Prüfe Rechte der Person, Dienstidentität und Ressource vor jeder Ausgabe.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Die Kontrolle vor die Offenlegung setzen",
        readTimeMinutes: 7,
        content:
          "Die Berechtigungsprüfung gehört in den Abrufpfad und an die Grenze der Quelle. Ein Ausgabefilter greift erst nach dem Abruf und übersieht indirekte Offenlegung. Prüfe den Zugriff, bevor Dokumente, Ausschnitte, Metadaten oder abgeleitete Ergebnisse herausgehen, und teste die Richtlinie mit erlaubten und abgelehnten Fällen.",
      },
      {
        id: "s2",
        title: "Person und ausführenden Dienst getrennt abbilden",
        readTimeMinutes: 7,
        content:
          "Das System erkennt, welche Person die Anfrage ausgelöst hat und welcher Agent oder Dienst sie ausführt. Der wirksame Zugriff ist höchstens die Schnittmenge aus Rechten der Person, Umfang des Dienstes und geltender Richtlinie. Nutze kurzlebige Zugangsdaten und ausdrückliche Delegation, nie ein gemeinsames Konto mit erweiterten Rechten.",
      },
      {
        id: "s3",
        title: "Entscheidungen protokollieren, ohne ein neues Leck zu schaffen",
        readTimeMinutes: 6,
        content:
          "Protokolliere Person, Dienstidentität, Zeitpunkt, angeforderte Ressourcenkennungen, Richtlinienversion, Berechtigungsentscheidung und ausgegebene Quellenkennungen. Schütze das Protokoll und halte rohe Geheimnisse und unnötige sensible Anfragetexte heraus.",
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
            "Bestimme für einen Abrufablauf Person, Dienstidentität, Berechtigungsquelle, Regel für wirksame Rechte, Gültigkeit der Zugangsdaten, Verhalten bei Ablehnung und Protokollfelder. Benenne jede Lücke, die sich heute nicht rekonstruieren lässt.",
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
      "Lege Altersgrenzen fest, übertrage Änderungen und Löschungen, weise den Datenstand aus.",
    objective:
      "Lege Altersgrenzen fest, übertrage Änderungen und Löschungen, weise den Datenstand aus.",
    durationMinutes: 22,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Aktualität an die Entscheidung anpassen",
        readTimeMinutes: 11,
        content:
          "Eine regelmäßige Momentaufnahme genügt für stabiles Referenzmaterial, aber nicht für einen Ablauf, der auf schnell veränderlichen Daten handelt. Lege je Anwendungsfall und Quelle ein Höchstalter fest, auch für Änderungen, Widerrufe und Löschungen.",
      },
      {
        id: "s2",
        title: "Veraltete Zustände erkennen und ausweisen",
        readTimeMinutes: 11,
        content:
          "Wähle ereignisgesteuerte, geplante oder bedarfsgesteuerte Synchronisierung nach nötiger Aktualität und Kosten. Überwache Verzögerungen und Fehlschläge, gib Datenstand oder Version mit jedem Ergebnis aus und leg vorab fest, ob der Ablauf bei Überschreitung warnt, bestätigen lässt, auf die Quelle zurückgreift oder stoppt.",
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
            "Erfasse je wichtiger Quelle Aktualisierungsverfahren, beobachtete Verzögerung, Höchstalter, Löschverhalten, Hinweis auf veraltete Daten und Reaktion des Ablaufs bei Überschreitung.",
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
    subtitle: "Zwei Fragen zu Berechtigung und Aktualität.",
    objective: "Zwei Fragen zu Berechtigung und Aktualität.",
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
            text: "Berechtigung im Abrufpfad mit Personenrechten und Richtlinie durchsetzen.",
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
          "Das System muss unberechtigte Inhalte vor der Offenlegung abweisen; ein Ausgabefilter kommt zu spät und übersieht indirekte Lecks. Wirksamer Zugriff verbindet Personenrechte mit dem zugewiesenen Umfang des Dienstes.",
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
            text: "Er kann auf zu alten Daten handeln, wenn niemand Aktualität prüft.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Momentaufnahmen können keine neu erstellten Dateien enthalten.",
            isCorrect: false,
          },
        ],
        explanation:
          "Eine Momentaufnahme ist nur relativ zur geforderten Aktualität sicher. Lege die Anforderung fest, miss die Verzögerung, zeig den Datenstand und schränke den Ablauf bei Überschreitung ein oder stoppe ihn.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
