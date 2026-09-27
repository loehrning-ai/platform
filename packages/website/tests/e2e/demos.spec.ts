import { expect, test } from "@playwright/test";
import { demoName, demos } from "../../src/lib/demos";
import { getDemosForLocale } from "../../src/lib/demos-localization";
import { DEMOS_PAGE_COPY } from "../../src/lib/demos-ui-copy";

const DEMO_SLUGS = demos.map((demo) => demo.slug);

test.describe("/demos gallery", () => {
  test("anonymous learners can access the public gallery", async ({ page }) => {
    await page.goto("/demos", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/demos$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      DEMOS_PAGE_COPY.de.catalog.heading,
    );
    await expect(page.locator("[data-demo-atlas-hero]")).toBeVisible();
    await expect(page.locator("[data-demo-filter-console]")).toBeVisible();
    const leadTile = page.locator("[data-demo-tile]").first();
    await expect(leadTile).toBeVisible();
    await expect(leadTile).toHaveAttribute("data-demo-size", demos[0].size);
    // The drawing belongs to the card from sm up; a phone row has none.
    const width = page.viewportSize()?.width ?? 0;
    const preview = leadTile.locator("[data-demo-preview]");
    if (width >= 640) await expect(preview).toBeVisible();
    else await expect(preview).toBeHidden();
  });

  test("query-state URL remains public", async ({ page }) => {
    await page.goto("/demos?cat=RAG&level=einstieg");
    await expect(page).toHaveURL(/\/demos\?cat=RAG&level=einstieg/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      DEMOS_PAGE_COPY.de.catalog.heading,
    );
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("keeps compact filters and the ledger rows usable at 390px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/demos", { waitUntil: "domcontentloaded" });

    // Below sm one "Filter" button stands in for the three stacked selects,
    // so the first example sits inside the first screen (above the 57px tab
    // bar at the bottom of an 844px viewport).
    const toggle = page.locator("[data-demo-filter-toggle]");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(
      page.getByRole("combobox", { name: "Reifegrad" }),
    ).toBeHidden();
    const firstTitle = page.locator("[data-demo-tile] h3").first();
    await expect(firstTitle).toBeVisible();
    const titleBox = await firstTitle.boundingBox();
    expect(titleBox?.y ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(700);

    // Opening it shows the selects at 16px (no iOS focus zoom) with the same
    // URL state contract as the desktop chips. A tap before hydration does
    // nothing, so retry until the button reports itself open.
    await expect(async () => {
      if ((await toggle.getAttribute("aria-expanded")) !== "true") {
        await toggle.click();
      }
      await expect(toggle).toHaveAttribute("aria-expanded", "true", {
        timeout: 1_000,
      });
    }).toPass();
    const level = page.getByRole("combobox", { name: "Reifegrad" });
    await expect(level).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Kategorie" }),
    ).toBeVisible();
    expect(
      await level.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize),
      ),
    ).toBeGreaterThanOrEqual(16);
    await level.selectOption("einstieg");
    await expect(page).toHaveURL(/\/demos\?level=einstieg$/);
    await expect(toggle).toContainText("1");
    await expect(page.locator("[data-demo-tile]")).toHaveCount(3);

    // Below sm the gallery is a ledger: tiles stay, drawings are hidden.
    await expect(page.locator("[data-demo-tile]").first()).toBeVisible();
    await expect(page.locator("[data-demo-preview]").first()).toBeHidden();

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 1);
  });
});

