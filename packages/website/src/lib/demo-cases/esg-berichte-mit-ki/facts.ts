import { FACT_IDS, INVOICE_FILE } from "./constants";
import { KIT_FILES } from "./kit-files";
import type { Excerpt, Fact, FactId, FileLine, KitFile, L, Option } from "./types";

/**
 * The ten facts of the Crvena Zemja file. Keys, values and reasons follow
 * ANSWERS.md of the kit (Step 1, Step 3, Step 5). Option order is fixed by
 * hand per fact, so the key is not always first and nothing is random.
 */

type Pick = number | readonly [number, number] | "gap";

/** Verbatim lines of one kit file: single lines, inclusive ranges and gaps. */
function ex(file: KitFile, ...picks: readonly Pick[]): Excerpt {
  const lines = KIT_FILES[file];
  return picks.flatMap((pick): (FileLine | "gap")[] => {
    if (pick === "gap") return ["gap"];
    const [from, to] = typeof pick === "number" ? [pick, pick] : pick;
    const out: FileLine[] = [];
    for (let n = from; n <= to; n += 1) {
      const text = lines[n - 1];
      if (text === undefined) throw new Error(`${file} has no line ${n}`);
      out.push({ file, n, text });
    }
    return out;
  });
}

const l = (de: string, en: string): L => ({ de, en });
const o = (id: string, de: string, en: string): Option => ({ id, label: l(de, en) });

/** The three reasons after NEEDS CHECK, the three cases of kit rule 3. */
export const REASONS: readonly Option[] = [
  o("expired", "abgelaufen", "expired"),
  o("estimate", "eine Schätzung", "an estimate"),
  o("conflict", "Widerspruch zwischen Dateien", "conflict between files"),
];

const POL = "policies_and_compliance.txt";
const WAT = "water_bills_2025.csv";
const PRO = "company_profile.md";
const HR = "hr_headcount_2025.csv";
const HS = "health_safety_2025.txt";
const OFF = "carbon_offsets_2025.txt";
const BIL = "energy_bills_2025.csv";
const CER = "organic_certificate_vineyard.txt";
const SOL = "solar_offer_2026.txt";
const PAC = "packaging_bottles.csv";
const DRA = "energy_summary_2025_draft.txt";
const QUE = "inbox/1-nordvik-questionnaire.md";

const bussgeld: Fact = {
  id: "bussgeld",
  n: 1,
  title: l("Bußgelder und Korruption 2023-2025", "Fines and corruption 2023-2025"),
  short: l("Bußgelder", "Fines"),
  excerpt: ex(POL, 6, "gap", 13, 14),
  cite: [
    o("z6", "Z. 6 (Richtlinie)", "Line 6 (the policy)"),
    o("z13-14", "Z. 13-14 (Erklärung)", "Lines 13-14 (the declaration)"),
    o("z13", "Z. 13", "Line 13"),
  ],
  docs: [
    o("decl", "Erklärung des Geschäftsführers", "The director's declaration"),
    o("record", "Strafregisterauszug", "A criminal record extract"),
    o("bank", "Bankbestätigung", "A bank confirmation"),
  ],
  key: { status: "ok", detail: "z13-14", action: false },
  decisive: [
    { file: POL, n: 13 },
    { file: POL, n: 14 },
  ],
  rule: 2,
  why: l(
    "Die Erklärung des Geschäftsführers vom 15. Januar 2026 deckt 2023, 2024 und 2025: keine Verurteilungen, keine Bußgelder (Z. 13-14).",
    "The director's declaration of 15 January 2026 covers 2023, 2024 and 2025: no convictions, no fines (lines 13-14).",
  ),
  traps: {
    check: l(
      "Nichts ist abgelaufen oder geschätzt, und keine Datei widerspricht. Die Erklärung ist datiert und deckt alle drei Jahre.",
      "Nothing is expired or estimated, and no file conflicts. The declaration is dated and covers all three years.",
    ),
    notFound: l(
      "Die Erklärung liegt vor (Z. 13-14). Gibt es die Datei, ist es nicht NOT FOUND.",
      "The declaration is in the file (lines 13-14). When the file exists, it is not NOT FOUND.",
    ),
    "notFound/decl": l(
      "Die Erklärung fehlt nicht: Sie steht in Z. 13-14.",
      "The declaration is not missing: it is lines 13-14.",
    ),
    "ok/z6": l(
      "Z. 6 sagt nur, dass es eine Richtlinie gibt. Ob es Bußgelder gab, sagt die Erklärung in Z. 13-14.",
      "Line 6 only says that a policy exists. Whether there were fines is in the declaration, lines 13-14.",
    ),
    "ok/z13": l(
      "Die Jahre stehen erst in Z. 14, und die Bank fragt auch nach Umwelt-, Arbeits- und Arbeitsschutzbußgeldern (F1). Zitier Z. 13-14.",
      "The years are only on line 14, and the bank also asks about environmental, labour and safety fines (F1). Cite lines 13-14.",
    ),
  },
  feeds: ["Q5", "F1"],
};

