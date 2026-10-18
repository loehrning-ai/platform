import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import postcss, { type AtRule, type Container, type Rule } from "postcss";
import { afterEach, describe, expect, it } from "vitest";
import { HERO_MOTION, isHeroSceneWired } from "@/components/plakat/hero-motion";
import { WORKSHOP_PAGE_COPY } from "@/app/workshops/workshop-copy";
import { workshopPlakat } from "@/lib/plakat/palettes";
import { getWorkshops } from "@/lib/workshops";
import { WorkshopStage } from "./workshop-stage";

afterEach(cleanup);

const CSS = readFileSync(join(__dirname, "workshop-stage.css"), "utf8");
const ROOT = postcss.parse(CSS);

function follows(first: Element, second: Element): boolean {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
}

function media(query: string): AtRule {
  let found: AtRule | undefined;
  ROOT.walkAtRules("media", (rule) => {
    if (rule.params.includes(query)) found = rule;
  });
  expect(found, query).toBeDefined();
  return found!;
}

describe("<WorkshopStage>", () => {
  for (const locale of ["de", "en"] as const) {
    for (const workshop of getWorkshops(locale)) {
      it(`${locale}/${workshop.slug}: h2, the two cards, the pause control, then the scene`, () => {
        const copy = WORKSHOP_PAGE_COPY[locale].detail.stage;
        const plakat = workshopPlakat(workshop.slug)!.plakat;
        const { container } = render(<WorkshopStage workshop={workshop} locale={locale} plakat={plakat} />);

        const stage = container.querySelector("section[data-workshop-stage]")!;
        expect(stage).toHaveAttribute("aria-labelledby", "workshop-stage-heading");
        expect(stage).toHaveClass("ws-stage");
        const heading = screen.getByRole("heading", { level: 2, name: copy.heading });
        expect(heading).toHaveAttribute("id", "workshop-stage-heading");
        expect(heading).toHaveClass("sr-only");

        const list = stage.querySelector("ul[data-workshop-actions]")!;
        const pause = stage.querySelector("label[data-stage-pause]")!;
        expect(follows(heading, list)).toBe(true);
        expect(follows(list, pause)).toBe(true);

        const wired = isHeroSceneWired(HERO_MOTION[workshop.slug]);
        const scene = stage.querySelector("[data-workshop-scene]");
        expect(stage).toHaveAttribute("data-stage-scene", wired ? HERO_MOTION[workshop.slug] : "none");
        if (wired) {
          expect(scene).not.toBeNull();
          expect(follows(pause, scene!)).toBe(true);
          expect(scene).toHaveClass("ws-scene", `plakat-${plakat}`);
          expect(scene!.querySelectorAll("svg[data-hero-motion]")).toHaveLength(1);
        } else {
          // A workshop whose scene is not wired yet shows the cards alone.
          expect(scene).toBeNull();
        }
        // The stage never repeats the band: no heading, number or poster of its own.
        expect(stage.querySelectorAll("h1, svg[data-poster]")).toHaveLength(0);
      });

      it(`${locale}/${workshop.slug}: one CSS-only pause control with both labels`, () => {
        const copy = WORKSHOP_PAGE_COPY[locale].detail.stage;
        const { container } = render(
          <WorkshopStage workshop={workshop} locale={locale} plakat={workshopPlakat(workshop.slug)!.plakat} />,
        );
        const label = container.querySelector("label.ws-pause")!;
        const input = label.querySelector("input.ws-pause-input") as HTMLInputElement;
        expect(input).toHaveAttribute("type", "checkbox");
        expect(input.checked).toBe(false);
        expect(label.querySelector(".ws-pause-off")).toHaveTextContent(copy.pauseOff);
        expect(label.querySelector(".ws-pause-on")).toHaveTextContent(copy.pauseOn);
        expect(label.querySelector(".ws-pause-icon")).toHaveAttribute("aria-hidden", "true");
        // The control is reachable by name, and toggles without script.
        expect(screen.getByRole("checkbox", { name: new RegExp(copy.pauseOff) })).toBe(input);
        fireEvent.click(input);
        expect(input.checked).toBe(true);
        expect(container.querySelectorAll("button, [onclick]")).toHaveLength(0);
      });
    }
  }

  it("the stage and its pause control are a server component with no script", () => {
    const source = readFileSync(join(__dirname, "workshop-stage.tsx"), "utf8");
    expect(source).not.toMatch(/^["']use client["']/m);
    expect(source).not.toMatch(/\buse(?:State|Effect|Ref|LayoutEffect)\b/);
    expect(source).not.toMatch(/[–—]/);
  });
});

describe("workshop-stage.css", () => {
  it("sets the story clock once on the stage", () => {
    expect(CSS).toMatch(/\.ws-stage \{\s*--ws-t:\s*9s;/);
  });

  it("stacks card A, card B and the scene (6:5), with the pause pill inside the scene cell, on a phone", () => {
    expect(CSS).toMatch(/\.ws-grid \{[^}]*grid-template-areas:\s*"cards"\s*"scene"\s*;/s);
    expect(CSS).toMatch(/\.ws-pause \{[^}]*grid-area:\s*scene/s);
    expect(CSS).toMatch(/\.ws-pause \{[^}]*min-height:\s*2\.75rem/s);
    expect(CSS).toMatch(/\.ws-scene \{[^}]*aspect-ratio:\s*6 \/ 5/s);
    expect(CSS).toMatch(/\.ws-scene \{[^}]*border:\s*2px solid var\(--color-scene-line\)/s);
    expect(CSS).toMatch(/\.ws-scene \{[^}]*border-radius:\s*0/s);
    expect(CSS).toMatch(/\.ws-scene \{[^}]*overflow:\s*hidden/s);
  });

  it("goes to 2:1 on a tablet and to cards left, scene right at card height from lg", () => {
    expect(media("min-width: 40rem").toString()).toMatch(/aspect-ratio:\s*2 \/ 1/);
    const lg = media("min-width: 64rem").toString();
    expect(lg).toMatch(/grid-template-columns:\s*minmax\(0, 7fr\) minmax\(0, 5fr\)/);
    expect(lg).toMatch(/grid-template-areas:\s*"cards scene"\s*;/);
    expect(lg).toMatch(/align-self:\s*stretch/);
    expect(lg).toMatch(/min-height:\s*22rem/);
  });

  it("gives a workshop without a scene the full width, so the page is never broken", () => {
    expect(CSS).toMatch(/\[data-stage-scene="none"\] \.ws-grid \{[^}]*"cards"\s*"pause"/s);
  });

  it("stops every animation and transition on the stage when the pause box is checked", () => {
    const pausing = ROOT.nodes.find(
      (node): node is Rule =>
        node.type === "rule" && (node as Rule).selector.includes(".ws-pause-input:checked") && (node as Rule).selector.includes("*::before"),
    );
    expect(pausing, "the pause rule").toBeDefined();
    expect(pausing!.selector).toMatch(/^\.ws-stage:has\(\.ws-pause-input:checked\) :is\(\*, \*::before, \*::after\)$/);
    expect(pausing!.toString()).toMatch(/animation:\s*none\s*!important/);
    expect(pausing!.toString()).toMatch(/transition:\s*none\s*!important/);
  });

  it("keeps the control 44px high, focusable, with a visible focus ring, and shows the label of the state", () => {
    expect(CSS).toMatch(/\.ws-pause \{[^}]*min-height:\s*2\.75rem/s);
    // Visually hidden, but never display:none, so the keyboard reaches it.
    const input = ROOT.nodes.find((node): node is Rule => node.type === "rule" && (node as Rule).selector === ".ws-pause-input")!;
    expect(input.toString()).not.toMatch(/display:\s*none|visibility:\s*hidden/);
    expect(CSS).toMatch(/\.ws-pause:has\(\.ws-pause-input:focus-visible\) \{[^}]*outline:\s*3px solid/s);
    expect(CSS).toMatch(/\.ws-pause-on \{\s*display:\s*none/);
    expect(CSS).toMatch(/\.ws-pause:has\(\.ws-pause-input:checked\) \.ws-pause-on \{\s*display:\s*inline/);
    expect(CSS).toMatch(/\.ws-pause:has\(\.ws-pause-input:checked\) \.ws-pause-off \{\s*display:\s*none/);
  });

  it("hides the control under reduced motion, where nothing moves", () => {
    const reduce = media("prefers-reduced-motion: reduce").toString();
    expect(reduce).toMatch(/\.ws-pause \{\s*display:\s*none/);
  });

  it("tilts the scene by three degrees at most, and only when motion is allowed", () => {
    const motion = media("prefers-reduced-motion: no-preference");
    const text = motion.toString();
    expect(text).toMatch(/\.ws-stage:is\(:hover, :focus-within\) \.ws-scene > svg/);
    for (const [, degrees] of text.matchAll(/rotate[XY]\((-?[\d.]+)deg\)/g)) {
      expect(Math.abs(Number(degrees))).toBeLessThanOrEqual(3);
    }
    // Transitions and transforms outside that block do not exist (but the pause rule that switches them off).
    let outside = 0;
    ROOT.walkDecls((declaration) => {
      let parent: Container | undefined = declaration.parent as Container | undefined;
      let ok = false;
      while (parent) {
        if (parent.type === "atrule" && (parent as AtRule).params.includes("prefers-reduced-motion")) ok = true;
        parent = parent.parent as Container | undefined;
      }
      // The pause rule only ever switches motion off.
      if (!ok && declaration.value.startsWith("none")) return;
      if (!ok && /^(?:animation|transition|transform)/.test(declaration.prop)) outside += 1;
    });
    expect(outside).toBe(0);
  });
});
