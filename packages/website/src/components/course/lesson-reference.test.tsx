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

    const block = container.querySelector("[data-lesson-reference-block]");
    expect(block).toHaveClass("border-t-2", "border-foreground");
    expect(block?.className).not.toMatch(
      /border-l-|bg-brand-orange|uppercase|font-mono/,
    );
    const details = container.querySelector("details[data-lesson-reference]");
    expect(details).toHaveAttribute("open");
    expect(block).toContainElement(details as HTMLElement);
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
    expect(kicker).toHaveClass(
      "text-label",
      "text-muted-foreground",
      "tabular-nums",
    );
    expect(kicker.className).not.toMatch(
      /uppercase|font-mono|text-brand-orange/,
    );
    expect(screen.queryByText("Lektion")).not.toBeInTheDocument();
  });

  it("keeps the heading and objective out of the disclosure so the toggle has a short name", () => {
    const { container } = render(
      <LessonReference
        locale="de"
        title="Belege vor Automatisierung"
        objective="Behauptungen von geprüften Beobachtungen trennen."
      >
        <p>Text</p>
      </LessonReference>,
    );

    const summary = container.querySelector(
      "details[data-lesson-reference] > summary",
    ) as HTMLElement;
    expect(summary).not.toBeNull();
    expect(summary.querySelector('[role="heading"]')).toBeNull();
    expect(summary).not.toHaveTextContent("Belege vor Automatisierung");
    expect(summary).not.toHaveTextContent("Behauptungen");
    expect(summary).toHaveClass("min-h-11");
    // Only the visible verb for the current state plus its context.
    expect(summary.querySelector(".sr-only")).toHaveTextContent("Lektionstext");

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Belege vor Automatisierung",
    });
    expect(heading.closest("details")).toBeNull();
    expect(heading).toHaveClass("text-fluid-h2", "font-bold");
    expect(
      screen
        .getByText("Behauptungen von geprüften Beobachtungen trennen.")
        .closest("details"),
    ).toBeNull();
  });

  it("hides the chapter's own eyebrow and meta row so only the head names the lesson", () => {
    const { container } = render(
      <LessonReference locale="de" title="Datenbereinigung">
        <p>Text</p>
      </LessonReference>,
    );
    expect(
      container.querySelector("[data-lesson-reference-content]"),
    ).toHaveClass(
      "[&_h1]:hidden",
      "[&_.hero-eyebrow]:hidden!",
      "[&_.hero-meta]:hidden!",
    );
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

  it("reduces the head to screen-reader text on phones below a mission", () => {
    const { container } = render(
      <LessonReference
        locale="de"
        title="Was Claude tatsächlich ist"
        objective="Kontext statt Gedächtnis."
        position="Lektion 1 von 12"
        objectiveRepeatedAbove
      >
        <p className="lesson-head-position">Lektion 1 von 12</p>
        <p>Lektionstext</p>
      </LessonReference>,
    );

    // Still the page's level-one heading, visible from sm.
    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Was Claude tatsächlich ist",
    });
    expect(container.querySelector("[data-lesson-reference-head]")).toHaveClass(
      "sr-only",
      "sm:not-sr-only",
    );
    expect(heading.closest("[data-lesson-reference-head]")).not.toBeNull();
    expect(container.querySelector("summary")).toHaveClass("max-sm:hidden");
    expect(container.querySelector("details")).toHaveAttribute("open");
    const content = container.querySelector("[data-lesson-reference-content]");
    expect(content?.className).toContain(
      "max-sm:[&_.lesson-head-position]:hidden!",
    );
  });

  it("keeps the full head on phones without a mission above", () => {
    const { container } = render(
      <LessonReference locale="en" title="Evidence before automation">
        <p>Text</p>
      </LessonReference>,
    );
    expect(
      container.querySelector("[data-lesson-reference-head]"),
    ).not.toHaveClass("sr-only");
    expect(container.querySelector("summary")).not.toHaveClass("max-sm:hidden");
  });
});
