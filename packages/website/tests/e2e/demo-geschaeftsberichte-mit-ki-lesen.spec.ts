import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { listZipEntries, readZipText } from "../../src/lib/zip/read";

const SLUG = "geschaeftsberichte-mit-ki-lesen";
const SKILL = readFileSync(
  join(process.cwd(), "content/skills/kennzahlen-steckbrief/SKILL.md"),
  "utf8",
);
/** A string that must never leave the browser: it goes into the visitor's own card. */
const MARKER = "MARKER-7f3a-Werk2";

/** Console errors and page errors of one run: the demo must be silent. */
function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on(
    "console",
    (message) => message.type() === "error" && errors.push(message.text()),
  );
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

const clock = (page: Page) => page.locator("[data-demo-clock]");
const caption = (page: Page) => page.locator("[data-w02-caption]");
const dock = (page: Page) => page.locator(".w02-dock");

/** ArrowRight until the clock shows `id`. Arrows inside a radio group move the choice, so focus leaves it first. */
async function advanceTo(page: Page, id: string) {
  await expect
    .poll(
      async () => {
        await page.evaluate(() =>
          (document.activeElement as HTMLElement | null)?.blur(),
        );
        const now = await clock(page).getAttribute("data-beat");
        if (now !== id) await page.keyboard.press("ArrowRight");
        return now;
      },
      { timeout: 8000, intervals: [300] },
    )
    .toBe(id);
}

