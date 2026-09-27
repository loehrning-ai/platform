"use client";

import Link from "next/link";
import { DataScienceLocaleProvider } from "@/components/data-science/locale-context";
import {
  AntiPatterns,
  BestPractices,
  Hero,
  SectionLabel,
  Takeaway,
} from "@/components/data-science/shared/primitives";
import { DatasetExplorer } from "@/components/data-science/simulators/dataset-explorer";
import { PipelineProgress } from "@/components/data-science/simulators/pipeline-progress";
import { PostDeployChecklist } from "@/components/data-science/simulators/post-deploy-checklist";
import { PrecisionRecallTradeoff } from "@/components/data-science/simulators/precision-recall-tradeoff";
import { dsChapterHref } from "@/lib/data-science/routes";

export default function Ch12CapstoneDe() {
  return (
    <DataScienceLocaleProvider locale="de">
      <Hero
        eyebrow="Kapitel 12 · Abschlussprojekt"
        title='<em>Kreditkartenbetrug erkennen:</em> <span class="accent">der vollständige Data-Science-Zyklus.</span>'
        hook="Ein öffentlicher Datensatz mit 284,807 Transaktionen und 492 erfassten Betrugsfällen verbindet Exploration, Leakage-Kontrolle, Evaluation, Schwellenwertpolitik und Deployment-Prüfung."
        meta={[
          { k: "Datensatz", v: "Kaggle · 284K Transaktionen" },
          { k: "Ziel", v: "Betrug · 0.17% Basisrate" },
          { k: "Simulationen", v: "4 interaktive" },
        ]}
      />

      <section className="section">
        <SectionLabel n="12.1">Die Daten und ihre Schwierigkeit</SectionLabel>
        <h2 className="h2">
          284,807 Transaktionen. 492 erfasste Betrugsfälle. Rund 578 legitime
          Fälle je Betrugsfall.
        </h2>
        <p className="prose">
          Der öffentliche Credit-Card-Fraud-Datensatz verbindet starkes
          Klassenungleichgewicht, anonymisierte Eingaben und harte
          Evaluationsentscheidungen. Eine Basislinie, die alles als legitim
          vorhersagt, erreicht <strong>99.83% Genauigkeit</strong> und erkennt
          keinen Betrugsfall. PR-AUC beschreibt die Rangfolge bei ungleichen
          Klassen; der operative Schwellenwert braucht zusätzlich Kosten,
          Kapazität, Kalibrierung und zeitgerechte Validierung.
        </p>
        <DatasetExplorer />
      </section>

      <section className="section">
        <SectionLabel n="12.2">Die Pipeline, Schritt für Schritt</SectionLabel>
        <h2 className="h2">
          Sechs Schritte, jeder mit einer Entscheidung aus dem Kurs.
        </h2>
        <p className="prose">
          Das Protokoll zeigt, wo Leakage entstehen kann; der Klassiker ist die
          Skalierung vor dem Split. Die Demo zeigt die Skalierung zuerst, passt
          den Scaler aber nur auf dem Trainingsanteil an und prüft keine reale
          Pipeline.
        </p>
        <PipelineProgress />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Verfahren für Klassenungleichgewicht ungeprüft lassen.</b> Vergleich Gewichtung, Resampling, Schwellenwertwahl und geeignete Zielfunktionen im Validierungsdesign; kein einzelnes Verfahren ist vorgeschrieben.",
        ]}
      />
      <BestPractices
        title="Bewährte Verfahren"
        items={[
          "<b>Vor erlernter Vorverarbeitung aufteilen.</b> Transformationen innerhalb der Validierung auf dem Trainingsanteil anpassen und dann auf zurückgehaltene Daten anwenden; ein auf allen Daten angepasster Scaler überträgt Teststatistiken.",
          "<b>scale_pos_weight = N_legit / N_fraud als Kandidat behandeln.</b> Gewichtung und Wahrscheinlichkeitskalibrierung am Entscheidungsziel validieren.",
          "<b>Ranking, Kalibrierung und operativen Schwellenwert getrennt bewerten.</b> Bei 0.17% Ereignisrate sieht Genauigkeit allein selbst für eine triviale Vorhersage gut aus.",
          "<b>Jedes Experiment erfassen.</b> Daten- und Codeversionen, Parameter, Metriken, Artefakte und Entscheidungsnotizen in einem reproduzierbaren Tracking-System speichern.",
        ]}
      />

      <section className="section">
        <SectionLabel n="12.3">
          Abwägung zwischen Präzision und Recall: Schwellenwert wählen
        </SectionLabel>
        <h2 className="h2">
          Der Schwellenwert ist eine gemeinsame statistische, operative und
          fachliche Entscheidung.
        </h2>
        <p className="prose">
          Ein Betrugsmodell bewertet jede Transaktion, und du legst den
          Grenzwert fest. Ist er zu niedrig, prüft das Betrugsteam viele
          legitime Kunden, und das kostet; ist er zu hoch, kostet echter Betrug
          Umsatz und Ruf.
          <strong>
            {" "}
            Der Kostenrechner nutzt ein synthetisches Kostenmodell; reale
            Entscheidungen brauchen geprüfte Fachannahmen.
          </strong>
        </p>
        <PrecisionRecallTradeoff />
      </section>

      <section className="section">
        <SectionLabel n="12.4">
          Bereitstellung in Produktion: die Checkliste
        </SectionLabel>
        <h2 className="h2">
          Vor dem ersten Live-Einsatz sammelst du Evidenz für jedes Prüffeld.
        </h2>
        <p className="prose">
          Diese acht Lehrpunkte stoßen die Prüfung
          an; ein Häkchen beseitigt keinen Fehlermodus und genehmigt kein
          Deployment.
        </p>
        <PostDeployChecklist />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Keine Modelldokumentation.</b> Zweck, Ausschlüsse, Trainings- und Evaluationsdaten, Metriken, Schwellenwerte, Verantwortliche, Grenzen und bekannte Fehlermuster festhalten; eine Model Card belegt keine rechtliche Konformität; rechtliche Pflichten brauchen eine eigene, systemspezifische Prüfung.",
          "<b>Kein Monitoring-Vertrag.</b> Betrugsmuster, Eingabequalität, Label-Verzögerung und Betriebskosten ändern sich; jedes Signal braucht Verantwortliche und eine Reaktion.",
          "<b>Ein dauerhafter Schwellenwert, den niemand prüft.</b> In dokumentiertem Rhythmus nach wesentlichen Änderungen von Kosten, Prävalenz, Kalibrierung, Regeln oder Kapazität neu bewerten.",
        ]}
      />
      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Modellgüte, Merkmale, Dienste, Datenverträge, Monitoring, Incident Response und Rollback bestimmen gemeinsam die Leistung in Produktion.</b>",
        ]}
      />

      <div className="ov-cta-band" style={{ marginTop: 40 }}>
        <div className="ov-cta-eyebrow">Der Kurs ist abgeschlossen.</div>
        <div className="ov-cta-title">Jetzt ein reales Problem bearbeiten.</div>
        <div className="ov-cta-sub">
          Such dir einen echten Datensatz, der dich interessiert, lauf den
          Zyklus einmal ganz durch, liefer v1 aus und verbessere, was du
          beobachtest.
        </div>
        <div className="ov-cta-row">
          <Link
            className="btn btn-primary ov-cta-btn"
            href={dsChapterHref("home")}
          >
            Zurück zum Überblick &nbsp;↺
          </Link>
        </div>
      </div>
    </DataScienceLocaleProvider>
  );
}
