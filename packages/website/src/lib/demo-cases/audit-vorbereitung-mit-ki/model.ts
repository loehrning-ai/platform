/**
 * What the stage draws, computed once from the kit: per item the file its
 * name links (the first screen) with that file's test results, the best file
 * of the folder (evidence.ts), the three R7 candidates, the R5 count and the
 * files no name matched. Pure; every number the demo shows starts here.
 */

import { ITEMS, itemById, vardarContext, type AuditContext, type Item } from "./case";
import { evaluate, itemStatus, tally, type Evaluation, type Status, type Tally, type TestId } from "./evidence";
import { firstDate } from "./dates";
import { FOLDER_FILES, kitText, type FolderFile } from "./kit";

export interface StageRow {
  readonly item: Item;
  /** The file the item's name links, tested. */
  readonly naive: Evaluation;
  /** The best file of the folder for the item, tested. */
  readonly best: Evaluation;
  readonly failsAt: TestId | null;
  readonly status: Status;
}

export interface Model {
  readonly context: AuditContext;
  /** The exercise date, the day the request was sent: every date in the folder is read as of it. */
  readonly exercise: string;
  readonly rows: readonly StageRow[];
  readonly unlinked: readonly FolderFile[];
  readonly tally: Tally;
  readonly r7: readonly Evaluation[];
  readonly r5: Evaluation;
}

export function buildModel(context: AuditContext = vardarContext()): Model {
  const rows = ITEMS.map((item): StageRow => {
    const naive = evaluate(item, item.naive, context);
    return { item, naive, best: itemStatus(item, context), failsAt: naive.failed[0] ?? null, status: naive.status };
  });
  const r7Item = itemById("R7");
  // The order the stage shows them in: the policy, the note, the record.
  const r7Order: readonly FolderFile[] = ["infosec-policy_v3_FINAL.md", "it-notes_2026-10-06.md", "backup-report_2026-10.txt"];
  const sent = /^Sent: (.+)$/m.exec(kitText("request_tannwald.md"))?.[1] ?? "";
  return {
    context,
    exercise: firstDate(sent)?.iso ?? "",
    rows,
    unlinked: FOLDER_FILES.filter((file) => !ITEMS.some((item) => item.naive === file)),
    tally: tally(rows),
    r7: r7Order.map((file) => evaluate(r7Item, file, context)),
    r5: itemStatus(itemById("R5"), context),
  };
}
