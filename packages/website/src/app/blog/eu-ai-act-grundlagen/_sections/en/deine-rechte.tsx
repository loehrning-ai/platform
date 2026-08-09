import type { ReactNode } from "react";

interface RightEn {
  readonly question: string;
  readonly article: string;
  readonly answer: ReactNode;
}

const RIGHTS_EN: readonly RightEn[] = [
  {
    question: "Must a chatbot tell me that it is not human?",
    article: "Article 50(1) · from 2 August 2026",
    answer: (
      <>
        Generally, yes. Systems that interact directly with people must be
        designed so that the person is informed that they are interacting with
        an AI system, unless this is obvious from the circumstances. Limited
        exceptions apply to law enforcement.
      </>
    ),
  },
  {
    question: "Must deepfakes be labelled?",
    article: "Article 50(2) and (4) · from 2 August 2026",
    answer: (
      <>
        Yes, at two levels. Providers of generative systems must mark outputs in
        a machine-readable format under paragraph 2. A person who publishes a
        deepfake must disclose that it was artificially generated or manipulated
        under paragraph 4, with lighter treatment for evidently artistic or
        satirical works. Certain legacy systems have a transition period until 2
        December 2026 for the technical marking requirement; see section 04.
      </>
    ),
  },
  {
    question:
      "Can I ask for an explanation when AI affects a decision about me?",
    article: "Article 86 · from 2 August 2026",
    answer: (
      <>
        Yes. If a deployer makes a decision based on the output of an Annex III
        high-risk system and that decision has legal or similarly significant
        effects on you, for example in lending, recruitment, or social benefits,
        you can request a clear and meaningful explanation of the system&apos;s
        role in the decision. In practice, this right operates as the relevant
        high-risk obligations become applicable, which under the enacted
        timetable begins in stages from late 2027.
      </>
    ),
  },
  {
    question: "What does the law already protect me from?",
    article: "Article 5 · since 2 February 2025",
    answer: (
      <>
        The prohibited practices: social scoring, emotion recognition in
        workplaces and schools except for medical or safety reasons, untargeted
        construction of facial-recognition databases, targeted manipulation, and
        exploitation of vulnerabilities. These prohibitions have applied since 2
        February 2025 and carry the Regulation&apos;s highest fines framework.
      </>
    ),
  },
  {
    question: "Where can I lodge a complaint?",
    article: "Article 85 · from 2 August 2026",
    answer: (
      <>
        You can complain to the competent market-surveillance authority in your
        country if you believe the Regulation has been breached. In Germany, the
        KI-MIG in force from 29 July 2026 makes the Federal Network Agency the
        central contact and complaints body unless a sector-specific authority
        is responsible; use the officially published route. Consumer advice
        centres can also provide initial legal guidance.
      </>
    ),
  },
  {
    question: "What about a right to a person instead of a machine?",
    article: "Article 22 GDPR · applicable since 2018",
    answer: (
      <>
        That right does not come from the AI Act. For solely automated
        individual decisions with legal or similarly significant effects,
        Article 22 GDPR provides safeguards including human intervention and the
        opportunity to express your point of view. The AI Act and GDPR apply
        together: one regulates the system, the other your personal data.
      </>
    ),
  },
];

export function DeineRechteEn() {
  return (
    <section className="section" id="rechte">
      <div className="kicker">
        <span className="kicker__num">05</span>Your rights
        <span className="kicker__line" />
      </div>
      <h2 className="heading">
        Six questions, six <span className="em">articles.</span>
      </h2>
      <p className="dek">
        What an individual can ask for, with the relevant article and date. This
        overview is deliberately simplified; exceptions and transition rules may
        apply to a specific case.
      </p>

      <div className="qa">
        {RIGHTS_EN.map((right) => (
          <div className="qa__item" key={right.question}>
            <div className="qa__mark">§</div>
            <div>
              <div className="qa__q">{right.question}</div>
              <div className="qa__from">{right.article}</div>
              <div className="qa__a">{right.answer}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="margin-note"
        style={{ maxWidth: 720, margin: "40px auto 0" }}
      >
        <b>For a specific legal question</b>
        This explanation is not legal advice. In Germany, first points of
        contact include a consumer advice centre (verbraucherzentrale.de) or a
        law firm specialising in technology and media law.
      </div>
    </section>
  );
}
