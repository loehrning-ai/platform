import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/dynamic", () => ({
  default: () =>
    function DotFieldStub({ paused }: { readonly paused: boolean }) {
      return <canvas data-testid="dot-field" data-paused={String(paused)} />;
    },
}));

import { LOGIN_SCENE_LAYER_ID, LoginScene } from "./login-scene";

type Listener = () => void;

function stubReducedMotion(initial: boolean) {
  const listeners = new Set<Listener>();
  const query = {
    matches: initial,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (_: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_: string, listener: Listener) =>
      listeners.delete(listener),
  };
  vi.spyOn(window, "matchMedia").mockImplementation(
    () => query as unknown as MediaQueryList,
  );
  return {
    set(matches: boolean) {
      query.matches = matches;
      for (const listener of listeners) listener();
    },
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("LoginScene", () => {
  it("renders a decorative backdrop, the dot field and a pressed-state pause toggle", () => {
    stubReducedMotion(false);
    const { container } = render(
      <LoginScene pauseLabel="Hintergrundbewegung anhalten" />,
    );

    const backdrop = container.querySelector("[data-login-scene-backdrop]");
    expect(backdrop).toHaveAttribute("aria-hidden", "true");
    expect(backdrop).toHaveAttribute("id", LOGIN_SCENE_LAYER_ID);
    expect(backdrop?.className).toContain("login-scene-backdrop");
    expect(screen.getByTestId("dot-field")).toHaveAttribute("data-paused", "false");

    const toggle = screen.getByRole("button", {
      name: "Hintergrundbewegung anhalten",
    });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    // aria-controls names an element that is always in the DOM.
    expect(toggle).toHaveAttribute("aria-controls", LOGIN_SCENE_LAYER_ID);
    expect(toggle.className).toContain("login-scene-toggle");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    // The name stays fixed; only the pressed state changes.
    expect(toggle).toHaveAccessibleName("Hintergrundbewegung anhalten");
    expect(screen.getByTestId("dot-field")).toHaveAttribute("data-paused", "true");
    expect(window.localStorage.getItem("login-scene-paused")).toBe("1");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(window.localStorage.getItem("login-scene-paused")).toBeNull();
  });

  it("remembers a pause chosen on an earlier visit", () => {
    stubReducedMotion(false);
    window.localStorage.setItem("login-scene-paused", "1");
    render(<LoginScene pauseLabel="Pause background motion" />);

    expect(
      screen.getByRole("button", { name: "Pause background motion" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("dot-field")).toHaveAttribute("data-paused", "true");
  });

  it("keeps the static grid only under reduced motion: no canvas, no toggle", () => {
    const media = stubReducedMotion(true);
    const { container } = render(<LoginScene pauseLabel="Pause background motion" />);

    expect(container.querySelector("[data-login-scene-backdrop]")).not.toBeNull();
    expect(screen.queryByTestId("dot-field")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();

    // A live preference change is followed both ways.
    act(() => media.set(false));
    expect(screen.getByTestId("dot-field")).toBeInTheDocument();
    act(() => media.set(true));
    expect(screen.queryByTestId("dot-field")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
