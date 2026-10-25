import { expect, test, type Page } from "@playwright/test";

/**
 * "Hundert Startwochen": the core loop on a phone, in both languages. The
 * intro hands over to the visitor, the line magnets onto the forecast
 * (50 of 100), the Waage and the week strip arrive (the count stays in view,
 * or the mini bar stands in), Mein Fall recomputes live, the takeaways
 * follow, nothing is sent and the console stays clean.
 */
const SLUG = "ki-prognosen-einschaetzen";

async function dragHandleTo(page: Page, value: number) {
  const chart = await page.locator("[data-hw-chart]").boundingBox();
  const handle = await page.locator(".hw-handle").boundingBox();
  if (!chart || !handle) throw new Error("chart not laid out");
  const height = chart.height - 4;
  const top = 26;
  const bottom = height - 42;
  const targetY =
    chart.y + 2 + bottom - ((value - 500) / 1000) * (bottom - top);
  const x = handle.x + handle.width / 2;
  const startY = handle.y + handle.height / 2;
  await page.mouse.move(x, startY);
  await page.mouse.down();
  for (let step = 1; step <= 6; step += 1)
    await page.mouse.move(x, startY + ((targetY - startY) * step) / 6);
  await page.mouse.up();
}

for (const prefix of ["", "/en"] as const) {
  test.describe(`${prefix}/demos/${SLUG}`, () => {
    test("plays the core loop at 390px without errors, overflow or network calls", async ({
      page,
    }) => {
      const problems: string[] = [];
      const requests: string[] = [];
      page.on(
        "console",
        (message) =>
          message.type() === "error" && problems.push(message.text()),
      );
      page.on("pageerror", (error) => problems.push(String(error)));
      page.on("request", (request) => {
        if (request.method() !== "GET" && request.url().includes(SLUG))
          requests.push(request.url());
      });

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${prefix}/demos/${SLUG}`, { waitUntil: "networkidle" });

      // First ten seconds: the count and the top of the staircase are on screen at load, the handle is not at the screen edge.
      const first = await page.evaluate(() => {
        const count = document
          .querySelector("[data-hw-count]")!
          .getBoundingClientRect();
        const chart = document
          .querySelector("[data-hw-chart]")!
          .getBoundingClientRect();
        const handle = document.querySelector(".hw-handle")!.getBoundingClientRect();
        return {
          countBottom: count.bottom,
          chartTop: chart.top,
          handleRight: handle.right,
          vw: window.innerWidth,
        };
      });
      expect(first.countBottom).toBeLessThan(844);
      expect(first.chartTop).toBeLessThan(700);
      expect(first.vw - first.handleRight).toBeGreaterThanOrEqual(4);

      // The page brings the whole chart into the first screen before the count-in, clear of the tab bar.
      await expect
        .poll(
          async () =>
            page.evaluate(() => {
              const box = document
                .querySelector("[data-hw-chart]")!
                .getBoundingClientRect();
              return box.top >= 48 && box.bottom <= window.innerHeight - 56;
            }),
          { timeout: 5000 },
        )
        .toBe(true);

      // While the count shows a single digit, "/ 100" sits right behind it (no pinned gap) and the numeral is ink.
      const lowCount = await page.evaluate(
        () =>
          new Promise<{ gap: number; low: boolean } | null>((resolve) => {
            const stop = performance.now() + 4000;
            const look = () => {
              const numeral = document.querySelector("[data-hw-count]")!;
              const unit = document.querySelector(".hw-count-of")!;
              if (numeral.textContent!.length === 1)
                return resolve({
                  gap:
                    unit.getBoundingClientRect().left -
                    numeral.getBoundingClientRect().right,
                  low: numeral.hasAttribute("data-low"),
                });
              if (performance.now() > stop) return resolve(null);
              requestAnimationFrame(look);
            };
            look();
          }),
      );
      if (lowCount) {
        expect(lowCount.gap).toBeLessThanOrEqual(14);
        expect(lowCount.low).toBe(true);
      }
      await page.locator("[data-hw-chart]").scrollIntoViewIfNeeded();

      // The chart runs edge to edge on a phone.
      const chartBox = await page.locator("[data-hw-chart]").boundingBox();
      expect(chartBox?.width).toBeGreaterThanOrEqual(388);

      // Intro ends in the hero state: 76 of 100, line at 1.050, layer 2 not there yet.
      await expect(page.locator('[data-hw][data-phase="live"]')).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.locator("[data-hw-count]")).toHaveText("76");
      await expect(page.getByRole("slider")).toHaveAttribute(
        "aria-valuenow",
        "1050",
      );
      await expect(page.locator("[data-hw-waage]")).toHaveCount(0);

      // Revealing layer 2 must not move the chart under the finger.
      const topBefore =
        (await page.locator("[data-hw-chart]").boundingBox())?.y ?? 0;

      // Drag onto the forecast: the magnet lands on 1.180, 50 of 100.
      await dragHandleTo(page, 1186);
      await expect(page.getByRole("slider")).toHaveAttribute(
        "aria-valuenow",
        "1180",
      );
      await expect(page.locator("[data-hw-count]")).toHaveText("50");
      await expect(page.locator("[data-hw-waage]")).toBeVisible();
      const topAfter =
        (await page.locator("[data-hw-chart]").boundingBox())?.y ?? 0;
      expect(Math.abs(topAfter - topBefore)).toBeLessThanOrEqual(1);

      // The week strip waits for the first tap on the Waage (layer 3).
      await expect(page.locator("[data-hw-strip]")).toHaveCount(0);

      // Working the Waage far below the chart keeps the answer in view: the count itself, or the mini bar.
      await page.getByRole("radio", { name: "9x" }).scrollIntoViewIfNeeded();
      await page.getByRole("radio", { name: "9x" }).click();
      await expect(page.locator("[data-hw-strip]")).toBeVisible();
      await expect
        .poll(async () =>
          page.evaluate(() => {
            const inView = (node: Element | null) => {
              if (!node) return false;
              const box = node.getBoundingClientRect();
              return box.bottom > 0 && box.top < window.innerHeight;
            };
            return (
              inView(document.querySelector("[data-hw-count]")) ||
              inView(document.querySelector("[data-hw-minibar]"))
            );
          }),
        )
        .toBe(true);
      await page.getByRole("radio", { name: "3x" }).click();
      await page.locator("[data-hw-chart]").scrollIntoViewIfNeeded();

      // The chart names only the line under the handle.
      const names = await page.locator(".hw-tag text").allInnerTexts();
      expect(names.length).toBeLessThanOrEqual(1);

      // The best value at 3x is 1.268: 25 of 100.
      await page.locator('[data-hw-chip="best"]').click();
      await expect(page.locator("[data-hw-count]")).toHaveText("25");

      // Picking a weight and then a week keeps the line.
      await page.getByRole("radio", { name: "9x" }).click();
      await page.locator(".hw-cell").nth(2).scrollIntoViewIfNeeded();
      await page.locator(".hw-cell").nth(2).click();
      await expect(page.getByRole("slider")).toHaveAttribute(
        "aria-valuenow",
        "1268",
      );

      // Mein Fall judges at once: a wrong range is explained while typing, the last valid chart stays.
      const p10Field = page.locator('input[name="p10"]');
      await p10Field.scrollIntoViewIfNeeded();
      await p10Field.fill("1500");
      await expect(page.locator(".hw-field-note.is-error").first()).toBeVisible();
      await expect(page.locator(".hw-last-valid")).toBeVisible();
      await p10Field.fill("980");

      // Own numbers recompute and the takeaway names them.
      const p50 = page.locator('input[name="p50"]');
      await p50.fill(prefix ? "2,000" : "2.000");
      await page.locator('input[name="p90"]').fill(prefix ? "2,400" : "2.400");
      await expect(page.locator("[data-hw]")).toHaveAttribute(
        "data-source",
        "own",
      );
      await expect(page.locator("[data-hw-text]").first()).toContainText(
        prefix ? "2,000" : "2.000",
      );

      // Takeaways are visible in full and the copy button confirms.
      await page
        .context()
        .grantPermissions(["clipboard-read", "clipboard-write"])
        .catch(() => undefined);
      const copy = page.locator("[data-hw-block] .hw-copy").first();
      await copy.scrollIntoViewIfNeeded();
      await copy.click();
      await expect(copy).toHaveText(
        prefix ? /Copied|Select and copy/ : /Kopiert|Markieren und kopieren/,
      );

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      expect(requests).toEqual([]);
      expect(problems).toEqual([]);
    });

    test("takes six typed fields live: chip, slider and mail follow the stock", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${prefix}/demos/${SLUG}`, { waitUntil: "networkidle" });
      const fill = async (name: string, value: string) => {
        const input = page.locator(`input[name="${name}"]`);
        await input.scrollIntoViewIfNeeded();
        await input.fill(value);
      };
      await fill("p10", "400");
      await fill("p50", "500");
      await fill("p90", "700");
      await fill("supply", "550");
      await fill("ratio", "2");
      await fill("unit", prefix ? "boxes" : "Kisten");
      await expect(page.getByRole("slider")).toHaveAttribute(
        "aria-valuenow",
        "550",
      );
      await expect(page.locator('[data-hw-chip="today"]')).toContainText("550");
      await expect(page.locator("[data-hw-text]").first()).toContainText(
        prefix ? "stock 550" : "Lager 550",
      );
      await expect(page.locator("[data-hw-text]").first()).toContainText(
        prefix ? "boxes" : "Kisten",
      );
    });

    test("keeps the page scrollable on the chart body and shows the end state with reduced motion", async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: "reduce",
        hasTouch: true,
      });
      const page = await context.newPage();
      await page.goto(`${prefix}/demos/${SLUG}`, { waitUntil: "networkidle" });
      await expect(page.locator("[data-hw-count]")).toHaveText("76");
      await expect(page.locator("[data-hw-waage]")).toBeVisible();
      await expect(page.locator("[data-hw-strip]")).toBeVisible();
      const touchAction = await page.evaluate(() => ({
        body: getComputedStyle(
          document.querySelector("[data-hw-chart]") as Element,
        ).touchAction,
        gutter: getComputedStyle(
          document.querySelector(".hw-gutter") as Element,
        ).touchAction,
      }));
      expect(touchAction.gutter).toBe("none");
      expect(touchAction.body).not.toBe("none");
      await context.close();
    });
  });
}
