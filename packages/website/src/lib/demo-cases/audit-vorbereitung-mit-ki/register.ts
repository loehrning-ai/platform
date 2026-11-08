/**
 * What the register beat draws: for each of the three dates, the counts and the three lists of the
 * register the oracle builds from the kit files. Plain data (no functions), so the server page can hand
 * it to the client demo as props. Ids only, never names; every number starts in buildRegister, and
 * oracle.test.ts holds the counts for the three dates to expected.json.
 */

import { buildRegister, kitFolderFiles, REGISTER_DATES, REGISTER_PAPERS, type OracleFiles, type RegisterEntry, type RegisterPaper } from "./oracle";

export interface RegisterListEntry {
  readonly id: string;
  readonly paper: RegisterPaper;
}

export interface RegisterDay {
  readonly date: string;
  readonly rows: number;
  readonly expired: readonly RegisterListEntry[];
  readonly expiring: readonly RegisterListEntry[];
  readonly missing: readonly RegisterListEntry[];
  readonly byPaper: Readonly<Record<RegisterPaper, number>>;
}

const plain = (entries: readonly RegisterEntry[]): readonly RegisterListEntry[] => entries.map(({ id, paper }) => ({ id, paper }));

/** One entry per date of REGISTER_DATES, in that order; the first date is the exercise day. */
export function registerDays(files: OracleFiles = kitFolderFiles()): readonly RegisterDay[] {
  return REGISTER_DATES.map((date): RegisterDay => {
    const register = buildRegister(files, date);
    return { date, rows: register.rows.length, expired: plain(register.expired), expiring: plain(register.expiring), missing: plain(register.missing), byPaper: register.byPaper };
  });
}

/** Papers in the order of the register, for the lists and the bars. */
export const PAPER_ORDER: readonly RegisterPaper[] = REGISTER_PAPERS;
