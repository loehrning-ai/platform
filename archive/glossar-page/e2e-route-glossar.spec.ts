import { test, expect, type Page } from "@playwright/test";

/**
 * /glossar smoke + interaction (regression coverage). Public A-Z index that merges
 * the KI-Führerschein, EU-AI-Act and AI-Native glossaries into one searchable
 * list via the GlossarView client component (search box + A-Z letter filter).
 *
 * Assertions target ROLES and stable structure, not exact copy: each merged
 * entry renders exactly one <dt> (Playwright maps dt -> role "term" by tag, so
 * counting terms is copy-independent), the search box is role "searchbox", and
 * the letter buttons expose aria-pressed. A wording refresh stays green while a
 * real regression (broken merge, dead search, dead filter, mobile overflow)
 * fails.
 */

const ROUTE = "/glossar";

// Console-error filter mirrors route-einstieg.spec.ts: drop framework noise and
// keep only errors that signal a genuine page fault.
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

function meaningfulErrors(errors: string[]): string[] {
  return errors.filter(
    (e) =>
      !/hydration|Failed to fetch dynamically imported|prefetch/i.test(e) &&
      !/Minified React error #(418|423|425)/.test(e) &&
      !/404/.test(e) &&
      !/_vercel\//.test(e),
  );
}

test.describe("/glossar A-Z index", () => {
  test("loads, shows h1 + count paragraph + many entries, no console error", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("KI-Begriffe");

    // Intro paragraph reports the merged entry count ("<N> Begriffe aus dem ...").
    await expect(page.getByText(/\d+ Begriffe aus dem/)).toBeVisible();

    // One <dt> (role "term") per merged glossary entry. A broken merge would
    // collapse this; the exact number is intentionally not asserted.
    const terms = page.getByRole("term");
    const total = await terms.count();
    expect(total, "merged glossary should render many term entries").toBeGreaterThan(50);

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${ROUTE}\n${noise.join("\n")}`).toEqual([]);
  });

  test("search box filters the list and clears back to full", async ({ page }) => {
    // waitUntil "load" (not domcontentloaded): the GlossarView client island must
    // hydrate before the search input reacts to fill(); load waits for the bundle.
    await page.goto(ROUTE, { waitUntil: "load" });

    const terms = page.getByRole("term");
    const full = await terms.count();
    expect(full).toBeGreaterThan(50);

    const search = page.getByRole("searchbox", { name: "Glossar durchsuchen" });
    await expect(search).toBeVisible();

    // A query that matches nothing exercises the filter and the empty state.
    await search.fill("zzqx-kein-treffer");
    await expect(terms).toHaveCount(0);
    await expect(page.getByText(/Keine Begriffe gefunden/i)).toBeVisible();

    // Clearing restores the full list (state reset, not a page reload).
    await search.fill("");
    await expect(terms).toHaveCount(full);
  });

  test("A-Z letter filter narrows the list and 'Alle' restores it", async ({
    page,
  }) => {
    // "load" so the letter-filter buttons are hydrated before the first click.
    await page.goto(ROUTE, { waitUntil: "load" });

    const terms = page.getByRole("term");
    const full = await terms.count();

    const alle = page.getByRole("button", { name: "Alle", exact: true });
    const letterA = page.getByRole("button", { name: "A", exact: true });
    await expect(alle).toHaveAttribute("aria-pressed", "true");

    await letterA.click();
    await expect(letterA).toHaveAttribute("aria-pressed", "true");
    await expect(alle).toHaveAttribute("aria-pressed", "false");

    const narrowed = await terms.count();
    expect(narrowed, "letter filter must show fewer entries").toBeLessThan(full);
    expect(narrowed, "letter A should still have entries").toBeGreaterThan(0);

    await alle.click();
    await expect(alle).toHaveAttribute("aria-pressed", "true");
    await expect(terms).toHaveCount(full);
  });
});

test.describe("/glossar mobile", () => {
  test("has no horizontal overflow at 390px and keeps content visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("searchbox", { name: "Glossar durchsuchen" }),
    ).toBeVisible();
    await expect(page.getByRole("term").first()).toBeVisible();

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
      innerWidth: window.innerWidth,
    }));
    expect(
      scrollWidth,
      `horizontal overflow at 390px: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`,
    ).toBeLessThanOrEqual(innerWidth + 1);
  });
});
