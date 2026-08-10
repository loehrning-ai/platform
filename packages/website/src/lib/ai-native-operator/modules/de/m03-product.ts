import type { AiNativeOperatorLesson } from "../../types";

export const PRODUCT_LESSONS_DE: readonly AiNativeOperatorLesson[] = [
  {
    id: "product/1",
    moduleId: "product",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Produktgrenze festlegen",
    subtitle:
      "Bestimme das vom Modellverhalten abhängige Nutzerergebnis und den Ersatzweg bei einem Ausfall.",
    objective:
      "Bestimme das vom Modellverhalten abhängige Nutzerergebnis und den Ersatzweg bei einem Ausfall.",
    durationMinutes: 13,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Eine sichtbare KI-Funktion ist keine Produktstrategie",
        readTimeMinutes: 4,
        content:
          "Eine Chatfunktion kann nützlich sein. Ihre bloße Anwesenheit zeigt aber nicht, dass das Produkt ein Problem besser löst. Beginne mit der Aufgabe der nutzenden Person, bestimme die Verzögerung oder Entscheidung, die das Modell verändert, und lege fest, wie Erfolg beobachtet wird. Entferne Funktionen, die dieses Ergebnis nicht verbessern.",
      },
      {
        id: "s2",
        title: "Fähigkeit in bestehende Kontrollen einbinden",
        readTimeMinutes: 5,
        content:
          "Eine modellgestützte Fähigkeit braucht dieselben Produktgrenzen wie jedes andere System: unterstützte Eingaben, Berechtigungen, Fehlerzustände, Latenzerwartungen, Datenverarbeitung und verantwortliche Personen. Behalte strukturierte Kontrollen, wenn sie Klarheit schaffen oder Risiken begrenzen. Mache die Modellbeteiligung sichtbar, wenn Nutzende ein Ergebnis dadurch besser einordnen oder anfechten können.",
      },
      {
        id: "s3",
        title: "Abhängigkeit und Ersatzweg prüfen",
        readTimeMinutes: 4,
        content:
          "Frage, welches Nutzerergebnis sich ändert, wenn das Modell entfernt wird oder schlechter arbeitet. Ändert sich kein wesentliches Ergebnis, ist die Fähigkeit möglicherweise unnötig. Hängt ein Kernergebnis davon ab, definiere Ersatzweg, Wiederherstellung und Nutzerinformation. Sowohl eingebettete Funktionen als auch modellzentrierte Produkte können sinnvoll sein, wenn ihre Grenzen klar sind.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "product/1",
          cpId: "exercise",
          scenario:
            "Prüfe drei modellgestützte Abläufe. Nenne jeweils Nutzerergebnis, modellabhängigen Schritt, Fehlerart und Ersatzweg bei einem Modellausfall.",
          rows: 3,
        },
      },
    ],
  },
  {
    id: "product/2",
    moduleId: "product",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Delegierbare Grenze finden",
    subtitle:
      "Trenne die Nutzerabsicht von Entscheidungen, Berechtigungen und Bestätigungen, die ausdrücklich bleiben müssen.",
    objective:
      "Trenne die Nutzerabsicht von Entscheidungen, Berechtigungen und Bestätigungen, die ausdrücklich bleiben müssen.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Absicht ist keine Befugnis",
        readTimeMinutes: 6,
        content:
          "Eine Suchanfrage, ein Klick, ein hochgeladenes Dokument oder ein schriftlicher Auftrag kann ein gewünschtes Ergebnis ausdrücken. Daraus folgt keine automatische Befugnis für jede erforderliche Handlung. Halte fest, was beauftragt wurde, welche Annahmen das System treffen darf und welche Nebenwirkungen eine gesonderte Bestätigung oder Berechtigungsprüfung erfordern.",
      },
      {
        id: "s2",
        title: "Jeden Schritt vor der Verdichtung bewerten",
        readTimeMinutes: 6,
        content:
          "Prüfe für jeden Schritt nach der Absicht, ob er eindeutig, umkehrbar, beobachtbar und von der Nutzerbefugnis gedeckt ist. Delegiere Schritte, die die Kontrollanforderungen erfüllen. Behalte Prüfung oder Bestätigung bei Mehrdeutigkeit, Geldbewegung, Datenoffenlegung, rechtlicher Wirkung oder anderen erheblichen Folgen. Weniger Schritte sind nur nützlich, wenn wichtige Information und Kontrolle erhalten bleiben.",
      },
      {
        id: "s3",
        title: "Gespräch und strukturierte Kontrollen verbinden",
        readTimeMinutes: 6,
        content:
          "Ein Gespräch eignet sich für mehrdeutige Eingaben und Rückfragen. Strukturierte Kontrollen eignen sich für genaue Werte, begrenzte Auswahl, Vergleich und Bestätigung. Wähle die Oberfläche anhand von Information und Risiko des aktuellen Schritts, statt Chat als Standard zu behandeln.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "product/2",
          cpId: "exercise",
          scenario:
            "Wähle einen Ablauf mit mehr als fünf Schritten nach der geäußerten Absicht. Markiere delegierbare Schritte, nötige Bestätigungen, sichtbare Systeminformationen und den Wiederherstellungsweg nach einem Fehler.",
          rows: 4,
        },
      },
    ],
  },
  {
    id: "product/3",
    moduleId: "product",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Begrenzte generative Oberflächen",
    subtitle:
      "Erzeuge Oberflächen nur aus freigegebenen Komponenten, Datenformen, Zuständen und Barrierefreiheitsregeln.",
    objective:
      "Erzeuge Oberflächen nur aus freigegebenen Komponenten, Datenformen, Zuständen und Barrierefreiheitsregeln.",
    durationMinutes: 21,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Kompositionen statt beliebiger Auszeichnung erzeugen",
        readTimeMinutes: 7,
        content:
          "Definiere eine Komponentenbibliothek, typisierte Datenverträge, erlaubte Anordnungen und bekannte Interaktionszustände. Das Modell darf aus diesem Vokabular auswählen und zusammensetzen. Prüfe die erzeugte Struktur vor der Darstellung und biete einen stabilen Ersatz, wenn die Prüfung fehlschlägt.",
      },
      {
        id: "s2",
        title: "Hierarchie der Vorgaben festlegen",
        readTimeMinutes: 7,
        content:
          "Sicherheit, Barrierefreiheit, Berechtigungen, Datenintegrität und rechtliche Anforderungen sind feste Grenzen. Gestaltungsregeln und Produktkonventionen beschreiben den erlaubten Raum. Personalisierung findet nur darin statt. Protokolliere gewählte Komponenten und Eingaben, damit unerwartetes Verhalten reproduzierbar bleibt.",
      },
      {
        id: "s3",
        title: "Folgenreiche Oberflächen eindeutig halten",
        readTimeMinutes: 7,
        content:
          "Verwende feste, geprüfte Abläufe für Zahlungen, rechtliche Zustimmung, Kontowiederherstellung, Berechtigungsänderungen, zerstörerische Aktionen und andere folgenreiche Schritte. Eine generative Oberfläche kann Erklärung oder Vorbereitung unterstützen. Endhandlung und Bestätigungszustand müssen vorhersehbar und prüfbar bleiben.",
      },
    ],
    callout: {
      kind: "note",
      h: "Ein begrenzter Einstieg",
      text: "Wähle eine umkehrbare Oberfläche mit geringen Auswirkungen und unterschiedlichen Informationsbedürfnissen. Begrenze die Erzeugung auf freigegebene Komponenten, ergänze Datenformprüfung und einen festen Ersatz und prüfe reale Fehler vor einer Erweiterung.",
    },
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "product/3",
          cpId: "exercise",
          scenario:
            "Bestimme eine umkehrbare Oberfläche mit geringen Auswirkungen und unterschiedlichen Nutzerabsichten. Definiere freigegebene Komponenten, feste Grenzen, Prüfkriterium und statischen Ersatz.",
          rows: 3,
        },
      },
    ],
  },
  {
    id: "product/4",
    moduleId: "product",
    lessonNumber: 4,
    number: 4,
    kind: "reading",
    title: "Produktionsevaluation und Beobachtbarkeit",
    subtitle:
      "Miss modellgestütztes Verhalten in Produktion, ohne eine einzelne Kennzahl als Wahrheit zu behandeln.",
    objective:
      "Miss modellgestütztes Verhalten in Produktion, ohne eine einzelne Kennzahl als Wahrheit zu behandeln.",
    durationMinutes: 17,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Offline-Evaluationen decken Produktion nicht ab",
        readTimeMinutes: 6,
        content:
          "Eine Sammlung vor der Freigabe deckt bekannte Fälle ab. In Produktion kommen neue Eingaben, veränderte Daten, Werkzeugfehler, Latenz, Nutzerverhalten und Verteilungsverschiebungen hinzu. Beobachte diese Bedingungen direkt. Nutze datensparsame Ablaufspuren, Versionskennzeichen, Fehlerarten und Stichprobenprüfungen, damit ein Vorfall ohne unnötige Sammlung sensibler Inhalte reproduzierbar bleibt.",
      },
      {
        id: "s2",
        title: "Beobachtbare Signale messen",
        readTimeMinutes: 6,
        content:
          "Erfasse überprüfbaren Aufgabenerfolg, Nutzerkorrekturen, Werkzeugfehler, Ablehnungen, Latenz, Kosten, ausgelöste Sicherheitsregeln und die Nutzung von Ersatzwegen. Ergänze dokumentierte menschliche Bewertungen für eine Stichprobe, wenn automatische Signale keine Qualität belegen können. Trenne Ergebnisse nach Arbeitsablauf und Version, damit ein Gesamtdurchschnitt keine kritische Teilgruppe verdeckt.",
      },
      {
        id: "s3",
        title: "Warnung, Eindämmung und Rücknahme trennen",
        readTimeMinutes: 5,
        content:
          "Leite Schwellenwerte aus Ausgangsverhalten und Fehlerkosten ab. Einige Signale warnen eine verantwortliche Person, andere deaktivieren eine einzelne Fähigkeit oder rechtfertigen die Rücknahme auf eine bekannte Version. Teste diese Kontrollen vor einem Vorfall. Automatische Maßnahmen brauchen Schutz gegen verrauschte Kennzahlen; eine benannte Person untersucht und schließt das Ereignis.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "product/4",
          cpId: "exercise",
          title: "Produktionsevaluation entwerfen",
          scenario:
            "Definiere für eine nutzernahe Modellfähigkeit drei Produktionssignale. Nenne Ausgangswert, Warnschwelle, Eindämmungs- oder Rücknahmebedingung und verantwortliche Person.",
          rows: 4,
        },
      },
    ],
  },
  {
    id: "product/5",
    moduleId: "product",
    lessonNumber: 5,
    number: 5,
    kind: "quiz",
    title: "Modul 3, Wissensprüfung",
    subtitle:
      "Prüfe dein Verständnis von Produktgrenzen, Delegation, begrenzten Oberflächen und Produktionskontrollen.",
    objective:
      "Prüfe dein Verständnis von Produktgrenzen, Delegation, begrenzten Oberflächen und Produktionskontrollen.",
    durationMinutes: 8,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-product-q1",
        questionText:
          "Welche Frage bestimmt die Grenze einer modellgestützten Produktfähigkeit am besten?",
        answerOptions: [
          {
            id: "a",
            text: "Bezeichnet die Produktseite sie als KI-gestützt?",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Verwendet sie intern ein großes Sprachmodell?",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Welches Nutzerergebnis hängt vom Modellverhalten ab und welcher Ersatzweg bleibt bei einem Fehler?",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Enthält die Oberfläche eine Chatfunktion?",
            isCorrect: false,
          },
        ],
        explanation:
          "Eine Produktgrenze verbindet Modellverhalten mit einem konkreten Nutzerergebnis, betrieblichen Vorgaben und einem Fehlerweg. Modellwahl, Werbesprache oder Oberflächenform legen diese Grenze nicht fest.",
      },
      {
        id: "ano-product-q2",
        questionText:
          "Ein Ablauf hat sieben Schritte nach der geäußerten Nutzerabsicht. Was sollte das Produktteam zuerst tun?",
        answerOptions: [
          {
            id: "a",
            text: "Eine Chatfunktion ergänzen, ohne den Ablauf zu ändern.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Bestimmen, welche Schritte sicher delegierbar sind und wo Berechtigung, Prüfung oder Bestätigung erhalten bleiben müssen.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Alle Bestätigungen entfernen, um die Schrittzahl zu senken.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Die Schritte hinter einer Ladeanzeige verbergen.",
            isCorrect: false,
          },
        ],
        explanation:
          "Weniger Schritte sind nur nützlich, wenn Befugnis, wesentliche Information und Wiederherstellung erhalten bleiben. Ordne jeden Schritt vor der Delegation nach Umkehrbarkeit, Beobachtbarkeit, Berechtigung und Auswirkung ein.",
      },
      {
        id: "ano-product-q3",
        questionText: "Wo ist eine generative Oberfläche am ehesten geeignet?",
        answerOptions: [
          {
            id: "a",
            text: "Bei der letzten Bestätigung einer Zahlung.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Bei einer rechtlichen Zustimmung.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Bei einer umkehrbaren Oberfläche mit geringen Auswirkungen, unterschiedlichen Bedürfnissen und freigegebenem Komponentensatz.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Bei jeder Oberfläche einschließlich zerstörerischer Aktionen und Berechtigungsänderungen.",
            isCorrect: false,
          },
        ],
        explanation:
          "Generative Zusammensetzung eignet sich zuerst dort, wo Variation nützt, Folgen begrenzt sind, eine Prüfung möglich ist und ein stabiler Ersatz existiert. Folgenreiche Bestätigungen bleiben eindeutig und prüfbar.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
