import { NextResponse } from "next/server";
import { KNOWLEDGE_GRAPH_JSON_SCHEMA } from "@/lib/seo/knowledge-graph-schema";

export const dynamic = "force-static";

export function GET(): NextResponse {
  return NextResponse.json(KNOWLEDGE_GRAPH_JSON_SCHEMA, {
    headers: {
      "Content-Type": "application/schema+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
