import canonical from "../cap-pacelc";
import { localizeDataInfraLessonToGerman } from "../../translate-lesson";

export default localizeDataInfraLessonToGerman(canonical, {
  title: "CAP, PACELC und Koordinationskosten",
  subtitle: "Partitionsverhalten und Zielkonflikte im Normalbetrieb",
  hook: "Zuerst das Fehlermodell benennen, dann Konsistenz- und Verfügbarkeitsverhalten je Vorgang wählen.",
  keyConcepts: [
    "CAP-Theorem",
    "PACELC-Modell",
    "Quorum",
    "Linearisierbarkeit",
    "Eventuelle Konsistenz",
  ],
  sections: [
    {
      id: "s1",
      title: "CAP präzise formuliert",
      content: `CAP gilt, wenn eine Netzwerkpartition Teile eines verteilten Systems an der Kommunikation hindert. Im Modell des Theorems kann das System für die betroffenen Vorgänge nicht gleichzeitig **linearisierbare Konsistenz** und **Verfügbarkeit jeder Anfrage an einen nicht ausgefallenen Knoten** garantieren.

Diese Definition ist enger als übliche Produktetiketten. Konsistenz bedeutet hier nicht allgemein „richtige Daten“ und Verfügbarkeit keine Uptime-Quote. Ein Entwurf kann bestimmte Vorgänge ablehnen oder verzögern, für andere veraltete Daten liefern oder unterschiedliche Regeln je Datensatz verwenden. Benenne Vorgang, Fehlermodell und sichtbares Client-Verhalten vor einem CAP-Etikett.`,
      keyTakeaway:
        "CAP beschreibt Verhalten während einer Kommunikationspartition; es bewertet keine Datenbanken und ersetzt keine Fehlerregel je Vorgang.",
    },
    {
      id: "s2",
      title: "Den Zielkonflikt wählen",
      content: `Das interaktive Modell stellt drei Replikate hinter einen Client und unterbricht danach ihre Kommunikation. Im vereinfachten **CP**-Zweig weist ein isoliertes Replikat Vorgänge ab, die die gewählte Konsistenzregel nicht erfüllen können. Im vereinfachten **AP**-Zweig akzeptieren erreichbare Replikate Vorgänge und können bis zum Abgleich auseinanderlaufen.

Das Modell simuliert weder ein Datenbankprotokoll noch gemessenes Ausfallverhalten. Eine Einzelknotendatenbank liegt außerhalb dieses replizierten Partitionsszenarios; sie hat andere Verfügbarkeits- und Dauerhaftigkeitsrisiken statt einer hilfreichen „CA“-Klassifikation.`,
    },
    {
      id: "s3",
      title: "Das PACELC-Modell",
      content: `PACELC ergänzt den Partitionsfall um eine Frage zum Normalbetrieb: **Welches Verfügbarkeits- oder Konsistenzverhalten gilt bei einer Partition; und wie wird sonst Koordinationslatenz gegen Konsistenz getauscht?**

Koordination über Knoten erzeugt Arbeit und mindestens einen Kommunikationspfad. Die tatsächlichen Kosten hängen von Topologie, Quorum-Platzierung, Last, Cache-Zustand und Fehlern ab; ein lokales Replikat ist nicht inhärent um eine feste Millisekundenzahl schneller. Manche Produkte bieten Konsistenzwahl je Anfrage oder Transaktion, andere je Tabelle, Sitzung oder Deployment.

PA/EL, PA/EC, PC/EL und PC/EC sind Kurzformen für diese Entscheidungen. Sie sind keine dauerhaften Herstellerklassen: Konfiguration und Vorgang können ein Deployment zwischen Verhaltensweisen verschieben.`,
    },
    {
      id: "s4",
      title: "Koordinationskosten",
      content: `Die Frontier-Grafik zeigt eine **beispielhafte Reihenfolge**, keinen Latenzbenchmark. Stärkere Garantien benötigen häufig mehr Koordination oder eingeschränkte Replikatwahl. Gemessene Latenz hängt jedoch von Umsetzung und Deployment ab.

- **Best effort**, kein benannter Freshness- oder Ordnungsvertrag.
- **Eventuelle Konsistenz**, Replikate sollen nach Ende der Schreibvorgänge konvergieren, ohne Grenze, sofern das System keine angibt.
- **Read-your-writes**, eine Client-Sitzung sieht ihre bestätigten Schreibvorgänge; andere Clients können ältere Versionen sehen.
- **Kausale Konsistenz**, Beobachtungen erhalten definierte kausale Beziehungen zwischen Vorgängen.
- **Linearisierbarkeit**, jeder Vorgang erscheint atomar zwischen Aufruf und Antwort. Implementierungen koordinieren Lese- und Schreibvorgänge, Leases oder Leader unterschiedlich.

Benchmarke das konfigurierte Deployment im Normal- und Störbetrieb. Leite keinen p99-Wert aus dem Namen eines Konsistenzmodells ab.`,
    },
    {
      id: "s5",
      title: "Die Konsistenzstufen",
      content: `„Konsistenz“ bezeichnet mehrere Verträge. Das Stufenmodell spielt einen synthetischen Wettlauf ab: Writer A schreibt \`x=1\` und danach \`x=2\`; Reader B liest \`x\`. Grün bedeutet, dass das dargestellte Ergebnis den für die Stufe definierten Vertrag erfüllt. Karmesin bedeutet, dass das vereinfachte Modell den veralteten Wert erlaubt.

Ersetze die Anforderung „konsistent“ durch eine beobachtbare Regel, etwa „eine Sitzung liest ihre bestätigten Schreibvorgänge“ oder „alle Clients sehen Bestandsabbuchungen in einer linearisierbaren Reihenfolge“. Prüfe dann Produkt und Konfiguration unter den genannten Fehlern.`,
      keyTakeaway:
        "Benenne die sichtbare Konsistenzregel und ihren Umfang; das Wort „konsistent“ allein ist kein Abnahmekriterium.",
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Drei Fragen zum gelesenen Abschnitt.",
    },
    {
      id: "s7",
      title: "Begriffe",
      content: `- **Quorum (N/R/W)**, Kurzform für Replikatanzahl, Leseantworten und Schreibbestätigungen. \`R + W > N\` erzeugt unter vereinfachten Annahmen Überschneidung; Konfliktbehandlung, ausgefallene Knoten, Sloppy Quorums und Bestätigungsregeln bestimmen weiterhin die Lesegarantie.
- **Sloppy Quorum**, temporäre Nicht-Heimreplikate können bei einem Fehler Schreibvorgänge annehmen und später übertragen. Verhalten ist produkt- und konfigurationsabhängig.
- **Read Repair**, ein Lesevorgang mit abweichenden Replikaten kann Abgleich auslösen. Das ist ein Reparaturmechanismus, kein vollständiger Konvergenznachweis.
- **Linearisierbarkeit**, jeder Vorgang erscheint atomar und respektiert Echtzeitordnung. Implementierungen können Leader, Leases, Konsens, Quorums oder andere Mechanismen verwenden.
- **Begrenzte Veraltung**, ein Vertrag begrenzt Versions- oder Zeitverzug. Grenze, Messpunkt und Verhalten bei Nichterfüllung müssen angegeben werden.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Eine typische Interviewfrage",
      question:
        "Du entwirfst einen replizierten Warenkorb. Während einer Partition akzeptiert das Produkt vorübergehende Abweichungen, damit erreichbare Regionen beschreibbar bleiben. Im Normalbetrieb verlangt es abgestimmten Warenkorbzustand über Geräte. Welche PACELC-Kurzform beschreibt diese Regel?",
      options: [
        "PA/EL, durchgehend schnell und ohne strenge Abstimmung.",
        "PC/EC, durchgehend starke Konsistenz; die Latenz ist hinnehmbar.",
        "PA/EC, starke Konsistenz im Normalbetrieb und Verfügbarkeit während einer Partition.",
        "PC/EL, starke Konsistenz während einer Partition und sonst niedrige Latenz.",
      ],
      explanation:
        "PA/EC passt zur benannten Regel: während der Partition verfügbar bleiben und im Normalbetrieb für Konsistenz koordinieren. Das Etikett wählt kein Produkt und beweist nicht das Merge-Verhalten; dafür braucht es eine Konfliktregel und Tests.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: 'Die Falle im Begriff "eventuell"',
      question:
        'Eine Junior-Fachkraft sagt: "Wir haben Cassandra gewählt, weil wir eventuelle Konsistenz brauchen." Welche Frage musst du stellen?',
      options: [
        '"Wie lange dauert eventuell?" Eventuelle Konsistenz beschreibt den Endzustand, nicht den Zeitrahmen.',
        '"Wie hoch ist euer Replikationsfaktor?"',
        '"Meint ihr nicht eigentlich starke Konsistenz?"',
        '"Warum nicht Postgres?"',
      ],
      explanation:
        "Eventuelle Konsistenz beschreibt Konvergenz unter Annahmen wie endenden Schreibvorgängen; sie enthält keine Zeitgrenze. Messe Konvergenz unter erwarteter Last und Fehlern, definiere Client-Verhalten während der Abweichung und ergänze nur bei Produktbedarf eine stärkere Sitzungsgarantie.",
    },
    {
      kind: "quiz",
      cpId: "q3",
      title: "Die Fangfrage",
      question:
        'Warum gilt "CA", Konsistenz plus Verfügbarkeit ohne Partitionstoleranz, bei verteilten Systemen meist als Scheinwahl?',
      options: [
        "Weil Konsistenz und Verfügbarkeit sich grundsätzlich widersprechen.",
        "Weil nicht festgelegt ist, was das replizierte System tut, wenn nicht ausgefallene Knoten nicht miteinander kommunizieren können.",
        "Weil das CAP-Theorem für moderne Systeme nicht gilt.",
        "Weil CA-Systeme immer langsam sind.",
      ],
      explanation:
        "Ein replizierter Entwurf braucht Verhalten für fehlende Kommunikation. Er kann ausgewählte Vorgänge ablehnen, veralteten Zustand liefern, geschlossen ausfallen oder eine andere Regel verwenden. „CA“ lässt dieses Verhalten offen, statt es zu entwerfen.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Quorum",
          q: "Wofür stehen N/R/W?",
          a: "N bezeichnet Replikate, R Leseantworten und W Schreibbestätigungen. R + W > N erzeugt im vereinfachten Modell Überschneidung; Protokoll- und Fehlerannahmen bestimmen die tatsächliche Garantie.",
        },
        {
          term: "Sloppy Quorum",
          q: 'Was bedeutet "sloppy"?',
          a: "Bei einem Fehler kann ein System Schreibvorgänge auf temporären Nicht-Heimreplikaten annehmen und später übertragen. Konfiguration und Konfliktbehandlung bestimmen die Garantien.",
        },
        {
          term: "Read Repair",
          q: "Wie gleichen sich Replikate bei eventueller Konsistenz an?",
          a: "Ein Lesevorgang mit abweichenden Replikaten kann Abgleich auslösen. Hintergrund-Anti-Entropy kann einen weiteren Reparaturpfad bieten; Versionsordnung und Konflikte bleiben zu definieren.",
        },
        {
          term: "Linearisierbarkeit",
          q: "Warum ist sie teuer?",
          a: "Jeder Lesezugriff muss global mindestens den Stand eines bestätigten Schreibvorgangs liefern. Über mehrere Regionen erfordert das jedes Mal ein Quorum und damit eine Netzwerkrunde über große Entfernung.",
        },
        {
          term: "Begrenzte Veraltung",
          q: "Ein brauchbarer Mittelweg",
          a: "Ein Vertrag begrenzt Zeit- oder Versionsverzug. Benenne Messpunkt und Verhalten, wenn das System die Grenze nicht einhalten kann.",
        },
      ],
    },
  ],
  preserve: ["Quorum"],
});
