import { Counter } from "../../_components/counter";

export function ExpositionSubstitution() {
  return (
    <>
      <section className="section" id="exposition">
        <div className="kicker">
          <span className="kicker__num">01</span>Die Zahlen
          <span className="kicker__line" />
        </div>
        <h2 className="heading">
          27 bis 46 Prozent: was die OECD <span className="em">wirklich misst.</span>
        </h2>
        <p className="dek">
          Die OECD hat nicht gemessen, wie viele Jobs verschwinden. Sie hat gemessen,
          wie viele Aufgaben KI-Systemen theoretisch zugänglich sind.
        </p>

        <div className="premise">
          <div className="premise__body dropcap">
            <p>
              Der OECD Employment Outlook 2023 analysierte über 1.000 Berufsbilder
              in 38 OECD-Ländern und kam zu einem Ergebnis, das oft falsch zitiert wird:
              <b style={{ color: "var(--kupfer)", fontWeight: 600 }}> zwischen 27 und 46 Prozent</b> der Jobs
              sind in dem Sinne KI-exponiert, dass mehr als die Hälfte ihrer Kernaufgaben
              Merkmale aufweisen, die KI-Systeme potenziell bearbeiten können.
              (Quelle: OECD Employment Outlook 2023)
            </p>
            <p>
              Das bedeutet nicht, dass diese Jobs verschwinden. Es bedeutet, dass
              mindestens die Hälfte der Kerntätigkeiten <i>theoretisch</i> durch heutige
              KI-Technologie bearbeitet werden könnten. Ob das in der Praxis passiert,
              hängt von Faktoren ab, die die OECD bewusst nicht modelliert hat: Kosten,
              Regulierung, soziale Akzeptanz, Unternehmensentscheidungen und die
              Entstehung neuer Tätigkeiten.
            </p>
            <p>
              Die Bundesagentur für Arbeit (Impulse 2023) hat ergänzende Analysen
              für den deutschen Arbeitsmarkt erstellt. Ihr Ergebnis für Deutschland
              liegt in einem ähnlichen Bereich, mit einem wichtigen Zusatz: Die Berufe
              mit der höchsten KI-Exposition sind auch jene, in denen Weiterqualifizierung
              die größte relative Wirkung hätte.
              (Quelle: Bundesagentur für Arbeit, Impulse 2023)
            </p>
          </div>
          <aside className="premise__stats">
            <div className="stat">
              <span className="stat__num">
                <Counter target={27} />-<Counter target={46} />%
              </span>
              <div className="stat__label">
                Jobs mit hoher KI-Exposition
                <br />
                <span style={{ color: "var(--muted)" }}>OECD 2023</span>
              </div>
            </div>
            <div className="stat">
              <span className="stat__num">
                <Counter target={38} />
              </span>
              <div className="stat__label">
                analysierte OECD-Länder
                <br />
                <span style={{ color: "var(--muted)" }}>Employment Outlook 2023</span>
              </div>
            </div>
            <div className="margin-note">
              <b>Wichtig</b>
              Exposition bedeutet nicht Substitution. KI kann eine Aufgabe theoretisch
              bearbeiten und trotzdem wird sie weiter von Menschen erledigt: aus Kostengründen,
              Regulierungsgründen oder weil die Qualität nicht ausreicht.
            </div>
          </aside>
        </div>
      </section>

      <aside className="pull reveal">
        <div className="pull__dotgrid" />
        <p className="pull__body">
          Exposition misst <span className="em">Potenzial,</span>
          <br />
          nicht <span className="em">Wahrscheinlichkeit.</span>
        </p>
        <div className="pull__attr">
          § OECD Employment Outlook 2023
        </div>
      </aside>
    </>
  );
}
