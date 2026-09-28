import dynamic from "next/dynamic";
import { createElement, type ComponentType, type ReactElement } from "react";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { useDemoLocale } from "./demo-locale";
import PromptScannerLoader from "./prompt-scanner-loader";
import RagVertragsassistentFirstFrame from "./rag-vertragsassistent-first-frame";

/**
 * Lazy-loaded demo component registry.
 *
 * Keyed by Demo.slug. Each demo is split into its own chunk via next/dynamic
 * with `ssr: false` to avoid server-render cost for interactive widgets.
 */

/**
 * The height each engine takes once loaded, measured in its shell per locale
 * at 390px (phone), 768px (sm) and 1024px and up (lg). The server-rendered
 * loading state holds that height, so the notes below the demo stay where
 * they are when the engine takes over (it pushed them down by 400 to 1,400px
 * before). Class strings stay literal so Tailwind finds them. Re-measure
 * after an engine's opening layout changes.
 */
const RESERVED_HEIGHT: Readonly<Record<string, { readonly de: string; readonly en: string }>> = {
  excel: {
    de: "min-h-[778px] sm:min-h-[648px]",
    en: "min-h-[758px] sm:min-h-[648px]",
  },
  word: {
    de: "min-h-[761px] sm:min-h-[689px] lg:min-h-[654px]",
    en: "min-h-[678px] sm:min-h-[645px] lg:min-h-[620px]",
  },
  "outbound-workflow": {
    de: "min-h-[1524px] sm:min-h-[923px] lg:min-h-[789px]",
    en: "min-h-[1197px] sm:min-h-[671px] lg:min-h-[641px]",
  },
  "agent-pipeline": {
    de: "min-h-[1242px] sm:min-h-[674px] lg:min-h-[632px]",
    en: "min-h-[1147px] sm:min-h-[674px] lg:min-h-[632px]",
  },
  "n8n-supply-chain": {
    de: "min-h-[1021px] sm:min-h-[976px] lg:min-h-[893px]",
    en: "min-h-[1001px] sm:min-h-[960px] lg:min-h-[893px]",
  },
  "rechnung-zu-sap": {
    de: "min-h-[1301px] sm:min-h-[767px] lg:min-h-[620px]",
    en: "min-h-[1303px] sm:min-h-[717px] lg:min-h-[620px]",
  },
  "cost-drift-observability": {
    de: "min-h-[988px] sm:min-h-[691px] lg:min-h-[658px]",
    en: "min-h-[967px] sm:min-h-[676px] lg:min-h-[658px]",
  },
  "fine-tune-playground": {
    de: "min-h-[972px] sm:min-h-[621px] lg:min-h-[620px]",
    en: "min-h-[948px] sm:min-h-[621px] lg:min-h-[620px]",
  },
  "roi-rechner": {
    de: "min-h-[826px] sm:min-h-[521px] lg:min-h-[472px]",
    en: "min-h-[826px] sm:min-h-[521px] lg:min-h-[451px]",
  },
  "llm-observability": {
    de: "min-h-[643px] sm:min-h-[701px] lg:min-h-[641px]",
    en: "min-h-[673px] sm:min-h-[701px] lg:min-h-[641px]",
  },
};

/** A loading status that holds the engine's height (RESERVED_HEIGHT). */
function reservedPlaceholder(slug: string): () => ReactElement {
  function LoadingPlaceholder() {
    const { locale } = useDemoLocale();
    return createElement(
      "div",
      {
        role: "status",
        "aria-live": "polite",
        className: `py-8 text-center text-sm text-muted-foreground ${RESERVED_HEIGHT[slug]?.[locale === "en" ? "en" : "de"] ?? ""}`,
      },
      DEMOS_PAGE_COPY[locale].shell.loading,
    );
  }
  LoadingPlaceholder.displayName = `LoadingPlaceholder(${slug})`;
  return LoadingPlaceholder;
}

export const demoComponents: Readonly<Record<string, ComponentType>> = {
  excel: dynamic(() => import("./excel-demo"), {
    ssr: false,
    loading: reservedPlaceholder("excel"),
  }),
  word: dynamic(() => import("./word-demo"), {
    ssr: false,
    loading: reservedPlaceholder("word"),
  }),
  "outbound-workflow": dynamic(() => import("./outbound-workflow-demo"), {
    ssr: false,
    loading: reservedPlaceholder("outbound-workflow"),
  }),
  "agent-pipeline": dynamic(() => import("./agent-pipeline-demo"), {
    ssr: false,
    loading: reservedPlaceholder("agent-pipeline"),
  }),
  "n8n-supply-chain": dynamic(() => import("./n8n-supply-chain-demo"), {
    ssr: false,
    loading: reservedPlaceholder("n8n-supply-chain"),
  }),
  "rag-vertragsassistent": dynamic(
    () => import("./rag-vertragsassistent-demo"),
    {
      ssr: false,
      loading: RagVertragsassistentFirstFrame,
    },
  ),
  "rechnung-zu-sap": dynamic(() => import("./rechnung-zu-sap-demo"), {
    ssr: false,
    loading: reservedPlaceholder("rechnung-zu-sap"),
  }),
  // The loader is deliberately small and server-renderable. Keeping it in the
  // initial shell avoids a second, late loading state while the substantial
  // scanner itself remains gated by the loader's IntersectionObserver.
  "prompt-scanner": PromptScannerLoader,
  "cost-drift-observability": dynamic(
    () => import("./cost-drift-observability-demo"),
    {
      ssr: false,
      loading: reservedPlaceholder("cost-drift-observability"),
    },
  ),
  "fine-tune-playground": dynamic(() => import("./fine-tune-playground-demo"), {
    ssr: false,
    loading: reservedPlaceholder("fine-tune-playground"),
  }),
  "roi-rechner": dynamic(() => import("./roi-rechner-demo"), {
    ssr: false,
    loading: reservedPlaceholder("roi-rechner"),
  }),
  "llm-observability": dynamic(() => import("./llm-observability-demo"), {
    ssr: false,
    loading: reservedPlaceholder("llm-observability"),
  }),
};

export function getDemoComponent(slug: string): ComponentType | undefined {
  return demoComponents[slug];
}
