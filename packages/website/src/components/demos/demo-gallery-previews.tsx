import { DemoPoster } from "./demo-poster";

/*
 * Gallery previews: one flat IDEA poster per demo (SPEC §3.12), drawn by
 * DemoPoster inside the tile's `plakat-idea` panel. Kobalt mass, one
 * Himbeere shape, no text and no UI chrome. Every preview renders inside the
 * tile's aria-hidden panel, so it carries no meaning of its own: the tile's
 * heading and link name the demo, and no mark is told apart by hue.
 */

export function ExcelPreview() {
  return <DemoPoster slug="excel" />;
}

export function WordPreview() {
  return <DemoPoster slug="word" />;
}

export function OutboundWorkflowPreview() {
  return <DemoPoster slug="outbound-workflow" />;
}

export function AgentPipelinePreview() {
  return <DemoPoster slug="agent-pipeline" />;
}

export function N8nSupplyChainPreview() {
  return <DemoPoster slug="n8n-supply-chain" />;
}

export function RagVertragsassistentPreview() {
  return <DemoPoster slug="rag-vertragsassistent" />;
}

export function RechnungZuSapPreview() {
  return <DemoPoster slug="rechnung-zu-sap" />;
}

export function PromptScannerPreview() {
  return <DemoPoster slug="prompt-scanner" />;
}

export function CostDriftObservabilityPreview() {
  return <DemoPoster slug="cost-drift-observability" />;
}

export function FineTunePlaygroundPreview() {
  return <DemoPoster slug="fine-tune-playground" />;
}

export function RoiRechnerPreview() {
  return <DemoPoster slug="roi-rechner" />;
}

export function LlmObservabilityPreview() {
  return <DemoPoster slug="llm-observability" />;
}
