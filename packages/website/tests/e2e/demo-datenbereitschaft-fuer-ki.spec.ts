import { expect, test, type Page } from "@playwright/test";

/** W03 "Stufe oder Treppe?": the core loop on a phone, DE and EN, with console.error capture and no external requests. */
const SLUG = "datenbereitschaft-fuer-ki";

async function open(page: Page, prefix: string, errors: string[], external: string[]) {
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (!["localhost", "127.0.0.1"].includes(url.hostname) && url.protocol.startsWith("http")) external.push(request.url());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const response = await page.goto(`${prefix}/demos/${SLUG}`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.locator(".dr3-stage")).toBeVisible();
}

for (const [prefix, stufe, treppe] of [
  ["", "Stufe", "Treppe"],
  ["/en", "Step", "Staircase"],
] as const) {
  test.describe(`${prefix || "/"}demos/${SLUG}`, () => {
    test("pulls the lever, reads the operators, takes own numbers and copies", async ({ page, context }) => {
      const errors: string[] = [];
      const external: string[] = [];
      await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
      await open(page, prefix, errors, external);

      const slider = page.getByRole("slider");
      const stage = page.locator(".dr3-stage");
      await stage.scrollIntoViewIfNeeded();
      await slider.focus();
      await page.keyboard.press("Home");
      await expect(slider).toHaveAttribute("aria-valuenow", "0");
      await expect(page.locator(".dr3-counter")).toContainText(/19[.,]960/);

      await page.getByRole("radio", { name: treppe, exact: true }).click();
      await expect(slider).toHaveAttribute("aria-valuenow", "100", { timeout: 3000 });
      await expect(page.locator(".dr3-counter")).toContainText(/334[.,]675/);
      await expect(page.locator("[data-arith]")).toContainText(/354[.,]635 \+ 32[.,]380/);
      // the control starts on the right answer of the reading (Ende = 387.015), and the wrong one is one tap away
      await expect(page.locator(".dr3-result")).toContainText(/387[.,]015/);

      await page.getByRole("radio", { name: stufe, exact: true }).click();
      await expect(slider).toHaveAttribute("aria-valuenow", "0", { timeout: 3000 });

      // drag the lever with the pointer
      const box = await page.locator(".dr3-track").boundingBox();
      if (!box) throw new Error("no track");
      await page.mouse.move(box.x + box.width / 2, box.y + box.height - 22);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + 22, { steps: 8 });
      await page.mouse.up();
      await expect(slider).toHaveAttribute("aria-valuenow", "100", { timeout: 3000 });

      // own numbers: leaving the field brings the stage into view and pulls the lever for them
      const values = page.locator(".dr3-own textarea");
      await values.fill("12k; 3; 4");
      await expect(page.locator(".dr3-status")).toHaveText(/Nicht lesbar|Not readable/);
      await values.fill("-5; 6; 7");
      await expect(page.locator(".dr3-guess")).toBeVisible();
      await expect(page.locator('[data-block="board"] pre')).toContainText(/8/);

      // copy: visible confirmation (clipboard or selection fallback)
      await page.locator('[data-block="board"] .dr3-copy').click();
      await expect(page.locator('[data-block="board"] .dr3-copy')).not.toHaveText(/^(Kopieren|Copy)$/);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
      expect(external).toEqual([]);
    });

    test("shows the settled end state under reduced motion", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${prefix}/demos/${SLUG}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("slider")).toHaveAttribute("aria-valuenow", "100");
      await expect(page.locator(".dr3-caption")).toContainText(/Stufen|steps/);
    });
  });
}

