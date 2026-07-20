import { test, expect, type Page } from "@playwright/test";

/**
 * /hilfe smoke + interaction (regression coverage, wave 2). Public, login-free
 * Help/FAQ page: static native <details> disclosures plus two support cards
 * funnelling to /feedback and /neuigkeiten. Assertions target ROLES, the
 * native disclosure toggle, and stable link targets - not exact prose - so a
 * copy refresh stays green while a real regression (missing FAQ list, dead
 * accordion, broken funnel, mobile overflow) fails.
 */

const ROUTE = "/hilfe";

// Console-error filter mirrors route-einstieg.spec.ts: drop framework noise and
// keep only errors that signal a genuine page fault.
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

function meaningfulErrors(errors: string[]): string[] {
  return errors.filter(
    (e) =>
      !/hydration|Failed to fetch dynamically imported|prefetch/i.test(e) &&
      !/Minified React error #(418|423|425)/.test(e) &&
      !/404/.test(e) &&
      !/_vercel\//.test(e),
  );
}

test.describe("/hilfe Help & FAQ", () => {
  test("loads without login, shows the h1, and logs no console error", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Hilfe");

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${ROUTE}\n${noise.join("\n")}`).toEqual(
      [],
    );
  });

  test("renders the FAQ questions as visible disclosure summaries", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    // Stable subset of FAQ topics; each is a <summary> label visible even while
    // collapsed, so an emptied/broken FAQ list is caught (not just a container).
    for (const question of [
      "Wo fange ich an?",
      "Warum brauche ich ein Konto?",
      "Was bedeutet das Teilnahme-Zertifikat?",
    ] as const) {
      await expect(
        page.getByText(question, { exact: true }),
        `FAQ question missing: ${question}`,
      ).toBeVisible();
    }
  });

  test("accordion reveals its answer when a question is clicked", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    const question = page.getByText("Wie funktionieren Quiz und Neuversuche?", {
      exact: true,
    });
    await expect(question).toBeVisible();

    // "Zeitdruck" occurs only in this item's answer body (verified vs nav +
    // footer): it resolves to the single <p> hidden by the collapsed <details>.
    const answer = page.getByText(/Zeitdruck/);
    await expect(answer).toBeHidden();

    await question.click();
    await expect(answer).toBeVisible();
  });

  test("support cards expose the email fallback and /neuigkeiten", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    // Provider-free mode must not advertise the disabled server-backed form.
    // The support card exposes its email channel while the updates card keeps
    // its direct in-page route.
    await expect(
      page.getByText("Schreib an tim@loehrning.ai.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Feedback-Formular" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "/neuigkeiten", exact: true }),
    ).toHaveAttribute("href", "/neuigkeiten");
  });
});

test.describe("/hilfe mobile", () => {
  test("has no horizontal overflow at 390px and keeps content visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByText("Wo fange ich an?", { exact: true }),
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
