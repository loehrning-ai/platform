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
    await expect(page.locator("[data-demo-tile]").first()).toBeVisible();
  });

  test("query-state URL remains public", async ({ page }) => {
    await page.goto("/demos?cat=RAG&level=einstieg");
    await expect(page).toHaveURL(/\/demos\?cat=RAG&level=einstieg/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Arbeitsabläufe prüfen. Annahmen sichtbar machen.",
    );
    await expect(page).not.toHaveURL(/\/login/);
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
    test(`${slug} redirects to the platform trust page`, async ({
      request,
    }) => {
      const res = await request.get(`/leistungen/bauen/${slug}`, {
        maxRedirects: 0,
      });
      expect([301, 308]).toContain(res.status());
      expect(res.headers()["location"]).toContain("/ueber-die-plattform");
    });
  }
});
