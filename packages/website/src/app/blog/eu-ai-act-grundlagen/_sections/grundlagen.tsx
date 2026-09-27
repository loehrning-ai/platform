export function Grundlagen() {
  return (
    <section className="section" id="grundlagen">
      <div className="kicker">
        <span className="kicker__num">01</span>Das Gesetz
        <span className="kicker__line" />
      </div>
      <h2 className="heading">
        Eine Verordnung mit 113 Artikeln und <span className="em">einem Prinzip: Risiko.</span>
      </h2>
      <p className="dek">
        Der EU AI Act regelt Einsatzzwecke: Je größer das Risiko für
        Menschen, desto strenger die Pflichten.
      </p>

      <div className="premise">
        <div className="premise__body dropcap">
          <p>
            Der EU AI Act ist die Verordnung (EU) 2024/1689. Sie wurde am
            13. Juni 2024 angenommen, am 12. Juli 2024 im Amtsblatt der EU
            veröffentlicht und ist am 1. August 2024 in Kraft getreten.
            (Quelle: EUR-Lex, CELEX:32024R1689) Als Verordnung gilt sie
            unmittelbar in jedem Mitgliedstaat; Deutschland muss nur die
            Aufsicht national organisieren.
          </p>
          <p>
            Das Gesetz richtet sich an zwei Hauptrollen:{" "}
            <strong>Anbieter</strong> entwickeln ein KI-System und bringen es
            auf den Markt, <strong>Betreiber</strong> setzen ein fertiges
            System beruflich ein, etwa eine Firma, die Bewerbungen mit
            Software vorsortiert. Dazu kommen Einführer und Händler. Als
            Privatperson bist du fast nie Adressat: Wer ein KI-System
            ausschließlich privat und nicht beruflich nutzt, ist
            von den Betreiberpflichten ausgenommen. (Quelle: EU AI Act
            Art. 2 Abs. 10, Reg. 2024/1689)
          </p>
          <p>
            Eine Pflicht betrifft dich trotzdem indirekt:{" "}
            <strong>Artikel 4</strong> verpflichtet Anbieter und Betreiber
            seit dem 2. Februar 2025, Maßnahmen zu ergreifen, um die
            Entwicklung der KI-Kompetenz ihres Personals und weiterer in ihrem
            Auftrag befasster Personen zu unterstützen. Zu berücksichtigen
            sind technische Kenntnisse, Erfahrung, Aus- und Fortbildung,
            Einsatzkontext und betroffene Personen oder Personengruppen.
          </p>
          <p>
            Seit der Änderung durch die Verordnung (EU) 2026/1744 muss kein
            bestimmtes Kompetenzniveau einzelner Personen garantiert werden.
            Format, Pflichtprüfung und Mindestzertifikat sind nicht
            vorgeschrieben. Nötig sind belastbare, kontextgerechte Maßnahmen;
            eine Aufzeichnung ohne Maßnahme genügt nicht. (Quelle:
            Art. 4 in der Fassung der Verordnung (EU) 2026/1744; Commission
            Q&amp;A zu Art. 4, abgerufen 28. Juli 2026)
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
          </div>
          <div className="margin-note">
            <b>Art. 4 · KI-Kompetenz</b>
            Gilt seit 2. Februar 2025, kontextbezogen.
            Aufsicht ab 2. August 2026 durch
            nationale Behörden.
          </div>
        </aside>
      </div>
    </section>
  );
}
