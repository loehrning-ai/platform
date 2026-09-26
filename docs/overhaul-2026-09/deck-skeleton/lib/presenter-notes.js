/* Presenter notes for the Workshop 04 deck, keyed by each scene's data-note-key.
   Every entry needs revealOrder (one line per step, 0 = scene entry) and cut: the console calls
   revealOrder.join() and prints cut. sayAt maps a say[] index to the step(s) it belongs to; ask[]
   items are { at, text, options?, expected?, aloud? } (no `aloud` = an on-screen room vote card). */
window.FOLDLINE_PRESENTER_NOTES = Object.freeze({
  "cover": {
    "clock": { "start": "00:00", "end": "00:45", "budget_seconds": 45 },
    "mode": "Opening",
    "purpose": "Fix the one question the session keeps asking.",
    "say": [
      "Presenter cue: start talking, the clock starts on your first press.",
      "Read the question once, slowly. We keep it fixed for the whole session.",
      "On press 1: raw inputs, one checked table, a clear statement. That is the whole plan."
    ],
    "sayAt": { "0": [0], "1": [0], "2": [1] },
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Title, date line, the question card and the footer",
      "The three stamps: raw inputs, one checked table, a clear statement"
    ],
    "cut": "No expansion; advance at 00:45.",
    "appendixRoutes": []
  },
  "raw-inputs": {
    "clock": { "start": "00:45", "end": "04:45", "budget_seconds": 240 },
    "mode": "Setup · synthetic numbers",
    "purpose": "Show that one reported figure depends on three different files.",
    "say": [
      "Every ESG number starts as files. Before any AI, name them.",
      "On press 1: the invoices. Twelve PDFs, one per month.",
      "On press 2: the meter export. Same electricity, different file.",
      "On press 3: the emission factor, then the calculation. 452,300 times 0.366 is 165.5 tonnes.",
      "If asked: the invoices and the meter differ by 1.2 percent. Pick one and write down which."
    ],
    "sayAt": { "0": [0], "1": [1], "2": [2], "3": [3] },
    "ask": [
      { "at": 0, "text": "Where does your company's electricity number come from?", "aloud": true }
    ],
    "expectedAudience": ["Most people do not know which file the number comes from."],
    "revealOrder": [
      "Title and lead",
      "Card 1: invoices",
      "Card 2: meter export",
      "Card 3: emission factor, the connector and the result stamp (165.5 t CO₂e)"
    ],
    "cut": "Skip the aloud question; keep the three presses.",
    "appendixRoutes": []
  },
  "compare": {
    "clock": { "start": "04:45", "end": "09:45", "budget_seconds": 300 },
    "mode": "Comparison",
    "purpose": "Let the room see what an unchecked summary leaves out.",
    "say": [
      "Same inputs on both sides. Only the write-up changes.",
      "On press 1: the first AI draft. Ask the room what is missing before you read the list.",
      "On press 2: the checked version. Every number points to a file."
    ],
    "sayAt": { "0": [0], "1": [1], "2": [2] },
    "ask": [
      { "at": 1, "text": "Would you sign the left summary?", "options": ["Yes", "No", "Not sure"], "expected": "Mostly no, some not sure." }
    ],
    "expectedAudience": [],
    "revealOrder": [
      "Both column heads",
      "Left: the draft quote, what it lacks, and the fail chip",
      "Right: the checked quote, its sources, and the pass chip"
    ],
    "cut": "Skip the vote; show both columns.",
    "appendixRoutes": []
  },
  "end": {
    "clock": { "start": "09:45", "end": "11:45", "budget_seconds": 120 },
    "mode": "Close",
    "purpose": "Leave three rules and the materials link.",
    "say": [
      "Three rules. Read them once.",
      "On press 1: point to the materials link and stop talking."
    ],
    "sayAt": { "0": [0], "1": [1] },
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Three take-home rules",
      "The closing stamp and the materials line"
    ],
    "cut": "Read the rules only.",
    "appendixRoutes": []
  }
});
