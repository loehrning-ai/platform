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
      content: `CAP gilt, sobald eine Netzwerkpartition Teile eines verteilten Systems voneinander trennt. Für die betroffenen Vorgänge kann das System dann nicht zugleich **linearisierbare Konsistenz** und **Verfügbarkeit jeder Anfrage an einen nicht ausgefallenen Knoten** garantieren.

Konsistenz heißt hier nicht „richtige Daten“, Verfügbarkeit ist keine Uptime-Quote. Ein Entwurf darf manche Vorgänge ablehnen oder verzögern, für andere veraltete Daten liefern oder Datensätze unterschiedlich behandeln. Benenne Vorgang, Fehlermodell und sichtbares Client-Verhalten, bevor du ein CAP-Etikett nutzt.`,
    },
    {
      id: "s2",
      title: "Den Zielkonflikt wählen",
      content: `Das Modell stellt drei Replikate hinter einen Client und trennt dann ihre Verbindung. Im vereinfachten **CP**-Zweig weist ein isoliertes Replikat Vorgänge ab, die seine Konsistenzregel nicht mehr deckt. Im **AP**-Zweig nehmen erreichbare Replikate weiter an und können bis zum Abgleich auseinanderlaufen.

Es simuliert kein echtes Protokoll und kein gemessenes Ausfallverhalten. Eine Einzelknotendatenbank steht außerhalb dieses Szenarios, mit eigenen Verfügbarkeits- und Dauerhaftigkeitsrisiken; „CA“ beschreibt sie nicht brauchbar.`,
    },
    {
      id: "s3",
      title: "Das PACELC-Modell",
      content: `PACELC ergänzt CAP um den Normalbetrieb: **Verfügbarkeit oder Konsistenz bei einer Partition; und sonst Koordinationslatenz oder Konsistenz?**

Koordination über Knoten kostet Arbeit und mindestens einen Netzwerkweg. Wie viel, entscheiden Topologie, Quorum-Platzierung, Last, Cache-Zustand und Fehler; ein lokales Replikat ist nicht um feste Millisekunden schneller. Manche Produkte lassen dich je Anfrage oder Transaktion wählen, andere je Tabelle, Sitzung oder Deployment.

PA/EL, PA/EC, PC/EL und PC/EC sind Kurzformen für diese Wahl. Konfiguration und Vorgang können ein Deployment von einer in die andere schieben.`,
    },
    {
      id: "s4",
      title: "Koordinationskosten",
      content: `Die Frontier-Grafik zeigt eine **beispielhafte Reihenfolge**, keinen Benchmark. Stärkere Garantien verlangen meist mehr Koordination oder weniger freie Replikatwahl; was das kostet, entscheiden Umsetzung und Deployment.

- **Best effort**, kein Freshness- oder Ordnungsvertrag.
- **Eventuelle Konsistenz**, Replikate konvergieren, sobald die Schreibvorgänge enden, ohne Zeitgrenze, außer das System nennt eine.
- **Read-your-writes**, eine Sitzung sieht ihre eigenen bestätigten Schreibvorgänge; andere Clients können ältere Versionen sehen.
- **Kausale Konsistenz**, definierte kausale Beziehungen zwischen Vorgängen bleiben erhalten.
- **Linearisierbarkeit**, jeder Vorgang wirkt atomar zwischen Aufruf und Antwort.

Benchmarke das konfigurierte Deployment im Normalbetrieb und unter Störung. Kein Modellname verrät dir das p99.`,
    },
    {
      id: "s5",
      title: "Die Konsistenzstufen",
      content: `„Konsistenz“ benennt mehrere Verträge. Die Stufen spielen einen synthetischen Wettlauf ab: Writer A schreibt \`x=1\`, dann \`x=2\`; Reader B liest \`x\`. Grün heißt, das Ergebnis erfüllt den Vertrag der Stufe; Karmesin heißt, das vereinfachte Modell lässt den veralteten Wert zu.

Ersetz „konsistent“ in einer Anforderung durch eine beobachtbare Regel, etwa „eine Sitzung liest ihre bestätigten Schreibvorgänge“ oder „alle Clients sehen Bestandsabbuchungen in einer linearisierbaren Reihenfolge“. Dann prüfst du Produkt und Konfiguration gegen diese Regel unter den genannten Fehlern.`,
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Drei Fragen zu CAP und PACELC.",
    },
    {
      id: "s7",
      title: "Begriffe",
      content: `- **Quorum (N/R/W)**, Replikatzahl, Leseantworten und Schreibbestätigungen. \`R + W > N\` erzwingt unter vereinfachten Annahmen eine Überschneidung.
- **Sloppy Quorum**, vorübergehende Replikate nehmen im Fehlerfall Schreibvorgänge an und reichen sie später weiter.
- **Read Repair**, ein Lesevorgang, der abweichende Replikate sieht, stößt den Abgleich an.
- **Begrenzte Veraltung**, ein Vertrag, der den Verzug in Versionen oder Zeit deckelt.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Eine typische Interviewfrage",
      question:
        "Ein replizierter Warenkorb nimmt während einer Partition Abweichungen hin, damit erreichbare Regionen beschreibbar bleiben. Normal verlangt er abgestimmten Zustand über Geräte. Welche PACELC-Kurzform passt?",
      options: [
        "PA/EL, verfügbar bei Partition, sonst niedrige Latenz.",
        "PC/EC, Schreibvorgänge bei Partition ablehnen, sonst koordinieren.",
        "PA/EC, verfügbar bei Partition, sonst konsistent.",
        "PC/EL, konsistent bei Partition, sonst niedrige Latenz.",
      ],
      explanation:
        "Der Warenkorb bleibt während der Partition verfügbar und koordiniert im Normalbetrieb, also PA/EC. Über das Merge-Verhalten sagt das Etikett nichts; dafür brauchst du Konfliktregel und Tests.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: '"Eventuell" braucht eine Grenze',
      question:
        'Ein Entwurf sagt nur: "Die Replikate sind eventuell konsistent." Welche Frage ist noch offen?',
      options: [
        '"Wie lange dauert die Konvergenz, und was sehen Clients solange?"',
        '"Wie hoch ist euer Replikationsfaktor je Region?"',
        '"Meint ihr nicht in Wahrheit starke Konsistenz?"',
        '"Warum nehmt ihr nicht einfach Postgres?"',
      ],
      explanation:
        "Eventuelle Konsistenz verspricht Konvergenz, sobald die Schreibvorgänge enden, ohne Zeitgrenze. Miss die Konvergenz unter Last und Fehlern, definiere, was Clients solange sehen, und ergänze Sitzungsgarantien nur bei Bedarf.",
    },
    {
      kind: "quiz",
      cpId: "q3",
      title: "Die Fangfrage",
      question:
        'Warum ist "CA" für ein repliziertes System, dessen Knoten die Verbindung verlieren können, meist eine unbrauchbare Kurzform?',
      options: [
        "Konsistenz und Verfügbarkeit schließen einander per Definition aus.",
        "Offen bleibt, was passiert, wenn gesunde Knoten einander nicht erreichen.",
        "CAP gilt für moderne Systeme nicht.",
        "CA-Systeme nutzen nur langsame Netze.",
      ],
      explanation:
        "Ein replizierter Entwurf muss festlegen, was bei fehlender Kommunikation passiert: Vorgänge ablehnen, veralteten Zustand liefern, geschlossen ausfallen oder anderes. „CA“ überspringt diese Entscheidung.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Quorum",
          q: "Wofür stehen N/R/W?",
          a: "Replikationsfaktor (N), Leseantworten (R), Schreibbestätigungen (W). R + W > N erzwingt im vereinfachten Modell eine Überschneidung; Konfliktbehandlung, ausgefallene Knoten und Protokollregeln bestimmen die echte Garantie.",
        },
        {
          term: "Sloppy Quorum",
          q: 'Was bedeutet "sloppy"?',
          a: "Im Fehlerfall nehmen vorübergehende Replikate Schreibvorgänge an und reichen sie später weiter. Konfiguration und Konfliktbehandlung bestimmen die Garantien.",
        },
        {
          term: "Read Repair",
          q: "Wie gleichen sich Replikate bei eventueller Konsistenz an?",
          a: "Ein Lesevorgang, der abweichende Replikate sieht, stößt den Abgleich an, und Anti-Entropy im Hintergrund ist ein zweiter Pfad. Versionsordnung und Konflikte definierst du trotzdem.",
        },
        {
          term: "Linearisierbarkeit",
          q: "Warum ist sie teuer?",
          a: "Jeder Vorgang muss atomar wirken und die Echtzeitordnung respektieren, über Leader, Leases, Konsens oder Quorums. Diese Koordination kostet Latenz.",
        },
        {
          term: "Begrenzte Veraltung",
          q: "Ein brauchbarer Mittelweg",
          a: "Ein Vertrag, der den Verzug in Zeit oder Versionen deckelt. Benenne Messpunkt und Verhalten, wenn die Grenze reißt.",
        },
      ],
    },
  ],
  preserve: ["Quorum"],
});
