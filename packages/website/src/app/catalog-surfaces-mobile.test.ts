import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The four catalog routes below lg. Each one is written phone-first: the base
// utility carries the compact companion value and a breakpoint variant hands
// the reviewed desktop value back. Nothing here pins a colour, a word or a
// region - only the pairing, because an unpaired base value is how a phone
// tightening silently reaches the desktop layout.
const SURFACES = [
  "buecher/buecher-content.tsx",
  "demos/page.tsx",
  "workshops/workshops-content.tsx",
  "open-source/page.tsx",
  "open-source/artifact-ledger.tsx",
] as const;

type Surface = (typeof SURFACES)[number];

function source(path: Surface): string {
  return readFileSync(join(__dirname, path), "utf8");
}

/**
 * Every class list the file writes literally, from both `className="…"` and
 * `className={`…`}`. Class lists assembled from a constant are skipped: they
 * carry no breakpoint decision of their own.
 */
function classLists(text: string): readonly string[] {
  const lists: string[] = [];
  const pattern = /className=(?:"([^"]*)"|\{`([^`]*)`\})/g;
  let match = pattern.exec(text);
  while (match !== null) {
    lists.push((match[1] ?? match[2] ?? "").replace(/\s+/g, " ").trim());
    match = pattern.exec(text);
  }
  return lists;
}

function hasUtility(classList: string, utility: string): boolean {
  return classList.split(" ").includes(utility);
}

describe("catalog surfaces below lg", () => {
  it.each(SURFACES)("keeps %s on the server", (path) => {
    expect(source(path)).not.toMatch(/^\s*["']use client["']/);
  });

  it.each(SURFACES)(
    "hands every phone-only reorder in %s back at a breakpoint",
    (path) => {
      const reordered = classLists(source(path)).filter(
        (list) =>
          hasUtility(list, "order-first") || hasUtility(list, "-order-1"),
      );

      // Without a restore variant a phone reorder would also rewrite the
      // reviewed desktop reading order, and no visual baseline would catch
      // it: `order` moves boxes, not the DOM, so every desktop text
      // assertion still passes either way.
      for (const list of reordered) {
        expect(list).toMatch(/\b(?:sm|md|lg|xl):order-none\b/);
      }
    },
  );

  it("reorders a stacked row only on the books route", () => {
    const reordering = SURFACES.filter((path) =>
      classLists(source(path)).some(
        (list) =>
          hasUtility(list, "order-first") || hasUtility(list, "-order-1"),
      ),
    );

    // Books is the one catalog row whose decision sits under a summary and a
    // fact list. The workshop row already reads in phone order in the DOM
    // (cover, kicker, title, question, link), and the demo and open-source
    // rows lead with their decision, so a reorder there would be motion for
    // its own sake.
    expect(reordering).toEqual(["buecher/buecher-content.tsx"]);
  });

  it.each(SURFACES)(
    "restores every element %s hides on phones at a breakpoint or a state",
    (path) => {
      for (const list of classLists(source(path))) {
        if (!hasUtility(list, "hidden")) continue;
        expect(list).toMatch(
          /\b(?:sm|md|lg|xl|group-open\/details):(?:block|flex|inline|inline-flex|inline-block|grid)\b/,
        );
      }
    },
  );

  it("leads the book row with title and reader link, contents after", () => {
    const buecher = source("buecher/buecher-content.tsx");

    // The panel is a flex column at every width so `order` can move the two
    // decision blocks on a phone; full-width children lay out identically in
    // block and column flow, so md returns the reviewed spread untouched.
    expect(buecher).toContain(
      'className="flex min-w-0 flex-col bg-paper p-4 sm:p-7"',
    );
    expect(buecher).toContain(
      "md:grid-cols-[minmax(16rem,0.44fr)_minmax(0,1fr)]",
    );
    expect(buecher).toContain("py-6 sm:py-14");
    expect(buecher).toContain("gap-6 sm:gap-12");
    // The cover shrinks to 9rem on a phone and the srcset follows it, so the
    // catalog stops shipping a 224px image to a 144px box.
    expect(buecher).toContain("w-36 max-w-full");
    expect(buecher).toContain('sizes="(max-width: 639px) 144px');
    expect(buecher).toContain("sm:w-56 md:w-full");
  });

  it("stacks the workshop row cover first and turns the index into a rail", () => {
    const workshops = source("workshops/workshops-content.tsx");
    const row = workshops.slice(workshops.indexOf("function WorkshopRow"));

    // Phone order is source order: the cover on top at full width, then the
    // kicker, the title, the question and the one link. From md the same DOM
    // becomes the two-column sheet (cover left), so nothing needs `order`.
    expect(row.indexOf("<figure")).toBeLessThan(row.indexOf("<h3"));
    expect(row.indexOf("<h3")).toBeLessThan(row.indexOf("data-workshop-question"));
    expect(row.indexOf("data-workshop-question")).toBeLessThan(
      row.indexOf("<Link"),
    );
    expect(row).toContain("md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]");
    // The cover-band index is a one-line rail on a phone, keyboard reachable
    // through its links, and a wrapping row from sm that never scrolls.
    expect(workshops).toContain(
      "flex snap-x gap-x-6 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible",
    );
    expect(workshops).toContain("pt-14 sm:pt-20");
  });

  it("keeps the demo cover compact without moving the desktop console", () => {
    const demos = source("demos/page.tsx");

    // Paper hero: tighter padding on a phone, the reviewed spacing from sm.
    expect(demos).toContain(
      'className="px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-12"',
    );
    // Lead and check list stack on a phone and sit side by side from lg.
    expect(demos).toContain(
      "lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]",
    );
    // The stats are the shared StatRow (two columns on a phone, one row of
    // three from sm), not a bespoke figure grid.
    expect(demos).toContain("<StatRow stats={stats}");
  });

  it("keeps the open-source cover and ledger frames bounded on phones", () => {
    const hub = source("open-source/page.tsx");
    const ledger = source("open-source/artifact-ledger.tsx");

    expect(hub).toContain("py-4 sm:py-8");
    expect(hub).toContain("min-h-[17rem]");
    expect(hub).toContain("sm:min-h-[22rem] md:min-h-[25rem]");
    expect(hub).toContain("inset-6 sm:inset-10");
    expect(hub).toContain(
      "md:grid-cols-[minmax(0,0.88fr)_minmax(20rem,1.12fr)]",
    );

    expect(ledger).toContain("py-4 sm:py-6");
    // A 16:9 poster in a phone-wide column is already 190px tall; the 18rem
    // floor belongs to the wide desktop column, where it stops the frame
    // collapsing next to the fact grid.
    expect(ledger).toContain("aspect-video min-h-[11rem] sm:min-h-[18rem]");
    expect(ledger).toContain(
      "lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]",
    );
    expect(ledger).toContain("grid-cols-2 border-l border-t border-foreground");
    expect(ledger).toContain("sm:grid-cols-4");
  });
});
