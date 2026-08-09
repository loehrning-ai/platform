import { describe, expect, it } from "vitest";
import { GET as getKnowledgeGraph } from "@/app/api/knowledge-graph.json/route";
import { getCrawlRoute } from "@/lib/crawl/contract";
import {
  KNOWLEDGE_GRAPH_JSON_SCHEMA,
  KNOWLEDGE_GRAPH_SCHEMA_ID,
} from "@/lib/seo/knowledge-graph-schema";
import { GET as getSchema } from "./route";

function collectObjectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) collectObjectKeys(item, keys);
    return keys;
  }
  if (!value || typeof value !== "object") return keys;
  for (const [key, nested] of Object.entries(value)) {
    keys.add(key);
    collectObjectKeys(nested, keys);
  }
  return keys;
}

describe("GET /schema/knowledge-graph/v1", () => {
  it("serves the versioned public JSON Schema at its advertised identifier", async () => {
    const response = getSchema();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/schema+json; charset=utf-8",
    );
    expect(response.headers.get("cache-control")).toMatch(/public/);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");

    const schema = await response.json();
    expect(schema).toEqual(KNOWLEDGE_GRAPH_JSON_SCHEMA);
    expect(schema.$id).toBe(KNOWLEDGE_GRAPH_SCHEMA_ID);
    expect(schema.$schema).toBe(
      "https://json-schema.org/draft/2020-12/schema",
    );
    expect(schema.properties.schema.const).toBe(KNOWLEDGE_GRAPH_SCHEMA_ID);
  });

  it("stays a public, crawlable, unlisted machine endpoint", () => {
    const contract = getCrawlRoute("/schema/knowledge-graph/v1");
    expect(contract.pattern).toBe("/schema/knowledge-graph/v1");
    expect(contract.routeClass).toBe("public-machine");
    expect(contract.auth).toBe("public");
    expect(contract.robots).toBe("allow");
    expect(contract.includeInSitemap).toBe(false);
    expect(contract.xRobotsTag).toBeUndefined();
  });

  it("describes the current payload without exposing private field classes", async () => {
    const payload = await (await getKnowledgeGraph()).json();
    const schema = KNOWLEDGE_GRAPH_JSON_SCHEMA;

    expect(payload.schema).toBe(schema.$id);
    expect(Object.keys(payload).sort()).toEqual([...schema.required].sort());
    expect(Object.keys(payload.catalogs).sort()).toEqual(
      [...schema.properties.catalogs.required].sort(),
    );

    for (const node of payload.nodes) {
      expect(
        schema.$defs.learningNode.required.filter(
          (key) => !Object.hasOwn(node, key),
        ),
      ).toEqual([]);
    }
    for (const edge of payload.edges) {
      expect(
        schema.$defs.learningEdge.required.filter(
          (key) => !Object.hasOwn(edge, key),
        ),
      ).toEqual([]);
    }

    const publicKeys = collectObjectKeys(payload);
    for (const forbidden of [
      "email",
      "password",
      "cookie",
      "session",
      "accessToken",
      "refreshToken",
      "providerKey",
      "secret",
      "userId",
    ]) {
      expect(publicKeys.has(forbidden), forbidden).toBe(false);
    }
  });
});