test.describe("/demos/[slug] detail routes", () => {
  for (const slug of DEMO_SLUGS) {
    test(`${slug} renders publicly`, async ({ page }) => {
      const res = await page.goto(`/demos/${slug}`, {
        waitUntil: "domcontentloaded",
      });
      expect(res?.status()).toBe(200);
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator("[data-demo-detail-layout]")).toBeVisible();
      await expect(page.locator("[data-demo-detail-hero]")).toBeVisible();
      await expect(page.locator("[data-demo-shell]")).toBeVisible();
    });
  }

  for (const engineCase of [
    {
      slug: "outbound-workflow",
      action: /Was fehlt vor einem echten Versand/,
      result: "Verbergen",
    },
    {
      slug: "cost-drift-observability",
      action: /Rechnungs-Extraktion/,
      result: "412,08 €",
    },
  ] as const) {
    test(`${engineCase.slug} stays contained and keyboard-operable at 390px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/demos/${engineCase.slug}`, {
        waitUntil: "domcontentloaded",
      });

      const engine = page.locator(`[data-demo-id="${engineCase.slug}"]`);
      const shell = page.locator("[data-demo-shell]");
      await expect(engine).toBeVisible();
      const action = page.getByRole("button", { name: engineCase.action });
      await action.focus();
      await expect
        .poll(() =>
          action.evaluate((element) => element.matches(":focus-visible")),
        )
        .toBe(true);
      await action.press("Enter");
      await expect(
        page.getByText(engineCase.result, { exact: true }),
      ).toBeVisible();

      const containment = await shell.evaluate((root, engineSlug) => {
        const engineElement = root.querySelector(
          `[data-demo-id="${engineSlug}"]`,
        );
        if (!(engineElement instanceof HTMLElement)) {
          throw new Error(`Missing demo engine: ${engineSlug}`);
        }
        const rootRect = root.getBoundingClientRect();
        const visibleEscapes = Array.from(root.querySelectorAll("*")).flatMap(
          (element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            const escapes =
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              rect.width > 0 &&
              rect.height > 0 &&
              (rect.left < rootRect.left - 1 ||
                rect.right > rootRect.right + 1);
            return escapes
              ? [
                  {
                    tag: element.tagName.toLowerCase(),
                    text: element.textContent?.trim().slice(0, 80) ?? "",
                    left: rect.left,
                    right: rect.right,
                    rootLeft: rootRect.left,
                    rootRight: rootRect.right,
                  },
                ]
              : [];
          },
        );
        return {
          engineClientWidth: engineElement.clientWidth,
          engineScrollWidth: engineElement.scrollWidth,
          shellClientWidth: root.clientWidth,
          shellScrollWidth: root.scrollWidth,
          documentClientWidth: document.documentElement.clientWidth,
          documentScrollWidth: document.documentElement.scrollWidth,
          visibleEscapes,
        };
      }, engineCase.slug);

      expect(containment.engineScrollWidth).toBeLessThanOrEqual(
        containment.engineClientWidth + 1,
      );
      expect(containment.shellScrollWidth).toBeLessThanOrEqual(
        containment.shellClientWidth + 1,
      );
      expect(containment.documentScrollWidth).toBeLessThanOrEqual(
        containment.documentClientWidth + 1,
      );
      expect(containment.visibleEscapes).toEqual([]);
    });
  }

  test("puts the first Excel task and a cited RAG answer in the first screen at 390px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.goto("/demos/excel", { waitUntil: "domcontentloaded" });
    const firstTask = page.getByRole("button", { name: /Formel für Wachstum/ });
    await expect(firstTask).toBeVisible();
    const taskBox = await firstTask.boundingBox();
    // The whole first task row clears the 57px tab bar (it starts at 787).
    expect(
      (taskBox?.y ?? Number.POSITIVE_INFINITY) + (taskBox?.height ?? 0),
    ).toBeLessThanOrEqual(740);
    // All five sheet columns fit; the sheet does not scroll sideways.
    const sheet = page.getByRole("region", { name: "Beispiel-Arbeitsblatt" });
    const sheetScroll = await sheet.evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(sheetScroll.scrollWidth).toBeLessThanOrEqual(
      sheetScroll.clientWidth + 1,
    );

    await page.goto("/demos/rag-vertragsassistent", {
      waitUntil: "domcontentloaded",
    });
    // Final state first: an answered example, not an empty prompt.
    await expect(page.getByText("3 Monate zum Quartalsende")).toBeVisible();
    await expect(page.getByText("Frag das Beispielarchiv.")).toHaveCount(0);
    // The first Fundstelle sits under the answer, above the tab bar.
    const citation = page.getByText(
      "Quelle: Rahmenvereinbarung v3.2, §12.3 Kündigung",
    );
    await expect(citation).toBeVisible();
    const citationBox = await citation.boundingBox();
    expect(
      (citationBox?.y ?? Number.POSITIVE_INFINITY) + (citationBox?.height ?? 0),
    ).toBeLessThanOrEqual(787);
    const field = page.getByRole("textbox", {
      name: "Frage an den Vertrags-Assistenten",
    });
    expect(
      await field.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize),
      ),
    ).toBeGreaterThanOrEqual(16);
  });

  test("keeps the RAG chat log from scrolling sideways and starts engines early at 320px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/demos/rag-vertragsassistent", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByText("3 Monate zum Quartalsende")).toBeVisible();
    const log = page.locator("[data-rag-chat-log]");
    const logScroll = await log.evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(logScroll.scrollWidth).toBeLessThanOrEqual(logScroll.clientWidth);

    // Back link and kicker share one row and the lead is one sentence, so
    // the engine starts inside the first screen.
    for (const path of ["/demos/rag-vertragsassistent", "/demos/excel"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const shell = page.locator("[data-demo-shell]");
      await expect(shell).toBeVisible();
      const box = await shell.boundingBox();
      expect(box?.y ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(230);
    }
  });

  test("legacy demo briefing PDF endpoint remains protected or gone", async ({
    request,
  }) => {
    const res = await request.get("/api/demos/excel/briefing.pdf");
    expect([401, 410, 503]).toContain(res.status());
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
  });

  for (const localeCase of [
    {
      path: "/demos/does-not-exist",
      locale: "de",
      title: "Seite nicht gefunden.",
      recovery: "Zur Startseite",
      recoveryHref: "/",
    },
    {
      path: "/en/demos/does-not-exist",
      locale: "en",
      title: "Page not found.",
      recovery: "Back to home",
      recoveryHref: "/en",
    },
  ] as const) {
    test(`${localeCase.path} returns the localized 404 and recovery action`, async ({
      page,
    }) => {
      const res = await page.goto(localeCase.path, {
        waitUntil: "domcontentloaded",
      });

      expect(res?.status()).toBe(404);
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("html")).toHaveAttribute(
        "lang",
        localeCase.locale,
      );
      await expect(page.getByText("404", { exact: true })).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: localeCase.title }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: localeCase.recovery }),
      ).toHaveAttribute("href", localeCase.recoveryHref);
    });
  }
});

