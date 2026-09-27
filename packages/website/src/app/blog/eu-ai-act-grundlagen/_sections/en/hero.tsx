import { PostHead } from "../../../_components/post-head";

export function HeroEn() {
  return (
    <>
      <PostHead
        slug="eu-ai-act-grundlagen"
        title="The EU AI Act: what it means if you are not a lawyer."
        byline={["Tim Löhr", "28 July 2026", "11 min"]}
        lede={
          <>
            The EU AI Act applies in stages: some provisions since February
            2025, more from 2 August 2026, the high-risk rules later. This
            article explains what applies and which rights you get. Current to
            28 July 2026; every legal claim cites a primary source.
          </>
        }
      />

      <section className="scene" id="einstieg">
        <div className="scene__dateline">
          EU AI Act · Regulation (EU) 2024/1689, as amended by 2026/1744 ·
          Current to 28 July 2026
        </div>
        <div className="scene__body">
          <p>
            A chatbot answers your question to an insurer. Software sorts your
            job application before a person sees it. A video shows a politician
            saying words they never said. The EU AI Act has rules for all three
            cases, and some apply from 2 August 2026.
          </p>
          <p>
            In June 2026 the EU also decided to postpone the rules for
            high-risk systems. Two claims have circulated since:
            <em> everything applies from August</em> and{" "}
            <em>everything has been postponed</em>. Both are wrong.
          </p>
        </div>
      </section>

      <div className="bridge reveal">
        AI literacy under Article 4 requires no certificate. The European
        Commission says so expressly in its Q&amp;A.
      </div>
    </>
  );
}
