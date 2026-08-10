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
          "Legen Sie fest, welche Fragen oder Handlungen die Retrieval-Schicht unterstützen soll, bevor Sie Quellen anbinden. Benennen Sie für jeden Anwendungsfall die maßgeblichen Datensätze, das zulässige Alter, die Datenklassifizierung und die erforderlichen Belege. Eine gemeinsame Suchoberfläche kann den Zugriff vereinfachen, muss Unterschiede bei Verbindlichkeit, Sensibilität und Aufbewahrung jedoch erhalten.",
      },
      {
        id: "s2",
        title: "Nur begründete Quellen anbinden",
        readTimeMinutes: 8,
        content:
          "Dokumente, Quellcode, Tickets, Kundendaten, Nachrichten, Kalender und weitere Quellen haben unterschiedliche Risiken. Wenden Sie Zweckbindung und Datenminimierung an. Binden Sie Verantwortliche für Datenschutz, Sicherheit, Recht und Beschäftigtenvertretung ein, soweit erforderlich. Übernehmen Sie eine Quelle nicht allein deshalb, weil ein Konnektor verfügbar ist.",
      },
      {
        id: "s3",
        title: "Belege mit dem Ergebnis ausgeben",
        readTimeMinutes: 8,
        content:
          "Ein abgerufenes Ergebnis sollte Quellenverweise, maßgebliche Versionen oder Zeitstempel sowie wesentliche Zugriffs- und Aktualitätsgrenzen zeigen. Nutzende müssen die Belege prüfen können. Bei unzureichender Abdeckung oder widersprüchlichen Quellen sollte das System die Einschränkung nennen oder auf eine Antwort verzichten, statt eine unbelegte Zusammenfassung als Tatsache darzustellen.",
      },
    ],
    callout: {
      kind: "note",
      h: "Nach Nutzen und Risiko staffeln",
      text: "Beginnen Sie mit Quellen für einen klaren Anwendungsfall, eindeutiger Zuständigkeit, stabilen Zugriffsregeln und beherrschbarer Sensibilität. Ergänzen Sie Betriebsdaten, sobald Aktualität und Löschungen kontrolliert sind. Binden Sie Kommunikation erst nach ausdrücklicher Prüfung von Datenschutz, Sicherheit, Aufbewahrung und Auswirkungen auf Beschäftigte ein.",
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
            "Listen Sie fünf mögliche Quellen auf. Erfassen Sie jeweils Anwendungsfall, Zuständigkeit, Verbindlichkeit, Datenklassifizierung, Zugriffsmodell, Aktualitätsanforderung, Aufbewahrungsregel und die für Nutzende sichtbaren Belege.",
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
          "Die Berechtigungsprüfung gehört in den Abrufpfad und an die Grenze der Quelle. Ein Ausgabefilter greift erst, nachdem Inhalte bereits abgerufen wurden, und kann indirekte Offenlegungen übersehen. Prüfen Sie den Zugriff, bevor Dokumente, Ausschnitte, Metadaten oder abgeleitete Ergebnisse ausgegeben werden, und testen Sie die Richtlinie mit erlaubten sowie abgelehnten Fällen.",
      },
      {
        id: "s2",
        title: "Person und ausführenden Dienst getrennt abbilden",
        readTimeMinutes: 7,
        content:
          "Das System sollte erkennen, welche Person die Anfrage ausgelöst und welcher Agent oder Dienst sie ausgeführt hat. Der wirksame Zugriff darf nicht weiter reichen als die Schnittmenge aus Rechten der Person, zugewiesenem Umfang des Dienstes und aktueller Richtlinie. Verwenden Sie kurzlebige Zugangsdaten und ausdrückliche Delegation statt eines gemeinsam genutzten Kontos mit erweiterten Rechten.",
      },
      {
        id: "s3",
        title: "Entscheidungen protokollieren, ohne ein neues Leck zu schaffen",
        readTimeMinutes: 6,
        content:
          "Erfassen Sie Person, Dienstidentität, Zeitpunkt, angeforderte Ressourcenkennungen, Richtlinienversion, Berechtigungsentscheidung und ausgegebene Quellenkennungen. Schützen Sie das Protokoll selbst und speichern Sie weder rohe Geheimnisse noch unnötige sensible Anfragetexte. Der Datensatz soll eine Störung nachvollziehbar machen, ohne zu einem zweiten unkontrollierten Datenspeicher zu werden.",
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
            "Bestimmen Sie für einen Abrufablauf Person, Dienstidentität, Berechtigungsquelle, Regel für wirksame Rechte, Gültigkeitsdauer der Zugangsdaten, Verhalten bei Ablehnung und Protokollfelder. Benennen Sie jede derzeit nicht rekonstruierbare Lücke.",
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
          "Eine regelmäßige Momentaufnahme kann für stabiles Referenzmaterial genügen und für einen Ablauf mit Handlungen auf schnell veränderlichen Daten ungeeignet sein. Definieren Sie für jeden Anwendungsfall und jede Quelle ein höchstens zulässiges Alter. Nehmen Sie Änderungen, Widerrufe und Löschungen in die Zusage auf; veraltete Berechtigungen können ebenso folgenreich sein wie veraltete Inhalte.",
      },
      {
        id: "s2",
        title: "Veraltete Zustände erkennen und ausweisen",
        readTimeMinutes: 11,
        content:
          "Wählen Sie ereignisgesteuerte, geplante oder bedarfsgesteuerte Synchronisierung anhand der erforderlichen Aktualität und Betriebskosten. Überwachen Sie Verzögerungen und fehlgeschlagene Aktualisierungen. Geben Sie einen Datenstand oder eine Version mit Ergebnissen aus und legen Sie fest, ob der Ablauf bei Überschreitung warnt, Bestätigung verlangt, auf die Quelle zurückgreift oder stoppt.",
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
            "Erfassen Sie für jede wichtige Quelle Aktualisierungsverfahren, beobachtete Verzögerung, höchstes zulässiges Alter, Löschverhalten, Hinweis auf veraltete Daten und Reaktion des Ablaufs bei einer Überschreitung.",
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
    title: "Wissensprüfung zu Modul 7",
    subtitle: "Prüfen Sie die Abrufkontrollen dieses Moduls.",
    objective: "Prüfen Sie die Abrufkontrollen dieses Moduls.",
    durationMinutes: 9,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-data-q1",
        questionText:
          "Ein Abrufsystem gibt ein vertrauliches Dokument aus, auf das die anfragende Person nicht zugreifen darf. Welche grundlegende Architekturkorrektur ist erforderlich?",
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
          "Das System muss nicht berechtigte Inhalte vor einer Offenlegung abweisen. Ein Ausgabefilter greift zu spät und kann indirekte Datenlecks übersehen. Der wirksame Zugriff sollte sowohl die Rechte der anfragenden Person als auch den ausdrücklich zugewiesenen Umfang des Dienstes berücksichtigen.",
      },
      {
        id: "ano-data-q2",
        questionText:
          "Warum kann eine regelmäßige Momentaufnahme für einen handelnden Ablauf ungeeignet sein?",
        answerOptions: [
          {
            id: "a",
            text: "Jede Momentaufnahme lässt sich grundsätzlich nur langsam erstellen.",
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
          "Die Häufigkeit einer Momentaufnahme ist nur im Verhältnis zur Aktualitätsanforderung sicher. Die Kontrolle besteht darin, diese Anforderung festzulegen, die wirkliche Verzögerung zu messen, den Datenstand zu zeigen und den Ablauf bei Überschreitung einzuschränken oder zu stoppen.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
