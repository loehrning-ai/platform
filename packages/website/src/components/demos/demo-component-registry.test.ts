import { describe, expect, it, vi } from "vitest";
import { createElement, type ComponentType } from "react";
import { render, screen } from "@testing-library/react";

/**
 * demo-component-registry.test.ts (regression coverage)
 *
 * Guards the demo registry's real logic: the slug -> component routing done by
 * getGalleryPreview / getDemoComponent, and the invariant that the static
 * gallery previews and the lazy demo components cover exactly the same slug set.
 *
 * next/dynamic is stubbed (like next/image / next/link elsewhere) so importing
 * the module is environment-independent; the stub only affects the lazy demo
 * values, never the real preview components or the key routing we assert.
 */

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: (
    _loader: unknown,
    options?: { loading?: ComponentType },
  ) => {
    const Stub = () => null;
    return options?.loading ?? Stub;
  },
}));

import {
  demoComponents,
  galleryPreviews,
  getDemoComponent,
  getGalleryPreview,
} from "./demo-component-registry";

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

describe("demo-component-registry", () => {
  it("registers a gallery preview for every expected demo slug", () => {
    expect(Object.keys(galleryPreviews).sort()).toEqual(EXPECTED_SLUGS);
  });

  it("getGalleryPreview returns the mapped preview component for a known slug", () => {
    const preview = getGalleryPreview("excel");
    // Identity with the real (unmocked) preview component in the record.
    expect(preview).toBe(galleryPreviews.excel);
    expect(typeof preview).toBe("function");
  });

  it("getGalleryPreview returns undefined for an unknown slug", () => {
    expect(getGalleryPreview("does-not-exist")).toBeUndefined();
  });

  it("getDemoComponent routes a known slug to its registry entry", () => {
    expect(getDemoComponent("agent-pipeline")).toBe(
      demoComponents["agent-pipeline"],
    );
    expect(getDemoComponent("agent-pipeline")).toBeDefined();
  });

  it("renders a semantic status while a lazy demo chunk loads", () => {
    const Loading = getDemoComponent("excel")!;
    render(createElement(Loading));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Praxisbeispiel wird geladen…",
    );
  });

  it("getDemoComponent returns undefined for an unknown slug", () => {
    expect(getDemoComponent("nope")).toBeUndefined();
  });

  it("exposes the same slug set for previews and lazy components", () => {
    expect(Object.keys(demoComponents).sort()).toEqual(
      Object.keys(galleryPreviews).sort(),
    );
  });
});
