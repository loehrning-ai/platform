import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LessonReference } from "./lesson-reference";

describe("LessonReference", () => {
  it("renders the lesson open in a native details element so the text is the first thing a reader sees", () => {
    const { container } = render(
      <LessonReference
        locale="en"
        title="Evidence before automation"
        objective="Separate claims from verified observations."
      >
        <p>Authored lesson evidence</p>
      </LessonReference>,
    );

    const details = container.querySelector("details[data-lesson-reference]");
    expect(details).toHaveAttribute("open");
    expect(details?.className).not.toMatch(/border-l-|bg-brand-orange|uppercase|font-mono/);
    expect(details?.querySelector("summary")).toHaveClass("grid-cols-1");
    expect(details?.querySelector("summary")).toHaveClass(
      "sm:grid-cols-[minmax(0,1fr)_auto]",
    );
    expect(screen.getByText("Lesson")).toHaveClass("text-label");
    expect(screen.getByText("Evidence before automation")).toBeInTheDocument();
    expect(
      screen.getByText("Separate claims from verified observations."),
    ).toBeInTheDocument();
    expect(screen.getByText("Collapse")).toBeInTheDocument();
    expect(screen.getByText("Expand")).toBeInTheDocument();
    expect(screen.getByText("Authored lesson evidence")).toBeInTheDocument();
  });

  it("uses German labels, starts open and omits an empty objective", () => {
    const { container } = render(
      <LessonReference locale="de" title="Belege vor Automatisierung">
        <p>Autorisierter Lektionstext</p>
      </LessonReference>,
    );

    expect(
      container.querySelector("details[data-lesson-reference]"),
    ).toHaveAttribute("open");
    expect(screen.getByText("Lektion")).toBeInTheDocument();
    expect(screen.getByText("Belege vor Automatisierung")).toBeInTheDocument();
    expect(screen.getByText("Einklappen")).toBeInTheDocument();
    expect(screen.getByText("Autorisierter Lektionstext")).toBeInTheDocument();
  });

  it("carries the course position in the kicker so readers need no own eyebrow", () => {
    render(
      <LessonReference
        locale="de"
        title="Belege vor Automatisierung"
        position="Lektion 2 von 12"
      >
        <p>Text</p>
      </LessonReference>,
    );

    const kicker = screen.getByText("Lektion 2 von 12");
    expect(kicker).toHaveClass("text-label", "text-muted-foreground", "tabular-nums");
    expect(kicker.className).not.toMatch(/uppercase|font-mono|text-brand-orange/);
    expect(screen.queryByText("Lektion")).not.toBeInTheDocument();
  });

  it("keeps exactly one accessible level-one heading when closed or open", () => {
    const { container } = render(
      <>
        <style>{`[data-lesson-reference-content] h1 { display: none; }`}</style>
        <LessonReference
          locale="en"
          title="Evidence before automation"
          objective="Separate claims from verified observations."
        >
          <h1>Duplicate reader title</h1>
          <p>Authored lesson evidence</p>
        </LessonReference>
      </>,
    );

    const details = container.querySelector(
      "details[data-lesson-reference]",
    ) as HTMLDetailsElement;
    const content = container.querySelector("[data-lesson-reference-content]");

    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(content).toHaveClass("[&_h1]:hidden");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Evidence before automation",
    );

    details.open = false;
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    details.open = true;

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
  });
});
