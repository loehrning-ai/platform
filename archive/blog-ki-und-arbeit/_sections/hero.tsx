import { HeroDotsField } from "../../_components/hero-dots-field";

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
            Artikel · Nº 03
          </span>
          <span>
            von <span className="byline__author">Tim Löhr</span>
          </span>
          <span className="dot">·</span>
          <span>22. Juni 2026</span>
          <span className="dot">·</span>
          <span>10 Min.</span>
        </div>
        <h1
          className="hero__title"
          aria-label="KI und Arbeit: Was die Daten wirklich sagen."
        >
          <span className="word" style={{ animationDelay: "0s" }}>
            KI
          </span>{" "}
          <span className="word" style={{ animationDelay: ".08s" }}>
            und
          </span>{" "}
          <span className="word" style={{ animationDelay: ".16s" }}>
            Arbeit:
          </span>
          <br />
          <span className="word em" style={{ animationDelay: ".26s" }}>
            <i>Was</i>
          </span>{" "}
          <span className="word em" style={{ animationDelay: ".36s" }}>
            <i>die</i>
          </span>{" "}
          <span className="word em" style={{ animationDelay: ".44s" }}>
            <i>Daten</i>
          </span>{" "}
          <span className="word" style={{ animationDelay: ".54s" }}>
            wirklich
          </span>{" "}
          <span className="word" style={{ animationDelay: ".64s" }}>
            sagen.
          </span>
        </h1>
        <p className="hero__lede">
          Zwischen 27 und 46 Prozent der Jobs in OECD-Ländern sind erheblich KI-exponiert.
          Gleichzeitig zeigen aktuelle Forschungsarbeiten, dass KI Produktivität vor allem verstärkt,
          nicht ersetzt. Dieser Text ordnet die Zahlen ein, ohne Panikmache und ohne Verharmlosung.
        </p>
        <div className="hero__scroll">Weiterlesen</div>
      </section>

      <section className="scene" id="scene">
        <div className="scene__dateline">
          Arbeit · OECD · Bundesagentur · Amplifier-Modell
        </div>
        <div className="scene__body">
          <p>
            KI und Jobverlust: wenige Themen lösen so viel Debatte aus, bei so wenig Einigkeit über die Daten.
            Dieser Text legt die wichtigsten Quellen offen, erklärt den Unterschied zwischen Exposition und Substitution
            und zeigt, wo Handlungsspielraum besteht.
          </p>
          <p>
            Die Basis sind drei öffentlich zugängliche Quellen: OECD Employment Outlook 2023,
            Bundesagentur für Arbeit 2023 und Brynjolfsson et al. (2025, arxiv:2502.18836).
            Alle Zahlen in diesem Artikel verweisen auf diese Quellen.
          </p>
        </div>
      </section>

      <div className="bridge reveal">
        Exposition bedeutet nicht Substitution. Das ist der wichtigste Unterschied, den dieser Artikel erklärt.
      </div>
    </>
  );
}
