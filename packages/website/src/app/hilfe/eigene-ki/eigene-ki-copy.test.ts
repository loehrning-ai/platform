import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

// api-error.ts imports @sentry/nextjs at module scope, and loading that in
// the test runtime is not possible; every test that reaches it replaces it.
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: vi.fn(),
}));
import { escapeHtml, renderMcpExplainer } from "@/lib/mcp/explainer";
import {
  bookById,
  findLesson,
  isCourseSlug,
  workshopBySlug,
} from "@/lib/mcp/catalog";
import { MCP_ENDPOINT_PATH } from "@/lib/mcp/config";
import { MCP_TOOLS } from "@/lib/mcp/tools/registry";
import { parseResourceUri } from "@/lib/mcp/uris";
import { PERSONAL_ACCESS_TOKEN_PREFIX } from "@/lib/agent-access/personal-tokens";
import { AGENT_HELP_PATH } from "@/components/course/open-with-your-ai-copy";
import { absoluteUrl } from "@/lib/seo/entity";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locale";
import {
  AGENT_HELP_COPY,
  AGENT_HELP_SECTION_IDS,
  AGENT_HELP_SECTION_ORDER,
} from "./eigene-ki-copy";

/**
 * The help page is only worth having if its walkthroughs are true, so the
 * assertions here compare the copy against the modules that decide the
 * behaviour: the endpoint explainer already published to agent clients, the
 * canonical resource registries, the token format, and the endpoint source
 * itself for the one claim about what a credential currently unlocks.
 */

const SERVER_URL = absoluteUrl(MCP_ENDPOINT_PATH);
const REPOSITORY_ROOT = join(__dirname, "..", "..", "..", "..");

type Shape = string | { readonly [key: string]: Shape };

function shapeOf(value: unknown): Shape {
  if (typeof value === "function") return "function";
  if (Array.isArray(value))
    return `array:${value.length > 0 ? "filled" : "empty"}`;
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .map(([key, nested]) => [key, shapeOf(nested)] as const)
        .toSorted(([a], [b]) => a.localeCompare(b)),
    );
  }
  return typeof value;
}

function collectStrings(value: unknown, found: string[] = []): string[] {
  if (typeof value === "string") {
    found.push(value);
    return found;
  }
  if (typeof value === "function") {
    // Every copy function is a pure template over its arguments; probing it
    // with placeholders puts its prose into the scan without duplicating it.
    const probed = (value as (...args: unknown[]) => unknown)("42", "43");
    return collectStrings(probed, found);
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectStrings(entry, found);
    return found;
  }
  if (value !== null && typeof value === "object") {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      collectStrings(entry, found);
    }
  }
  return found;
}

describe("agent help copy structure", () => {
  it("carries the same shape in both locales", () => {
    expect(shapeOf(AGENT_HELP_COPY.en)).toEqual(shapeOf(AGENT_HELP_COPY.de));
  });

  it("covers every section in the order the page renders and the nav lists", () => {
    expect([...AGENT_HELP_SECTION_ORDER].toSorted()).toEqual(
      Object.keys(AGENT_HELP_SECTION_IDS).toSorted(),
    );

    for (const locale of SUPPORTED_LOCALES) {
      const titles = AGENT_HELP_COPY[locale].sectionTitles;
      expect(Object.keys(titles).toSorted()).toEqual(
        Object.keys(AGENT_HELP_SECTION_IDS).toSorted(),
      );
      for (const title of Object.values(titles)) {
        expect(title.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the anchors ASCII and identical for both locales", () => {
    for (const id of Object.values(AGENT_HELP_SECTION_IDS)) {
      expect(id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("translates rather than repeating the German text", () => {
    const german = AGENT_HELP_COPY.de;
    const english = AGENT_HELP_COPY.en;

    expect(english.title).not.toBe(german.title);
    expect(english.intro).not.toBe(german.intro);
    expect(english.metadata.description).not.toBe(german.metadata.description);
    expect(english.tokens.intro).not.toBe(german.tokens.intro);
  });
});

describe("agent help copy voice", () => {
  it("uses no em or en dash in either locale", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const text of collectStrings(AGENT_HELP_COPY[locale])) {
        expect(text).not.toContain("—");
        expect(text).not.toContain("–");
      }
    }
  });

  it("addresses the reader with Du in German", () => {
    for (const text of collectStrings(AGENT_HELP_COPY.de)) {
      expect(text).not.toMatch(/\bSie\b/);
      expect(text).not.toMatch(/\bIhre[nrms]?\b/);
    }
  });

  it("writes real umlauts, never an ASCII replacement", () => {
    const germanProse = collectStrings(AGENT_HELP_COPY.de)
      .filter((text) => !text.includes("://") && !text.includes("locale="))
      .join("\n");

    expect(germanProse).not.toMatch(/\bfuer\b/);
    expect(germanProse).not.toMatch(/\bSchluessel\b/);
    expect(germanProse).toMatch(/[äöüßÄÖÜ]/);
  });

  it("names the completion record with the platform's own word", () => {
    expect(AGENT_HELP_COPY.de.overview.readOnlyBody).toContain(
      "Teilnahmebestätigung",
    );
    expect(AGENT_HELP_COPY.en.overview.readOnlyBody).toContain(
      "certificate of participation",
    );
  });
});

describe("agent help walkthroughs", () => {
  it("publishes exactly the client setup the endpoint itself publishes", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const copy = AGENT_HELP_COPY[locale];
      const explainer = renderMcpExplainer(locale);

      for (const walkthrough of [copy.desktop, copy.code, copy.codex]) {
        expect(explainer).toContain(
          escapeHtml(walkthrough.snippet(SERVER_URL)),
        );
      }
    }
  });

  it("puts the real endpoint address into every snippet", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const copy = AGENT_HELP_COPY[locale];
      for (const walkthrough of [copy.desktop, copy.code, copy.codex]) {
        expect(walkthrough.snippet(SERVER_URL)).toContain(SERVER_URL);
        expect(walkthrough.steps.length).toBeGreaterThan(1);
      }
      expect(copy.tokens.snippet(SERVER_URL)).toContain(SERVER_URL);
    }
  });

  it("uses the HTTP transport flag Claude Code needs for a remote server", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(AGENT_HELP_COPY[locale].code.snippet(SERVER_URL)).toContain(
        "--transport http",
      );
    }
  });

  it("shows the token in the header shape the resolver accepts", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const snippet = AGENT_HELP_COPY[locale].tokens.snippet(SERVER_URL);
      expect(snippet).toContain("Authorization: Bearer");
      expect(snippet).toContain(PERSONAL_ACCESS_TOKEN_PREFIX);
    }
  });

  it("describes the token format the mint route actually produces", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(AGENT_HELP_COPY[locale].tokens.format).toContain(
        PERSONAL_ACCESS_TOKEN_PREFIX,
      );
    }
  });
});

