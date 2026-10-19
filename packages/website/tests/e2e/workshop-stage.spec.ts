import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * The workshop stage (docs/workshop-standard.md, "The stage"): under the
 * poster band, two action cards (slides or lab, kit or case) and the
 * workshop's own motion scene, with one CSS-only pause control. The visible
 * "Nach dem Workshop" and "Der Fall" sections are gone from the page.
 */

const WORKSHOPS = [
  { slug: "ki-prognosen-einschaetzen", a: ["Labor öffnen", "Open the lab"], b: ["Fall ansehen", "See the case"], download: false, kitPage: false },
  { slug: "geschaeftsberichte-mit-ki-lesen", a: ["Folien ansehen", "View the slides"], b: ["Kit herunterladen", "Download the kit"], download: true, kitPage: false },
  { slug: "datenbereitschaft-fuer-ki", a: ["Folien ansehen", "View the slides"], b: ["Kit herunterladen", "Download the kit"], download: true, kitPage: false },
  { slug: "esg-berichte-mit-ki", a: ["Folien ansehen", "View the slides"], b: ["Kit herunterladen", "Download the kit"], download: true, kitPage: true },
  { slug: "ki-im-unternehmen-sicher-nutzen", a: ["Folien ansehen", "View the slides"], b: ["Kit herunterladen", "Download the kit"], download: true, kitPage: true },
] as const;

const LOCALES = [
  { prefix: "", index: 0, outcomes: "Nach dem Workshop", caseName: "Der Fall", more: "Mehr Details", explainer: /^Was ist das (Kit|Labor)\?$/ },
  { prefix: "/en", index: 1, outcomes: "After this you can", caseName: "The case", more: "More details", explainer: /^What is the (kit|lab)\?$/ },
] as const;

async function open(page: Page, route: string): Promise<void> {
  await page.goto(route, { waitUntil: "load" });
  await expect(page.locator("[data-workshop-stage]")).toBeVisible();
  // The stage composes itself on load (cards at 0 s and 0.12 s, scene at 0.3 s,
  // each 8px and opacity). Geometry is measured on the settled frame.
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .filter((animation) => animation instanceof CSSAnimation && ["ac-enter", "ws-enter"].includes(animation.animationName))
      .every((animation) => animation.playState === "finished"),
  );
}

async function animationName(locator: Locator): Promise<string> {
  return locator.evaluate((element) => getComputedStyle(element).animationName);
}

