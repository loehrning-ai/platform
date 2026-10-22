import type { AnswerRow, L, RowId } from "./types";

// The numbers live in constants.ts (no words, safe for client code); re-exported for server code and tests.
export {
  BILLS_2025,
  BILLS_2025_MONDAY,
  INVOICE_EL_25_09,
  INVOICE_KEY,
  PREDICTION_ROWS,
  PV,
  REQUESTS,
} from "./constants";

const l = (de: string, en: string): L => ({ de, en });

const CERTS = l(
  "Bio abgelaufen 31.08.2026, Erneuerungsprüfung 22.10.; amfori BSCI Audit 12.03.2026, Note B, nächstes März 2028",
  "Organic expired 31.08.2026, renewal inspection 22.10.; amfori BSCI audit 12.03.2026, rating B, next March 2028",
);

/**
 * The 14 answers: Nordvik's questionnaire (Q1 to Q8) and the bank's screening
 * form (F1 to F6). Each row's status is the weakest status of its facts
 * (rule 3). Values are written as in ANSWERS.md, Step 1, Step 3 and Step 5.
 */
export const ROWS: readonly AnswerRow[] = [
  {
    id: "Q1",
    request: "nordvik",
    label: l("Strom und Anteil erneuerbarer Energien", "Electricity and renewable share"),
    deps: ["strom", "mix"],
    value: {
      friday: l("279,7 MWh aus 11 Monaten; Anteil: keine Angabe", "279.7 MWh from 11 months; share: none given"),
      monday: l("320,9 MWh; Anteil: keine Angabe", "320.9 MWh; share: none given"),
    },
    sources: "energy_bills_2025.csv 3-13; energy_summary_2025_draft.txt 5; inbox/1-nordvik-questionnaire.md 12",
  },
  {
    id: "Q2",
    request: "nordvik",
    label: l("Scope 1 und standortbasierter Scope 2", "Scope 1 and location-based Scope 2"),
    deps: ["ghg", "strom"],
    value: { friday: l("keine THG-Inventur", "no GHG inventory") },
    sources: "company_profile.md 14, 17; carbon_offsets_2025.txt 5",
  },
  {
    id: "Q3",
    request: "nordvik",
    label: l("Beschäftigte nach Vertrag und Geschlecht", "Headcount by contract and gender"),
    deps: ["kopf"],
    value: {
      friday: l(
        "42: 36 unbefristet, 6 befristet; 24 Männer, 18 Frauen",
        "42: 36 permanent, 6 fixed-term; 24 men, 18 women",
      ),
    },
    sources: "hr_headcount_2025.csv 3-5",
  },
  {
    id: "Q4",
    request: "nordvik",
    label: l("Unfälle und Todesfälle", "Accidents and fatalities"),
    deps: ["unfall"],
    value: {
      friday: l(
        "2 meldepflichtige Unfälle (Beschäftigte), 0 Todesfälle",
        "2 recordable accidents (employees), 0 fatalities",
      ),
    },
    sources: "health_safety_2025.txt 4, 7",
  },
  {
    id: "Q5",
    request: "nordvik",
    label: l("Korruption und Bestechung 2025", "Corruption and bribery 2025"),
    deps: ["bussgeld"],
    value: { friday: l("keine Verurteilungen, keine Bußgelder", "no convictions, no fines") },
    sources: "policies_and_compliance.txt 13-14",
  },
  {
    id: "Q6",
    request: "nordvik",
    label: l("Glasgewicht unter NOK 250", "Glass weight under NOK 250"),
    deps: ["glas"],
    actionFrom: "glas",
    value: {
      friday: l("395 g, 410 g, 560 g. Aufgabe: Reserve 560 g", "395 g, 410 g, 560 g. Action: Reserve 560 g"),
    },
    sources: "packaging_bottles.csv 3-5; inbox/1-nordvik-questionnaire.md 21",
  },
  {
    id: "Q7",
    request: "nordvik",
    label: l("Zertifikate und Audits", "Certificates and audits"),
    deps: ["zert"],
    value: { friday: CERTS },
    sources: "organic_certificate_vineyard.txt 6-9; policies_and_compliance.txt 8-9; inbox/1-nordvik-questionnaire.md 7, 11",
  },
  {
    id: "Q8",
    request: "nordvik",
    label: l("Wasser", "Water"),
    deps: ["wasser"],
    value: { friday: l("4.630 m³, 12 von 12 Rechnungen", "4,630 m³, 12 of 12 bills") },
    sources: "water_bills_2025.csv 3-14; company_profile.md 8",
  },
  {
    id: "F1",
    request: "bank",
    label: l("Bußgelder 2023-2025", "Fines 2023-2025"),
    deps: ["bussgeld"],
    value: { friday: l("keine", "none") },
    sources: "policies_and_compliance.txt 13-14",
  },
  {
    id: "F2",
    request: "bank",
    label: l("Strom 2025", "Electricity 2025"),
    deps: ["strom"],
    value: {
      friday: l("279,7 MWh (11 Monate)", "279.7 MWh (11 months)"),
      monday: l("320,9 MWh", "320.9 MWh"),
    },
    sources: "energy_bills_2025.csv 3-13; energy_summary_2025_draft.txt 5",
  },
  {
    id: "F3",
    request: "bank",
    label: l("PV-Ertrag und Anteil", "PV output and share"),
    deps: ["pv", "strom"],
    value: {
      friday: l(
        "ca. 180 MWh (Schätzung); 64,4 % von nur 11 Monaten",
        "about 180 MWh (estimate); 64.4% of only 11 months",
      ),
      monday: l("ca. 180 MWh (Schätzung); 56,1 %", "about 180 MWh (estimate); 56.1%"),
    },
    sources: "solar_offer_2026.txt 3, 8, 11; energy_bills_2025.csv 3-13",
  },
  {
    id: "F4",
    request: "bank",
    label: l("Amortisation", "Payback"),
    deps: ["pv"],
    value: { friday: l("5,0 Jahre, aus einer Schätzung", "5.0 years, from an estimate") },
    sources: "solar_offer_2026.txt 3, 6, 8-9; company_profile.md 15; inbox/3-bank-form.md 13-14",
  },
  {
    id: "F5",
    request: "bank",
    label: l("Beschäftigte und Unfälle", "Headcount and accidents"),
    deps: ["kopf", "unfall"],
    value: { friday: l("42; 2 Unfälle, 0 Todesfälle", "42; 2 accidents, 0 fatalities") },
    sources: "hr_headcount_2025.csv 5; health_safety_2025.txt 4-7",
  },
  {
    id: "F6",
    request: "bank",
    label: l("Zertifikate und Audits", "Certificates and audits"),
    deps: ["zert"],
    value: { friday: CERTS },
    sources: "organic_certificate_vineyard.txt 6, 8-9; policies_and_compliance.txt 8-9",
  },
];

