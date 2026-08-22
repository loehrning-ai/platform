import { expect, type Page } from "@playwright/test";

/**
 * Axe excludes opacity-zero content from several rules. Drive every
 * IntersectionObserver-backed entrance first, then prove meaningful semantic
 * content is not still hidden before the scan is allowed to pass.
 */
export async function exposeAllAuditedContent(page: Page): Promise<void> {
  await page.addStyleTag({
    content:
      ".js-reveal{opacity:1!important;transform:none!important;visibility:visible!important}",
  });

  for (let sweep = 0; sweep < 2; sweep += 1) {
    await page.evaluate(async () => {
      // Bounded: requestAnimationFrame does not fire on a backgrounded or
      // occluded page, and this loop runs up to 1000 times. See settle.ts.
      const frame = () =>
        new Promise<void>((resolve) => {
          let settled = false;
          const done = () => {
            if (settled) return;
            settled = true;
            resolve();
          };
          requestAnimationFrame(() => requestAnimationFrame(done));
          setTimeout(done, 250);
        });
      const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
      let position = 0;
      let steps = 0;
      while (position <= document.documentElement.scrollHeight && steps < 1_000) {
        window.scrollTo(0, position);
        await frame();
        position += step;
        steps += 1;
      }
      window.scrollTo(0, document.documentElement.scrollHeight);
      await frame();
      window.scrollTo(0, 0);
      await frame();
    });
  }

  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const effectiveOpacity = (element: Element): number => {
            let opacity = 1;
            let current: Element | null = element;
            while (current) {
              opacity *= Number.parseFloat(
                getComputedStyle(current).opacity || "1",
              );
              if (current === document.body) break;
              current = current.parentElement;
            }
            return opacity;
          };

          return Array.from(
            document.querySelectorAll<HTMLElement>(
              "h1,h2,h3,h4,h5,h6,p,a,button,label,li,article,section,main",
            ),
          )
            .filter((element) => {
              if (
                !element.textContent?.trim() ||
                element.closest("svg") ||
                element.closest('[aria-hidden="true"]') ||
                element.closest("[hidden]")
              ) {
                return false;
              }
              const style = getComputedStyle(element);
              const rectangle = element.getBoundingClientRect();
              return (
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                rectangle.width >= 2 &&
                rectangle.height >= 2 &&
                effectiveOpacity(element) < 0.05
              );
            })
            .map((element) => {
              const label = element.textContent?.trim().replace(/\s+/g, " ");
              return `${element.tagName.toLowerCase()}:${label?.slice(0, 80)}`;
            })
            .slice(0, 20);
        }),
      {
        timeout: 15_000,
        message:
          "meaningful semantic content must be visibly rendered before axe scans it",
      },
    )
    .toEqual([]);
}
