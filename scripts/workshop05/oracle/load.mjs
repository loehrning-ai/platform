/**
 * Reads the kit files from disk into the {file name: text} object that analyse() takes.
 * The only file access of the oracle folder besides generate.mjs; oracle.mjs itself stays pure.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../kit");

export const FOLDER_INPUTS = [
  "contracts_register_2026.csv",
  "registration_M1M2_2026.csv",
  "employee_records_2026.csv",
  "attendance_2026-11.csv",
  "overtime_weekly_2026.csv",
  "payroll_runs_2026.csv",
  "payroll_lines_2026-07_to_10.csv",
  "leave_decisions_2026.csv",
  "absences_2026.csv",
  "medical_exams.csv",
  "training_proofs_2026.csv",
  "overtime_notices_folder.txt",
  "safety_statement_2019.md",
  "folder-index.md",
];

export function loadKitFiles(kitDir = KIT) {
  return Object.fromEntries(FOLDER_INPUTS.map((name) => [name, readFileSync(path.join(kitDir, "folder", name), "utf8")]));
}
