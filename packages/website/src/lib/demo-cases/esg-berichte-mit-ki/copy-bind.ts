import { fill } from "./core";
import type { Day, Grade, Request } from "./types";

/*
 * The shape of the demo's frame copy. copy.ts holds the words (both locales,
 * server and tests only); the page receives one locale's EsgStrings as plain
 * data and binds it here, on the client, into the EsgCopy the components read.
 */

type Three = Readonly<Record<"ok" | "check" | "notFound", string>>;

/** Every word of the demo's frame in one locale (spec section 9), as plain data. */
export interface EsgStrings {
  readonly spoiler: string;
  readonly date: Readonly<Record<Day, string>>;
  readonly index: {
    readonly heading: string;
    readonly open: string;
    /** {grade} */
    readonly stamped: string;
    /** {n}, {short}, {state} */
    readonly button: string;
  };
  readonly card: {
    /** {n}, {title} */
    readonly heading: string;
    readonly askedIn: string;
    readonly ask: string;
    readonly status: Three;
    readonly second: Three;
    readonly third: string;
    readonly yes: string;
    readonly no: string;
    readonly hints: readonly [string, string];
    readonly check: string;
    /** {n} */
    readonly line: string;
    readonly gap: string;
    readonly decisive: string;
    /** {file} */
    readonly excerptOf: string;
    /** {file}: caption of a figure whose lines are transcribed from a photo, not file lines. */
    readonly transcribed: string;
  };
  readonly feedback: {
    readonly grades: Readonly<Record<Grade, string>>;
    /** {n} */
    readonly rule: string;
    readonly feeds: string;
    readonly parts: string;
    readonly open: string;
    /** {n} */
    readonly next: string;
    readonly nextMonday: string;
    /** {n}, {grade} */
    readonly announce: string;
    readonly coverage: string;
    readonly noBill: string;
    /** {months}, {mwh} */
    readonly stripLabel: string;
    /** {mwh}, {months} */
    readonly year: string;
    readonly glasAction: string;
    readonly zertNote: string;
  };
  readonly sheet: {
    readonly heading: string;
    /** {n} */
    readonly filled: string;
    readonly heads: Readonly<Record<Request, string>>;
    readonly colId: string;
    readonly colQuestion: string;
    readonly colStatus: string;
    readonly yours: string;
    readonly withAction: string;
    readonly withoutAction: string;
    readonly summaryHead: string;
    /** {n}, for one answer and for several. */
    readonly differOne: string;
    readonly differMany: string;
    readonly allMatch: string;
    /** {ok}, {check}, {notFound} */
    readonly tally: string;
    /** {filled}, {total} */
    readonly partial: string;
    /** {ids} */
    readonly announceRows: string;
  };
  readonly monday: {
    readonly heading: string;
    readonly locked: string;
    readonly start: string;
    readonly head: string;
    readonly predict: string;
    readonly predictHint: string;
    readonly openInvoice: string;
    /** {ids} */
    readonly yourTip: string;
    readonly noTip: string;
    readonly invoiceCaption: string;
    readonly invoiceAsk: string;
    readonly invoiceRight: string;
    readonly invoiceWrong: string;
    readonly invoiceMath: string;
    readonly mixNote: string;
    readonly restampLead: string;
    readonly revealHeading: string;
    readonly changes: string;
    readonly stays: string;
    /** {status} */
    readonly staysStatus: string;
    /** Read aloud for the arrow in "before → after". */
    readonly to: string;
    /** {hits}; then {ids} for the false alarms and the misses, each its own sentence. */
    readonly scoreHits: string;
    readonly scoreFalseAlarms: string;
    readonly scoreMisses: string;
    readonly announceDay: string;
  };
  readonly takeaways: {
    readonly heading: string;
    readonly sub: string;
    readonly copy: string;
    readonly copied: string;
    readonly copyFailed: string;
    readonly fromKit: string;
    readonly missed: string;
    readonly privacy: string;
    readonly restart: string;
    readonly titles: readonly [string, string, string];
    readonly notes: readonly [string, string, string];
  };
}

