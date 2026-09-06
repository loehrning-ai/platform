import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { GET } from "../route";

describe("GET /llms.txt", () => {
  it("advertises the agent access surfaces next to the public catalogs", async () => {
    const res = GET(new Request("https://loehrning.ai/llms.txt") as never);
    const text = await res.text();
    expect(text).toContain("## Agenten-Zugang / Agent access");
    for (const url of [
      "https://loehrning.ai/api/mcp",
      "https://loehrning.ai/api/courses.json",
      "https://loehrning.ai/api/workshops.json",
      "https://loehrning.ai/.well-known/oauth-protected-resource",
      "https://loehrning.ai/.well-known/oauth-protected-resource/api/mcp",
    ]) {
      expect(text, url).toContain(url);
    }
    // The endpoint can be switched off per deployment; the file says what
    // remains readable then instead of promising a live server.
    expect(text).toContain("bleiben diese Datei und die JSON-Kataloge");
    expect(text).toContain("this file and the JSON catalogs remain");
  });

  it("lists exactly the authored skill documents, derived from the content directory", async () => {
    const res = GET(new Request("https://loehrning.ai/llms.txt") as never);
    const text = await res.text();
    const root = join(process.cwd(), "content", "skills");
    const authored = readdirSync(root, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          existsSync(join(root, entry.name, "SKILL.md")),
      )
      .map((entry) => entry.name)
      .sort();
    expect(authored.length).toBeGreaterThan(0);

    const listed = Array.from(
      text.matchAll(
        /^- Agenten-Skill ([a-z0-9-]+) \/ Agent skill \1: https:\/\/loehrning\.ai\/skills\/\1\/SKILL\.md$/gm,
      ),
      (match) => match[1],
    );
    expect(listed).toEqual(authored);
  });

  it("never publishes a protected agent surface", async () => {
    const res = GET(new Request("https://loehrning.ai/llms.txt") as never);
    const text = await res.text();
    for (const fragment of [
      "/konto/ki",
      "/api/account/",
      "/oauth/consent",
      "lat_",
    ]) {
      expect(text, fragment).not.toContain(fragment);
    }
  });

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
