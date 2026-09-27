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
      "Bestimme das Kundenergebnis, das am Modell hängt, und seinen Ersatzweg.",
    objective:
      "Bestimme das Kundenergebnis, das am Modell hängt, und seinen Ersatzweg.",
    durationMinutes: 13,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Bei der Aufgabe der Kundin anfangen",
        readTimeMinutes: 4,
        content:
          "Eine Chatfunktion belegt nicht, dass das Produkt ein Problem besser löst. Fang bei der Aufgabe der Kundin an, bestimme die Verzögerung oder Entscheidung, die das Modell verändert, und woran du Erfolg erkennst. Streiche Funktionen, die dieses Ergebnis nicht verbessern.",
      },
      {
        id: "s2",
        title: "Fähigkeit in bestehende Kontrollen einbinden",
        readTimeMinutes: 5,
        content:
          "Eine modellgestützte Fähigkeit braucht die üblichen Produktgrenzen: unterstützte Eingaben, Berechtigungen, Fehlerzustände, Latenz, Datenverarbeitung und verantwortliche Personen. Behalte strukturierte Kontrollen, wo sie Klarheit schaffen oder Risiko begrenzen, und zeig die Rolle des Modells, wenn Kunden ein Ergebnis anfechten wollen.",
      },
      {
        id: "s3",
        title: "Abhängigkeit und Ersatzweg prüfen",
        readTimeMinutes: 4,
        content:
          "Frag, welches Kundenergebnis sich ändert, wenn das Modell fehlt oder schlechter arbeitet. Ändert sich keins, ist die Fähigkeit vielleicht unnötig. Hängt ein Kernergebnis daran, legst du Ersatzweg, Wiederherstellung und die Information an die Kundin fest.",
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
            "Prüfe drei modellgestützte Abläufe. Nenne je Kundenergebnis, modellabhängigen Schritt, Fehlerart und Ersatzweg.",
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
      "Trenne Kundenabsicht von Entscheidungen, Berechtigungen und Bestätigungen.",
    objective:
      "Trenne Kundenabsicht von Entscheidungen, Berechtigungen und Bestätigungen.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Absicht ist keine Befugnis",
        readTimeMinutes: 6,
        content:
          "Eine Suche, ein Klick, ein Upload oder ein Auftrag äußert ein Ziel und erlaubt sonst nichts. Halte fest, was beauftragt wurde, welche Annahmen das System treffen darf und welche Nebenwirkungen eine eigene Bestätigung oder Berechtigungsprüfung brauchen.",
      },
      {
        id: "s2",
        title: "Jeden Schritt vor der Verdichtung bewerten",
        readTimeMinutes: 6,
        content:
          "Prüfe jeden Schritt nach der Absicht: Ist er eindeutig, umkehrbar, beobachtbar und von der Kundenbefugnis gedeckt? Delegiere Schritte, die alle vier erfüllen. Bei Mehrdeutigkeit, Geldbewegung, Datenoffenlegung, rechtlicher Wirkung oder anderen erheblichen Folgen bleibt Prüfung oder Bestätigung.",
      },
      {
        id: "s3",
        title: "Gespräch und strukturierte Kontrollen verbinden",
        readTimeMinutes: 6,
        content:
          "Ein Gespräch taugt für mehrdeutige Eingaben und Rückfragen, strukturierte Kontrollen für genaue Werte, begrenzte Auswahl, Vergleich und Bestätigung. Wähle die Oberfläche nach Information und Risiko des aktuellen Schritts.",
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
        title: "Aus festem Vokabular zusammensetzen",
        readTimeMinutes: 7,
        content:
          "Lege Komponentenbibliothek, typisierte Datenverträge, erlaubte Anordnungen und bekannte Interaktionszustände fest. Nur daraus setzt das Modell zusammen. Prüfe die Struktur vor der Darstellung und halte einen stabilen Ersatz für den Fehlerfall bereit.",
      },
      {
        id: "s2",
        title: "Hierarchie der Vorgaben festlegen",
        readTimeMinutes: 7,
        content:
          "Sicherheit, Barrierefreiheit, Berechtigungen, Datenintegrität und Recht sind feste Grenzen. Gestaltungsregeln und Produktkonventionen setzen den erlaubten Raum, und Personalisierung bleibt darin. Protokolliere gewählte Komponenten und Eingaben, damit du unerwartetes Verhalten reproduzieren kannst.",
      },
      {
        id: "s3",
        title: "Folgenreiche Oberflächen eindeutig halten",
        readTimeMinutes: 7,
        content:
          "Zahlung, rechtliche Zustimmung, Kontowiederherstellung, Berechtigungsänderung, zerstörerische Aktionen und andere folgenreiche Schritte laufen über feste, geprüfte Abläufe. Eine generative Oberfläche darf erklären und vorbereiten. Die letzte Handlung und ihre Bestätigung bleiben vorhersehbar und prüfbar.",
      },
    ],
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
            "Wähle eine umkehrbare Oberfläche mit geringen Auswirkungen, auf der Kunden Unterschiedliches wollen. Definiere freigegebene Komponenten, feste Grenzen, Prüfkriterium und statischen Ersatz, und erweitere erst nach echten Fehlern.",
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
      "Miss Modellverhalten in Produktion, ohne einer einzelnen Kennzahl zu trauen.",
    objective:
      "Miss Modellverhalten in Produktion, ohne einer einzelnen Kennzahl zu trauen.",
    durationMinutes: 17,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Produktion bringt neue Bedingungen",
        readTimeMinutes: 6,
        content:
          "Produktion bringt zu den bekannten Fällen neue Eingaben, veränderte Daten, Werkzeugfehler, Latenz, echtes Kundenverhalten und verschobene Verteilungen. Datensparsame Ablaufspuren, Versionskennzeichen, Fehlerarten und Stichproben machen Vorfälle reproduzierbar, ohne sensible Inhalte zu horten.",
      },
      {
        id: "s2",
        title: "Beobachtbare Signale messen",
        readTimeMinutes: 6,
        content:
          "Erfasse überprüfbaren Aufgabenerfolg, Kundenkorrekturen, Werkzeugfehler, Ablehnungen, Latenz, Kosten, ausgelöste Sicherheitsregeln und Ersatzwege. Wo Signale keine Qualität belegen, bewertet ein Mensch eine dokumentierte Stichprobe. Trenne nach Ablauf und Version, damit kein Durchschnitt eine fehlerhafte Teilgruppe verdeckt.",
      },
      {
        id: "s3",
        title: "Warnung, Eindämmung und Rücknahme trennen",
        readTimeMinutes: 5,
        content:
          "Leite Schwellen aus Ausgangsverhalten und Fehlerkosten ab: Manche Signale alarmieren eine verantwortliche Person, andere schalten eine Fähigkeit ab oder lösen die Rücknahme auf eine bekannte Version aus. Teste diese Kontrollen vorab, schütze automatische Maßnahmen gegen verrauschte Kennzahlen, und eine benannte Person schließt jedes Ereignis.",
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
            "Definiere für eine kundennahe Modellfähigkeit drei Produktionssignale, je mit Ausgangswert, Warnschwelle, Eindämmungs- oder Rücknahmebedingung und verantwortlicher Person.",
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
            text: "Welches Kundenergebnis hängt am Modell, mit welchem Ersatzweg?",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Hat die Oberfläche eine Chatfunktion?",
            isCorrect: false,
          },
        ],
        explanation:
          "Eine Produktgrenze verbindet Modellverhalten mit einem Kundenergebnis, betrieblichen Vorgaben und einem Fehlerweg. Modellwahl, Werbesprache und Oberflächenform legen sie nicht fest.",
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
            text: "Klären, welche Schritte delegierbar sind und wo Bestätigung bleibt.",
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
          "Weniger Schritte helfen nur, wenn Befugnis, wesentliche Information und Wiederherstellung bleiben. Ordne jeden Schritt vor der Delegation nach Umkehrbarkeit, Beobachtbarkeit, Berechtigung und Auswirkung ein.",
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
            text: "Bei einer umkehrbaren, folgenarmen Oberfläche mit freigegebenen Komponenten.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Überall, auch bei zerstörerischen Aktionen und Berechtigungsänderungen.",
            isCorrect: false,
          },
        ],
        explanation:
          "Generative Zusammensetzung passt, wo Variation nützt, Folgen klein sind, Prüfung möglich ist und ein stabiler Ersatz existiert. Folgenreiche Bestätigungen bleiben eindeutig und prüfbar.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
