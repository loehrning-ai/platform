import { createElement, forwardRef, Fragment, type ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => {
  const motionElements = new Proxy(
    {},
    {
      get: (_target, tag) =>
        forwardRef<HTMLElement, Record<string, unknown>>(function MotionElement(
          { children, ...props },
          ref,
        ) {
          const {
            animate: _animate,
            exit: _exit,
            initial: _initial,
            transition: _transition,
            ...domProps
          } = props;
          return createElement(
            tag as string,
            { ...domProps, ref },
            children as ReactNode,
          );
        }),
    },
  );

  return {
    m: motionElements,
    AnimatePresence: ({ children }: { readonly children: ReactNode }) =>
      createElement(Fragment, null, children),
  };
});

import { ExcelDemo } from "./excel-demo";

describe("<ExcelDemo> mobile spreadsheet containment", () => {
  it("bounds both grid tracks and exposes only the worksheet as a keyboard scroller", () => {
    const { container } = render(<ExcelDemo />);
    const worksheet = screen.getByRole("region", {
      name: "Beispieldaten des Arbeitsblatts",
    });
    const spreadsheet = worksheet.parentElement;
    const grid = spreadsheet?.parentElement;

    expect(grid).toHaveClass("w-full", "min-w-0", "max-w-full");
    expect(grid).toHaveClass(
      "md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]",
    );
    expect(spreadsheet).toHaveClass("w-full", "min-w-0", "max-w-full");
    expect(worksheet).toHaveAttribute("data-course-horizontal-scroll");
    expect(worksheet).toHaveAttribute("tabindex", "0");
    expect(worksheet).toHaveClass(
      "w-full",
      "min-w-0",
      "max-w-full",
      "overflow-x-auto",
      "overscroll-x-contain",
    );
    expect(within(worksheet).getByRole("table")).toHaveClass("min-w-[520px]");
    expect(
      container.querySelectorAll("[data-course-horizontal-scroll]"),
    ).toHaveLength(1);
  });
});