/** The frame copy as the components read it: the same words, sentences with blanks as functions. */
export interface EsgCopy {
  readonly spoiler: string;
  readonly date: Readonly<Record<Day, string>>;
  readonly index: Omit<EsgStrings["index"], "stamped" | "button"> & {
    readonly stamped: (grade: string) => string;
    readonly button: (n: number, short: string, state: string) => string;
  };
  readonly card: Omit<EsgStrings["card"], "heading" | "line" | "excerptOf" | "transcribed"> & {
    readonly heading: (n: number, title: string) => string;
    readonly line: (n: number) => string;
    readonly excerptOf: (file: string) => string;
    readonly transcribed: (file: string) => string;
  };
  readonly feedback: Omit<EsgStrings["feedback"], "rule" | "next" | "announce" | "stripLabel" | "year"> & {
    readonly rule: (n: 1 | 2 | 3) => string;
    readonly next: (n: number) => string;
    readonly announce: (n: number, grade: string) => string;
    readonly stripLabel: (months: number, mwh: string) => string;
    readonly year: (mwh: string, months: number) => string;
  };
  readonly sheet: Omit<
    EsgStrings["sheet"],
    "filled" | "differOne" | "differMany" | "tally" | "partial" | "announceRows"
  > & {
    readonly filled: (n: number) => string;
    readonly differ: (n: number) => string;
    readonly tally: (ok: number, check: number, notFound: number) => string;
    readonly partial: (filled: number, total: number) => string;
    readonly announceRows: (ids: string) => string;
  };
  readonly monday: Omit<
    EsgStrings["monday"],
    "yourTip" | "staysStatus" | "scoreHits" | "scoreFalseAlarms" | "scoreMisses"
  > & {
    readonly yourTip: (ids: string) => string;
    readonly staysStatus: (status: string) => string;
    readonly score: (hits: number, falseAlarms: readonly string[], misses: readonly string[]) => string;
  };
  readonly takeaways: EsgStrings["takeaways"];
}

/** One locale's strings as the components read them. Pure: the same strings give the same copy. */
export function bindCopy(strings: EsgStrings): EsgCopy {
  const { index, card, feedback, sheet, monday } = strings;
  const {
    differOne,
    differMany,
    filled,
    tally,
    partial,
    announceRows,
    ...sheetWords
  } = sheet;
  const { yourTip, staysStatus, scoreHits, scoreFalseAlarms, scoreMisses, ...mondayWords } = monday;
  return {
    spoiler: strings.spoiler,
    date: strings.date,
    index: {
      ...index,
      stamped: (grade) => fill(index.stamped, { grade }),
      button: (n, short, state) => fill(index.button, { n, short, state }),
    },
    card: {
      ...card,
      heading: (n, title) => fill(card.heading, { n, title }),
      line: (n) => fill(card.line, { n }),
      excerptOf: (file) => fill(card.excerptOf, { file }),
      transcribed: (file) => fill(card.transcribed, { file }),
    },
    feedback: {
      ...feedback,
      rule: (n) => fill(feedback.rule, { n }),
      next: (n) => fill(feedback.next, { n }),
      announce: (n, grade) => fill(feedback.announce, { n, grade }),
      stripLabel: (months, mwh) => fill(feedback.stripLabel, { months, mwh }),
      year: (mwh, months) => fill(feedback.year, { mwh, months }),
    },
    sheet: {
      ...sheetWords,
      filled: (n) => fill(filled, { n }),
      differ: (n) => fill(n === 1 ? differOne : differMany, { n }),
      tally: (ok, check, notFound) => fill(tally, { ok, check, notFound }),
      partial: (done, total) => fill(partial, { filled: done, total }),
      announceRows: (ids) => fill(announceRows, { ids }),
    },
    monday: {
      ...mondayWords,
      yourTip: (ids) => fill(yourTip, { ids }),
      staysStatus: (status) => fill(staysStatus, { status }),
      score: (hits, falseAlarms, misses) => {
        const parts = [fill(scoreHits, { hits })];
        if (falseAlarms.length > 0) parts.push(fill(scoreFalseAlarms, { ids: falseAlarms.join(", ") }));
        if (misses.length > 0) parts.push(fill(scoreMisses, { ids: misses.join(", ") }));
        return parts.join(" ");
      },
    },
    takeaways: strings.takeaways,
  };
}
