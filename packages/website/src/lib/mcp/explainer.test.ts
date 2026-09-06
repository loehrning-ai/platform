import { describe, expect, it } from "vitest";
import { escapeHtml, MCP_ENDPOINT_URL, renderMcpExplainer } from "./explainer";
import { MCP_TOOL_NAMES } from "./tools/registry";

const LOCALES = ["de", "en"] as const;

describe("MCP explainer page", () => {
  it("escapes markup so a future content change cannot inject an element", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it.each(LOCALES)("renders a complete document in %s", (locale) => {
    const html = renderMcpExplainer(locale);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain(`<html lang="${locale}">`);
    expect(html.trimEnd().endsWith("</html>")).toBe(true);
    expect(html).toContain(MCP_ENDPOINT_URL);
  });

  it.each(LOCALES)("shows all three client snippets in %s", (locale) => {
    const html = renderMcpExplainer(locale);
    expect(html).toContain("Claude Desktop");
    expect(html).toContain("Claude Code");
    expect(html).toContain("Codex");
    expect(html).toContain("claude mcp add --transport http loehrning");
    expect(html).toContain("codex mcp add loehrning --url");
    expect(html).toContain("&quot;mcpServers&quot;");
  });

  it.each(LOCALES)("lists every registered tool in %s", (locale) => {
    const html = renderMcpExplainer(locale);
    for (const name of MCP_TOOL_NAMES) {
      expect(html).toContain(name);
    }
  });

  it("links the two locales to each other", () => {
    expect(renderMcpExplainer("de")).toContain('href="/api/mcp?locale=en"');
    expect(renderMcpExplainer("en")).toContain('href="/api/mcp"');
  });

  it("carries no script and no animation", () => {
    for (const locale of LOCALES) {
      const html = renderMcpExplainer(locale);
      expect(html).not.toContain("<script");
      expect(html).not.toContain("onerror=");
      expect(html).not.toContain("animation");
      expect(html).not.toContain("transition");
    }
  });

  it("keeps every navigation target at 44 pixels and text above 12 pixels", () => {
    const html = renderMcpExplainer("de");
    expect(html).toContain("min-height: 44px");
    expect(html).toContain("min-width: 44px");
    const remSizes = Array.from(html.matchAll(/font-size:\s*([\d.]+)rem/g)).map(
      (match) => Number(match[1]),
    );
    expect(remSizes.length).toBeGreaterThan(0);
    for (const size of remSizes) {
      expect(size * 16).toBeGreaterThanOrEqual(12);
    }
  });

  it("uses no em dash or en dash in either locale", () => {
    for (const locale of LOCALES) {
      const html = renderMcpExplainer(locale);
      expect(html).not.toContain("—");
      expect(html).not.toContain("–");
    }
  });

  it("addresses a German reader with Du and real umlauts", () => {
    const html = renderMcpExplainer("de");
    expect(html).toContain("Trage sie in deinem KI-Client ein");
    expect(html).toContain("Du brauchst");
    expect(html).toContain("Schlüssel");
    expect(html).not.toContain("Schluessel");
  });

  it("tells a reader the surface is read only", () => {
    expect(renderMcpExplainer("de")).toContain("Nur lesend");
    expect(renderMcpExplainer("en")).toContain("Read only");
  });

  it("asks crawlers not to index the endpoint", () => {
    expect(renderMcpExplainer("de")).toContain(
      '<meta name="robots" content="noindex, follow">',
    );
  });
});
