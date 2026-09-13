import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { configuredAdminUserId } from "./admin-config";

const VALID_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function sourceOf(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("configuredAdminUserId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a lowercase canonical UUID, trimmed", () => {
    vi.stubEnv("LOEHRNING_ADMIN_USER_ID", `  ${VALID_ID}  `);
    expect(configuredAdminUserId()).toBe(VALID_ID);
  });

  it.each(["", "true", "*", "owner@example.com", VALID_ID.toUpperCase()])(
    "leaves the surface disabled for %j",
    (value) => {
      vi.stubEnv("LOEHRNING_ADMIN_USER_ID", value);
      expect(configuredAdminUserId()).toBeNull();
    },
  );
});

describe("Edge-safe module boundary", () => {
  // Edge route handlers import provider-readiness. A Node built-in anywhere in
  // that chain fails the production webpack build, which unit tests never run.
  it.each(["src/lib/auth/admin-config.ts", "src/lib/provider-readiness.ts"])(
    "%s imports no Node built-in and not the Node-only owner gate",
    (file) => {
      const source = sourceOf(file);
      expect(source).not.toMatch(/from\s+["']node:/);
      expect(source).not.toContain("@/lib/auth/admin-identity");
    },
  );
});
