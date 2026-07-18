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
            Artikel · Nº {getPostNumberLabel("deepfake-erkennen")}
          </span>
          <span>
            von <span className="byline__author">Tim Löhr</span>
          </span>
          <span className="dot">·</span>
          <span>22. Juni 2026</span>
          <span className="dot">·</span>
          <span>8 Min.</span>
        </div>
        <h1
          className="hero__title"
          aria-label="Deepfakes erkennen: Drei kostenlose Werkzeuge und eine Checkliste."
        >
          <span className="word" style={{ animationDelay: "0s" }}>
            Deepfakes
          </span>{" "}
          <span className="word" style={{ animationDelay: ".1s" }}>
            erkennen:
          </span>
          <br />
          <span className="word em" style={{ animationDelay: ".2s" }}>
            <i>Drei</i>
          </span>{" "}
          <span className="word em" style={{ animationDelay: ".3s" }}>
            <i>kostenlose</i>
          </span>{" "}
          <span className="word em" style={{ animationDelay: ".4s" }}>
            <i>Werkzeuge.</i>
          </span>
        </h1>
        <p className="hero__lede">
          Deepfakes sind heute in jedem Smartphone-Album möglich. Dieser Artikel erklärt,
          wie du manipulierte Bilder und Videos erkennst, welche kostenlosen Werkzeuge
          wirklich helfen und was du tust, wenn du einen Deepfake findest.
        </p>
        <div className="hero__scroll">Weiterlesen</div>
      </section>

      <section className="scene" id="scene">
        <div className="scene__dateline">
          Deepfakes · Bürgerrechte · EU AI Act Art. 50 · WeVerify · Hive
        </div>
        <div className="scene__body">
          <p>
            Ein Video zeigt einen Politiker und er sagt Dinge, die er nie gesagt hat.
            Ein Anruf klingt wie deine Mutter und sie bittet um Geld. Ein LinkedIn-Profil
            sieht echt aus, aber die Person existiert nicht. Diese Szenarien passieren
            heute, nicht in zehn Jahren.
          </p>
          <p>
            Dieser Text gibt dir drei konkrete Prüfwerkzeuge, eine visuelle Checkliste
            und erklärt, welche Rechte du nach dem EU AI Act und dem Kunsturhebergesetz hast.
            Alle genannten Werkzeuge sind kostenlos und ohne Account zugänglich.
          </p>
        </div>
      </section>

      <div className="bridge reveal">
        Ein negatives Ergebnis eines Prüfwerkzeugs ist kein Beweis der Echtheit. Das ist die
        wichtigste Einschränkung dieses Artikels.
      </div>
    </>
  );
}
