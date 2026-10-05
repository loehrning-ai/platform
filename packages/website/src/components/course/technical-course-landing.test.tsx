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
    // The landmark carries the name; the visible label is gone at every width.
    expect(within(facts).getByText("Course facts")).toHaveClass("sr-only");
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

  it("renders the facts as one line under the actions, with separators that never end a line", () => {
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
    // No hairline, rule or box inside a band (SPEC §3.1): the facts are one
    // plain line at 14px on a phone (the caps line's size) and 17px from lg.
    expect(facts.className).not.toMatch(/border/);
    expect(within(facts).getByText("Auf einen Blick")).toHaveClass("sr-only");
    const list = facts.querySelector("[data-course-onboarding-checklist]");
    expect(list).toHaveClass("flex", "flex-wrap", "text-[0.875rem]/[1.5]", "lg:text-[1.0625rem]/[1.5]");
    // Items are one separator width apart and each "·" hangs in the gap
    // before its item, outside the item's box. The list fills its clipping
    // box exactly (no negative margin, so no box leaves the column): the
    // separator of the first item on every line falls left of the box and
    // is cut off, and a wrapped line never starts or ends with a lone "·".
    expect(list).toHaveClass("gap-x-[1.25em]");
    expect(list?.className).not.toMatch(/(?:^|\s)-m[lxs]?-/);
    expect(list?.parentElement).toHaveClass("overflow-hidden");
    const rows = within(facts).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row).toHaveClass(
        "relative",
        "before:absolute",
        "before:right-full",
        "before:w-[1.25em]",
        "before:content-['·'_/_'']",
      );
      expect(row.className).not.toMatch(/after:content/);
    }
    // The band's one body size: a 17px lead at every width (SPEC §3.1).
    expect(screen.getByText("Intro")).toHaveClass("text-[1.0625rem]/[1.5]");
  });

  it("renders the header as a full-bleed band in the course's track scene", () => {
    const { container } = render(
      <TechnicalCourseFrame courseId="ai-native-operator" lang="de">
        <>
          <TechnicalCourseHeader
            eyebrow="The AI-Native Operator · Visuelles Lernen"
            title={
              <>
                KI-Arbeit mit klarer <span className="sm:inline-block">Zuständigkeit führen.</span>
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
    const frame = container.querySelector(
      '[data-technical-course="ai-native-operator"]',
    );
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
    // The caps line is one line: each "·" part is an item that carries its
    // separator, and a part that does not fit is clipped whole. The first
    // part never wraps; a later part may wrap only inside its own hidden
    // row, so no part runs past the column.
    const caps = header?.querySelector(".plakat-caps");
    expect(caps).toHaveClass("max-h-[1.3em]", "overflow-hidden");
    const capsParts = Array.from(caps?.querySelectorAll("span > span") ?? []);
    expect(capsParts.map((part) => part.textContent)).toEqual([
      "The AI-Native Operator",
      "\u00a0· Visuelles Lernen",
    ]);
    expect(capsParts[0]).toHaveClass("whitespace-nowrap");
    expect(capsParts[1]).toHaveClass("min-w-0", "break-words");
    expect(capsParts[1]).not.toHaveClass("whitespace-nowrap");
    // The course poster, from lg only, aria-hidden and without a numeral
    // (visual-learning courses carry none, D9); never an <img>. As on the workshop
    // bands (SPEC §3.1) it fills the band's right edge at full height,
    // behind the text column, so its shapes bleed off real band edges.
    const art = header?.querySelector("[data-plakat-art]");
    expect(art).toHaveAttribute("aria-hidden", "true");
    expect(art).toHaveClass("hidden", "lg:block", "absolute", "inset-y-0", "right-0", "-z-10");
    expect(header).toHaveClass("relative", "isolate");
    expect(frame).toHaveClass("@container");
    // The text column keeps 3rem clear of the art.
    expect(title.closest("[data-plakat-band] > div")?.className).toMatch(/lg:pr-\[max\(0px,calc\(min\(36cqw,30rem\)/);
    // The secondary action in a band is the scene secondary (SPEC §3.8).
    const actions = header?.querySelector("[data-course-entry-actions]");
    expect(actions).toHaveClass("[&>*+*]:border-2", "[&>*+*]:border-scene-ink", "[&>*+*]:hover:bg-scene-ink", "[&>*+*]:hover:text-scene-ground");
    expect(art?.querySelector("svg[data-poster='idea']")).not.toBeNull();
    expect(art?.querySelector("[data-poster-numeral-text]")).toBeNull();
    expect(header?.querySelector("img")).toBeNull();
    // No caption or label sizes in the band beyond the lg facts label.
    expect(header?.querySelectorAll(".text-caption")).toHaveLength(0);
    expectCapsInsideScene(container);
    expectNoMennigeInScene(container);
  });

  it("puts the Grundlagenpfad numeral and people picture on the Lemons band and keeps unscened frames paper", () => {
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
    // The course's people picture replaces the poster shapes: one decorative
    // picture for both layouts, no poster art and no second copy.
    expect(container.querySelector("[data-plakat-art]")).toBeNull();
    expect(container.querySelector("[data-plakat-art-phone]")).toBeNull();
    expect(container.querySelector("svg[data-poster]")).toBeNull();
    const art = container.querySelector("[data-course-picture-art]");
    expect(art).toHaveAttribute("aria-hidden", "true");
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(1);
    expect(decodeURIComponent(images[0].getAttribute("src") ?? "")).toContain(
      "/course-covers/ki-fuehrerschein-cover-v4.webp",
    );
    expect(images[0]).toHaveAttribute("alt", "");
    expect(images[0]).toHaveClass("object-cover");
    // The picture sits in a Butter frame (the scene ink) over a Mennige
    // offset plate (the scene mid, a shape): 16:9 below lg, 16:10 from lg.
    const pictureFrame = images[0].parentElement;
    expect(pictureFrame).toHaveClass("aspect-[16/9]", "lg:aspect-[16/10]", "border-scene-ink", "overflow-hidden");
    expect(pictureFrame?.previousElementSibling).toHaveClass("bg-scene-mid");
    // The numeral is Butter on the band ground at every width: a tab cut
    // into the picture's corner below lg, the poster numeral above it from
    // lg, where the art is the text column's grid neighbour inside the
    // 72rem track (nothing bleeds, nothing is clipped).
    const numeral = container.querySelector("[data-course-picture-numeral]");
    expect(numeral).toHaveTextContent("01");
    expect(numeral).toHaveClass("text-scene-ink", "bg-scene-ground", "lg:static", "lg:bg-transparent");
    const column = art?.parentElement;
    expect(column).toHaveClass("col-start-2", "lg:grid");
    expect(column?.className).not.toMatch(/lg:pr-\[max/);
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
    expect(frame?.querySelector("[data-plakat-art-phone]")).toBeNull();
  });

  it("shows a two-digit lesson number on phones and the full label from sm", () => {
    render(<TechnicalCourseLessonNumber label="Lektion 3" number={3} />);
    expect(screen.getByText("03")).toHaveClass("sm:hidden");
    expect(screen.getByText("03")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Lektion 3")).toHaveClass("max-sm:sr-only");
    expect(TECHNICAL_COURSE_LESSON_ROW_COLUMNS).toContain("grid-cols-[2rem_minmax(0,1fr)_1rem]");
    expect(TECHNICAL_COURSE_LESSON_ROW_COLUMNS).toContain("sm:grid-cols-[4.75rem_minmax(0,1fr)_1rem]");
  });

  it("sets the same '·' separator in every band caps line", () => {
    const { container } = render(
      <TechnicalCourseHeader
        courseId="data-infrastructure"
        eyebrow="Data Infrastructure / Kurs"
        title="Titel"
        intro="Intro"
        primaryAction={<a href="/a">Start</a>}
        facts={["12 Lektionen"]}
        factsLabel="Kursdaten"
      />,
    );
    const caps = container.querySelector(".plakat-caps");
    expect(caps?.textContent).toBe("Data Infrastructure\u00a0· Kurs");
    expect(caps?.textContent).not.toContain("/");
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
