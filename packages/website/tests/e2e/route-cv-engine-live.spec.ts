import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";
import {
  collectBrowserErrors,
  formatBrowserErrors,
  meaningfulBrowserErrors,
} from "./fixtures/console";
import {
  composeCvYaml,
  cvLiveStateKey,
  type CvLiveChoice,
} from "../../src/lib/open-source/cv-live/compose";
import { CV_LIVE_COPY } from "../../src/lib/open-source/cv-live/copy";
import {
  CV_LIVE_DATA,
  CV_LIVE_MAX_STATIONS,
  cvLiveState,
} from "../../src/lib/open-source/cv-live/live-data";

/**
 * /open-source/tools/cv-engine/live: real CV Engine pages in a shadow root.
 * The browser's page height has to agree with WeasyPrint's, or the readout
 * beside the sheet would describe a different page than the one shown.
 */

const ROUTE = "/open-source/tools/cv-engine/live";
const TOLERANCE_PX = 2;

const HEIGHT_CASES: readonly CvLiveChoice[] = [
  { lang: "de", template: "classic", density: "normal", stations: 0 },
  { lang: "de", template: "classic", density: "normal", stations: 4 },
  { lang: "de", template: "classic", density: "tight", stations: 4 },
  { lang: "en", template: "classic", density: "airy", stations: 3 },
  { lang: "de", template: "sidebar", density: "normal", stations: 7 },
  { lang: "en", template: "sidebar", density: "tight", stations: 2 },
  { lang: "de", template: "executive", density: "airy", stations: 3 },
  { lang: "en", template: "executive", density: "normal", stations: 4 },
  { lang: "de", template: "ats-compact", density: "normal", stations: 6 },
  { lang: "en", template: "ats-compact", density: "tight", stations: 1 },
];

function deepLink(choice: CvLiveChoice): string {
  const params = new URLSearchParams({
    vorlage: choice.template,
    dichte: choice.density,
    sprache: choice.lang,
    stationen: String(choice.stations),
  });
  return `${ROUTE}?${params.toString()}`;
}

function collectForeignRequests(page: Page): string[] {
  const foreign: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.protocol === "data:" || url.protocol === "blob:") return;
    if (!["localhost", "127.0.0.1"].includes(url.hostname)) foreign.push(url.href);
  });
  return foreign;
}

/** Waits until the sheet was measured for exactly this state. */
async function measured(page: Page, choice: CvLiveChoice) {
  const key = cvLiveStateKey(choice);
  const live = page.locator("[data-cv-live]");
  await expect(live).toHaveAttribute("data-state", key);
  await expect(live).toHaveAttribute("data-measured-state", key, { timeout: 15_000 });
  return live.evaluate((node: HTMLElement) => ({
    mainPx: Number(node.dataset.measuredMainPx),
    naturalPx: Number(node.dataset.measuredNaturalPx),
  }));
}

test("the browser sets each page within 2 px of WeasyPrint", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectBrowserErrors(page);
  for (const choice of HEIGHT_CASES) {
    await page.goto(deepLink(choice));
    const engine = cvLiveState(choice);
    const browser = await measured(page, choice);
    const key = cvLiveStateKey(choice);
    expect(Math.abs(browser.mainPx - engine.mainPx), `${key} text height`).toBeLessThanOrEqual(
      TOLERANCE_PX,
    );
    expect(
      Math.abs(browser.naturalPx - engine.naturalPx),
      `${key} natural height`,
    ).toBeLessThanOrEqual(TOLERANCE_PX);
    await expect(page.locator("[data-cv-live]")).toHaveAttribute(
      "data-exit",
      String(engine.exitCode),
    );
  }
  const meaningful = meaningfulBrowserErrors(errors);
  expect(meaningful, formatBrowserErrors(meaningful)).toEqual([]);
});

