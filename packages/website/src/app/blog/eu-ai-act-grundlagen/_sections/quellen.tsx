import Link from "next/link";

interface Quelle {
  readonly title: string;
  readonly desc: string;
  readonly href: string;
  readonly badge: "Primärquelle" | "Kommission";
  readonly example: string;
}

const QUELLEN: readonly Quelle[] = [
  {
    title: "Verordnung (EU) 2024/1689",
    desc: "Der vollständige Gesetzestext auf Deutsch. Maßgeblich ist immer diese Fassung, nicht eine Zusammenfassung.",
    href: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689",
    badge: "Primärquelle",
    example: "EUR-Lex · Amtsblatt 12. Juli 2024",
  },
  {
    title: "Verordnung (EU) 2026/1744",
    desc: "Der veröffentlichte AI Omnibus mit dem geänderten Artikel 4, den neuen Hochrisiko-Terminen und Übergangsregeln.",
    href: "https://eur-lex.europa.eu/eli/reg/2026/1744/oj",
    badge: "Primärquelle",
    example: "EUR-Lex · in Kraft seit 27. Juli 2026",
  },
  {
    title: "Rat der EU: Billigung des Omnibus",
    desc: "Die Pressemitteilung zur endgültigen Zustimmung des Rates mit den neuen Hochrisiko-Terminen.",
    href: "https://www.consilium.europa.eu/en/press/press-releases/2026/06/29/artificial-intelligence-council-gives-final-green-light-to-simplify-and-streamline-rules/",
    badge: "Primärquelle",
    example: "Consilium · 29. Juni 2026",
  },
  {
    title: "Q&A zu Artikel 4 (KI-Kompetenz)",
    desc: "Die Antworten der Kommission: kein Zertifikat, kein Pflichtformat, kontextbezogene Schulung.",
    href: "https://digital-strategy.ec.europa.eu/en/faqs/ai-literacy-questions-answers",
    badge: "Kommission",
    example: "digital-strategy.ec.europa.eu · abgerufen 28. Juli 2026",
  },
  {
    title: "Zeitplan und Umsetzungshilfen",
    desc: "Die offizielle Übersicht der Kommission zum AI Act, inklusive GPAI-Kodex und AI Act Service Desk.",
    href: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
    badge: "Kommission",
    example: "digital-strategy.ec.europa.eu",
  },
  {
    title: "KI-MIG im Bundestag",
    desc: "Der Beschluss zum deutschen Durchführungsgesetz, das die Bundesnetzagentur zur zentralen Aufsicht macht.",
    href: "https://www.bundestag.de/dokumente/textarchiv/2026/kw24-de-ki-1183820",
    badge: "Primärquelle",
    example: "bundestag.de · 11. Juni 2026",
  },
];

function QuellenGlyph() {
  return (
    <svg
      className="source__glyph source__glyph--kupfer"
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="3" y="2" width="16" height="18" />
      <line x1="7" y1="7" x2="15" y2="7" />
      <line x1="7" y1="11" x2="15" y2="11" />
      <line x1="7" y1="15" x2="12" y2="15" />
    </svg>
  );
}

export function Quellen() {
  return (
    <>
      <section className="section" id="quellen">
        <div className="kicker">
          <span className="kicker__num">07</span>Quellen
          <span className="kicker__line" />
        </div>
        <h2 className="heading">
          Glaub nicht mir, glaub <span className="em">dem Amtsblatt.</span>
        </h2>
        <p className="dek">
          Jede Aussage in diesem Text lässt sich hier nachprüfen. Alle
          Quellen zuletzt geprüft am 28. Juli 2026.
        </p>

        <div className="sources">
          {QUELLEN.map((q) => (
            <a
              key={q.href}
              className="source"
              href={q.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="source__top">
                <QuellenGlyph />
                <span
                  className={`source__badge ${
                    q.badge === "Primärquelle" ? "badge-high" : "badge-medium"
                  }`}
                >
                  {q.badge}
                </span>
              </div>
              <div className="source__title">{q.title}</div>
              <div className="source__desc">{q.desc}</div>
              <div className="source__example">{q.example}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="essay-close">
        <p>
          Der EU AI Act ist kein Grund zur Panik und kein Papiertiger. Er
          ist ein gestaffeltes Gesetz, dessen wichtigste Bürgerrechte am
          2. August 2026 anwendbar werden, während die schwersten
          Unternehmenspflichten nun verbindlich auf Ende 2027 und 2028
          verschoben sind. Wer beides auseinanderhält, versteht neunzig Prozent der
          Debatte.
        </p>
        <p>
          Dieser Artikel wird bei relevanten Änderungen aktualisiert. Der
          deutsche Behördenweg bleibt bis zur amtlich verifizierten
          Verkündung des KI-MIG ausdrücklich vorläufig.
        </p>
        <div className="essay-close__signoff">
          <span>
            Geschrieben von <b>Tim Löhr</b>
          </span>
          <span>Stand: 28. Juli 2026</span>
        </div>
      </section>

      <div className="foot-cta">
        <span>
          Tiefer einsteigen? Zwei kostenlose Kurse auf loehrning.ai:
        </span>
        <span>
          <Link href="/eu-ai-act-kurs">EU AI Act Kurs</Link>
          {" · "}
          <Link href="/ki-fuehrerschein">KI-Führerschein</Link>
        </span>
      </div>
    </>
  );
}