describe("agent help addresses", () => {
  it("names addresses the resource parser accepts", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const example of AGENT_HELP_COPY[locale].addresses.examples) {
        expect(() => parseResourceUri(example.uri)).not.toThrow();
      }
    }
  });

  it("names a lesson, a workshop and a chapter that exist in the registries", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const example of AGENT_HELP_COPY[locale].addresses.examples) {
        const parsed = parseResourceUri(example.uri);
        if (parsed.kind === "lesson") {
          expect(isCourseSlug(parsed.course), example.uri).toBe(true);
          if (!isCourseSlug(parsed.course)) continue;
          expect(
            findLesson(parsed.course, parsed.lessonId, parsed.locale),
            example.uri,
          ).toBeDefined();
        }
        if (parsed.kind === "workshop") {
          expect(
            workshopBySlug(parsed.slug, parsed.locale),
            example.uri,
          ).toBeDefined();
        }
        if (parsed.kind === "book") {
          expect(bookById(parsed.book), example.uri).toBeDefined();
        }
      }
    }
  });

  it("covers all three schemes so no addressable kind looks unsupported", () => {
    const kinds = AGENT_HELP_COPY.de.addresses.examples.map(
      (example) => parseResourceUri(example.uri).kind,
    );
    expect(kinds.toSorted()).toEqual(["book", "lesson", "workshop"]);
  });
});

describe("agent help numbers", () => {
  it("counts the public tools from the registry instead of claiming a number", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const facts = AGENT_HELP_COPY[locale].overview.facts(MCP_TOOLS.length);
      expect(
        facts.some((fact) => fact.includes(String(MCP_TOOLS.length))),
      ).toBe(true);
      expect(
        AGENT_HELP_COPY[locale].overview
          .facts(3)
          .some((fact) => fact.includes("3")),
      ).toBe(true);
    }
  });

  it("interpolates the ceilings it is given instead of hard-coding them", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const copy = AGENT_HELP_COPY[locale];
      expect(copy.limits.requests(240)).toContain("240");
      expect(copy.limits.output(64)).toContain("64");
      expect(copy.limits.search(25, 200)).toContain("25");
      expect(copy.limits.search(25, 200)).toContain("200");
      expect(copy.limits.chat(60, 32)).toContain("60");
      expect(copy.limits.tokens(5, 64)).toContain("5");
      expect(copy.chat.limits(60, 8)).toContain("8");
      expect(copy.tokens.limit(5)).toContain("5");
    }
  });
});

describe("agent help honesty about the authenticated path", () => {
  it("says a credential is not read yet exactly while the endpoint does not read one", () => {
    const endpointSource = readFileSync(
      join(REPOSITORY_ROOT, "src", "app", "api", "mcp", "route.ts"),
      "utf8",
    );
    const endpointResolvesCredentials = endpointSource.includes(
      "resolveAgentPrincipal",
    );

    for (const locale of SUPPORTED_LOCALES) {
      const pending = AGENT_HELP_COPY[locale].tokens.bearerPending;
      if (endpointResolvesCredentials) {
        // Copy lock updated: the endpoint now resolves a bearer credential, so
        // the "not read yet" sentence has to go. Replace it with what the
        // authenticated path does, and keep this assertion.
        expect(pending).toBe("");
      } else {
        expect(pending.length).toBeGreaterThan(0);
        expect(pending).toMatch(
          locale === "de" ? /noch nicht aus/ : /does not read a token/,
        );
      }
    }
  });
});

describe("agent help path", () => {
  it("shares one canonical path with the reading-surface island", () => {
    expect(AGENT_HELP_PATH).toBe("/hilfe/eigene-ki");
  });
});
