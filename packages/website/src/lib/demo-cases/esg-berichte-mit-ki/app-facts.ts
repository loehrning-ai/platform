/**
 * What Claude's recorded answers say, read the way a person checks them, so
 * the captions quote the recording and the tests hold it against the kit's
 * solutions (ledger.ts): the statuses of steps 1 to 3, the register counts of
 * steps 4 and 5, the statuses in the file Claude wrote, and every status that
 * differs from the solutions. Pure functions over the stored recordings.
 */
import { answerRows, countsIn, statusIn } from "./answer-table";
import { APP_STEPS } from "./app-steps";
import { APP_REGISTER, stepTurn, type Edition } from "./app-recordings";
import { LEDGER, type RowGroup, type RowId } from "./ledger";
import { countStatuses, type Counts, type Status } from "./rules";

const GROUP_OF_STEP: Readonly<Record<"schritt-1" | "schritt-2" | "schritt-3", RowGroup>> = { "schritt-1": "fragebogen", "schritt-2": "werbung", "schritt-3": "bank" };

/** The statuses Claude gave in the answer tables of steps 1 to 3, by register id. */
export function claudeBefore(edition: Edition): Readonly<Partial<Record<RowId, Status>>> {
  const out: Partial<Record<RowId, Status>> = {};
  for (const [id, group] of Object.entries(GROUP_OF_STEP)) {
    const step = APP_STEPS.find((item) => item.id === id);
    if (!step) continue;
    for (const row of answerRows(stepTurn(edition, step).turn.final_text, group)) out[row.id] = row.status;
  }
  return out;
}

/** The register id of a Register sheet row: "Q1", "F2", and the claims "1" to "7" as C1 to C7. */
export function registerRowId(nr: string): RowId | null {
  const cell = nr.trim();
  if (/^[QF]\d$/.test(cell)) return cell as RowId;
  if (/^[1-7]$/.test(cell)) return `C${cell}` as RowId;
  return null;
}

/** The statuses in the Register sheet of the file Claude wrote (after step 5). */
export function claudeAfter(edition: Edition): Readonly<Partial<Record<RowId, Status>>> {
  const [head, ...rows] = APP_REGISTER[edition].rows;
  const nrAt = (head ?? []).findIndex((cell) => /^(nr|no)$/i.test(cell.trim()));
  const statusAt = (head ?? []).findIndex((cell) => /^status$/i.test(cell.trim()));
  const out: Partial<Record<RowId, Status>> = {};
  for (const row of rows) {
    const id = registerRowId(row[nrAt] ?? "");
    const status = statusIn(row[statusAt] ?? "");
    if (id && status) out[id] = status;
  }
  return out;
}

export interface Difference {
  readonly row: RowId;
  readonly claude: Status;
  readonly solution: Status;
}

/** Every answer of steps 1 to 3 whose status differs from the kit's solutions (shown honestly, never hidden). */
export function differencesBefore(edition: Edition): readonly Difference[] {
  const claude = claudeBefore(edition);
  return LEDGER.flatMap((entry) => {
    const status = claude[entry.id];
    return status && status !== entry.before ? [{ row: entry.id, claude: status, solution: entry.before }] : [];
  });
}

/** The register counts Claude states in step 4 (before the invoice) and step 5 (after it). */
export function registerCounts(edition: Edition): { readonly before: Counts | null; readonly after: Counts | null } {
  const four = APP_STEPS.find((step) => step.id === "schritt-4");
  const five = APP_STEPS.find((step) => step.id === "schritt-5");
  return {
    before: four ? countsIn(stepTurn(edition, four).turn.final_text) : null,
    after: five ? countsIn(stepTurn(edition, five).turn.final_text) : null,
  };
}

/** The counts of one step's answer table (steps 1 to 3). */
export function stepCounts(edition: Edition, step: "schritt-1" | "schritt-2" | "schritt-3"): Counts {
  const found = APP_STEPS.find((item) => item.id === step);
  const rows = found ? answerRows(stepTurn(edition, found).turn.final_text, GROUP_OF_STEP[step]) : [];
  return countStatuses(rows.map((row) => row.status));
}
