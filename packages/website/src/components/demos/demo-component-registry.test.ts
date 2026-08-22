import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement, type ComponentType } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: (_loader: unknown, options?: { loading?: ComponentType }) => {
    const Stub = () => null;
    return options?.loading ?? Stub;
  },
}));

import { demoComponents, getDemoComponent } from "./demo-component-registry";
import { galleryPreviews, getGalleryPreview } from "./demo-gallery-registry";

const EXPECTED_SLUGS = [
  "agent-pipeline",
  "cost-drift-observability",
  "excel",
  "fine-tune-playground",
  "llm-observability",
  "n8n-supply-chain",
  "outbound-workflow",
  "prompt-scanner",
  "rag-vertragsassistent",
  "rechnung-zu-sap",
  "roi-rechner",
  "word",
];

describe("demo component registries", () => {
  it("keeps gallery previews and lazy detail components in separate modules", () => {
    const detailSource = readFileSync(
      resolve(process.cwd(), "src/components/demos/demo-component-registry.ts"),
      "utf8",
    );
    const shellSource = readFileSync(
      resolve(process.cwd(), "src/components/demos/demo-shell.tsx"),
      "utf8",
    );
    const scannerLoaderSource = readFileSync(
      resolve(process.cwd(), "src/components/demos/prompt-scanner-loader.tsx"),
      "utf8",
    );

    expect(detailSource).not.toContain("demo-gallery-previews");
    expect(detailSource).not.toContain("demo-gallery-registry");
    expect(detailSource).toContain(
      'import PromptScannerLoader from "./prompt-scanner-loader"',
    );
    expect(detailSource).not.toContain(
      'dynamic(() => import("./prompt-scanner-loader")',
    );
    expect(detailSource).toContain('"prompt-scanner": PromptScannerLoader');
    expect(shellSource).toContain('from "./demo-component-registry"');
    expect(shellSource).not.toContain("demo-gallery-registry");
    expect(scannerLoaderSource).not.toContain("demo-gallery-registry");
    expect(scannerLoaderSource).not.toContain("demo-gallery-previews");
  });

  it("registers every expected slug in both isolated registries", () => {
    expect(Object.keys(galleryPreviews).sort()).toEqual(EXPECTED_SLUGS);
    expect(Object.keys(demoComponents).sort()).toEqual(EXPECTED_SLUGS);
  });

  it("routes known and unknown gallery preview slugs", () => {
    expect(getGalleryPreview("excel")).toBe(galleryPreviews.excel);
    expect(typeof getGalleryPreview("excel")).toBe("function");
    expect(getGalleryPreview("does-not-exist")).toBeUndefined();
  });

  it("routes known and unknown interactive detail slugs", () => {
    expect(getDemoComponent("agent-pipeline")).toBe(
      demoComponents["agent-pipeline"],
    );
    expect(getDemoComponent("nope")).toBeUndefined();
  });

  it("renders a semantic status while a detail chunk loads", () => {
    const Loading = getDemoComponent("excel")!;
    render(createElement(Loading));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Praxisbeispiel wird geladen…",
    );
  });
});
