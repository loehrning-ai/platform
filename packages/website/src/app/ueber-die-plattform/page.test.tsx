import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const runtime = vi.hoisted(() => ({ account: false, feedback: false }));

vi.mock("@/lib/runtime-features", () => ({
  getRuntimeFeatures: () => runtime,
}));

import UeberDiePlattformPage from "./page";

describe("UeberDiePlattformPage access contract", () => {
  beforeEach(() => {
    runtime.account = false;
    runtime.feedback = false;
  });

  it("distinguishes public resources from the account-protected German readers", () => {
    render(<UeberDiePlattformPage />);

    expect(
      screen.getByText(/Start- und Kurs-Landingpages.*sechs technischen Kursreader/s),
    ).toHaveTextContent(/öffentlich und ohne Konto/i);
    expect(
      screen.getByText(/Reader der vier deutschen Kernkurse/),
    ).toHaveTextContent(/erfordern ein kostenloses Lernkonto/);
    expect(
      screen.getByText(/Reader der vier deutschen Kernkurse/),
    ).toHaveTextContent(/Kontofunktion ist in dieser Version deaktiviert/);
  });

  it("uses an email correction path when server-side feedback is unavailable", () => {
    render(<UeberDiePlattformPage />);

    expect(screen.queryByRole("link", { name: /per Feedback/i })).toBeNull();
    expect(screen.getByRole("link", { name: /per E-Mail/i })).toHaveAttribute(
      "href",
      "mailto:tim@loehrning.ai",
    );
  });

  it("advertises the feedback form only when its runtime boundary is ready", () => {
    runtime.account = true;
    runtime.feedback = true;
    render(<UeberDiePlattformPage />);

    expect(
      screen.getByText(/Reader der vier deutschen Kernkurse/),
    ).not.toHaveTextContent(/Kontofunktion ist in dieser Version deaktiviert/);
    expect(screen.getByRole("link", { name: /per Feedback/i })).toHaveAttribute(
      "href",
      "/feedback",
    );
    expect(screen.queryByRole("link", { name: /per E-Mail/i })).toBeNull();
  });
});
