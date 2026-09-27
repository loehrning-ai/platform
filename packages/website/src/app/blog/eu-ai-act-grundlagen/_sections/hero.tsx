import { HeroDotsField } from "../../_components/hero-dots-field";
import { getPostNumberLabel } from "@/lib/blog-metadata";

export function Hero() {
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
            Artikel · Nº {getPostNumberLabel("eu-ai-act-grundlagen")}
          </span>
          <span>
            von <span className="byline__author">Tim Löhr</span>
          </span>
          <span className="dot">·</span>
          <span>28. Juli 2026</span>
          <span className="dot">·</span>
          <span>11 Min.</span>
        </div>
        <h1
          className="hero__title"
          aria-label="Der EU AI Act: was er bedeutet, wenn du keine Juristin bist."
        >
          <span className="word">Der</span> <span className="word">EU</span>{" "}
          <span className="word">AI</span> <span className="word">Act:</span>
          <br />
          <span className="word">was</span> <span className="word">er</span>{" "}
          <span className="word">bedeutet,</span>{" "}
          <span className="word">wenn</span> <span className="word">du</span>{" "}
          <span className="word em">
            <i>keine</i>
          </span>{" "}
          <span className="word em">
            <i>Juristin</i>
          </span>{" "}
          <span className="word">bist.</span>
        </h1>
        <p className="hero__lede">
          Der EU AI Act gilt in Stufen: Teile seit Februar 2025, weitere ab
          2. August 2026, die Hochrisiko-Regeln später. Hier steht ohne
          Fachjargon, was gilt und welche Rechte du bekommst. Stand: 28. Juli
          2026, jede Angabe mit Primärquelle.
        </p>
      </section>

      <section className="scene" id="einstieg">
        <div className="scene__dateline">
          EU AI Act · Verordnung (EU) 2024/1689, geändert durch 2026/1744 ·
          Stand: 28. Juli 2026
        </div>
        <div className="scene__body">
          <p>
            Ein Chatbot beantwortet deine Frage an die Versicherung. Eine
            Software sortiert deine Bewerbung, bevor ein Mensch sie sieht. Ein
            Video zeigt eine Politikerin, die den gezeigten Satz nie gesagt hat.
            Für alle drei Fälle hat der EU AI Act Regeln, einige davon gelten
            ab dem 2. August 2026.
          </p>
          <p>
            Im Juni 2026 hat die EU zudem beschlossen, die Regeln für
            Hochrisiko-Systeme zu verschieben. Seitdem kursieren zwei
            Erzählungen: <em>alles gilt ab August</em> und{" "}
            <em>alles ist verschoben</em>. Beide sind falsch.
          </p>
        </div>
      </section>

      <div className="bridge reveal">
        Artikel 4 verlangt kein Zertifikat. Das stellt die Europäische
        Kommission in ihrem Q&amp;A zur KI-Kompetenz ausdrücklich fest.
      </div>
    </>
  );
}