async function open(
  page: Page,
  path: string,
  size = { width: 390, height: 844 },
) {
  await page.setViewportSize(size);
  const response = await page.goto(path, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
}

async function start(page: Page) {
  await page.locator("[data-demo-start]").click();
  await expect(clock(page)).toHaveAttribute("data-beat", "schaetzen");
}

test.describe(`/demos/${SLUG}`, () => {
  for (const [prefix, label] of [
    ["", "DE"],
    ["/en", "EN"],
  ] as const) {
    test(`${label} 390x664: the intro fits and its start button is above the fold`, async ({
      page,
    }) => {
      await open(page, `${prefix}/demos/${SLUG}`, { width: 390, height: 664 });
      const card = await page.locator("[data-demo-intro]").boundingBox();
      const button = await page.locator("[data-demo-start]").boundingBox();
      // The contract budget is 470; the shared footnote and the explore row cost DE about 4 px more (integrator note).
      expect(card?.height ?? 999).toBeLessThanOrEqual(480);
      expect((button?.y ?? 999) + (button?.height ?? 0)).toBeLessThanOrEqual(
        600,
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(390);
    });
  }

  test("DE: the guided path, every number from the kit", async ({ page }) => {
    const errors = watch(page);
    await open(page, `/demos/${SLUG}`);
    await start(page);

    await page
      .locator(".w02-guess")
      .getByRole("button", { name: "Besser" })
      .click();
    await expect(caption(page)).toContainText("‚Besser‘");
    await expect(page.locator(".w02-report-strip")).toContainText("3,21");

    await advanceTo(page, "zaehlen");
    await dock(page).getByRole("radio", { name: "Stück betroffen" }).click();
    await expect(caption(page)).toContainText("309");
    await dock(page).getByRole("radio", { name: "Stück verschrottet" }).click();
    // All three counters seen: the caption says the same rows give all three answers, and echoes the guess.
    await expect(caption(page)).toContainText("dieselben 47 Meldungen");
    await expect(caption(page)).toContainText("‚Besser‘");
    const denom = dock(page).getByRole("switch");
    await expect(denom).toBeVisible();
    await denom.click();
    await expect(caption(page)).toContainText("1.539");
    await denom.click();

    await advanceTo(page, "zusammenfassen");
    await expect(page.locator('[data-w02-gauge="records"]')).toHaveText("2,51");
    await dock(page)
      .getByRole("button", { name: "Alle zusammenfassen" })
      .click();
    await expect(page.locator('[data-w02-gauge="records"]')).toHaveText(
      "1,86",
      { timeout: 3000 },
    );
    await expect(caption(page)).toContainText(
      "Aus 23 Meldungen sind 17 geworden",
    );

    await advanceTo(page, "zeitraum");
    await expect(page.locator("[data-w02-growth]")).toContainText("22,4");
    await page.locator(".w02-calendar [role=slider]").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("[data-w02-growth]")).toContainText("4,8", {
      timeout: 3000,
    });
    // Per week the caption gives the kit's figure, −2,1 %; per week it starts from the file's months again.
    await dock(page).getByRole("radio", { name: "Je Versandwoche" }).click();
    await expect(caption(page)).toContainText("2,1\u202f% weniger");
    await expect(caption(page)).toContainText("So rechnet das Kit");
    // Dropping the last week per week: the caption names its own figure and still says which one is the kit's.
    await page.locator(".w02-calendar [role=slider]").focus();
    await page.keyboard.press("ArrowRight");
    await expect(caption(page)).toContainText(
      "Das Kit zählt diese Woche zum September",
      { timeout: 3000 },
    );
    await expect(caption(page)).toContainText("2,1\u202f% weniger");

    await advanceTo(page, "nachrechnen");
    const handles = page.locator(".w02-carpet [role=slider]");
    await handles.nth(1).focus();
    for (let step = 0; step < 5; step++)
      await page.keyboard.press("ArrowRight");
    await handles.nth(0).focus();
    for (let step = 0; step < 4; step++)
      await page.keyboard.press("ArrowRight");
    await expect(page.locator(".w02-trace[data-match]")).toHaveCount(1);
    await expect(page.locator("[data-w02-trace-sum]")).toContainText(
      "4.124.238",
      { timeout: 3000 },
    );

    await advanceTo(page, "entscheiden");
    await expect(page.locator("[data-w02-card]").first()).toContainText(
      "Verschrottete Stück",
    );
    await expect(page.locator("[data-w02-checks] [data-ok]")).toHaveCount(3);
    expect(errors).toEqual([]);
  });

  test("DE: keys move, reset and close; r inside a field is text", async ({
    page,
  }) => {
    await open(page, `/demos/${SLUG}`);
    await start(page);
    await page
      .locator(".w02-guess")
      .getByRole("button", { name: "Gleich" })
      .click();
    await advanceTo(page, "zaehlen");
    await page.keyboard.press("ArrowLeft");
    await expect(clock(page)).toHaveAttribute("data-beat", "schaetzen");
    await advanceTo(page, "zaehlen");

    await page
      .locator(".w02-toolbar")
      .getByRole("button", { name: "Tabelle" })
      .click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();

    await advanceTo(page, "deine-kennzahl");
    const name = page.locator('[data-own-field="name"]');
    await name.fill("Quote");
    await name.press("r");
    await expect(name).toHaveValue("Quoter");
    await expect(clock(page)).toHaveAttribute("data-beat", "deine-kennzahl");
    await name.blur();

    await page.locator("body").press("r");
    await expect(clock(page)).toHaveAttribute("data-beat", "schaetzen");
    await expect(page.locator('.w02-guess [aria-pressed="true"]')).toHaveCount(
      0,
    );
    await page
      .locator(".w02-guess")
      .getByRole("button", { name: "Schlechter" })
      .click();
    await page.locator("body").press("Shift+R");
    await expect(clock(page)).toHaveAttribute("data-beat", "schaetzen");
    await expect(page.locator('.w02-guess [aria-pressed="true"]')).toHaveCount(
      0,
    );
  });

  for (const [prefix, de] of [
    ["", true],
    ["/en", false],
  ] as const) {
    test(`${de ? "DE" : "EN"}: the own card goes into references and never leaves the browser`, async ({
      page,
      baseURL,
    }) => {
      const origin = new URL(baseURL ?? "http://localhost:3000").origin;
      const outbound: string[] = [];
      page.on("request", (request) => {
        const leaves = new URL(request.url()).origin !== origin;
        const carries =
          request.url().includes(MARKER) ||
          (request.postData() ?? "").includes(MARKER);
        if (leaves || carries) outbound.push(request.url());
      });
      await open(page, `${prefix}/demos/${SLUG}?beat=deine-kennzahl`);
      await expect(clock(page)).toHaveAttribute("data-beat", "deine-kennzahl");
      const own = page.locator("[data-w02-own]");
      await own
        .getByRole("button", { name: de ? "Vorgänge" : "Events", exact: true })
        .click();
      await expect(own.locator('[data-finding="R1"]')).toBeVisible();
      await own
        .getByRole("button", { name: de ? "Menge" : "Quantity", exact: true })
        .click();

      await page.locator('[data-own-field="name"]').fill(`Quote ${MARKER}`);
      await page
        .locator('[data-own-field="decision"]')
        .fill(
          de
            ? "Lieferant wechseln, ja oder nein"
            : "Switch supplier, yes or no",
        );
      await page
        .locator('[data-own-field="numerator"]')
        .fill(de ? "Reklamierte Stück" : "Units returned");
      await page
        .locator('[data-own-field="denominator"]')
        .fill(de ? "Gelieferte Stück" : "Units delivered");
      await own
        .getByRole("button", {
          name: de ? "Je Woche" : "Per week",
          exact: true,
        })
        .click();
      await own
        .getByRole("button", {
          name: de ? "Steckbrief hinzufügen" : "Add metric card",
        })
        .click();
      await expect(own).toContainText(MARKER);

      await advanceTo(page, "mitnehmen");
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 5000 }),
        page.locator("[data-w02-zip]").click(),
      ]);
      expect(download.suggestedFilename()).toBe("kennzahlen-steckbrief.zip");
      const bytes = new Uint8Array(readFileSync((await download.path())!));
      expect(listZipEntries(bytes).map((entry) => entry.path)).toEqual([
        "kennzahlen-steckbrief/SKILL.md",
        "kennzahlen-steckbrief/references/steckbriefe.md",
      ]);
      expect(readZipText(bytes, "kennzahlen-steckbrief/SKILL.md")).toBe(SKILL);
      const references =
        readZipText(bytes, "kennzahlen-steckbrief/references/steckbriefe.md") ??
        "";
      expect(references).toContain(
        de ? "# Unsere Steckbriefe" : "# Our metric cards",
      );
      expect(references).toContain(`### Quote ${MARKER}`);
      expect(outbound).toEqual([]);
    });
  }

  test("DE 390x664: every handle can be touched, the dock never covers it, and live glass stays in budget", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    for (const beat of ["zaehlen", "zeitraum", "nachrechnen", "entscheiden"]) {
      const response = await page.goto(`/demos/${SLUG}?beat=${beat}`, {
        waitUntil: "networkidle",
      });
      expect(response?.status()).toBe(200);
      await expect(clock(page)).toHaveAttribute("data-beat", beat);
      const report = await page.evaluate(() => {
        const handles = [
          ...document.querySelectorAll<HTMLElement>("[role=slider]"),
        ].filter((el) => el.getBoundingClientRect().width > 0);
        const hits = handles.map((handle) => {
          const box = handle.getBoundingClientRect();
          const hit = document.elementFromPoint(
            box.x + box.width / 2,
            box.y + box.height / 2,
          );
          return {
            label: handle.getAttribute("aria-label") ?? "",
            ok: !!hit && (hit === handle || handle.contains(hit)),
          };
        });
        const live = [
          ...document.querySelectorAll<HTMLElement>('[data-live="on"]'),
        ].filter((el) => {
          const box = el.getBoundingClientRect();
          return (
            box.width > 0 &&
            box.height > 0 &&
            getComputedStyle(el).backdropFilter !== "none"
          );
        }).length;
        return { hits, live };
      });
      expect(report.hits.length, `${beat}: handles`).toBeGreaterThan(0);
      expect(
        report.hits.filter((hit) => !hit.ok),
        `${beat}: covered handles`,
      ).toEqual([]);
      expect(report.live, `${beat}: live glass surfaces`).toBeLessThanOrEqual(
        3,
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(390);
    }
  });

  test("DE 390x664: a long caption folds behind Mehr, and Claude's condition opens in a sheet with its gaps", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto(`/demos/${SLUG}?beat=zusammenfassen`, {
      waitUntil: "networkidle",
    });
    await expect(clock(page)).toHaveAttribute("data-beat", "zusammenfassen");
    await page.locator("[data-w02-condition-open]").click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await sheet.locator('.w02-gap[data-gap="period"]').click();
    await expect(sheet.locator("[data-w02-gap-text]")).toContainText(
      "Zeitraum",
    );
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();

    await page.goto(`/demos/${SLUG}?beat=zeitraum`, {
      waitUntil: "networkidle",
    });
    const more = page.locator("[data-w02-caption-more]");
    await expect(more).toBeVisible();
    await more.click();
    await expect(more).toHaveAttribute("aria-expanded", "true");
  });

  test("reduced motion: merging shows the final figure at once", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      reducedMotion: "reduce",
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await page.goto(`/demos/${SLUG}?beat=zusammenfassen`, {
      waitUntil: "networkidle",
    });
    await expect(clock(page)).toHaveAttribute("data-beat", "zusammenfassen");
    await dock(page)
      .getByRole("button", { name: "Alle zusammenfassen" })
      .click();
    await expect(page.locator('[data-w02-gauge="records"]')).toHaveText(
      "1,86",
      { timeout: 500 },
    );
    await context.close();
  });
});