const wasser: Fact = {
  id: "wasser",
  n: 2,
  title: l("Wasser 2025 in m³", "Water 2025 in m³"),
  short: l("Wasser", "Water"),
  excerpt: [...ex(WAT, [2, 14]), ...ex(PRO, 8)],
  cite: [
    o("z11", "Z. 11 (September, 980 m³)", "Line 11 (September, 980 m³)"),
    o("z3-14", "Z. 3-14 (12 Rechnungen)", "Lines 3-14 (12 bills)"),
    o("p8", "Profil Z. 8", "profile line 8"),
  ],
  docs: [
    o("sept", "Wasserrechnung September", "The September water bill"),
    o("well", "Brunnenprotokoll", "A well log"),
    o("photo", "Zählerfoto", "A photo of the meter"),
  ],
  key: { status: "ok", detail: "z3-14", action: false },
  decisive: range(WAT, 3, 14),
  rule: 2,
  why: l(
    "12 von 12 Rechnungen, zusammen 4.630 m³. Kein Brunnen, keine andere Quelle (Profil Z. 8).",
    "12 of 12 bills, 4,630 m³ in total. No well, no other source (profile line 8).",
  ),
  traps: {
    "check/conflict": l(
      "Die Spitze im September (980 m³) kommt von der Lese. 12 von 12 Rechnungen, keine andere Quelle: Diese Datei ist sauber.",
      "The September peak (980 m³) comes from the harvest. 12 of 12 bills, no other source: this file is clean.",
    ),
    "check/estimate": l(
      "Nichts hier ist geschätzt: 12 Rechnungen mit gemessenen m³.",
      "Nothing here is an estimate: 12 bills with measured m³.",
    ),
    "check/expired": l(
      "Eine Rechnung läuft nicht ab. 12 von 12 Monaten liegen vor.",
      "A bill does not expire. 12 of 12 months are there.",
    ),
    notFound: l(
      "Alle 12 Rechnungen liegen vor, Januar bis Dezember (Z. 3-14). Nichts fehlt.",
      "All 12 bills are there, January to December (lines 3-14). Nothing is missing.",
    ),
    "notFound/sept": l(
      "Die Septemberrechnung ist da: Z. 11, 980 m³. Beim Wasser fehlt kein Monat.",
      "The September bill is there: line 11, 980 m³. No water month is missing.",
    ),
    "notFound/well": l(
      "Es gibt keinen Brunnen (Profil Z. 8). Alles Wasser steht auf den städtischen Rechnungen.",
      "There is no well (profile line 8). All water is on the municipal bills.",
    ),
    "ok/z11": l(
      "Z. 11 ist nur der September. Die Jahresmenge tragen alle 12 Rechnungen, Z. 3-14.",
      "Line 11 is September only. The year's total rests on all 12 bills, lines 3-14.",
    ),
    "ok/p8": l(
      "Z. 8 sagt, woher das Wasser kommt, nicht wie viel. Die Menge tragen die 12 Rechnungen, Z. 3-14.",
      "Line 8 says where the water comes from, not how much. The amount rests on the 12 bills, lines 3-14.",
    ),
  },
  feeds: ["Q8"],
};

const kopf: Fact = {
  id: "kopf",
  n: 3,
  title: l(
    "Beschäftigte 2025 nach Vertrag und Geschlecht",
    "Employees 2025 by contract and gender",
  ),
  short: l("Beschäftigte", "Headcount"),
  excerpt: [...ex(HR, [2, 6]), ...ex(PRO, 9)],
  cite: [
    o("p9", "Profil Z. 9", "profile line 9"),
    o("z5-6", "hr Z. 5 und 6 (42 + 18 = 60)", "hr lines 5 and 6 (42 + 18 = 60)"),
    o("z3-5", "hr Z. 3-5 (36 + 6 = 42)", "hr lines 3-5 (36 + 6 = 42)"),
  ],
  docs: [
    o("payroll", "Lohnliste mit Namen", "A payroll with names"),
    o("seasonal", "Saisonverträge", "The seasonal contracts"),
    o("social", "SV-Meldung", "The social security filing"),
  ],
  key: { status: "ok", detail: "z3-5", action: false },
  decisive: range(HR, 3, 5),
  rule: 2,
  why: l(
    "42 Beschäftigte: 36 unbefristet, 6 befristet; 24 Männer, 18 Frauen (hr Z. 3-5). Die 18 Saisonkräfte sind keine Beschäftigten (Z. 6).",
    "42 employees: 36 permanent, 6 fixed-term; 24 men, 18 women (hr lines 3-5). The 18 seasonal day workers are not employees (line 6).",
  ),
  traps: {
    check: l(
      "Die Zahlen sind Jahresdurchschnitte, nichts ist geschätzt oder abgelaufen.",
      "The figures are annual averages; nothing is estimated or expired.",
    ),
    "check/conflict": l(
      "42 im Profil, 42 in der Liste: kein Widerspruch. Die 18 Saisonkräfte zählen nicht mit (hr Z. 6).",
      "42 in the profile, 42 in the list: no conflict. The 18 seasonal workers do not count (hr line 6).",
    ),
    notFound: l(
      "Die Summen nach Vertrag und Geschlecht stehen in hr Z. 3-5. Es fehlt nichts.",
      "The totals by contract and gender are in hr lines 3-5. Nothing is missing.",
    ),
    "notFound/payroll": l(
      "Eine Lohnliste mit Namen gehört genau nicht in die Antwort. Personendaten nur als Summen: hr Z. 3-5 reicht.",
      "A payroll with names is exactly what does not belong in the answer. People data only as totals: hr lines 3-5 is enough.",
    ),
    "ok/z5-6": l(
      "Die 18 Saisonkräfte sind keine Beschäftigten (Z. 6). Zitier Z. 3-5.",
      "The 18 seasonal day workers are not employees (line 6). Cite lines 3-5.",
    ),
    "ok/p9": l(
      "Z. 9 nennt 42, aber nicht nach Vertrag und Geschlecht. Q3 fragt nach beidem: hr Z. 3-5.",
      "Line 9 gives 42, but not by contract and gender. Q3 asks for both: hr lines 3-5.",
    ),
  },
  feeds: ["Q3", "F5"],
};

