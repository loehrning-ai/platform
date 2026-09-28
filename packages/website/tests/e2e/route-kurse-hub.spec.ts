import { test, expect } from "@playwright/test";
import {
  collectBrowserErrors,
  formatBrowserErrors,
  meaningfulBrowserErrors,
} from "./fixtures/console";

/**
 * /kurse hub smoke + interaction (regression coverage). The unified course hub:
 * four ordered foundation rows with cross-course progress indicators,
 * a learning-goal decision, and one recommended next course. Assertions target roles
 * and stable test IDs so a wording refresh stays green while a real regression
 * (missing rows, dead proof CTA, broken progress bars, mobile overflow) fails.
 *
 * Complementary to courses.spec.ts, which already covers the imported
 * open-source lane, link visibility, and axe - this file adds the console-error
 * smoke, a real navigation click into a track, and the goal interaction.
 */

const ROUTE = "/kurse";
const CLAUDE_START = "/kurse/open-source/claude/kurs/mental-model";

// Native course tracks (h3 card headings) - source of truth: lib/courses/catalog.ts.
const NATIVE_TRACKS = [
  "KI-Führerschein",
  "KI und Gesellschaft",
  "EU AI Act Kurs",
  "AI-Native Arbeitskurs",
] as const;

test.describe("/kurse hub", () => {
  test("loads without login, shows the hero h1, and logs no console error", async ({
    page,
  }) => {
    const errors = collectBrowserErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText("Kostenlose KI-Kurse für den Arbeitsalltag.");

    const noise = meaningfulBrowserErrors(errors);
    expect(
      noise,
      `console errors on ${ROUTE}\n${formatBrowserErrors(noise)}`,
    ).toEqual([]);
  });

  test("renders all four native course-track cards and their progress indicators", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    // The selected-path instrument intentionally repeats its next course in
    // the complete ledger. Scope card assertions to the ledger so the test
    // keeps strict locator semantics while preserving that useful repetition.
    const allCourses = page.getByRole("region", { name: "Alle Kurse" });

    for (const title of NATIVE_TRACKS) {
      await expect(
        allCourses.getByRole("heading", { name: title, exact: true }),
      ).toBeVisible();
    }

    await expect(
      allCourses.getByRole("heading", {
        level: 3,
        name: "Grundlagenpfad",
        exact: true,
      }),
    ).toBeVisible();

    // The teaser carries no progress meter: progress affordances live on the
    // account catalog. What each row states instead is the course duration.
    await expect(allCourses.getByRole("progressbar")).toHaveCount(0);
  });

  test("primary CTA discloses an open course and reaches its public lesson", async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
    await page
      .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
      .waitFor({ state: "attached" });

    // Provider-free cold start offers one disclosed open task. Direct gated
    // route protection is covered separately in route-ki-fuehrerschein.spec.ts.
    const proof = page.getByTestId("next-proof");
    await expect(
      proof.getByRole("heading", { name: "Claude-Kurs", exact: true }),
    ).toBeVisible();
    await expect(
      proof.getByText("Offener Einstieg ohne Lernkonto", { exact: true }),
    ).toBeVisible();
    await expect(proof.getByRole("link")).toHaveCount(1);
    await expect(
      proof.locator("[data-open-course-alternative]"),
    ).toHaveCount(0);
    const startCta = proof.getByRole("link", {
      name: /^Kurs starten\s*:\s*Claude-Kurs$/,
    });
    await expect(startCta).toBeVisible();
    await expect(startCta).toHaveAttribute("href", CLAUDE_START);

    await startCta.click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === CLAUDE_START && url.search === "" && url.hash === "",
    );
    await expect(page.locator('[data-lesson-mission="claude"]')).toBeVisible();
  });

  test("learning goals retain their course and disclose its available actions", async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    // The goal buttons are server-rendered but inert until React attaches
    // their handlers, and a click that lands first is swallowed with no error,
    // leaving the URL without its goal param. Wait for the hydration marker
    // before clicking rather than racing it.
    await page
      .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
      .waitFor({ state: "attached" });

    const goals = page.getByRole("group", { name: "Lernziel auswählen" });
    await expect(goals).toBeVisible();
    await expect(goals.getByRole("button")).toHaveCount(4);

    const decisions = [
      {
        label: "Ich nutze KI im Job",
        goal: "start",
        course: "KI-Führerschein",
        href: "/ki-fuehrerschein",
        alternative: { course: "Claude-Kurs", href: CLAUDE_START },
      },
      {
        label: "Ich bewerte KI-Risiken",
        goal: "judge",
        course: "KI und Gesellschaft",
        href: "/ki-und-gesellschaft",
        alternative: {
          course: "Data Science Fundamentals",
          href: "/kurse/open-source/data-science",
        },
      },
      {
        label: "Ich baue mit KI",
        goal: "build",
        course: "AI-Native Arbeitskurs",
        href: "/ai-native",
        alternative: { course: "Claude-Kurs", href: CLAUDE_START },
      },
      {
        label: "Ich arbeite mit Daten",
        goal: "data",
        course: "Data Engineering Fundamentals",
        href: "/kurse/open-source/data-engineering-fundamentals/home",
        alternative: null,
      },
    ] as const;

    const proof = page.getByTestId("next-proof");
    for (const { label, goal, course, href, alternative } of decisions) {
      const button = goals.getByRole("button", { name: label });
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await expect(goals.locator('[aria-pressed="true"]')).toHaveCount(1);
      await expect(page).toHaveURL(new RegExp(`[?&]goal=${goal}(?:&|$)`));
      await expect(
        proof.getByRole("heading", { name: course, exact: true }),
      ).toBeVisible();

      // One primary action remains strict even when a separate open alternative
      // is valid. Never turn a selected unavailable course into another course.
      const primary = proof.locator("a:not([data-open-course-alternative])");
      const actionLabel = alternative
        ? "Hier nicht verfügbar · Kursübersicht"
        : "Kurs starten";
      await expect(primary).toHaveCount(1);
      await expect(primary).toBeVisible();
      await expect(primary).toHaveAttribute("href", href);
      await expect(primary.locator("span").first()).toHaveText(actionLabel);
      await expect(primary).toHaveAccessibleName(
        new RegExp(`^${actionLabel}\\s*:\\s*${course}$`),
      );

      const openAlternative = proof.locator("[data-open-course-alternative]");
      await expect(proof.getByRole("link")).toHaveCount(alternative ? 2 : 1);
      await expect(openAlternative).toHaveCount(alternative ? 1 : 0);
      if (alternative) {
        await expect(openAlternative).toBeVisible();
        await expect(openAlternative).toHaveAccessibleName(
          `Offene Alternative ohne Lernkonto: ${alternative.course}`,
        );
        await expect(openAlternative).toHaveAttribute("href", alternative.href);
      }
    }
  });
});

