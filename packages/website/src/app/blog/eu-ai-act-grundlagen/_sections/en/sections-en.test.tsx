import type { ComponentType } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeineRechte } from "../deine-rechte";
import { Grundlagen } from "../grundlagen";
import { Hero } from "../hero";
import { Praxis } from "../praxis";
import { Quellen } from "../quellen";
import { Risikoklassen } from "../risikoklassen";
import { Stand2026 } from "../stand-2026";
import { Zeitplan } from "../zeitplan";
import { DeineRechteEn } from "./deine-rechte";
import { GrundlagenEn } from "./grundlagen";
import { HeroEn } from "./hero";
import { PraxisEn } from "./praxis";
import { QuellenEn } from "./quellen";
import { RisikoklassenEn } from "./risikoklassen";
import { Stand2026En } from "./stand-2026";
import { ZeitplanEn } from "./zeitplan";

vi.mock("../../../_components/hero-dots-field", () => ({
  HeroDotsField: () => (
    <svg
      className="hero__field"
      id="hero-dots"
      viewBox="0 0 1200 700"
      aria-hidden="true"
    />
  ),
}));

afterEach(cleanup);

const SECTION_PAIRS: readonly (readonly [
  string,
  ComponentType,
  ComponentType,
])[] = [
  ["hero", Hero, HeroEn],
  ["foundations", Grundlagen, GrundlagenEn],
  ["risk classes", Risikoklassen, RisikoklassenEn],
  ["timeline", Zeitplan, ZeitplanEn],
  ["2026 position", Stand2026, Stand2026En],
  ["rights", DeineRechte, DeineRechteEn],
  ["practical steps", Praxis, PraxisEn],
  ["sources", Quellen, QuellenEn],
];

const EXTERNAL_SOURCE_URLS = [
  "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689",
  "https://eur-lex.europa.eu/eli/reg/2026/1744/oj",
  "https://www.consilium.europa.eu/en/press/press-releases/2026/06/29/artificial-intelligence-council-gives-final-green-light-to-simplify-and-streamline-rules/",
  "https://digital-strategy.ec.europa.eu/en/faqs/ai-literacy-questions-answers",
  "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
  "https://www.bundestag.de/dokumente/textarchiv/2026/kw24-de-ki-1183820",
] as const;

function elementShape(element: Element): unknown {
  return {
    tag: element.tagName.toLowerCase(),
    id: element.getAttribute("id"),
    className: element.getAttribute("class"),
    dataScreenLabel: element.getAttribute("data-screen-label"),
    dataStage: element.getAttribute("data-stage"),
    style: element.getAttribute("style"),
    target: element.getAttribute("target"),
    rel: element.getAttribute("rel"),
    children: Array.from(element.children, elementShape),
  };
}

function renderShape(Component: ComponentType): unknown {
  const { container, unmount } = render(<Component />);
  const shape = Array.from(container.children, elementShape);
  unmount();
  return shape;
}

function EnglishSections() {
  return (
    <>
      <HeroEn />
      <GrundlagenEn />
      <RisikoklassenEn />
      <ZeitplanEn />
      <Stand2026En />
      <DeineRechteEn />
      <PraxisEn />
      <QuellenEn />
    </>
  );
}

describe("English EU AI Act article sections", () => {
  it.each(SECTION_PAIRS)(
    "%s preserves the reviewed German DOM structure and CSS hooks",
    (_name, GermanSection, EnglishSection) => {
      expect(renderShape(EnglishSection)).toEqual(renderShape(GermanSection));
    },
  );

  it("renders every required section with reviewed English legal copy", () => {
    render(<EnglishSections />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "The EU AI Act: what it means if you are not a lawyer.",
      }),
    ).not.toBeNull();
    for (const id of [
      "hero",
      "einstieg",
      "grundlagen",
      "risikoklassen",
      "zeitplan",
      "stand",
      "rechte",
      "praxis",
      "quellen",
    ]) {
      expect(document.getElementById(id), `section #${id}`).not.toBeNull();
    }

    const text = document.body.textContent ?? "";
    for (const requiredText of [
      "Regulation (EU) 2024/1689",
      "Regulation (EU) 2026/1744",
      "Article 4",
      "Article 50",
      "Article 85",
      "Article 86",
      "2 August 2026",
      "2 December 2027",
      "2 August 2028",
      "28 July 2026",
      "This explanation is not legal advice.",
    ]) {
      expect(text).toContain(requiredText);
    }
    expect(text).not.toMatch(/Quelle:|Deine Rechte|Weiterlesen|Was du jetzt/);
    expect(document.querySelectorAll(".ladder__step")).toHaveLength(4);
    expect(document.querySelectorAll(".pipeline__step")).toHaveLength(5);
    expect(document.querySelectorAll(".qa__item")).toHaveLength(6);
  });

  it("preserves every reviewed external source URL and locale-safe course links", () => {
    const { container } = render(<QuellenEn />);
    const externalLinks = Array.from(
      container.querySelectorAll<HTMLAnchorElement>("a.source"),
      (anchor) => anchor.href,
    );

    expect(externalLinks).toEqual(EXTERNAL_SOURCE_URLS);
    for (const anchor of container.querySelectorAll<HTMLAnchorElement>(
      "a.source",
    )) {
      expect(anchor.target).toBe("_blank");
      expect(anchor.rel).toBe("noopener noreferrer");
    }
    expect(
      screen
        .getByRole("link", { name: "EU AI Act course" })
        .getAttribute("href"),
    ).toBe("/en/eu-ai-act-kurs");
    expect(
      screen
        .getByRole("link", { name: "Everyday AI literacy" })
        .getAttribute("href"),
    ).toBe("/en/ki-fuehrerschein");
  });
});
