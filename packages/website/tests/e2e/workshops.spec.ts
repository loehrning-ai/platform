import { expect, test, type Page } from "@playwright/test";

/**
 * ScrollToTop resets the scroll position once the app hydrates. A click on a
 * row far down the hub before that can be scrolled out from under the tap,
 * so hub interactions wait for the hydration marker first.
 */
async function openHub(page: Page): Promise<void> {
  await page.goto("/workshops");
  await page
    .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
    .waitFor({ state: "attached" });
}

test.describe("workshop self-study journey", () => {
  test("lists and opens the annual-report self-study workshop", async ({
    page,
  }) => {
    await openHub(page);
    // Each hub row has exactly one link into its workshop page.
    const workshop = page.getByRole("link", {
      name: "Workshop ansehen: Geschäftsberichte mit KI lesen",
    });
    await expect(workshop).toBeVisible();
    await workshop.click();
    await expect(page).toHaveURL(
      /\/workshops\/geschaeftsberichte-mit-ki-lesen$/,
    );
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Geschäftsberichte/i,
    );
    await expect(page.locator("body")).not.toContainText("No paid service");
    // Detail page (design-direction 7.2): the cover starts the primary
    // material, the agenda is a Route, and nothing is hidden in accordions.
    // The band is the workshop's poster (IDEA for W02) and still starts the deck.
    const cover = page.locator("[data-cover-band]");
    await expect(cover).toHaveAttribute("data-plakat", "idea");
    await expect(cover.getByRole("link", { name: "Deck öffnen" })).toHaveAttribute(
      "href",
      "/workshops/geschaeftsberichte-mit-ki-lesen/slides.html",
    );
    await expect(page.getByRole("list", { name: "Ablauf" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Material", exact: true })).toBeVisible();
    await expect(page.locator("main details")).toHaveCount(0);
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
    await page.getByRole("button", { name: "Test my choices" }).click();
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
    await page.getByRole("button", { name: "Test my choices" }).click();
    await expect(page.locator("#simulation-grade")).toHaveText("6 / 6 cases · 9 / 10 controls");
    await expect(page.locator("#status")).toHaveText("PILOT ONLY");
    await page.locator("#sim-metric").selectOption("movement");
    await expect(page.locator("#simulation-grade")).toHaveText("0 / 6 cases · 0 / 10 controls");
    const response = await request.get(`${base}/data-readiness-kit.zip`);
    expect(response.status()).toBe(200);
    expect((await response.body()).subarray(0, 2).toString("ascii")).toBe("PK");
  });

  test("lists the workshops as compact rows on a phone, each one tap target", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHub(page);
    const rows = page.getByTestId("workshop-row");
    await expect(rows).toHaveCount(4);

    // A phone row is a list line, not a card: tile, duration, title and one
    // "you leave with" sentence. 140px leaves room for the wider fallback
    // face; the brand face measures 97 to 117px.
    for (const row of await rows.all()) {
      const box = await row.boundingBox();
      expect(box, "row bounds").not.toBeNull();
      expect(box!.height).toBeLessThan(140);
      await expect(row.locator("[data-workshop-question]")).toHaveCount(0);
      await expect(row.locator("h3 + p")).toBeHidden();
      await expect(row.locator("[data-workshop-tile]")).toBeVisible();
      // The one link covers the whole row on a phone.
      const link = row.getByRole("link");
      await expect(link).toHaveCount(1);
      const target = await link.boundingBox();
      expect(target!.height).toBeGreaterThanOrEqual(Math.min(44, box!.height));
      expect(target!.width).toBeGreaterThanOrEqual(box!.width - 1);
      // The outcome runs the full text width: it never sits in a narrow
      // column beside its label.
      const facts = await row.locator("dl").boundingBox();
      const heading = await row.locator("h3").boundingBox();
      expect(facts!.x).toBeLessThanOrEqual(heading!.x + 1);
      expect(facts!.width).toBeGreaterThanOrEqual(heading!.width);
    }
    // No route rail between cover and list on a phone.
    await expect(page.locator("#workshop-route-heading")).toBeHidden();
    // The first workshop starts inside the first screen.
    const first = await rows.first().boundingBox();
    expect(first!.y).toBeLessThan(664);
    // Tapping the row body (not the arrow) opens the workshop.
    const outcome = rows.nth(2).locator("[data-workshop-output]");
    await outcome.scrollIntoViewIfNeeded();
    const spot = await outcome.boundingBox();
    await page.mouse.click(spot!.x + 20, spot!.y + spot!.height / 2);
    await expect(page).toHaveURL(/\/workshops\/geschaeftsberichte-mit-ki-lesen$/);
  });

  test("sets the four workshops as four posters in four palettes", async ({ page }) => {
    await openHub(page);
    // The hub band takes the newest workshop's scene (Workshop 04, Autumn).
    await expect(page.locator("[data-cover-band]")).toHaveAttribute("data-plakat", "autumn");
    const rows = page.getByTestId("workshop-row");
    await expect(rows).toHaveCount(4);
    // Each row shows its own poster; the four palettes are distinct and in
    // the newest-first order of the list.
    const palettes = await rows.evaluateAll((elements) =>
      elements.map((row) => row.querySelector("svg[data-poster]")?.getAttribute("data-poster")),
    );
    expect(palettes).toEqual(["autumn", "bloom", "idea", "lemons"]);
    // The poster grounds really differ on screen: one computed fill per row.
    const grounds = await rows.evaluateAll((elements) =>
      elements.map((row) => {
        const ground = row.querySelector("svg[data-poster] .fill-scene-ground");
        return ground ? getComputedStyle(ground).fill : null;
      }),
    );
    expect(new Set(grounds).size).toBe(4);
    expect(grounds).not.toContain(null);

    // Each workshop page opens with the band in its own scene.
    const expected = {
      "ki-prognosen-einschaetzen": "lemons",
      "geschaeftsberichte-mit-ki-lesen": "idea",
      "datenbereitschaft-fuer-ki": "bloom",
      "esg-berichte-mit-ki": "autumn",
    } as const;
    const bandGrounds = new Set<string>();
    for (const [slug, plakat] of Object.entries(expected)) {
      await page.goto(`/workshops/${slug}`);
      const band = page.locator("[data-cover-band]");
      await expect(band).toHaveAttribute("data-plakat", plakat);
      await expect(band).toHaveClass(new RegExp(`\\bplakat-${plakat}\\b`));
      bandGrounds.add(await band.evaluate((element) => getComputedStyle(element).backgroundColor));
      // The question card sits on paper below the band, not inside it.
      await expect(band.locator("[data-question-card]")).toHaveCount(0);
      await expect(page.locator("[data-question-card]")).toHaveCount(1);
    }
    expect(bandGrounds.size).toBe(4);
  });
});
