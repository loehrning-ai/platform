import { expect, test } from "@playwright/test";
import { DEMOS_PAGE_COPY } from "../../src/lib/demos-ui-copy";
import { expectGlasBudget } from "./fixtures/glas-budget";

/*
 * The Claude scene under the W01 demo: a replay of one recorded run. It must
 * say what it is (a recording, its date and model), play only on a press,
 * reach the same answer the transcript holds, and stay inside the Glas budget.
 */
const PATH = "/demos/ki-prognosen-einschaetzen";

for (const viewport of [
  { width: 390, height: 664 },
  { width: 1440, height: 900 },
]) {
  test(`the Claude scene replays the recorded run at ${viewport.width} px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    const section = page.locator("[data-claude-scene-section]");
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole("heading", { level: 2 })).toHaveText(DEMOS_PAGE_COPY.de.claudeScene.heading);
    await expect(section.locator(".cds-caption").first()).toContainText("Opus 5.5");
    await expect(section.locator(".cds-chat .cds-answer")).toHaveCount(0);
    await expectGlasBudget(page, `${PATH} scene at ${viewport.width}`);

    // A press before hydration is lost (the button is server-rendered), so press until the replay runs.
    await expect(async () => {
      await section.locator("[data-scene-play]").click();
      await expect(section.locator("[data-scene-pause]")).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await section.locator("[data-scene-finish]").click();
    const answer = section.locator(".cds-chat .cds-answer").first();
    await expect(answer).toBeVisible();
    const transcript = section.locator(".cds-transcript .cds-answer").first();
    // The transcript sits in a closed <details>, so compare the text content, not the rendered text.
    const squash = (text: string | null) => (text ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
    expect(squash(await answer.textContent())).toBe(squash(await transcript.textContent()));
    await expectGlasBudget(page, `${PATH} scene after play at ${viewport.width}`);
  });
}

test("the Claude scene shows the whole run at once under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PATH, { waitUntil: "domcontentloaded" });
  const section = page.locator("[data-claude-scene-section]");
  await section.scrollIntoViewIfNeeded();
  await expect(async () => {
    await section.locator("[data-scene-play]").click();
    await expect(section.locator(".cds-chat .cds-answer").first()).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
});
