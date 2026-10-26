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

  it("reorders no catalog row: each reads in phone order in the DOM", () => {
    const reordering = SURFACES.filter((path) =>
      classLists(source(path)).some(
        (list) =>
          hasUtility(list, "order-first") || hasUtility(list, "-order-1"),
      ),
    );

    // The book row now leads with its decision too (tile, meta, title,
    // hook, then the two cards), so no catalog row needs `order`.
    expect(reordering).toEqual([]);
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

  it("lays the book row out on the workshop hub-row geometry", () => {
    const buecher = source("buecher/buecher-content.tsx");
    const row = buecher.slice(buecher.indexOf("function ShelfRow"));

    // A 104px tile beside the text on a phone, 14rem from md, 18rem from lg,
    // as WorkshopRow; the cards span the row on a phone and sit in the text
    // column from md.
    expect(row).toContain("grid-cols-[6.5rem_minmax(0,1fr)]");
    expect(row).toContain(
      "md:grid-cols-[14rem_minmax(0,1fr)] md:grid-rows-[auto_1fr] md:gap-x-10 md:gap-y-6 lg:grid-cols-[18rem_minmax(0,1fr)]",
    );
    expect(row).toContain("col-span-2 min-w-0 md:col-span-1 md:col-start-2");
    // Phone order is source order: tile, meta, title, hook, the cards, then
    // the chapter list.
    expect(row.indexOf("<BookCoverTile")).toBeLessThan(row.indexOf("data-book-meta"));
    expect(row.indexOf("data-book-meta")).toBeLessThan(row.indexOf("<h2"));
    expect(row.indexOf("<h2")).toBeLessThan(row.indexOf("data-book-hook"));
    expect(row.indexOf("data-book-hook")).toBeLessThan(row.indexOf("data-book-start"));
    expect(row.indexOf("data-book-start")).toBeLessThan(row.indexOf("<ChapterList"));
    // The subtitle is md-only; the hook carries the phone row.
    expect(row).toContain("mt-1 hidden max-w-[48ch] text-body text-muted-foreground text-pretty md:block");
  });

  it("keeps the workshop row in phone order and compacts it below md", () => {
    const workshops = source("workshops/workshops-content.tsx");
    const row = workshops.slice(workshops.indexOf("function WorkshopRow"));

    // Phone order is source order: the poster thumb, then the duration line,
    // the title, what you leave with and the one link. From md the same DOM
    // becomes the two-column sheet (poster cover left), so nothing needs `order`.
    expect(row.indexOf("<figure")).toBeLessThan(row.indexOf("<h3"));
    expect(row.indexOf("data-workshop-meta")).toBeLessThan(row.indexOf("<h3"));
    expect(row.indexOf("<h3")).toBeLessThan(row.indexOf("<Link"));
    // The fixed question lives on the workshop page, not on a hub row.
    expect(row).not.toContain("data-workshop-question");
    // A phone row is a 104px poster thumb beside the text; md returns the
    // sheet with the poster cover at 14rem, 18rem from lg (SPEC §3.3).
    expect(row).toContain(
      "grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-x-4 border-b border-hairline py-4",
    );
    expect(row).toContain(
      "md:grid-cols-[14rem_minmax(0,1fr)] md:items-start md:gap-10 md:py-10 lg:grid-cols-[18rem_minmax(0,1fr)]",
    );
    // The summary is md-only; "Du nimmst mit" is one clamped sentence.
    expect(row).toContain('className="mt-3 hidden max-w-[56ch] text-body text-muted-foreground text-pretty md:block"');
    expect(row).toContain("max-md:line-clamp-2");
    // The link covers the row on a phone; the text keeps the full width.
    expect(row).toContain("max-md:absolute max-md:inset-0");
    expect(row).not.toContain("grid-cols-[minmax(0,1fr)_2.75rem]");
    // The list is the index: the band carries no anchor row at any width.
    expect(workshops).not.toContain("data-workshop-index");
    expect(workshops).toContain('className="pt-5 sm:pt-16"');
    // No route rail: the posters follow the cover at every width.
    expect(workshops).not.toContain("workshop-route-heading");
    expect(workshops).toContain('"pb-10 pt-4 sm:pb-24 sm:pt-12"');
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

    // Hero: the poster title on paper (SPEC §4, fit to its column, 36 to
    // 50px on a phone); the lead token from sm, and no lead on a phone,
    // where the kicker and the grouped ledger carry it.
    expect(page).toContain('className="poster-title mt-2 max-w-[16ch] text-foreground sm:mt-3"');
    expect(page).toContain("style={posterTitleFallbackStyle(copy.heading)}");
    expect(page).toContain("mt-4 max-w-[58ch] text-lead text-muted-foreground text-pretty max-sm:hidden");
    expect(page).toContain("px-4 pb-6 pt-4 sm:px-6 sm:pb-14 sm:pt-12 lg:pb-16 lg:pt-10");
    // The "Unsicher?" line is the link's 44px target on a phone, and one
    // cost note renders at every width (no phone/desktop swap).
    expect(page).toContain("max-sm:flex max-sm:flex-wrap max-sm:items-center");
    expect(page).not.toContain("accessBodyShort");
    expect(page).toMatch(/\{copy\.accessBody\}/);
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
    // The number column became the thumbnail column (SPEC §3.4): 72px on a
    // phone, 80px from sm; a people picture or a poster (course-thumb.tsx).
    expect(row).toContain("grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[5rem_minmax(0,1fr)]");
    expect(row).toMatch(/<CourseThumb[\s\S]*?size="sm"/);
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
