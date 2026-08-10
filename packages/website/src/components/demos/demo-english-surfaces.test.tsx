import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DemoLocaleProvider } from "./demo-locale";
import ExcelDemo from "./excel-demo";
import WordDemo from "./word-demo";
import OutboundWorkflowDemo from "./outbound-workflow-demo";
import RagVertragsassistentDemo from "./rag-vertragsassistent-demo";
import MaturityDemo from "@/components/ai-native/demos/maturity-demo";

function renderEnglish(node: React.ReactNode) {
  return render(<DemoLocaleProvider locale="en">{node}</DemoLocaleProvider>);
}

describe("English demo surfaces", () => {
  it("renders the maturity assessment in English without unsupported benchmark claims", () => {
    const { container } = renderEnglish(<MaturityDemo />);

    expect(
      screen.getByRole("region", { name: "AI maturity self-assessment" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "How does your organization currently manage company data?",
      ),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(
      /Reifegrad|Unternehmen|Frage|Top 8|deutschen Mittelstands/,
    );
  });

  it("switches the spreadsheet analysis and exposes the deterministic output", () => {
    renderEnglish(<ExcelDemo />);

    expect(
      screen.getByRole("region", { name: "Spreadsheet analysis example" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Revenue by region/ }));
    expect(screen.getByText(/West · €2,740,250/)).toBeInTheDocument();
    expect(screen.queryByText("Aufgabe an Claude")).not.toBeInTheDocument();
  });

  it("builds an English document sample while keeping approval pending", () => {
    renderEnglish(<WordDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Build sample brief" }));
    expect(screen.getByText("APPROVAL PENDING")).toBeInTheDocument();
    expect(
      screen.getByText(/It is an assumption, not an approval/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Projektbrief erstellen"),
    ).not.toBeInTheDocument();
  });

  it("changes the fictional outbound draft and reveals pre-send controls", () => {
    renderEnglish(<OutboundWorkflowDemo />);

    fireEvent.click(
      screen.getByRole("button", { name: /Sample Contact Beta/ }),
    );
    expect(
      screen.getByText(/Support workload: one follow-up question/),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Show pre-send controls" }),
    );
    expect(screen.getByText(/Document the lawful basis/)).toBeInTheDocument();
    expect(screen.getByText("NOT SENT")).toBeInTheDocument();
  });

  it("returns sourced contract copy and an explicit no-match state", () => {
    renderEnglish(<RagVertragsassistentDemo />);

    fireEvent.click(
      screen.getByRole("button", { name: "What liability cap applies?" }),
    );
    expect(screen.getByText(/three times the annual fee/)).toBeInTheDocument();
    expect(screen.getByText("§14 Liability")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Run no-match case" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No supporting clause found",
    );
  });
});
