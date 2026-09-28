import { DataScienceLocaleProvider } from "@/components/data-science/locale-context";
import {
  Hero,
  SectionLabel,
  AntiPatterns,
  BestPractices,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { DistributionExplorer } from "@/components/data-science/simulators/distribution-explorer";
import { OutlierDetector } from "@/components/data-science/simulators/outlier-detector";
import { CorrelationMatrix } from "@/components/data-science/simulators/correlation-matrix";

export default function Ch02ExploreDe() {
  return (
    <DataScienceLocaleProvider locale="de">
      <div className="chapter-root">
        <Hero
          eyebrow="Kapitel 02"
          title="Explorative Datenanalyse: <em>erst prüfen, dann modellieren.</em>"
          hook="Vor <code>.fit()</code> prüfst du Verteilungen, Fehlwerte, ungewöhnliche Beobachtungen, Beziehungen, Einheiten und Zeit. Datenfehler findest du hier am billigsten."
          meta={[
            { k: "Themen", v: "Verteilungen · Ausreißer · Korrelationen" },
            { k: "Zeit", v: "10 min" },
            { k: "Simulationen", v: "3 interaktiv" },
            { k: "Stufe", v: "Grundlagen" },
          ]}
        />

        <SectionLabel n="01">Verteilungsformen</SectionLabel>
        <p className="prose">
          Die Klassenwahl kann in einem Histogramm Struktur verdecken oder
          erfinden, deshalb gehören Häufigkeiten, Quantile, empirische
          Verteilungsfunktion, Fehlwerte und fachlich gültige Bereiche dazu. Die
          Form allein macht keinen parametrischen Test gültig und begründet
          keine Transformation.
        </p>
        <p className="prose">
          <strong>Schiefe</strong> misst Asymmetrie: Ein langer rechter Rand
          zieht den Mittelwert oft über den Median, etwa bei Einkommen oder Latenz.{" "}
          <strong>Exzess-Kurtosis</strong> basiert auf dem vierten Moment,
          reagiert heftig auf Extremwerte und beschreibt allein kein
          Randrisiko. Verändere N und sieh, wie stark die Schätzungen schwanken.
        </p>
        <DistributionExplorer />
        <BestPractices
          title="Saubere Prüfung von Verteilungen"
          items={[
            "<b>Kennzahl und Diagramm zusammen lesen.</b> Ähnliche Mittelwerte und Varianzen können verschiedene Verteilungen, Nichtlinearität oder einflussreiche Punkte verdecken.",
            "<b>Schiefe &gt; 1 ist ein Prüfanlass.</b> Eine Log-Transformation verlangt positive Werte und muss Modellannahmen und Interpretation dienen.",
            "<b>Die Anzahl der Klassen variieren.</b> Start mit der Freedman-Diaconis-Breite (∝ IQR · n<sup>−1/3</sup>) und prüf, wie sich das Bild mit den Klassengrenzen ändert.",
          ]}
        />

        <SectionLabel n="02">Ausreißererkennung</SectionLabel>
        <p className="prose">
          Ein Ausreißer ist zuerst eine Beobachtung. Eine Transaktion mit dem
          50-Fachen des üblichen Werts kann Betrug sein, ein Testkonto oder ein
          realer Großkunde. Erkennen, untersuchen und erst dann mit
          schriftlicher Begründung entfernen, begrenzen (winsorisieren) oder
          getrennt modellieren.
        </p>
        <p className="prose">
          <strong>Z-Score</strong> misst den Abstand vom Mittelwert in
          Standardabweichungen und reagiert auf Schiefe und Extremwerte.{" "}
          <strong>IQR-Grenzen</strong> nach Tukey mit 1.5 × IQR sind eine
          nichtparametrische visuelle Markierung, kein Beleg für einen Fehler.{" "}
          <strong>Isolation Forest</strong> teilt den Merkmalsraum zufällig und
          bewertet Punkte, die nach weniger Teilungen isoliert sind, als
          auffälliger; Stichprobe, Kontamination, Merkmale und Abstimmung
          bestimmen weiter die Güte.
        </p>
        <OutlierDetector />
        <AntiPatterns
          title="Fehlmuster bei Ausreißern"
          items={[
            "<b>Ausreißer löschen, bis R² schön aussieht.</b> Wer informative Beobachtungen ungeprüft entfernt, verfälscht die Daten.",
            "<b>Auf schiefen Daten nur mit Z-Scores arbeiten.</b> Der lange Rand verschiebt Mittelwert und Standardabweichung, also ordnet die Grenze Punkte falsch ein.",
            "<b>Mehrdimensionale Ausreißer einzeln je Variable prüfen.</b> Ein Punkt bei (x=1.5σ, y=1.5σ) kann auf jeder Achse unauffällig und in 2D trotzdem anomal sein; die Mahalanobis-Distanz erfasst das.",
          ]}
        />

        <SectionLabel n="03">Korrelationsstruktur</SectionLabel>
        <p className="prose">
          Eine Korrelationsmatrix zeigt lineare Beziehungen zwischen allen
          Variablenpaaren. Sie macht redundante Merkmale sichtbar und liefert
          Hinweise auf fachliche Zusammenhänge, ohne Kausalität zu beweisen.
        </p>
        <p className="prose">
          Der Regler legt unabhängiges <strong>Messrauschen</strong> auf die
          konstruierte lineare Beziehung, und Pearson r wandert gegen 0.
          So wirkt klassischer Messfehler; andere Fehler verzerren r anders. Wer
          r korrigieren will (Disattenuation), braucht begründete
          Reliabilitätsschätzungen.
        </p>
        <CorrelationMatrix />
        <AntiPatterns
          title="Fehlmuster bei Korrelationen"
          items={[
            "<b>Pearson r als allgemeines Abhängigkeitsmaß verwenden.</b> Eine symmetrische U-Form kann r nahe 0 haben. Prüf das Diagramm und wähl ein Maß passend zur Frage; Spearman erfasst nur monotone Beziehungen.",
            "<b>Multikollinearität übersehen.</b> Stark zusammenhängende Prädiktoren destabilisieren einzelne Koeffizienten linearer Modelle, je nach Estimand, Stichprobe und Regularisierung.",
          ]}
        />
        <BestPractices
          title="Saubere Korrelationsanalyse"
          items={[
            "<b>Für ordinale oder monotone Beziehungen Spearmans ρ nehmen.</b>",
            "<b>Stark korrelierte Merkmale clustern.</b> Hierarchisches Clustering auf 1−|r| zeigt redundante Gruppen.",
            "<b>Beziehungen zum Ziel und zwischen Eingangsmerkmalen trennen.</b> Letztere können Redundanz anzeigen.",
          ]}
        />

        <Takeaway
          title="Kernaussagen"
          items={[
            "<b>EDA nach wesentlichen Transformationen wiederholen.</b> Joins, Imputation und Merkmalserzeugung können Verteilungen und Datenqualität ändern.",
          ]}
        />
      </div>
    </DataScienceLocaleProvider>
  );
}
