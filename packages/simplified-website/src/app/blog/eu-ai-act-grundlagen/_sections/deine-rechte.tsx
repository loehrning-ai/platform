interface Recht {
  readonly frage: string;
  readonly artikel: string;
  readonly antwort: React.ReactNode;
}

const RECHTE: readonly Recht[] = [
  {
    frage: "Muss mir ein Chatbot sagen, dass er kein Mensch ist?",
    artikel: "Art. 50 Abs. 1 · ab 2. August 2026",
    antwort: (
      <>
        Grundsätzlich ja. Systeme, die direkt mit Menschen interagieren,
        müssen so gestaltet sein, dass du über die KI-Interaktion informiert
        wirst, außer es ist aus den Umständen offensichtlich. Ausgenommen
        sind bestimmte Strafverfolgungsfälle.
      </>
    ),
  },
  {
    frage: "Müssen Deepfakes gekennzeichnet sein?",
    artikel: "Art. 50 Abs. 2 und 4 · ab 2. August 2026",
    antwort: (
      <>
        Ja, auf zwei Ebenen: Anbieter generativer Systeme müssen Ausgaben
        maschinenlesbar markieren (Abs. 2), und wer einen Deepfake
        veröffentlicht, muss die künstliche Erzeugung offenlegen (Abs. 4),
        mit Erleichterungen für erkennbar künstlerische oder satirische
        Inhalte. Für bestimmte Altsysteme ist bei der technischen Markierung
        eine Übergangsfrist bis zum 2. Dezember 2026 beschlossen, siehe
        Abschnitt 04.
      </>
    ),
  },
  {
    frage: "Kann ich eine Erklärung verlangen, wenn KI über mich mitentscheidet?",
    artikel: "Art. 86 · ab 2. August 2026",
    antwort: (
      <>
        Ja. Trifft ein Betreiber auf Basis der Ausgabe eines
        Hochrisiko-Systems nach Anhang III eine Entscheidung mit rechtlicher
        oder ähnlich erheblicher Wirkung für dich, etwa bei Kredit,
        Einstellung oder Sozialleistungen, kannst du eine klare und
        aussagekräftige Erklärung verlangen, welche Rolle das System bei der
        Entscheidung gespielt hat. Praktisch greift das Recht in dem Maße,
        in dem die Hochrisiko-Pflichten anwendbar werden, nach dem
        beschlossenen Zeitplan also schrittweise ab Ende 2027.
      </>
    ),
  },
  {
    frage: "Wovor schützt mich das Gesetz schon heute?",
    artikel: "Art. 5 · seit 2. Februar 2025",
    antwort: (
      <>
        Vor den verbotenen Praktiken: Social Scoring, Emotionserkennung am
        Arbeitsplatz und in Schulen (außer Medizin und Sicherheit),
        ungezieltem Aufbau von Gesichtsdatenbanken, gezielter Manipulation
        und der Ausnutzung von Schutzbedürftigkeit. Diese Verbote gelten
        seit dem 2. Februar 2025, mit dem höchsten Bußgeldrahmen des
        Gesetzes.
      </>
    ),
  },
  {
    frage: "Wo kann ich mich beschweren?",
    artikel: "Art. 85 · ab 2. August 2026",
    antwort: (
      <>
        Bei der zuständigen Marktüberwachungsbehörde deines Landes, wenn du
        einen Verstoß gegen die Verordnung vermutest. In Deutschland sieht
        das beschlossene KI-MIG die Bundesnetzagentur als zentrale
        Anlaufstelle vor, soweit keine Fachbehörde zuständig ist; nutze nach
        der Verkündung den offiziell veröffentlichten Weg. Unabhängig davon
        helfen Verbraucherzentralen bei rechtlicher Erstberatung.
      </>
    ),
  },
  {
    frage: "Und das Recht auf einen Menschen statt der Maschine?",
    artikel: "Art. 22 DSGVO · gilt seit 2018",
    antwort: (
      <>
        Das kommt nicht aus dem AI Act. Art. 22 DSGVO gibt dir bei rein
        automatisierten Einzelentscheidungen mit rechtlicher oder ähnlich
        erheblicher Wirkung das Recht auf menschliches Eingreifen und darauf,
        den eigenen Standpunkt darzulegen. AI Act und DSGVO gelten
        nebeneinander: Der eine regelt das System, die andere deine Daten.
      </>
    ),
  },
];

export function DeineRechte() {
  return (
    <section className="section" id="rechte">
      <div className="kicker">
        <span className="kicker__num">05</span>Deine Rechte
        <span className="kicker__line" />
      </div>
      <h2 className="heading">
        Sechs Fragen, sechs <span className="em">Artikel.</span>
      </h2>
      <p className="dek">
        Was du als Bürgerin oder Bürger konkret verlangen kannst, mit
        Artikel und Datum. Diese Übersicht vereinfacht bewusst; im
        Einzelfall gelten Ausnahmen und Übergangsregeln.
      </p>

      <div className="qa">
        {RECHTE.map((r) => (
          <div className="qa__item" key={r.frage}>
            <div className="qa__mark">§</div>
            <div>
              <div className="qa__q">{r.frage}</div>
              <div className="qa__from">{r.artikel}</div>
              <div className="qa__a">{r.antwort}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="margin-note" style={{ maxWidth: 720, margin: "40px auto 0" }}>
        <b>Bei konkreten Rechtsfragen</b>
        Diese Erklärung ersetzt keine Rechtsberatung. Erste Anlaufstellen:
        Verbraucherzentrale (verbraucherzentrale.de) oder eine Kanzlei für
        IT- und Medienrecht.
      </div>
    </section>
  );
}
