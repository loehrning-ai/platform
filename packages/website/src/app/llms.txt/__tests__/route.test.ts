import { describe, it, expect } from "vitest";
import { GET } from "../route";

describe("GET /llms.txt", () => {
  it("returns 200 with markdown content type", async () => {
    const res = GET(new Request("https://loehrning.ai/llms.txt") as never);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/markdown/);
  });

  it("documents the public and protected split", async () => {
    const res = GET(new Request("https://loehrning.ai/llms.txt") as never);
    const text = await res.text();
    expect(text).toMatch(/Öffentlicher Bereich/);
    expect(text).toMatch(/Private Zustände/);
    expect(text).toMatch(/Blog/);
  });

  it("lists public previews and public metadata but not protected resource URLs", async () => {
    const res = GET(new Request("https://loehrning.ai/llms.txt") as never);
    const text = await res.text();
    expect(text).toContain("https://loehrning.ai/kurse");
    expect(text).toContain("https://loehrning.ai/ki-fuehrerschein");
    expect(text).toContain("https://loehrning.ai/eu-ai-act-kurs");
    expect(text).toContain("https://loehrning.ai/ai-native");
    expect(text).toContain("https://loehrning.ai/api/books.json");
    expect(text).toContain("https://loehrning.ai/buecher");
    expect(text).toContain("https://loehrning.ai/demos");
    expect(text).toContain("https://loehrning.ai/open-source");
    expect(text).toContain(
      "https://loehrning.ai/open-source/lizenzrichtlinie",
    );
    expect(text).not.toContain("https://loehrning.ai/ai-native/kurs");
  });

  it("links to the sitemap", async () => {
    const res = GET(new Request("https://loehrning.ai/llms.txt") as never);
    const text = await res.text();
    expect(text).toMatch(/sitemap\.xml/);
  });

  it("does not publish employer proof or profile-first routing", async () => {
    const res = GET(new Request("https://loehrning.ai/llms.txt") as never);
    const text = await res.text();
    expect(text).not.toMatch(/\b(Apple|Red Bull|Meta|Amazon)\b/);
    expect(text).not.toMatch(/Über Tim/);
    expect(text).not.toMatch(/KI-Transformation Check/);
  });

  it("sets a sensible cache header", async () => {
    const res = GET(new Request("https://loehrning.ai/llms.txt") as never);
    expect(res.headers.get("cache-control")).toMatch(/public/);
  });

  it("declares its bilingual content and sitemap relation", () => {
    const res = GET(new Request("https://loehrning.ai/llms.txt") as never);
    expect(res.headers.get("content-language")).toBe("de, en");
    expect(res.headers.get("link")).toBe(
      '<https://loehrning.ai/sitemap.xml>; rel="sitemap"',
    );
  });
});
