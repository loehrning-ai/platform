import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, waitFor, within } from "@testing-library/react";
import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const lifecycle = vi.hoisted(() => ({ runtimeRenders: 0 }));

vi.mock("next/dynamic", () => ({
  default: () =>
    function UserProgressSyncRuntimeMock() {
      lifecycle.runtimeRenders += 1;
      return createElement("div", {
        "data-testid": "user-progress-sync-runtime",
      });
    },
}));

import { UserProgressSync } from "./user-progress-sync";

beforeEach(() => {
  lifecycle.runtimeRenders = 0;
});

describe("UserProgressSync client boundary", () => {
  it("keeps reconciliation machinery out of first-load JS", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/auth/user-progress-sync.tsx"),
      "utf8",
    );

    expect(source).toContain('from "next/dynamic"');
    expect(source).toContain("{ ssr: false }");
    expect(source).not.toContain("@/lib/progress/store");
    expect(source).not.toContain("@/lib/progress/account-deletion-control");
  });

  it("renders no server markup", () => {
    expect(renderToStaticMarkup(createElement(UserProgressSync))).toBe("");
    expect(lifecycle.runtimeRenders).toBe(0);
  });

  it("keeps the first client render empty and loads the runtime after mount", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = hydrateRoot(container, createElement(UserProgressSync));

    try {
      expect(container).toBeEmptyDOMElement();
      expect(lifecycle.runtimeRenders).toBe(0);

      await waitFor(() => {
        expect(
          within(container).getByTestId("user-progress-sync-runtime"),
        ).toBeInTheDocument();
      });
      expect(lifecycle.runtimeRenders).toBeGreaterThan(0);
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });
});
