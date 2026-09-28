import type { AiNativeOperatorLesson } from "../../types";

export const MINDSET_LESSONS_DE: readonly AiNativeOperatorLesson[] = [
  {
    id: "mindset/1",
    moduleId: "mindset",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Erst die Aufgabe wählen, dann das Werkzeug",
    subtitle: "Prüfe vor dem Delegieren, ob die Aufgabe zu einem Modell passt.",
    objective: "Prüfe vor dem Delegieren, ob die Aufgabe zu einem Modell passt.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Beim Ergebnis anfangen",
        readTimeMinutes: 1,
        content:
          "Kläre Ergebnis, erlaubte Fehlerquote und wer für Fehler geradesteht. Ein Modell lohnt sich, wenn es Aufwand spart, ohne eins der drei zu schwächen.",
      },
      {
        id: "s2",
        title: "Guter Kandidat, schlechter Kandidat",
        readTimeMinutes: 1,
        content:
          "Ein guter erster Kandidat hat klare Eingaben, ein sichtbares Ergebnis und eine Prüfung, die weniger kostet als Handarbeit. Ein schlechter hat unklare Befugnis, unumkehrbare Folgen, sensible Daten ohne freigegebenen Schutz oder ein unprüfbares Ergebnis. Mit engeren Vorgaben oder mehr Schutz kann eine Aufgabe die Seite wechseln.",
      },
      {
        id: "s3",
        title: "Erst klein delegieren",
        readTimeMinutes: 1,
        content:
          "Gib dem Modell eine enge Aufgabe, eine Abbruchbedingung und klare Vorgaben. Entscheidungen, Freigaben und Außenwirkung bleiben bei einer benannten Person, bis echte Ausgaben und Fehlerfälle zeigen, dass die Kontrollen greifen.",
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
            "Nimm drei Aufgaben dieser Woche, die über 30 Minuten dauerten. Notiere Ergebnis, Fehlerkosten und einen begrenzten Teil, den du gefahrlos delegieren kannst.",
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
      "Bewerte, wie du modellgestützte Arbeit definierst, prüfst und steuerst.",
    objective:
      "Bewerte, wie du modellgestützte Arbeit definierst, prüfst und steuerst.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "L0, Ungeprüft",
        readTimeMinutes: 1,
        content:
          "Alles läuft von Hand, und niemand hat geprüft, wo ein Modell helfen würde. Für eine Aufgabe kann das richtig sein, wenn Risiko und Kosten es begründen.",
      },
      {
        id: "s2",
        title: "L1, Unterstützt",
        readTimeMinutes: 1,
        content:
          "Eine Person nutzt ein Modell für begrenzte Entwürfe, Zusammenfassungen oder Umformungen und prüft das Ergebnis vor der Nutzung. Die Praxis gehört ihr und ist im Team nicht wiederholbar.",
      },
      {
        id: "s3",
        title: "L2, Kontrollierter Arbeitsablauf",
        readTimeMinutes: 1,
        content:
          "Wiederkehrende Aufgaben haben Spezifikation, freigegebenen Kontext, Prüfkriterien und klare Prüfverantwortung. Modellergebnisse durchlaufen die üblichen technischen und betrieblichen Kontrollen, und erfasste Fehler ändern den Ablauf.",
      },
      {
        id: "s4",
        title: "L3, Orchestriertes Aufgabenportfolio",
        readTimeMinutes: 1,
        content:
          "Unabhängige Aufgaben laufen parallel in getrennten Arbeitsbereichen mit klaren Berechtigungen, Freigabeschranken und benannter Verantwortung, wo die Abhängigkeiten verstanden sind. Eine Person nimmt jedes Ergebnis an, lehnt es ab oder gibt es frei.",
      },
    ],
    callout: {
      kind: "note",
      h: "Kontrollen bewerten",
      text: "Häufige Modellnutzung belegt keinen Reifegrad. Zähl wiederholbare Spezifikationen, Prüfnachweise, Vorfallbehandlung und klare Verantwortung, und bewerte unterschiedliche Aufgabenfamilien einzeln.",
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
            "Bewerte deine heutige Arbeitsweise an zuletzt erledigten Aufgaben. Geplante Änderungen zählen nicht.",
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
      "Richte die Prüftiefe nach Wahrscheinlichkeit, Kosten und Erkennbarkeit eines Fehlers.",
    objective:
      "Richte die Prüftiefe nach Wahrscheinlichkeit, Kosten und Erkennbarkeit eines Fehlers.",
    durationMinutes: 10,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Vertrauen gilt für eine Aufgabe",
        readTimeMinutes: 1,
        content:
          "Ein Nachweis über ein Modell gilt für eine Aufgabe, Modellversion, Eingabe, Kontextquelle, Werkzeugausstattung und Prüfmethode. Ändert sich eins davon, sagt das alte Ergebnis nichts mehr.",
      },
      {
        id: "s2",
        title: "Fehlerkosten systematisch bewerten",
        readTimeMinutes: 1,
        content:
          "Schätze, wie wahrscheinlich ein Fehler ist, was er kostet und ob die Prüferin ihn sieht. Ein umkehrbarer interner Entwurf braucht vielleicht eine Durchsicht; eine Sicherheitsänderung, Kundenentscheidung, Finanzkennzahl oder Offenlegung kann Quellenprüfung, Tests, eine zweite Person oder kein Modell verlangen.",
      },
      {
        id: "s3",
        title: "Nachweise aus geprüften Fällen aufbauen",
        readTimeMinutes: 1,
        content:
          "Fang dort an, wo es eine verlässliche Referenz oder einen Test gibt. Vergleiche die Ausgaben, benenne Fehlerarten, halte Bedingungen fest und prüf die Stichprobe nach jeder Änderung an Modell, Eingabe, Daten oder Werkzeugen erneut.",
      },
    ],
    callout: {
      kind: "warn",
      h: "Die Verantwortung bleibt beim Menschen",
      text: "Auch eine überzeugend klingende Ausgabe und eine erfahrene Prüferin können einen Fehler durchlassen. Die benannte Person führt die Kontrollen durch, die das Restrisiko verlangt, und kann begründen, warum sie das Ergebnis abgenommen hat.",
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
            "Lege je Aufgabenart die Mindestprüfung fest. Ist ein Fehler teuer oder schwer erkennbar, nimm eine Stufe höher.",
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
    title: "Zuverlässige, wiederholbare Arbeit belohnen",
    subtitle:
      "Erkenne Verantwortung, wiederholbare Arbeit und kontrollierte Ergebnisse an.",
    objective:
      "Erkenne Verantwortung, wiederholbare Arbeit und kontrollierte Ergebnisse an.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Ergebnis und Nachweise bewerten",
        readTimeMinutes: 1,
        content:
          "Arbeitsstunden, Codezeilen und Modellnutzung sagen nichts über Korrektheit, Wartbarkeit oder Nutzen. Bewerte Ergebnis, Nachweise, Betriebskosten und ob jemand anderes das Verfahren wiederholen kann.",
      },
      {
        id: "s2",
        title: "Teamwirksame Kontrollen anerkennen",
        readTimeMinutes: 1,
        content:
          "Lobe, wer Spezifikationen klärt, Regressionstests ergänzt, Fehlerarten dokumentiert, unnötige Schritte streicht oder unsichere Arbeit stoppt. Prüf Qualität, Belastung und Folgerisiken, bevor du Stellenabbau oder Ausgabemenge belohnst.",
      },
      {
        id: "s3",
        title: "Erfahrung an Prüfgrenzen einsetzen",
        readTimeMinutes: 1,
        content:
          "Erfahrene Leute kennen Domäne, Architektur und unauffällige Fehler. Lass sie Vorgaben setzen, Ausnahmen prüfen und anderen das Bewerten beibringen; über die Abnahme entscheidet die verantwortliche Person.",
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
    durationMinutes: 4,
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
            text: "Aufgabe, Fehlerkosten und vorhandene Prüfkontrollen bewerten.",
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
          "Ein einzelnes Ergebnis sagt nichts über die Zuverlässigkeit bei anderen Aufgaben. Entscheide nach aufgabenspezifischen Nachweisen, Kosten und Erkennbarkeit eines Fehlers und den Kontrollen fürs Restrisiko.",
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
            text: "Getrennte parallele Aufgaben mit Freigabeschranken und benannten Verantwortlichen.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Agenten unbegrenzten Zugriff geben, damit keine Aufsicht nötig ist.",
            isCorrect: false,
          },
        ],
        explanation:
          "L3 ist begrenzte parallele Arbeit mit Trennung, Berechtigungen, Prüfkontrollen und einer Person, die jedes Ergebnis annimmt. Parallele Werkzeugnutzung ohne diese Kontrollen zählt nicht.",
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
            text: "Ob das Ergebnis korrekt, prüfbar, wartbar und wiederholbar ist.",
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
          "Weder Nachtschichten noch Modellnutzung messen Qualität. Prüfe Ergebnis, Nachweise, Wartbarkeit, Betriebsrisiko und ob andere das Verfahren wiederholen können.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
