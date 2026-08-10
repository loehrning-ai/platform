import { describe, expect, it } from "vitest";
import { kindLabel } from "./kind-labels";
import { statusLabel } from "./status-labels";

describe("open-source display labels", () => {
  it.each([
    ["de", "tool", "Werkzeug"],
    ["en", "tool", "Tool"],
    ["de", "project", "Projekt"],
    ["en", "project", "Project"],
  ] as const)("renders the %s %s label", (locale, kind, label) => {
    expect(kindLabel(kind, locale)).toBe(label);
  });

  it.each([
    ["de", "experimental", "Experimentell"],
    ["en", "experimental", "Experimental"],
    ["de", "maintenance", "Wartungsmodus"],
    ["en", "maintenance", "Maintenance mode"],
  ] as const)("renders the %s %s status", (locale, status, label) => {
    expect(statusLabel(status, locale)).toBe(label);
  });
});
