import { test, expect, type Page } from "@playwright/test";

/**
 * /einstieg smoke + interaction (regression coverage). The zero-prerequisite,
 * login-free front-door: an immediate three-way orientation instrument,
 * three daily-life KI examples, and a primary CTA into the KI check.
 * Assertions target roles and stable test IDs so a wording refresh stays
 * green while a real regression (missing examples, dead CTA, mobile
 * overflow) fails.
 */

const ROUTE = "/einstieg";

// Every captured console error and uncaught page error fails the check.
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

function meaningfulErrors(errors: string[]): string[] {
  return errors;
}

test.describe("/einstieg front-door", () => {
  test("loads without login, shows the h1, and logs no console error", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Künstliche Intelligenz");

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${ROUTE}\n${noise.join("\n")}`).toEqual([]);
  });

  test("renders the three daily-life example blocks", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("beispiel-cards")).toBeVisible();
    for (const id of ["gesicht", "route", "empfehlungen"] as const) {
      await expect(page.getByTestId(`beispiel-${id}`)).toBeVisible();
    }
    // The examples are the pedagogical payload: assert one stable heading so a
    // silently emptied card is caught, not just the container.
    await expect(
      page.getByRole("heading", { name: "Gesichtserkennung" }),
    ).toBeVisible();
  });

  test("primary CTA leads into the KI check and the blog remains reachable", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    const actions = page.locator("[data-orientation-actions]");
    const definition = page.getByRole("heading", {
      name: "Eine brauchbare Arbeitsdefinition",
    });
    await expect(actions).toBeVisible();
    const actionBox = await actions.boundingBox();
    const definitionBox = await definition.boundingBox();
    expect(actionBox).not.toBeNull();
    expect(definitionBox).not.toBeNull();
    expect(actionBox!.y).toBeLessThan(definitionBox!.y);

    const primaryCta = page.getByRole("link", { name: "KI-Check starten" });
    await expect(primaryCta).toBeVisible();
    await expect(primaryCta).toHaveAttribute("href", "/ki-check");

    const blogLink = page.getByRole("link", {
      name: "Blog öffnen",
    });
    await expect(blogLink).toHaveAttribute("href", "/blog");

    await primaryCta.click();
    await expect(page).toHaveURL(/\/ki-check$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("/einstieg mobile", () => {
  test("has no horizontal overflow at 390px and keeps content visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("beispiel-cards")).toBeVisible();

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
