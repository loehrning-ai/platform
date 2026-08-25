import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ComprehensionCheck } from "./ComprehensionCheck";

afterEach(cleanup);

describe("ComprehensionCheck", () => {
  it("requires an answer before comparing and keeps the response while toggling", () => {
    render(
      <ComprehensionCheck
        id="prediction"
        question="What does the model predict?"
        criteria={[
          "Names next-token prediction.",
          "Separates plausibility from verification.",
        ]}
        label="Quick self-check"
        responseLabel="Your answer"
        responsePlaceholder="State the core idea."
        compareLabel="Compare with criteria"
        hideLabel="Hide criteria"
        criteriaLabel="Check criteria"
        sessionOnlyLabel="This page only. Not saved."
      />,
    );

    const response = screen.getByRole("textbox", { name: "Your answer" });
    const compare = screen.getByRole("button", {
      name: "Compare with criteria",
    });

    expect(compare).toBeDisabled();
    fireEvent.change(response, { target: { value: "x" } });
    expect(compare).toBeEnabled();

    fireEvent.click(compare);
    expect(
      screen.getByRole("heading", { level: 3, name: "Check criteria" }),
    ).toBeVisible();
    expect(screen.getByText("Names next-token prediction.")).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "Hide criteria" }),
    );
    expect(screen.getByText("Names next-token prediction.")).not.toBeVisible();
    expect(response).toHaveValue("x");
  });
});
