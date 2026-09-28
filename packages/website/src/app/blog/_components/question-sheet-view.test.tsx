import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  parseQuestionSheet,
  type SheetLocale,
} from "@/lib/vorlagen/question-sheet";
import { QuestionSheetView } from "./question-sheet-view";
import { NBSP, keepLegalRefsTogether } from "./legal-text";

const FILES: Record<SheetLocale, string> = {
  de: "ki-in-der-ausbildung-fragen.md",
  en: "en/ki-in-der-ausbildung-fragen.md",
};

function sheetFor(locale: SheetLocale) {
  const raw = readFileSync(
    join(process.cwd(), "content", "vorlagen", FILES[locale]),
    "utf8",
  );
  return parseQuestionSheet(raw, locale);
}

afterEach(cleanup);

describe("QuestionSheetView", () => {
  it("renders one H5 per question inside an anchored list item", () => {
    const sheet = sheetFor("de");
    render(<QuestionSheetView sheet={sheet} locale="de" />);

    const questions = screen.getAllByRole("heading", { level: 5 });
    expect(questions).toHaveLength(sheet.questionCount);
    for (let n = 1; n <= sheet.questionCount; n += 1) {
      const item = document.getElementById(`frage-${n}`);
      expect(item, `#frage-${n}`).not.toBeNull();
      expect(item?.tagName).toBe("LI");
      expect(item?.querySelectorAll("h5")).toHaveLength(1);
      // The number square is visible text inside the heading, so heading
      // navigation announces the number the exercise and the print refer to.
      const heading = item!.querySelector("h5")!;
      const number = heading.querySelector(".wz-q__num");
      expect(number).not.toBeNull();
      expect(number).not.toHaveAttribute("aria-hidden");
      expect(number?.textContent?.replace(/\s+/g, " ")).toBe(`Frage ${n}`);
      expect(number?.querySelector(".sr-only")).toHaveTextContent("Frage");
      const question = sheet.groups
        .flatMap((group) => group.questions)
        .find((entry) => entry.number === n)!;
      expect(
        within(item!).getByRole("heading", { level: 5 }),
      ).toHaveAccessibleName(`Frage ${n} ${question.text}`);
    }
  });

  it("shows the usage heading on screen and on paper", () => {
    const sheet = sheetFor("de");
    render(<QuestionSheetView sheet={sheet} locale="de" />);

    const heading = screen.getByRole("heading", {
      level: 4,
      name: "So setzt ihr die Liste ein",
    });
    expect(heading).not.toHaveClass("sr-only");
    expect(heading).toHaveClass("wz-steps__title");
    const steps = heading.closest("section")?.querySelectorAll(".wz-steps li");
    expect(steps).toHaveLength(sheet.usage.steps.length);
  });

  it("keeps the colon of the answer label so the lowercase answer reads as its continuation", () => {
    const sheet = sheetFor("de");
    render(<QuestionSheetView sheet={sheet} locale="de" />);

    expect(screen.getAllByText("Die Antwort sollte enthalten:")).toHaveLength(
      sheet.questionCount,
    );
    const answer = document.querySelector("#frage-3 .wz-q__answer");
    expect(answer?.textContent).toMatch(/^Die Antwort sollte enthalten: \S/);
  });

  it("uses the heading order H3 sheet, H4 groups, H5 questions", () => {
    const sheet = sheetFor("de");
    render(<QuestionSheetView sheet={sheet} locale="de" />);

    expect(
      screen.getByRole("heading", { level: 3, name: sheet.meta.title }),
    ).toBeInTheDocument();
    for (const group of sheet.groups) {
      const heading = screen.getByRole("heading", { level: 4, name: group.title });
      const section = heading.closest("section");
      expect(section).toHaveAttribute("aria-labelledby", heading.id);
      const list = section?.querySelector("ol");
      expect(list).toHaveAttribute("start", String(group.questions[0]!.number));
      expect(list).toHaveAttribute("role", "list");
    }
    expect(screen.getByRole("article")).toHaveAttribute(
      "aria-labelledby",
      screen.getByRole("heading", { level: 3 }).id,
    );
  });

  it("marks open legal points and notes with their kind", () => {
    const sheet = sheetFor("de");
    render(<QuestionSheetView sheet={sheet} locale="de" />);

    const withOpen = sheet.groups
      .flatMap((group) => group.questions)
      .filter((question) => question.open);
    expect(withOpen.length).toBeGreaterThan(0);
    const openAsides = document.querySelectorAll('[data-kind="open"]');
    expect(openAsides).toHaveLength(withOpen.length);
    for (const aside of openAsides) {
      expect(aside).toHaveClass("wz-q__aside--open");
      expect(aside).toHaveTextContent(/^Offen\./);
    }
    const second = within(document.getElementById("frage-2")!);
    expect(second.getByText(/Offen\./).closest("[data-kind]")).toHaveAttribute(
      "data-kind",
      "open",
    );
    expect(document.querySelectorAll('[data-kind="note"]').length).toBe(
      sheet.groups.flatMap((group) => group.questions).filter((q) => q.note).length,
    );
  });

  it("keeps legal references on one line with a no-break space after §", () => {
    const sheet = sheetFor("de");
    render(<QuestionSheetView sheet={sheet} locale="de" />);

    const basis = document.querySelector("#frage-1 .wz-q__basis p");
    expect(basis?.textContent).toContain(`§${NBSP}90`);
    expect(basis?.textContent).toContain(`Abs.${NBSP}1`);
    expect(basis?.textContent).not.toMatch(/§ \d/);
  });

  it("renders the English sheet with English labels only", () => {
    const sheet = sheetFor("en");
    render(<QuestionSheetView sheet={sheet} locale="en" />);

    expect(screen.getAllByText("Legal basis")).toHaveLength(sheet.questionCount);
    expect(screen.getAllByText("The answer should contain:")).toHaveLength(
      sheet.questionCount,
    );
    expect(document.body).not.toHaveTextContent("Rechtsgrundlage");
    expect(document.body).toHaveTextContent("Last editorial review: 27 September 2026.");
    const basis = document.querySelector("#frage-1 .wz-q__basis p");
    expect(basis?.textContent).toContain(`Section${NBSP}90(1)`);
    expect(
      screen.getByRole("heading", { level: 5, name: /^Question 12 / }),
    ).toBeInTheDocument();
  });

  it("marks the German terms of the English sheet with lang=de", () => {
    const sheet = sheetFor("en");
    render(<QuestionSheetView sheet={sheet} locale="en" />);

    const german = [...document.querySelectorAll('[lang="de"]')].map(
      (node) => node.textContent,
    );
    expect(german).toEqual(
      expect.arrayContaining([
        "Jugend- und Auszubildendenvertretung",
        "Bundesarbeitsgericht",
        "Berichtsheft",
      ]),
    );
    expect(
      document.querySelector("#frage-12 h5 [lang='de']"),
    ).toHaveTextContent("Berichtsheft");
  });

  it("tags no German terms in the German sheet", () => {
    render(<QuestionSheetView sheet={sheetFor("de")} locale="de" />);
    expect(document.querySelector("[lang]")).toBeNull();
  });

  it("links only bare https URLs and renders no raw HTML", () => {
    const sheet = sheetFor("de");
    const hostile = {
      ...sheet,
      intro: ['<img src=x onerror="alert(1)"> siehe https://loehrning.ai/blog.'],
    };
    render(<QuestionSheetView sheet={hostile} locale="de" />);

    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByText(/<img src=x/)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "https://loehrning.ai/blog" });
    expect(link).toHaveAttribute("href", "https://loehrning.ai/blog");
    // The status line links the attribution URL.
    const attribution = screen.getByRole("link", {
      name: "https://loehrning.ai/blog/ki-in-der-ausbildung",
    });
    expect(attribution).toHaveAttribute(
      "href",
      "https://loehrning.ai/blog/ki-in-der-ausbildung",
    );
  });

  it("lets a URL wrap only after a slash, never at a hyphen", () => {
    render(<QuestionSheetView sheet={sheetFor("de")} locale="de" />);

    const link = screen.getByRole("link", {
      name: "https://loehrning.ai/blog/ki-in-der-ausbildung",
    });
    const parts = [...link.querySelectorAll(".wz-url__part")].map(
      (part) => part.textContent,
    );
    expect(parts).toEqual(["https://loehrning.ai/", "blog/", "ki-in-der-ausbildung"]);
    expect(link.querySelectorAll("wbr")).toHaveLength(parts.length - 1);
    // The licence line repeats the URL as text with the same break points.
    const licence = document.querySelector(".wz-sheet__licence");
    expect(licence).toHaveTextContent(
      "CC BY 4.0 · loehrning.ai, Tim Löhr, https://loehrning.ai/blog/ki-in-der-ausbildung",
    );
    expect(licence?.querySelectorAll(".wz-url__part")).toHaveLength(3);
  });

  it("prints the sources that the screen hides", () => {
    const sheet = sheetFor("de");
    render(<QuestionSheetView sheet={sheet} locale="de" />);

    const sources = document.querySelector(".wz-sheet__sources");
    for (const source of sheet.meta.sources) {
      expect(sources).toHaveTextContent(`${source.title}: ${source.url}`);
    }
  });
});

