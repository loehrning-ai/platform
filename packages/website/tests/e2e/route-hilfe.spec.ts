import { test, expect, type Page } from "@playwright/test";

/**
 * /hilfe smoke + interaction (regression coverage, wave 2). Public, login-free
 * Help/FAQ page: a topic index, static native <details> disclosures, and the
 * retained /neuigkeiten handoff. Assertions target ROLES, the
 * native disclosure toggle, and stable link targets - not exact prose - so a
 * copy refresh stays green while a real regression (missing FAQ list, dead
 * accordion, broken funnel, mobile overflow) fails.
 */

const ROUTE = "/hilfe";

// Every captured console error and uncaught page error fails the check.
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

function meaningfulErrors(errors: string[]): string[] {
  return errors;
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
      // Copy lock updated: German UI copy converged on "Teilnahmebestätigung" for completion documents.
      "Was bedeutet die Teilnahmebestätigung?",
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

  test("topic index resolves the retired limitations route destination", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    const index = page.locator("[data-help-topic-index]");
    await expect(index).toBeVisible();
    await expect(index.getByRole("link")).toHaveCount(12);

    const limitsLink = index.getByRole("link", {
      name: "Welche Einschränkungen sind bekannt?",
    });
    await expect(limitsLink).toHaveAttribute("href", "/hilfe#grenzen");
    await limitsLink.click();
    await expect(page).toHaveURL(/\/hilfe#grenzen$/);
    await expect(page.locator("details#grenzen")).toBeVisible();
    await expect(page.locator("details#grenzen")).toHaveAttribute("open", "");
    await expect(page.locator("details#grenzen")).toHaveAttribute(
      "data-limit-anchor",
      "true",
    );
    const limitations = page.locator("[data-limitations-ledger]");
    await expect(limitations.locator("ol > li")).toHaveCount(5);
    await expect(limitations.getByText("8. August 2026")).toBeVisible();
    await expect(
      limitations.getByRole("link", { name: "EUR-Lex" }),
    ).toHaveAttribute(
      "href",
      "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026R1744",
    );
  });

  test("provider-free feedback exposes the email fallback and /neuigkeiten", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    // Provider-free mode must not advertise the disabled server-backed form.
    // The compact page keeps that channel in the relevant FAQ answer instead
    // of repeating it in a second support card.
    const feedbackDisclosure = page.locator("details#rueckmeldung");
    await feedbackDisclosure.locator("summary").click();
    await expect(feedbackDisclosure).toHaveAttribute("open", "");
    await expect(
      feedbackDisclosure.getByRole("link", { name: "tim@loehrning.ai" }),
    ).toHaveAttribute("href", "mailto:tim@loehrning.ai");
    await expect(
      feedbackDisclosure.getByRole("link", { name: "tim@loehrning.ai" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Feedback-Formular" }),
    ).toHaveCount(0);
    await expect(
      page
        .getByRole("complementary")
        .getByRole("link", { name: "/neuigkeiten", exact: true }),
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
