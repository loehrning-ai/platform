import { test, expect, type Page } from "@playwright/test";

/**
 * /feedback smoke + provider-free fallback coverage. Stored feedback is an
 * optional provider-backed feature, so the credential-free publication build
 * must render the mailto fallback and must not expose an inert form.
 */

const ROUTE = "/feedback";

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

test.describe("/feedback surface", () => {
  test("loads without login, shows the h1, and logs no console error", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Rückmeldung");

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${ROUTE}\n${noise.join("\n")}`).toEqual([]);
  });

  test("renders the disabled-storage status and direct-contact mailto fallback", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("status")).toContainText(
      "Es werden keine Formulardaten gespeichert.",
    );
    await expect(page.getByRole("group", { name: /Art der Rückmeldung/i })).toHaveCount(0);
    await expect(page.getByLabel(/Nachricht/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Rückmeldung senden/i })).toHaveCount(0);

    // The anonymous surface still offers a real contact channel.
    await expect(
      page.getByRole("link", { name: /tim@loehrning\.ai/i }),
    ).toHaveAttribute("href", "mailto:tim@loehrning.ai");
  });

});

test.describe("/feedback mobile", () => {
  test("has no horizontal overflow at 390px and keeps the fallback visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("status")).toBeVisible();
    await expect(page.getByRole("link", { name: /tim@loehrning\.ai/i })).toBeVisible();

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
