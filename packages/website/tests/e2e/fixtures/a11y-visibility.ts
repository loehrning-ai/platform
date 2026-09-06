import { expect, type Page } from "@playwright/test";
import { revealSweepDeadline, sweepReveals } from "./settle";

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

  // Two sweeps, sharing ONE wall-clock budget owned by the driver. The second
  // catches an entrance whose animation only started during the first. Both
  // together measure 28ms on the reader chapter and 100ms on the tallest route
  // audited anywhere (22,324px), against 22s and >90s for the in-page sweeps
  // they replace once Chromium throttles an occluded renderer. See
  // sweepReveals for the measurement and the failure it explains.
  const deadline = revealSweepDeadline();
  for (let sweep = 0; sweep < 2; sweep += 1) {
    await sweepReveals(page, {
      label: `exposeAllAuditedContent sweep ${sweep + 1}/2`,
      endAt: "top",
      deadline,
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