const unfall: Fact = {
  id: "unfall",
  n: 4,
  title: l("Arbeitsunfälle und Todesfälle 2025", "Work accidents and fatalities 2025"),
  short: l("Unfälle", "Accidents"),
  excerpt: ex(HS, [3, 8]),
  cite: [
    o("z6", "Z. 6 (9 Ausfalltage)", "Line 6 (9 lost days)"),
    o("z4-7", "Z. 4 und 7", "Lines 4 and 7"),
    o("z5", "Z. 5 (Saisonkräfte)", "Line 5 (seasonal workers)"),
  ],
  docs: [
    o("timesheets", "Stundenzettel", "Timesheets"),
    o("reports", "einzelne Unfallmeldungen", "Single accident reports"),
    o("insurer", "Versicherungsbericht", "An insurer's report"),
  ],
  key: { status: "ok", detail: "z4-7", action: false },
  decisive: [
    { file: HS, n: 4 },
    { file: HS, n: 7 },
  ],
  rule: 2,
  why: l(
    "2 meldepflichtige Unfälle bei Beschäftigten (Z. 4), 0 Todesfälle (Z. 7).",
    "2 recordable accidents among employees (line 4), 0 fatalities (line 7).",
  ),
  traps: {
    check: l(
      "Das Register nennt Zahlen, keine Schätzung, kein Ablaufdatum, kein Widerspruch.",
      "The register gives counts: no estimate, no expiry date, no conflict.",
    ),
    notFound: l(
      "Die Summen stehen im Sicherheitsregister (Z. 4 und 7). Es fehlt nichts.",
      "The totals are in the safety register (lines 4 and 7). Nothing is missing.",
    ),
    "notFound/reports": l(
      "Einzelne Meldungen sind Personendaten. Die Summe im Register reicht: Z. 4 und 7.",
      "Single reports are people data. The total in the register is enough: lines 4 and 7.",
    ),
    "ok/z6": l(
      "Nach Ausfalltagen fragt niemand. Q4 und F5 fragen nach Unfällen und Todesfällen: Z. 4 und 7.",
      "Nobody asks for lost days. Q4 and F5 ask for accidents and fatalities: lines 4 and 7.",
    ),
    "ok/z5": l(
      "Z. 5 zählt die Saisonkräfte, und die sind keine Beschäftigten. Unfälle stehen in Z. 4, Todesfälle in Z. 7.",
      "Line 5 counts the seasonal workers, who are not employees. Accidents are on line 4, fatalities on line 7.",
    ),
    "action:yes": l(
      "Zwei Unfälle sind belegt und werden berichtet. Keine Anfrage setzt dafür eine Grenze: keine Aufgabe.",
      "Two accidents are proven and get reported. No request sets a limit for them: no action.",
    ),
  },
  feeds: ["Q4", "F5"],
};