export function rowById(id: RowId): AnswerRow {
  const row = ROWS.find((candidate) => candidate.id === id);
  if (!row) throw new Error(`Unknown row ${id}`);
  return row;
}

/** Why a predicted row keeps its status on Monday (ANSWERS.md Step 5 and Step 3). */
export const STAYS_BECAUSE: Readonly<Partial<Record<RowId, L>>> = {
  Q1: l(
    "Der Anteil erneuerbarer Energien fehlt weiter. Auch die neue Rechnung sagt „not specified“.",
    "The renewable share is still missing. The new bill also says not specified.",
  ),
  Q2: l(
    "Es fehlen weiter Dieselbelege und ein Netz-Emissionsfaktor.",
    "Diesel receipts and a grid emission factor are still missing.",
  ),
  F4: l(
    "Die Formel der Bank nutzt den geschätzten Ertrag und den Preis, nicht den Verbrauch (Formular Z. 13-14).",
    "The bank's formula uses the estimated output and the price, not the consumption (form lines 13-14).",
  ),
};

/** The three quantities offered for the invoice; the key is the printed one. */
export const INVOICE_OPTIONS = [
  { id: "41.2", label: { de: "41,2 kWh", en: "41.2 kWh" } },
  { id: "41200", label: { de: "41.200 kWh", en: "41,200 kWh" } },
  { id: "4120", label: { de: "4.120 kWh", en: "4,120 kWh" } },
] as const;
