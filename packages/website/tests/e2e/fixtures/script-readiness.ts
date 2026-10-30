import type { Page, Request } from "@playwright/test";

/** Track required script requests before navigation, independently of the app framework. */
export function trackScriptRequests(page: Page) {
  const pending = new Set<Request>();
  const failed: string[] = [];
  const waiters = new Set<() => void>();
  let disposed = false;
  let closed = false;
  const notify = () => { for (const wake of waiters) wake(); waiters.clear(); };
  const requested = (request: Request) => {
    if (request.resourceType() === "script") pending.add(request);
  };
  const finished = (request: Request) => { if (pending.delete(request)) notify(); };
  const rejected = (request: Request) => {
    if (request.resourceType() !== "script") return;
    failed.push(`${request.url()}: ${request.failure()?.errorText ?? "request failed"}`);
    pending.delete(request);
    notify();
  };
  const close = () => { closed = true; notify(); };
  page.on("request", requested);
  page.on("requestfinished", finished);
  page.on("requestfailed", rejected);
  page.on("close", close);
  const check = () => {
    if (failed.length) throw new Error(`Required script requests failed:\n${failed.join("\n")}`);
    if (disposed || closed) throw new Error("Script readiness tracker is no longer attached to an open page");
  };
  return {
    async waitForReady(): Promise<void> {
      for (;;) {
        check();
        if (pending.size) {
          await new Promise<void>((resolve) => waiters.add(resolve));
          continue;
        }
        // Finished downloads can execute imports/effects that request another
        // script. Flush a real frame, then check the tracked requests again.
        await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
        check();
        if (pending.size === 0) return;
      }
    },
    dispose(): void {
      disposed = true;
      page.off("request", requested);
      page.off("requestfinished", finished);
      page.off("requestfailed", rejected);
      page.off("close", close);
      notify();
    },
  };
}
