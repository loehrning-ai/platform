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
        hook="Ein öffentlicher Datensatz mit 284,807 Transaktionen und 492 erfassten Betrugsfällen. Exploration, Leakage-Kontrolle, Evaluation, Schwellenwertpolitik und Deployment-Prüfung werden verbunden, ohne die Lehrsimulation als Produktionsmodell auszugeben."
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
          Der öffentliche Credit-Card-Fraud-Datensatz eignet sich zur Analyse
          von starkem Klassenungleichgewicht, anonymisierten Eingaben und
          Evaluationsentscheidungen. Eine Basislinie, die alles als legitim
          vorhersagt, <strong>99.83% Genauigkeit</strong> erreicht und keinen
          Betrugsfall erkennt. Genauigkeit allein verdeckt diesen Fehler. PR-AUC
          beschreibt die Rangfolge bei ungleichen Klassen; ein operativer
          Schwellenwert benötigt zusätzlich Kosten, Kapazität, Kalibrierung und
          eine zeitgerechte Validierung.
        </p>
        <DatasetExplorer />
      </section>

      <section className="section">
        <SectionLabel n="12.2">Die Pipeline, Schritt für Schritt</SectionLabel>
        <h2 className="h2">
          Sechs Entscheidungen. Jede entspricht einem Kapitel dieses Kurses.
        </h2>
        <p className="prose">
          Jeden Pipeline-Schritt in Reihenfolge ausführen. Die Ausgabe eines
          Schritts wird zur Eingabe des nächsten. Das Protokoll zeigt, wo
          Leakage entstehen kann. Der klassische Fehler ist die Skalierung vor
          dem Split; diese lokale Sequenz verhindert genau diesen Fehler, prüft
          aber keine reale Pipeline.
        </p>
        <PipelineProgress />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Den Scaler am vollständigen Datensatz anpassen.</b> Der Scaler wird nur am Training angepasst und dann auf den Test angewendet. Eine Anpassung an allen Daten überträgt Teststatistiken ins Training.",
          "<b>Nach der Skalierung stratifizieren.</b> Zuerst aufteilen, danach skalieren. Die Reihenfolge ist relevant.",
          "<b>Nur Genauigkeit verwenden.</b> Bei einer Ereignisrate von 0.17% sieht eine triviale Mehrheitsvorhersage genau aus. Ranking, Kalibrierung, Schwellenwerte und Kosten ergänzen.",
          "<b>Verfahren für Klassenungleichgewicht ungeprüft lassen.</b> Gewichtung, Resampling, Schwellenwertwahl und geeignete Zielfunktionen innerhalb des Validierungsdesigns vergleichen; kein einzelnes Verfahren ist vorgeschrieben.",
        ]}
      />
      <BestPractices
        title="Bewährte Verfahren"
        items={[
          "<b>Vor erlernter Vorverarbeitung aufteilen.</b> Transformationen innerhalb der Validierung auf dem Trainingsanteil anpassen und anschließend auf zurückgehaltene Daten anwenden.",
          "<b>scale_pos_weight = N_legit / N_fraud als Kandidat behandeln, nicht als Regel.</b> Gewichtung und Wahrscheinlichkeitskalibrierung am Entscheidungsziel validieren.",
          "<b>Ranking, Kalibrierung und operativen Schwellenwert getrennt bewerten.</b> Den Schwellenwert aus expliziten Fehlerkosten und Betriebskapazität ableiten.",
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
          Jedes Betrugsmodell erzeugt je Transaktion einen
          Wahrscheinlichkeitswert. Der Grenzwert wird fachlich festgelegt. Zu
          niedrig: Viele legitime Kunden werden als Betrugsfälle markiert und
          die Betriebskosten steigen. Zu hoch: Echte Betrugsfälle bleiben
          unentdeckt und verursachen Umsatz- sowie Reputationsschäden.
          <strong>
            {" "}
            Der Kostenrechner untersucht dieses synthetische Kostenmodell; reale
            Entscheidungen benötigen geprüfte Fachannahmen.
          </strong>
        </p>
        <PrecisionRecallTradeoff />
      </section>

      <section className="section">
        <SectionLabel n="12.4">
          Bereitstellung in Produktion: die Checkliste
        </SectionLabel>
        <h2 className="h2">
          Ein Modell im Notebook ist eine Demo. Ein Modell in Produktion ist ein
          Engineering-System.
        </h2>
        <p className="prose">
          Bevor ein Betrugsmodell eine Live-Transaktion beeinflusst, muss für
          die relevanten Prüffelder Evidenz vorliegen. Diese acht Lehrpunkte
          stoßen die Prüfung an; Häkchen im Browser beseitigen keinen
          Fehlermodus und genehmigen kein Deployment.
        </p>
        <PostDeployChecklist />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Keine repräsentative Evidenz vor der Freigabe.</b> Replay, Batch-Auswertung, Shadow oder gestufte Exposition anhand von Risiko und Datenbeschränkungen wählen.",
          "<b>Keine Modelldokumentation.</b> Zweck, Ausschlüsse, Trainings- und Evaluationsdaten, Metriken, Schwellenwerte, Verantwortliche, Grenzen und bekannte Fehlermuster festhalten.",
          "<b>Kein Monitoring-Vertrag.</b> Betrugsmuster, Eingabequalität, Label-Verzögerung und Betriebskosten können sich ändern; jedes Signal benötigt Verantwortliche und Reaktion.",
          "<b>Ein ungeprüfter dauerhafter Schwellenwert.</b> Nach wesentlichen Änderungen von Kosten, Prävalenz, Kalibrierung, Regeln oder Kapazität in dokumentiertem Rhythmus neu bewerten.",
        ]}
      />
      <BestPractices
        title="Bewährte Verfahren"
        items={[
          "<b>Rollout-Evidenz aus dem Risiko ableiten.</b> Repräsentativen Verkehr, Beobachtungsdauer, verzögerte Labels, Leitplanken und Abbruchverhalten statt einer festen Shadow-Frist definieren.",
          "<b>Unveränderliche Kandidaten gegen einen schriftlichen Vertrag freigeben.</b> Unsicherheitsbewusste Ergebnismetriken und Sicherheitsleitplanken verlangen, kein festes Sprint-Ritual.",
          "<b>Alarmgrenzen an Auswirkungen auf Geschäft und Nutzer koppeln.</b> Quantile und Driftstatistiken sind Eingaben, keine selbstbegründenden Aktionsgrenzen.",
          "<b>Model Cards als Dokumentation verwenden, nicht als Compliance-Nachweis.</b> Anwendbare rechtliche und Governance-Pflichten benötigen eine separate systemspezifische Prüfung.",
        ]}
      />
      <Takeaway
        title="Kernaussagen"
        items={[
          "<b>Klassenungleichgewicht verändert die Aussage von Metriken.</b> Basisrate angeben und Ranking, Kalibrierung sowie Schwellenwertverhalten neben Genauigkeit prüfen.",
          "<b>Erlernte Vorverarbeitung gehört in die Validierung.</b> Leakage kann Offline-Werte erhöhen; Herkunftsnachweise und zeitgerechte Tests können es vor der Freigabe erkennen.",
          "<b>Der Schwellenwert kodiert Konsequenzen.</b> Aus Kosten, Kapazität, Regeln und kalibrierten Wahrscheinlichkeiten ableiten und danach überwachen.",
          "<b>Produktionsleistung ist Systemverhalten.</b> Modellgüte, Merkmale, Dienste, Datenverträge, Monitoring, Incident Response und Rollback tragen gemeinsam bei.",
          "<b>Nach wesentlichen Änderungen neu bewerten.</b> Neue Daten, Betrugsmuster, Kosten, Regeln und Infrastruktur können die frühere Entscheidung entkräften.",
        ]}
      />

      <div className="ov-cta-band" style={{ marginTop: 40 }}>
        <div className="ov-cta-eyebrow">Der Kurs ist abgeschlossen.</div>
        <div className="ov-cta-title">Jetzt ein reales Problem bearbeiten.</div>
        <div className="ov-cta-sub">
          Einen realen Datensatz wählen, den vollständigen Zyklus durchlaufen
          und v1 ausliefern. Danach anhand der Beobachtungen weiterarbeiten.
          Data Science wird durch die Arbeit an einem relevanten Problem
          gelernt.
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
