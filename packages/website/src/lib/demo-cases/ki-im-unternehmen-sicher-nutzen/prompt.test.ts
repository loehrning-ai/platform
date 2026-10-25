import { describe, expect, it } from "vitest";
import { COPY } from "./copy";
import { buildPrompt, buildNote, formatDate, replacedList } from "./prompt";
import { buildRedaction, cleanText, keyTable, restScan } from "./redact";
import { SAMPLES } from "./samples";
import type { Hit } from "./types";

const date = { year: 2026, month: 10, day: 23 };
const make = (locale: "de" | "en", index: number, extra: readonly Hit[] = [], kept: ReadonlySet<string> = new Set()) =>
  buildRedaction(SAMPLES[locale][index]!.text, extra, kept, COPY[locale].labels);

describe("prompt", () => {
  it("builds Ana's prompt exactly as the spec shows it", () => {
    const r = make("de", 0);
    const prompt = buildPrompt(cleanText(r), SAMPLES.de[0].task, { rules: COPY.de.take.rules, fallbackTask: COPY.de.take.fallbackTask });
    expect(prompt).toBe(
      [
        "Du bist Support-Mitarbeiter:in bei einem Dienstleister. Schreibe eine ruhige Antwort mit höchstens 90 Wörtern auf die E-Mail unten.",
        "Lass die Platzhalter in eckigen Klammern exakt so stehen. Erfinde keine Angaben, Daten oder Beträge. Beende mit einer Frage, die ich vor dem Senden prüfen sollte.",
        "",
        "Hallo, meine Bestellung [BESTELLUNG] ist nie angekommen. Mein Name ist [KUNDE], ich wohne [ADRESSE]. Bitte schreiben Sie an [E-MAIL]. Das ist das zweite Mal.",
      ].join("\n"),
    );
  });

  it("falls back to a neutral first sentence for custom text", () => {
    const r = make("en", 0);
    const prompt = buildPrompt(cleanText(r), "   ", { rules: COPY.en.take.rules, fallbackTask: COPY.en.take.fallbackTask });
    expect(prompt.startsWith("Work on the text below.\nKeep the placeholders")).toBe(true);
  });

  it("never holds an original value, in either language and for every sample", () => {
    for (const locale of ["de", "en"] as const) {
      for (const [index, sample] of SAMPLES[locale].entries()) {
        const r = make(locale, index);
        const pack = COPY[locale];
        const prompt = buildPrompt(cleanText(r), sample.task, { rules: pack.take.rules, fallbackTask: pack.take.fallbackTask });
        const note = buildNote(r, sample.account, restScan(r), date, pack.take.note);
        for (const hit of r.hits) {
          expect(prompt, `${locale} ${sample.id} prompt`).not.toContain(hit.value);
          expect(note, `${locale} ${sample.id} note`).not.toContain(hit.value);
        }
      }
    }
  });
});

describe("record (Vermerk)", () => {
  it("matches the spec examples for Ana on Team, in German and English", () => {
    const de = make("de", 0);
    expect(buildNote(de, "team", restScan(de), date, COPY.de.take.note)).toBe(
      "Schleuse, 23.10.2026. Konto: Firmenkonto (Team). Ersetzt: 1 Name, 1 Bestellnummer, 1 Adresse, 1 E-Mail. Rest-Scan: 0 Muster. Mustererkennung ist kein Beweis, gegengelesen von: ______.",
    );
    const en = make("en", 0);
    expect(buildNote(en, "team", restScan(en), date, COPY.en.take.note)).toBe(
      "Airlock, 2026-10-23. Account: company (Team). Replaced: 1 name, 1 order number, 1 address, 1 e-mail. Rest scan: 0 patterns. Pattern matching is not proof, read back by: ______.",
    );
  });

  it("uses plurals and counts distinct originals (Mila: two amounts, one IBAN written twice)", () => {
    expect(replacedList(make("de", 2), COPY.de.take.note)).toBe("1 IBAN, 2 Beträge");
    expect(replacedList(make("en", 2), COPY.en.take.note)).toBe("1 IBAN, 2 amounts");
  });

  it("counts a hand-made item as its own noun and leaves kept hits out", () => {
    const base = make("de", 0);
    const email = base.hits.find((h) => h.kind === "email") as Hit;
    const text = SAMPLES.de[0].text;
    const at = text.indexOf("zweite");
    const manual: Hit = { id: `manual:${at}`, kind: "manual", start: at, end: at + 6, value: "zweite", check: "visitor" };
    const r = buildRedaction(text, [manual], new Set([email.id]), COPY.de.take.note ? COPY.de.labels : COPY.de.labels);
    expect(replacedList(r, COPY.de.take.note)).toBe("1 Name, 1 Bestellnummer, 1 Adresse, 1 Angabe von Hand");
  });

  it("says nothing was replaced when nothing was", () => {
    const r = buildRedaction("Hallo Welt", [], new Set(), COPY.de.labels);
    expect(replacedList(r, COPY.de.take.note)).toBe("nichts");
  });

  it("formats dates by language", () => {
    expect(formatDate({ year: 2026, month: 1, day: 5 }, "dmy")).toBe("05.01.2026");
    expect(formatDate({ year: 2026, month: 1, day: 5 }, "iso")).toBe("2026-01-05");
  });
});

describe("record, key and prompt agree (Mila)", () => {
  it("counts each kind as many times as the key has rows and the prompt has distinct tokens", () => {
    for (const locale of ["de", "en"] as const) {
      const r = make(locale, 2);
      const key = keyTable(r);
      const note = buildNote(r, "enterprise", restScan(r), date, COPY[locale].take.note);
      const clean = cleanText(r);
      const ibans = key.filter((row) => row.label.startsWith(COPY[locale].labels.iban));
      expect(ibans).toHaveLength(1);
      expect(clean.match(/\[IBAN\]/g)).toHaveLength(2);
      expect(note).toContain(locale === "de" ? "1 IBAN," : "1 IBAN,");
      expect(note).not.toContain("2 IBAN");
      const amounts = key.filter((row) => row.label.startsWith(COPY[locale].labels.amount));
      expect(amounts).toHaveLength(2);
      expect(note).toContain(locale === "de" ? "2 Beträge" : "2 amounts");
    }
  });
});