const ghg: Fact = {
  id: "ghg",
  n: 5,
  title: l("Scope 1 und 2 in tCO2e", "Scope 1 and 2 in tCO2e"),
  short: l("Scope 1 und 2", "Scope 1 and 2"),
  excerpt: [...ex(PRO, 14, "gap", 17), ...ex(OFF, 5, "gap", 7)],
  cite: [
    o("o5", "offsets Z. 5 (120 tCO2e)", "offsets line 5 (120 tCO2e)"),
    o("p17", "Profil Z. 17", "profile line 17"),
    o("o7", "offsets Z. 7 (Notiz)", "offsets line 7 (the note)"),
  ],
  docs: [
    o("offsetInvoice", "Rechnung der CO2-Gutschriften", "The invoice for the carbon credits"),
    o("diesel", "Dieselbelege 2025 und ein veröffentlichter Netz-Emissionsfaktor", "Diesel receipts 2025 and a published grid emission factor"),
    o("bills2024", "Stromrechnungen 2024", "Electricity bills 2024"),
  ],
  key: { status: "notFound", detail: "diesel" },
  decisive: [
    { file: PRO, n: 14 },
    { file: PRO, n: 17 },
  ],
  rule: 3,
  why: l(
    "Es gibt keine THG-Inventur (Profil Z. 17). Die Dieselbelege liegen nicht in den Dateien (Z. 14), und keine Datei nennt einen Netz-Emissionsfaktor.",
    "There is no GHG inventory (profile line 17). The diesel receipts are not in the files (line 14), and no file gives a grid emission factor.",
  ),
  traps: {
    ok: l(
      "Keine Datei nennt Scope 1 oder Scope 2. Ohne Beleg gibt es kein OK.",
      "No file states Scope 1 or Scope 2. Without proof there is no OK.",
    ),
    "ok/o5": l(
      "Gekaufte Gutschriften sind nicht deine Emissionen. 120 tCO2e gekauft heißt nicht 120 tCO2e ausgestoßen.",
      "Credits you bought are not your emissions. 120 tCO2e bought does not mean 120 tCO2e emitted.",
    ),
    "ok/p17": l(
      "Z. 17 belegt das Gegenteil: Es gibt keine THG-Inventur. Wo nichts ist, heißt es NOT FOUND.",
      "Line 17 proves the opposite: there is no GHG inventory. Where there is nothing, it is NOT FOUND.",
    ),
    "ok/o7": l(
      "Die Notiz zeigt nur, wofür Marketing die Gutschriften nutzen will. Emissionen belegt sie nicht.",
      "The note only shows what marketing wants to use the credits for. It proves no emissions.",
    ),
    check: l(
      "NEEDS CHECK braucht ein Dokument, das abgelaufen, geschätzt oder widersprüchlich ist. Hier gibt es gar keins.",
      "NEEDS CHECK needs a document that is expired, estimated or in conflict. Here there is none at all.",
    ),
    "notFound/offsetInvoice": l(
      "Gekaufte Gutschriften sind nicht deine Emissionen. Es fehlen Dieselbelege (Z. 14) und ein Netz-Emissionsfaktor.",
      "Credits you bought are not your emissions. What is missing: diesel receipts (line 14) and a grid emission factor.",
    ),
    "notFound/bills2024": l(
      "2024 hilft für 2025 nicht. Für Scope 1 fehlen die Dieselbelege (Z. 14), für Scope 2 ein Netz-Emissionsfaktor.",
      "2024 does not help for 2025. Scope 1 lacks the diesel receipts (line 14), Scope 2 a grid emission factor.",
    ),
  },
  feeds: ["Q2"],
};

const mix: Fact = {
  id: "mix",
  n: 6,
  title: l("Anteil erneuerbarer Energien 2025", "Renewable share 2025"),
  short: l("Anteil erneuerbar", "Renewable share"),
  excerpt: [...ex(BIL, 2, 3, "gap", 13), ...ex(PRO, 13)],
  cite: [
    o("p13", "Profil Z. 13", "profile line 13"),
    o("b3-13", "Rechnungen Z. 3-13", "bills lines 3-13"),
    o("b2", "Rechnungen Z. 2 (Spalte supply_mix)", "bills line 2 (the supply_mix column)"),
  ],
  docs: [
    o("sept", "Stromrechnung September 2025", "The September 2025 electricity bill"),
    o("supplier", "Erklärung des Lieferanten zum Strommix", "The supplier's statement of its supply mix"),
    o("solarSigned", "unterschriebenes Solarangebot", "A signed solar offer"),
  ],
  key: { status: "notFound", detail: "supplier" },
  decisive: [
    { file: BIL, n: 2 },
    { file: BIL, n: 3 },
    { file: BIL, n: 13 },
  ],
  rule: 3,
  why: l(
    "Jede Rechnung sagt „not specified“, und aller Strom kommt aus dem Netz (Profil Z. 13). Den Anteil belegt nur eine Erklärung des Lieferanten.",
    "Every bill says not specified, and all power comes from the grid (profile line 13). Only a statement from the supplier proves the share.",
  ),
  traps: {
    ok: l(
      "Die Rechnungen sagen „not specified“: Sie belegen keinen Anteil. Ein OK braucht eine Zahl, die eine Datei nennt.",
      "The bills say not specified: they prove no share. An OK needs a number that a file states.",
    ),
    "ok/p13": l(
      "Z. 13 sagt, woher der Strom kommt: aus dem Netz. Wie viel davon erneuerbar ist, sagt keine Datei.",
      "Line 13 says where the power comes from: the grid. How much of it is renewable, no file says.",
    ),
    check: l(
      "Kein Dokument ist abgelaufen oder geschätzt: Es gibt schlicht keine Angabe. Ohne Beleg heißt es NOT FOUND.",
      "No document is expired or estimated: there is simply no figure. Without proof it is NOT FOUND.",
    ),
    "check/conflict": l(
      "Not specified widerspricht nichts, es sagt nur nichts. Ohne Beleg heißt es NOT FOUND.",
      "Not specified contradicts nothing, it just says nothing. Without proof it is NOT FOUND.",
    ),
    "notFound/sept": l(
      "Elf von elf Rechnungen sagen „not specified“. Den Strommix nennt der Lieferant, nicht die Rechnung.",
      "Eleven of eleven bills say not specified. The supplier states the mix, not the bill.",
    ),
    "notFound/solarSigned": l(
      "Eine Anlage gibt es noch nicht (Profil Z. 13). Den Anteil von 2025 kann nur der Lieferant belegen.",
      "There is no solar plant yet (profile line 13). Only the supplier can prove the 2025 share.",
    ),
  },
  feeds: ["Q1"],
};

