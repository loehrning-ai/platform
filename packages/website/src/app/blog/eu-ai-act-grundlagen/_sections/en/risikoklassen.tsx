import type { CSSProperties } from "react";

interface RiskStageEn {
  readonly stage: number;
  readonly title: string;
  readonly range: string;
  readonly desc: string;
}

const STAGES_EN: readonly RiskStageEn[] = [
  {
    stage: 1,
    title: "Unacceptable risk",
    range: "Article 5 · prohibited since 2 February 2025",
    desc: "Prohibited outright: social scoring, emotion recognition in workplaces and schools except for medical or safety reasons, untargeted scraping of facial images from the internet to build recognition databases, and manipulative techniques that materially distort decisions. (Source: EU AI Act, Article 5(1), points (a) to (h))",
  },
  {
    stage: 2,
    title: "High risk",
    range: "Article 6 + Annex III · dates postponed; see section 04",
    desc: "Systems with a significant effect on a person's life: recruitment screening, credit scoring, exam assessment, and critical infrastructure. Obligations include risk management, data quality, logging, human oversight, and registration in an EU database.",
  },
  {
    stage: 3,
    title: "Limited risk",
    range: "Article 50 · transparency obligations from 2 August 2026",
    desc: "Permitted, but subject to disclosure requirements: people must be told when they interact with an AI system, generated content must be marked in a machine-readable format, and deepfakes must be disclosed. Section 05 explains the details.",
  },
  {
    stage: 4,
    title: "Minimal risk",
    range: "No new obligations",
    desc: "Most applications fall here: spam filters, navigation apps, spelling correction, and recommendation lists. Only voluntary codes of conduct and existing law, including data protection law, apply.",
  },
];

export function RisikoklassenEn() {
  return (
    <section className="section" id="risikoklassen">
      <div className="kicker">
        <span className="kicker__num">02</span>Risk classes
        <span className="kicker__line" />
      </div>
      <h2 className="heading">
        Four levels and <span className="em">one special case.</span>
      </h2>
      <p className="dek">
        Classification depends on the use, not the underlying technology. The
        same model family can be low-risk in one product and subject to the
        strictest obligations in another.
      </p>

      <div className="ladder reveal">
        {STAGES_EN.map((stage, index) => (
          <div
            key={stage.stage}
            className="ladder__step"
            data-stage={String(stage.stage)}
            style={{ "--i": index } as CSSProperties}
          >
            <div className="ladder__num">{stage.stage}</div>
            <div>
              <div className="ladder__title">{stage.title}</div>
              <div className="ladder__range">{stage.range}</div>
            </div>
            <div className="ladder__desc">{stage.desc}</div>
          </div>
        ))}
      </div>

      <div className="premise" style={{ marginTop: 64 }}>
        <div className="premise__body">
          <p>
            The special case is <strong>general-purpose AI models</strong>{" "}
            (GPAI), meaning the models behind tools such as ChatGPT, Claude, or
            Gemini. They are not classified by a particular use. Instead, a
            separate chapter applies. Since 2 August 2025, their providers have
            had to supply technical documentation, comply with EU copyright law,
            and publish a sufficiently detailed summary of training content.
            (Source: EU AI Act, Articles 51 to 56 and Article 113)
          </p>
          <p>
            To support implementation, the Commission published a voluntary
            General-Purpose AI Code of Practice on 10 July 2025. Its signatories
            include OpenAI, Anthropic, Google, and Microsoft. The Code can help
            a provider demonstrate compliance, but it does not replace a
            conformity assessment. The Commission can enforce the GPAI
            obligations from 2 August 2026. (Source: European Commission,
            General-Purpose AI Code of Practice, 10 July 2025)
          </p>
        </div>
        <aside className="premise__stats">
          <div className="margin-note">
            <b>Everyday classification</b>A customer-service FAQ chatbot is
            level 3. The same language model used to assess job applications is
            level 2. The use determines the class, not the model.
          </div>
          <div className="margin-note">
            <b>GPAI · Articles 51 to 56</b>
            Provider obligations apply since 2 August 2025. Commission
            enforcement begins on 2 August 2026.
          </div>
        </aside>
      </div>
    </section>
  );
}
