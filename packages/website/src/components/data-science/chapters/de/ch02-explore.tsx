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
          hook="Vor <code>.fit()</code> Verteilungen, Fehlwerte, ungewöhnliche Beobachtungen, Beziehungen, Einheiten und Zeit prüfen. Ziel ist, Annahmen und Datenfehler zu erkennen, bevor sie in ein Modell gelangen."
          meta={[
            { k: "Themen", v: "Verteilungen · Ausreißer · Korrelationen" },
            { k: "Zeit", v: "10 min" },
            { k: "Simulationen", v: "3 interaktiv" },
            { k: "Stufe", v: "Grundlagen" },
          ]}
        />

        <SectionLabel n="01">Verteilungsformen</SectionLabel>
        <p className="prose">
          Ein Histogramm ist eine nützliche erste Ansicht einer numerischen
          Variable. Klassenwahl kann Struktur verdecken oder erzeugen; deshalb
          gehören Häufigkeiten, Quantile, empirische Verteilungsfunktion,
          Fehlwerte und fachlich gültige Bereiche dazu. Die Form allein macht
          keinen parametrischen Test gültig und bestimmt keine Transformation.
        </p>
        <p className="prose">
          <strong>Schiefe</strong> misst Asymmetrie. Positive Schiefe zieht den
          Mittelwert bei vielen üblichen Verteilungen über den Median, etwa bei
          Einkommen oder Latenz. <strong>Exzess-Kurtosis</strong> basiert auf
          dem vierten Moment und reagiert stark auf Extremwerte; allein
          beschreibt sie kein Randrisiko. Verändere N, um die
          Stichprobenvariabilität der Schätzungen zu beobachten.
        </p>
        <DistributionExplorer />
        <BestPractices
          title="Saubere Prüfung von Verteilungen"
          items={[
            "<b>Zusammenfassungen mit Diagrammen verbinden.</b> Ähnliche Mittelwerte und Varianzen können verschiedene Verteilungen, Nichtlinearität oder einflussreiche Beobachtungen verdecken.",
            "<b>Schiefe &gt; 1 als Prüfanlass behandeln, nicht als Regel.</b> Eine Log-Transformation verlangt positive Werte und muss Modellannahmen sowie Interpretation dienen.",
            "<b>Die Anzahl der Klassen variieren.</b> Die Freedman-Diaconis-Breite (∝ IQR · n<sup>−1/3</sup>) ist ein Ausgangspunkt; Empfindlichkeit gegenüber Klassengrenzen prüfen.",
            "<b>Mittelwert und Median vergleichen.</b> Eine große Differenz weist auf Schiefe oder starke Ausreißer hin.",
          ]}
        />

        <SectionLabel n="02">Ausreißererkennung</SectionLabel>
        <p className="prose">
          Ausreißer sind zunächst Beobachtungen, keine Fehler. Eine Transaktion
          mit dem 50-Fachen des üblichen Werts kann Betrug, ein Testkonto oder
          ein realer Großkunde sein. Der Ablauf lautet: erkennen, untersuchen,
          dann begründet entfernen, begrenzen oder getrennt modellieren.
        </p>
        <p className="prose">
          <strong>Z-Score</strong> misst den Abstand vom Mittelwert in Einheiten
          der Standardabweichung und reagiert auf Schiefe sowie Extremwerte.
          <strong>IQR-Grenzen</strong> nach Tukey mit 1.5 × IQR sind eine
          nichtparametrische visuelle Markierung, kein Beleg für einen Fehler.{" "}
          <strong>Isolation Forest</strong> teilt den Merkmalsraum zufällig;
          Anomalien benötigen weniger Teilungen und lassen sich auch in höheren
          Dimensionen erkennen. Die Güte hängt weiterhin von Stichprobe,
          Kontaminationsanteil, Merkmalsdarstellung und Abstimmung ab.
        </p>
        <OutlierDetector />
        <AntiPatterns
          title="Fehlmuster bei Ausreißern"
          items={[
            "<b>Ausreißer entfernen, um R² zu erhöhen.</b> Unterscheidungsstarke Beobachtungen ohne Untersuchung zu löschen verfälscht den Datensatz.",
            "<b>Nur Z-Scores auf schiefen Daten verwenden.</b> Mittelwert und Standardabweichung sind bereits in Richtung des langen Randes verschoben.",
            "<b>Mehrdimensionale Ausreißer einzeln je Variable prüfen.</b> Ein Punkt bei (x=1.5σ, y=1.5σ) kann auf jeder Achse unauffällig und im gemeinsamen 2D-Raum dennoch anomal sein; die Mahalanobis-Distanz erfasst diesen Fall.",
          ]}
        />

        <SectionLabel n="03">Korrelationsstruktur</SectionLabel>
        <p className="prose">
          Eine Korrelationsmatrix zeigt lineare Beziehungen zwischen allen
          Variablenpaaren. Sie macht redundante Merkmale sichtbar und liefert
          Hinweise auf fachliche Zusammenhänge, ohne Kausalität zu beweisen.
        </p>
        <p className="prose">
          Der Regler ergänzt in dieser konstruierten linearen Beziehung
          initialisiertes unabhängiges <strong>Messrauschen</strong>. Pearson r
          bewegt sich dadurch gegen 0. Das ist Abschwächung unter einem
          klassischen Messfehlermodell; andere Fehlermechanismen können anders
          verzerren. Disattenuation benötigt begründbare
          Reliabilitätsschätzungen.
        </p>
        <CorrelationMatrix />
        <AntiPatterns
          title="Fehlmuster bei Korrelationen"
          items={[
            "<b>Hohe Korrelation als Kausalität lesen.</b> Eine gemeinsame Ursache kann beide Variablen erklären. Kapitel 09 behandelt kausale Graphen.",
            "<b>Pearson r als allgemeines Abhängigkeitsmaß verwenden.</b> Eine symmetrische U-Form kann r nahe 0 haben. Diagramm prüfen und ein Maß passend zur Frage wählen; Spearman erfasst monotone, nicht jede nichtlineare Beziehung.",
            "<b>Multikollinearität ignorieren.</b> Stark zusammenhängende Prädiktoren können einzelne Koeffizienten linearer Modelle destabilisieren; die Wirkung hängt von Estimand, Stichprobe und Regularisierung ab.",
            "<b>Die Matrix ohne Streudiagramme interpretieren.</b> Ausreißer können Pearson r erzeugen oder zerstören.",
          ]}
        />
        <BestPractices
          title="Saubere Korrelationsanalyse"
          items={[
            "<b>Korrelationsmatrizen als Heatmap darstellen.</b> Gruppen hoher und niedriger Werte werden sofort sichtbar.",
            "<b>Für ordinale oder monotone Fragen Spearmans ρ erwägen.</b> Verteilungsannahmen betreffen die Inferenz; der Koeffizient muss zur gesuchten Beziehung passen.",
            "<b>Stark korrelierte Merkmale clustern.</b> Hierarchisches Clustering auf 1−|r| zeigt redundante Gruppen.",
            "<b>Starke Beziehungen zum Ziel von Beziehungen zwischen Eingangsmerkmalen trennen.</b> Letztere können Redundanz anzeigen.",
          ]}
        />

        <Takeaway
          title="Kernaussagen"
          items={[
            "<b>Diagramme und Kennzahlen beantworten verschiedene Fragen.</b> Klassensensitivität, Quantile, Fehlwerte, Bereiche und Fachgrenzen gemeinsam prüfen.",
            "<b>Ein Anomaliescore ist ein Prüfsignal.</b> Korrektur, Beibehaltung, Begrenzung oder Segmentierung benötigen Herkunft und Folgenabschätzung.",
            "<b>Pearson r misst linearen Zusammenhang.</b> Das zugrunde liegende Diagramm ergänzen und andere Maße nur passend zur Frage wählen.",
            "<b>Messfehler benötigen ein Modell.</b> Klassisches unabhängiges Rauschen schwächt Korrelation ab; systematische oder differentielle Fehler können anders wirken.",
            "<b>EDA nach wesentlichen Transformationen wiederholen.</b> Joins, Imputation und Merkmalserzeugung können Verteilungen und Datenqualität ändern.",
          ]}
        />
      </div>
    </DataScienceLocaleProvider>
  );
}
