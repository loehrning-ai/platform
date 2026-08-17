import { expect, test, type Page } from "@playwright/test";

const LANDINGS = [
  "/ki-fuehrerschein",
  "/ki-und-gesellschaft",
  "/eu-ai-act-kurs",
  "/ai-native",
] as const;

const WIDTHS = [320, 390, 768, 1024, 1440] as const;

interface HorizontalEscape {
  readonly kind: "element" | "text";
  readonly selector: string;
  readonly left: number;
  readonly right: number;
  readonly text: string;
}

async function settleWholePage(page: Page): Promise<void> {
  await page.locator('[data-app-hydration-marker="true"][data-hydrated="true"]').waitFor({ state: "attached" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const step = Math.max(320, Math.floor(window.innerHeight * 0.75));
    // Bounded on purpose: scrollHeight is re-read each iteration and scrolling
    // is what loads lazy widgets, so on a page that grows while being walked the
    // exit condition keeps receding. It hangs inside page.evaluate, surfacing as
    // a silent timeout. 60 steps is far past any real page.
    for (
      let y = 0, steps = 0;
      y < document.documentElement.scrollHeight && steps < 60;
      y += step, steps += 1
    ) {
      window.scrollTo(0, y);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    window.scrollTo(0, 0);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
}

async function horizontalEscapes(page: Page): Promise<readonly HorizontalEscape[]> {
  return page.evaluate(() => {
    const escapes: HorizontalEscape[] = [];
    const viewportWidth = window.innerWidth;
    const isIgnored = (element: Element): boolean =>
      element.matches(".sr-only") ||
      element.closest(".sr-only") !== null ||
      element.closest("[data-course-horizontal-scroll]") !== null;

    for (const element of document.body.querySelectorAll("*")) {
      if (!(element instanceof HTMLElement || element instanceof SVGElement)) continue;
      if (isIgnored(element) || element.getAttribute("aria-hidden") === "true") continue;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        Number(style.opacity) === 0 ||
        rect.width <= 0 ||
        rect.height <= 0 ||
        (rect.left >= -0.5 && rect.right <= viewportWidth + 0.5)
      ) {
        continue;
      }
      const className =
        typeof element.className === "string"
          ? element.className.trim().replace(/\s+/g, ".")
          : "";
      escapes.push({
        kind: "element",
        selector: `${element.tagName.toLowerCase()}${className ? `.${className}` : ""}`,
        left: Number(rect.left.toFixed(1)),
        right: Number(rect.right.toFixed(1)),
        text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 80),
      });
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = (node.textContent ?? "").trim();
      const parent = node.parentElement;
      if (!text || !parent || isIgnored(parent)) continue;
      const style = getComputedStyle(parent);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        Number(style.opacity) === 0
      ) {
        continue;
      }
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.width <= 0 || (rect.left >= -0.5 && rect.right <= viewportWidth + 0.5)) {
          continue;
        }
        escapes.push({
          kind: "text",
          selector: parent.tagName.toLowerCase(),
          left: Number(rect.left.toFixed(1)),
          right: Number(rect.right.toFixed(1)),
          text: text.replace(/\s+/g, " ").slice(0, 80),
        });
        break;
      }
    }

    return escapes;
  });
}

function certificateHash(courseSlug: (typeof LANDINGS)[number]): string {
  const payload = {
    n: "W".repeat(120),
    s: 100,
    m: "quiz",
    d: "2026-08-08T10:00:00.000Z",
    c: courseSlug.slice(1),
    v: 1,
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

test.describe("German foundation course responsive geometry", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Explicit viewport matrix runs once in Chromium.");
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("all public landings contain elements and rendered text at 320-1440px", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of LANDINGS) {
        const response = await page.goto(route, { waitUntil: "domcontentloaded" });
        expect(response?.status(), `${route} HTTP status`).toBe(200);
        await expect(page).not.toHaveURL(/\/login/);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await settleWholePage(page);

        const escapes = await horizontalEscapes(page);
        expect(
          escapes,
          `${route} has horizontal escapes at ${width}px`,
        ).toEqual([]);
      }
    }
  });

  test("verification cards wrap the maximum accepted learner name at 320px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    for (const route of LANDINGS) {
      const hash = certificateHash(route);
      const response = await page.goto(`${route}/verifizierung#${hash}`, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status(), `${route} verification HTTP status`).toBe(200);
      await expect(page.getByText("W".repeat(120))).toBeVisible();
      await settleWholePage(page);
      expect(
        await horizontalEscapes(page),
        `${route} verification clips the maximum learner name`,
      ).toEqual([]);
    }
  });

  test("protected reader, quiz, and certificate states remain login-gated", async ({
    request,
  }) => {
    for (const route of LANDINGS) {
      for (const suffix of ["/kurs", "/kurs/quiz", "/kurs/zertifikat"] as const) {
        const response = await request.get(`${route}${suffix}`, { maxRedirects: 0 });
        expect(response.status(), `${route}${suffix} should redirect`).toBe(307);
        expect(response.headers().location).toContain("/login?next=");
      }
    }
  });
});
