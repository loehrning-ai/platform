import dynamic from "next/dynamic";
import { createElement, type ComponentType } from "react";
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
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { useDemoLocale } from "./demo-locale";

/**
 * Lazy-loaded demo component registry.
 *
 * Keyed by Demo.slug. Each demo is split into its own chunk via next/dynamic
 * with `ssr: false` to avoid server-render cost for interactive widgets.
 */
const LoadingPlaceholder = () => {
  const { locale } = useDemoLocale();
  return createElement(
    "div",
    {
      role: "status",
      "aria-live": "polite",
      className: "py-8 text-center text-sm text-muted-foreground",
    },
    DEMOS_PAGE_COPY[locale].shell.loading,
  );
};

/** Small static thumbnail components shown inside gallery tiles. */
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

export const demoComponents: Readonly<Record<string, ComponentType>> = {
  excel: dynamic(() => import("./excel-demo"), { ssr: false, loading: LoadingPlaceholder }),
  word: dynamic(() => import("./word-demo"), { ssr: false, loading: LoadingPlaceholder }),
  "outbound-workflow": dynamic(() => import("./outbound-workflow-demo"), {
    ssr: false,
    loading: LoadingPlaceholder,
  }),
  "agent-pipeline": dynamic(() => import("./agent-pipeline-demo"), {
    ssr: false,
    loading: LoadingPlaceholder,
  }),
  "n8n-supply-chain": dynamic(() => import("./n8n-supply-chain-demo"), {
    ssr: false,
    loading: LoadingPlaceholder,
  }),
  "rag-vertragsassistent": dynamic(() => import("./rag-vertragsassistent-demo"), {
    ssr: false,
    loading: LoadingPlaceholder,
  }),
  "rechnung-zu-sap": dynamic(() => import("./rechnung-zu-sap-demo"), {
    ssr: false,
    loading: LoadingPlaceholder,
  }),
  "prompt-scanner": dynamic(() => import("./prompt-scanner-demo"), {
    ssr: false,
    loading: LoadingPlaceholder,
  }),
  "cost-drift-observability": dynamic(() => import("./cost-drift-observability-demo"), {
    ssr: false,
    loading: LoadingPlaceholder,
  }),
  "fine-tune-playground": dynamic(() => import("./fine-tune-playground-demo"), {
    ssr: false,
    loading: LoadingPlaceholder,
  }),
  "roi-rechner": dynamic(() => import("./roi-rechner-demo"), {
    ssr: false,
    loading: LoadingPlaceholder,
  }),
  "llm-observability": dynamic(() => import("./llm-observability-demo"), {
    ssr: false,
    loading: LoadingPlaceholder,
  }),
};

export function getDemoComponent(slug: string): ComponentType | undefined {
  return demoComponents[slug];
}