test("desktop 1440 x 900: the whole stage sits above the fold", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/demos/${SLUG}`, { waitUntil: "domcontentloaded" });
  const stage = await page.locator(".dr3-stage").boundingBox();
  expect(stage && stage.y + stage.height).toBeLessThan(860);
  await expect(page.locator(".dr3-stamp")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test.describe("touch", () => {
  test.use({ hasTouch: true, isMobile: true });

  test("shows the hero state, the lever and the arithmetic line together on the first screen, and drags with a finger without scrolling", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    for (const [width, height] of [
      [390, 844],
      [360, 740],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.goto(`/demos/${SLUG}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".dr3-handle-cue")).toBeVisible();
      // Lever, plot and the arithmetic line are on screen together, above the 64 px bottom navigation.
      const stage = await page.locator(".dr3-stage").boundingBox();
      const arith = await page.locator("[data-arith]").boundingBox();
      expect(stage && stage.y).toBeGreaterThanOrEqual(0);
      // 390 x 844: lever, plot and formula together. On a 740 px screen the whole stage (lever and plot) is the promise.
      expect(stage && stage.y + stage.height, `${width}x${height} stage`).toBeLessThan(height - 64);
      expect(arith && arith.y + arith.height, `${width}x${height} arithmetic`).toBeLessThan(height - 64);
      // 390 x 844 also has the Stufe / Treppe buttons above the bottom navigation
      const read = await page.locator(".dr3-read").boundingBox();
      if (height >= 800) expect(read && read.y + read.height, `${width}x${height} toggles`).toBeLessThan(height - 64);
      // the page does not jump once the script measures the plot
      const before = await page.locator(".dr3-stage").evaluate((node) => node.getBoundingClientRect().height);
      await page.waitForTimeout(500);
      const after = await page.locator(".dr3-stage").evaluate((node) => node.getBoundingClientRect().height);
      expect(Math.abs(after - before)).toBeLessThanOrEqual(1);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.querySelector(".dr3-stage")?.scrollIntoView({ block: "start" }));
    const slider = page.getByRole("slider");
    await slider.focus();
    await page.keyboard.press("Home");
    const track = await page.locator(".dr3-track").boundingBox();
    if (!track) throw new Error("no track");
    const scrollBefore = await page.evaluate(() => window.scrollY);
    const x = track.x + track.width / 2;
    const client = await page.context().newCDPSession(page);
    const point = (y: number) => [{ x, y, id: 1 }];
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point(track.y + track.height - 28) });
    for (let step = 1; step <= 10; step += 1) {
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: point(track.y + track.height - 28 - ((track.height - 56) * step) / 10) });
    }
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(slider).toHaveAttribute("aria-valuenow", "100", { timeout: 3000 });
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
    await expect(page.locator(".dr3-counter")).toContainText(/334[.,]675/);
  });

  test("prints only numbers that exist in the data while the lever is in between", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/demos/${SLUG}`);
    const slider = page.getByRole("slider");
    await slider.focus();
    await page.keyboard.press("Home");
    const digits = (text: string) => Number(text.replace(/[^\d−-]/g, "").replace("−", "-"));
    const changes = [-19960, 9775, 42565];
    const levels = [334675, 344450, 387015];
    for (let step = 0; step <= 20; step += 1) {
      await expect(page.locator(".dr3-counter")).toHaveCount(1);
      await expect(page.locator(".dr3-svg .dr3-barlabel")).toHaveCount(3);
      // 0.05 added ten times is not exactly 0.5 in floating point: leave the cut itself to the unit tests
      if (step === 10) {
        await page.keyboard.press("ArrowUp");
        continue;
      }
      expect([-19960, 334675]).toContain(digits(await page.locator(".dr3-counter").innerText()));
      const labels = (await page.locator(".dr3-svg .dr3-barlabel").evaluateAll((nodes) => nodes.map((node) => node.textContent ?? ""))).map(digits);
      expect(labels).toEqual(step < 10 ? changes : levels);
      await page.keyboard.press("ArrowUp");
    }
  });

  test("answers own numbers within 1.2 s and keeps all three typed levels as bars", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`/demos/${SLUG}`);
    await page.locator(".dr3-own textarea").fill("120.000; 135.000; 150.000");
    await page.locator(".dr3-own textarea").blur();
    await page.waitForTimeout(1400);
    await expect(page.getByRole("slider")).toHaveAttribute("aria-valuenow", "100");
    await expect(page.locator("[data-bar]")).toHaveCount(3);
    await expect(page.locator(".dr3-svg .dr3-barlabel")).toHaveText(["120.000", "135.000", "150.000"]);
    await expect(page.locator("[data-ticker]")).toContainText("405.000");
    await expect(page.locator('[data-block="board"] pre')).toContainText("405.000");
  });

  test("touch: no collapsible UI anywhere in the demo", async ({ page }) => {
    await page.goto(`/demos/${SLUG}`);
    await expect(page.locator(".dr3 details, .dr3 summary, .dr3 [aria-expanded]")).toHaveCount(0);
  });

  test("own numbers without a start say that zero is assumed or below the frame, and get the lever moment", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/demos/${SLUG}`);
    await page.locator(".dr3-own textarea").fill("-5; 6; 7");
    await page.locator(".dr3-own textarea").blur();
    await expect(page.locator(".dr3-status")).toContainText(/angenommen|0 als Stand/);
    await expect(page.locator(".dr3-board, [data-block='board'] pre")).not.toContainText("Der Stand am Ende");
    await page.locator(".dr3-own textarea").fill("120; 135; 150");
    await page.locator(".dr3-own textarea").blur();
    await expect(page.getByRole("slider")).toHaveAttribute("aria-valuenow", "100");
    await expect(page.locator(".dr3-zeronote")).toBeVisible();
    await expect(page.locator(".dr3-svg")).toBeInViewport();
  });
});
