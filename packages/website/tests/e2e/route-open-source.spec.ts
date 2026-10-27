import { test, expect, type Page } from "@playwright/test";
import {
  collectBrowserErrors,
  formatBrowserErrors,
  meaningfulBrowserErrors,
} from "./fixtures/console";
import {
  OPEN_SOURCE_PROJECT_ARTIFACTS,
  OPEN_SOURCE_TOOL_ARTIFACTS,
  plateNumber,
} from "../../src/lib/open-source/artifacts";
import {
  CV_ENGINE_SPECIMEN_COPY,
  OPEN_SOURCE_DETAIL_COPY,
  OPEN_SOURCE_PAGE_COPY,
  SOFTWARE_GUIDE_COPY,
  SPECIMEN_COPY,
} from "../../src/lib/open-source/display-copy";

/**
 * /open-source, driven by the registry: the hub wall at three widths and
 * every published tool's detail page. Adding a tool adds coverage here
 * without editing this file.
 */

const SOFTWARE = [...OPEN_SOURCE_TOOL_ARTIFACTS, ...OPEN_SOURCE_PROJECT_ARTIFACTS];
const NEWEST_FIRST = SOFTWARE.map((artifact) => plateNumber(artifact.id)).sort(
  (a, b) => b.localeCompare(a),
);

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `horizontal overflow at ${label}`).toBeLessThanOrEqual(0);
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

test("hub: numbered plates, newest first, rest frames, a working ruler", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors = collectBrowserErrors(page);
  const foreign = collectForeignRequests(page);

  for (const [width, height] of [
    [360, 740],
    [390, 844],
    [1440, 900],
  ] as const) {
    await page.setViewportSize({ width, height });
    const response = await page.goto("/open-source");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      OPEN_SOURCE_PAGE_COPY.de.title,
    );
    const wall = page.getByRole("list", { name: OPEN_SOURCE_PAGE_COPY.de.wall });
    await expect(wall).toHaveAttribute("data-entry-count", String(SOFTWARE.length));
    const ids = await wall
      .locator(":scope > li")
      .evaluateAll((items) => items.map((item) => item.id));
    expect(ids).toEqual(NEWEST_FIRST.map((number) => `nr-${number}`));
    await expectNoHorizontalOverflow(page, `${width}x${height}`);
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/open-source");
  for (const video of await page.locator("[id^='nr-'] video").all()) {
    expect(await video.getAttribute("poster")).toMatch(/\.jpg$/);
    expect(await video.evaluate((node: HTMLVideoElement) => node.paused)).toBe(true);
  }
  if (SOFTWARE.some((artifact) => artifact.guide.specimen?.kind === "drawn")) {
    for (const text of [CV_ENGINE_SPECIMEN_COPY.de.onePageBadge, "exit 0"]) {
      const node = page.getByText(text).first();
      await expect(node).toBeAttached();
      expect(
        await node.evaluate((element) => getComputedStyle(element).opacity),
      ).toBe("1");
    }
  }

  const ruler = page.getByRole("slider").first();
  await ruler.focus();
  const atRest = await ruler.getAttribute("aria-valuetext");
  await page.keyboard.press("Home");
  await expect(ruler).not.toHaveAttribute("aria-valuetext", atRest ?? "");
  const atStart = await ruler.getAttribute("aria-valuetext");
  await page.keyboard.press("ArrowRight");
  await expect(ruler).not.toHaveAttribute("aria-valuetext", atStart ?? "");
  // End reaches the rest frame even when the beat does not divide the
  // take, and the visitor is offered the take again.
  await page.keyboard.press("End");
  await expect(ruler).toHaveValue((await ruler.getAttribute("max")) ?? "");
  await expect(ruler).toHaveAttribute("aria-valuetext", atRest ?? "");
  await expect(
    page.locator("[id^='nr-']").first().getByRole("button", {
      name: new RegExp(`^${SPECIMEN_COPY.de.again}`),
    }),
  ).toBeVisible();

  await page.goto("/en/open-source");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    OPEN_SOURCE_PAGE_COPY.en.title,
  );

  const meaningful = meaningfulBrowserErrors(errors);
  expect(meaningful, formatBrowserErrors(meaningful)).toEqual([]);
  expect(foreign).toEqual([]);
});

test("detail: the one command copies, nothing overflows, every stored file serves", async ({
  page,
  context,
  browserName,
}) => {
  test.setTimeout(120_000);
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }

  for (const artifact of SOFTWARE) {
    for (const [width, height] of [
      [390, 844],
      [1440, 900],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.goto(artifact.href);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(artifact.title);
      const quickstart = artifact.guide.quickstart;
      if (quickstart) {
        await expect(page.locator("code[data-quickstart]")).toHaveText(quickstart.command);
        if (browserName === "chromium" && width === 1440) {
          const copy = page
            .getByRole("region", { name: OPEN_SOURCE_DETAIL_COPY.de.oneCommand })
            .getByRole("button");
          await copy.click();
          await expect(copy).toHaveText(SOFTWARE_GUIDE_COPY.de.copied);
          expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
            quickstart.command,
          );
        }
      }
      // Every still decodes (lazy images load once scrolled to).
      for (const still of await page.locator("#real-output ~ ul img").all()) {
        await still.scrollIntoViewIfNeeded();
        await expect
          .poll(() => still.evaluate((img: HTMLImageElement) => img.naturalWidth), {
            message: `${artifact.slug} still decodes at ${width}`,
            timeout: 15_000,
          })
          .toBeGreaterThan(0);
      }
      await expectNoHorizontalOverflow(page, `${artifact.slug} ${width}x${height}`);
    }

    const { guide } = artifact;
    const films = [
      ...(guide.specimen?.kind === "film" ? [guide.specimen.film] : []),
      ...(guide.outputFilms ?? []),
    ];
    const files = [
      artifact.license.href,
      guide.screenshot.src,
      ...(guide.demo ?? []).map((frame) => frame.src),
      ...films.flatMap((film) => [film.src, film.poster.src]),
    ];
    for (const file of files) {
      const response = await page.request.get(file);
      expect(response.status(), file).toBe(200);
    }
    for (const film of films) {
      const response = await page.request.get(film.src, {
        headers: { Range: "bytes=0-1" },
      });
      expect(response.status(), `range request for ${film.src}`).toBe(206);
    }
  }
});
