import { describe, expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import type { Page } from "@playwright/test";
import { withBrowserErrorGate } from "../../packages/website/tests/e2e/fixtures/smoke";

function syntheticPage(engine = "chromium") {
  const page = new EventEmitter();
  Object.assign(page, { context: () => ({ browser: () => ({ browserType: () => ({ name: () => engine }) }) }) });
  return { events: page, page: page as unknown as Page };
}

describe("baseline browser error guard", () => {
  test("attaches before the action and rejects an uncaught error even when the action succeeds", async () => {
    const page = syntheticPage();
    await expect(withBrowserErrorGate(page.page, async () => {
      page.events.emit("pageerror", new Error("synthetic unrelated hydration failure"));
      return "DOM assertions passed";
    })).rejects.toThrow("synthetic unrelated hydration failure");
  });

  test("console errors also refuse a successful action", async () => {
    const page = syntheticPage();
    await expect(withBrowserErrorGate(page.page, async () => {
      page.events.emit("console", { type: () => "error", text: () => "synthetic unexpected console error", location: () => ({ url: "http://localhost:3421/en/kurse", line: 10, column: 2 }) });
    })).rejects.toThrow("synthetic unexpected console error");
  });

  test("the existing narrow WebKit prefetch exception remains allowed", async () => {
    const page = syntheticPage("webkit");
    const result = await withBrowserErrorGate(page.page, async () => {
      page.events.emit("pageerror", new Error("/localhost:3421/en/kurse?_rsc=abc due to access control checks."));
      return "passed";
    });
    expect(result).toBe("passed");
  });

  test("ordinary console output remains allowed", async () => {
    const page = syntheticPage();
    await withBrowserErrorGate(page.page, async () => {
      page.events.emit("console", { type: () => "log", text: () => "synthetic normal log", location: () => ({ url: "", line: 0, column: 0 }) });
    });
  });
});
