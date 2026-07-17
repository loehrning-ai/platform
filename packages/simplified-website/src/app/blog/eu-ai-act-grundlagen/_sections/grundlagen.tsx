export function Grundlagen() {
  return (
    <section className="section" id="grundlagen">
      <div className="kicker">
        <span className="kicker__num">01</span>Das Gesetz
        <span className="kicker__line" />
      </div>
      <h2 className="heading">
        Eine Verordnung, 113 Artikel, <span className="em">ein Prinzip: Risiko.</span>
      </h2>
      <p className="dek">
        Der EU AI Act regelt nicht &bdquo;die KI&ldquo;, sondern konkrete
        Einsatzzwecke. Je größer das Risiko für Menschen, desto strenger die
        Pflichten.
      </p>

      <div className="premise">
        <div className="premise__body dropcap">
          <p>
            Der EU AI Act ist die Verordnung (EU) 2024/1689. Sie wurde am
            13. Juni 2024 angenommen, am 12. Juli 2024 im Amtsblatt der EU
            veröffentlicht und ist am 1. August 2024 in Kraft getreten.
            (Quelle: EUR-Lex, CELEX:32024R1689) Als Verordnung gilt sie
            unmittelbar in jedem Mitgliedstaat. Deutschland muss sie nicht
            in ein eigenes Gesetz übersetzen, nur die Aufsicht national
            organisieren, dazu später mehr.
          </p>
          <p>
            Das Gesetz richtet sich an zwei Hauptrollen:{" "}
            <strong>Anbieter</strong>, die ein KI-System entwickeln und auf
            den Markt bringen, und <strong>Betreiber</strong>, die ein
            fertiges System beruflich einsetzen, etwa eine Firma, die
            Bewerbungen mit Software vorsortiert. Dazu kommen Einführer und
            Händler. Als Privatperson bist du fast nie Adressat: Wer ein
            KI-System ausschließlich privat und nicht beruflich nutzt, ist
            von den Betreiberpflichten ausgenommen. (Quelle: EU AI Act
            Art. 2 Abs. 10, Reg. 2024/1689)
          </p>
          <p>
            Eine Pflicht betrifft dich trotzdem indirekt:{" "}
            <strong>Artikel 4</strong> verpflichtet Anbieter und Betreiber
            seit dem 2. Februar 2025, für ausreichende KI-Kompetenz ihres
            Personals zu sorgen, angepasst an Vorwissen und Einsatzkontext.
            Wenn dein Arbeitgeber KI einsetzt, muss er dich also so schulen,
            dass du Funktionsweise, Risiken und Grenzen der Systeme
            verstehst. Es gibt kein vorgeschriebenes Format, keine
            Pflichtprüfung und kein Mindestzertifikat; eine interne
            Aufzeichnung über die Schulungen genügt. (Quelle: Commission
            Q&amp;A zu Art. 4, digital-strategy.ec.europa.eu, Mai 2025)
          </p>
        </div>
        <aside className="premise__stats">
          <div className="margin-note">
            <b>Reg. (EU) 2024/1689</b>
            113 Artikel, 13 Anhänge, 180 Erwägungsgründe.
            In Kraft seit 1. August 2024,
            Anwendung gestaffelt bis 2027/2028.
          </div>
          <div className="margin-note">
            <b>Art. 2 Abs. 10</b>
            Rein private, nicht berufliche Nutzung
            ist von den Betreiberpflichten ausgenommen.
            Das Gesetz zielt auf Organisationen.
          </div>
          <div className="margin-note">
            <b>Art. 4 · KI-Kompetenz</b>
            Gilt seit 2. Februar 2025.
            Kontextbezogen, kein Zertifikat nötig.
            Aufsicht ab 2. August 2026 durch
            nationale Behörden.
          </div>
        </aside>
      </div>
    </section>
  );
}
