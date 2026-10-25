import { describe, expect, it } from "vitest";
import { companySpans, detect, entropy, ibanMod97, skippedNames } from "./detect";
import { SAMPLES } from "./samples";

const kinds = (text: string) => detect(text).map((h) => `${h.kind}=${h.value}`);

describe("detect: one positive and one near-miss per kind", () => {
  it("finds e-mail addresses, not a bare @", () => {
    expect(kinds("write to a.b-c@example.org.")).toEqual(["email=a.b-c@example.org"]);
    expect(kinds("meet @ noon at home")).toEqual([]);
  });

  it("accepts an IBAN only when mod-97 passes", () => {
    expect(kinds("IBAN DE89 3704 0044 0532 0130 00 ok")).toEqual(["iban=DE89 3704 0044 0532 0130 00"]);
    expect(kinds("IBAN DE89370400440532013000")).toEqual(["iban=DE89370400440532013000"]);
    expect(kinds("IBAN DE89 3704 0044 0532 0130 01")).toEqual([]);
    expect(ibanMod97("DE89370400440532013000")).toBe(true);
    expect(ibanMod97("DE89370400440532013001")).toBe(false);
  });

  it("does not over-reach past the IBAN into following capitals", () => {
    expect(kinds("DE89 3704 0044 0532 0130 00 ABC")).toEqual(["iban=DE89 3704 0044 0532 0130 00"]);
  });

  it("finds phone numbers, not invoice numbers", () => {
    expect(kinds("ruf an: +49 170 1234567.")).toEqual(["phone=+49 170 1234567"]);
    expect(kinds("ruf an: 030 1234567")).toEqual(["phone=030 1234567"]);
    expect(kinds("tel. 2026-117")).toEqual([]);
  });

  it("splits order numbers from other references by their context", () => {
    expect(kinds("Bestellung TH-1042 fehlt")).toEqual(["order=TH-1042"]);
    expect(kinds("my order TH-1042 is late")).toEqual(["order=TH-1042"]);
    expect(kinds("Kundennr. KD-20417")).toEqual(["ref=KD-20417"]);
    expect(kinds("Norm ISO 9001")).toEqual([]);
  });

  it("finds keys by prefix, by assignment and by entropy, not long words", () => {
    expect(kinds('key "sk_live_DEMO-4711-FAKE-KEY"')).toEqual(["secret=sk_live_DEMO-4711-FAKE-KEY"]);
    expect(kinds("password: hunter2hunter2")).toEqual(["secret=hunter2hunter2"]);
    expect(kinds("x 7fQ9aZ2kLm4Xp8Rt1WvB3nYc6 y")).toEqual(["secret=7fQ9aZ2kLm4Xp8Rt1WvB3nYc6"]);
    expect(kinds("Donaudampfschifffahrtsgesellschaft")).toEqual([]);
    expect(entropy("aaaa")).toBe(0);
  });

  it("finds addresses and merges street, postcode and place", () => {
    expect(kinds("ich wohne Beispielweg 7, 99999 Musterstadt.")).toEqual(["address=Beispielweg 7, 99999 Musterstadt"]);
    expect(kinds("Hauptstraße 12a")).toEqual(["address=Hauptstraße 12a"]);
    expect(kinds("I live at 12 Baker Street, 10115 Berlin.")).toEqual(["address=12 Baker Street, 10115 Berlin"]);
    expect(kinds("Der Weg 7 ist weit")).toEqual([]);
    expect(kinds("Betrag 12345 Euro")).toEqual(["amount=12345 Euro"]);
  });

  it("finds names only after a salutation or an introduction", () => {
    expect(kinds("Mein Name ist Mara Beispiel, ich")).toEqual(["person=Mara Beispiel"]);
    expect(kinds("Hr. Beispiel, Kundennr.")).toEqual(["person=Beispiel"]);
    expect(kinds("Mr. Beispiel")).toEqual(["person=Beispiel"]);
    expect(kinds("Mara Beispiel schrieb")).toEqual([]);
    expect(kinds("Ich heiße alle willkommen")).toEqual([]);
  });

  it("takes stacked titles and the name as ONE hit, never splitting on an abbreviation dot", () => {
    expect(kinds("Frau Dr. Schmidt (Tel")).toEqual(["person=Dr. Schmidt"]);
    expect(kinds("Herr Prof. Dr. Müller schrieb")).toEqual(["person=Prof. Dr. Müller"]);
    expect(kinds("Mr. Smith called")).toEqual(["person=Smith"]);
    expect(kinds("Frau Dipl.-Ing. Anna Weber meldet")).toEqual(["person=Dipl.-Ing. Anna Weber"]);
    expect(kinds("Herr Prof Dr Meier")).toEqual(["person=Prof Dr Meier"]);
    expect(kinds("Frau Schmidt. Bitte rufen Sie an")).toEqual(["person=Schmidt"]);
    expect(kinds("Frau Dr. ist weg")).toEqual([]);
  });

  it("counts capitalised word pairs no hit covers, so the screen can ask for a tap", () => {
    expect(skippedNames("Hans Meier schrieb", detect("Hans Meier schrieb"))).toBe(1);
    const text = "Frau Dr. Schmidt schrieb";
    expect(skippedNames(text, detect(text))).toBe(0);
    expect(skippedNames("meine bestellung ist spät", [])).toBe(0);
  });

  it("finds amounts in both notations, not bare numbers", () => {
    expect(kinds("4.820,00 EUR")).toEqual(["amount=4.820,00 EUR"]);
    expect(kinds("EUR 4,820.00")).toEqual(["amount=EUR 4,820.00"]);
    expect(kinds("249,00 €")).toEqual(["amount=249,00 €"]);
    expect(kinds("1042 EUR")).toEqual(["amount=1042 EUR"]);
    expect(kinds("Version 4.820")).toEqual([]);
  });

  it("keeps the longer hit when two overlap and returns sorted, non-overlapping hits", () => {
    const hits = detect("Mail mara.beispiel@example.com, IBAN DE89 3704 0044 0532 0130 00, 249,00 EUR");
    expect(hits.map((h) => h.kind)).toEqual(["email", "iban", "amount"]);
    for (let i = 1; i < hits.length; i += 1) expect(hits[i]!.start).toBeGreaterThanOrEqual(hits[i - 1]!.end);
  });

  it("returns the source slice and a stable id", () => {
    const [hit] = detect("a TH-1042 b");
    expect(hit).toMatchObject({ id: "ref:2", value: "TH-1042", start: 2, end: 9 });
  });
});

