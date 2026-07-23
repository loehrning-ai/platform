import { describe, expect, it } from "vitest";

import { dynamic, GET, revalidate } from "./route";

type HealthBody = {
  status: "ok";
};

describe("GET /api/health", () => {
  it("is a shallow, statically revalidated liveness response", async () => {
    expect(dynamic).toBe("force-static");
    expect(revalidate).toBe(60);

    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()) as HealthBody).toEqual({ status: "ok" });
    expect(res.headers.get("cache-control")).toBe(
      "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
    );
    expect(res.headers.get("x-robots-tag")).toBe(
      "noindex, nofollow, noarchive",
    );
  });
});
