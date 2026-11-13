import { expect, type Page, test } from "@playwright/test";

/**
 * Workshop 05 deck, both editions, on the shared deck engine: every ArrowRight press walks the main
 * slides step by step and never enters the appendix, ArrowLeft walks back, r and Shift+R return to
 * #cover/0, unbound keys do nothing, modified r stays the browser's, P
 * opens the presenter, Escape leaves an appendix page for the slide it came from, a reload keeps the
 * position the hash names, the phone note links only to a page on this site, and a phone never
 * scrolls sideways. The 16 main slides and appendix a1 to a4 of the condensed deck are pinned by id,
 * no poll, vote button or ghost bar anywhere (Tim, 13 Nov 2026: the slides explain, they do not quiz), the recorded-take chip on the four step slides, and the
 * visual law is scanned on every press of every slide in both editions: V1 no ink fill, V7 text
 * contrast 4.5:1, V8 at most one accent element per press state, V9 (round 5) Claude's orange only
 * inside the drawn Claude UI (.cl-ui), V14 no bar or meter in the colour of its ground (every press,
 * every selected sectors tile).
 */

const SLUG = "audit-vorbereitung-mit-ki";
const EDITIONS = [
  { lang: "de", deck: `/workshops/${SLUG}/slides.html`, presenter: `/workshops/${SLUG}/presenter.html`, demo: `/demos/${SLUG}` },
  { lang: "en", deck: `/workshops/${SLUG}/en/slides.html`, presenter: `/workshops/${SLUG}/en/presenter.html`, demo: `/en/demos/${SLUG}` },
] as const;

test.use({ contextOptions: { reducedMotion: "reduce" } });

const MAIN_IDS = ["cover", "today", "why", "sectors", "we", "letter", "time", "kit", "step1", "step2", "tests", "step3", "register", "watch", "safety", "close"] as const;
const APPENDIX_IDS = ["a1", "a2", "a3", "a4"] as const;
/** The slides that show a recorded Claude take (steps 1 to 4) and so carry the take chip. */
const TAKE_SLIDES = ["step1", "step2", "register"] as const;
/** Visual law V1 exemptions, the same list as `workshop05-visual.test.mjs`: icon masks, the globe canvas, the unused tile back. */
const V1_EXEMPT = [".ico", "[data-glyph]", "canvas", ".tile > .face--back"] as const;

const hash = (page: Page) => page.evaluate(() => decodeURIComponent(location.hash));
const expectAt = (page: Page, where: string, why: string) => expect.poll(() => hash(page), why).toBe(where);
/** The position the stage shows. WebKit refuses history writes after about 100 quick presses, so a
 * long walk reads the slide and step from the DOM; the stage rewrites the hash once it is allowed. */
const shown = (page: Page) =>
  page.evaluate(() => {
    const slide = document.querySelector<HTMLElement>("deck-stage > section[data-deck-active]");
    return slide ? `#${slide.id}/${slide.dataset.stepCurrent}` : "";
  });
const expectShown = (page: Page, where: string, why: string) => expect.poll(() => shown(page), why).toBe(where);

/** Opens a deck URL; each edition keeps its own deck id, so the two never share storage or channels. */
async function open(page: Page, url: string) {
  await page.goto(url);
  const target = new URL(url, "http://deck").hash.slice(1).split("/")[0] || "cover";
  await expect(page.locator(`#${target}`)).toHaveAttribute("data-deck-active", "");
  const deckId = url.includes("/en/") ? `${SLUG}:en` : SLUG;
  await expect(page.locator("html")).toHaveAttribute("data-deck-id", deckId);
}

/** Every main position in order: #slide/0 .. #slide/last for each main slide. */
const mainPositions = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('deck-stage > section.slide[data-kind="main"]')).flatMap((slide) =>
      Array.from({ length: Number(slide.dataset.stepTotal) + 1 }, (_, step) => `#${slide.id}/${step}`),
    ),
  );

/**
 * Runs in the page: scans the elements of the active slide in their current press state.
 * V1: no opaque (alpha 0.3 or more) background darker than relative luminance 0.15 on a box of at
 * least 10 x 4 px. V7: every element with its own text has contrast 4.5:1 against the nearest
 * opaque background. V8: at most one element drawn in the accent colour. V9 (round 5, D4): Claude's
 * orange (--claude-clay) is drawn only inside the Claude UI (an element in .cl-ui), never on the slide.
 */
