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
              fontSize: 10,
              letterSpacing: "0.16em",
            }}
          >
            Artikel · Nº {getPostNumberLabel("eu-ai-act-grundlagen")}
          </span>
          <span>
            von <span className="byline__author">Tim Löhr</span>
          </span>
          <span className="dot">·</span>
          <span>16. Juli 2026</span>
          <span className="dot">·</span>
          <span>11 Min.</span>
        </div>
        <h1
          className="hero__title"
          aria-label="Der EU AI Act: was er bedeutet, wenn du keine Juristin bist."
        >
          <span className="word" style={{ animationDelay: "0s" }}>
            Der
          </span>{" "}
          <span className="word" style={{ animationDelay: ".08s" }}>
            EU
          </span>{" "}
          <span className="word" style={{ animationDelay: ".16s" }}>
            AI
          </span>{" "}
          <span className="word" style={{ animationDelay: ".24s" }}>
            Act:
          </span>
          <br />
          <span className="word" style={{ animationDelay: ".32s" }}>
            was
          </span>{" "}
          <span className="word" style={{ animationDelay: ".4s" }}>
            er
          </span>{" "}
          <span className="word" style={{ animationDelay: ".48s" }}>
            bedeutet,
          </span>{" "}
          <span className="word" style={{ animationDelay: ".56s" }}>
            wenn
          </span>{" "}
          <span className="word" style={{ animationDelay: ".64s" }}>
            du
          </span>{" "}
          <span className="word em" style={{ animationDelay: ".72s" }}>
            <i>keine</i>
          </span>{" "}
          <span className="word em" style={{ animationDelay: ".8s" }}>
            <i>Juristin</i>
          </span>{" "}
          <span className="word" style={{ animationDelay: ".88s" }}>
            bist.
          </span>
        </h1>
        <p className="hero__lede">
          Das erste umfassende KI-Gesetz der Welt gilt in Stufen: Teile sind
          seit Februar 2025 anwendbar, weitere folgen am 2. August 2026, die
          Hochrisiko-Regeln später. Dieser Text erklärt ohne Fachjargon, was
          schon gilt, was beschlossen ist und welche Rechte du bekommst.
          Stand: 16. Juli 2026, jede Angabe mit Primärquelle.
        </p>
        <div className="hero__scroll">Weiterlesen</div>
      </section>

      <section className="scene" id="einstieg">
        <div className="scene__dateline">
          EU AI Act · Verordnung (EU) 2024/1689 · Stand: 16. Juli 2026
        </div>
        <div className="scene__body">
          <p>
            Ein Chatbot beantwortet deine Frage an die Versicherung. Eine
            Software sortiert deine Bewerbung, bevor ein Mensch sie sieht. Ein
            Video zeigt eine Politikerin, die den gezeigten Satz nie gesagt
            hat. Für alle drei Situationen enthält der EU AI Act inzwischen
            konkrete Regeln, und einige davon werden am 2. August 2026
            anwendbar.
          </p>
          <p>
            Gleichzeitig hat die EU im Juni 2026 beschlossen, die Regeln für
            sogenannte Hochrisiko-Systeme zu verschieben. Seitdem kursieren
            zwei Erzählungen: <em>alles gilt ab August</em> und{" "}
            <em>alles ist verschoben</em>. Beide sind falsch. Dieser Text
            trennt sauber, was heute geltendes Recht ist und was zwar
            beschlossen, aber noch nicht in Kraft ist.
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