const zert: Fact = {
  id: "zert",
  n: 7,
  title: l("Gültige Zertifikate und Audits", "Valid certificates and audits"),
  short: l("Zertifikate", "Certificates"),
  excerpt: [...ex(CER, [6, 9]), ...ex(POL, 8, 9), ...ex(QUE, 7, "gap", 11)],
  cite: [
    o("c6-8", "certificate Z. 6-8", "certificate lines 6-8"),
    o("pol8", "policies Z. 8", "policies line 8"),
    o("both", "beide", "both"),
  ],
  docs: [
    o("newCert", "neues Bio-Zertifikat", "A new organic certificate"),
    o("amfori", "amfori-Mitgliedsurkunde", "An amfori membership certificate"),
    o("inspection", "Inspektionsbericht 22.10.", "The inspection report of 22.10."),
  ],
  key: { status: "check", detail: "expired" },
  decisive: [
    { file: CER, n: 8 },
    { file: QUE, n: 11 },
  ],
  rule: 3,
  why: l(
    "Das Bio-Zertifikat galt bis 31.08.2026 (Z. 8), heute ist der 16.10.2026. Nordvik verlangt Gültigkeit am Abgabetag (Fragebogen Z. 11).",
    "The organic certificate was valid until 31.08.2026 (line 8), and today is 16.10.2026. Nordvik requires validity on the submission date (questionnaire line 11).",
  ),
  traps: {
    ok: l(
      "Gültig bis 31.08.2026, heute ist der 16.10.2026. Nordvik verlangt Gültigkeit am Abgabetag (Fragebogen Z. 11).",
      "Valid until 31.08.2026, and today is 16.10.2026. Nordvik requires validity on the submission date (questionnaire line 11).",
    ),
    notFound: l(
      "Das Zertifikat liegt vor, es ist nur abgelaufen (Z. 8). Ein Dokument, das es gibt, aber abgelaufen ist: NEEDS CHECK.",
      "The certificate is there, it has only expired (line 8). A document that exists but has expired: NEEDS CHECK.",
    ),
    "notFound/newCert": l(
      "Das neue Zertifikat fehlt, ja. Aber das alte liegt vor und ist abgelaufen: Dafür gilt NEEDS CHECK.",
      "The new certificate is missing, yes. But the old one is there and has expired: that is NEEDS CHECK.",
    ),
    "notFound/amfori": l(
      "amfori BSCI ist ein Audit-Programm, keine Zertifizierung (policies Z. 9). Das Bio-Zertifikat liegt vor, nur abgelaufen: NEEDS CHECK.",
      "amfori BSCI is an audit programme, not a certification (policies line 9). The organic certificate is there, only expired: NEEDS CHECK.",
    ),
    "notFound/inspection": l(
      "Die Prüfung ist erst am 22.10. Heute fehlt kein Dokument, eins ist abgelaufen: NEEDS CHECK.",
      "The inspection is only on 22.10. Today no document is missing; one has expired: NEEDS CHECK.",
    ),
    "check/estimate": l(
      "Nichts hier ist geschätzt. Das Datum entscheidet: gültig bis 31.08.2026, heute ist der 16.10.2026.",
      "Nothing here is an estimate. The date decides: valid until 31.08.2026, and today is 16.10.2026.",
    ),
    "check/conflict": l(
      "Die Dateien widersprechen sich nicht. Das Zertifikat ist schlicht abgelaufen: 31.08.2026.",
      "The files do not conflict. The certificate has simply expired: 31.08.2026.",
    ),
  },
  feeds: ["Q7", "F6"],
};

