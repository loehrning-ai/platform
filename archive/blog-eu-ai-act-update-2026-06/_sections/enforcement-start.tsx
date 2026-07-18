// HUMAN-AUTHORED ONLY — do not generate with an LLM. Tim reviews before this stage is marked complete.

import { getLegalClaim } from "@/lib/legal-registry";

const generalApp = getLegalClaim("ai-act-general-application-2026-08-02");
const gpaiApp = getLegalClaim("ai-act-gpai-application-2025-08-02");
const standAloneHighRisk = getLegalClaim(
  "ai-act-high-risk-areas-adopted-2027-12-02",
);
const productHighRisk = getLegalClaim(
  "ai-act-product-embedded-high-risk-2028-08-02",
);

export function EnforcementStart() {
  return (
    <section className="post-section">
      <h2 className="post-section__title">
        Was ab dem 2. August 2026 gilt, ein Überblick
      </h2>
      <p>
        Art. 113 der ursprünglichen Verordnung nennt den 2. August 2026 als
        allgemeinen Anwendungsbeginn. Das bedeutet nicht, dass an diesem Tag
        sämtliche Regeln gleichzeitig greifen: Art. 4, Art. 5 und die
        GPAI-Anbieterpflichten gelten bereits; Hochrisiko-Regeln folgen nach
        einem gesonderten Zeitplan.
      </p>
      <p>
        Was konkret gilt ab dem {generalApp?.displayDateDE ?? "2. August 2026"}:
        (Quelle: Art. 113, Verordnung (EU) 2024/1689; Europäische Kommission,
        KI-Zeitplan)
      </p>
      <ul className="post-list">
        <li>
          <strong>Transparenzpflichten (Artikel 50):</strong> Systeme zur
          direkten Interaktion müssen Menschen grundsätzlich über die
          KI-Interaktion informieren. Anbieter generativer Systeme müssen
          erfasste Ausgaben maschinenlesbar kennzeichnen; Betreiber müssen
          unter den Voraussetzungen des Art. 50 unter anderem Deepfakes und
          bestimmte Texte von öffentlichem Interesse offenlegen. Ausnahmen
          und Rollen unterscheiden sich je Absatz.
        </li>
        <li>
          <strong>GPAI-Durchsetzung:</strong> Die GPAI-Anbieterpflichten gelten
          bereits seit 2. August 2025. Ab 2. August 2026 kann die Kommission
          diese Pflichten einschließlich der Bußgeldregeln durchsetzen.
        </li>
        <li>
          <strong>Aufsicht, Beschwerden und Sanktionen:</strong> Art. 85 gibt
          Personen ein Beschwerderecht bei der zuständigen
          Marktüberwachungsbehörde. Die konkrete deutsche Zuständigkeit und
          ein tatsächlich nutzbarer Beschwerdeweg müssen anhand des
          verkündeten KI-MIG und der veröffentlichten Behördeninformationen
          geprüft werden. Der Bundestag beschloss das KI-MIG am 11. Juni 2026;
          nach dem Bundesratsdurchgang am 10. Juli war die Verkündung am
          14. Juli noch abzuwarten.
        </li>
      </ul>
      <p>
        Für Hochrisiko-KI ist der Rechtsstand zweistufig. Die ursprüngliche
        Verordnung enthält ihren eigenen Art.-113-Zeitplan. Parlament und Rat
        haben die AI-Omnibus-Änderung inzwischen beschlossen: eigenständige
        Anhang-III-Systeme ab{" "}
        {standAloneHighRisk?.displayDateDE ?? "2. Dezember 2027"},
        produktintegrierte Systeme ab{" "}
        {productHighRisk?.displayDateDE ?? "2. August 2028"}. Am 14. Juli 2026
        wartete die Änderungsverordnung noch auf Unterzeichnung und
        Veröffentlichung im Amtsblatt. Die neuen Daten waren daher
        beschlossen, aber noch nicht in Kraft.
      </p>
      <p className="post-note">
        GPAI-Pflichten (Artikel 51&ndash;56) für Anbieter großer Sprachmodelle
        gelten bereits seit {gpaiApp?.displayDateDE ?? "2. August 2025"}; der
        August 2026 ist nicht der Starttermin für GPAI. (Quelle: Verordnung
        (EU) 2024/1689 Art. 113)
      </p>
    </section>
  );
}
