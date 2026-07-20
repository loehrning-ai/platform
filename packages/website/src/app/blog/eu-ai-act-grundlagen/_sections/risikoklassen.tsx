import type { CSSProperties } from "react";

interface RiskStage {
  readonly stage: number;
  readonly title: string;
  readonly range: string;
  readonly desc: string;
}

const STAGES: readonly RiskStage[] = [
  {
    stage: 1,
    title: "Unannehmbares Risiko",
    range: "Art. 5 · verboten seit 2. Februar 2025",
    desc:
      "Komplett verboten: Social Scoring, Emotionserkennung am Arbeitsplatz und in Schulen (außer aus medizinischen oder Sicherheitsgründen), ungezieltes Auslesen von Gesichtsbildern aus dem Internet für Erkennungsdatenbanken, manipulative Techniken, die Entscheidungen spürbar verzerren. (Quelle: EU AI Act Art. 5 Abs. 1 lit. a bis h)",
  },
  {
    stage: 2,
    title: "Hochrisiko",
    range: "Art. 6 + Anhang III · Termine verschoben, siehe Abschnitt 04",
    desc:
      "Systeme mit erheblichem Einfluss auf dein Leben: Bewerbungsscreening, Kreditscoring, Prüfungsbewertung, kritische Infrastruktur. Pflichten: Risikomanagement, Datenqualität, Protokollierung, menschliche Aufsicht, Registrierung in einer EU-Datenbank.",
  },
  {
    stage: 3,
    title: "Begrenztes Risiko",
    range: "Art. 50 · Transparenzpflichten ab 2. August 2026",
    desc:
      "Erlaubt, aber kennzeichnungspflichtig: Chatbots müssen als KI erkennbar sein, generierte Inhalte maschinenlesbar markiert, Deepfakes offengelegt werden. Details im Rechte-Abschnitt.",
  },
  {
    stage: 4,
    title: "Minimales Risiko",
    range: "Keine neuen Pflichten",
    desc:
      "Die große Mehrheit der Anwendungen: Spamfilter, Navigations-Apps, Rechtschreibkorrektur, Empfehlungslisten. Hier gelten nur freiwillige Verhaltenskodizes und das übrige Recht, etwa Datenschutz.",
  },
];

export function Risikoklassen() {
  return (
    <section className="section" id="risikoklassen">
      <div className="kicker">
        <span className="kicker__num">02</span>Risikoklassen
        <span className="kicker__line" />
      </div>
      <h2 className="heading">
        Vier Stufen und <span className="em">ein Sonderfall.</span>
      </h2>
      <p className="dek">
        Es zählt der Einsatzzweck, nicht die Technik. Dieselbe Modellfamilie
        kann in einem Produkt harmlos sein und in einem anderen unter die
        strengsten Pflichten fallen.
      </p>

      <div className="ladder reveal">
        {STAGES.map((s, i) => (
          <div
            key={s.stage}
            className="ladder__step"
            data-stage={String(s.stage)}
            style={{ "--i": i } as CSSProperties}
          >
            <div className="ladder__num">{s.stage}</div>
            <div>
              <div className="ladder__title">{s.title}</div>
              <div className="ladder__range">{s.range}</div>
            </div>
            <div className="ladder__desc">{s.desc}</div>
          </div>
        ))}
      </div>

      <div className="premise" style={{ marginTop: 64 }}>
        <div className="premise__body">
          <p>
            Der Sonderfall sind <strong>KI-Modelle mit allgemeinem
            Verwendungszweck</strong> (GPAI), also die Modelle hinter
            Werkzeugen wie ChatGPT, Claude oder Gemini. Sie werden nicht
            nach Einsatzzweck sortiert, sondern haben ein eigenes Kapitel:
            Ihre Anbieter müssen seit dem 2. August 2025 technische
            Dokumentation bereitstellen, das EU-Urheberrecht achten und eine
            Zusammenfassung der Trainingsdaten veröffentlichen. (Quelle: EU
            AI Act Art. 51 bis 56, Art. 113)
          </p>
          <p>
            Zur Umsetzung hat die Kommission am 10. Juli 2025 einen
            freiwilligen GPAI-Verhaltenskodex veröffentlicht, den unter
            anderem OpenAI, Anthropic, Google und Microsoft unterzeichnet
            haben. Er hilft beim Nachweis, ersetzt aber keine
            Konformitätsprüfung. Durchsetzen kann die Kommission die
            GPAI-Pflichten ab dem 2. August 2026. (Quelle: Europäische
            Kommission, General-Purpose AI Code of Practice, 10. Juli 2025)
          </p>
        </div>
        <aside className="premise__stats">
          <div className="margin-note">
            <b>Einordnung im Alltag</b>
            Ein FAQ-Chatbot ist Stufe 3.
            Dieselbe Sprach-KI, die Bewerbungen
            bewertet, ist Stufe 2. Der Zweck
            entscheidet, nicht das Modell.
          </div>
          <div className="margin-note">
            <b>GPAI · Art. 51 bis 56</b>
            Anbieterpflichten seit 2. August 2025.
            Kommission kann ab 2. August 2026
            durchsetzen.
          </div>
        </aside>
      </div>
    </section>
  );
}