function scanVisualLaw({ exempt }: { exempt: string[] }): string[] {
  type Rgba = { r: number; g: number; b: number; a: number };
  const parse = (value: string): Rgba | null => {
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1]!.split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: parts[0]!, g: parts[1]!, b: parts[2]!, a: parts[3] ?? 1 };
  };
  const lin = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (c: Rgba) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const over = (top: Rgba, below: Rgba): Rgba => {
    const a = top.a + below.a * (1 - top.a);
    const mix = (t: number, b: number) => (a === 0 ? 0 : (t * top.a + b * below.a * (1 - top.a)) / a);
    return { r: mix(top.r, below.r), g: mix(top.g, below.g), b: mix(top.b, below.b), a };
  };
  const describe = (el: Element) => {
    const id = el.id ? `#${el.id}` : "";
    const classes = typeof (el as HTMLElement).className === "string" ? (el as HTMLElement).className.trim().split(/\s+/).filter(Boolean).slice(0, 3).map((name) => `.${name}`).join("") : "";
    return `${el.tagName.toLowerCase()}${id}${classes}`;
  };
  const slide = document.querySelector<HTMLElement>("deck-stage > section[data-deck-active]");
  if (!slide) return ["no active slide"];
  const probe = document.createElement("span");
  probe.style.color = "var(--accent)";
  slide.append(probe);
  const accent = parse(getComputedStyle(probe).color);
  probe.style.color = "var(--claude-clay)";
  const clay = parse(getComputedStyle(probe).color);
  probe.remove();
  const clays: string[] = [];
  const claySeen = (el: Element, ...values: string[]) => {
    if (clay && !el.closest(".cl-ui") && values.some((value) => same(parse(value), clay))) clays.push(describe(el));
  };

  const opacityOf = (el: Element) => {
    let opacity = 1;
    for (let node: Element | null = el; node && node !== slide.parentElement; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
    return opacity;
  };
  const visible = (el: Element) => {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && opacityOf(el) > 0.05;
  };
  const exempted = (el: Element) => exempt.some((selector) => el.closest(selector));
  const backdrop = (el: Element): Rgba => {
    const stack: Rgba[] = [];
    for (let node: Element | null = el; node; node = node.parentElement) {
      const bg = parse(getComputedStyle(node).backgroundColor);
      if (bg && bg.a > 0) {
        stack.push(bg);
        if (bg.a >= 0.99) break;
      }
    }
    return stack.reduceRight((below, top) => over(top, below), { r: 255, g: 255, b: 255, a: 1 });
  };
  const same = (a: Rgba | null, b: Rgba | null) => !!a && !!b && Math.abs(a.r - b.r) < 1 && Math.abs(a.g - b.g) < 1 && Math.abs(a.b - b.b) < 1;

  const hits: string[] = [];
  const accents: string[] = [];
  const all = [slide, ...slide.querySelectorAll("*")];
  for (const el of all) {
    if (el instanceof SVGElement && !(el instanceof SVGSVGElement) && el.closest("svg") && el.tagName.toLowerCase() !== "text") {
      // SVG shapes: fill and stroke count for V1 (fill) and V8.
      if (!visible(el)) continue;
      const style = getComputedStyle(el);
      const fill = parse(style.fill);
      const rect = el.getBoundingClientRect();
      if (fill && fill.a >= 0.3 && luminance(fill) < 0.15 && rect.width >= 10 && rect.height >= 4 && !exempted(el)) hits.push(`V1 ink fill ${describe(el)} ${style.fill}`);
      if (same(fill, accent) || (style.strokeWidth !== "0px" && same(parse(style.stroke), accent))) accents.push(describe(el));
      claySeen(el, style.fill, style.strokeWidth !== "0px" ? style.stroke : "");
      continue;
    }
    if (!visible(el) || exempted(el)) continue;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const bg = parse(style.backgroundColor);
    if (bg && bg.a >= 0.3 && luminance(bg) < 0.15 && rect.width >= 10 && rect.height >= 4) hits.push(`V1 ink fill ${describe(el)} ${style.backgroundColor}`);
    const ownText = Array.from(el.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim().length > 0);
    let drawsAccent = false;
    if (ownText) {
      const color = parse(style.color);
      if (color) {
        const ground = backdrop(el);
        const text = over(color, ground);
        const [hi, lo] = [luminance(text), luminance(ground)].sort((a, b) => b - a) as [number, number];
        const ratio = (hi + 0.05) / (lo + 0.05);
        if (ratio < 4.5) hits.push(`V7 contrast ${ratio.toFixed(2)} ${describe(el)} ${style.color} on ${style.backgroundColor}`);
      }
      const parentColor = el.parentElement ? parse(getComputedStyle(el.parentElement).color) : null;
      if (same(parse(style.color), accent) && !same(parentColor, accent)) drawsAccent = true;
    }
    if (same(bg, accent) && bg!.a > 0.5) drawsAccent = true;
    for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
      const width = parseFloat(style[`border${side}Width`]);
      if (width > 0 && style[`border${side}Style`] !== "none" && same(parse(style[`border${side}Color`]), accent)) drawsAccent = true;
    }
    if (drawsAccent) accents.push(describe(el));
    const edges = (["Top", "Right", "Bottom", "Left"] as const).filter((side) => parseFloat(style[`border${side}Width`]) > 0 && style[`border${side}Style`] !== "none").map((side) => style[`border${side}Color`]);
    claySeen(el, style.backgroundColor, style.color, ...edges, style.outlineStyle !== "none" ? style.outlineColor : "");
  }
  if (clays.length) hits.push(`V9 Claude orange outside the Claude UI: ${clays.slice(0, 6).join(", ")}`);
  if (accents.length > 1) hits.push(`V8 ${accents.length} accent elements: ${accents.slice(0, 6).join(", ")}`);
  return hits;
}

