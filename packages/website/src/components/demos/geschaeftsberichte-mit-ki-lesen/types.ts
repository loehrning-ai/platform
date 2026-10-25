import type { Basis, Counter, Verdict } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";

/** What the visitor chose, null where they skipped (the kit default applies). */
export interface Choices {
  readonly poll: Verdict | null;
  readonly merged: boolean;
  readonly counter: Counter | null;
  readonly basis: Basis | null;
}

/** The kit's reference answers (metric-cards.md, "Reference answers"). */
export const REFERENCE = { counter: "scrapped", basis: "week" } as const satisfies { counter: Counter; basis: Basis };

export const EMPTY_CHOICES: Choices = { poll: null, merged: false, counter: null, basis: null };