test.describe("/kurse mobile", () => {
  test("has no horizontal overflow at 390px and keeps content visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const allCourses = page.getByRole("region", { name: "Alle Kurse" });
    await expect(
      allCourses.getByRole("heading", {
        name: "KI-Führerschein",
        exact: true,
      }),
    ).toBeVisible();

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
      innerWidth: window.innerWidth,
    }));
    expect(
      scrollWidth,
      `horizontal overflow at 390px: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`,
    ).toBeLessThanOrEqual(innerWidth + 1);
  });
});

// Phone density. The shell's fixed chrome is the 48px top bar and the 56px
// tab bar (plus the device inset, zero here), so the free screen ends at
// viewport height - 56. Bounds carry about 15% headroom over the measured
// values (2026-09-26) so a copy edit or a cold load in the fallback face
// stays green while a desktop sheet that stacks back onto the phone fails.
// Measured 2026-09-26 after the polish pass. Brand face: rail top 284 at
// every phone, 6.5 / 4.0 / 3.5 screens, and at 320 the start action sits
// whole above the tab bar (467-511). Cold, in this runner's wide fallback
// face: rail top 362 / 284 / 307, 6.9 / 4.2 / 3.7 screens, rows up to 197.
const PHONES = [
  { width: 320, height: 568, goalsTop: 410, maxScreens: 8, maxRow: 225 },
  { width: 390, height: 844, goalsTop: 350, maxScreens: 4.8, maxRow: 225 },
  { width: 430, height: 932, goalsTop: 350, maxScreens: 4.3, maxRow: 225 },
] as const;

