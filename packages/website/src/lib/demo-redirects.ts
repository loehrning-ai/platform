/**
 * The twelve retired demo slugs and where each one now points: the closest
 * workshop demo, or the /demos hub where no workshop covers the topic. The
 * crawl contract (src/lib/crawl/contract.ts) turns each entry into a 308;
 * the proxy localizes the target, so /en/demos/<old> lands on the /en page.
 */
export const RETIRED_DEMO_REDIRECTS = [
  { from: "excel", to: "/demos/ki-prognosen-einschaetzen" },
  { from: "roi-rechner", to: "/demos/ki-prognosen-einschaetzen" },
  { from: "llm-observability", to: "/demos/ki-prognosen-einschaetzen" },
  { from: "rag-vertragsassistent", to: "/demos/geschaeftsberichte-mit-ki-lesen" },
  { from: "rechnung-zu-sap", to: "/demos/datenbereitschaft-fuer-ki" },
  { from: "n8n-supply-chain", to: "/demos/datenbereitschaft-fuer-ki" },
  { from: "prompt-scanner", to: "/demos/audit-vorbereitung-mit-ki" },
  { from: "word", to: "/demos/audit-vorbereitung-mit-ki" },
  { from: "outbound-workflow", to: "/demos/audit-vorbereitung-mit-ki" },
  { from: "cost-drift-observability", to: "/demos" },
  { from: "fine-tune-playground", to: "/demos" },
  { from: "agent-pipeline", to: "/demos" },
] as const satisfies readonly { readonly from: string; readonly to: string }[];
