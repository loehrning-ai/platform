import { expect, test, type Page } from "@playwright/test";

const SLUG = "ki-im-unternehmen-sicher-nutzen";

async function dragHandle(page: Page, fraction: number) {
  const box = await page.locator(".w05-track input").boundingBox();
  if (!box) throw new Error("handle not found");
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 28, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 28 + (box.width - 56) * fraction, y, { steps: 10 });
  await page.mouse.up();
}

test.describe(`/demos/${SLUG}`, () => {
  for (const [prefix, locale] of [["", "de"], ["/en", "en"]] as const) {
    test(`${locale} route plays the core loop offline at 390px without errors`, async ({ page, context }) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width: 390, height: 844 });
      const response = await page.goto(`${prefix}/demos/${SLUG}`, { waitUntil: "networkidle" });
      expect(response?.status()).toBe(200);

      const root = page.locator('[data-demo-mount="ki-im-unternehmen-sicher-nutzen"]');
      await root.locator(".w05-stage").scrollIntoViewIfNeeded();
      // A press on the stage ends the first sweep; the counter then rests at 4.
      await root.locator(".w05-counter-row").click({ position: { x: 5, y: 5 } });
      await expect(root.locator(".w05-digit")).toHaveText("4");
      await expect(root.locator(".w05-hit")).toHaveCount(4);

      // Offline from here on: nothing may need the network.
      await context.setOffline(true);
      const requests: string[] = [];
      page.on("request", (request) => requests.push(request.url()));

      await dragHandle(page, 0.97);
      await expect(root.locator(".w05-digit")).toHaveText("0");
      await expect(page.locator(".w05-track input")).toHaveValue("1000");
      await expect(root.locator(".w05-rest")).toContainText(locale === "de" ? "Rest-Scan: 0 Muster." : "Rest scan: 0 patterns.");
      const pills = await root.locator(".w05-pill").allTextContents();
      expect(pills.join(" ")).toContain(locale === "de" ? "[KUNDE]" : "[CUSTOMER]");

      // Own text through the visible field, then the prompt.
      await root.locator("textarea").first().fill("Bitte antworte an max@example.org, IBAN DE89 3704 0044 0532 0130 00");
      await expect(root.locator(".w05-digit")).toHaveText("2");
      const prompt = await root.locator("#w05-take pre").first().textContent();
      expect(prompt).toContain("[IBAN]");
      expect(prompt).not.toContain("max@example.org");

      await expect(root.locator(".w05-net")).toHaveAttribute("data-count", "0");
      expect(requests.filter((url) => !url.startsWith("data:"))).toEqual([]);

      // Page never scrolls sideways.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }

  test("the handle track keeps vertical scrolling (pan-y) and the keyboard moves it", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    const input = page.locator(".w05-track input");
    await expect(page.locator(".w05-track")).toHaveCSS("touch-action", "pan-y");
    await page.locator(".w05-counter-row").click({ position: { x: 5, y: 5 } });
    await input.focus();
    await page.keyboard.press("ArrowRight");
    await expect(input).toHaveValue("50");
    await page.keyboard.press("End");
    await expect(input).toHaveValue("1000");
  });

  test("Send (practice) flies the live details and latches, and Reset hands the handle back", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Senden (Probe)" }).click();
    await expect(page.locator(".w05-send-chip")).toHaveCount(4);
    await expect(page.locator(".w05-latch")).toBeVisible();
    await expect(page.locator(".w05-track input")).toBeDisabled();
    await page.getByRole("button", { name: "Zurücksetzen" }).click();
    await expect(page.locator(".w05-track input")).toBeEnabled();
  });

  test("the send probe: chips lift off their own details, never pile up, never cross the caption, and the strip has no hole", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.locator(".w05-stage").waitFor();
    await page.locator(".w05-counter-row").click({ position: { x: 5, y: 5 } });
    const button = page.getByRole("button", { name: "Senden (Probe)" });
    await button.click();
    const samples: { rects: { x: number; y: number; w: number; h: number }[]; title: number; chat: { top: number; bottom: number } }[] = [];
    for (let k = 0; k < 8; k += 1) {
      samples.push(
        await page.evaluate(() => {
          const box = (el: Element) => {
            const r = el.getBoundingClientRect();
            return { x: r.x, y: r.y, w: r.width, h: r.height };
          };
          const chat = document.querySelector(".w05-chat")!.getBoundingClientRect();
          return {
            rects: Array.from(document.querySelectorAll(".w05-send-chip")).map(box),
            title: Number(getComputedStyle(document.querySelector(".w05-chat-title")!).opacity),
            chat: { top: chat.top, bottom: chat.bottom },
          };
        }),
      );
      await page.waitForTimeout(110);
    }
    const overlap = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
      a.x < b.x + b.w - 1 && a.x + a.w > b.x + 1 && a.y < b.y + b.h - 1 && a.y + a.h > b.y + 1;
    for (const frame of samples) {
      for (let i = 0; i < frame.rects.length; i += 1) {
        for (let j = i + 1; j < frame.rects.length; j += 1) {
          expect(overlap(frame.rects[i]!, frame.rects[j]!), `chips ${i} and ${j} overlap`).toBe(false);
        }
      }
    }
    // The caption sits under the slots, out of the flight path, and the panel keeps its size the whole time.
    for (const frame of samples) expect(frame.title).toBe(1);
    const heights = samples.map((frame) => Math.round(frame.chat.bottom - frame.chat.top));
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(2);
  });

  test("under reduced motion the keyboard reaches 1 with the arrow keys alone, and back to 0", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    const input = page.locator(".w05-track input");
    await input.focus();
    for (let press = 0; press < 12; press += 1) await page.keyboard.press("ArrowRight");
    await expect(input).toHaveValue("1000");
    await expect(page.locator(".w05-digit")).toHaveText("0");
    for (let press = 0; press < 12; press += 1) await page.keyboard.press("ArrowLeft");
    await expect(input).toHaveValue("0");
    await expect(page.locator(".w05-digit")).toHaveText("4");
  });

  test("the first frame is the discovery state: markers on, the counter at 4, never 'nothing goes along'", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      const seen: string[] = [];
      (window as unknown as { __w05first: string[] }).__w05first = seen;
      const watch = () => {
        const digit = document.querySelector(".w05-digit")?.textContent;
        const label = document.querySelector(".w05-counter-label")?.textContent;
        const markers = document.querySelectorAll('.w05-hit[data-state="marker"]').length;
        if (digit !== undefined && seen.length < 40) seen.push(`${digit}|${label}|${markers}`);
        requestAnimationFrame(watch);
      };
      requestAnimationFrame(watch);
    });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    const seen = await page.evaluate(() => (window as unknown as { __w05first: string[] }).__w05first);
    expect(seen.length).toBeGreaterThan(5);
    expect(seen[0]).toMatch(/^4\|flieg\w* mit\|4$/);
    expect(seen.filter((entry) => entry.includes("Nichts"))).toEqual([]);
  });

  test("pasting far below the fold brings the stage with the new counter into view; the settle never scrolls the page", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    const area = page.locator("textarea").first();
    await area.scrollIntoViewIfNeeded();
    await area.fill("Hi, ich bin Jonas Weber aus Köln, tel +49 171 2345678, mail jonas@example.com, Rechnung RE-20417");
    await page.waitForTimeout(900);
    const counter = await page.locator(".w05-counter-row").boundingBox();
    expect(counter).not.toBeNull();
    expect(counter!.y).toBeGreaterThanOrEqual(0);
    expect(counter!.y + counter!.height).toBeLessThanOrEqual(844);
    // Dragging to the end and letting it settle moves nothing on its own.
    const before = await page.evaluate(() => window.scrollY);
    await dragHandle(page, 0.97);
    await page.waitForTimeout(900);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - before)).toBeLessThanOrEqual(1);
  });

  test("the first screen holds the counter, the card, the SENDEN line, the whole handle, the account switch and the verdict chip, at phone and desktop size", async ({ page }) => {
    for (const [width, height] of [[390, 844], [360, 740], [1440, 900]] as const) {
      await page.setViewportSize({ width, height });
      await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
      await page.locator(".w05-track").waitFor();
      const frame = await page.evaluate(() => {
        const bottom = (selector: string) => (document.querySelector(selector) as HTMLElement).getBoundingClientRect().bottom;
        return {
          scroll: window.scrollY,
          counter: bottom(".w05-counter-row"),
          card: bottom(".w05-card"),
          send: bottom(".w05-send-line"),
          handle: bottom(".w05-track"),
          account: bottom(".w05-acct .w05-segment"),
          chip: bottom("[data-verdict-chip]"),
          sendButton: bottom(".w05-send-row .w05-btn"),
        };
      });
      expect(frame.scroll).toBe(0);
      // the app's bottom tab bar covers about 56px of a phone screen
      const usable = width < 640 ? height - 56 : height;
      for (const [name, value] of Object.entries(frame)) {
        if (name === "scroll" || name === "sendButton") continue;
        // the verdict chip may be the one thing a 740 px phone pushes under its tab bar; the switch and the handle may not
        const room = name === "chip" && width < 640 && height < 800 ? usable + 40 : usable;
        expect(value, `${name} at ${width}x${height}`).toBeLessThanOrEqual(room);
      }
      // the practice send is one short scroll away, never further
      expect(frame.sendButton, `sendButton at ${width}x${height}`).toBeLessThanOrEqual(usable + 130);
    }
  });

  test("the first sweep plays on load without a scroll: one hit alone, then the rest, then back, then a lean to say 'drag me'", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      const seen: string[] = [];
      const lean: number[] = [];
      (window as unknown as { __w05: { seen: string[]; lean: number[] } }).__w05 = { seen, lean };
      const watch = () => {
        const digit = document.querySelector(".w05-digit");
        const handle = document.querySelector<HTMLElement>(".w05-handle");
        if (digit && seen[seen.length - 1] !== digit.textContent) seen.push(digit.textContent ?? "");
        if (handle) lean.push(Number(handle.style.getPropertyValue("--p")));
        requestAnimationFrame(watch);
      };
      requestAnimationFrame(watch);
    });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(9500);
    const { seen, lean } = await page.evaluate(() => (window as unknown as { __w05: { seen: string[]; lean: number[] } }).__w05);
    expect(seen.join(",")).toMatch(/^4,3,2,1,0,1,2,3,4$/);
    expect(Math.max(...lean)).toBeGreaterThan(0.9);
    expect(Math.max(...lean)).toBeGreaterThan(0.04);
    expect(lean[lean.length - 1]).toBe(0);
  });

  test("any pointer press on the stage cancels the intro and the hint at once", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.locator(".w05-stage").waitFor();
    await page.locator(".w05-counter-row").click({ position: { x: 5, y: 5 } });
    await expect(page.locator(".w05-digit")).toHaveText("4");
    await page.waitForTimeout(4200);
    expect(await page.locator(".w05-handle").evaluate((el) => (el as HTMLElement).style.getPropertyValue("--p"))).toBe("0");
  });

  test("every plain word stays opaque and ink coloured through End, Home, a sample switch and a refill", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    const input = page.locator(".w05-track input");
    await input.focus();
    await page.keyboard.press("End");
    await page.keyboard.press("Home");
    await page.locator('input[name="w05-sample"]').nth(1).check({ force: true });
    await page.locator("textarea").first().fill("Frau Dr. Schmidt (Tel +49 171 2345678) hat Rechnung über 1.200,00 € nicht bezahlt. Hans Meier schrieb.");
    for (let i = 0; i < 6; i += 1) {
      const bad = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>(".w05-word")).filter((word) => {
          const style = getComputedStyle(word);
          return style.opacity !== "1" || style.visibility !== "visible" || style.color !== "rgb(18, 18, 18)";
        }).length,
      );
      expect(bad).toBe(0);
      await page.waitForTimeout(80);
    }
    const words = await page.locator(".w05-word").count();
    expect(words).toBeGreaterThan(6);
  });

  test("'Frau Dr. Schmidt' is one name in the prompt and comes back whole in the replay", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.locator("textarea").first().fill("Frau Dr. Schmidt (Tel +49 171 2345678) hat nicht bezahlt.");
    const prompt = await page.locator("#w05-take pre").first().textContent();
    expect(prompt).toContain("Frau [KUNDE] (Tel [TELEFON])");
    await page.locator("textarea").nth(2).fill("Guten Tag Frau [KUNDE], ...");
    await expect(page.locator("#w05-take pre").nth(1)).toContainText("Frau Dr. Schmidt");
  });

  test("a tap near a word lands on the nearest word, never on the neighbouring line, and a one-letter word is reachable (EN, touch)", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    await page.goto(`/en/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.locator(".w05-counter-row").tap({ position: { x: 5, y: 5 } });
    const manual = page.locator('.w05-hit[data-kind="manual"]');
    const rectOf = (text: string) =>
      page.evaluate((t) => {
        const el = Array.from(document.querySelectorAll<HTMLElement>(".w05-word")).find((e) => e.textContent === t)!;
        const r = el.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height };
      }, text);
    // The one-letter word: 14px to the right of its own box, in the space after it.
    const i = await rectOf("I");
    await page.touchscreen.tap(i.x + i.w + 3, i.y + i.h / 2);
    await expect(manual).toHaveCount(1);
    await expect(manual.first()).toHaveAttribute("aria-label", /: I,/);
    await manual.first().tap();
    await expect(manual).toHaveCount(0);
    // Low in its own line box (9px below the middle): still "Hello", not the word on the line under it.
    const hello = await rectOf("Hello");
    await page.touchscreen.tap(hello.x + hello.w / 2, hello.y + hello.h / 2 + 12);
    await expect(manual).toHaveCount(1);
    await expect(manual.first()).toHaveAttribute("aria-label", /: Hello,/);
    await context.close();
  });

  test("the marker covers its whole slot, so no blank hole sits between a detail and the next word", async ({ page }) => {
    for (const [prefix, width] of [["/en", 360], ["", 390]] as const) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`${prefix}/demos/${SLUG}`, { waitUntil: "networkidle" });
      await page.locator(".w05-counter-row").click({ position: { x: 5, y: 5 } });
      const gaps = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>(".w05-hit")).map((hit) => {
          const slot = hit.getBoundingClientRect().width;
          const mk = hit.querySelector<HTMLElement>(".w05-mk")!.getBoundingClientRect().width;
          return slot - mk;
        }),
      );
      for (const gap of gaps) expect(gap, `${prefix} ${width}`).toBeLessThanOrEqual(1);
    }
  });

  test("the account switch sits on the stage, the verdict chip follows it, and the checkbox row is a 44px target", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.locator(".w05-counter-row").click({ position: { x: 5, y: 5 } });
    const chip = page.locator("[data-verdict-chip]");
    await expect(chip).toHaveText(/ROT\s+Kundendaten auf Privatkonto/);
    await page.locator('.w05-acct input[name="w05-account"]').nth(1).check({ force: true });
    await expect(chip).toHaveText(/AMBER\s+Firmenkonto/);
    await page.locator('.w05-acct input[name="w05-account"]').nth(0).check({ force: true });
    await expect(chip).toHaveText(/ROT/);
    const box = await page.locator(".w05-check input").boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  });

  test("choosing an example announces it with its counter, every time", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    const live = page.locator('p.w05-sr[role="status"]');
    await page.locator('input[name="w05-sample"]').nth(1).check({ force: true });
    await expect(live).toContainText("Beispiel gewechselt: Code. Zähler 4");
    await page.locator('input[name="w05-sample"]').nth(0).check({ force: true });
    await expect(live).toContainText("Beispiel gewechselt: Kundenmail. Zähler 4");
  });

  test("the German page shows no English source strings", async ({ page }) => {
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    const text = await page.locator("#quellen").innerText();
    expect(text).toContain("Abgeleitet aus den Tarifseiten auf claude.com/pricing · gelesen 18.10.2026");
    expect(text).toContain("ohne Datum");
    expect(text).not.toMatch(/Derived from|undated|\bread 2026/);
  });

  test("the caption and the handle step back while the chips fly past (frame 0.3 of the send), then return", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.locator(".w05-counter-row").click({ position: { x: 5, y: 5 } });
    await page.getByRole("button", { name: "Senden (Probe)" }).click();
    const seen: number[] = [];
    for (let k = 0; k < 14; k += 1) {
      seen.push(await page.evaluate(() => Number(getComputedStyle(document.querySelector(".w05-caption")!).opacity)));
      await page.waitForTimeout(90);
    }
    expect(Math.min(...seen)).toBeLessThanOrEqual(0.45);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => Number(getComputedStyle(document.querySelector(".w05-caption")!).opacity))).toBe(1);
  });

  test.describe("a real touch", () => {
    test.use({ hasTouch: true });

    test("a vertical swipe that starts on the handle scrolls the page, a horizontal drag moves the handle", async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "CDP touch events");
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
      const input = page.locator(".w05-track input");
      await input.evaluate((el) => el.scrollIntoView({ block: "center" }));
      const cdp = await page.context().newCDPSession(page);
      const swipe = async (points: readonly { x: number; y: number }[]) => {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [points[0]] });
        for (const point of points.slice(1)) {
          await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [point] });
          await page.waitForTimeout(16);
        }
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await page.waitForTimeout(250);
      };
      const box = (await input.boundingBox())!;
      const before = await page.evaluate(() => window.scrollY);
      await swipe(Array.from({ length: 12 }, (_, k) => ({ x: box.x + 28, y: box.y + 28 - k * 12 })));
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 40);
      await expect(input).toHaveValue("0");
      const next = (await page.locator(".w05-track").boundingBox())!;
      await swipe(Array.from({ length: 14 }, (_, k) => ({ x: next.x + 28 + k * 14, y: next.y + 28 })));
      expect(Number(await input.inputValue())).toBeGreaterThan(300);
    });
  });
});
