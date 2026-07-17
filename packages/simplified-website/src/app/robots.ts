import type { MetadataRoute } from "next";
import { SITE_ORIGIN, robotsAllowPaths, robotsDisallowPaths } from "@/lib/crawl/contract";

const AI_SEARCH_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-User",
  "Claude-SearchBot",
] as const;

const AI_TRAINING_CRAWLERS = [
  "GPTBot",
  "CCBot",
  "Bytespider",
  "Google-Extended",
  "Applebot-Extended",
  "ClaudeBot",
  "anthropic-ai",
] as const;

export default function robots(): MetadataRoute.Robots {
  const allow = robotsAllowPaths();
  const disallow = robotsDisallowPaths();

  return {
    rules: [
      {
        userAgent: "*",
        allow: [...allow],
        disallow: [...disallow],
      },
      ...AI_SEARCH_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: [...allow],
        disallow: [...disallow],
      })),
      ...AI_TRAINING_CRAWLERS.map((userAgent) => ({
        userAgent,
        disallow: ["/"],
      })),
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
