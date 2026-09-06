/**
 * search_content over the lazy in-process index.
 *
 * An empty or punctuation-only query returns zero results with a stated
 * reason rather than the whole catalogue, so an agent that fumbles a query
 * gets a correction instead of a wall of text.
 */

import { SITE_CONTENT_DATE } from "@/lib/content-freshness";
import type { Locale } from "@/lib/i18n/locale";
import {
  MCP_SEARCH_DEFAULT_LIMIT,
  MCP_SEARCH_RESULT_LIMIT,
} from "../config";
import { searchEntries, tokenize } from "../search-index";

export function searchContent(
  query: string,
  locale: Locale,
  limit: number = MCP_SEARCH_DEFAULT_LIMIT,
) {
  const bounded = Math.min(Math.max(limit, 1), MCP_SEARCH_RESULT_LIMIT);
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return {
      stand: SITE_CONTENT_DATE,
      locale,
      query_tokens: 0,
      count: 0,
      results: [],
      note: "The query carried no searchable word of two characters or more.",
    };
  }

  const results = searchEntries(locale, query, bounded);
  return {
    stand: SITE_CONTENT_DATE,
    locale,
    query_tokens: tokens.length,
    count: results.length,
    results,
    note:
      results.length === 0
        ? "Nothing in the public catalogue matches every word of this query."
        : null,
  };
}
