import { test, expect } from "@playwright/test";

// The simplified homepage uses the Workflow section to frame the platform as
// learning material, not as a consulting funnel. It has no KI-Check CTA.
test.describe("Home Page - Workflow", () => {
  test("renders the learning workflow without a journey CTA", async ({ page }) => {
    await page.goto("/");
    const section = page.getByTestId("workflow-section");
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
    await expect(section.getByText(/Ein Lernpfad/)).toBeVisible();
    await expect(section.getByRole("heading", { name: "Kurs wählen", exact: true })).toBeVisible();
    await expect(section.getByRole("heading", { name: "Fortschritt speichern", exact: true })).toBeVisible();
    await expect(section.getByRole("heading", { name: "Material anwenden", exact: true })).toBeVisible();
    expect(
      await section.locator('a[href="/ki-transformation-check"]').count(),
    ).toBe(0);
  });

  test.describe("Mobile", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("workflow section stacks and stays visible at 375px", async ({ page }) => {
      await page.goto("/");
      const section = page.getByTestId("workflow-section");
      await section.scrollIntoViewIfNeeded();
      await expect(section).toBeVisible();
      await expect(section.getByText(/Ein Lernpfad/)).toBeVisible();
    });
  });
});