/**
 * Runs in the page: V14, a bar or meter never takes the colour of what it sits on (Tim's review: the sage bar on the
 * selected sage tile of S04 vanished). On the active slide:
 *  - every leaf fill (a class ending in __fill, __f or __bar with no filled child) has 3:1 against the colour behind it,
 *    or its own ink edge of 1.5 px or more;
 *  - such a fill never paints over the inset ink ring of its track: where it touches the track's edge, it needs 3:1
 *    against the colour outside the track (the tile), or its own ink edge.
 */
function scanBars(): string[] {
  type Rgba = { r: number; g: number; b: number; a: number };
  const parse = (value: string): Rgba | null => {
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1]!.split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: parts[0]!, g: parts[1]!, b: parts[2]!, a: parts[3] ?? 1 };
  };
  const lin = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (c: Rgba) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const ratio = (x: Rgba, y: Rgba) => {
    const [hi, lo] = [luminance(x), luminance(y)].sort((a, b) => b - a) as [number, number];
    return (hi + 0.05) / (lo + 0.05);
  };
  const over = (top: Rgba, below: Rgba): Rgba => {
    const a = top.a + below.a * (1 - top.a);
    const mix = (t: number, b: number) => (a === 0 ? 0 : (t * top.a + b * below.a * (1 - top.a)) / a);
    return { r: mix(top.r, below.r), g: mix(top.g, below.g), b: mix(top.b, below.b), a };
  };
  const backdrop = (el: Element | null): Rgba => {
    const stack: Rgba[] = [];
    for (let node = el; node; node = node.parentElement) {
      const bg = parse(getComputedStyle(node).backgroundColor);
      if (bg && bg.a > 0) {
        stack.push(bg);
        if (bg.a >= 0.99) break;
      }
    }
    return stack.reduceRight((below, top) => over(top, below), { r: 255, g: 255, b: 255, a: 1 });
  };
  const describe = (el: Element) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}.${Array.from(el.classList).slice(0, 2).join(".")}`;
  const visible = (el: Element) => {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    let opacity = 1;
    for (let node: Element | null = el; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
    return rect.width >= 2 && rect.height >= 2 && opacity > 0.25;
  };
  /** An own edge: a border or a zero-blur box-shadow of 1.5 px or more, 3:1 against the ground. */
  const inkEdge = (style: CSSStyleDeclaration, ground: Rgba) => {
    for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
      const color = parse(style[`border${side}Color`]);
      if (parseFloat(style[`border${side}Width`]) >= 1.5 && style[`border${side}Style`] !== "none" && color && ratio(over(color, ground), ground) >= 3) return true;
    }
    for (const layer of style.boxShadow === "none" ? [] : style.boxShadow.split(/,(?![^()]*\))/)) {
      const color = parse(layer);
      const lengths = (layer.replace(/rgba?\([^)]*\)/, "").match(/-?[\d.]+px/g) ?? []).map(parseFloat);
      if (color && (lengths[3] ?? 0) >= 1.5 && ratio(over(color, ground), ground) >= 3) return true;
    }
    return false;
  };
  const slide = document.querySelector<HTMLElement>("deck-stage > section[data-deck-active]");
  if (!slide) return ["no active slide"];
  const hits: string[] = [];
  const FILL = /(?:^|\s)[\w-]+__(?:fill|f|bar)(?:\s|$)/;
  for (const el of slide.querySelectorAll<HTMLElement>("*")) {
    if (typeof el.className !== "string" || !FILL.test(el.className) || el.closest(".cl-ui") || !visible(el)) continue;
    const style = getComputedStyle(el);
    const bg = parse(style.backgroundColor);
    if (!bg || bg.a < 0.3) continue;
    // a track (it holds a filled child) is judged through its fill
    if (Array.from(el.children).some((child) => (parse(getComputedStyle(child).backgroundColor)?.a ?? 0) > 0)) continue;
    const parent = el.parentElement!;
    const ground = backdrop(parent);
    const fill = over(bg, ground);
    const edged = inkEdge(style, ground);
    if (ratio(fill, ground) < 3 && !edged) hits.push(`V14 ${describe(el)} ${ratio(fill, ground).toFixed(2)}:1 on ${describe(parent)}`);
    const track = getComputedStyle(parent);
    const ring = /inset/.test(track.boxShadow) && parseFloat(track.borderLeftWidth) === 0;
    if (!ring || edged || !parent.parentElement) continue;
    const [r, p] = [el.getBoundingClientRect(), parent.getBoundingClientRect()];
    const touches = Math.abs(r.left - p.left) < 1.5 || Math.abs(r.right - p.right) < 1.5 || Math.abs(r.top - p.top) < 1.5 || Math.abs(r.bottom - p.bottom) < 1.5;
    const outside = backdrop(parent.parentElement);
    if (touches && ratio(fill, outside) < 3) hits.push(`V14 ${describe(el)} paints over the ink ring of ${describe(parent)} (${ratio(fill, outside).toFixed(2)}:1 on the tile)`);
  }
  return hits;
}

for (const edition of EDITIONS) {
  test.describe(`${SLUG} deck (${edition.lang})`, () => {
    test("arrow keys walk every step of the main slides and never reach the appendix", async ({ page }) => {
      test.setTimeout(120_000);
      await open(page, edition.deck);
      expect(await page.evaluate(() => typeof (window as unknown as { DeckKeys?: unknown }).DeckKeys)).toBe("object");
      const positions = await mainPositions(page);
      expect(positions.filter((position) => position.endsWith("/0"))).toHaveLength(MAIN_IDS.length);
      expect(await page.evaluate(() => Array.from(document.querySelectorAll("deck-stage > section.slide[data-kind=main]")).map((slide) => slide.id))).toEqual([...MAIN_IDS]);
      await expectAt(page, positions[0], "starts on the cover");

      for (const position of positions.slice(1)) {
        await page.keyboard.press("ArrowRight");
        await expectShown(page, position, `forward to ${position}`);
      }
      await page.keyboard.press("ArrowRight");
      await expectShown(page, positions.at(-1)!, "the last main step is the end");

      for (const position of [...positions].reverse().slice(1)) {
        await page.keyboard.press("ArrowLeft");
        await expectShown(page, position, `back to ${position}`);
      }
    });

    test("r and Shift+R return to the cover; other keys and modified r do nothing", async ({ page }) => {
      await open(page, `${edition.deck}#sectors/1`);
      await expectAt(page, "#sectors/1", "deep link");
      await expect(page.locator("#sectors")).toHaveAttribute("data-deck-active", "");

      for (const key of ["Space", "PageDown", "End", "Home", "5", "0", "Enter"]) {
        await page.keyboard.press(key);
        await expectAt(page, "#sectors/1", `${key} is unbound`);
      }
      const prevented = await page.evaluate(() =>
        [{ ctrlKey: true }, { metaKey: true }, { altKey: true }].map((mods) => {
          const event = new KeyboardEvent("keydown", { key: "r", code: "KeyR", bubbles: true, cancelable: true, ...mods });
          document.dispatchEvent(event);
          return event.defaultPrevented;
        }),
      );
      expect(prevented).toEqual([false, false, false]);
      await expectAt(page, "#sectors/1", "modified r is the browser's");

      await page.evaluate(() => {
        const input = document.createElement("input");
        input.id = "probe";
        document.body.append(input);
      });
      await page.locator("#probe").focus();
      await page.keyboard.press("r");
      await expectAt(page, "#sectors/1", "r inside a form control types");
      await page.locator("#probe").evaluate((input) => input.remove());

      await page.keyboard.press("r");
      await expectAt(page, "#cover/0", "bare r resets");
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => hash(page)).not.toBe("#cover/0");
      await page.keyboard.press("Shift+R");
      await expectAt(page, "#cover/0", "Shift+R resets");
    });

    test("Escape leaves an appendix page for the slide and step it came from; reload keeps the place", async ({ page }) => {
      await open(page, `${edition.deck}#letter/1`);
      await expectAt(page, "#letter/1", "deep link");
      await page.evaluate(() => {
        location.hash = "#a1/0";
      });
      await expect(page.locator("#a1")).toHaveAttribute("data-deck-active", "");
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Escape");
      await expectAt(page, "#letter/1", "Escape returns");
      await expect(page.locator("#letter")).toHaveAttribute("data-deck-active", "");

      await page.keyboard.press("ArrowRight");
      await expectAt(page, "#letter/2", "one step on");
      await page.reload();
      await expect(page.locator("#letter")).toHaveAttribute("data-deck-active", "");
      await expectAt(page, "#letter/2", "reload keeps the position");
    });

    test("no poll, vote button, vote counter or ghost bar on any slide", async ({ page }) => {
      await open(page, edition.deck);
      await expect(page.locator("deck-stage [data-poll], deck-stage [data-poll-n], deck-stage .poll, deck-stage .poll__opt, deck-stage .gb")).toHaveCount(0);
      expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.includes(":poll:")))).toEqual([]);
    });

    test("the appendix is a1 to a4, never reached by arrows, and a5 does not exist", async ({ page }) => {
      await open(page, edition.deck);
      const ids = await page.evaluate(() => Array.from(document.querySelectorAll("deck-stage > section.slide[data-kind=appendix]")).map((slide) => slide.id));
      expect(ids).toEqual([...APPENDIX_IDS]);
      await expect(page.locator("#a5")).toHaveCount(0);
      for (const id of APPENDIX_IDS) {
        await page.evaluate((target) => {
          location.hash = `#${target}/0`;
        }, id);
        await expect(page.locator(`#${id}`)).toHaveAttribute("data-deck-active", "");
      }
    });

    test("the recorded-take chip is on steps 1, 2 and the register and nowhere else", async ({ page }) => {
      const chip = edition.lang === "de" ? /aufgezeichnet|weicht vom Schlüssel ab/ : /recorded|differs from the key/;
      for (const id of MAIN_IDS) {
        const total = await (async () => {
          await open(page, `${edition.deck}#${id}/0`);
          return Number(await page.locator(`#${id}`).getAttribute("data-step-total"));
        })();
        await open(page, `${edition.deck}#${id}/${total}`);
        const takes = page.locator(`#${id} [data-take]`);
        if ((TAKE_SLIDES as readonly string[]).includes(id)) {
          await expect(takes.first(), `${id} shows a take`).toBeAttached();
          const chips = page.locator(`#${id} .tk-chip`);
          await expect(chips.first(), `${id} shows a take chip`).toBeAttached();
          const text = (await chips.allTextContents()).join(" ");
          expect(text, `${id} take chip`).toMatch(chip);
          expect(text, `${id} prints no raw timestamp`).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
        } else {
          await expect(takes, `${id} shows no take`).toHaveCount(0);
          await expect(page.locator(`#${id} .tk-chip`), `${id} shows no take chip`).toHaveCount(0);
        }
      }
    });

    test("visual law V1, V7, V8, V9 and V14 hold on every press of every main slide", async ({ page }) => {
      test.setTimeout(300_000);
      await open(page, edition.deck);
      const positions = await mainPositions(page);
      const problems: string[] = [];
      for (const [index, position] of positions.entries()) {
        if (index > 0) {
          await page.keyboard.press("ArrowRight");
          await expectShown(page, position, `forward to ${position}`);
        }
        const hits = [...(await page.evaluate(scanVisualLaw, { exempt: [...V1_EXEMPT] })), ...(await page.evaluate(scanBars))];
        for (const hit of hits) problems.push(`${position} ${hit}`);
      }
      expect(problems, problems.slice(0, 20).join("\n")).toEqual([]);
    });

    test("V14: bars and meters keep their ground when a sectors tile is selected", async ({ page }) => {
      const problems: string[] = [];
      const scan = async (state: string) => {
        for (const hit of await page.evaluate(scanBars)) problems.push(`${state} ${hit}`);
      };
      await open(page, `${edition.deck}#sectors/4`);
      await scan("sectors/4 trade open");
      for (const value of ["make", "build", "food", "trade"]) {
        await page.locator(`#sectors .st__b[data-value="${value}"]`).click();
        await expect(page.locator(`#sectors .st__b[data-value="${value}"]`)).toHaveAttribute("aria-pressed", "true");
        await scan(`sectors/4 ${value} selected`);
      }
      expect(problems, problems.slice(0, 20).join("\n")).toEqual([]);
    });
    test("P opens this edition's presenter view, which follows the deck", async ({ page }) => {
      await open(page, edition.deck);
      const [popup] = await Promise.all([page.waitForEvent("popup"), page.keyboard.press("p")]);
      await popup.waitForLoadState("domcontentloaded");
      expect(new URL(popup.url()).pathname).toBe(edition.presenter);
      await expect(popup.locator("#pv-conn")).toHaveAttribute("data-state", "live");
      const label = edition.lang === "de" ? "Folie" : "Slide";
      await expect(popup.locator("#pv-pos")).toContainText(`${label} 01 / 16`);
      await page.bringToFront();
      await page.keyboard.press("ArrowRight");
      await expect(popup.locator("#pv-pos")).toContainText(`${label} 02 / 16`);
      await popup.close();
    });

    test("the phone note links to this edition's demo and never to a script or another host", async ({ page }) => {
      await open(page, edition.deck);
      const link = page.locator("deck-stage .rotate a");
      const resolved = () => link.evaluate((a) => (a as HTMLAnchorElement).href);
      await expect.poll(resolved).toBe(new URL(edition.demo, page.url()).href);

      for (const hostile of ["javascript:alert(1)", "data:text/html,x", "//example.com/x", "https://example.com/x"]) {
        await page.route(`**${edition.deck}`, async (route) => {
          const response = await route.fetch();
          const body = (await response.text()).replace(/data-rotate-href="[^"]*"/, `data-rotate-href="${hostile}"`);
          await route.fulfill({ response, body });
        });
        await open(page, edition.deck);
        await expect.poll(resolved, { message: hostile }).toBe(new URL("./guide.html", page.url()).href);
        await page.unrouteAll();
      }
    });

    test("a phone in portrait never scrolls sideways and keeps the toolbar on screen", async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
      const page = await context.newPage();
      await open(page, edition.deck);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      const toolbar = await page.locator("deck-stage .controls").boundingBox();
      expect(toolbar, "toolbar").not.toBeNull();
      expect(toolbar!.x).toBeGreaterThanOrEqual(0);
      expect(toolbar!.x + toolbar!.width).toBeLessThanOrEqual(390);
      await context.close();
    });
  });
}
