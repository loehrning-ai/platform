import type { ComponentType } from "react";
import {
  AgentPipelinePreview,
  CostDriftObservabilityPreview,
  ExcelPreview,
  FineTunePlaygroundPreview,
  LlmObservabilityPreview,
  N8nSupplyChainPreview,
  OutboundWorkflowPreview,
  PromptScannerPreview,
  RagVertragsassistentPreview,
  RechnungZuSapPreview,
  RoiRechnerPreview,
  WordPreview,
} from "./demo-gallery-previews";

/** Static faux-UI thumbnails used only by the gallery route. */
export const galleryPreviews: Readonly<Record<string, ComponentType>> = {
  excel: ExcelPreview,
  word: WordPreview,
  "outbound-workflow": OutboundWorkflowPreview,
  "agent-pipeline": AgentPipelinePreview,
  "n8n-supply-chain": N8nSupplyChainPreview,
  "rag-vertragsassistent": RagVertragsassistentPreview,
  "rechnung-zu-sap": RechnungZuSapPreview,
  "prompt-scanner": PromptScannerPreview,
  "cost-drift-observability": CostDriftObservabilityPreview,
  "fine-tune-playground": FineTunePlaygroundPreview,
  "roi-rechner": RoiRechnerPreview,
  "llm-observability": LlmObservabilityPreview,
};

export function getGalleryPreview(slug: string): ComponentType | undefined {
  return galleryPreviews[slug];
}
