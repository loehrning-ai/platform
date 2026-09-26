import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  TECHNICAL_COURSE_LEDGER_LINK_CLASS,
  TECHNICAL_COURSE_PRIMARY_ACTION_CLASS,
  TECHNICAL_COURSE_SECONDARY_ACTION_CLASS,
  TechnicalCourseFrame,
  TechnicalCourseHeader,
  TechnicalCourseSectionHeading,
} from "./technical-course-landing";

describe("TechnicalCourseLanding", () => {
  it("renders a compact semantic header with one primary action and flat facts", () => {
    render(
      <TechnicalCourseFrame courseId="test-course" lang="en">
        <TechnicalCourseHeader
          eyebrow="Technical course"
          title="Make one bounded decision."
          intro="Use the evidence, then inspect the result."
          primaryAction={<a href="/lesson-01">Start lesson 01</a>}
          secondaryAction={<a href="#map">View course map</a>}
          facts={["8 lessons", "45 minutes"]}
          factsLabel="Course facts"
          progress={<div role="progressbar" aria-label="Course progress" />}
        />
        <TechnicalCourseSectionHeading
          id="map-heading"
          headingId="map-title"
          eyebrow="Course map"
          title="Eight decisions"
        />
      </TechnicalCourseFrame>,
    );

    const frame = document.querySelector(
      '[data-technical-course="test-course"]',
    );
    expect(frame).toHaveAttribute("lang", "en");
    expect(
      frame?.querySelector("[data-technical-course-header]"),
    ).not.toHaveClass("border", "overflow-hidden");
    const header = frame?.querySelector("[data-technical-course-header]");
    expect(header?.className).not.toMatch(/bg-kupfer-mist|border-2|shadow|rounded/);
    expect(screen.getByText("Technical course")).toHaveClass("text-label");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Make one bounded decision.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start lesson 01" }),
    ).toHaveAttribute("href", "/lesson-01");
    expect(
      screen.getByRole("link", { name: "View course map" }),
    ).toHaveAttribute("href", "#map");
    const facts = screen.getByRole("complementary", { name: "Course facts" });
    expect(within(facts).getByText("Course facts")).toBeVisible();
    expect(within(facts).getAllByRole("listitem")).toHaveLength(2);
    expect(
      facts.querySelector("[data-course-onboarding-checklist]"),
    ).not.toBeNull();
    expect(
      facts.querySelector("[data-course-progress-card]"),
    ).toContainElement(
      screen.getByRole("progressbar", { name: "Course progress" }),
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Eight decisions" }),
    ).toHaveAttribute("id", "map-title");
    const sectionHeading = document.querySelector(
      "[data-technical-section-heading]",
    );
    expect(sectionHeading).toHaveClass("border-t-2", "border-foreground");
    expect(sectionHeading?.innerHTML).not.toMatch(/uppercase|font-mono|bg-brand-orange/);
  });

  it("drops legal-document section marks from labels", () => {
    render(
      <TechnicalCourseHeader
        eyebrow="§ Kurs · Grundlagen"
        title="Titel"
        intro="Intro"
        primaryAction={<a href="/a">Start</a>}
        facts={["5 Blöcke"]}
        factsLabel="§ Kursrahmen"
      />,
    );
    expect(screen.getByText("Kurs · Grundlagen")).toBeInTheDocument();
    expect(screen.queryByText(/§/)).toBeNull();
  });

  it("locks the shared action and ledger classes to the target-size and flat-motion contract", () => {
    expect(TECHNICAL_COURSE_PRIMARY_ACTION_CLASS).toContain("min-h-12");
    expect(TECHNICAL_COURSE_PRIMARY_ACTION_CLASS).toContain("bg-brand-orange");
    expect(TECHNICAL_COURSE_PRIMARY_ACTION_CLASS).toContain("text-paper");
    expect(TECHNICAL_COURSE_PRIMARY_ACTION_CLASS).not.toContain("text-white");
    expect(TECHNICAL_COURSE_SECONDARY_ACTION_CLASS).toContain("min-h-12");
    expect(TECHNICAL_COURSE_LEDGER_LINK_CLASS).toContain("min-h-14");

    for (const className of [
      TECHNICAL_COURSE_PRIMARY_ACTION_CLASS,
      TECHNICAL_COURSE_SECONDARY_ACTION_CLASS,
      TECHNICAL_COURSE_LEDGER_LINK_CLASS,
    ]) {
      expect(className).not.toMatch(/shadow|translate|transition-all/);
      expect(className).not.toMatch(/\brounded(?:-|\b)/);
      expect(className).toContain("motion-reduce:transition-none");
      expect(className).not.toMatch(/\buppercase\b|font-mono|border-2/);
    }
  });
});
