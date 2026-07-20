export function Praxis() {
  return (
    <section className="section" id="praxis">
      <div className="kicker">
        <span className="kicker__num">06</span>Praxis
        <span className="kicker__line" />
      </div>
      <h2 className="heading">
        Was du <span className="em">jetzt</span> tun kannst.
      </h2>
      <p className="dek">
        Vier Fragen für Beschäftigte, fünf Schritte für kleine Unternehmen.
        Nichts davon erfordert eine Anwältin.
      </p>

      <div className="premise">
        <div className="premise__body">
          <p>
            <b style={{ color: "var(--kupfer)" }}>Als Beschäftigte oder Beschäftigter</b>{" "}
            prüfst du deinen eigenen Stand am schnellsten mit vier Fragen:
          </p>
          <p>
            <b style={{ color: "var(--kupfer)" }}>1.</b> Erkennst du, wann
            ein KI-System eine Entscheidung über dich trifft oder
            vorbereitet? Beispiel: Software, die Lebensläufe automatisch
            sortiert, bevor ein Mensch sie liest.
          </p>
          <p>
            <b style={{ color: "var(--kupfer)" }}>2.</b> Weißt du, welche
            Daten das System über dich nutzt, und kannst du sie einsehen
            oder korrigieren lassen? Das regelt die DSGVO, nicht der AI Act.
          </p>
          <p>
            <b style={{ color: "var(--kupfer)" }}>3.</b> Kannst du den
            Unterschied zwischen einem KI-Ergebnis und einer menschlichen
            Entscheidung benennen? KI liefert Wahrscheinlichkeiten, kein
            Urteil.
          </p>
          <p>
            <b style={{ color: "var(--kupfer)" }}>4.</b> Weißt du, wo du
            Einwände erheben kannst? Ab dem 2. August 2026 ist das die
            Marktüberwachungsbehörde nach Art. 85, in Deutschland nach
            Verkündung des KI-MIG zentral die Bundesnetzagentur.
          </p>
          <p style={{ marginTop: 28 }}>
            <b style={{ color: "var(--kupfer)" }}>Als kleines Unternehmen,</b>{" "}
            das fertige Werkzeuge wie ChatGPT oder Copilot einsetzt, bist du
            in der Regel Betreiber, mit überschaubaren Pflichten:
          </p>
          <p>
            <b style={{ color: "var(--kupfer)" }}>1. Inventar anlegen:</b>{" "}
            Welche KI-Werkzeuge sind im Einsatz, wofür, mit welchen Daten?
            Eine Tabelle genügt für den Anfang.
          </p>
          <p>
            <b style={{ color: "var(--kupfer)" }}>2. Art. 4 umsetzen:</b>{" "}
            Beschäftigte kontextbezogen schulen und die Schulung intern
            dokumentieren. Kein Zertifikat, keine Prüfung nötig. (Quelle:
            Commission Q&amp;A zu Art. 4, Mai 2025)
          </p>
          <p>
            <b style={{ color: "var(--kupfer)" }}>3. Art. 50 vorbereiten:</b>{" "}
            Hat euer Kunden-Chatbot einen KI-Hinweis? Werden KI-generierte
            Bilder oder Videos offengelegt, wo Art. 50 das verlangt? Ab dem
            2. August 2026 ist das Pflicht. Der freiwillige
            Transparenz-Kodex der Kommission vom 10. Juni 2026 gibt
            Formulierungshilfen; Kommission und KI-Gremium bewerteten ihn am
            8. und 9. Juli 2026 als geeignet. (Quelle: Europäische Kommission,
            Code of Practice on Transparency of AI-generated Content)
          </p>
          <p>
            <b style={{ color: "var(--kupfer)" }}>4. Hochrisiko prüfen:</b>{" "}
            Nutzt ihr KI für Bewerbungen, Kreditentscheidungen oder
            Prüfungen? Dann fällt der Einsatz voraussichtlich unter Anhang
            III. Die Pflichten dafür kommen nach dem beschlossenen Zeitplan
            ab dem 2. Dezember 2027; wer jetzt dokumentiert, gerät später
            nicht in Zeitnot.
          </p>
          <p>
            <b style={{ color: "var(--kupfer)" }}>5. Fragen stellen:</b>{" "}
            Für Umsetzungsfragen betreibt die Kommission seit dem
            8. Oktober 2025 den kostenlosen AI Act Service Desk mit einer
            zentralen Informationsplattform. (Quelle: Europäische
            Kommission, 8. Oktober 2025)
          </p>
        </div>
        <aside className="premise__stats">
          <div className="margin-note">
            <b>Rollen-Faustregel</b>
            Werkzeug nur benutzen: Betreiber.
            System bauen oder unter eigenem
            Namen vermarkten: Anbieter, mit
            deutlich mehr Pflichten.
          </div>
          <div className="margin-note">
            <b>Kein Zertifikat nötig</b>
            Die Kommission verlangt für Art. 4
            weder Format noch Prüfung noch
            Zertifikat. Interne Aufzeichnung
            über Schulungen genügt.
          </div>
        </aside>
      </div>
    </section>
  );
}
