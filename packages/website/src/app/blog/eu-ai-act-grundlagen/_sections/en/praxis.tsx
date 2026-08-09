export function PraxisEn() {
  return (
    <section className="section" id="praxis">
      <div className="kicker">
        <span className="kicker__num">06</span>Practical steps
        <span className="kicker__line" />
      </div>
      <h2 className="heading">
        What you can do <span className="em">now.</span>
      </h2>
      <p className="dek">
        Four questions for employees and five steps for small businesses. None
        requires legal counsel to begin.
      </p>

      <div className="premise">
        <div className="premise__body">
          <p>
            <b style={{ color: "var(--kupfer)" }}>As an employee</b>, you can
            check your position with four questions:
          </p>
          <p>
            <b style={{ color: "var(--kupfer)" }}>1.</b> Can you recognise when
            an AI system makes or prepares a decision about you? One example is
            software that sorts CVs before a person reads them.
          </p>
          <p>
            <b style={{ color: "var(--kupfer)" }}>2.</b> Do you know which data
            the system uses about you, and can you access or correct it? The
            GDPR, not the AI Act, governs those rights.
          </p>
          <p>
            <b style={{ color: "var(--kupfer)" }}>3.</b> Can you distinguish an
            AI output from a human decision? An AI system produces an output; it
            does not carry legal or professional judgment.
          </p>
          <p>
            <b style={{ color: "var(--kupfer)" }}>4.</b> Do you know where to
            object or complain? From 2 August 2026, Article 85 points to the
            competent market-surveillance authority. In Germany, the Federal
            Network Agency is the central body under the KI-MIG after
            promulgation, unless a sector-specific authority is responsible.
          </p>
          <p style={{ marginTop: 28 }}>
            <b style={{ color: "var(--kupfer)" }}>As a small business</b> using
            finished tools such as ChatGPT or Copilot, you are usually a
            deployer and face a limited set of obligations:
          </p>
          <p>
            <b style={{ color: "var(--kupfer)" }}>1. Keep an inventory:</b>{" "}
            Record which AI tools are in use, their purposes, and the data they
            receive. A table is enough to start.
          </p>
          <p>
            <b style={{ color: "var(--kupfer)" }}>2. Implement Article 4:</b>{" "}
            Provide staff with AI literacy measures suited to their work and
            keep an internal record. No certificate or examination is required.
            (Source: Commission Q&amp;A on Article 4, May 2025)
          </p>
          <p>
            <b style={{ color: "var(--kupfer)" }}>3. Prepare for Article 50:</b>{" "}
            Does your customer chatbot identify itself as AI? Are AI-generated
            images or videos disclosed where Article 50 requires it? These
            obligations apply from 2 August 2026. The Commission&apos;s
            voluntary transparency code of 10 June 2026 provides wording
            guidance; the Commission and the AI Board found it adequate on 8 and
            9 July 2026. (Source: European Commission, Code of Practice on
            Transparency of AI-generated Content)
          </p>
          <p>
            <b style={{ color: "var(--kupfer)" }}>
              4. Check for high-risk uses:
            </b>{" "}
            Do you use AI for recruitment, credit decisions, or exams? Such uses
            are likely to fall under Annex III. The relevant obligations begin
            under the enacted timetable on 2 December 2027. Recording the use
            now reduces later implementation work.
          </p>
          <p>
            <b style={{ color: "var(--kupfer)" }}>5. Ask questions:</b> The
            Commission has operated the free AI Act Service Desk and its central
            information platform since 8 October 2025. (Source: European
            Commission, 8 October 2025)
          </p>
        </div>
        <aside className="premise__stats">
          <div className="margin-note">
            <b>Role rule of thumb</b>
            Using a finished tool: deployer. Building a system or marketing it
            under your own name: provider, with substantially more obligations.
          </div>
          <div className="margin-note">
            <b>No certificate required</b>
            For Article 4, the Commission prescribes no format, examination, or
            certificate. Keep an internal record of the measures taken.
          </div>
        </aside>
      </div>
    </section>
  );
}