const pv: Fact = {
  id: "pv",
  n: 8,
  title: l("Solarertrag pro Jahr", "Solar yield per year"),
  short: l("Solarertrag", "Solar yield"),
  excerpt: ex(SOL, 3, "gap", [6, 11]),
  cite: [
    o("s7", "Z. 7 (150 kWp)", "Line 7 (150 kWp)"),
    o("s8", "Z. 8 (180 MWh)", "Line 8 (180 MWh)"),
    o("s9", "Z. 9 (Preis)", "Line 9 (the price)"),
  ],
  docs: [
    o("signed", "unterschriebenes Angebot", "A signed offer"),
    o("measured", "Messung der Anlage", "A measurement of the plant"),
    o("bills2026", "Stromrechnungen 2026", "Electricity bills 2026"),
  ],
  key: { status: "check", detail: "estimate" },
  decisive: [
    { file: SOL, n: 3 },
    { file: SOL, n: 8 },
    { file: SOL, n: 11 },
  ],
  rule: 3,
  why: l(
    "180 MWh sind eine Schätzung des Installateurs (Z. 8) aus einem Angebot, das niemand unterschrieben hat (Z. 3, 11). Die Bank will jede Schätzung markiert.",
    "180 MWh is the installer's estimate (line 8) from an offer nobody has signed (lines 3, 11). The bank wants every estimate marked.",
  ),
  traps: {
    ok: l(
      "Z. 8 sagt selbst: „installer estimate, not measured“. Eine Schätzung ist NEEDS CHECK, auch wenn sie in einem Dokument steht.",
      "Line 8 says it itself: installer estimate, not measured. An estimate is NEEDS CHECK, even when a document states it.",
    ),
    notFound: l(
      "Das Angebot liegt vor (Z. 3). Es enthält eine Schätzung (Z. 8): NEEDS CHECK.",
      "The offer is there (line 3). It contains an estimate (line 8): NEEDS CHECK.",
    ),
    "notFound/measured": l(
      "Messen kann man erst nach dem Bau, frühestens Q1 2027 (Z. 10). Das Angebot liegt vor und enthält eine Schätzung: NEEDS CHECK.",
      "You can only measure after it is built, Q1 2027 at the earliest (line 10). The offer is there and contains an estimate: NEEDS CHECK.",
    ),
    "check/expired": l(
      "Das Angebot gilt 60 Tage ab 2. September 2026 (Z. 6), also bis etwa 1. November. Nicht abgelaufen, aber geschätzt (Z. 8).",
      "The offer is valid for 60 days from 2 September 2026 (line 6), so until about 1 November. Not expired, but an estimate (line 8).",
    ),
    "check/conflict": l(
      "Keine Datei widerspricht dem Angebot. Der Grund steht in Z. 8: „installer estimate, not measured“.",
      "No file conflicts with the offer. The reason is on line 8: installer estimate, not measured.",
    ),
  },
  feeds: ["F3", "F4"],
};

const glas: Fact = {
  id: "glas",
  n: 9,
  title: l(
    "Glasgewicht je 0,75-l-Flasche unter NOK 250",
    "Glass weight per 0.75 l bottle under NOK 250",
  ),
  short: l("Glasgewicht", "Glass weight"),
  excerpt: [...ex(PAC, [2, 5]), ...ex(QUE, 21)],
  cite: [
    o("z3", "bottles Z. 3 (395 g)", "bottles line 3 (395 g)"),
    o("z3-5", "bottles Z. 3-5", "bottles lines 3-5"),
    o("q21", "Fragebogen Z. 21", "questionnaire line 21"),
  ],
  docs: [
    o("declaration", "Glaslieferanten-Erklärung", "The glass supplier's declaration"),
    o("prices", "Preisliste Norwegen", "The Norway price list"),
    o("label", "Etikett der Reserve", "The Reserve's label"),
  ],
  key: { status: "ok", detail: "z3-5", action: true },
  decisive: [
    { file: PAC, n: 5 },
    { file: QUE, n: 21 },
  ],
  rule: 2,
  why: l(
    "Alle drei Gewichte sind belegt (Z. 3-5). 395 g und 410 g bestehen. Die Reserve wiegt 560 g bei NOK 239 und bricht die 420-g-Regel (Fragebogen Z. 21).",
    "All three weights are proven (lines 3-5). 395 g and 410 g pass. The Reserve weighs 560 g at NOK 239 and breaks the 420 g rule (questionnaire line 21).",
  ),
  traps: {
    check: l(
      "OK heißt belegt, nicht gut. Die Gewichte stehen in der Datei (Z. 3-5). 560 g bei NOK 239 ist ein belegter Verstoß: OK, dazu eine Aufgabe.",
      "OK means proven, not good. The weights are in the file (lines 3-5). 560 g at NOK 239 is a proven breach: OK, plus an action.",
    ),
    notFound: l(
      "Die Gewichte stehen in der Datei (Z. 3-5). OK, und für die Reserve eine Aufgabe.",
      "The weights are in the file (lines 3-5). OK, plus an action for the Reserve.",
    ),
    "notFound/declaration": l(
      "Die Erklärung selbst liegt nicht im Ordner, nur die Tabelle, die sie nennt. Halte das Original bereit, falls Nordvik fragt. Der Status bleibt OK, dazu eine Aufgabe.",
      "The declaration itself is not in the folder, only the table that names it. Keep the original ready in case Nordvik asks. The status stays OK, plus an action.",
    ),
    "ok/z3": l(
      "Z. 3 ist nur der Vranec. Q6 fragt nach jedem Wein unter NOK 250: alle drei Zeilen, Z. 3-5.",
      "Line 3 is the Vranec only. Q6 asks for every wine under NOK 250: all three lines, 3-5.",
    ),
    "ok/q21": l(
      "Z. 21 ist die Regel, nicht dein Beleg. Die Gewichte stehen in bottles Z. 3-5.",
      "Line 21 is the rule, not your proof. The weights are in bottles lines 3-5.",
    ),
    "action:no": l(
      "Status und Zeilen stimmen. Aber 560 g bei NOK 239 bricht die 420-g-Regel aus Z. 21. OK heißt belegt, nicht gut: dazu gehört eine Aufgabe.",
      "Status and lines are right. But 560 g at NOK 239 breaks the 420 g rule on line 21. OK means proven, not good: it comes with an action.",
    ),
  },
  feeds: ["Q6"],
};

