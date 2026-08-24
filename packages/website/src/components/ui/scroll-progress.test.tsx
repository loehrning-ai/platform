import { act, cleanup, render } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const MotionDiv = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { readonly style?: unknown }
  >(function MotionDiv({ children, style: _style, ...props }, ref) {
    return React.createElement("div", { ...props, ref }, children);
  });
  const Pass = ({ children }: { readonly children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children);

  return {
    m: { div: MotionDiv },
    useScroll: () => ({ scrollYProgress: {} }),
    LazyMotion: Pass,
    MotionConfig: Pass,
    domAnimation: {},
  };
});

import { ScrollProgress } from "./scroll-progress";

afterEach(cleanup);

describe("<ScrollProgress>", () => {
  it("renders one hidden top thread and one desktop side spine", () => {
    const { container } = render(<ScrollProgress />);

    const thread = container.querySelector("[data-scroll-progress]");
    expect(thread).toHaveAttribute("aria-hidden", "true");
    expect(thread).toHaveClass("pointer-events-none", "fixed");
    expect(
      container.querySelector('[data-scroll-progress-fill="top"]'),
    ).toHaveClass("motion-reduce:hidden");
    expect(
      container.querySelector('[data-scroll-progress-fill="side"]')
        ?.parentElement,
    ).toHaveClass("hidden", "lg:block");
  });

  it("keeps identical progress nodes across server render and hydration", async () => {
    const serverHtml = renderToString(<ScrollProgress />);
    const container = document.createElement("div");
    container.innerHTML = serverHtml;
    document.body.append(container);
    const recoverableError = vi.fn();

    const root = hydrateRoot(container, <ScrollProgress />, {
      onRecoverableError: recoverableError,
    });
    await act(async () => undefined);

    expect(recoverableError).not.toHaveBeenCalled();
    expect(container.querySelectorAll("[data-scroll-progress-fill]")).toHaveLength(
      2,
    );
    expect(
      Array.from(container.querySelectorAll("[data-scroll-progress-fill]")).every(
        (element) => element.classList.contains("motion-reduce:hidden"),
      ),
    ).toBe(true);

    await act(async () => root.unmount());
    container.remove();
  });
});
