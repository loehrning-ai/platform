export function RechteHandlung() {
  return (
    <>
      <section className="section" id="rechte">
        <div className="kicker">
          <span className="kicker__num">03</span>Deine Rechte
          <span className="kicker__line" />
        </div>
        <h2 className="heading">
          EU AI Act Art. 50 und <span className="em">KUG § 22.</span>
        </h2>
        <p className="dek">
          Ab dem 2. August 2026 schafft Art. 50 konkrete Markierungs- und
          Offenlegungspflichten für bestimmte KI-Inhalte.
        </p>

        <div className="premise">
          <div className="premise__body dropcap">
            <p>
              Art. 50 der Verordnung (EU) 2024/1689 (EU AI Act) verpflichtet Anbieter
              von KI-Systemen, die Bilder, Videos oder Audios generieren oder manipulieren,
              deren Ausgaben als KI-generiert zu kennzeichnen. Diese Pflicht gilt ab dem
              <b style={{ color: "var(--kupfer)", fontWeight: 700 }}> 2. August 2026</b>.
              (Quelle: EUR-Lex CELEX:32024R1689, Art. 50)
            </p>
            <p>
              Was das für dich bedeutet: Ein Deepfake, der nach diesem Datum unter
              Art. 50 Abs. 4 veröffentlicht wird, muss grundsätzlich als künstlich erzeugt
              oder manipuliert offengelegt werden. Fehlt der Hinweis, kann ein Verstoß
              vorliegen. Das deutsche KI-MIG sieht die Bundesnetzagentur als zentrale
              Anlaufstelle vor, soweit keine Fachbehörde zuständig ist. Nutze nur einen
              nach Verkündung des Gesetzes offiziell veröffentlichten Beschwerdeweg.
            </p>
            <p>
              Wenn du selbst Opfer eines Deepfakes wirst: § 22 Kunsturhebergesetz (KUG) schützt
              das Recht am eigenen Bild. Bilder oder Videos dürfen nicht ohne Einwilligung
              veröffentlicht werden. Bei strafbaren Inhalten greift zudem § 201a StGB
              (Verletzung des höchstpersönlichen Lebensbereichs durch Bildaufnahmen).
            </p>
            <p>
              Erste Anlaufstellen: Verbraucherzentrale (verbraucherzentrale.de) für
              rechtliche Erstberatung, klicksafe.de für Betroffenenrechte im Überblick.
              Im Ernstfall: Anwältin oder Anwalt für Medienrecht.
            </p>
          </div>
          <aside className="premise__stats">
            <div className="margin-note">
              <b>Art. 50 EU AI Act</b>
              Markierung und Offenlegung für erfasste KI-Inhalte.
              Gilt ab 2. August 2026.
              Zuständigkeit und Beschwerdeweg:
              nach aktueller Behördeninformation prüfen.
            </div>
            <div className="margin-note">
              <b>§ 22 KUG</b>
              Recht am eigenen Bild.
              Kein Deepfake mit deinem Gesicht
              ohne deine Einwilligung.
            </div>
          </aside>
        </div>
      </section>

      <aside className="pull reveal">
        <div className="pull__dotgrid" />
        <p className="pull__body">
          Nicht teilen ist der einfachste
          <br />
          und <span className="em">wirksamste</span> erste Schritt.
        </p>
        <div className="pull__attr">
          § Citizen-Praxis
        </div>
      </aside>

      <section className="section" id="handlung">
        <div className="kicker">
          <span className="kicker__num">04</span>Was tun?
          <span className="kicker__line" />
        </div>
        <h2 className="heading">
          Vier Schritte in <span className="em">aufsteigender Ernsthaftigkeit.</span>
        </h2>

        <div className="premise">
          <div className="premise__body">
            <p>
              <b style={{ color: "var(--kupfer)" }}>1. Nicht teilen.</b>{" "}
              Der einfachste und wirksamste erste Schritt. Jede Weiterleitung vergrößert
              den Schaden. Nicht-Teilen ist keine Passivität, sondern eine aktive Entscheidung.
            </p>
            <p>
              <b style={{ color: "var(--kupfer)" }}>2. Auf der Plattform melden.</b>{" "}
              Alle großen Plattformen haben Meldewege für manipulierte Inhalte.
              Instagram: drei Punkte, Melden, Falschinformationen. YouTube: Melden unter dem Video.
              TikTok: gedrückt halten, Inhalte melden. Plattformen sind nach EU Digital Services Act
              verpflichtet, gemeldete Inhalte zu überprüfen.
            </p>
            <p>
              <b style={{ color: "var(--kupfer)" }}>3. Behörde informieren.</b>{" "}
              Bei strafbaren Inhalten kannst du Anzeige über die Onlinewache erstatten,
              das gemeinsame Online-Anzeigeportal der Polizeien der Länder, unter
              portal.onlinewache.polizei.de.
              Bei einem möglichen Verstoß gegen Art. 50: die nach dem verkündeten
              KI-MIG und dem jeweiligen Fachrecht zuständige Marktüberwachungsbehörde.
            </p>
            <p>
              <b style={{ color: "var(--kupfer)" }}>4. Betroffene Person warnen.</b>{" "}
              Wenn du weißt, wer in dem Deepfake gezeigt wird, informiere diese Person
              zuerst, bevor du irgendetwas teilst. Sie hat das Recht, zuerst zu wissen
              und selbst zu entscheiden.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