test("one more job overflows, tight brings it back, R starts over", async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectBrowserErrors(page);
  const foreign = collectForeignRequests(page);
  const copy = CV_LIVE_COPY.de;

  const response = await page.goto(ROUTE);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(copy.title);

  const status = page.getByRole("status").filter({ hasText: "$ build.py" });
  const advice = page.locator("[data-cv-advice]");
  const more = page.locator("[data-cv-more]");
  const start: CvLiveChoice = { lang: "de", template: "classic", density: "normal", stations: 0 };
  await measured(page, start);

  // A shadow root, no iframe: the CSP keeps frame-src 'none'.
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(
    await page.locator("[data-cv-sheet]").first().evaluate((host) => host.shadowRoot !== null),
  ).toBe(true);
  await expect(status).toHaveAttribute("data-cv-status", "exit-0");

  // Add jobs until the build fails; the button then stops, the pane marks
  // the job that broke the page.
  let stations = 0;
  while (cvLiveState({ ...start, stations }).exitCode === 0) {
    stations++;
    await more.click();
    await measured(page, { ...start, stations });
  }
  expect(stations).toBeLessThan(CV_LIVE_MAX_STATIONS + 1);
  await expect(more).toBeDisabled();
  await expect(more).toContainText(copy.pageFull);
  await expect(status).toHaveAttribute("data-cv-status", "exit-1");
  await expect(status).toContainText("exit 1");
  await expect(advice).toHaveText(`${copy.noPdf} ${copy.tryTight}`);
  await expect(page.locator("[data-cv-spill]")).toBeVisible();
  await expect(page.locator("[data-cv-pdf]")).toHaveCount(0);
  await expect(page.locator("[data-cv-yaml-pane] [data-marked]").first()).toContainText("- role:");

  await page.locator("fieldset", { hasText: copy.controls.density }).getByText("tight").click();
  const rescued = { ...start, density: "tight", stations } as const;
  await measured(page, rescued);
  await expect(status).toHaveAttribute("data-cv-status", "exit-0");
  await expect(advice).toHaveText(copy.rescued);
  await expect(page.locator("[data-cv-spill]")).toHaveCount(0);
  await expect(page.locator("[data-cv-yaml-pane] [data-marked]")).toHaveText(/density: tight/);
  expect(page.url()).toContain("dichte=tight");

  // The real PDF for this state serves, byte-exact.
  const pdfHref = await page.locator("[data-cv-pdf]").getAttribute("href");
  const pdf = cvLiveState(rescued).pdf;
  expect(pdf).not.toBeNull();
  expect(pdfHref).toBe(pdf?.href);
  const pdfResponse = await page.request.get(pdfHref ?? "");
  expect(pdfResponse.status()).toBe(200);
  const pdfBytes = await pdfResponse.body();
  expect(pdfBytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  expect(createHash("sha256").update(pdfBytes).digest("hex")).toBe(pdf?.sha256);

  // The cv.yaml download is the file the engine received.
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("[data-cv-yaml]").click(),
  ]);
  expect(download.suggestedFilename()).toBe("cv.yaml");
  const yamlPath = await download.path();
  const yaml = await readFile(yamlPath, "utf8");
  expect(yaml).toBe(composeCvYaml(CV_LIVE_DATA.base.de, rescued));
  expect(createHash("sha256").update(yaml).digest("hex")).toBe(
    cvLiveState(rescued).yamlSha256,
  );

  // The full-size page opens as a dialog and Escape closes it.
  await page.locator("[data-cv-zoom-open]").click();
  const dialog = page.getByRole("dialog", { name: copy.zoomTitle });
  await expect(dialog).toBeVisible();
  expect(
    await dialog.locator("[data-cv-sheet]").evaluate((host) => host.shadowRoot !== null),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  // R is ignored while a radio group has the keyboard, and starts over
  // from anywhere else.
  await page.locator("input[name='cv-density']:checked").focus();
  await page.keyboard.press("r");
  await expect(page.locator("[data-cv-live]")).toHaveAttribute("data-state", cvLiveStateKey(rescued));
  await page.locator("[data-cv-restart]").focus();
  await page.keyboard.press("Shift+R");
  await measured(page, start);
  await expect(more).toBeEnabled();

  const meaningful = meaningfulBrowserErrors(errors);
  expect(meaningful, formatBrowserErrors(meaningful)).toEqual([]);
  expect(foreign).toEqual([]);
});

test("nothing overflows from 320 px up, in both languages", async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectBrowserErrors(page);
  for (const [path, title] of [
    [ROUTE, CV_LIVE_COPY.de.title],
    [`/en${ROUTE}`, CV_LIVE_COPY.en.title],
  ] as const) {
    for (const [width, height] of [
      [320, 640],
      [390, 844],
      [1440, 900],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.goto(`${path}?stationen=${CV_LIVE_MAX_STATIONS}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
      await expect(page.locator("[data-cv-live]")).toHaveAttribute("data-measured-state", /.+/);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} at ${width}x${height}`).toBeLessThanOrEqual(0);
      // From lg the sheet is set large enough to read: at least 60 % of
      // its real size.
      if (width === 1440) {
        const box = await page.locator("[data-cv-zoom-open]").boundingBox();
        expect(box?.width ?? 0).toBeGreaterThan(793.7 * 0.6);
      }
    }
  }
  const meaningful = meaningfulBrowserErrors(errors);
  expect(meaningful, formatBrowserErrors(meaningful)).toEqual([]);
});
