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
      "Bestimme das Kundenergebnis, das am Modellverhalten hängt, und den Ersatzweg bei einem Ausfall.",
    objective:
      "Bestimme das Kundenergebnis, das am Modellverhalten hängt, und den Ersatzweg bei einem Ausfall.",
    durationMinutes: 13,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Eine sichtbare KI-Funktion ist keine Produktstrategie",
        readTimeMinutes: 4,
        content:
          "Eine Chatfunktion kann nützlich sein. Dass sie da ist, beweist nicht, dass das Produkt irgendein Problem besser löst. Fang bei der Aufgabe der Kundin an, bestimme die Verzögerung oder Entscheidung, die das Modell verändert, und lege fest, woran du Erfolg erkennst. Funktionen, die dieses Ergebnis nicht verbessern, fliegen raus.",
      },
      {
        id: "s2",
        title: "Fähigkeit in bestehende Kontrollen einbinden",
        readTimeMinutes: 5,
        content:
          "Eine modellgestützte Fähigkeit braucht dieselben Produktgrenzen wie jedes andere System: unterstützte Eingaben, Berechtigungen, Fehlerzustände, Latenzerwartungen, Datenverarbeitung, verantwortliche Personen. Strukturierte Kontrollen bleiben, wo sie Klarheit schaffen oder Risiko begrenzen. Und die Modellbeteiligung wird sichtbar, sobald Kunden ein Ergebnis dadurch besser einordnen oder anfechten können.",
      },
      {
        id: "s3",
        title: "Abhängigkeit und Ersatzweg prüfen",
        readTimeMinutes: 4,
        content:
          "Nimm das Modell gedanklich heraus oder lass es schlechter arbeiten. Ändert sich kein wesentliches Kundenergebnis, hat die Fähigkeit ihren Zweck noch nicht bewiesen. Hängt ein Kernergebnis daran, brauchst du Ersatzweg, Wiederherstellung und eine Information an die Kundin. Eingebettete Funktionen und modellzentrierte Produkte können beide funktionieren, solange ihre Grenzen klar sind.",
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
            "Prüfe drei modellgestützte Abläufe. Nenne jeweils Kundenergebnis, modellabhängigen Schritt, Fehlerart und Ersatzweg bei einem Modellausfall.",
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
      "Trenne Kundenabsicht von Entscheidungen, Berechtigungen und Bestätigungen, die ausdrücklich bleiben müssen.",
    objective:
      "Trenne Kundenabsicht von Entscheidungen, Berechtigungen und Bestätigungen, die ausdrücklich bleiben müssen.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Absicht ist keine Befugnis",
        readTimeMinutes: 6,
        content:
          "Eine Kundin tippt eine Suchanfrage, klickt, lädt ein Dokument hoch oder schreibt einen Auftrag. Damit hat sie ein Ziel geäußert, nicht jede Handlung erlaubt, die auf dem Weg dorthin nötig wird. Halte fest, was beauftragt wurde, welche Annahmen das System treffen darf und welche Nebenwirkungen eine eigene Bestätigung oder Berechtigungsprüfung brauchen.",
      },
      {
        id: "s2",
        title: "Jeden Schritt vor der Verdichtung bewerten",
        readTimeMinutes: 6,
        content:
          "Prüfe jeden Schritt nach der Absicht auf vier Eigenschaften: eindeutig, umkehrbar, beobachtbar, von der Kundenbefugnis gedeckt. Erfüllt er die Kontrollanforderungen, delegiere ihn. Bei Mehrdeutigkeit, Geldbewegung, Datenoffenlegung, rechtlicher Wirkung oder anderen erheblichen Folgen bleibt Prüfung oder Bestätigung. Weniger Schritte sind nur ein Gewinn, wenn wichtige Information und Kontrolle nicht mit verschwinden.",
      },
      {
        id: "s3",
        title: "Gespräch und strukturierte Kontrollen verbinden",
        readTimeMinutes: 6,
        content:
          "Ein Gespräch taugt für mehrdeutige Eingaben und Rückfragen. Strukturierte Kontrollen taugen für genaue Werte, begrenzte Auswahl, Vergleich und Bestätigung. Wähle die Oberfläche nach Information und Risiko des aktuellen Schritts. Chat ist kein Standard.",
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
            "Nimm einen Ablauf mit mehr als fünf Schritten nach der geäußerten Absicht. Markiere delegierbare Schritte, nötige Bestätigungen, sichtbare Systeminformationen und den Weg zurück nach einem Fehler.",
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
          "Das Modell bekommt ein Vokabular, keine Freiheit: Komponentenbibliothek, typisierte Datenverträge, erlaubte Anordnungen, bekannte Interaktionszustände. Daraus darf es auswählen und zusammensetzen. Prüfe die erzeugte Struktur vor der Darstellung und halte einen stabilen Ersatz bereit, falls die Prüfung scheitert.",
      },
      {
        id: "s2",
        title: "Hierarchie der Vorgaben festlegen",
        readTimeMinutes: 7,
        content:
          "Sicherheit, Barrierefreiheit, Berechtigungen, Datenintegrität und Recht sind feste Grenzen. Gestaltungsregeln und Produktkonventionen beschreiben den erlaubten Raum. Personalisierung findet nur darin statt. Protokolliere gewählte Komponenten und Eingaben, damit du unerwartetes Verhalten reproduzieren kannst.",
      },
      {
        id: "s3",
        title: "Folgenreiche Oberflächen eindeutig halten",
        readTimeMinutes: 7,
        content:
          "Zahlung, rechtliche Zustimmung, Kontowiederherstellung, Berechtigungsänderung, Löschen: dafür gibt es feste, geprüfte Abläufe. Eine generative Oberfläche darf erklären und vorbereiten. Die letzte Handlung und der Bestätigungszustand bleiben vorhersehbar und prüfbar.",
      },
    ],
    callout: {
      kind: "note",
      h: "Ein begrenzter Einstieg",
      text: "Such dir eine umkehrbare Oberfläche mit geringen Auswirkungen und unterschiedlichen Informationsbedürfnissen. Begrenze die Erzeugung auf freigegebene Komponenten, ergänze Datenformprüfung und festen Ersatz. Erweitert wird erst nach echten Fehlern.",
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
            "Bestimme eine umkehrbare Oberfläche mit geringen Auswirkungen, auf der Kunden Unterschiedliches wollen. Definiere freigegebene Komponenten, feste Grenzen, Prüfkriterium und statischen Ersatz.",
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
          "Die Sammlung vor der Freigabe war grün. Dann kommt Produktion: neue Eingaben, veränderte Daten, Werkzeugfehler, Latenz, echtes Kundenverhalten, verschobene Verteilungen. Beobachte diese Bedingungen direkt. Datensparsame Ablaufspuren, Versionskennzeichen, Fehlerarten und Stichproben reichen, um einen Vorfall zu reproduzieren, ohne sensible Inhalte auf Vorrat zu sammeln.",
      },
      {
        id: "s2",
        title: "Beobachtbare Signale messen",
        readTimeMinutes: 6,
        content:
          "Erfasse überprüfbaren Aufgabenerfolg, Kundenkorrekturen, Werkzeugfehler, Ablehnungen, Latenz, Kosten, ausgelöste Sicherheitsregeln und die Nutzung von Ersatzwegen. Wo automatische Signale keine Qualität belegen, bewertet ein Mensch eine Stichprobe nach dokumentierten Regeln. Trenne nach Arbeitsablauf und Version, sonst verdeckt der Durchschnitt die Teilgruppe, bei der es brennt.",
      },
      {
        id: "s3",
        title: "Warnung, Eindämmung und Rücknahme trennen",
        readTimeMinutes: 5,
        content:
          "Schwellenwerte kommen aus Ausgangsverhalten und Fehlerkosten. Manche Signale wecken eine verantwortliche Person, andere schalten eine einzelne Fähigkeit ab oder rechtfertigen die Rücknahme auf eine bekannte Version. Teste diese Kontrollen vor dem Vorfall, nicht währenddessen. Automatische Maßnahmen brauchen Schutz gegen verrauschte Kennzahlen; eine benannte Person untersucht und schließt das Ereignis.",
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
            "Definiere für eine kundennahe Modellfähigkeit drei Produktionssignale, jeweils mit Ausgangswert, Warnschwelle, Eindämmungs- oder Rücknahmebedingung und verantwortlicher Person.",
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
      "Drei Fragen zu Produktgrenzen, Delegation, begrenzten Oberflächen und Produktionskontrollen.",
    objective:
      "Drei Fragen zu Produktgrenzen, Delegation, begrenzten Oberflächen und Produktionskontrollen.",
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
            text: "Nennt die Produktseite sie KI-gestützt?",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Steckt intern ein großes Sprachmodell drin?",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Welches Kundenergebnis hängt vom Modellverhalten ab, und welcher Ersatzweg bleibt bei einem Fehler?",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Hat die Oberfläche eine Chatfunktion?",
            isCorrect: false,
          },
        ],
        explanation:
          "Eine Produktgrenze verbindet Modellverhalten mit einem konkreten Kundenergebnis, betrieblichen Vorgaben und einem Fehlerweg. Modellwahl, Werbesprache und Oberflächenform legen diese Grenze nicht fest.",
      },
      {
        id: "ano-product-q2",
        questionText:
          "Ein Ablauf hat sieben Schritte nach der geäußerten Absicht der Kundin. Was tut das Produktteam zuerst?",
        answerOptions: [
          {
            id: "a",
            text: "Eine Chatfunktion davorsetzen, Ablauf unverändert.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Bestimmen, welche Schritte sicher delegierbar sind und wo Berechtigung, Prüfung oder Bestätigung bleiben müssen.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Alle Bestätigungen streichen, damit die Schrittzahl sinkt.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Die Schritte hinter einer Ladeanzeige verstecken.",
            isCorrect: false,
          },
        ],
        explanation:
          "Weniger Schritte sind nur ein Gewinn, wenn Befugnis, wesentliche Information und Wiederherstellung erhalten bleiben. Ordne jeden Schritt vor der Delegation nach Umkehrbarkeit, Beobachtbarkeit, Berechtigung und Auswirkung ein.",
      },
      {
        id: "ano-product-q3",
        questionText: "Wo passt eine generative Oberfläche am ehesten?",
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
            text: "Überall, auch bei Löschaktionen und Berechtigungsänderungen.",
            isCorrect: false,
          },
        ],
        explanation:
          "Generative Zusammensetzung gehört zuerst dorthin, wo Variation nützt, Folgen begrenzt sind, eine Prüfung möglich ist und ein stabiler Ersatz existiert. Folgenreiche Bestätigungen bleiben eindeutig und prüfbar.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
