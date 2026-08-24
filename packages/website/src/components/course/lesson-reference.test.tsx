import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LessonReference } from "./lesson-reference";

describe("LessonReference", () => {
  it("uses a closed native details element while keeping content in the document", () => {
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
    expect(details).not.toHaveAttribute("open");
    expect(screen.getByText("Lesson reference")).toBeInTheDocument();
    expect(screen.getByText("Evidence before automation")).toBeInTheDocument();
    expect(
      screen.getByText("Separate claims from verified observations."),
    ).toBeInTheDocument();
    expect(screen.getByText("Open reference")).toBeInTheDocument();
    expect(screen.getByText("Authored lesson evidence")).toBeInTheDocument();
  });

  it("stays closed with German labels and omits an empty objective", () => {
    const { container } = render(
      <LessonReference locale="de" title="Belege vor Automatisierung">
        <p>Autorisierter Lektionstext</p>
      </LessonReference>,
    );

    expect(
      container.querySelector("details[data-lesson-reference]"),
    ).not.toHaveAttribute("open");
    expect(screen.getByText("Lektionsreferenz")).toBeInTheDocument();
    expect(screen.getByText("Belege vor Automatisierung")).toBeInTheDocument();
    expect(screen.getByText("Referenz öffnen")).toBeInTheDocument();
    expect(screen.getByText("Autorisierter Lektionstext")).toBeInTheDocument();
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
    const content = container.querySelector(
      "[data-lesson-reference-content]",
    );

    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(content).toHaveClass("[&_h1]:hidden");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Evidence before automation",
    );

    details.open = true;

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
  });
});
