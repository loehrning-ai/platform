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
      content: `Das Netzwerk reißt. Zwei Teile deines Systems laufen weiter, erreichen einander aber nicht mehr. Erst jetzt gilt CAP: Für die betroffenen Vorgänge kann das System nicht zugleich **linearisierbare Konsistenz** und **Verfügbarkeit jeder Anfrage an einen nicht ausgefallenen Knoten** garantieren.

Das ist enger als jedes Produktetikett. Konsistenz heißt hier nicht „richtige Daten“, Verfügbarkeit nicht Uptime-Quote. Ein Entwurf darf Vorgänge ablehnen oder verzögern, veraltete Daten liefern oder je Datensatz anders entscheiden. Vor jedem CAP-Etikett kommen Vorgang, Fehlermodell und sichtbares Client-Verhalten.`,
      keyTakeaway:
        "CAP beschreibt Verhalten während einer Partition. Es bewertet keine Datenbanken und ersetzt keine Fehlerregel je Vorgang.",
    },
    {
      id: "s2",
      title: "Den Zielkonflikt wählen",
      content: `Drei Replikate, ein Client, dann die Trennung: So läuft das interaktive Modell. Im vereinfachten **CP**-Zweig weist ein isoliertes Replikat Vorgänge ab, die die gewählte Konsistenzregel nicht mehr deckt. Im vereinfachten **AP**-Zweig nehmen erreichbare Replikate weiter an und können bis zum Abgleich auseinanderlaufen.

Weder simuliert das ein Datenbankprotokoll noch gemessenes Ausfallverhalten. Und die Einzelknotendatenbank? Sie steht außerhalb dieses Szenarios, mit eigenen Verfügbarkeits- und Dauerhaftigkeitsrisiken und ohne brauchbares „CA“-Etikett.`,
    },
    {
      id: "s3",
      title: "Das PACELC-Modell",
      content: `CAP redet nur über den Fehlerfall. PACELC fragt auch nach dem Rest der Zeit: **Verfügbarkeit oder Konsistenz bei einer Partition; und sonst Koordinationslatenz oder Konsistenz?**

Koordination über Knoten kostet Arbeit und mindestens einen Netzwerkweg. Wie viel, entscheiden Topologie, Quorum-Platzierung, Last, Cache-Zustand und Fehler; ein lokales Replikat ist nicht von Natur aus um feste Millisekunden schneller. Manche Produkte lassen dich je Anfrage oder Transaktion wählen, andere je Tabelle, Sitzung oder Deployment.

PA/EL, PA/EC, PC/EL und PC/EC sind Kurzformen dafür, keine Herstellerklassen fürs Leben. Konfiguration und Vorgang können ein Deployment von einem Verhalten ins andere schieben.`,
    },
    {
      id: "s4",
      title: "Koordinationskosten",
      content: `Die Frontier-Grafik zeigt eine **beispielhafte Reihenfolge**, keinen Latenzbenchmark. Stärkere Garantien verlangen meist mehr Koordination oder weniger freie Replikatwahl; was das kostet, entscheiden Umsetzung und Deployment.

- **Best effort**, kein benannter Freshness- oder Ordnungsvertrag.
- **Eventuelle Konsistenz**, Replikate sollen konvergieren, sobald die Schreibvorgänge enden. Eine Zeitgrenze nennt nur das System selbst.
- **Read-your-writes**, eine Sitzung sieht ihre bestätigten Schreibvorgänge. Andere Clients können ältere Versionen sehen.
- **Kausale Konsistenz**, definierte kausale Beziehungen zwischen Vorgängen bleiben erhalten.
- **Linearisierbarkeit**, jeder Vorgang wirkt atomar zwischen Aufruf und Antwort. Implementierungen koordinieren Lese- und Schreibvorgänge, Leases oder Leader unterschiedlich.

Benchmarke das konfigurierte Deployment, im Normalbetrieb und unter Störung. Ein p99 steht in keinem Modellnamen.`,
    },
    {
      id: "s5",
      title: "Die Konsistenzstufen",
      content: `„Konsistenz“ ist ein Sammelbegriff für mehrere Verträge. Das Stufenmodell spielt einen synthetischen Wettlauf ab: Writer A schreibt \`x=1\`, dann \`x=2\`; Reader B liest \`x\`. Grün heißt, das gezeigte Ergebnis erfüllt den Vertrag der Stufe. Karmesin heißt, das vereinfachte Modell lässt den veralteten Wert durch.

Ersetz „konsistent“ in der Anforderung durch eine beobachtbare Regel, etwa „eine Sitzung liest ihre bestätigten Schreibvorgänge“ oder „alle Clients sehen Bestandsabbuchungen in linearisierbarer Reihenfolge“. Dann prüfst du Produkt und Konfiguration unter genau diesen Fehlern.`,
      keyTakeaway:
        "Benenne die sichtbare Konsistenzregel und ihren Umfang. „Konsistent“ allein ist kein Abnahmekriterium.",
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Drei Fragen zu CAP und PACELC.",
    },
    {
      id: "s7",
      title: "Begriffe",
      content: `- **Quorum (N/R/W)**, Kurzform für Replikate, Leseantworten und Schreibbestätigungen. \`R + W > N\` erzwingt unter vereinfachten Annahmen eine Überschneidung. Die Lesegarantie hängt trotzdem an Konfliktbehandlung, ausgefallenen Knoten, Sloppy Quorums und Bestätigungsregeln.
- **Sloppy Quorum**, im Fehlerfall nehmen vorübergehend fremde Replikate Schreibvorgänge an und reichen sie später weiter. Produkt und Konfiguration entscheiden das Verhalten.
- **Read Repair**, ein Lesevorgang, der abweichende Replikate sieht, kann den Abgleich anstoßen. Ein Reparaturmechanismus, kein Konvergenzbeweis.
- **Linearisierbarkeit**, jeder Vorgang wirkt atomar und respektiert die Echtzeitordnung. Dahinter können Leader, Leases, Konsens, Quorums oder andere Mechanismen stehen.
- **Begrenzte Veraltung**, ein Vertrag deckelt den Verzug in Versionen oder Zeit. Grenze, Messpunkt und Verhalten bei Verletzung gehören dazu.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Eine typische Interviewfrage",
      question:
        "Du entwirfst einen replizierten Warenkorb. Während einer Partition nimmt das Produkt vorübergehende Abweichungen hin, damit erreichbare Regionen beschreibbar bleiben. Im Normalbetrieb verlangt es abgestimmten Warenkorbzustand über Geräte. Welche PACELC-Kurzform beschreibt diese Regel?",
      options: [
        "PA/EL, durchgehend schnell und ohne strenge Abstimmung.",
        "PC/EC, durchgehend starke Konsistenz, die Latenz nimmt man hin.",
        "PA/EC, starke Konsistenz im Normalbetrieb und Verfügbarkeit während einer Partition.",
        "PC/EL, starke Konsistenz während einer Partition und sonst niedrige Latenz.",
      ],
      explanation:
        "PA/EC trifft die Regel: während der Partition verfügbar bleiben, im Normalbetrieb für Konsistenz koordinieren. Mehr sagt das Etikett nicht. Es wählt kein Produkt und beweist kein Merge-Verhalten; dafür brauchst du Konfliktregel und Tests.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: 'Die Falle im Begriff "eventuell"',
      question:
        'Ein Junior-Engineer sagt: "Wir haben Cassandra gewählt, weil wir eventuelle Konsistenz brauchen." Welche Frage stellst du?',
      options: [
        '"Wie lange dauert eventuell?" Eventuelle Konsistenz beschreibt den Endzustand, nicht den Zeitrahmen.',
        '"Wie hoch ist euer Replikationsfaktor?"',
        '"Meint ihr nicht in Wahrheit starke Konsistenz?"',
        '"Warum nicht Postgres?"',
      ],
      explanation:
        "Eventuelle Konsistenz verspricht Konvergenz, sobald die Schreibvorgänge enden. Eine Zeitgrenze verspricht sie nicht. Miss Konvergenz unter erwarteter Last und Fehlern, definiere das Client-Verhalten während der Abweichung und ergänze eine stärkere Sitzungsgarantie nur bei Produktbedarf.",
    },
    {
      kind: "quiz",
      cpId: "q3",
      title: "Die Fangfrage",
      question:
        'Warum gilt "CA", Konsistenz plus Verfügbarkeit ohne Partitionstoleranz, bei verteilten Systemen meist als Scheinwahl?',
      options: [
        "Weil Konsistenz und Verfügbarkeit einander von Natur aus ausschließen.",
        "Weil offen bleibt, was das replizierte System tut, wenn nicht ausgefallene Knoten einander nicht mehr erreichen.",
        "Weil das CAP-Theorem für moderne Systeme nicht gilt.",
        "Weil CA-Systeme immer langsam sind.",
      ],
      explanation:
        "Ein replizierter Entwurf braucht eine Antwort auf fehlende Kommunikation. Er kann Vorgänge ablehnen, veralteten Zustand liefern, geschlossen ausfallen oder eine andere Regel fahren. „CA“ lässt die Frage liegen.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Quorum",
          q: "Wofür stehen N/R/W?",
          a: "N sind Replikate, R Leseantworten, W Schreibbestätigungen. R + W > N erzwingt im vereinfachten Modell eine Überschneidung. Die echte Garantie hängt an Protokoll und Fehlerannahmen.",
        },
        {
          term: "Sloppy Quorum",
          q: 'Was bedeutet "sloppy"?',
          a: "Im Fehlerfall darf ein System Schreibvorgänge auf vorübergehend fremden Replikaten annehmen und später weiterreichen. Konfiguration und Konfliktbehandlung bestimmen die Garantien.",
        },
        {
          term: "Read Repair",
          q: "Wie gleichen sich Replikate bei eventueller Konsistenz an?",
          a: "Ein Lesevorgang mit abweichenden Replikaten kann den Abgleich anstoßen. Anti-Entropy im Hintergrund ist ein zweiter Reparaturpfad. Versionsordnung und Konflikte definierst du trotzdem.",
        },
        {
          term: "Linearisierbarkeit",
          q: "Warum ist sie teuer?",
          a: "Jeder Vorgang muss atomar wirken und die Echtzeitordnung respektieren. Leader, Leases, Konsens oder Quorums setzen das um; Koordinationspfad und gemessene Kosten hängen vom Entwurf ab.",
        },
        {
          term: "Begrenzte Veraltung",
          q: "Ein brauchbarer Mittelweg",
          a: "Ein Vertrag deckelt den Verzug in Zeit oder Versionen. Benenne Messpunkt und Verhalten, wenn das System die Grenze reißt.",
        },
      ],
    },
  ],
  preserve: ["Quorum"],
});