test.describe("workshop stage anatomy", () => {
  for (const locale of LOCALES) {
    for (const workshop of WORKSHOPS) {
      test(`${locale.prefix || "/de"}/${workshop.slug}: band, stage with two cards, the kit explainer, nothing collapsible`, async ({ page }) => {
        await open(page, `${locale.prefix}/workshops/${workshop.slug}`);

        const band = page.locator("[data-cover-band]");
        const stage = page.locator("[data-workshop-stage]");
        // The band is the poster: no buttons, no motion scene, the numeral drawn.
        await expect(band.locator("a:not([data-cover-back])")).toHaveCount(0);
        await expect(band.locator("svg[data-hero-motion]")).toHaveCount(0);
        await expect(band.locator("svg[data-poster]").first()).toBeAttached();

        // Nothing overlaps the band: the stage starts where the band ends.
        const bandBox = (await band.boundingBox())!;
        const stageBox = (await stage.boundingBox())!;
        expect(stageBox.y).toBeGreaterThanOrEqual(bandBox.y + bandBox.height - 1);

        // Two cards, each one real link; B downloads where it is a file.
        const cards = stage.locator("[data-action-card]");
        await expect(cards).toHaveCount(2);
        const linkA = cards.nth(0).locator("a.ac-link");
        const linkB = cards.nth(1).locator("a.ac-link");
        await expect(linkA).toHaveAccessibleName(new RegExp(`^${workshop.a[locale.index]}`));
        await expect(linkB).toHaveAccessibleName(new RegExp(`^${workshop.b[locale.index]}`));
        await expect(linkA).not.toHaveAttribute("download", /.*/);
        if (workshop.download) await expect(linkB).toHaveAttribute("download", "");
        else await expect(linkB).not.toHaveAttribute("download", /.*/);
        const secondary = cards.nth(1).locator("a.ac-secondary");
        await expect(secondary).toHaveCount(workshop.kitPage ? 1 : 0);
        if (workshop.kitPage) await expect(secondary).toHaveAttribute("href", `${locale.prefix}/workshops/${workshop.slug}/kit`);

        // Cards and scene never overlap each other.
        const boxes = await stage.locator("[data-action-card], [data-workshop-scene]").evaluateAll((elements) =>
          elements.map((element) => {
            const { x, y, width, height } = element.getBoundingClientRect();
            return { x, y, right: x + width, bottom: y + height };
          }),
        );
        for (let first = 0; first < boxes.length; first += 1) {
          for (let second = first + 1; second < boxes.length; second += 1) {
            const a = boxes[first];
            const b = boxes[second];
            const apart = a.right <= b.x + 1 || b.right <= a.x + 1 || a.bottom <= b.y + 1 || b.bottom <= a.y + 1;
            expect(apart, `box ${first} and ${second} overlap`).toBe(true);
          }
        }

        // The removed sections stay removed; nothing on the page collapses.
        await expect(page.getByRole("heading", { name: locale.outcomes })).toHaveCount(0);
        await expect(page.getByRole("heading", { level: 2, name: locale.caseName })).toHaveCount(0);
        await expect(page.locator("[data-workshop-brief], [data-workshop-need]")).toHaveCount(0);
        await expect(page.getByText(locale.more, { exact: true })).toHaveCount(0);
        await expect(page.locator("main details, main summary, main [aria-expanded]")).toHaveCount(0);
        await expect(page.locator("#fall")).toHaveCount(0);
        // The explainer sits right under the stage: a question heading, a body, a row of facts.
        const explainer = page.locator("[data-stage-explainer]");
        await expect(explainer).toBeVisible();
        await expect(explainer.getByRole("heading", { level: 2, name: locale.explainer })).toBeVisible();
        await expect(explainer.locator("p")).not.toBeEmpty();
        await expect(explainer.locator("[data-workshop-facts] li")).not.toHaveCount(0);
        const explainerBox = (await explainer.boundingBox())!;
        expect(explainerBox.y).toBeGreaterThanOrEqual(stageBox.y + stageBox.height - 1);
      });
    }
  }
});

