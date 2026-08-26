import { HeroDotsField } from "../../../_components/hero-dots-field";
import { getPostNumberLabel } from "@/lib/blog-metadata";

export function HeroEn() {
  return (
    <>
      <section className="hero" id="hero" data-screen-label="01 Hero">
        <HeroDotsField />
        <div className="byline">
          <span
            className="tag"
            style={{
              border: "1px solid var(--kupfer)",
              color: "var(--kupfer)",
              padding: "4px 10px",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.16em",
            }}
          >
            Article · Nº {getPostNumberLabel("eu-ai-act-grundlagen")}
          </span>
          <span>
            by <span className="byline__author">Tim Löhr</span>
          </span>
          <span className="dot">·</span>
          <span>28 July 2026</span>
          <span className="dot">·</span>
          <span>11 min</span>
        </div>
        <h1
          className="hero__title"
          aria-label="The EU AI Act: what it means if you are not a lawyer."
        >
          <span className="word">The</span> <span className="word">EU</span>{" "}
          <span className="word">AI</span> <span className="word">Act:</span>
          <br />
          <span className="word">what</span> <span className="word">it</span>{" "}
          <span className="word">means</span> <span className="word">if</span>{" "}
          <span className="word">you</span>{" "}
          <span className="word em">
            <i>are not</i>
          </span>{" "}
          <span className="word em">
            <i>a lawyer</i>
          </span>
          <span className="word">.</span>
        </h1>
        <p className="hero__lede">
          The EU AI Act applies in stages. Some provisions have applied since
          February 2025, more apply from 2 August 2026, and the high-risk rules
          follow later. This article explains what already applies, what is now
          in force, and which rights individuals receive. Current to 28 July
          2026; every legal claim cites a primary source.
        </p>
      </section>

      <section className="scene" id="einstieg">
        <div className="scene__dateline">
          EU AI Act · Regulation (EU) 2024/1689, as amended by 2026/1744 ·
          Current to 28 July 2026
        </div>
        <div className="scene__body">
          <p>
            A chatbot answers your question to an insurer. Software sorts your
            job application before a person sees it. A video shows a politician
            saying words they never said. The EU AI Act now contains rules for
            all three situations, and some of those rules apply from 2 August
            2026.
          </p>
          <p>
            At the same time, the EU decided in June 2026 to postpone the rules
            for high-risk systems. Two claims have circulated since:
            <em> everything applies from August</em> and{" "}
            <em>everything has been postponed</em>. Both are wrong. This article
            separates the application dates in the law currently in force.
          </p>
        </div>
      </section>

      <div className="bridge reveal">
        Article 4 does not require a certificate. The European Commission states
        this expressly in its Q&amp;A on AI literacy.
      </div>
    </>
  );
}