for (const phone of PHONES) {
  test(`/kurse stays a dense companion list at ${phone.width}x${phone.height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: phone.width, height: phone.height });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
    await page
      .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
      .waitFor({ state: "attached" });

    const metrics = await page.evaluate(() => {
      const box = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return { top: rect.top + scrollY, bottom: rect.bottom + scrollY };
      };
      const rail = document.querySelector("[data-learning-goal-rail]");
      return {
        documentHeight: document.scrollingElement?.scrollHeight ?? 0,
        scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
        goals: box("[data-learning-goal-rail]"),
        railScrolls: rail ? rail.scrollWidth > rail.clientWidth : false,
        nextAction: box('[data-testid="next-proof"] a'),
        rowSources: Array.from(
          document.querySelectorAll("[data-course-source]"),
          (element) => getComputedStyle(element).display,
        ),
        groupSource: (() => {
          const link = document.querySelector("[data-group-source]");
          if (!link) return null;
          const rect = link.getBoundingClientRect();
          return { height: rect.height, display: getComputedStyle(link).display };
        })(),
        levelChipsRight: (() => {
          const group = document.querySelector("[data-course-level-filter] [role=group]");
          return group ? group.getBoundingClientRect().right : 0;
        })(),
        rows: Array.from(
          document.querySelectorAll("[data-course-slug]"),
          (row) => row.getBoundingClientRect().height,
        ),
      };
    });

    expect(metrics.scrollWidth).toBeLessThanOrEqual(phone.width + 1);
    // The first decision is on the first screen: the goal rail is one row.
    expect(metrics.goals?.top).toBeLessThanOrEqual(phone.goalsTop);
    expect(
      (metrics.goals?.bottom ?? 0) - (metrics.goals?.top ?? 0),
    ).toBeLessThanOrEqual(48);
    // On every phone but the smallest, the recommended course's action is
    // fully inside the first screen, above the tab bar.
    if (phone.height >= 800) {
      expect(metrics.nextAction?.bottom).toBeLessThanOrEqual(phone.height - 56);
    } else {
      // On the smallest phone it starts inside the first screen (above the
      // tab bar in the brand face; the fallback face pushes it about 80px
      // lower).
      expect(metrics.nextAction?.top).toBeLessThan(phone.height);
    }
    // The MIT attribution prints once, in the technical group head, and the
    // rows leave it to lg.
    expect(metrics.rowSources).toHaveLength(6);
    expect(new Set(metrics.rowSources)).toEqual(new Set(["none"]));
    expect(metrics.groupSource?.display).not.toBe("none");
    expect(metrics.groupSource?.height).toBeGreaterThanOrEqual(44);
    // The level chips run to the screen edge like the goal rail.
    expect(Math.round(metrics.levelChipsRight)).toBe(phone.width);
    expect(metrics.rows).toHaveLength(10);
    for (const height of metrics.rows) {
      expect(height).toBeLessThanOrEqual(phone.maxRow);
    }
    expect(metrics.documentHeight / phone.height).toBeLessThanOrEqual(
      phone.maxScreens,
    );
  });
}

test("/kurse scrolls a shared goal's chip into the phone rail", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${ROUTE}?goal=data`, { waitUntil: "domcontentloaded" });
  await page
    .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
    .waitFor({ state: "attached" });

  const chip = page.locator('[data-learning-goal="data"]');
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  const inView = await chip.evaluate((element) => {
    const rail = element.closest("[data-learning-goal-rail]") as HTMLElement;
    const chipBox = element.getBoundingClientRect();
    const railBox = rail.getBoundingClientRect();
    return chipBox.left >= railBox.left && chipBox.right <= railBox.right + 1;
  });
  expect(inView).toBe(true);
  // The page itself did not scroll to reveal it.
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

// The one-row rail above (≤ 48px) must not be bought with a clipped ring or a
// short chip. The rail scrolls, so it clips whatever is drawn outside its box:
// every chip reached by Tab keeps a 44px target and a ring drawn whole inside
// the rail. At 320 the second German chip starts inside the screen and ends
// past it, so focus has to scroll the rail against its snap points.
for (const phone of PHONES) {
  test(`/kurse keeps each focused goal chip tappable and its ring inside the phone rail at ${phone.width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: phone.width, height: phone.height });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
    await page
      .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
      .waitFor({ state: "attached" });

    const chips = page.locator("[data-learning-goal]");
    await expect(chips).toHaveCount(4);
    await chips.first().focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");

    for (let index = 0; index < 4; index += 1) {
      if (index > 0) await page.keyboard.press("Tab");
      const chip = chips.nth(index);
      await expect(chip).toBeFocused();
      // The chip scrolls into the rail on focus (instantly for keyboard
      // focus), so poll for the frame the scroll and its snap take to settle.
      await expect
        .poll(() =>
          chip.evaluate((element) => {
            const rail = element.closest("[data-learning-goal-rail]") as HTMLElement;
            const style = getComputedStyle(element);
            const reach =
              parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth);
            const box = element.getBoundingClientRect();
            const clip = rail.getBoundingClientRect();
            return {
              focusVisible: element.matches(":focus-visible"),
              ring: style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 2,
              height: box.height >= 44,
              inside:
                box.top - reach >= clip.top - 0.5 &&
                box.bottom + reach <= clip.bottom + 0.5 &&
                box.left - reach >= clip.left - 0.5 &&
                box.right + reach <= clip.right + 0.5,
            };
          }),
        )
        .toEqual({ focusVisible: true, ring: true, height: true, inside: true });
    }
  });
}

test("/kurse prints the source attribution on every technical row from lg", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
  const sources = page.locator("[data-course-source]");
  await expect(sources).toHaveCount(6);
  for (const source of await sources.all()) {
    await expect(source).toBeVisible();
  }
  await expect(page.locator("[data-group-source]")).toBeHidden();
});

for (const route of ["/kurse", "/en/kurse"] as const) {
  test(`${route} renders the complete ten-course atlas`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);

    const atlas = page.getByTestId("learning-atlas");
    await expect(atlas).toBeVisible();
    await expect(atlas.locator("[data-course-slug]")).toHaveCount(10);
    // Workshops are linked once as the practical companion.
    await expect(
      page.locator("[data-kurse-workshops]").getByRole("link"),
    ).toHaveAttribute(
      "href",
      route.startsWith("/en/") ? "/en/workshops" : "/workshops",
    );
    // Pictures only on the Grundlagenpfad rows: each course's people
    // picture, cropped to its subject in the 4:5 thumb. The Technikkurse keep
    // their posters; their site screenshots never render in the ledger.
    const pictures = atlas.locator('#lernpfad [data-course-thumb="picture"] img');
    await expect(pictures).toHaveCount(4);
    for (const picture of await pictures.all()) {
      await expect(picture).toHaveAttribute("alt", "");
      await expect(picture).toHaveAttribute("src", /cover-v4\.webp/);
    }
    await expect(atlas.locator("#tiefer-gehen img")).toHaveCount(0);
    await expect(
      page.getByRole("group", {
        name: route.startsWith("/en/")
          ? "Choose a learning goal"
          : "Lernziel auswählen",
      }),
    ).toBeVisible();
  });
}
