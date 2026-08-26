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
          Das erste umfassende KI-Gesetz der Welt gilt in Stufen: Teile sind
          seit Februar 2025 anwendbar, weitere folgen am 2. August 2026, die
          Hochrisiko-Regeln später. Dieser Text erklärt ohne Fachjargon, was
          schon gilt, was inzwischen in Kraft ist und welche Rechte du bekommst.
          Stand: 28. Juli 2026, jede Angabe mit Primärquelle.
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
            Für alle drei Situationen enthält der EU AI Act inzwischen konkrete
            Regeln, und einige davon werden am 2. August 2026 anwendbar.
          </p>
          <p>
            Gleichzeitig hat die EU im Juni 2026 beschlossen, die Regeln für
            sogenannte Hochrisiko-Systeme zu verschieben. Seitdem kursieren zwei
            Erzählungen: <em>alles gilt ab August</em> und{" "}
            <em>alles ist verschoben</em>. Beide sind falsch. Dieser Text trennt
            die verschiedenen Anwendungsdaten im heute geltenden Recht.
          </p>
        </div>
      </section>

      <div className="bridge reveal">
        Du musst kein Zertifikat erwerben, um den EU AI Act zu erfüllen. Das
        stellt die Europäische Kommission in ihrem Q&amp;A zu Artikel 4
        ausdrücklich fest.
      </div>
    </>
  );
}
