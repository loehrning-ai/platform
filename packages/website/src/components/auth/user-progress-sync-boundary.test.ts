import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("UserProgressSync client boundary", () => {
  it("keeps reconciliation machinery out of first-load JS", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/auth/user-progress-sync.tsx"),
      "utf8",
    );

    expect(source).toContain('from "next/dynamic"');
    expect(source).toContain("{ ssr: false }");
    expect(source).not.toContain("@/lib/progress/store");
    expect(source).not.toContain("@/lib/progress/account-deletion-control");
  });
});