describe("detect on the three samples", () => {
  const counts = { ana: 4, marko: 4, mila: 4 } as const;
  for (const locale of ["de", "en"] as const) {
    for (const sample of SAMPLES[locale]) {
      it(`${sample.id} (${locale}) has ${counts[sample.id]} hits`, () => {
        expect(detect(sample.text)).toHaveLength(counts[sample.id]);
      });
    }
  }

  it("Ana: order, person, address, e-mail", () => {
    expect(detect(SAMPLES.de[0].text).map((h) => h.kind)).toEqual(["order", "person", "address", "email"]);
    expect(detect(SAMPLES.en[0].text).map((h) => h.kind)).toEqual(["order", "person", "address", "email"]);
  });

  it("Marko: secret, person, reference, amount", () => {
    expect(detect(SAMPLES.de[1].text).map((h) => h.kind)).toEqual(["secret", "person", "ref", "amount"]);
    expect(detect(SAMPLES.en[1].text).map((h) => h.kind)).toEqual(["secret", "person", "ref", "amount"]);
  });

  it("Mila: two amounts and two IBANs, and the company name is NOT found", () => {
    for (const locale of ["de", "en"] as const) {
      const text = SAMPLES[locale][2].text;
      expect(detect(text).map((h) => h.kind)).toEqual(["amount", "iban", "amount", "iban"]);
      expect(detect(text).some((h) => h.value.includes("Tannwald"))).toBe(false);
    }
  });
});

