import type { CSSProperties } from "react";

interface TimelineStepEn {
  readonly num: string;
  readonly date: string;
  readonly title: string;
  readonly body: string;
}

const STEPS_EN: readonly TimelineStepEn[] = [
  {
    num: "01",
    date: "1 Aug 2024",
    title: "Entry into force, before obligations applied",
    body: "The Regulation entered into force 20 days after publication in the Official Journal on 12 July 2024. This date started the clock for every later stage. (Source: Article 113, Regulation 2024/1689)",
  },
  {
    num: "02",
    date: "2 Feb 2025",
    title: "Prohibitions and AI literacy",
    body: "Chapters I and II began to apply: the prohibited practices in Article 5 and the AI literacy obligation in Article 4. Both have been applicable law since this date. (Source: Article 113(a), Regulation 2024/1689)",
  },
  {
    num: "03",
    date: "2 Aug 2025",
    title: "GPAI, governance, and the fines framework",
    body: "The obligations for providers of general-purpose AI models under Articles 51 to 56, the governance structure including the EU AI Office, and the general penalties framework in Article 99 became applicable. (Source: Article 113(b), Regulation 2024/1689)",
  },
  {
    num: "04",
    date: "2 Aug 2026",
    title: "General date of application",
    body: "The transparency obligations in Article 50, the right to lodge a complaint in Article 85, and the right to an explanation in Article 86 become applicable. Member States must have designated their market-surveillance authorities, and the Commission can enforce the GPAI obligations. This date remains unchanged in the law. (Source: Article 113, Regulation 2024/1689)",
  },
  {
    num: "05",
    date: "Dec 2027 / Aug 2028",
    title: "High-risk rules postponed by binding law",
    body: "Regulation (EU) 2026/1744 sets new high-risk dates: 2 December 2027 for stand-alone Annex III systems and 2 August 2028 for systems embedded in regulated products. It was published on 24 July 2026 and entered into force on 27 July 2026. (Source: OJ L, 2026/1744)",
  },
];

export function ZeitplanEn() {
  return (
    <section className="section" id="zeitplan">
      <div className="kicker">
        <span className="kicker__num">03</span>Timeline
        <span className="kicker__line" />
      </div>
      <h2 className="heading">
        What already applies and what{" "}
        <span className="em">applies from 2 August 2026.</span>
      </h2>
      <p className="dek">
        Article 113 stages application over several years. 2 August 2026 is an
        important date, but it is neither the beginning nor the end.
      </p>

      <div className="pipeline">
        {STEPS_EN.map((step, index) => (
          <div
            key={step.num}
            className="pipeline__step"
            style={{ "--i": index } as CSSProperties}
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
            The penalties provide context. Breaches of Article 5 prohibitions
            can be fined up to EUR 35 million or 7% of total worldwide annual
            turnover, whichever is higher. For most other obligations, including
            the Article 50 transparency rules, the ceiling is EUR 15 million or
            3%. Supplying incorrect, incomplete, or misleading information to
            authorities can lead to fines of up to EUR 7.5 million or 1%. For
            small and medium-sized enterprises, the lower of the two amounts
            applies in each case. (Source: EU AI Act, Article 99(3) to (6),
            Regulation 2024/1689)
          </p>
        </div>
        <aside className="premise__stats">
          <div className="margin-note">
            <b>Article 99 · fines framework</b>
            EUR 35m / 7% for prohibited practices. EUR 15m / 3% for most
            obligations. EUR 7.5m / 1% for incorrect information. SMEs: the
            lower amount in each case.
          </div>
        </aside>
      </div>
    </section>
  );
}
