export function GrundlagenEn() {
  return (
    <section className="section" id="grundlagen">
      <div className="kicker">
        <span className="kicker__num">01</span>The law
        <span className="kicker__line" />
      </div>
      <h2 className="heading">
        One regulation, 113 articles,{" "}
        <span className="em">one principle: risk.</span>
      </h2>
      <p className="dek">
        The EU AI Act does not regulate AI in the abstract. It regulates
        specific uses. The greater the risk to people, the stricter the
        obligations.
      </p>

      <div className="premise">
        <div className="premise__body dropcap">
          <p>
            The EU AI Act is Regulation (EU) 2024/1689. It was adopted on 13
            June 2024, published in the Official Journal of the European Union
            on 12 July 2024, and entered into force on 1 August 2024. (Source:
            EUR-Lex, CELEX:32024R1689) As a regulation, it applies directly in
            every Member State. Germany does not need to transpose it into a
            separate national law, but it must organise national supervision.
            More on that below.
          </p>
          <p>
            The law addresses two main roles: <strong>providers</strong>, which
            develop an AI system and place it on the market, and{" "}
            <strong>deployers</strong>, which use a finished system in a
            professional context, such as a company that uses software to
            pre-screen job applications. Importers and distributors are also
            covered. Individuals are rarely direct addressees. A person who uses
            an AI system exclusively for a personal, non-professional activity
            is exempt from the obligations for deployers. (Source: EU AI Act,
            Article 2(10), Regulation 2024/1689)
          </p>
          <p>
            One obligation still affects individuals indirectly:{" "}
            <strong>Article 4</strong> has required providers and deployers
            since 2 February 2025 to take measures that support an adequate
            level of AI literacy among their staff, taking account of prior
            knowledge, the context of use, and the people affected. Since the
            amendment by Regulation (EU) 2026/1744, an organisation does not
            have to guarantee a specified literacy level for each individual. No
            format, mandatory examination, or minimum certificate is prescribed.
            The organisation must still take credible measures suited to its
            context; keeping a record without taking a measure is not enough.
            (Source: Article 4 as amended by Regulation (EU) 2026/1744;
            Commission Q&amp;A on Article 4, accessed 28 July 2026)
          </p>
        </div>
        <aside className="premise__stats">
          <div className="margin-note">
            <b>Regulation (EU) 2024/1689</b>
            113 articles, 13 annexes, and 180 recitals. In force since 1 August
            2024, with application staged through 2027/2028.
          </div>
          <div className="margin-note">
            <b>Article 2(10)</b>
            Purely personal, non-professional use is exempt from the obligations
            for deployers. The law primarily addresses organisations.
          </div>
          <div className="margin-note">
            <b>Article 4 · AI literacy</b>
            Applies since 2 February 2025. Measures must fit the context; no
            certificate is required. National authorities supervise from 2
            August 2026.
          </div>
        </aside>
      </div>
    </section>
  );
}