const strom: Fact = {
  id: "strom",
  n: 10,
  title: l("Strom 2025 in MWh", "Electricity 2025 in MWh"),
  short: l("Strom", "Electricity"),
  excerpt: [...ex(BIL, [2, 13]), ...ex(DRA, 3, "gap", 5), ...ex(QUE, 12)],
  cite: [
    o("d5", "Entwurf Z. 5 (279,7 MWh)", "draft line 5 (279.7 MWh)"),
    o("b3-13", "Rechnungen Z. 3-13", "bills lines 3-13"),
    o("q12", "Fragebogen Z. 12", "questionnaire line 12"),
  ],
  docs: [
    o("bills2024", "Stromrechnungen 2024", "Electricity bills 2024"),
    o("sept", "Stromrechnung September 2025", "The September 2025 electricity bill"),
    o("office", "Bestätigung der Büroleitung", "A confirmation from the office manager"),
  ],
  key: { status: "notFound", detail: "sept" },
  accepted: [
    {
      status: "check",
      detail: "conflict",
      note: l(
        "Den Widerspruch hast du gesehen. Was fehlt, wiegt aber schwerer als das, was sich widerspricht.",
        "You saw the conflict. But what is missing weighs more than what conflicts.",
      ),
    },
  ],
  decisive: [
    { file: BIL, n: 10 },
    { file: BIL, n: 11 },
    { file: DRA, n: 5 },
    { file: QUE, n: 12 },
  ],
  rule: 3,
  why: l(
    "Es gibt 11 von 12 Monatsrechnungen: Nach 2025-08 kommt 2025-10. Der Entwurf nennt 279,7 MWh ein volles Jahr und widerspricht damit. Dokument fehlt plus Widerspruch: NOT FOUND.",
    "There are 11 of 12 monthly bills: after 2025-08 comes 2025-10. The draft calls 279.7 MWh a full year and so conflicts. A missing document plus a conflict: NOT FOUND.",
  ),
  traps: {
    ok: l(
      "Die Rechnungen tragen nur 11 Monate. Zähl die Monate: Nach 2025-08 kommt 2025-10.",
      "The bills carry only 11 months. Count the months: after 2025-08 comes 2025-10.",
    ),
    "ok/d5": l(
      "Der Entwurf nennt 11 Monate ein volles Jahr. Zähl die Monate: Nach 2025-08 kommt 2025-10.",
      "The draft calls 11 months a full year. Count the months: after 2025-08 comes 2025-10.",
    ),
    "ok/q12": l(
      "Z. 12 ist Nordviks Regel, kein Beleg. 11 von 12 Monaten sind 91,7 %, Nordvik verlangt 95 %.",
      "Line 12 is Nordvik's rule, not proof. 11 of 12 months is 91.7%, and Nordvik requires 95%.",
    ),
    "check/expired": l(
      "NEEDS CHECK ist vertretbar, aber nicht wegen eines Ablaufdatums. Die Dateien widersprechen sich: 11 Rechnungen gegen einen Entwurf, der ein volles Jahr behauptet.",
      "NEEDS CHECK is defensible, but not because of an expiry date. The files conflict: 11 bills against a draft that claims a full year.",
    ),
    "check/estimate": l(
      "NEEDS CHECK ist vertretbar, aber nichts hier ist geschätzt. Die Dateien widersprechen sich: 11 Rechnungen gegen einen Entwurf, der ein volles Jahr behauptet.",
      "NEEDS CHECK is defensible, but nothing here is an estimate. The files conflict: 11 bills against a draft that claims a full year.",
    ),
    "notFound/office": l(
      "Die Büroleitung hat den Entwurf geschrieben (Entwurf Z. 3). Eine Bestätigung ersetzt keine Rechnung: Es fehlt die Septemberrechnung.",
      "The office manager wrote the draft (draft line 3). A confirmation does not replace a bill: the September bill is missing.",
    ),
    "notFound/bills2024": l(
      "2024 schließt keine Lücke in 2025. Es fehlt die Septemberrechnung 2025.",
      "2024 closes no gap in 2025. The September 2025 bill is missing.",
    ),
  },
  trapRules: { "ok/d5": 1, ok: 1 },
  feeds: ["Q1", "Q2", "F2", "F3"],
};

