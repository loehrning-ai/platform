import { expect, test } from "@playwright/test";
import { demos } from "../../src/lib/demos";
import { getDemosForLocale } from "../../src/lib/demos-localization";
import { DEMOS_PAGE_COPY } from "../../src/lib/demos-ui-copy";

const DEMO_SLUGS = demos.map((demo) => demo.slug);

test.describe("/demos gallery", () => {
  test("anonymous learners can access the public gallery", async ({ page }) => {
    await page.goto("/demos", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/demos$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Arbeitsabläufe prüfen. Annahmen sichtbar machen.",
    );
    await expect(page.locator("[data-demo-atlas-hero]")).toBeVisible();
    await expect(page.locator("[data-demo-filter-console]")).toBeVisible();
    const leadTile = page.locator("[data-demo-tile]").first();
    await expect(leadTile).toBeVisible();
    await expect(leadTile).toHaveAttribute("data-demo-size", demos[0].size);
    await expect(leadTile.locator("[data-demo-preview]")).toBeVisible();
  });

  test("query-state URL remains public", async ({ page }) => {
    await page.goto("/demos?cat=RAG&level=einstieg");
    await expect(page).toHaveURL(/\/demos\?cat=RAG&level=einstieg/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Arbeitsabläufe prüfen. Annahmen sichtbar machen.",
    );
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("keeps compact filters and the preview atlas usable at 390px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/demos", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("combobox", { name: "Reifegrad" }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Kategorie" }),
    ).toBeVisible();
    await expect(page.locator("[data-demo-preview]").first()).toBeVisible();

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
      result: "€412.08",
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
    `${DEMOS_PAGE_COPY.en.catalog.headingLead} ${DEMOS_PAGE_COPY.en.catalog.headingAccent}`,
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
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    `${representative.title} ${representative.titleKicker}`,
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
