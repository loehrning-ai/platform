import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AnimPath } from "./anim-path";

describe("AnimPath ", () => {
  it("renders an SVG path with the given d attribute", () => {
    const { container } = render(
      <svg>
        <AnimPath d="M0 0 L10 10" />
      </svg>,
    );
    const path = container.querySelector("path");
    expect(path).not.toBeNull();
    expect(path?.getAttribute("d")).toBe("M0 0 L10 10");
  });

  it("applies default stroke/width/opacity and a drawPath animation style", () => {
    const { container } = render(
      <svg>
        <AnimPath d="M0 0 L10 10" />
      </svg>,
    );
    const path = container.querySelector("path");
    expect(path?.getAttribute("stroke")).toBe("currentColor");
    expect(path?.getAttribute("stroke-width")).toBe("2");
    expect(path?.getAttribute("fill")).toBe("none");
    expect(path?.getAttribute("opacity")).toBe("1");
    expect(path?.getAttribute("style")).toContain("drawPath");
  });

  it("honors custom stroke/width/dur/delay/fill/opacity overrides", () => {
    const { container } = render(
      <svg>
        <AnimPath d="M0 0 L10 10" stroke="#5B3EE8" width={3} dur={0.8} delay={0.2} fill="red" opacity={0.5} />
      </svg>,
    );
    const path = container.querySelector("path");
    expect(path?.getAttribute("stroke")).toBe("#5B3EE8");
    expect(path?.getAttribute("stroke-width")).toBe("3");
    expect(path?.getAttribute("fill")).toBe("red");
    expect(path?.getAttribute("opacity")).toBe("0.5");
    expect(path?.getAttribute("style")).toContain("0.8s 0.2s");
  });
});