function range(file: KitFile, from: number, to: number): { file: KitFile; n: number }[] {
  const out: { file: KitFile; n: number }[] = [];
  for (let n = from; n <= to; n += 1) out.push({ file, n });
  return out;
}

/** The ten facts in card order. */
export const FACTS: readonly Fact[] = [
  bussgeld,
  wasser,
  kopf,
  unfall,
  ghg,
  mix,
  zert,
  pv,
  glas,
  strom,
];

export { FACT_IDS, INVOICE_FILE };

export function factById(id: FactId): Fact {
  const fact = FACTS.find((candidate) => candidate.id === id);
  if (!fact) throw new Error(`Unknown fact ${id}`);
  return fact;
}

/**
 * The electricity card again on the following Monday, with the September
 * invoice as the last excerpt row (ANSWERS.md Step 5, F2).
 */
export const STROM_MONDAY: Fact = {
  ...strom,
  title: l("Strom 2025, mit der neuen Rechnung", "Electricity 2025, with the new bill"),
  excerpt: [
    ...ex(BIL, 2, "gap", 10, 11, "gap"),
    ...ex(DRA, 5),
    { file: INVOICE_FILE, n: null, text: "EL-25-09 · 01.09.2025-30.09.2025 · 41.200 kWh" },
  ],
  cite: [
    o("d5", "Entwurf Z. 5 (279,7 MWh)", "draft line 5 (279.7 MWh)"),
    o("b3-13", "Rechnungen Z. 3-13", "bills lines 3-13"),
    o("b3-13+inv", "Rechnungen Z. 3-13 und Rechnung EL-25-09", "bills lines 3-13 and invoice EL-25-09"),
  ],
  key: { status: "ok", detail: "b3-13+inv", action: false },
  accepted: [
    {
      status: "check",
      detail: "conflict",
      note: l(
        "Den Widerspruch hast du gesehen. Mit 12 von 12 Rechnungen trägt der Beleg aber: OK, und der Entwurf wird korrigiert.",
        "You saw the conflict. With 12 of 12 bills the proof holds, though: OK, and the draft gets corrected.",
      ),
    },
  ],
  decisive: [
    { file: BIL, n: 10 },
    { file: INVOICE_FILE, n: null },
    { file: BIL, n: 11 },
  ],
  rule: 2,
  why: l(
    "12 von 12 Rechnungen: 320,9 MWh. Der Entwurf ist jetzt nachweislich falsch, 41,2 MWh zu wenig: korrigieren, nicht schicken.",
    "12 of 12 bills: 320.9 MWh. The draft is now proven wrong, 41.2 MWh short: correct it, do not send it.",
  ),
  traps: {
    notFound: l("12 von 12 Rechnungen liegen jetzt vor.", "12 of 12 bills are there now."),
    "ok/d5": l(
      "Der Entwurf ist jetzt nachweislich falsch: 41,2 MWh zu wenig. Zitier die 12 Rechnungen.",
      "The draft is now proven wrong: 41.2 MWh short. Cite the 12 bills.",
    ),
    "ok/b3-13": l(
      "Z. 3-13 sind 11 Monate. Erst mit der Rechnung EL-25-09 ist das Jahr voll.",
      "Lines 3-13 are 11 months. Only with invoice EL-25-09 is the year complete.",
    ),
    "check/expired": l(
      "Nichts ist abgelaufen. Mit 12 von 12 Rechnungen ist der Strom belegt; der falsche Entwurf ist ein Fehler zum Korrigieren.",
      "Nothing has expired. With 12 of 12 bills the electricity is proven; the wrong draft is an error to correct.",
    ),
    "check/estimate": l(
      "Nichts ist geschätzt: 12 gemessene Rechnungen. Der falsche Entwurf ist ein Fehler zum Korrigieren.",
      "Nothing is an estimate: 12 measured bills. The wrong draft is an error to correct.",
    ),
    "action:yes": l(
      "Die Aufgabe ist, den Entwurf zu korrigieren, aber der Stromwert selbst bricht keine Regel einer Anfrage: Nein.",
      "The draft needs correcting, but the electricity value itself breaks no rule of a request: no.",
    ),
  },
  trapRules: {},
};
