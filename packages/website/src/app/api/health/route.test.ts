import { describe, expect, it } from "vitest";

import { dynamic, GET, revalidate } from "./route";

type HealthBody = {
  status: "ok";
};

describe("GET /api/health", () => {
  it("is a shallow, uncached liveness response", async () => {
    expect(dynamic).toBe("force-dynamic");
    expect(revalidate).toBe(0);

    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()) as HealthBody).toEqual({ status: "ok" });
    expect(res.headers.get("cache-control")).toBe(
      "no-store, max-age=0",
    );
    expect(res.headers.get("x-robots-tag")).toBe(
      "noindex, nofollow, noarchive",
    );
  });
});
