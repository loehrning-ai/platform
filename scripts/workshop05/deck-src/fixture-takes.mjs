/**
 * Synthetic recordings (claude-recording/v1) for the deck tests: they exercise the take rendering without a real run.
 * They are never written to a file and never reach a built page of the repository; a test passes them to buildEdition.
 * `differs` makes every turn disagree with the key (the long chip variant and the longest "This run" phrases).
 */
import { deckData } from "./data.mjs";

const T = {
  en: { ownerGap: "NOT IN FILES", rowWord: "row", header: ["Question", "Paper", "Owner", "Date", "Note"], tally: ["COVERED", "WEAK", "GAP"] },
  de: { ownerGap: "NICHT IN DATEIEN", rowWord: "Zeile", header: ["Frage", "Papier", "Zuständig", "Datum", "Hinweis"], tally: ["BELEGT", "SCHWACH", "LÜCKE"] },
};

const idOf = (n) => `L${String(n).padStart(2, "0")}`;

function step1(lang, key, differs) {
  const t = T[lang];
  const rows = differs ? key.rows - 1 : key.rows;
  const cells = (n) => [idOf(n), `paper ${n}`, key.noOwner.includes(idOf(n)) ? (differs ? "someone" : t.ownerGap) : "E-01", "2026-01-15", differs ? "" : "ok"];
  const lines = [`| ${(differs ? t.header.slice(0, 4) : t.header).join(" | ")} |`, `| ${(differs ? t.header.slice(0, 4) : t.header).map(() => "---").join(" | ")} |`];
  for (let n = 1; n <= rows; n += 1) lines.push(`| ${(differs ? cells(n).slice(0, 4) : cells(n)).join(" | ")} |`);
  return lines.slice(0, 16).join("\n");
}

function step2(lang, key, differs) {
  const long =
    lang === "en"
      ? "F3 L06 the overtime notice for the period is not in the folder and the register lists no sender, so the inspector would find a gap here"
      : "F3 L06 die Meldung für den Überstundenzeitraum liegt nicht im Ordner und das Register nennt keinen Absender, der Inspektor fände hier eine Lücke";
  return [
    lang === "en" ? `I read ${differs ? 700 : key.rowsRead} rows.` : `Ich habe ${differs ? 700 : key.rowsRead} Zeilen gelesen.`,
    lang === "en" ? `${differs ? 9 : key.findings} findings, ${differs ? 7 : key.checked} checked with no problem.` : `${differs ? 9 : key.findings} Funde, ${differs ? 7 : key.checked} ohne Befund geprüft.`,
    long,
    "F1 L01 contract of E-04 has no signature date",
  ].join("\n");
}

function step3(lang, d, differs) {
  const t = T[lang];
  // the statuses of the key, line by line (the checker compares every line, not only the tally)
  const order = d.oracle.lines.map((line) => ["COVERED", "WEAK", "GAP"].indexOf(line.status));
  if (differs) order[0] = (order[0] + 1) % 3;
  return order.map((s, i) => `${idOf(i + 1)} ${t.tally[s]}`).join("\n");
}

function step4(lang, key, differs) {
  const r = key.register;
  const expired = differs ? r.expired + 1 : r.expired;
  return lang === "en"
    ? `register.csv: ${r.rows} rows, ${expired} expired, ${r.expiring} expiring, ${r.missing} missing`
    : `register.csv: ${r.rows} Zeilen, ${expired} abgelaufen, ${r.expiring} läuft ab, ${r.missing} fehlen`;
}

function ask(lang, key, differs) {
  const a = key.ask;
  if (differs) return lang === "en" ? `E-07: ${a.onFile + 1} on file, ${a.missing} missing (${a.missingPaper}).` : `E-07: ${a.onFile + 1} vorhanden, ${a.missing} fehlt (${a.missingPaper}).`;
  return lang === "en"
    ? `E-07: ${a.onFile} on file, ${a.missing} missing (${a.missingPaper}).`
    : `E-07: ${a.onFile} vorhanden, ${a.missing} fehlt (${a.missingPaper}).`;
}

const tool = (name) => ({ kind: "tool_use", tool: name });

/** { chain, register } for one language; every part is a complete recording object. */
export function fixtureTakes(lang, { differs = false, d = deckData(lang) } = {}) {
  const key = d.key;
  const base = { schema: "claude-recording/v1", locale: lang, take: 1, recorded_at: "2026-10-26T09:00:00.000Z", model: "claude-opus-5-5", edited: false };
  return {
    chain: {
      ...base,
      id: `${lang}-chain-1`,
      prompt_id: "chain",
      final_text: step1(lang, key, differs),
      timeline: [{ kind: "text", text: "x" }],
      follow_ups: [
        { prompt: "step 2", final_text: step2(lang, key, differs), timeline: [tool("Bash"), tool("Write")] },
        { prompt: "step 3", final_text: step3(lang, d, differs), timeline: [tool("Write")] },
      ],
      kit_files: [],
      produced_files: [
        { name: "evidence-index.csv", bytes: 10, sha256: "0".repeat(64), stored_as: "x" },
        { name: "check.py", bytes: 10, sha256: "0".repeat(64), stored_as: "y" },
        { name: "briefing.md", bytes: 10, sha256: "0".repeat(64), stored_as: "z" },
      ],
    },
    register: {
      ...base,
      id: `${lang}-register-1`,
      prompt_id: "register",
      final_text: step4(lang, key, differs),
      timeline: [tool("Bash"), tool("Write")],
      follow_ups: [{ prompt: "ask", final_text: ask(lang, key, differs), timeline: [] }],
      kit_files: [],
      produced_files: [{ name: "register.csv", bytes: 10, sha256: "0".repeat(64), stored_as: "r" }],
    },
  };
}
