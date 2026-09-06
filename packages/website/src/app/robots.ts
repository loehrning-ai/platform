import type { MetadataRoute } from "next";
import {
  AI_RETRIEVAL_AGENTS,
  AI_TRAINING_CRAWLERS,
  SITE_ORIGIN,
  robotsAllowPaths,
  robotsDisallowPaths,
} from "@/lib/crawl/contract";

// This file only renders the crawl contract. Which paths are open, which AI
// agents act for a person and are allowed on public paths (Claude-User among
// them), and which crawlers collect training data and are blocked from the
// whole site are all decided and explained in src/lib/crawl/contract.ts.
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
      ...AI_RETRIEVAL_AGENTS.map((userAgent) => ({
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
