import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CredibilityStrip } from "./credibility-strip";
import { Offering } from "./offering";

describe("homepage static content visibility", () => {
  it("renders every section visibly in server markup", () => {
    const html = renderToString(
      <>
        <Offering />
        <CredibilityStrip />
      </>,
    );

    expect(html).not.toContain("opacity:0");
    expect(html).not.toContain("scaleX(0)");
    expect(html).toContain("Vier Kurse.");
    expect(html).toContain("Betriebsprinzipien");
  });

  it("renders the complete foundation route in visible static markup", () => {
    render(<Offering />);

    const route = screen.getByTestId("foundation-route");
    expect(route).toBeVisible();
    expect(route).not.toHaveStyle({ opacity: "0" });
    expect(route).not.toHaveStyle({ transform: "scaleX(0)" });
  });
});
