import dynamic from "next/dynamic";
import { createElement, type ComponentType } from "react";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { useDemoLocale } from "./demo-locale";
import PromptScannerLoader from "./prompt-scanner-loader";

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

export const demoComponents: Readonly<Record<string, ComponentType>> = {
  excel: dynamic(() => import("./excel-demo"), {
    ssr: false,
    loading: LoadingPlaceholder,
  }),
  word: dynamic(() => import("./word-demo"), {
    ssr: false,
    loading: LoadingPlaceholder,
  }),
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
  "rag-vertragsassistent": dynamic(
    () => import("./rag-vertragsassistent-demo"),
    {
      ssr: false,
      loading: LoadingPlaceholder,
    },
  ),
  "rechnung-zu-sap": dynamic(() => import("./rechnung-zu-sap-demo"), {
    ssr: false,
    loading: LoadingPlaceholder,
  }),
  // The loader is deliberately small and server-renderable. Keeping it in the
  // initial shell avoids a second, late loading state while the substantial
  // scanner itself remains gated by the loader's IntersectionObserver.
  "prompt-scanner": PromptScannerLoader,
  "cost-drift-observability": dynamic(
    () => import("./cost-drift-observability-demo"),
    {
      ssr: false,
      loading: LoadingPlaceholder,
    },
  ),
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
