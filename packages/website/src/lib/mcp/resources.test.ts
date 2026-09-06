/**
 * Resource coverage over the real protocol: listing, reading in both locales,
 * and the shadow paths for an unknown address and a cross-scheme address.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { connectInMemoryClient, type InMemoryMcpClient } from "@/test/mcp-client";
import { createLoehrningMcpServer } from "./server";
import { listLessonResources, listWorkshopResources, readResource } from "./resources";

let client: InMemoryMcpClient;

beforeEach(async () => {
  client = await connectInMemoryClient(createLoehrningMcpServer());
});

afterEach(async () => {
  await client.close();
});

interface ResourceRow {
  readonly uri: string;
  readonly name: string;
  readonly mimeType?: string;
}

describe("MCP resources", () => {
  it("advertises the three URI templates", async () => {
    const response = await client.request("resources/templates/list", {});
    const templates = (response.result?.resourceTemplates ??
      []) as readonly { uriTemplate: string; description?: string }[];
    expect(templates.map((template) => template.uriTemplate).sort()).toEqual([
      "book://{book}/{chapter}",
      "lesson://{course}/{lessonId}",
      "workshop://{slug}",
    ]);
    for (const template of templates) {
      expect(String(template.description)).toContain("locale=en");
    }
  });

  it("lists lessons, workshops and chapters with stable URIs", async () => {
    const response = await client.request("resources/list", {});
    const resources = (response.result?.resources ?? []) as readonly ResourceRow[];
    expect(resources.length).toBeGreaterThan(10);

    const schemes = new Set(
      resources.map((resource) => resource.uri.split("://")[0]),
    );
    expect(schemes.has("lesson")).toBe(true);
    expect(schemes.has("workshop")).toBe(true);
    expect(schemes.has("book")).toBe(true);
    for (const resource of resources) {
      expect(resource.mimeType).toBe("text/markdown");
    }
    expect(new Set(resources.map((row) => row.uri)).size).toBe(
      resources.length,
    );
  });

  it("reads a lesson resource in both locales", async () => {
    const lessons = listLessonResources();
    expect(lessons.length).toBeGreaterThan(0);
    const uri = lessons[0]!.uri;

    const german = await client.request("resources/read", { uri });
    const englishUri = `${uri}?locale=en`;
    const english = await client.request("resources/read", { uri: englishUri });

    const germanText = String(
      (german.result?.contents as { text?: string }[] | undefined)?.[0]?.text,
    );
    const englishText = String(
      (english.result?.contents as { text?: string }[] | undefined)?.[0]?.text,
    );

    expect(germanText.startsWith("# ")).toBe(true);
    expect(germanText).toContain("https://loehrning.ai/");
    expect(englishText.startsWith("# ")).toBe(true);
    expect(englishText).not.toBe(germanText);
  });

  it("reads a workshop resource with its material manifest", async () => {
    const workshops = listWorkshopResources();
    const content = await readResource(workshops[0]!.uri, "workshop");
    expect(content.mimeType).toBe("text/markdown");
    expect(content.text).toContain("## Materials");
    expect(content.text).toContain("https://loehrning.ai/");
  });

  it("reads a book chapter resource", async () => {
    const content = await readResource("book://ki-landschaft/01_eisberg", "book");
    expect(content.text.startsWith("# ")).toBe(true);
    expect(content.text.length).toBeGreaterThan(200);
  });

  it("refuses an unknown URI", async () => {
    const response = await client.request("resources/read", {
      uri: "lesson://gibt-es-nicht/auch_nicht",
    });
    expect(Boolean(response.error)).toBe(true);
  });

  it("refuses a scheme read through the wrong template", async () => {
    await expect(
      readResource("workshop://ki-prognosen-einschaetzen", "lesson"),
    ).rejects.toThrow(/not a lesson resource/);
  });

  it("refuses an address with an unsupported locale", async () => {
    await expect(
      readResource("lesson://ki-fuehrerschein/block_1_lesson_1?locale=fr", "lesson"),
    ).rejects.toThrow(/locale/);
  });
});