describe("keepLegalRefsTogether", () => {
  it("binds markers to their numbers and days to their months", () => {
    expect(keepLegalRefsTogether("§ 13 S. 2 Nr. 7 BBiG")).toBe(
      `§${NBSP}13 S.${NBSP}2 Nr.${NBSP}7 BBiG`,
    );
    expect(keepLegalRefsTogether("§§ 96 bis 98")).toBe(`§§${NBSP}96 bis 98`);
    expect(keepLegalRefsTogether("Art. 5 Abs. 1 lit. c DSGVO")).toBe(
      `Art.${NBSP}5 Abs.${NBSP}1 lit.${NBSP}c DSGVO`,
    );
    expect(keepLegalRefsTogether("Anhang III Nr. 4 KI-VO")).toBe(
      `Anhang${NBSP}III Nr.${NBSP}4 KI-VO`,
    );
    expect(keepLegalRefsTogether("Section 90(1) no. 3 and Annex III point 4")).toBe(
      `Section${NBSP}90(1) no.${NBSP}3 and Annex${NBSP}III point${NBSP}4`,
    );
    expect(keepLegalRefsTogether("seit 2. Februar 2025")).toBe(
      `seit 2.${NBSP}Februar${NBSP}2025`,
    );
    expect(keepLegalRefsTogether("from 2 December 2027")).toBe(
      `from 2${NBSP}December${NBSP}2027`,
    );
  });

  it("keeps day, month and year together so a range breaks only around its joiner", () => {
    expect(keepLegalRefsTogether("30. November 2026")).toBe(
      `30.${NBSP}November${NBSP}2026`,
    );
    expect(
      keepLegalRefsTogether("1. Oktober 2026 bis 30. November 2026"),
    ).toBe(`1.${NBSP}Oktober${NBSP}2026 bis 30.${NBSP}November${NBSP}2026`);
    expect(keepLegalRefsTogether("1 October 2026 to 30 November 2026")).toBe(
      `1${NBSP}October${NBSP}2026 to 30${NBSP}November${NBSP}2026`,
    );
    expect(keepLegalRefsTogether("Stand September 2026")).toBe(
      `Stand September${NBSP}2026`,
    );
  });

  it("leaves ordinary words breakable", () => {
    expect(keepLegalRefsTogether("the point of view")).toBe("the point of view");
    expect(keepLegalRefsTogether("Artikel und Absatz")).toBe("Artikel und Absatz");
    expect(keepLegalRefsTogether("Section on AI")).toBe("Section on AI");
    expect(keepLegalRefsTogether("the May 20260 build")).toBe("the May 20260 build");
    expect(keepLegalRefsTogether("Novembers 2026")).toBe("Novembers 2026");
  });
});
