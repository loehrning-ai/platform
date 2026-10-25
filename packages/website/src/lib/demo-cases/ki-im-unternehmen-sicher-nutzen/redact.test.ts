import { describe, expect, it } from "vitest";
import { detect } from "./detect";
import {
  buildRedaction,
  cleanText,
  joinSegments,
  keyTable,
  replay,
  restScan,
  splitWords,
  toggleManual,
} from "./redact";
import { SAMPLES } from "./samples";
import type { Hit, KindLabels } from "./types";

const DE: KindLabels = {
  person: "KUNDE", order: "BESTELLUNG", ref: "NUMMER", address: "ADRESSE", email: "E-MAIL",
  phone: "TELEFON", iban: "IBAN", amount: "BETRAG", secret: "SCHLÜSSEL", manual: "ANGABE",
};
const EN: KindLabels = {
  person: "CUSTOMER", order: "ORDER", ref: "NUMBER", address: "ADDRESS", email: "EMAIL",
  phone: "PHONE", iban: "IBAN", amount: "AMOUNT", secret: "KEY", manual: "ITEM",
};
const build = (text: string, extra: readonly Hit[] = [], kept: ReadonlySet<string> = new Set(), labels = DE) =>
  buildRedaction(text, extra, kept, labels);

const ana = SAMPLES.de[0].text;
const ANA_CLEAN =
  "Hallo, meine Bestellung [BESTELLUNG] ist nie angekommen. Mein Name ist [KUNDE], ich wohne [ADRESSE]. Bitte schreiben Sie an [E-MAIL]. Das ist das zweite Mal.";

describe("placeholders and clean text", () => {
  it("replaces Ana's four details exactly as the prompt body of the spec", () => {
    expect(cleanText(build(ana))).toBe(ANA_CLEAN);
  });

  it("uses the English words and the kit's own placeholders", () => {
    expect(cleanText(build(SAMPLES.en[0].text, [], new Set(), EN))).toBe(
      "Hello, my order [ORDER] never arrived. My name is [CUSTOMER], I live at [ADDRESS]. Please write to [EMAIL]. This is the second time.",
    );
  });

  it("gives the same value the same token and numbers distinct values by first appearance", () => {
    const mila = build(SAMPLES.de[2].text);
    expect(cleanText(mila)).toBe(
      "Rechnung 2026-117, Tannwald Haustechnik GmbH, [BETRAG_1], IBAN [IBAN]\nRechnung 2026-118, Tannwald Haustechnik GmbH, [BETRAG_2], IBAN [IBAN]",
    );
    expect(keyTable(mila).map((row) => row.token)).toEqual(["[BETRAG_1]", "[IBAN]", "[BETRAG_2]"]);
  });

  it("leaves a kept hit raw and out of the placeholders", () => {
    const r = build(ana);
    const email = r.hits.find((h) => h.kind === "email") as Hit;
    const kept = build(ana, [], new Set([email.id]));
    expect(cleanText(kept)).toContain("mara.beispiel@example.com");
    expect(kept.placeholders).toHaveLength(3);
    expect(restScan(kept)).toBe(0);
  });
});

describe("rest scan", () => {
  it("is 0 on the clean text of every sample, in both languages", () => {
    for (const [locale, labels] of [["de", DE], ["en", EN]] as const) {
      for (const sample of SAMPLES[locale]) expect(restScan(build(sample.text, [], new Set(), labels)), sample.id).toBe(0);
    }
  });

  it("never re-detects a placeholder", () => {
    for (const token of ["[KUNDE]", "[IBAN]", "[BETRAG_1]", "[SCHLÜSSEL]", "[E-MAIL]", "[ORDER]", "[CUSTOMER]", "[ITEM]"]) {
      expect(detect(`Mein Name ist ${token}, Herr ${token}, wohnt ${token}`)).toEqual([]);
    }
  });

  it("does not see the company name in Mila's list, and a tap fixes it", () => {
    const text = SAMPLES.de[2].text;
    const start = text.indexOf("Tannwald");
    const words = splitWords(text).filter((w) => w.start >= start && w.end <= start + "Tannwald Haustechnik GmbH".length);
    const manual = words.reduce<readonly Hit[]>((acc, word) => toggleManual(text, acc, word), []);
    expect(manual).toHaveLength(1);
    expect(manual[0]?.value).toBe("Tannwald Haustechnik GmbH");
    expect(cleanText(build(text, manual))).toContain("[ANGABE]");
  });
});