test("English demo hub links every registry item and renders a localized detail", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const englishDemos = getDemosForLocale("en");
  const representative = englishDemos[0];
  if (!representative) throw new Error("The demo registry is empty.");
  const hubResponse = await page.goto("/en/demos", {
    waitUntil: "domcontentloaded",
  });

  expect(hubResponse?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    DEMOS_PAGE_COPY.en.catalog.heading,
  );
  await expect(page.locator("[data-demo-tile]")).toHaveCount(
    englishDemos.length,
  );
  await expect
    .poll(() =>
      page
        .locator("[data-demo-tile]")
        .evaluateAll((tiles) => tiles.map((tile) => tile.getAttribute("href"))),
    )
    .toEqual(
      englishDemos.map((demo) => `/en/demos/${demo.slug}?source=gallery`),
    );

  const response = await page.goto(`/en/demos/${representative.slug}`, {
    waitUntil: "domcontentloaded",
  });
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  // The detail H1 is the plain demo name; the task phrase is not repeated.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    demoName(representative),
  );
  await expect(
    page.getByRole("link", {
      name: DEMOS_PAGE_COPY.en.detail.allExamples,
    }),
  ).toHaveAttribute("href", "/en/demos");
});

test.describe("legacy /leistungen/bauen/[slug] product routes", () => {
  for (const slug of [
    "datenpilot",
    "prozessautomat",
    "ki-assistent",
    "compliance-guard",
  ] as const) {
    test(`${slug} redirects to platform stewardship`, async ({ request }) => {
      const res = await request.get(`/leistungen/bauen/${slug}`, {
        maxRedirects: 0,
      });
      expect([301, 308]).toContain(res.status());
      expect(res.headers()["location"]).toContain("/ueber-mich");
    });
  }
});
