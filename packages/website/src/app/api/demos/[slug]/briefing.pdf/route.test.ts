import { describe, it, expect } from "vitest";
import { GET } from "./route";

/**
 * /api/demos/[slug]/briefing.pdf (regression coverage). The demo PDF briefings are
 * intentionally retired on the learning platform: the route must answer a clean
 * 410 Gone (not a 404, not a 500) so crawlers and clients learn the resource is
 * permanently removed rather than merely missing.
 */
describe("GET /api/demos/[slug]/briefing.pdf", () => {
  it("returns 410 Gone with an explanatory body", async () => {
    const res = GET();
    expect(res.status).toBe(410);
    expect(await res.text()).toMatch(/disabled/i);
  });
});
