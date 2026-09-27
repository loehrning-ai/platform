import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectCapsInsideScene, expectNoMennigeInScene } from "@/test/plakat-scene";
import {
  TECHNICAL_COURSE_LEDGER_LINK_CLASS,
  TECHNICAL_COURSE_LESSON_ROW_COLUMNS,
  TECHNICAL_COURSE_PRIMARY_ACTION_CLASS,
  TECHNICAL_COURSE_SECONDARY_ACTION_CLASS,
  TechnicalCourseFrame,
  TechnicalCourseHeader,
  TechnicalCourseLessonNumber,
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
    // The Kopflinie takes the page's scene line (Druckschwarz on paper).
    expect(sectionHeading).toHaveClass("border-t-2", "border-scene-line");
    expect(sectionHeading?.innerHTML).not.toMatch(/uppercase|font-mono|bg-brand-orange/);
  });

  it("places an optional drawing under the facts", () => {
    render(
      <TechnicalCourseHeader
        eyebrow="Kurs"
        title="Titel"
        intro="Intro"
        primaryAction={<a href="/a">Start</a>}
        facts={["12 Kapitel"]}
        factsLabel="Auf einen Blick"
        figure={<figure aria-label="Arbeitszyklus" />}
      />,
    );
    const facts = screen.getByRole("complementary", { name: "Auf einen Blick" });
    expect(within(facts).getByRole("figure", { name: "Arbeitszyklus" })).toBeInTheDocument();
  });

  it("renders the facts as one wrapping caption line below lg and the ruled column from lg", () => {
    render(
      <TechnicalCourseHeader
        eyebrow="Kurs"
        title="Titel"
        intro="Intro"
        primaryAction={<a href="/a">Start</a>}
        facts={["5 Blöcke, 18 Lektionen", "ca. 1 Std. 40 Min."]}
        factsLabel="Auf einen Blick"
      />,
    );
    const facts = screen.getByRole("complementary", { name: "Auf einen Blick" });
    // Inside the band the phone facts are one plain line with no hairline
    // (SPEC §3.1); from lg they keep the 2px ruled column.
    expect(facts).toHaveClass("border-t-2", "border-foreground", "max-lg:border-t-0");
    // The visible label repeats the landmark name, so it is visually hidden
    // below lg only.
    expect(within(facts).getByText("Auf einen Blick")).toHaveClass("max-lg:sr-only");
    const list = facts.querySelector("[data-course-onboarding-checklist]");
    expect(list).toHaveClass("max-lg:flex", "max-lg:flex-wrap");
    const rows = within(facts).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      // Desktop rows keep their hairline and 17px body; phones drop both.
      // Desktop rows keep their hairline and 17px body; phones drop both and
      // set the line at 14px, the caps line's size (SPEC §3.13).
      expect(row).toHaveClass("border-b", "py-2.5", "text-body", "max-lg:border-0", "max-lg:py-0", "max-lg:text-[0.875rem]");
    }
    // The band's one body size: a 17px lead at every width (SPEC §3.1).
    expect(screen.getByText("Intro")).toHaveClass("text-[1.0625rem]/[1.5]");
  });

  it("renders the header as a full-bleed band in the course's track scene", () => {
    const { container } = render(
      <TechnicalCourseFrame courseId="claude" lang="de">
        <>
          <TechnicalCourseHeader
            eyebrow="Claude Course · Technikkurs"
            title={
              <>
                Claude mit klarer <span className="sm:inline-block">Struktur einsetzen.</span>
              </>
            }
            intro="Intro"
            primaryAction={
              <a href="/a" className={TECHNICAL_COURSE_PRIMARY_ACTION_CLASS}>
                Start
              </a>
            }
            facts={["12 Lektionen"]}
            factsLabel="Kursdaten"
          />
        </>
        <TechnicalCourseSectionHeading title="Lektionen" />
      </TechnicalCourseFrame>,
    );
    const frame = container.querySelector('[data-technical-course="claude"]');
    // The page names its scene; the frame is a three-track grid with the
    // 72rem column in the middle (no viewport units, no negative margins).
    expect(frame).toHaveAttribute("data-plakat-page", "idea");
    expect(frame?.className).toContain("grid-cols-[minmax(1rem,1fr)_minmax(0,72rem)_minmax(1rem,1fr)]");
    expect(frame?.className).not.toMatch(/\b-mx-|\bw-screen\b|\d+vw/);

    const header = frame?.querySelector("[data-technical-course-header]");
    expect(header).toHaveAttribute("data-plakat-band", "");
    expect(header).toHaveClass("col-span-full", "grid-cols-subgrid");
    // One caps line, the poster title with its fit value, a 17px lead.
    expect(header?.querySelectorAll(".plakat-caps")).toHaveLength(1);
    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveClass("poster-title");
    expect(title.getAttribute("style")).toMatch(/--fit:\s*\d/);
    expect(title.parentElement).toHaveClass("@container");
    // The course poster, from lg only, aria-hidden and without a numeral
    // (Technikkurse carry none, D9); never an <img>.
    const art = header?.querySelector("[data-plakat-art]");
    expect(art).toHaveAttribute("aria-hidden", "true");
    expect(art).toHaveClass("hidden", "lg:block");
    expect(art?.querySelector("svg[data-poster='idea']")).not.toBeNull();
    expect(art?.querySelector("[data-poster-numeral-text]")).toBeNull();
    expect(header?.querySelector("img")).toBeNull();
    // No caption or label sizes in the band beyond the lg facts label.
    expect(header?.querySelectorAll(".text-caption")).toHaveLength(0);
    expectCapsInsideScene(container);
    expectNoMennigeInScene(container);
  });

  it("puts the Grundlagenpfad numeral on the Lemons band art and keeps unscened frames paper", () => {
    const { container, unmount } = render(
      <TechnicalCourseFrame courseId="ki-fuehrerschein">
        <TechnicalCourseHeader
          eyebrow="Kurs"
          title="Titel"
          intro="Intro"
          primaryAction={<a href="/a" className={TECHNICAL_COURSE_PRIMARY_ACTION_CLASS}>Start</a>}
          facts={["5 Blöcke"]}
          factsLabel="Auf einen Blick"
        />
      </TechnicalCourseFrame>,
    );
    expect(container.firstElementChild).toHaveAttribute("data-plakat-page", "lemons");
    expect(
      container.querySelector("[data-plakat-art] [data-poster-numeral-text]"),
    ).toHaveTextContent("01");
    expectNoMennigeInScene(container);
    unmount();

    const paper = render(
      <TechnicalCourseFrame courseId="ai-native-glossary">
        <TechnicalCourseHeader
          eyebrow="Glossar"
          title="Titel"
          intro="Intro"
          primaryAction={<a href="/a">Start</a>}
          facts={["40 Begriffe"]}
          factsLabel="Auf einen Blick"
        />
      </TechnicalCourseFrame>,
    );
    const frame = paper.container.firstElementChild;
    expect(frame).not.toHaveAttribute("data-plakat-page");
    // Without a scene there is no caps line and no poster.
    expect(frame?.querySelector(".plakat-caps")).toBeNull();
    expect(frame?.querySelector("[data-plakat-art]")).toBeNull();
  });

  it("shows a two-digit lesson number on phones and the full label from sm", () => {
    render(<TechnicalCourseLessonNumber label="Lektion 3" number={3} />);
    expect(screen.getByText("03")).toHaveClass("sm:hidden");
    expect(screen.getByText("03")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Lektion 3")).toHaveClass("max-sm:sr-only");
    expect(TECHNICAL_COURSE_LESSON_ROW_COLUMNS).toContain("grid-cols-[2rem_minmax(0,1fr)_1rem]");
    expect(TECHNICAL_COURSE_LESSON_ROW_COLUMNS).toContain("sm:grid-cols-[4.75rem_minmax(0,1fr)_1rem]");
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
    // The label is the ground (Kalkweiß on Mennige on paper, the ground on
    // the ink in a scene); never a fixed paper or white label (SPEC §3.8).
    expect(TECHNICAL_COURSE_PRIMARY_ACTION_CLASS).toContain("text-background");
    expect(TECHNICAL_COURSE_PRIMARY_ACTION_CLASS).not.toContain("text-paper");
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
