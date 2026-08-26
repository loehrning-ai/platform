import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const clientSource = readFileSync(
  join(__dirname, "datenschutz-client.tsx"),
  "utf8",
);

describe("account privacy workspace design contract", () => {
  it("keeps labels at 12px or larger and every route-owned control at 44px", () => {
    expect(clientSource).not.toMatch(/\btext-\[(?:9|10|10\.5|11)px\]\b/);
    const controlCount =
      clientSource.match(/<(?:button|summary)\b/g)?.length ?? 0;
    const targetCount = clientSource.match(/min-h-11/g)?.length ?? 0;
    expect(controlCount).toBeGreaterThan(0);
    expect(targetCount).toBeGreaterThanOrEqual(controlCount);
  });

  it("keeps the workspace flat and free of decorative motion", () => {
    expect(clientSource).not.toMatch(
      /(?:shadow-(?:card|card-hover|tile)|shadow-\[|hover:-translate|active:translate|transition-all|rounded-full|linear-gradient)/,
    );
  });

  it("uses three explicit control-ledger regions and collapses secondary lineage", () => {
    expect(clientSource.match(/data-privacy-control=/g)).toHaveLength(3);
    expect(clientSource).toContain('data-privacy-control="export"');
    expect(clientSource).toContain('data-privacy-control="reset"');
    expect(clientSource).toContain('data-privacy-control="delete"');
    expect(clientSource.match(/<details/g)).toHaveLength(2);
  });
});
