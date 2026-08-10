import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ClaudeWidgetLocaleProvider } from "./locale-context";
import { RunConsole } from "./_run-console";

afterEach(cleanup);

describe("Claude course local simulation disclosure", () => {
  it.each([
    ["en", "Local simulation", "fixed rules, no API call"],
    ["de", "Lokale Simulation", "feste Regeln, kein API-Aufruf"],
  ] as const)(
    "labels the %s output as local and rule-based",
    (locale, label, disclosure) => {
      render(
        <ClaudeWidgetLocaleProvider locale={locale}>
          <RunConsole loading={false} output="Example output" />
        </ClaudeWidgetLocaleProvider>,
      );

      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(disclosure, "i"))).toBeInTheDocument();
    },
  );
});