describe("detect: names in a frame (intro, greeting, sign-off)", () => {
  const people = (text: string) => detect(text).filter((h) => h.kind === "person").map((h) => h.value);

  it("finds the name in 'ich bin <Name>' inside a typical pasted mail", () => {
    const text = "Hi, ich bin Jonas Weber aus Köln, tel +49 171 2345678, mail jonas@example.com, Rechnung RE-20417, Passwort: hunter2hunter2";
    expect(people(text)).toEqual(["Jonas Weber"]);
    expect(detect(text).map((h) => h.kind)).toEqual(["person", "phone", "email", "ref", "secret"]);
  });

  it("finds a single first name after the frame and stops before 'aus'", () => {
    expect(people("Hi, ich bin Jonas aus Köln.")).toEqual(["Jonas"]);
    expect(people("Hello, I am Priya Nair from Leeds.")).toEqual(["Priya Nair"]);
    expect(people("I'm Priya and I need help")).toEqual(["Priya"]);
  });

  it("finds greeted names, not greeted groups", () => {
    expect(people("Hallo Jonas, kurze Frage")).toEqual(["Jonas"]);
    expect(people("Liebe Anna Schmidt,\nanbei die Zahlen")).toEqual(["Anna Schmidt"]);
    expect(people("Dear Priya Nair, thanks")).toEqual(["Priya Nair"]);
    expect(people("Hallo Team, kurze Frage")).toEqual([]);
    expect(people("Liebe Grüße an alle")).toEqual([]);
    expect(people("Sehr geehrte Damen und Herren")).toEqual([]);
  });

  it("finds the name under a sign-off, on the next line or after a comma", () => {
    expect(people("Danke dir.\n\nViele Grüße\nJonas Weber\nFirma")).toEqual(["Jonas Weber"]);
    expect(people("Mit freundlichen Grüßen\nMara Beispiel")).toEqual(["Mara Beispiel"]);
    expect(people("Viele Grüße, Jonas")).toEqual(["Jonas"]);
    expect(people("Best regards,\nPriya Nair")).toEqual(["Priya Nair"]);
    expect(people("Regards,\nPriya")).toEqual(["Priya"]);
  });

  it("does not take roles, openers or a sentence start for a name", () => {
    expect(people("Ich bin Kunde bei Ihnen")).toEqual([]);
    expect(people("Ich bin Teil des Teams")).toEqual([]);
    expect(people("I am Manager of sales")).toEqual([]);
    expect(people("Viele Grüße\nIhr Support-Team")).toEqual([]);
    expect(people("Danke, Das passt")).toEqual([]);
  });

  it("keeps a salutation name whole and unchanged", () => {
    expect(people("Hallo Frau Dr. Schmidt, danke")).toEqual(["Dr. Schmidt"]);
  });
});

describe("company names", () => {
  it("flags a name in front of a legal form and the form alone", () => {
    const text = "Bitte an Weber Metallbau GmbH und die Muster AG senden.";
    const spans = companySpans(text, detect(text));
    expect(spans.map((s) => text.slice(s.start, s.end).trim())).toEqual(["Weber Metallbau GmbH", "Muster AG"]);
    expect(companySpans("Ein Vertrag mit Acme Ltd.", [])).toHaveLength(1);
  });

  it("flags nothing when there is no legal form or a hit already covers it", () => {
    expect(companySpans("Wir sprechen über das Angebot der Firma.", [])).toHaveLength(0);
    expect(companySpans("Die AGB gelten, Agentur Mayer.", [])).toHaveLength(0);
    expect(companySpans("Weber GmbH", [{ start: 0, end: 10 }])).toHaveLength(0);
  });
});
