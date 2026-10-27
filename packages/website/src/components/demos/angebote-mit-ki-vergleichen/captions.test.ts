import { describe, expect, it } from "vitest";
import { kitRows, STACK } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/config";
import { COPY } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import { demoReducer, FREE_START, INITIAL_STATE, type Action, type DemoState } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/demo-state";
import { SECOND_CASE_CSV } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/kit-data";
import { parse } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stack";
import type { View } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stage";
import { captionFor, deciderSentence, freeSentence, ownCaption, paperCaption, paperReadout, type TermStage } from "./captions";
import { formatter } from "./fmt";

const de = COPY.de;
const en = COPY.en;
const fde = formatter("de");
const fen = formatter("en");
const kit = kitRows("de");
const run = (...actions: Action[]) => actions.reduce<DemoState>(demoReducer, INITIAL_STATE);
const caption = (view: View, state: DemoState, termStage: TermStage = "trucks", paid = false) =>
  captionFor(de, fde, { view, state, kit, termStage, paid, own: null, second: false }).join(" ");
const toMove = (n: number) => run(...Array.from({ length: n }, () => ({ type: "nextMove" }) as const));

describe("captions of the guided path, German", () => {
  it("names the guess and the per-box prices", () => {
    expect(caption("tipp", run({ type: "guess", key: "B" }))).toContain("Du hast B Poznań gewählt.");
    expect(caption("kipp", run({ type: "qty" }, { type: "nextMove" }, { type: "unit", unit: "piece" }))).toContain("kostet B 0,520\u00a0€, C 0,575\u00a0€ und A 0,660\u00a0€");
  });

  it("starts the next field with what to do, not with a note about the skipped one", () => {
    expect(caption("kipp", toMove(1))).not.toContain("übernommen");
  });

  it("counts B's trucks and pallets, then the gap to C", () => {
    const sorted = run({ type: "nextMove" }, { type: "nextMove" }, { type: "term", key: "A", payer: "supplier" }, { type: "term", key: "C", payer: "buyer" }, { type: "term", key: "B", payer: "supplier" });
    expect(caption("kipp", sorted, "trucks")).toBe(
      "Nicht ganz. Die Feldkarte sagt zu EXW Poznań: „Du holst ab und verlädst. Fracht und Verladung zahlst du.“ Brandtwerk holt in Poznań selbst ab, und jeder Auftrag umfasst 20.000 Stück. Das sind 2 Fahrten zu je 1.400 €, zusammen 2.800 € Fracht im Jahr.",
    );
    expect(caption("kipp", sorted, "pallets")).toContain("Die übrigen 10 Paletten stehen extern und kosten 1.920 € im Jahr.");
    expect(caption("kipp", sorted, "done")).toContain("B nur noch 80 € günstiger als C");
  });

  it("finds B's footnote and ends at the kit's result with the guess", () => {
    const found = run({ type: "guess", key: "B" }, { type: "nextMove" }, { type: "nextMove" }, { type: "nextMove" }, { type: "find", key: "B" });
    expect(caption("kipp", found)).toContain("eine Stanzform für 1.450 €");
    const paid = run({ type: "guess", key: "B" }, ...Array.from({ length: 4 }, () => ({ type: "nextMove" }) as const));
    expect(caption("kipp", paid, "done", false)).toContain("Skonto ist ein Nachlass");
    expect(caption("kipp", paid, "done", true)).toBe(
      "Geliefert und bezahlt, also mit allem bis ins Werk und bis zur Zahlung, kostet C im Jahr 24.910 €. Das sind 962 € weniger als bei A, und B ist mit 26.554 € das teuerste Angebot, obwohl sein Stückpreis der niedrigste ist. Deine Schätzung war B Poznań.",
    );
    expect(caption("kipp", demoReducer(paid, { type: "discount", on: false }))).toContain("kostet C 25.600 €, A 26.400 € und B 26.970 €");
  });

  it("names the deciding line of the method", () => {
    expect(deciderSentence(de, fde, kit)).toContain("C ist dort 3.400 € günstiger, A spart dafür 2.600 € Fracht.");
  });
});

describe("captions of the paper price", () => {
  it("says the lead, the turning point and freight at 10 %", () => {
    expect(paperCaption(de, fde, kit, { ...INITIAL_STATE, v: 3 }).join(" ")).toBe("Bei 3 Prozent Anstieg ist C noch 548 € günstiger als A.");
    expect(paperCaption(de, fde, kit, { ...INITIAL_STATE, v: 7 }).join(" ")).toContain("Ab 6,97 Prozent Anstieg ist A günstiger als C. Dann ist der Zuschlag größer als der Vorsprung von 962 €");
    expect(paperCaption(de, fde, kit, { ...INITIAL_STATE, v: 10 }).join(" ")).toContain("ist A im Jahr 418 € günstiger als C");
    expect(paperReadout(en, fen, kit, 10, null)).toBe("A is now €418 cheaper than C.");
  });

  it("caps C at 25.600 € with a cap of 5 %", () => {
    expect(paperCaption(de, fde, kit, { ...INITIAL_STATE, v: 10, cap: 5 }).join(" ")).toContain("kostet C höchstens 25.600 € im Jahr");
    expect(paperCaption(de, fde, kit, { ...INITIAL_STATE, v: 10, cap: 8 }).join(" ")).toContain("Ein Deckel bei 8 Prozent liegt über 6,97 Prozent.");
  });
});

describe("own offers and free play", () => {
  const second = parse(SECOND_CASE_CSV, "de", STACK).rows;
  it("gives the second case's result and an open line", () => {
    expect(ownCaption(de, fde, second, true).join(" ")).toContain("X Kassel ist geliefert und bezahlt 332 € günstiger");
    const open = second.filter((row) => !(row.option === "Y Leipzig" && row.line === "Fracht"));
    expect(ownCaption(de, fde, open, false).join(" ")).toContain("Y Leipzig nennt keine Zeile Fracht.");
  });

  it("answers the two key states of free play", () => {
    const free = (patch: Partial<DemoState["free"]>) => ({ ...INITIAL_STATE, free: { ...FREE_START, ...patch } });
    expect(freeSentence(de, fde, free({}), kit, null)).toContain("Stell auf „Je Stück“ um.");
    expect(freeSentence(de, fde, free({ unit: "piece" }), kit, null)).toBe(
      "Kein einzelnes Feld ändert, welches Angebot am günstigsten ist. Erst wenn du zur Lieferklausel noch die Einmalkosten oder das Skonto dazuschaltest, ist C Brno am günstigsten.",
    );
    expect(freeSentence(de, fde, free({ unit: "piece", fields: ["lieferort", "einmalig", "zahlung"] }), kit, null)).toBe("Lässt du die Lieferklausel weg, ist B Poznań am günstigsten statt C Brno.");
    expect(freeSentence(en, fen, free({ unit: "piece", fields: ["lieferort", "einmalig", "zahlung"] }), kit, null)).toBe("If you leave out the delivery term, B Poznań is cheapest instead of C Brno.");
  });
});
