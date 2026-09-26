// Presenter notes for the Workshop 04 appendix (SPEC.md §2.4, §9, §10). Appendix scenes are shown
// on request only: revealOrder ["Whole scene"], cut "Appendix; show on request."

const appendix = (purpose, say) => ({
  purpose,
  mode: "listen",
  clock: {},
  say,
  sayAt: Object.fromEntries(say.map((_, i) => [i, [0]])),
  ask: [],
  expectedAudience: [],
  revealOrder: ["Whole scene"],
  cut: "Appendix; show on request.",
  appendixRoutes: [],
});

export default {
  "appendix-arithmetic": appendix("Every line of the case arithmetic, for questions like 'where does 1,422 come from?'.", [
    "Point to the line that answers the question; every figure here is also in the kit file erwartet/ergebnisse_2025.md.",
    "Totals are computed from unrounded values and rounded once. The location-based shares are rounded one by one, which is why only the top three are shown.",
  ]),
  "appendix-factors": appendix("Where real factors come from, and what to record about each one.", [
    "The case uses teaching values so everyone can check the arithmetic. None of them is an official factor.",
    "For a real inventory, record source, edition, year, region, basis and licence for every factor, and check the licence before you paste values into an external tool.",
    "The UBA values come from search summaries read on 26 September 2026, and UBA revises earlier years; re-check them before quoting.",
  ]),
  "appendix-run-record": appendix("How the two answers were produced, and what is still missing.", [
    "Both answers on the slides are constructed. The raw-folder answer shows what happens when all six traps fire; it is not a recorded run.",
    "Before publication both conditions are run five times each with the protocol in the kit, and this table is filled from the runs.",
  ]),
  "appendix-regulation": appendix("What is true about the rules on 26 September 2026, with the items that need a check before the session.", [
    "Read the date first: this page is the state of 26 September 2026.",
    "Do not claim that Germany has, or has not, finished transposing the CSRD, or how the German UWG amendment reads in detail.",
    "Do not claim that AI output, or this ledger, is audit-ready or produces a compliant report.",
    "Do not claim that the teaching factors or any factor quoted from memory are official values, or that new Scope 2 rules already apply.",
    "Must say: Not legal advice. Check the German transposition.",
  ]),
  "appendix-claims": appendix("Each sentence of the raw-folder answer against the evidence.", [
    "Two of the six sentences are false, not only imprecise: the green electricity claim and the rise in Scope 1.",
    "The per-employee figure looked like a check, but it was computed from the same wrong total.",
  ]),
  "appendix-baseline": appendix("A separate teaching variant: restating the base year after a divestment.", [
    "This variant does not connect to the 2024 comparison in the main case.",
    "Lead with the restated base year and the like-for-like change. The unrestated figure only shows what the comparison would wrongly claim.",
  ]),
  "appendix-steel": appendix("Scope 3 from a supplier's reply: which of the three numbers to use.", [
    "Only the product footprint describes the steel Kellbrunn bought. The supplier's own Scope 1 and 2 intensity leaves out most of the steel's footprint.",
    "Spend-based figures move with prices: the tonnage stayed flat while the nominal spend rose.",
  ]),
  "appendix-scope2-order": appendix("The market-based order: which rate applies to which kilowatt hour.", [
    "Certificates first, for the kilowatt hours they cover; then a qualifying supplier rate; then the residual mix for the rest.",
    "The kit's bills leave out the Stromkennzeichnung, so step 2 is empty in this case. Real bills carry it.",
  ]),
  "appendix-sources": appendix("The sources behind the rules, dates and published figures in this workshop.", [
    "All links were read on 26 September 2026. Items marked secondary or unverified on the rules page need a check before the session.",
  ]),
};
