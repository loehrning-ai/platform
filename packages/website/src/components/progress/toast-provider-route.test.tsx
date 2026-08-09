import {
  act,
  cleanup,
  render,
  waitFor,
  within,
} from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
const lifecycle = vi.hoisted(() => ({ runtimeRenders: 0 }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

vi.mock("next/dynamic", () => ({
  default: () =>
    function ProgressToastRuntimeMock() {
      lifecycle.runtimeRenders += 1;
      return <div data-testid="progress-toast-runtime" />;
    },
}));

import { ProgressToastProvider } from "./toast-provider";

beforeEach(() => {
  lifecycle.runtimeRenders = 0;
});

afterEach(() => {
  navigation.pathname = "/";
  cleanup();
});

describe("ProgressToastProvider route gate", () => {
  it.each([
    "/kurse/open-source/data-infrastructure",
    "/en/kurse/open-source/data-infrastructure",
  ])("renders no server markup for %s", (pathname) => {
    navigation.pathname = pathname;
    expect(renderToStaticMarkup(<ProgressToastProvider />)).toBe("");
    expect(lifecycle.runtimeRenders).toBe(0);
  });

  it.each([
    "/kurse/open-source/data-infrastructure",
    "/en/kurse/open-source/data-infrastructure",
  ])(
    "keeps the first client render empty and loads the runtime after mount for %s",
    async (pathname) => {
      navigation.pathname = pathname;
      const container = document.createElement("div");
      document.body.append(container);
      const root = hydrateRoot(container, <ProgressToastProvider />);

      try {
        expect(container).toBeEmptyDOMElement();
        expect(lifecycle.runtimeRenders).toBe(0);

        await waitFor(() => {
          expect(
            within(container).getByTestId("progress-toast-runtime"),
          ).toBeInTheDocument();
        });
        expect(lifecycle.runtimeRenders).toBeGreaterThan(0);
      } finally {
        await act(async () => {
          root.unmount();
        });
        container.remove();
      }
    },
  );

  it.each([
    "/kurse/open-source/data-infrastructure",
    "/en/kurse/open-source/data-infrastructure",
  ])("renders the same progress boundary after mount for %s", async (pathname) => {
    navigation.pathname = pathname;
    const { findByTestId } = render(<ProgressToastProvider />);
    expect(await findByTestId("progress-toast-runtime")).toBeInTheDocument();
  });

  it("keeps the progress runtime off a non-learning route", () => {
    navigation.pathname = "/en/impressum";
    const { container } = render(<ProgressToastProvider />);
    expect(container).toBeEmptyDOMElement();
  });
});
