import { expect, test, type Page } from "@playwright/test";
import { settleWholePage } from "./fixtures/settle";

const WIDTHS = [320, 390, 768, 1440] as const;

interface HorizontalEscape {
  readonly kind: "element" | "text";
  readonly selector: string;
  readonly left: number;
  readonly right: number;
  readonly text: string;
}


async function horizontalEscapes(
  page: Page,
): Promise<readonly HorizontalEscape[]> {
  return page.evaluate(() => {
    const escapes: HorizontalEscape[] = [];
    const viewportWidth = window.innerWidth;
    const ignored = (element: Element): boolean =>
      element.matches(".sr-only") ||
      element.closest(".sr-only") !== null ||
      element.closest("[data-course-horizontal-scroll]") !== null;

    for (const element of document.body.querySelectorAll("*")) {
      if (
        !(element instanceof HTMLElement || element instanceof SVGElement) ||
        ignored(element) ||
        element.getAttribute("aria-hidden") === "true"
      ) {
        continue;
      }
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
      escapes.push({
        kind: "element",
        selector: element.tagName.toLowerCase(),
        left: Number(rect.left.toFixed(1)),
        right: Number(rect.right.toFixed(1)),
        text: (element.textContent ?? "")
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 80),
      });
    }

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = (node.textContent ?? "").trim();
      const parent = node.parentElement;
      if (!text || !parent || ignored(parent)) continue;
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
        if (
          rect.width <= 0 ||
          (rect.left >= -0.5 && rect.right <= viewportWidth + 0.5)
        ) {
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

function certificateHash(): string {
  return Buffer.from(
    JSON.stringify({
      n: "W".repeat(120),
      s: 100,
      m: "quiz",
      d: "2026-08-08T10:00:00.000Z",
      c: "ki-fuehrerschein",
      v: 1,
    }),
    "utf8",
  ).toString("base64url");
}

test.describe("KI-Führerschein DE/EN integration", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "The explicit viewport matrix runs once in Chromium.",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("public landing and verification remain localized and contained at every target width", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      for (const locale of ["de", "en"] as const) {
        const prefix = locale === "en" ? "/en" : "";
        const landing = `${prefix}/ki-fuehrerschein`;
        const landingResponse = await page.goto(landing, {
          waitUntil: "domcontentloaded",
        });
        expect(landingResponse?.status(), `${landing} status`).toBe(200);
        expect(
          landingResponse?.headers()["x-robots-tag"],
          `${landing} must not be suppressed by middleware after reviewed parity`,
        ).toBeUndefined();
        await expect(page).not.toHaveURL(/\/login/);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.getByRole("heading", { level: 1 })).toContainText(
          locale === "en" ? "AI at work" : "KI im Alltag",
        );
        await expect(
          page.getByRole("link", {
            name:
              locale === "en"
                ? /Start with a free learning account/
                : /Kostenlos mit Lernkonto starten/,
          }).first(),
        ).toHaveAttribute(
          "href",
          `${prefix}/ki-fuehrerschein/kurs`,
        );
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          `https://loehrning.ai${landing}`,
        );
        await settleWholePage(page);
        expect(
          await horizontalEscapes(page),
          `${landing} horizontal escapes at ${width}px`,
        ).toEqual([]);
        expect(
          await page
            .locator(
              "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
            )
            .count(),
          `${landing} framework overlay`,
        ).toBe(0);

        const verification = `${prefix}/ki-fuehrerschein/verifizierung#${certificateHash()}`;
        const verificationResponse = await page.goto(verification, {
          waitUntil: "domcontentloaded",
        });
        expect(
          verificationResponse?.status(),
          `${verification} status`,
        ).toBe(200);
        await expect(page.getByText("W".repeat(120))).toBeVisible();
        await expect(
          page.getByText(locale === "en" ? "QR data read" : "QR-Daten gelesen"),
        ).toBeVisible();
        await settleWholePage(page);
        expect(
          await horizontalEscapes(page),
          `${verification} horizontal escapes at ${width}px`,
        ).toEqual([]);
      }
    }

    expect(consoleErrors).toEqual([]);
  });

  test("anonymous English reader routes preserve /en in login redirects", async ({
    request,
  }) => {
    for (const path of [
      "/en/ki-fuehrerschein/kurs",
      "/en/ki-fuehrerschein/kurs/block_1?step=2",
      "/en/ki-fuehrerschein/kurs/quiz",
      "/en/ki-fuehrerschein/kurs/zertifikat",
    ] as const) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), path).toBe(307);
      const location = new URL(
        response.headers().location,
        "http://localhost",
      );
      expect(location.pathname, path).toBe("/en/login");
      expect(location.searchParams.get("next"), path).toBe(path);
    }
  });
});