test.describe("workshop stage on a phone", () => {
  test.use({ viewport: { width: 390, height: 664 } });

  for (const workshop of WORKSHOPS) {
    test(`${workshop.slug}: the title, the summary and the top of card A share the first screen`, async ({ page }) => {
      await open(page, `/workshops/${workshop.slug}`);
      const h1 = (await page.locator("h1").boundingBox())!;
      const summary = (await page.locator("[data-cover-band] h1 ~ p").first().boundingBox())!;
      const card = (await page.locator("[data-workshop-stage] [data-action-card]").first().boundingBox())!;
      expect(h1.y + h1.height).toBeLessThan(664);
      expect(summary.y + summary.height).toBeLessThan(664);
      // At least 56px of card A are inside the 664px screen.
      expect(card.y + 56).toBeLessThanOrEqual(664);
      // One column: card A, card B, then the scene (when wired), all the page width.
      const cards = await page.locator("[data-workshop-stage] [data-action-card]").evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect()),
      );
      expect(cards[1].y).toBeGreaterThan(cards[0].y + cards[0].height - 1);
      for (const rect of cards) {
        expect(rect.x).toBeGreaterThanOrEqual(15);
        expect(rect.right).toBeLessThanOrEqual(375);
        // A compact horizontal phone card: an 80 to 92px picture beside the text.
        expect(rect.height).toBeGreaterThanOrEqual(96);
        expect(rect.height).toBeLessThanOrEqual(140);
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

// The fixed phone tab bar is 56px high: both action cards end above it, and the
// first screen carries the start of the scene.
test.describe("workshop stage first screen", () => {
  const PHONES = [
    { width: 360, height: 780 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ] as const;

  for (const phone of PHONES) {
    for (const workshop of WORKSHOPS) {
      for (const locale of LOCALES) {
        test(`${phone.width}x${phone.height} ${locale.prefix || "/de"}/${workshop.slug}: both cards end above the tab bar`, async ({ browser }) => {
          const context = await browser.newContext({ viewport: phone, isMobile: true, hasTouch: true });
          const page = await context.newPage();
          await open(page, `${locale.prefix}/workshops/${workshop.slug}`);
          const cards = await page
            .locator("[data-workshop-stage] [data-action-card]")
            .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().bottom));
          expect(Math.max(...cards)).toBeLessThanOrEqual(phone.height - 56);
          // The scene starts right under the cards (not far below the fold).
          const scene = (await page.locator("[data-workshop-scene]").boundingBox())!;
          expect(scene.y).toBeLessThan(phone.height + 40);
          await context.close();
        });
      }
    }
  }

  for (const workshop of WORKSHOPS) {
    test(`1440x900 ${workshop.slug}: the cards and the whole scene are on the first screen`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await open(page, `/workshops/${workshop.slug}`);
      const boxes = await page
        .locator("[data-workshop-stage] [data-action-card], [data-workshop-scene]")
        .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().bottom));
      expect(Math.max(...boxes)).toBeLessThanOrEqual(900);
      await context.close();
    });
  }

  test("the pause control sits in the scene's top-right corner, inside the frame, and is a switch with one stable name", async ({ browser }) => {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      await open(page, "/workshops/esg-berichte-mit-ki");
      const scene = (await page.locator("[data-workshop-scene]").boundingBox())!;
      const pause = (await page.locator("label.ws-pause").boundingBox())!;
      // Top right, inset from the frame's 2px border, and a 44px target.
      expect(pause.y, `pause top at ${viewport.width}`).toBeGreaterThanOrEqual(scene.y);
      expect(pause.y + pause.height, `pause bottom at ${viewport.width}`).toBeLessThanOrEqual(scene.y + scene.height / 2);
      expect(pause.x + pause.width, `pause right at ${viewport.width}`).toBeLessThanOrEqual(scene.x + scene.width);
      expect(pause.x, `pause left at ${viewport.width}`).toBeGreaterThan(scene.x + scene.width / 2);
      expect(pause.width).toBeGreaterThanOrEqual(44);
      expect(pause.height).toBeGreaterThanOrEqual(44);
      await expect(page.getByRole("switch", { name: "Bewegung pausieren" })).toBeAttached();
      await context.close();
    }
  });

  test("at 360 the wordmark ends before the language pill", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await open(page, "/workshops/ki-prognosen-einschaetzen");
    const mark = (await page.locator("[data-logo-wordmark-remainder]:visible").first().boundingBox())!;
    const pill = (await page.locator("[data-language-switch]:visible").first().boundingBox())!;
    expect(mark.x + mark.width + 4).toBeLessThanOrEqual(pill.x);
    await context.close();
  });
});

