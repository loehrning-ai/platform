// Presenter notes for Workshop 04, acts 4 to 6 (rematch to resolution). Source: SPEC.md §2.3.
// {key} and {key|form} are replaced with numbers[key] from w04-data.json by build-deck.mjs
// (forms: bare, abs, absunit, de), so every spoken number matches the slide.
// revealOrder has one line per state of the scene (state 0 = on entry), matching its data-step range.

export default {
  rematch: {
    purpose: "Ask the same question on the ledger: every figure names its rows, both Scope 2 methods, and what was not checked.",
    mode: "listen",
    clock: { start: "44:00", end: "48:00" },
    say: [
      "Same question, same model. This time every figure names its rows, the meter reading is labelled as one, both Scope 2 numbers use the right method, and the answer says what it did not check.",
      "On press 3: the total moved by {gap_lb_t|abs} tonnes. More important, every tonne now has a row and a page behind it.",
      "If the answer is still the constructed target: say so. 'This is the answer we expect; the recorded runs are in appendix A3.'",
    ],
    sayAt: { 0: [1], 1: [3], 2: [1] },
    ask: [{ at: 1, text: "Which number in this answer would you check first?", aloud: true }],
    expectedAudience: [],
    revealOrder: ["Question card, unchanged stamp", "Answer with row IDs and label", "Recalculation check", "Side-by-side table", "Known gap (placeholder until capture)"],
    cut: "Skip the side-by-side table.",
    appendixRoutes: ["appendix-arithmetic", "appendix-run-record"],
  },

  "trace-two": {
    purpose: "Pairs trace three figures back to paper: worked, half done, alone.",
    mode: "pair",
    clock: { start: "48:00", end: "54:00" },
    say: [
      "Work in pairs, on paper, no tools. The first figure is done, the second is half done, the third is yours. Four minutes.",
      "Presenter cue: walk the room at minute two; point stuck pairs to page 2 of the gas bill.",
      "On press 2: compare. On press 3: two slips, and one other route that is also right.",
      "This is what a customer's auditor does with your page: pick a number, ask for the rows, pick a row, ask for the paper.",
    ],
    sayAt: { 0: [0], 1: [1], 2: [2], 3: [3] },
    ask: [],
    expectedAudience: ["Common slips: {wrong_s1_gas} for gas (Hi factor); {el_total_2024_kwh} for the grid bar. Add real shares only after the O3 test runs."],
    revealOrder: ["Worksheet with three figures", "Timer running", "Expected answers", "If yours differs"],
    cut: "Do figures 1 and 2 only; show figure 3's answer.",
    appendixRoutes: [],
  },

  "what-drove-it": {
    purpose: "Split the change against 2024 into drivers, per method, and rewrite the AI's reason from the driver lines.",
    mode: "vote",
    clock: { start: "54:00", end: "59:30" },
    say: [
      "On press 2: in this case's teaching values, {drv_lb_grid_share_pct} of the location-based decrease is the lower grid factor. It is real, and it is not Kellbrunn's doing.",
      "On press 3: the market-based decrease is almost all the certificate for Werk Süd: {drv_mb_cert_share_pct}.",
      "Kellbrunn's own lower use is {drv_lb_own_t|absunit} location-based, and without production figures nobody can call that efficiency yet.",
      "On press 4: read the sentence. Every number in it has a driver line behind it.",
      "If someone quotes a fall of about {var_chg_vs_reported_pct|abs} since 2023: appendix A6.",
    ],
    sayAt: { 0: [2], 1: [3], 2: [3], 3: [4], 4: [4] },
    ask: [{ at: 1, text: "What made location-based emissions fall {chg_lb_t|absunit}?", options: ["Our efficiency measures", "A lower grid factor", "We produced less"], expected: "Most pick efficiency." }],
    expectedAudience: ["Most pick efficiency, which is the AI's claim."],
    revealOrder: ["Two bridges with both totals, and the struck AI sentence", "Room vote", "Location-based bridge", "Market-based bridge and caption", "Rewritten sentence"],
    cut: "Skip the market-based bridge; say the {drv_mb_cert_t|absunit} in one sentence.",
    appendixRoutes: ["appendix-baseline", "appendix-arithmetic"],
  },

  "ask-back": {
    purpose: "Sort five requests: calculate what the ledger supports, ask back where a person decides, refuse or rewrite claims the evidence cannot carry.",
    mode: "do",
    clock: { start: "59:30", end: "64:00" },
    say: [
      "A useful assistant does three different things: it calculates what the ledger supports, asks back where a person decides, and refuses claims the evidence cannot carry.",
      "On card 4: refuse it because nothing in the ledger supports it. Since 27 September 2026, Directive 2024/825 bans, towards consumers, generic environmental claims such as 'eco-friendly' unless recognised excellent environmental performance can be shown, and claims that a product is climate-neutral based on offsets (in Germany through an amendment to the UWG, known from secondary sources; check the current text). Whether your own website is aimed at consumers is a question for your lawyer. Misleading claims are banned towards business customers too (in Germany § 5 UWG).",
      "Must say: Not legal advice. Check the German transposition.",
      "On press 5: this is the answer we want from the raw folder. It raises seven points for a person before it commits to a number.",
    ],
    sayAt: { 0: [1], 1: [4], 2: [4], 3: [5] },
    ask: [{ at: 1, text: "Sort the five requests: calculate, ask back, refuse or rewrite.", aloud: true }],
    expectedAudience: ["Card 3 is often put under Calculate; answer: rewrite with the share and the site.", "Card 5 splits the room."],
    revealOrder: ["Three empty columns", "Five unsorted cards", "Calculate column", "Ask back column", "Refuse or rewrite column", "Target ask-back answer"],
    cut: "Use cards 1, 3 and 4 only.",
    appendixRoutes: ["appendix-claims", "appendix-regulation", "appendix-baseline"],
  },

  limits: {
    purpose: "Say in plain words what the session does not show.",
    mode: "listen",
    clock: { start: "64:00", end: "66:30" },
    say: [
      "Today does not show that any tool gets this right or wrong in general.",
      "On press 3: the ledger lets you check a number against its bill. If the bill is wrong, the ledger carries the error, and it knows nothing about sources nobody put in the folder. Write what you did not check on the page itself.",
      "Must say: Not legal or audit advice.",
    ],
    sayAt: { 0: [0], 1: [2], 2: [4] },
    ask: [],
    expectedAudience: [],
    revealOrder: ["Row 1", "Row 2", "Row 3", "Row 4", "Row 5"],
    cut: "Read rows 1, 3 and 5.",
    appendixRoutes: ["appendix-regulation", "appendix-run-record"],
  },

  "your-bill": {
    purpose: "Each person fills the five boxes for one bill of their own, then compares with a partner.",
    mode: "write",
    clock: { start: "66:30", end: "73:30" },
    say: [
      "Must say: No company data goes into any tool today.",
      "Take one bill you know from work, or invent a realistic one. Fill the five boxes: where it comes from, which period, which unit, whether it is inside your boundary, and which factor with which year.",
      "On press 6: tell your neighbour which box was hardest. Two pairs share with the room.",
    ],
    sayAt: { 0: [0], 1: [1], 2: [6] },
    ask: [{ at: 6, text: "Which box was hardest?", aloud: true }],
    expectedAudience: ["Boundary and factor are the usual hardest boxes."],
    revealOrder: ["Sheet with example", "Box 1 Source", "Box 2 Period", "Box 3 Unit", "Box 4 Boundary", "Box 5 Factor", "Pair share"],
    cut: "Pairs only, no room sharing.",
    appendixRoutes: [],
  },

  resolution: {
    purpose: "Close the loop: both answers, the number ladder, the same vote as at the start, four questions to take home.",
    mode: "vote",
    clock: { start: "73:30", end: "76:30" },
    say: [
      "At the start many of you would have sent the first number. It was close to right, and its explanation was wrong.",
      "On press 2: read the ladder. The change moved {chg_lb_pp_shift} points, from {wrong_chg_lb_pct} to {chg_lb_pct}. The explanation moved from 'efficiency' to 'mostly the grid factor'.",
      "On press 3: same vote as at the start.",
      "On press 4: four questions for any AI tool you are offered. Then point to the materials link and stop talking.",
    ],
    sayAt: { 0: [1], 1: [2], 2: [3], 3: [4] },
    ask: [{ at: 3, text: "Send the raw-folder answer to the bank now?", options: ["Send", "Ask back first", "Refuse"], expected: "Almost no one sends." }],
    expectedAudience: ["Compare with the hands at scene 6."],
    revealOrder: ["Question card", "Both answers side by side", "Number ladder", "Callback vote", "Four questions and the materials link"],
    cut: "Skip the ladder; do the vote.",
    appendixRoutes: [],
  },
};
