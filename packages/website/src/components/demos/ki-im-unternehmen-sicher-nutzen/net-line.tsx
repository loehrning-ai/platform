"use client";

import { useEffect, useState } from "react";

const KINDS = new Set(["fetch", "xmlhttprequest", "beacon"]);

/**
 * Next's own route-data GETs (link prefetch, `_rsc`) are the framework, not
 * the demo: their URL can never carry the visitor's text, and the shell's
 * links are not this folder's to configure. Everything else is counted.
 */
export function countsAsRequest(name: string, base = "http://localhost/"): boolean {
  try {
    return !new URL(name, base).searchParams.has("_rsc");
  } catch {
    return true;
  }
}

interface Props {
  readonly template: string;
  readonly pathsTemplate: string;
  /** performance.now() of the visitor's first input, or null before it. */
  readonly since: number | null;
}

/**
 * A transparency aid, not a guarantee: counts the fetch, XHR and beacon
 * requests the browser made after the visitor's first input and names their
 * paths (never the query). The promise itself rests on the code having no
 * such call; the static tests check that.
 */
export function NetLine({ template, pathsTemplate, since }: Props) {
  const [paths, setPaths] = useState<readonly string[]>([]);

  useEffect(() => {
    if (since === null || typeof PerformanceObserver === "undefined") return;
    const take = (entries: readonly PerformanceEntry[]) => {
      const fresh = entries.filter(
        (entry): entry is PerformanceResourceTiming =>
          entry.startTime >= since &&
          KINDS.has((entry as PerformanceResourceTiming).initiatorType) &&
          countsAsRequest(entry.name, location.href),
      );
      if (fresh.length === 0) return;
      setPaths((current) => [
        ...current,
        ...fresh.map((entry) => {
          try {
            return new URL(entry.name, location.href).pathname;
          } catch {
            return "?";
          }
        }),
      ]);
    };
    take(performance.getEntriesByType("resource"));
    const observer = new PerformanceObserver((list) => take(list.getEntries()));
    observer.observe({ type: "resource", buffered: false });
    return () => observer.disconnect();
  }, [since]);

  return (
    <p className="w05-net" data-count={paths.length}>
      {template.replace("{n}", String(paths.length))}
      {paths.length > 0 ? ` ${pathsTemplate.replace("{paths}", [...new Set(paths)].join(", "))}` : null}
    </p>
  );
}
