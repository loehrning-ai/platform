import { test, expect, type Locator } from "@playwright/test";

/**
 * Release gate: the legal pages must carry one complete, non-placeholder
 * structured service address before a public deployment. Automation proves
 * shape and rendering consistency; evidence that the address is real and
 * legally reviewed remains a manual release decision.
 */

const PLACEHOLDER =
  /(?:launch-blocker|todo|tbd|placeholder|example|muster|unknown|unbekannt|test address|<[^>]+>)/i;

async function readStructuredAddress(responsibleParty: Locator) {
  const fields = {
    streetAndNumber:
      (await responsibleParty.getAttribute("data-address-street"))?.trim() ??
      "",
    postalCode:
      (
        await responsibleParty.getAttribute("data-address-postal-code")
      )?.trim() ?? "",
    city:
      (await responsibleParty.getAttribute("data-address-city"))?.trim() ?? "",
    country:
      (await responsibleParty.getAttribute("data-address-country"))?.trim() ??
      "",
  };
  for (const [name, value] of Object.entries(fields)) {
    expect(value, `${name} must be populated`).not.toBe("");
    expect(value, `${name} must not be a placeholder`).not.toMatch(PLACEHOLDER);
  }
  expect(fields.streetAndNumber).toMatch(/\p{L}/u);
  expect(fields.streetAndNumber).toMatch(/\p{N}/u);
  expect(fields.postalCode).toMatch(/^[\p{L}\p{N}][\p{L}\p{N} .-]{1,15}$/u);
  expect(fields.city).toMatch(/\p{L}/u);
  expect(fields.country).toMatch(/\p{L}/u);

  const formatted = await responsibleParty.getAttribute("data-service-address");
  expect(formatted).toBe(
    `${fields.streetAndNumber}, ${fields.postalCode} ${fields.city}, ${fields.country}`,
  );
  return fields;
}

test.describe("@launch-gate ladungsfähige Anschrift", () => {
  test("/impressum responsible-party block carries a complete structured service address", async ({
    page,
  }) => {
    const res = await page.goto("/impressum", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBeLessThan(400);
    const responsibleParty = page.getByTestId("responsible-party");
    await expect(responsibleParty).toBeVisible();
    await readStructuredAddress(responsibleParty);
  });

  test("/impressum does not show the Launch-Blocker placeholder", async ({
    page,
  }) => {
    const res = await page.goto("/impressum", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBeLessThan(400);
    const responsibleParty = page.getByTestId("responsible-party");
    expect(await responsibleParty.innerText()).not.toContain("Launch-Blocker");
  });

  test("both legal pages expose the identical responsible-party address", async ({
    page,
  }) => {
    await page.goto("/impressum", { waitUntil: "domcontentloaded" });
    const impressumAddress = await readStructuredAddress(
      page.getByTestId("responsible-party"),
    );

    const res = await page.goto("/datenschutz", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBeLessThan(400);
    const responsibleParty = page.getByTestId("responsible-party");
    await expect(responsibleParty).toBeVisible();
    const datenschutzAddress = await readStructuredAddress(responsibleParty);
    expect(datenschutzAddress).toEqual(impressumAddress);
    expect(await responsibleParty.innerText()).not.toContain("Launch-Blocker");
  });
});
