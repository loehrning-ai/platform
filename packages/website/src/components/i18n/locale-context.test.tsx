import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider, useLocale } from "./locale-context";

function LocaleProbe() {
  return <span>{useLocale()}</span>;
}

afterEach(cleanup);

describe("LocaleProvider", () => {
  it("provides the explicit request locale", () => {
    render(
      <LocaleProvider locale="en">
        <LocaleProbe />
      </LocaleProvider>,
    );

    expect(screen.getByText("en")).toBeInTheDocument();
  });

  it("fails closed when a consumer has no provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<LocaleProbe />)).toThrow(
      "useLocale must be used within LocaleProvider",
    );

    consoleError.mockRestore();
  });
});
