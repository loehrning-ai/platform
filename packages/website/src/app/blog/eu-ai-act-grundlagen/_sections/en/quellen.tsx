import Link from "next/link";

interface SourceEn {
  readonly title: string;
  readonly desc: string;
  readonly href: string;
  readonly badge: "Primary source" | "Commission";
  readonly example: string;
}

const SOURCES_EN: readonly SourceEn[] = [
  {
    title: "Regulation (EU) 2024/1689",
    desc: "The complete regulation on EUR-Lex in German; the language selector gives the official English text. The enacted text is authoritative.",
    href: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689",
    badge: "Primary source",
    example: "EUR-Lex · Official Journal, 12 July 2024",
  },
  {
    title: "Regulation (EU) 2026/1744",
    desc: "The published AI Omnibus, including the amended Article 4, the new high-risk dates, and transition rules.",
    href: "https://eur-lex.europa.eu/eli/reg/2026/1744/oj",
    badge: "Primary source",
    example: "EUR-Lex · in force since 27 July 2026",
  },
  {
    title: "Council of the EU: approval of the Omnibus",
    desc: "Council press release on its final approval, with the new high-risk dates.",
    href: "https://www.consilium.europa.eu/en/press/press-releases/2026/06/29/artificial-intelligence-council-gives-final-green-light-to-simplify-and-streamline-rules/",
    badge: "Primary source",
    example: "Consilium · 29 June 2026",
  },
  {
    title: "Article 4 Q&A on AI literacy",
    desc: "The Commission's answers: no certificate, no mandatory format, and measures tailored to the context.",
    href: "https://digital-strategy.ec.europa.eu/en/faqs/ai-literacy-questions-answers",
    badge: "Commission",
    example: "digital-strategy.ec.europa.eu · accessed 28 July 2026",
  },
  {
    title: "Timeline and implementation guidance",
    desc: "The Commission's AI Act overview, with the GPAI Code and AI Act Service Desk.",
    href: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
    badge: "Commission",
    example: "digital-strategy.ec.europa.eu",
  },
  {
    title: "KI-MIG in the Bundestag",
    desc: "Bundestag record of the German implementing act that makes the Federal Network Agency the central supervisor.",
    href: "https://www.bundestag.de/dokumente/textarchiv/2026/kw24-de-ki-1183820",
    badge: "Primary source",
    example: "bundestag.de · 11 June 2026",
  },
];

function SourcesGlyphEn() {
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

export function QuellenEn() {
  return (
    <>
      <section className="section" id="quellen">
        <div className="kicker">
          <span className="kicker__num">07</span>Sources
          <span className="kicker__line" />
        </div>
        <h2 className="heading">
          Trust the text in the <span className="em">Official Journal.</span>
        </h2>
        <p className="dek">
          Check every legal claim here. All sources last reviewed on 28 July
          2026.
        </p>

        <div className="sources">
          {SOURCES_EN.map((source) => (
            <a
              key={source.href}
              className="source"
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="source__top">
                <SourcesGlyphEn />
                <span
                  className={`source__badge ${
                    source.badge === "Primary source"
                      ? "badge-high"
                      : "badge-medium"
                  }`}
                >
                  {source.badge}
                </span>
              </div>
              <div className="source__title">{source.title}</div>
              <div className="source__desc">{source.desc}</div>
              <div className="source__example">{source.example}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="essay-close">
        <p>
          The EU AI Act applies in stages: its main individual rights become
          applicable on 2 August 2026, while the most demanding high-risk
          obligations have been moved by binding law to late 2027 and 2028.
        </p>
        <p>
          The German authority route remains expressly provisional until
          official promulgation of the KI-MIG has been verified.
        </p>
        <div className="essay-close__signoff">
          <span>
            Written by <b>Tim Löhr</b>
          </span>
          <span>Current to 28 July 2026</span>
        </div>
      </section>

      <div className="foot-cta">
        <span>Related courses on loehrning.ai:</span>
        <span>
          <Link href="/en/eu-ai-act-kurs">EU AI Act course</Link>
          {" · "}
          <Link href="/en/ki-fuehrerschein">Everyday AI literacy</Link>
        </span>
      </div>
    </>
  );
}
