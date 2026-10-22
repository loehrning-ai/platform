import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText } from "./copy-button";

describe("copyText fallback", () => {
  const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");

  afterEach(() => {
    if (original) Object.defineProperty(navigator, "clipboard", original);
    else Reflect.deleteProperty(navigator, "clipboard");
    vi.restoreAllMocks();
  });

  it("gives focus back to the button after the textarea fallback", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    const exec = vi.fn(() => true);
    Object.defineProperty(document, "execCommand", { configurable: true, value: exec });
    // Browsers move focus into the textarea on select(); jsdom does not, so mimic it.
    vi.spyOn(HTMLTextAreaElement.prototype, "select").mockImplementation(function (this: HTMLTextAreaElement) {
      this.focus();
    });
    render(<button type="button">Kopieren</button>);
    const button = screen.getByRole("button", { name: "Kopieren" });
    button.focus();

    await expect(copyText("Die Verteilregel")).resolves.toBe(true);

    expect(exec).toHaveBeenCalledWith("copy");
    expect(document.activeElement).toBe(button);
    expect(document.querySelector("textarea")).toBeNull();
  });
});
