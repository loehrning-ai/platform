import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_ROOT = join(__dirname, "..");

function source(relativePath: string): string {
  return readFileSync(join(SOURCE_ROOT, relativePath), "utf8");
}

const observ = source("components/ai-native/demos/observ-demo.tsx");
const agent = source("components/ai-native/demos/agent-demo.tsx");
const logistics = source("components/ai-native/demos/logistics-demo.tsx");
const excel = source("components/ai-native/demos/excel-demo.tsx");
const debug = source("components/ai-native/debug-panel.tsx");
const auditedDarkSources = [observ, agent, logistics, excel, debug].join("\n");

describe("explicit dark-surface token scope", () => {
  it("scopes every audited near-black panel before using semantic status colors", () => {
    expect(observ).toContain(
      'className="dark-section max-h-[150px] overflow-y-auto bg-[var(--color-dark-bg)]',
    );
    expect(agent).toContain(
      'className="dark-section min-h-[220px] overflow-y-auto',
    );
    expect(logistics).toContain('className="dark-section min-h-[170px]');
    expect(excel).toContain(
      'className="dark-section border-t-[3px] border-brand-orange bg-[var(--color-dark-bg)]',
    );
    expect(debug).toContain('className="dark-section fixed right-4 bottom-4');
  });

  it("uses dark ink on solid light-copper badges inside dark scope", () => {
    expect(observ).toContain(
      "bg-brand-orange px-2 py-0.5 font-mono text-xs font-bold tracking-[0.14em] text-[var(--color-dark-bg)]",
    );
    expect(excel).toContain(
      "bg-brand-orange px-2 py-0.5 font-mono text-[12px] font-bold tracking-[0.12em] text-[var(--color-dark-bg)]",
    );
  });

  it("does not reintroduce the known sub-AA dark-muted opacity variants", () => {
    expect(auditedDarkSources).not.toMatch(
      /text-\[var\(--color-dark-muted\)\]\/(?:50|60|80)/,
    );
  });
});
