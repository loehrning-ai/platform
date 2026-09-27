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

  it("keeps the workshop row in phone order and compacts it below md", () => {
    const workshops = source("workshops/workshops-content.tsx");
    const row = workshops.slice(workshops.indexOf("function WorkshopRow"));

    // Phone order is source order: the tile, then the duration line, the
    // title, what you leave with and the one link. From md the same DOM becomes the
    // two-column sheet (cover left), so nothing needs `order`.
    expect(row.indexOf("<figure")).toBeLessThan(row.indexOf("<h3"));
    expect(row.indexOf("data-workshop-meta")).toBeLessThan(row.indexOf("<h3"));
    expect(row.indexOf("<h3")).toBeLessThan(row.indexOf("data-workshop-question"));
    expect(row.indexOf("data-workshop-question")).toBeLessThan(
      row.indexOf("<Link"),
    );
    // A phone row is a 56px tile beside the text; md returns the sheet.
    expect(row).toContain(
      "grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-3.5 border-b border-hairline py-4",
    );
    expect(row).toContain("md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-stretch md:gap-10 md:py-10");
    // The summary is md-only; "Du gehst mit" is one clamped sentence.
    expect(row).toContain('className="mt-3 hidden max-w-[56ch] text-body text-muted-foreground text-pretty md:block"');
    expect(row).toContain("max-md:line-clamp-2");
    // The link covers the row on a phone; the text keeps the full width.
    expect(row).toContain("max-md:absolute max-md:inset-0");
    expect(row).not.toContain("grid-cols-[minmax(0,1fr)_2.75rem]");
    // The cover-band index repeats the list, so it only appears from md.
    expect(workshops).toContain('className="mt-12 hidden border-t border-hairline pt-2 md:block"');
    expect(workshops).toContain("pb-10 pt-7 sm:pb-24 sm:pt-20");
    expect(workshops).toContain('layout="rail"');
    // The route section starts at sm, so the list follows the cover.
    expect(workshops).toContain('className="hidden pt-6 sm:block sm:pt-20"');
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

// /kurse is the fifth catalog surface. Its atlas is a client island (goal and
// level state), so it sits outside the server-only list above, but it follows
// the same pairing rule: every phone value is handed back at a breakpoint.
const KURSE = [
  "kurse/page.tsx",
  "kurse/learning-atlas.tsx",
  "kurse/course-ledger-row.tsx",
] as const;

function kurseSource(path: (typeof KURSE)[number]): string {
  return readFileSync(join(__dirname, path), "utf8");
}

describe("/kurse below lg", () => {
  it.each(KURSE)(
    "restores every element %s hides or reorders on phones",
    (path) => {
      for (const list of classLists(kurseSource(path))) {
        if (hasUtility(list, "hidden")) {
          expect(list).toMatch(/\b(?:sm|md|lg|xl):(?:block|flex|inline|inline-flex|inline-block|grid)\b/);
        }
        if (hasUtility(list, "order-first") || hasUtility(list, "-order-1")) {
          expect(list).toMatch(/\b(?:sm|md|lg|xl):order-none\b/);
        }
      }
    },
  );

  it("sets the hero, heads and rows one step smaller on phones and pairs each with its reviewed size", () => {
    const page = kurseSource("kurse/page.tsx");
    const atlas = kurseSource("kurse/learning-atlas.tsx");
    const row = kurseSource("kurse/course-ledger-row.tsx");

    // Hero: a 30px headline and a 15px lead, the fluid tokens from sm.
    expect(page).toContain("text-[1.875rem]/[1.08]");
    expect(page).toContain("sm:text-fluid-h1");
    expect(page).toContain("text-[0.9375rem]/[1.5] text-muted-foreground text-pretty sm:mt-4 sm:text-lead");
    expect(page).toContain("px-4 pb-6 pt-4 sm:px-6 sm:pb-14 sm:pt-12 lg:pb-16 lg:pt-10");
    // The "Unsicher?" line is the link's 44px target on a phone, and the
    // short cost note trades places with the full one at sm.
    expect(page).toContain("max-sm:flex max-sm:flex-wrap max-sm:items-center");
    expect(page).toMatch(/accessBodyShort[\s\S]*max-sm:hidden/);
    expect(page).toContain('size="compact"');

    // Atlas and ledger heads: 22px on a phone, the fluid h2 from sm.
    // The goal question leaves the phone page (the chips read as the
    // question); the ledger head stays.
    expect(atlas).toContain("text-[1.375rem]/[1.15] font-bold text-foreground max-sm:sr-only sm:text-fluid-h2");
    expect(atlas).toContain("text-[1.375rem]/[1.15] font-bold text-foreground sm:text-fluid-h2");
    // The goal rail scrolls below lg and is a joined grid from lg.
    expect(atlas).toContain("flex w-max gap-2 px-4 sm:px-6 lg:grid lg:w-auto lg:grid-cols-4 lg:gap-0 lg:px-0");

    // A row keeps its 44px title target while giving 6px back on a phone.
    expect(row).toContain("-my-1.5 flex min-h-11");
    expect(row).toContain("sm:my-0 sm:inline-flex");
    expect(row).toContain("flex h-8 items-center");
    expect(row).toContain("sm:h-11");
    // From lg the right-hand cells span both rows, so the links line stays
    // directly under the promise as it did inside the text column.
    expect(row).toContain("lg:col-start-3 lg:row-span-2 lg:row-start-1");
    expect(row).toContain("xl:col-start-4 xl:row-span-2 xl:row-start-1");
    // The phone moves the action first; the DOM keeps the desktop order.
    expect(row).toContain("max-lg:order-first xl:col-start-4");
    // Short promise below sm, full promise from sm.
    expect(row).toContain('className="sm:hidden"');
    expect(row).toContain('className="max-sm:sr-only"');
  });
});
