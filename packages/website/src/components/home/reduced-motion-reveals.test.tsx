import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CredibilityStrip } from "./credibility-strip";
import { FinalCta } from "./final-cta";
import { Offering } from "./offering";

describe("homepage static content visibility", () => {
  it("renders every section visibly in server markup", () => {
    const html = renderToString(
      <>
        <Offering />
        <CredibilityStrip />
        <FinalCta />
      </>,
    );

    expect(html).not.toContain("opacity:0");
    expect(html).not.toContain("scaleX(0)");
    expect(html).toContain("Vier Kurse.");
    expect(html).toContain("Betriebsprinzipien");
    expect(html).toContain("Den passenden Einstieg finden.");
  });

  it("renders the featured course inside a visible static wrapper", () => {
    render(<Offering />);

    const featuredReveal = screen.getByText("Empfohlener Einstieg").closest("a")?.parentElement;
    expect(featuredReveal).not.toBeNull();
    expect(featuredReveal?.tagName).toBe("DIV");
    expect(featuredReveal).toHaveClass("mt-12");
    expect(featuredReveal).not.toHaveStyle({ opacity: "0" });
    expect(featuredReveal).not.toHaveStyle({ transform: "scaleX(0)" });
  });
});