test.describe("workshop stage motion and pause", () => {
  test("the pause control stops card and scene animation, and starts it again", async ({ page }) => {
    await open(page, "/workshops/ki-im-unternehmen-sicher-nutzen");
    const stage = page.locator("[data-workshop-stage]");
    const pause = stage.locator("label.ws-pause");
    await expect(pause).toBeVisible();
    const box = (await pause.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    await expect(pause).toContainText("Bewegung anhalten");

    // Playing: the kit chips, the top slide and the gate's cards move.
    const chip = stage.locator(".ac-chip").first();
    const frame = stage.locator(".ac-frame-top");
    const card = stage.locator(".hm-p1");
    await expect(stage).toHaveAttribute("data-stage-scene", "gate");
    expect(await animationName(chip)).not.toBe("none");
    expect(await animationName(frame)).not.toBe("none");
    expect(await animationName(card)).not.toBe("none");

    await pause.click();
    await expect(stage.locator("input.ws-pause-input")).toBeChecked();
    await expect(pause).toContainText("Bewegung starten");
    expect(await animationName(chip)).toBe("none");
    expect(await animationName(frame)).toBe("none");
    expect(await animationName(card)).toBe("none");
    // Still frame: the lamps stay lit, the kit chips stay in the box.
    await expect(stage.locator(".hm-lamp-go")).toHaveCSS("opacity", "1");
    await expect(chip).toHaveCSS("opacity", "1");

    await pause.click();
    await expect(pause).toContainText("Bewegung anhalten");
    expect(await animationName(card)).not.toBe("none");
  });

  test("the pause control is reachable by keyboard with a visible ring and toggles with Space", async ({ page }) => {
    await open(page, "/workshops/ki-im-unternehmen-sicher-nutzen");
    const input = page.locator("input.ws-pause-input");
    await input.focus();
    await expect(input).toBeFocused();
    const outline = await page.locator("label.ws-pause").evaluate((element) => getComputedStyle(element).outlineWidth);
    expect(outline).toBe("3px");
    await page.keyboard.press("Space");
    await expect(input).toBeChecked();
    await page.keyboard.press("Space");
    await expect(input).not.toBeChecked();
  });

  test("a keyboard focus on a card draws one 3px Druckschwarz ring around card and anti-colour block", async ({ page }) => {
    await open(page, "/workshops/esg-berichte-mit-ki");
    const link = page.locator("[data-action-card] a.ac-link").first();
    await link.focus();
    const ring = await page.locator(".ac-list > li").first().evaluate((element) => {
      const style = getComputedStyle(element);
      return { width: style.outlineWidth, offset: style.outlineOffset, style: style.outlineStyle, colour: style.outlineColor };
    });
    expect(ring).toEqual({ width: "3px", offset: "6px", style: "solid", colour: "rgb(18, 18, 18)" });
    // The block behind the card shows in the card's anti colour (Rost card A: Druckschwarz is card A, Mennige is card B).
    const anti = await page.locator(".ac-list > li").nth(1).evaluate((element) => getComputedStyle(element, "::before").backgroundColor);
    expect(anti).toBe("rgb(183, 58, 21)");
  });

  test("under reduced motion nothing animates and the pause control is hidden", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await open(page, "/workshops/ki-im-unternehmen-sicher-nutzen");
    await expect(page.locator("label.ws-pause")).toBeHidden();
    for (const selector of [".ac-chip", ".ac-frame-top", ".hm-p1", ".hm-orbit", ".hm-layer-far"]) {
      expect(await animationName(page.locator(selector).first()), selector).toBe("none");
    }
    await context.close();
  });

  test("the scene fills the frame of the stage at every width and never overflows the page", async ({ page }) => {
    for (const width of [390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await open(page, "/workshops/ki-im-unternehmen-sicher-nutzen");
      const scene = page.locator("[data-workshop-scene]");
      const box = (await scene.boundingBox())!;
      const svg = (await scene.locator("svg").boundingBox())!;
      expect(box.width, `scene width at ${width}`).toBeGreaterThan(300);
      // The 6:5 art is scaled to fill the 4:3 box (workshop-stage.css, --ws-fit):
      // it covers the frame with no empty strip, and the crop stays under 15%
      // (the box clips the overflow, so it never reaches the page width).
      expect(svg.width, `art covers the frame at ${width}`).toBeGreaterThanOrEqual(box.width - 4 - 1);
      expect(svg.height, `art covers the frame at ${width}`).toBeGreaterThanOrEqual(box.height - 4 - 1);
      expect(svg.width, `art crop at ${width}`).toBeLessThanOrEqual(box.width * 1.15);
      expect(svg.height, `art crop at ${width}`).toBeLessThanOrEqual(box.height * 1.15);
      // Never squashed below 4:3: 297px at 1024, 410px at 1440.
      if (width >= 1024) expect(box.height).toBeGreaterThanOrEqual(box.width * 0.74);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `horizontal overflow at ${width}`).toBeLessThanOrEqual(0);
    }
  });
});
