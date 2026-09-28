"use client";

import { type JSX } from "react";
import {
  InteractiveDiagram,
  type DiagramNode,
  type InteractiveDiagramCopy,
} from "./interactive-diagram";

/**
 * Diagram presets (shared course architecture). Pre-filled `InteractiveDiagram`s with the
 * canonical EU-AI-Act German content, ported from the GitHub course canvas
 * widgets:
 *   - RiskPyramidDiagram  ← StackFlow (`data-widgets.js:47`) → the four risk
 *     tiers, highest risk at the top.
 *   - ObligationLayersDiagram ← LayerCake (`Ch0_StackSims.js:12`) → the layered
 *     obligation stack a Hochrisiko system must satisfy, with "what breaks if
 *     this layer is missing" detail panels.
 *
 * Both accept the same checkpoint props as the primitive, with sensible
 * defaults, so a lesson author can drop them in via `props: { lessonId, cpId }`.
 *
 * German copy throughout. No em dashes.
 */

export interface DiagramPresetProps {
  readonly lessonId?: string;
  readonly cpId?: string;
  readonly reducedMotion?: boolean;
  readonly title?: string;
  readonly caption?: string;
  readonly nodes?: readonly DiagramNode[];
  readonly copy?: Partial<InteractiveDiagramCopy>;
}

// ─── Risk pyramid (StackFlow → stack variant) ────────────────────

/** The four EU AI Act risk tiers, highest risk first. */
export const RISK_PYRAMID_NODES: readonly DiagramNode[] = [
  {
    id: "verboten",
    label: "Verbotene Praktiken",
    sub: "Social Scoring, manipulatives Verhalten, biometrische Massenüberwachung",
    weight: 1,
  },
  {
    id: "hochrisiko",
    label: "Hochrisiko-Systeme",
    sub: "KI in Personalauswahl, Kreditvergabe, kritischer Infrastruktur",
    weight: 0.78,
  },
  {
    id: "transparenz",
    label: "Transparenzpflichten",
    sub: "Chatbots, generierte Bilder und Texte: Kennzeichnungspflicht",
    weight: 0.5,
  },
  {
    id: "minimal",
    label: "Minimales Risiko",
    sub: "Spamfilter, KI im Lager, Empfehlungen: keine besonderen Pflichten aus dem AI Act",
    weight: 0.32,
  },
];

export function RiskPyramidDiagram({
  lessonId,
  cpId,
  reducedMotion,
  title = "Die Risikopyramide des EU AI Act",
  caption = "Oben die strengste Stufe, unten die freieste.",
  nodes = RISK_PYRAMID_NODES,
  copy,
}: DiagramPresetProps): JSX.Element {
  return (
    <InteractiveDiagram
      variant="stack"
      nodes={nodes}
      title={title}
      caption={caption}
      lessonId={lessonId}
      cpId={cpId}
      reducedMotion={reducedMotion}
      copy={{ kindLabel: "Risikokarte", ...copy }}
    />
  );
}

// ─── Obligation layers (LayerCake → compare variant) ─────────────

/**
 * The obligation layers a Hochrisiko-System muss erfüllen. Each carries a
 * detail line plus a "Wenn diese Schicht fehlt" consequence (the LayerCake
 * failure-mode idea), so learners see why each layer exists.
 */
export const OBLIGATION_LAYER_NODES: readonly DiagramNode[] = [
  {
    id: "risikomanagement",
    label: "Risikomanagement",
    sub: "Fortlaufender Prozess über den gesamten Lebenszyklus",
    detail: "Ein dokumentierter Prozess erkennt, bewertet und mindert Risiken.",
    consequence:
      "Risiken fallen erst auf, wenn etwas schiefgeht. Den übrigen Pflichten fehlt die Grundlage.",
    weight: 1,
  },
  {
    id: "daten",
    label: "Daten-Governance",
    sub: "Trainings-, Validierungs- und Testdaten geprüft auf Qualität und Bias",
    detail:
      "Daten müssen relevant, repräsentativ und möglichst fehlerfrei sein. Bias und Lücken werden gesucht und behandelt.",
    consequence:
      "Das Modell lernt verzerrte Muster. Diskriminierung bleibt unentdeckt, bis Betroffene sich beschweren.",
    weight: 0.85,
  },
  {
    id: "dokumentation",
    label: "Technische Dokumentation",
    sub: "Zweck, Architektur, Datenherkunft, Leistungsgrenzen nachvollziehbar",
    detail:
      "Damit prüft eine Behörde die Konformität. Sie entsteht vor der Markteinführung und wird gepflegt.",
    consequence: "Bei einer Kontrolle fehlt jeder Nachweis.",
    weight: 0.72,
  },
  {
    id: "protokollierung",
    label: "Protokollierung",
    sub: "Automatische Logs über die Lebensdauer des Systems",
    detail: "Ergebnisse bleiben rückverfolgbar, Vorfälle lassen sich untersuchen.",
    consequence:
      "Eine Fehlentscheidung lässt sich nicht rekonstruieren, also weder korrigieren noch belegen.",
    weight: 0.6,
  },
  {
    id: "aufsicht",
    label: "Menschliche Aufsicht",
    sub: "Ein Mensch kann eingreifen, übersteuern oder abschalten",
    detail:
      "Die Verantwortung bleibt bei Menschen. Sie verstehen die Ausgabe und kennen die Grenzen des Systems.",
    consequence:
      "Niemand fängt offensichtliche Fehler automatisierter Entscheidungen ab.",
    weight: 0.46,
  },
  {
    id: "genauigkeit",
    label: "Genauigkeit und Robustheit",
    sub: "Messbare Leistung, Schutz gegen Manipulation und Cyberangriffe",
    detail:
      "Das System ist angemessen genau und bleibt bei Angriffen oder fehlerhaften Eingaben stabil.",
    consequence: "Schon kleine Störungen kippen das Ergebnis.",
    weight: 0.32,
  },
];

export function ObligationLayersDiagram({
  lessonId,
  cpId,
  reducedMotion,
  title = "Die Pflichten eines Hochrisiko-Systems",
  caption = "Was jede Pflicht verlangt und was passiert, wenn sie fehlt.",
  nodes = OBLIGATION_LAYER_NODES,
  copy,
}: DiagramPresetProps): JSX.Element {
  return (
    <InteractiveDiagram
      variant="compare"
      nodes={nodes}
      title={title}
      caption={caption}
      lessonId={lessonId}
      cpId={cpId}
      reducedMotion={reducedMotion}
      copy={copy}
    />
  );
}

export default RiskPyramidDiagram;
