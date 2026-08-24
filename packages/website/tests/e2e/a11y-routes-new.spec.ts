/**
 * Accessibility axe sweeps for the routes added by regression coverage that the
 * house a11y.spec.ts does NOT already scan (regression coverage). a11y.spec.ts
 * already covers /open-source, /feedback, /ueber-mich, /buecher, /kurse (and
 * more); this file fills the gap: /einstieg, /wie-ki-funktioniert,
 * /ki-check, /bekannte-grenzen, /neuigkeiten, /hilfe,
 * /login. Pattern is intentionally identical to a11y.spec.ts (same AxeBuilder
 * tags, unfiltered WCAG violations, reduced-motion + settle + polled scan). One
 * axe test per small route-group; failures name the offending route(s).
 */

import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { exposeAllAuditedContent } from "./fixtures/a11y-visibility";

// Small route-groups over the newly-covered routes (all confirmed to exist as
// server pages; /login renders its form for the unauthenticated e2e context and
// only redirects an already-signed-in user, so axe sees the real page).
const GROUPS: Record<string, readonly string[]> = {
  "Lern-Einstieg": [
    "/einstieg",
    "/en/einstieg",
    "/wie-ki-funktioniert",
    "/en/wie-ki-funktioniert",
    "/wie-ki-funktioniert/lektion-1-vorhersage",
    "/en/wie-ki-funktioniert/lektion-1-vorhersage",
    "/ki-check",
    "/en/ki-check",
  ],
  "Referenz & Wissen": [
    "/bekannte-grenzen",
    "/en/bekannte-grenzen",
    "/neuigkeiten",
    "/en/neuigkeiten",
  ],
  "Hilfe & Konto": ["/hilfe", "/en/hilfe", "/login", "/en/login"],
};

type AxeViolation = Awaited<
  ReturnType<AxeBuilder["analyze"]>
>["violations"][number];

// Copied intent from a11y.spec.ts settleMotion(): framer-motion opacity tweens
// are invisible to document.getAnimations(), so a mid-fade axe sample blends
// token colours toward the backdrop and reports false contrast violations.
// Require three identical opacity samples (300ms apart). Static decorative
// opacity values are valid and must not force the full deadline.
async function settleMotion(page: Page): Promise<void> {
  const sample = () =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('[style*="opacity"]'))
        .map((el) => getComputedStyle(el).opacity)
        .join("|"),
    );
  const deadline = Date.now() + 20_000;
  let prev = "__none__";
  let stable = 0;
  while (Date.now() < deadline) {
    const cur = await sample();
    if (cur === prev) {
      if ((stable += 1) >= 2) return;
    } else {
      stable = 0;
    }
    prev = cur;
    await page.waitForTimeout(300);
  }
}

// Same builder options/tags as a11y.spec.ts, polled
// to the settled verdict so a fade flake (which clears) is distinguished from a
// real contrast bug (which persists at final state and fails every retry).
async function scanRoute(page: Page, route: string): Promise<AxeViolation[]> {
  await page.goto(route, { waitUntil: "load" });
  await exposeAllAuditedContent(page);
  await settleMotion(page);

  const scanOnce = async () =>
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations;

  let blocking = await scanOnce();
  const deadline = Date.now() + 20_000;
  while (blocking.length > 0 && Date.now() < deadline) {
    await page.waitForTimeout(1_500);
    blocking = await scanOnce();
  }

  if (blocking.length > 0) {
    console.log(`A11Y violations on ${route}:`);
    for (const v of blocking) {
      console.log(`  - [${v.impact}] ${v.id}: ${v.description}`);
      for (const node of v.nodes.slice(0, 3)) {
        console.log(`    ${node.target.join(", ")}`);
      }
    }
  }
  return blocking;
}

for (const [group, routes] of Object.entries(GROUPS)) {
  test(`a11y: "${group}" routes have no WCAG axe violations`, async ({
    page,
  }) => {
    // Worst case per route: settleMotion (20s) + polled axe (20s); a 3-route
    // group can approach 120s, so budget headroom above that.
    test.setTimeout(300_000);
    // Audit the reduced-motion variant: perpetual loops render their static
    // state, so every pixel axe samples is a settled colour a real user reads.
    await page.emulateMedia({ reducedMotion: "reduce" });

    const offenders: string[] = [];
    for (const route of routes) {
      const blocking = await scanRoute(page, route);
      if (blocking.length > 0) {
        offenders.push(`${route} [${blocking.map((v) => v.id).join(", ")}]`);
      }
    }

    expect(
      offenders,
      `axe found WCAG violations on: ${offenders.join(" | ")}`,
    ).toEqual([]);
  });
}

// Note: single-h1 / landmark structure for these same routes is owned by the
// sibling a11y-structure.spec.ts, so this file stays strictly the axe-sweep
// half.
