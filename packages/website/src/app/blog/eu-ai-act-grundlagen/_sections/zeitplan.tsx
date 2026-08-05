import type { CSSProperties } from "react";

interface TimelineStep {
  readonly num: string;
  readonly date: string;
  readonly title: string;
  readonly body: string;
}

const STEPS: readonly TimelineStep[] = [
  {
    num: "01",
    date: "1. Aug 2024",
    title: "In Kraft, noch ohne Pflichten",
    body:
      "Die Verordnung tritt zwanzig Tage nach der Veröffentlichung im Amtsblatt (12. Juli 2024) in Kraft. Ab jetzt läuft die Uhr für alle folgenden Stufen. (Quelle: Art. 113, Reg. 2024/1689)",
  },
  {
    num: "02",
    date: "2. Feb 2025",
    title: "Verbote und KI-Kompetenz",
    body:
      "Kapitel I und II gelten: die verbotenen Praktiken aus Art. 5 und die Schulungspflicht aus Art. 4. Beides ist seit diesem Datum geltendes Recht. (Quelle: Art. 113 lit. a, Reg. 2024/1689)",
  },
  {
    num: "03",
    date: "2. Aug 2025",
    title: "GPAI, Governance, Bußgeldrahmen",
    body:
      "Die Pflichten für Anbieter großer KI-Modelle (Art. 51 bis 56), die Behördenstruktur mit dem EU AI Office und der allgemeine Sanktionsrahmen (Art. 99) werden anwendbar. (Quelle: Art. 113 lit. b, Reg. 2024/1689)",
  },
  {
    num: "04",
    date: "2. Aug 2026",
    title: "Allgemeiner Anwendungsbeginn",
    body:
      "Die Transparenzpflichten aus Art. 50, das Beschwerderecht aus Art. 85 und das Erklärungsrecht aus Art. 86 werden anwendbar. Die Mitgliedstaaten müssen ihre Marktüberwachung benannt haben, und die Kommission kann die GPAI-Pflichten durchsetzen. Dieses Datum steht unverändert im Gesetz. (Quelle: Art. 113, Reg. 2024/1689)",
  },
  {
    num: "05",
    date: "Dez 2027 / Aug 2028",
    title: "Hochrisiko, verbindlich verschoben",
    body:
      "Die Verordnung (EU) 2026/1744 setzt die Hochrisiko-Termine neu: 2. Dezember 2027 für eigenständige Anhang-III-Systeme, 2. August 2028 für produktintegrierte Systeme. Sie wurde am 24. Juli 2026 veröffentlicht und trat am 27. Juli 2026 in Kraft. (Quelle: ABl. L, 2026/1744)",
  },
];

export function Zeitplan() {
  return (
    <section className="section" id="zeitplan">
      <div className="kicker">
        <span className="kicker__num">03</span>Zeitplan
        <span className="kicker__line" />
      </div>
      <h2 className="heading">
        Was schon gilt und was <span className="em">ab dem 2. August 2026</span> gilt.
      </h2>
      <p className="dek">
        Art. 113 staffelt die Anwendung über mehrere Jahre. Der 2. August
        2026 ist ein wichtiger Stichtag, aber weder Anfang noch Ende.
      </p>

      <div className="pipeline">
        {STEPS.map((step, i) => (
          <div
            key={step.num}
            className="pipeline__step"
            style={{ "--i": i } as CSSProperties}
          >
            <div className="pipeline__num">{step.num}</div>
            <div className="pipeline__body">
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
            <div className="pipeline__budget">{step.date}</div>
          </div>
        ))}
      </div>

      <div className="premise" style={{ marginTop: 48 }}>
        <div className="premise__body">
          <p>
            Zur Einordnung der Sanktionen: Verstöße gegen die Verbote aus
            Art. 5 können bis zu 35 Mio. EUR oder 7 Prozent des weltweiten
            Jahresumsatzes kosten, je nachdem, welcher Betrag höher ist. Für
            die meisten übrigen Pflichten, darunter die Transparenzregeln
            aus Art. 50, liegt die Obergrenze bei 15 Mio. EUR oder
            3 Prozent. Falsche Angaben gegenüber Behörden kosten bis zu
            7,5 Mio. EUR oder 1 Prozent. Für kleine und mittlere Unternehmen
            gilt jeweils der niedrigere der beiden Werte. (Quelle: EU AI Act
            Art. 99 Abs. 3 bis 6, Reg. 2024/1689)
          </p>
        </div>
        <aside className="premise__stats">
          <div className="margin-note">
            <b>Art. 99 · Bußgeldrahmen</b>
            35 Mio. EUR / 7% bei Verbotenem.
            15 Mio. EUR / 3% bei den meisten Pflichten.
            7,5 Mio. EUR / 1% bei Falschangaben.
            KMU: der jeweils niedrigere Wert.
          </div>
        </aside>
      </div>
    </section>
  );
}
