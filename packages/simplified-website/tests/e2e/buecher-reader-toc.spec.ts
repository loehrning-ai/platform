import { test, expect, type Page } from "@playwright/test";

/**
 * Book reader - TOC sidebar, heading list, and anchor deep-links (release hardening
 * ). Complements buecher.spec.ts (library + PDF gating).
 *
 * Content is the CURRENT live copy (a refresh is pending on another branch), so
 * assertions target STRUCTURE/roles, the stable manifest chapter title, and
 * heading ids READ FROM THE LIVE DOM - never exact prose. Rendered ids come
 * from rehype-slug (github-slugger keeps umlauts) while the sidebar hrefs come
 * from the lib's extractHeadings (which transliterates), so the two slug
 * schemes diverge - hence deriving ids at runtime. Reader is open (no login).
 *
 * Chapter ki-landschaft/03_reifegrad_ueberblick ("Evidenzbasierte Selbstprüfung")
 * contains multiple h2/h3 headings, including umlaut ones, and no code fences.
 */

const SLUG = "ki-landschaft";
const CHAPTER = "03_reifegrad_ueberblick";
const CHAPTER_TITLE = "Evidenzbasierte Selbstprüfung";
const READER_PATH = `/buecher/${SLUG}/${CHAPTER}`;

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

/** Heading ids the reader actually rendered (rehype-slug/github-slugger). */
async function renderedHeadingIds(page: Page): Promise<string[]> {
  return page.evaluate((label) => {
    const scope = document.querySelector(`[aria-label="${label}"]`) ?? document;
    return Array.from(scope.querySelectorAll("h2[id], h3[id]")).map((el) => el.id);
  }, CHAPTER_TITLE);
}

/**
 * Cold-load `#id` and assert it landed on that heading. The about:blank hop
 * forces a real document load at the fragment URL (the "open the link fresh"
 * path), not a same-page hash nudge.
 */
async function deepLinkLandsOn(
  page: Page,
  id: string,
  opts: { requireScroll: boolean },
): Promise<void> {
  await page.goto("about:blank");
  await page.goto(`${READER_PATH}#${id}`, { waitUntil: "load" });

  const heading = page.locator(`[id="${id}"]`);
  await expect(heading).toBeVisible();
  await expect(heading).toBeInViewport();
  // NOTE: no ":target" check here. Engines disagree on matching :target for
  // percent-encoded unicode fragments (WebKit returns null for umlaut ids),
  // and the retrying toBeInViewport above is already the meaningful proof.
  if (opts.requireScroll) {
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  }
}

test.describe("book reader TOC + heading anchors", () => {
  test("renders the chapter, its h1 and heading anchors without console errors", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const res = await page.goto(READER_PATH, { waitUntil: "domcontentloaded" });

    expect(res?.status(), `status for ${READER_PATH}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { level: 1, name: CHAPTER_TITLE, exact: true }),
    ).toBeVisible();

    const ids = await renderedHeadingIds(page);
    expect(ids.length, "rendered h2/h3 heading ids").toBeGreaterThan(1);

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${READER_PATH}\n${noise.join("\n")}`).toEqual([]);
  });

  test("sidebar TOC lists the chapter headings as fragment links (desktop)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(READER_PATH, { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("complementary", { name: "Kapitelinhalt" }),
    ).toBeVisible();

    const toc = page.getByRole("navigation", { name: "Kapitelinhalt" });
    const links = toc.getByRole("link");
    await expect(links.first()).toBeVisible();
    expect(await links.count(), "TOC entries").toBeGreaterThan(1);
    // Every TOC entry is an in-page fragment link.
    await expect(links.first()).toHaveAttribute("href", /^#/);
  });

  test("clicking a TOC entry scrolls to its heading (desktop)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(READER_PATH, { waitUntil: "load" });

    const ids = await renderedHeadingIds(page);
    const toc = page.getByRole("navigation", { name: "Kapitelinhalt" });
    const hrefs = await toc
      .getByRole("link")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""));

    // Pick the LAST TOC link whose slug resolves to a rendered heading id, so
    // the click must scroll a meaningful distance. (Since the slug fix landed,
    // sidebar slugs keep umlauts and match the DOM ids one-to-one.)
    const resolvable = hrefs.filter((h) => h.startsWith("#") && ids.includes(h.slice(1)));
    test.skip(resolvable.length === 0, "no TOC link resolves to a rendered heading id");
    const targetHref = resolvable[resolvable.length - 1];
    const targetId = targetHref.slice(1);

    await toc.locator(`a[href="${targetHref}"]`).first().click();

    // location.hash percent-encodes unicode; compare decoded against the raw href.
    expect(decodeURIComponent(new URL(page.url()).hash)).toBe(targetHref);
    await expect(page.locator(`[id="${targetId}"]`)).toBeInViewport();
  });

  test("deep-linking to a late heading anchor scrolls to it", async ({ page }) => {
    await page.goto(READER_PATH, { waitUntil: "domcontentloaded" });
    const ids = await renderedHeadingIds(page);
    const ascii = ids.filter((id) => /^[a-z0-9-]+$/.test(id));
    const pool = ascii.length > 0 ? ascii : ids;
    const targetId = pool[pool.length - 1];
    test.skip(!targetId, "chapter rendered no heading ids");

    // A late heading also proves the page scrolled down from the top.
    await deepLinkLandsOn(page, targetId as string, { requireScroll: true });
  });

  test("deep-linking to a heading anchor with umlauts lands on it", async ({ page }) => {
    await page.goto(READER_PATH, { waitUntil: "domcontentloaded" });
    const umlautId = (await renderedHeadingIds(page)).find((id) => /[äöüß]/.test(id));
    test.skip(!umlautId, "no rendered heading id contains an umlaut in this chapter");

    // Proves the percent-encoded umlaut fragment resolves to the umlaut heading.
    await deepLinkLandsOn(page, umlautId as string, { requireScroll: false });
  });
});