describe("manual hits", () => {
  it("toggles a word, merges neighbours and removes the whole merged hit on a tap", () => {
    const text = "Alice Smith lebt hier";
    const [alice, smith] = splitWords(text);
    const one = toggleManual(text, [], alice!);
    const two = toggleManual(text, one, smith!);
    expect(two.map((h) => h.value)).toEqual(["Alice Smith"]);
    expect(toggleManual(text, two, alice!)).toEqual([]);
  });

  it("is a new array each time", () => {
    const base: readonly Hit[] = [];
    const next = toggleManual("ab cd", base, { start: 0, end: 2 });
    expect(next).not.toBe(base);
    expect(base).toHaveLength(0);
  });
});

describe("key table and replay", () => {
  const r = build(ana);
  const key = keyTable(r);

  it("lists one row per distinct original", () => {
    expect(key.map((k) => `${k.token}=${k.original}`)).toEqual([
      "[BESTELLUNG]=TH-1042",
      "[KUNDE]=Mara Beispiel",
      "[ADRESSE]=Beispielweg 7, 99999 Musterstadt",
      "[E-MAIL]=mara.beispiel@example.com",
    ]);
  });

  it("round-trips every sample", () => {
    for (const [locale, labels] of [["de", DE], ["en", EN]] as const) {
      for (const sample of SAMPLES[locale]) {
        const redaction = build(sample.text, [], new Set(), labels);
        const back = replay(cleanText(redaction), keyTable(redaction));
        expect(joinSegments(back.segments), `${locale} ${sample.id}`).toBe(sample.text);
        expect(back.notFound).toEqual([]);
      }
    }
  });

  it("is tolerant about bracket style, case, folding and wrappers", () => {
    const answer = "Guten Tag **[Kunde]**, Ihre (Bestellung) {e mail} <E-Mail> «Adresse» [e-mail]";
    const out = replay(answer, key);
    expect(joinSegments(out.segments)).toBe(
      "Guten Tag **Mara Beispiel**, Ihre TH-1042 mara.beispiel@example.com mara.beispiel@example.com Beispielweg 7, 99999 Musterstadt mara.beispiel@example.com",
    );
    expect(out.restored).toBe(6);
  });

  it("folds umlauts and accepts _1, space and dash suffixes", () => {
    const secret = build('x "sk_live_DEMO-4711-FAKE-KEY" y "sk_test_DEMO-1234-FAKE" z', [], new Set(), DE);
    const k = keyTable(secret);
    expect(k.map((e) => e.token)).toEqual(["[SCHLÜSSEL_1]", "[SCHLÜSSEL_2]"]);
    const out = replay("[Schluessel_1] [SCHLÜSSEL 2] [Schlüssel-1] SCHLÜSSEL_2", k);
    expect(out.restored).toBe(4);
    expect(out.segments.filter((s) => s.token).map((s) => s.token)).toEqual([
      "[SCHLÜSSEL_1]", "[SCHLÜSSEL_2]", "[SCHLÜSSEL_1]", "[SCHLÜSSEL_2]",
    ]);
  });

  it("never touches the prose word Kunde or an unbracketed token without a number", () => {
    const out = replay("Der Kunde und KUNDE warten auf die Adresse.", key);
    expect(out.restored).toBe(0);
    expect(joinSegments(out.segments)).toBe("Der Kunde und KUNDE warten auf die Adresse.");
  });

  it("reports ambiguous, unknown and missing tokens instead of swallowing them", () => {
    const mila = build(SAMPLES.de[2].text);
    const out = replay("Summe [BETRAG] und [IBAN_3] und [IBAN]", keyTable(mila));
    expect(out.ambiguous).toEqual(["[BETRAG]"]);
    expect(out.unknown).toEqual(["[IBAN_3]"]);
    expect(out.notFound).toEqual(["[BETRAG_1]", "[BETRAG_2]"]);
    expect(joinSegments(out.segments)).toBe(`Summe [BETRAG] und [IBAN_3] und DE89 3704 0044 0532 0130 00`);
  });

  it("lists tokens the answer dropped", () => {
    expect(replay("Guten Tag [KUNDE].", key).notFound).toEqual(["[BESTELLUNG]", "[ADRESSE]", "[E-MAIL]"]);
  });
});
