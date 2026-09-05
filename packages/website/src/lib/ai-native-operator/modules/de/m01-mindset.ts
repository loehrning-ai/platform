import type { AiNativeOperatorLesson } from "../../types";

export const MINDSET_LESSONS_DE: readonly AiNativeOperatorLesson[] = [
  {
    id: "mindset/1",
    moduleId: "mindset",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Erst die Aufgabe wählen, dann das Werkzeug",
    subtitle: "Prüfe vor der Delegation, ob die Aufgabe für ein Modell taugt.",
    objective: "Prüfe vor der Delegation, ob die Aufgabe für ein Modell taugt.",
    durationMinutes: 14,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Beim Ergebnis anfangen, nicht beim Modell",
        readTimeMinutes: 5,
        content:
          "Die falsche Frage: Wo können wir KI einbauen? Die richtige: Welches Ergebnis brauchen wir, wie viele Fehler sind erlaubt, wer steht dafür gerade? Ein Modell lohnt sich, wenn es Aufwand spart, ohne eine davon zu schwächen. Ist das Ergebnis unklar, kläre erst das. Dann das Werkzeug.",
      },
      {
        id: "s2",
        title: "Guter Kandidat, schlechter Kandidat",
        readTimeMinutes: 5,
        content:
          "Ein guter erster Kandidat hat klare Eingaben, ein sichtbares Ergebnis und einen Prüfschritt, der weniger kostet als die Handarbeit. Ein schlechter: unklare Befugnis, unumkehrbare Folgen, sensible Daten ohne freigegebenen Schutz, ein Ergebnis, das niemand prüfen kann. Das ist nicht endgültig. Bessere Spezifikation, bessere Kontrollen, und die Aufgabe wechselt die Liste.",
      },
      {
        id: "s3",
        title: "Klein delegieren, dann erst erweitern",
        readTimeMinutes: 4,
        content:
          "Gib dem Modell eine enge Aufgabe, eine klare Abbruchbedingung und ausdrückliche Vorgaben. Entscheidungen, Freigaben und alles, was nach außen wirkt, bleiben bei einer benannten Person, bis der Arbeitsablauf an echten Ergebnissen zeigt, dass seine Kontrollen greifen. Ausgaben gelesen, Fehlerfälle gelesen, dann erweitern. Nicht vorher.",
      },
    ],
    callout: {
      kind: "quote",
      text: "Delegiere nur, wenn der Nutzen die Kosten für Spezifikation, Prüfung und Korrektur übersteigt.",
      attr: "Arbeitsregel",
    },
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "mindset/1",
          cpId: "exercise",
          scenario:
            "Nimm drei Aufgaben dieser Woche, die länger als 30 Minuten gedauert haben. Notiere zu jeder das erwartete Ergebnis, die Kosten eines Fehlers und einen begrenzten Teil, den du gefahrlos delegieren könntest.",
          rows: 3,
        },
      },
    ],
  },
  {
    id: "mindset/2",
    moduleId: "mindset",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Vier Stufen betrieblicher Kontrolle",
    subtitle:
      "Vier Stufen zeigen, wie konsequent du modellgestützte Arbeit definierst, prüfst und steuerst.",
    objective:
      "Vier Stufen zeigen, wie konsequent du modellgestützte Arbeit definierst, prüfst und steuerst.",
    durationMinutes: 11,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "L0, Ungeprüft",
        readTimeMinutes: 3,
        content:
          "Alles läuft wie immer, von Hand. Niemand im Team hat geprüft, wo ein Modell helfen würde und wo nicht. Für eine einzelne Aufgabe kann das die richtige Wahl sein. Aber als Entscheidung aus Risiko und Kosten, nicht aus Gewohnheit.",
      },
      {
        id: "s2",
        title: "L1, Unterstützt",
        readTimeMinutes: 3,
        content:
          "Eine Person lässt sich in engem Rahmen Entwürfe, Zusammenfassungen oder Umformungen erzeugen. Sie bleibt in der Aufgabe, liefert das Material und prüft das Ergebnis vor der Nutzung. Die Praxis gehört ihr allein. Im Team ist nichts davon wiederholbar.",
      },
      {
        id: "s3",
        title: "L2, Kontrollierter Arbeitsablauf",
        readTimeMinutes: 3,
        content:
          "Wiederkehrende Aufgaben haben Spezifikation, freigegebenen Kontext, Prüfkriterien und klare Prüfverantwortung. Modellergebnisse laufen durch dieselben technischen und betrieblichen Kontrollen wie alles andere, nicht daran vorbei. Fehler werden erfasst und fließen in den Ablauf zurück.",
      },
      {
        id: "s4",
        title: "L3, Orchestriertes Aufgabenportfolio",
        readTimeMinutes: 2,
        content:
          "Mehrere unabhängige Aufgaben laufen parallel, jede im eigenen Arbeitsbereich mit klaren Berechtigungen, Freigabeschranken und benannter Verantwortung. Parallel läuft nur, was in seinen Abhängigkeiten verstanden ist. Und eine Person nimmt jedes Ergebnis an, lehnt es ab oder gibt es frei.",
      },
    ],
    callout: {
      kind: "note",
      h: "Kontrollen bewerten, nicht Werkzeugnutzung",
      text: "Häufige Modellnutzung ist kein Reifegrad. Zähl wiederholbare Spezifikationen, Prüfnachweise, Vorfallbehandlung und klare Verantwortung. Unterscheiden sich die Praktiken, bewerte jede Aufgabenfamilie für sich.",
    },
    exerciseKind: "self-rate",
    widgets: [
      {
        kind: "self-rate",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "mindset/2",
          cpId: "exercise",
          title: "Selbsteinschätzung der Kontrollen",
          scenario:
            "Bewerte deine heutige Arbeitsweise an zuletzt erledigten Aufgaben, nicht an geplanten Verbesserungen.",
          axes: [
            {
              id: "tasks",
              label: "Praxis der Aufgabenauswahl",
              anchors: [
                "Nicht bewertet",
                "Einzelne Versuche",
                "Definierte Aufgabenkriterien",
                "Kontrollen auf Portfolioebene",
              ],
            },
            {
              id: "tools",
              label: "Einbindung in Arbeitsabläufe",
              anchors: [
                "Manuelles Verfahren",
                "Begrenzte Unterstützung",
                "Kontrollierter Arbeitsablauf",
                "Getrennte parallele Arbeit",
              ],
            },
            {
              id: "trust",
              label: "Prüfpraxis",
              anchors: [
                "Keine Kalibrierung",
                "Informelle Prüfung",
                "Aufgabenspezifische Kontrollen",
                "Gemessene Freigabeschranken",
              ],
            },
          ],
        },
      },
    ],
  },
  {
    id: "mindset/3",
    moduleId: "mindset",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Prüfaufwand an Fehlerkosten ausrichten",
    subtitle:
      "Wie tief du prüfst, folgt aus Wahrscheinlichkeit, Auswirkung und Erkennbarkeit eines Fehlers.",
    objective:
      "Wie tief du prüfst, folgt aus Wahrscheinlichkeit, Auswirkung und Erkennbarkeit eines Fehlers.",
    durationMinutes: 16,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Vertrauen gilt für Aufgabe und Kontrollsatz",
        readTimeMinutes: 5,
        content:
          "Ein Modell ist weder vertrauenswürdig noch unzuverlässig. Beide Urteile treffen die falsche Einheit. Ein Nachweis gilt für eine bestimmte Aufgabe, Modellversion, Eingabe, Kontextquelle, Werkzeugausstattung und Prüfmethode. Ändert sich eine davon, sagt das alte Ergebnis nichts über das neue Verhalten.",
      },
      {
        id: "s2",
        title: "Fehlerkosten systematisch bewerten",
        readTimeMinutes: 6,
        content:
          "Drei Fragen: Wie wahrscheinlich ist ein Fehler, was kostet er, sieht die Prüferin ihn? Ein umkehrbarer interner Entwurf braucht eine kurze Durchsicht. Eine Sicherheitsänderung, eine Kundenentscheidung, eine Kennzahl für den Controller oder eine Offenlegung verlangt Quellenprüfung, Tests, ein zweites Augenpaar oder den Verzicht aufs Modell. Der Prüfaufwand wächst mit dem Restrisiko.",
      },
      {
        id: "s3",
        title: "Nachweise aus geprüften Fällen aufbauen",
        readTimeMinutes: 5,
        content:
          "Fang mit Aufgaben an, für die eine verlässliche Referenz oder ein eindeutiger Test existiert. Vergleiche die Ausgabe damit, benenne die Fehlerart, halte die Bedingungen fest. Ändern sich Modell, Eingabe, Daten oder Werkzeuge, prüfst du die Stichprobe erneut. So wird pauschales Vertrauen zum Nachweis für diese Aufgabe.",
      },
    ],
    callout: {
      kind: "warn",
      h: "Verantwortung geht nicht auf das Modell über",
      text: "Eine selbstsichere Ausgabe und eine erfahrene Prüferin können zusammen trotzdem einen Fehler durchwinken. Die benannte Person führt die Kontrollen fürs Restrisiko selbst durch und muss erklären können, warum sie angenommen hat.",
    },
    exerciseKind: "matrix-grid",
    widgets: [
      {
        kind: "matrix-grid",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "mindset/3",
          cpId: "exercise",
          title: "Prüfmatrix",
          scenario:
            "Lege je Aufgabenart die Mindestprüfung in deinem heutigen Umfeld fest. Teuer oder schwer erkennbar heißt: eine Stufe höher.",
          rows: [
            "Interner E-Mail-Entwurf",
            "Externe Kunden-E-Mail",
            "Codeänderung unter 50 Zeilen",
            "Codeänderung über 200 Zeilen",
            "Kennzahl für die Geschäftsführung",
            "Entwurf einer Leistungsbeurteilung",
          ],
          cols: [
            "Überfliegen",
            "Sorgfältig lesen",
            "Gegen Quelle prüfen",
            "Durch zweite Person prüfen lassen",
          ],
        },
      },
    ],
  },
  {
    id: "mindset/4",
    moduleId: "mindset",
    lessonNumber: 4,
    number: 4,
    kind: "reading",
    title: "Zuverlässige Systeme statt Heldentum belohnen",
    subtitle:
      "Anerkennung im Team gehört klarer Verantwortung, wiederholbarer Arbeit und kontrollierten Ergebnissen.",
    objective:
      "Anerkennung im Team gehört klarer Verantwortung, wiederholbarer Arbeit und kontrollierten Ergebnissen.",
    durationMinutes: 12,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Manueller Aufwand ist kein Qualitätsmaß",
        readTimeMinutes: 4,
        content:
          "Freitagabend, die Änderung steht, der Entwickler war die halbe Nacht dran. Beeindruckend. Nur sagen Arbeitsstunden und Codezeilen nichts darüber, ob die Änderung korrekt, wartbar oder nützlich ist. Modellnutzung genauso wenig. Bewerte Ergebnis, Nachweise, Betriebskosten und ob jemand anderes das Verfahren verstehen und wiederholen kann.",
      },
      {
        id: "s2",
        title: "Teamwirksame Kontrollen anerkennen",
        readTimeMinutes: 4,
        content:
          "Lob gehört denen, die Spezifikationen klären, Regressionstests ergänzen, Fehlerarten dokumentieren, unnötige Schritte streichen oder unsichere Arbeit stoppen. Solche Beiträge verbessern nicht eine Auslieferung, sondern jede danach. Belohne weder Stellenabbau noch Ausgabemenge ohne Blick auf Qualität, Belastung und Folgerisiken.",
      },
      {
        id: "s3",
        title: "Erfahrung an Prüfgrenzen einsetzen",
        readTimeMinutes: 4,
        content:
          "Erfahrene Leute bringen Domänenwissen, Architekturkontext und einen Blick für Fehler mit, die sonst niemand sieht. Setz sie dort ein, wo Vorgaben entstehen, Ausnahmen geprüft werden und andere lernen, Ergebnisse zu bewerten. Das Werkzeug liefert ein Arbeitsergebnis; ob es taugt, entscheidet die verantwortliche Person.",
      },
    ],
    exerciseKind: "plays",
    widgets: [
      {
        kind: "plays",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "mindset/4",
          cpId: "exercise",
          title: "Deine nächsten Kontrollen",
          scenario: "Wähle drei Praktiken für den kommenden Monat.",
          kindLabel: "Festlegung",
          selectedLabel: "gewählt",
          confirmedLabel: "Festgelegt",
          minPick: 3,
          options: [
            "Vor einer modellgestützten Aufgabe die Delegationsgrenze in einem Satz festhalten.",
            "Jede Woche einen modellgestützten Arbeitsablauf auf Fehler und Kontrolllücken prüfen.",
            "Wöchentlich ein geprüftes Beispiel teilen, samt Fehler und Erkennungsweg.",
            "Wiederholbare Ergebnisse anerkennen statt langer Arbeitszeit oder Ausgabemenge.",
            "Bei einer folgenreichen Entscheidung eine andere Person bitten, eine Annahme zu hinterfragen.",
          ],
        },
      },
    ],
  },
  {
    id: "mindset/5",
    moduleId: "mindset",
    lessonNumber: 5,
    number: 5,
    kind: "quiz",
    title: "Modul 1, Wissensprüfung",
    subtitle:
      "Drei Fragen zu Aufgabenauswahl, Kontrollstufen, Prüfung und Verantwortung.",
    objective:
      "Drei Fragen zu Aufgabenauswahl, Kontrollstufen, Prüfung und Verantwortung.",
    durationMinutes: 8,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-mindset-q1",
        questionText:
          "Nach einem falschen Ergebnis lehnt jemand im Team jede Modellunterstützung ab. Welche Antwort hilft am meisten?",
        answerOptions: [
          {
            id: "a",
            text: "Zustimmen: Für ernsthafte Arbeit taugen Modelle nicht.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Konkrete Aufgabe, Fehlerkosten und vorhandene Prüfkontrollen bewerten.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Ein neueres Modell nehmen, Arbeitsablauf unverändert.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Warten, bis Modelle keine Fehler mehr machen.",
            isCorrect: false,
          },
        ],
        explanation:
          "Ein Ergebnis belegt nichts über alle Aufgaben. Entscheide nach aufgabenspezifischen Nachweisen, Auswirkung und Erkennbarkeit eines Fehlers und den Kontrollen fürs Restrisiko.",
      },
      {
        id: "ano-mindset-q2",
        questionText:
          "Welche Praxis beschreibt L3, das orchestrierte Aufgabenportfolio, am besten?",
        answerOptions: [
          {
            id: "a",
            text: "Täglich automatische Codevervollständigung nutzen.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Jedes Dokument vom Modell vorentwerfen lassen.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Unabhängige Aufgaben getrennt und parallel ausführen, mit Freigabeschranken und benannten menschlichen Verantwortlichen.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Agenten unbegrenzten Zugriff geben, damit keine Aufsicht nötig ist.",
            isCorrect: false,
          },
        ],
        explanation:
          "L3 heißt begrenzte parallele Arbeit plus Trennung, Berechtigungen, Prüfkontrollen und eine Person, die jedes Ergebnis annimmt. Parallele Werkzeugnutzung ohne diese Kontrollen zählt nicht.",
      },
      {
        id: "ano-mindset-q3",
        questionText:
          "Eine erfahrene Person setzt eine Änderung allein über Nacht um. Was prüft die Führungskraft?",
        answerOptions: [
          {
            id: "a",
            text: "Ob der Einsatz öffentlich gelobt werden sollte.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Ob das Ergebnis korrekt, prüfbar und wartbar ist und auf einem wiederholbaren Verfahren beruht.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Ob sich beim nächsten Mal Modellnutzung vorschreiben lässt.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Nur, wie schnell die Änderung in Produktion war.",
            isCorrect: false,
          },
        ],
        explanation:
          "Weder Nachtschichten noch Modellnutzung sind ein Qualitätsmaß. Prüfe Ergebnis, Nachweise, Wartbarkeit, Betriebsrisiko und ob das Verfahren nachvollziehbar ist.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
