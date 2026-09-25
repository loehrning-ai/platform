import { expect, test } from "@playwright/test";

test.describe("workshop self-study journey", () => {
  test("lists and opens the annual-report self-study workshop", async ({
    page,
  }) => {
    await page.goto("/workshops");
    const workshop = page.getByRole("link", {
      name: /Geschäftsberichte mit KI lesen/i,
    }).first();
    await expect(workshop).toBeVisible();
    await workshop.click();
    await expect(page).toHaveURL(
      /\/workshops\/geschaeftsberichte-mit-ki-lesen$/,
    );
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Geschäftsberichte/i,
    );
    await expect(page.locator("body")).not.toContainText("No paid service");
  });

  test("serves the complete analyst kit as a ZIP", async ({ request }) => {
    const response = await request.get(
      "/workshops/geschaeftsberichte-mit-ki-lesen/northwind-analyst-kit.zip",
    );
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(
      /application\/(?:zip|octet-stream)/,
    );
    const body = await response.body();
    expect(body.byteLength).toBeGreaterThan(30_000);
    expect(body.subarray(0, 2).toString("ascii")).toBe("PK");
  });

  test("opens the third workshop guide and pairs its recorded-evidence deck", async ({ page }) => {
    const errors: string[] = [];
    const serviceRequests: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      if (/^\/(?:health|api\/(?:manifest|replay))(?:\/|$)/.test(new URL(request.url()).pathname)) {
        serviceRequests.push(request.url());
      }
    });
    await page.goto("/en/workshops/datenbereitschaft-fuer-ki");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/data.*ready for AI/i);
    await page.getByRole("button", { name: "Check decision", exact: true }).click();
    await expect(page.getByText("Select one decision before checking the result.", { exact: true })).toBeVisible();
    await page.getByRole("radio", { name: "Use 100 euros and check what the fields mean first.", exact: true }).check();
    await page.getByRole("radio", { name: "The ending balance already includes the change. Adding it again counts it twice.", exact: true }).check();
    await page.getByRole("button", { name: "Check decision", exact: true }).click();
    await expect(page.getByText("The change is already in the ending balance.", { exact: true })).toBeVisible();
    // A correct answer offers a neutral reset; "Try again" is reserved for wrong answers.
    await expect(page.getByRole("button", { name: "Reset", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
    // Reset reshuffles the options, then focuses whichever decision now comes first.
    await expect(page.locator("form fieldset").first().getByRole("radio").first()).toBeFocused();
    await page.goto("/workshops/datenbereitschaft-fuer-ki/guide.html");
    await page.getByText("Reveal the explanation", { exact: true }).click();
    await expect(page.locator("details").first()).toHaveAttribute("open", "");
    await page.getByRole("link", { name: "Open the interactive course", exact: true }).click();
    await expect(page.locator("#cover")).toHaveAttribute("data-deck-active", "");
    const popup = page.waitForEvent("popup");
    await page.keyboard.press("p");
    const presenter = await popup;
    presenter.on("pageerror", (error) => errors.push(error.message));
    presenter.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await expect(presenter.locator("html")).toHaveAttribute("data-pairing-state", "paired");
    await presenter.getByRole("button", { name: "Next scene", exact: true }).click();
    await expect(page.locator("#host")).toHaveAttribute("data-deck-active", "");
    const portrait = page.locator('#host img[src="./assets/tim-loehr.jpg"]');
    await expect(portrait).toBeVisible();
    await expect(portrait).toHaveAttribute("alt", "Portrait of workshop host Tim Löhr");
    await expect.poll(() => portrait.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 1100 && image.naturalHeight === 1100)).toBe(true);
    await presenter.close();
    expect(serviceRequests).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("repairs the third workshop lab and invalidates results after a changed choice", async ({ page, request }) => {
    const base = "/workshops/datenbereitschaft-fuer-ki";
    await page.goto(`${base}/data-readiness-kit/readiness-lab.html`);
    await page.getByRole("button", { name: "Test My Choices" }).click();
    await expect(page.locator("#simulation-grade")).not.toHaveText("6 / 6 cases · 10 / 10 controls");
    for (const [id, value] of Object.entries({
      "sim-surface": "governed",
      "sim-metric": "ending_snapshot",
      "sim-boundary": "least_privilege",
      "sim-freshness": "governed",
      "sim-yardstick": "corpus",
    })) {
      await page.locator(`#${id}`).selectOption(value);
    }
    await page.getByRole("button", { name: "Test My Choices" }).click();
    await expect(page.locator("#simulation-grade")).toHaveText("6 / 6 cases · 9 / 10 controls");
    await expect(page.locator("#status")).toHaveText("PILOT ONLY");
    await page.locator("#sim-metric").selectOption("movement");
    await expect(page.locator("#simulation-grade")).toHaveText("0 / 6 cases · 0 / 10 controls");
    const response = await request.get(`${base}/data-readiness-kit.zip`);
    expect(response.status()).toBe(200);
    expect((await response.body()).subarray(0, 2).toString("ascii")).toBe("PK");
  });
});
