import { expect, test, type Page } from "@playwright/test";

const SLUG = "geschaeftsberichte-mit-ki-lesen";

/** Console errors and page errors of one run, filtered to nothing: the demo must be silent. */
function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

const number = (page: Page) => page.getByTestId("giant-number").locator("span").first();
const noOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe(`/demos/${SLUG}`, () => {
  for (const [prefix, de] of [["", true], ["/en", false]] as const) {
    test(`${prefix || "/"}demos plays the core loop at 390px without errors`, async ({ page }) => {
      const errors = watch(page);
      await page.setViewportSize({ width: 390, height: 844 });
      const response = await page.goto(`${prefix}/demos/${SLUG}`, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(200);
      const stage = page.locator(".mg-stage");
      await stage.scrollIntoViewIfNeeded();

      // The finished hero is server-rendered; the pass replays once and ends on it by itself (about 4 s), or at once on touch.
      await expect(number(page)).toHaveText(/\+26/, { timeout: 9000 });
      await expect(page.getByTestId("weeks-label")).toHaveText(de ? "Wochen: 4 | 5" : "Weeks: 4 | 5");

      // Move the line one week: +26 % becomes -20 %.
      await page.getByRole("button", { name: de ? "Linie nach rechts" : "Move line right" }).click();
      await expect(number(page)).toHaveText(/−20/);

      // Drag the handle to the left edge of the allowed range.
      const handle = page.getByRole("slider").first();
      const box = (await handle.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x - 120, box.y + box.height / 2, { steps: 8 });
      await page.mouse.up();
      await expect(handle).toHaveAttribute("aria-valuenow", "3");
      await expect(number(page)).toHaveText(/\+105/);
      expect(box.width).toBeGreaterThanOrEqual(47.5);
      expect(box.height).toBeGreaterThanOrEqual(47.5);

      // Per week: the number barely moves, and the stamp names the calendar.
      await page.getByRole("button", { name: de ? "Linie nach rechts" : "Move line right" }).click();
      await page.getByRole("radio", { name: de ? "Pro Woche" : "Per week" }).first().click();
      await expect(number(page)).toHaveText(de ? /\+0,7/ : /\+0\.7/);
      await expect(page.locator(".mg-stamp")).toContainText(/97/);

      // Act 2: same switch, other axis.
      const act2 = page.locator(".mg-act2");
      await act2.scrollIntoViewIfNeeded();
      await act2.getByRole("radio").nth(1).click();
      await expect(act2).toContainText(de ? "2,2-Fache" : "2.2 times");

      // Your own numbers: fill the field, the result and the takeaway follow.
      const own = page.locator(".mg-compare input[type=text]").nth(1);
      await own.fill(de ? "20.000.000" : "20,000,000");
      await expect(page.getByTestId("take-sentence")).toContainText(de ? "20,00 Mio. €" : "EUR 20.00M");
      await expect(page.locator(".mg-tag")).toHaveText(de ? "Deine Zahlen" : "Your numbers");

      // Copy shows a visible confirmation.
      await page.context().grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
      await page.locator(".mg-take .mg-btn").first().click();
      await expect(page.locator(".mg-copied").first()).not.toBeEmpty();

      expect(await noOverflow(page)).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }

  test("reduced motion shows +26 % and -20 % side by side with both ticks, no intro", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("giant-number")).toContainText(/\+26.*−20/s);
    expect(await noOverflow(page)).toBeLessThanOrEqual(0);
  });

  test("desktop: number, towers, switch and ruler share the first 900 px; Act 2 beside the comparison; takeaway below", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "domcontentloaded" });
    const box = async (selector: string) => (await page.locator(selector).first().boundingBox())!;
    const [stage, chart, sw, ruler, act2, compare, take] = [
      await box(".mg-stage"), await box(".mg-chart"), await box("#mg-mode"), await box(".mg-rulerwrap"),
      await box(".mg-act2"), await box(".mg-compare"), await box(".mg-take"),
    ];
    expect(chart.y + chart.height).toBeLessThan(900);
    expect(sw.y + sw.height).toBeLessThan(900);
    expect(ruler.y + ruler.height).toBeLessThan(900);
    expect(compare.x).toBeGreaterThan(act2.x + act2.width);
    expect(Math.abs(compare.y - act2.y)).toBeLessThan(2);
    expect(act2.y).toBeGreaterThan(stage.y + stage.height);
    expect(take.y).toBeGreaterThan(Math.max(act2.y + act2.height, compare.y + compare.height));
    expect(await noOverflow(page)).toBeLessThanOrEqual(0);
    await expect(page.locator(".mg-room-toggle")).toBeVisible();
  });

  test("phone 360x740: number, towers, switch and ruler all end above the tab bar", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(number(page)).toHaveText(/\+26/);
    for (const selector of [".mg-chart", "#mg-mode", ".mg-rulerwrap"]) {
      const b = (await page.locator(selector).first().boundingBox())!;
      expect(b.y + b.height, selector).toBeLessThan(740 - 56);
    }
    await expect(page.locator(".mg-room-toggle")).toBeHidden();
    expect(await noOverflow(page)).toBeLessThanOrEqual(0);
  });

  test("fast key presses are all counted, and the plot itself is a drag target", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "domcontentloaded" });
    const handle = page.getByRole("slider").first();
    await handle.focus();
    for (let i = 0; i < 4; i += 1) await page.keyboard.press("ArrowRight");
    await expect(handle).toHaveAttribute("aria-valuenow", "6");
    for (let i = 0; i < 4; i += 1) await page.keyboard.press("ArrowLeft");
    await expect(handle).toHaveAttribute("aria-valuenow", "3");
    const plot = (await page.locator(".mg-plot").boundingBox())!;
    await page.mouse.click(plot.x + plot.width * 0.8, plot.y + plot.height * 0.8);
    await expect(handle).toHaveAttribute("aria-valuenow", "6");
  });
});
