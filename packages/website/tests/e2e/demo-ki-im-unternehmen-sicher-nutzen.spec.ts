/**
 * Workshop 05 demo "Darf das in diesen Chat?": the core loop on a phone, the
 * deep links, the templates, reflow at 320px, the English page and axe.
 * Every test fails on an uncaught error and on any console.error (React
 * reports hydration mismatches there, not as a page error).
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { cards } from "../../src/lib/demo-cases/ki-im-unternehmen-sicher-nutzen";

const PATH = "/demos/ki-im-unternehmen-sicher-nutzen";

async function overflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

async function axe(page: Page, extraTags: readonly string[] = []) {
  const results = await new AxeBuilder({ page })
    .include("[data-w05-demo]")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", ...extraTags])
    .analyze();
  return results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`);
}

const pageErrors = new WeakMap<Page, string[]>();

test.beforeEach(({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(`pageerror: ${String(error)}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
  });
});

test.afterEach(({ page }) => {
  expect(pageErrors.get(page) ?? []).toEqual([]);
});

test.describe("W05 demo: Darf das in diesen Chat?", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("plays the loop: light, verdict, route, dials, next scene, Friday, templates", async ({ page }) => {
    const response = await page.goto(PATH, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);

    // Everything static is there before any interaction.
    for (const id of ["einfuegungen", "freitag", "mitnehmen", "quellen"]) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
    await expect(page.locator("[data-w05-demo]").locator("details, summary, [aria-expanded]")).toHaveCount(0);
    expect(await axe(page)).toEqual([]);

    // Phone slots are named, never numbered; Friday's close line waits for votes.
    await expect(page.locator('[data-slot="marko"]')).toHaveText("Ma");
    await expect(page.locator("[data-friday-close]")).toHaveAttribute("data-friday-close", "pending");
    await expect(page.locator("[data-friday-close]")).not.toContainText("Vardar Works");

    // No start button; "Zu den Vorlagen" with the keyboard lands focus on that heading.
    await expect(page.locator("[data-start]")).toHaveCount(0);
    await page.locator("[data-to-templates]").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#mitnehmen-heading")).toBeFocused();

    // Ana: give amber, which is too loose.
    const card = page.locator('[data-scene="ana"]');
    await card.locator('[data-lamp="amber"]').click();
    await expect(page.locator("#w05-ana-verdict")).toBeFocused();
    await expect(card.locator("[data-direction]")).toHaveText("Zu locker.");
    await expect(card.locator("[data-route-unknown]")).toContainText("nicht in den Dateien");

    // Turn the account dial with the keyboard: Team makes it amber, with a to-do.
    const account = card.locator('[data-dial="w05-ana-account"]');
    await account.getByRole("radio", { checked: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(account.getByRole("radio", { name: "Firma: Team" })).toHaveAttribute("aria-checked", "true");
    await expect(card.locator("[data-now-light]")).toHaveAttribute("data-now-light", "amber");
    await expect(card.locator("[data-fix-line]")).toContainText("Gefunden.");
    await expect(card.locator("[data-todo]")).toContainText("Eine benannte Person prüft");
    await expect(card.locator('[data-route-row="stored"]')).toContainText("USA");
    await expect(page.locator("[data-live]")).toContainText("Jetzt Gelb.");
    expect(await axe(page)).toEqual([]);

    // Next scene.
    await card.locator("[data-next]").click();
    await expect(page.locator("#w05-stefan-heading")).toBeFocused();
    await expect(page.locator('[data-slot="ana"]')).toHaveAttribute("aria-label", "Ana, Lösung Rot, du Gelb");

    // Friday: vote, see the stamp, the evidence and the true sentence.
    const first = page.locator('[data-sentence="1"]');
    await first.getByRole("button", { name: "Stimmt nicht" }).click();
    await expect(page.locator("#w05-friday-1-result")).toHaveText("Richtig.");
    await expect(first).toContainText("Petar: Claude Desktop");
    await expect(first).toContainText("zuständig: IT-Leitung");
    await page.locator('[data-sentence="2"]').getByRole("button", { name: "Stimmt nicht" }).click();
    await expect(page.locator("[data-friday-close]")).toHaveAttribute("data-friday-close", "pending");
    await page.locator('[data-sentence="3"]').getByRole("button", { name: "Halb" }).click();
    // Let the stamp land before axe reads its contrast.
    await expect(page.locator("#w05-friday-3-result .w05-stamp")).toHaveAttribute("data-t", "1.00");
    await expect(page.locator("[data-friday-close]")).toContainText("Die Sätze unter „Wahr wäre“ sind wahr für Vardar Works.");

    // Templates: two fields fill the three cards.
    await page.getByLabel("Name eures Firmenwerkzeugs").fill("Claude Team");
    await page.getByLabel("Wen fragst du vorher?").fill("IT-Leitung");
    const filled = cards({ tool: "Claude Team", owner: "IT-Leitung" }, "de");
    await expect(page.locator('[data-copy-text="reply"]')).toHaveText(filled.reply);
    await expect(page.locator('[data-copy-text="rules"]')).toHaveText(filled.rules);
    await expect(page.locator('[data-copy-text="mail"]')).toHaveText(filled.mail);
    await expect(page.locator("[data-your-scenes]")).toContainText("Nie ← Ana (du: zu locker)");
    expect(await axe(page)).toEqual([]);

    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });

  test("State B fits in two phone screens for every scene and every pick", async ({ page }) => {
    // Spec: the scene region is at most 1700px tall at 390px, right after the commit.
    test.setTimeout(150_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const tall: string[] = [];
    for (const locale of ["", "/en"]) {
      for (const pick of ["green", "amber", "red"]) {
        await page.goto(`${locale}${PATH}`, { waitUntil: "networkidle" });
        for (const id of ["ana", "stefan", "elena", "marko", "jovana", "mila", "petar", "dario"]) {
          const card = page.locator(`[data-scene="${id}"]`);
          await card.locator(`[data-lamp="${pick}"]`).click();
          await expect(card.locator("[data-verdict]")).toBeVisible();
          const height = await card.evaluate((element) => element.getBoundingClientRect().height);
          if (height > 1700) tall.push(`${locale || "/de"} ${id} ${pick}: ${Math.round(height)}`);
          const next = card.locator("[data-next]");
          if ((await next.count()) > 0) await next.click();
        }
      }
    }
    expect(tall).toEqual([]);
  });

  test("the demo's own head stays short: first lamp at most 460px below the mount", async ({ page }) => {
    // The fold itself also depends on the shared page band above the mount.
    for (const locale of ["", "/en"]) {
      await page.goto(`${locale}${PATH}`, { waitUntil: "networkidle" });
      const gap = await page.evaluate(() => {
        const mount = document.querySelector("[data-demo-mount]")?.getBoundingClientRect().top ?? 0;
        const lamp = document.querySelector('[data-scene] [data-lamp="green"]')?.getBoundingClientRect().top ?? 9999;
        return lamp - mount;
      });
      expect(gap).toBeLessThanOrEqual(460);
    }
  });

  test("phone fold at 390x844: the slot row and Ana's card head clear the tab bar on load", async ({ page }) => {
    for (const locale of ["", "/en"]) {
      await page.goto(`${locale}${PATH}`, { waitUntil: "networkidle" });
      const fold = await page.evaluate(() => {
        const bar = document.querySelector('[data-mobile-tab-bar="true"]');
        const visible = bar && getComputedStyle(bar).display !== "none";
        return {
          limit: visible ? bar.getBoundingClientRect().top : window.innerHeight,
          slots: document.querySelector("[data-slots]")?.getBoundingClientRect().bottom ?? 9999,
          head: document.querySelector("[data-scene] h3")?.getBoundingClientRect().bottom ?? 9999,
        };
      });
      expect(fold.slots, `${locale || "/de"} slots`).toBeLessThanOrEqual(fold.limit);
      expect(fold.head, `${locale || "/de"} card head`).toBeLessThanOrEqual(fold.limit);
    }
  });

  test("desktop: Ana's first lamp shows on the first laptop screen (1440x900)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const locale of ["", "/en"]) {
      await page.goto(`${locale}${PATH}`, { waitUntil: "networkidle" });
      // Each lamp's glyph and word (the decision itself) are on the first screen.
      const bottoms = await page.evaluate(() =>
        [...document.querySelectorAll("[data-scene] [data-lamp] .w05-lamp__word")].map(
          (word) => word.getBoundingClientRect().bottom,
        ),
      );
      expect(bottoms).toHaveLength(3);
      for (const bottom of bottoms) expect(bottom).toBeLessThanOrEqual(900);
      // The kit line sits in the right column, above the table.
      const intro = await page.locator("[data-w05-intro]").boundingBox();
      const aside = await page.locator("[data-ledger-aside]").boundingBox();
      expect(intro && aside && intro.y < aside.y && Math.abs(intro.x - aside.x) < 2).toBe(true);
    }
  });

  test("Marko stays red on Enterprise until the key is out (the presenter moment)", async ({ page }) => {
    await page.goto(`${PATH}#marko`, { waitUntil: "networkidle" });
    const card = page.locator('[data-scene="marko"]');
    await expect(card).toBeVisible();
    await card.locator('[data-lamp="red"]').click();
    for (const name of ["Firma: Team", "Firma: Enterprise"]) {
      await card.getByRole("radio", { name }).click();
      await expect(card.locator("[data-now-light]")).toHaveAttribute("data-now-light", "red");
    }
    await expect(card.locator("[data-fix-line]")).toContainText("Enterprise macht aus Rot kein Grün.");
    await card.getByRole("radio", { name: "Schlüssel durch [API_KEY] ersetzt" }).click();
    await expect(card.locator("[data-now-light]")).toHaveAttribute("data-now-light", "amber");
    const height = await card.evaluate((element) => element.getBoundingClientRect().height);
    expect(height).toBeLessThanOrEqual(1800);
  });

  test("desktop: one landmark per name once Friday shows the table (axe best practice)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${PATH}#dario`, { waitUntil: "networkidle" });
    await page.locator('[data-scene="dario"] [data-lamp="red"]').click();
    await expect(page.locator("[data-friday-ledger]")).toBeVisible();
    await expect(page.locator("[data-ledger-aside]")).toBeVisible();
    expect(await axe(page, ["best-practice"])).toEqual([]);
  });

  test("lands on the templates from the band link", async ({ page }) => {
    await page.goto(`${PATH}#mitnehmen`, { waitUntil: "networkidle" });
    const top = await page.locator("#mitnehmen").evaluate((element) => element.getBoundingClientRect().top);
    expect(Math.abs(top)).toBeLessThan(200);
  });

  test("reflows at 320px without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(PATH, { waitUntil: "networkidle" });
    await page.locator('[data-lamp="red"]').click();
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });

  test("shows the end frames under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(PATH, { waitUntil: "networkidle" });
    await page.locator('[data-lamp="green"]').click();
    await expect(page.locator("[data-packet]")).toHaveAttribute("data-at-rest", "");
    const values = await page.locator("[data-t]").evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-t")),
    );
    expect(values.length).toBeGreaterThan(0);
    expect(new Set(values)).toEqual(new Set(["1.00"]));
  });

  test("the English page is complete, with one vendor mail", async ({ page }) => {
    await page.goto(`/en${PATH}`, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 2, name: "Eight pastes" })).toBeVisible();
    await expect(page.locator('[data-copy-text="mail-en"]')).toHaveCount(0);
    await expect(page.locator('[data-copy-text="mail"]')).toContainText("Subject: Three questions about our data in [COMPANY TOOL]");
    await page.locator('[data-lamp="red"]').click();
    await expect(page.locator("[data-direction]")).toHaveText("Right.");
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    expect(await axe(page)).toEqual([]);
  });
});
