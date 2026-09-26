#!/usr/bin/env python3
"""Workshop 04 (esg-berichte-mit-ki): single source of truth for every number.

Standard library only. All arithmetic in decimal.Decimal. Every raw input and
every teaching factor is defined ONCE below; everything else is derived.

Writes:
  w04-data.json            consumed by slides, presenter notes, demo, guide, kit, registry
  kit/...                  the kit's CSV files and the text-rendered bills (.md)

Conventions
  * Totals are computed from unrounded values and rounded once for display
    (0.1 t, ROUND_HALF_UP). 1,350.496 -> 1,350.5; 495.504 -> 495.5.
  * Waterfall bars are rounded to 0.1 t; the rounded bars still sum to the
    rounded end total (asserted below).
  * Negative numbers are displayed with U+2212. EN "1,915.2", DE "1.915,2".
  * No en or em dashes anywhere in generated text (asserted below).

Run: python3 build_dataset.py
"""
from __future__ import annotations

import csv
import itertools
import json
import os
from decimal import Decimal as D, ROUND_HALF_UP

HERE = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.join(HERE, "kit")
MINUS = "−"
T = D("1000")  # kg per tonne

# ---------------------------------------------------------------------------
# 0. Meta
# ---------------------------------------------------------------------------
META = {
    "slug": "esg-berichte-mit-ki",
    "number": "04",
    "dataVersion": "1.0.0",
    "builtOn": "2026-09-26",
    "rulesAsOf": "2026-09-26",
    "company": "Kellbrunn Präzisionsteile GmbH",
    "companyShort": "Kellbrunn",
    "fictional": True,
    "jv": "Talbrück Beschichtung GmbH",
    "supplier": "Lindmark Energie GmbH",
    "landlord": "Grundstücksverwaltung Lager Ost GbR",
    "location_de": "Erfundener Standort in Hessen",
    "location_en": "Invented site in Hesse, Germany",
    "factorLabel_en": "Illustrative teaching values, not official factors.",
    "factorLabel_de": "Illustrative Lehrwerte, keine amtlichen Faktoren.",
    "constructedLabel_en": "Constructed from documented failure modes: what the answer looks like when all six traps fire. Not a recorded run.",
    "constructedLabel_de": "Konstruiert aus dokumentierten Fehlermustern: So sieht die Antwort aus, wenn alle sechs Fallen zuschlagen. Kein aufgezeichneter Lauf.",
    "targetLabel_en": "Target answer, constructed. Not a recorded run.",
    "targetLabel_de": "Zielantwort, konstruiert. Kein aufgezeichneter Lauf.",
}

COMPANY = {
    "staff_2024": 180, "staff_2025": 180,
    "staff_WN": 110, "staff_WS": 55, "staff_LO": 15,
    "turnover_meur": 38, "balance_sheet_meur": 17,
    "vehicles": 14, "jv_share_pct": 40,
}

# ---------------------------------------------------------------------------
# 1. Teaching factors (NOT official values). Order = order in the kit file.
#    F-GAS-HI is listed first and labelled plainly "Erdgas" on purpose (trap T5).
# ---------------------------------------------------------------------------
FACTORS = {
    "F-GAS-HI": dict(value=D("0.20"), unit="kg CO2e/kWh(Hi)", basis="Hi", year="alle", label_de="Erdgas", label_en="Natural gas", note="bezogen auf Heizwert (Hi)"),
    "F-GAS-HS": dict(value=D("0.18"), unit="kg CO2e/kWh(Hs)", basis="Hs", year="alle", label_de="Erdgas (Brennwert)", label_en="Natural gas (gross calorific value)", note="bezogen auf Brennwert (Hs); rund 0,20 / 1,11"),
    "F-EL-LB-2025": dict(value=D("0.40"), unit="kg CO2e/kWh", basis="", year="2025", label_de="Strom Netz DE, standortbasiert", label_en="Grid electricity DE, location-based", note="Lehrwert; UBA 2024: 363 g CO2/kWh (nur CO2)"),
    "F-EL-LB-2024": dict(value=D("0.42"), unit="kg CO2e/kWh", basis="", year="2024", label_de="Strom Netz DE, standortbasiert", label_en="Grid electricity DE, location-based", note="Lehrwert; UBA 2023: 386 g CO2/kWh (nur CO2)"),
    "F-EL-LB-2023": dict(value=D("0.45"), unit="kg CO2e/kWh", basis="", year="2023", label_de="Strom Netz DE, standortbasiert", label_en="Grid electricity DE, location-based", note="Lehrwert; nur für die Anhang-Variante"),
    "F-EL-RM-2025": dict(value=D("0.60"), unit="kg CO2e/kWh", basis="", year="2025", label_de="Residualmix DE, marktbasiert", label_en="Residual mix DE, market-based", note="Lehrwert; absichtlich gleich wie 2024"),
    "F-EL-RM-2024": dict(value=D("0.60"), unit="kg CO2e/kWh", basis="", year="2024", label_de="Residualmix DE, marktbasiert", label_en="Residual mix DE, market-based", note="Lehrwert; echte Residualmixe ändern sich jedes Jahr"),
    "F-EL-RM-2023": dict(value=D("0.60"), unit="kg CO2e/kWh", basis="", year="2023", label_de="Residualmix DE, marktbasiert", label_en="Residual mix DE, market-based", note="Lehrwert; nur für die Anhang-Variante"),
    "F-EL-GO": dict(value=D("0.00"), unit="kg CO2e/kWh", basis="", year="alle", label_de="Strom mit entwerteten Herkunftsnachweisen, marktbasiert", label_en="Electricity covered by cancelled guarantees of origin, market-based", note="nur für die kWh, die der Nachweis abdeckt"),
    "F-DSL": dict(value=D("2.50"), unit="kg CO2e/l", basis="", year="alle", label_de="Diesel, Straße", label_en="Diesel, road", note="Lehrwert; veröffentlichte Werte rund 2,5 bis 2,7"),
    "C-DSL-E": dict(value=D("10.0"), unit="kWh/l", basis="Hi", year="alle", label_de="Energiegehalt Diesel", label_en="Diesel energy content", note="Heizwert"),
    "C-HS-HI": dict(value=D("1.11"), unit="Verhältnis", basis="", year="alle", label_de="Verhältnis Brennwert zu Heizwert, Erdgas", label_en="Gross to net ratio, natural gas", note=""),
}
FACTOR_EDITION = "Lehrwerte v1.0, 2026-01-15"  # pinned with the rules, before the ledger review on 2026-01-20
f = {k: v["value"] for k, v in FACTORS.items()}

# ---------------------------------------------------------------------------
# 2. Raw inputs 2025
# ---------------------------------------------------------------------------
MONTHS_DE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
MONTH_END = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

# Werk Nord monthly electricity bills (month index 1..12 -> kWh). October has no bill.
WN_BILLS = [  # (invoice, first_month, last_month, kWh, file)
    ("4711-01", 1, 1, 210000, "2025-01_Strom_WN.md"),
    ("4711-02", 2, 2, 195000, "2025-02_Strom_WN.md"),
    ("4711-03", 3, 3, 205000, "2025-03_Strom_WN.md"),
    ("4711-04", 4, 4, 190000, "2025-04_Strom_WN.md"),
    ("4711-05", 5, 5, 185000, "2025-05_Strom_WN.md"),
    ("4711-06", 6, 6, 180000, "2025-06_Strom_WN.md"),
    ("4711-07", 7, 7, 175000, "2025-07_Strom_WN.md"),
    ("4711-08", 8, 8, 120000, "2025-08_Strom_WN.md"),  # real dip: plant holiday
    ("4711-09", 9, 9, 190000, "2025-09_Strom_WN.md"),
    ("4711-11", 11, 12, 410000, "2025-11-12_Strom_WN.md"),  # two months on one bill
]
WN_DUPLICATE = ("4711-03", 3, 3, 205000, "Scan_Rechnung_Maerz.md")
WN_OCT_INVOICE = "4711-10"  # missing
JV_BILL = ("TB-2025-12", 1, 12, 1000000, "Jahresrechnung_TB_2025.md")
METER_WN = "DE0005678900WN01"
METER_WS = "DE0005678900WS01"
METER_TB = "DE0005678900TB07"
METER_LO = "LO-UZ-03"
CUSTOMER_NO = "55-0192"
CUSTOMER_NO_JV = "55-0388"  # Talbrueck holds its own supply contract

# Facility manager's month-end readings, Werk Nord (kWh, transformer ratio 1). No November reading.
METER_READINGS = [
    ("31.12.2024", 3162300), ("31.01.2025", 3372300), ("28.02.2025", 3567300), ("31.03.2025", 3772300),
    ("30.04.2025", 3962300), ("31.05.2025", 4147300), ("30.06.2025", 4327300), ("31.07.2025", 4502300),
    ("31.08.2025", 4622300), ("30.09.2025", 4812300), ("31.10.2025", 5012300), ("31.12.2025", 5422300),
]

WS_MWH_PRINTED = "1.240"          # as printed on the annual statement
WS_KWH = 1240000                  # correct reading
WS_KWH_MISREAD = 1240             # trap T4
WS_PRIOR_YEAR_PRINTED = "1.250"   # "Vorjahr: 1.250 MWh" on the same statement
GO_MWH = 1240                     # guarantees of origin, cancelled, for Werk Sued only
GO_KWH = GO_MWH * 1000

LO_QUARTERS = [("Q1", 30000), ("Q2", 25000), ("Q3", 25000), ("Q4", 30000)]

# Gas bills: page 1 prints the rounded Energiemenge; page 2 prints the conversion (Hs).
GAS = {
    "WN": dict(m3=169817, z=D("0.9600"), hs=D("11.348"), kwh_printed=1850000, invoice="G-2025-0417", file="Gas_Jahresrechnung_WN_2025.md"),
    "WS": dict(m3=22077, z=D("0.9600"), hs=D("11.324"), kwh_printed=240000, invoice="G-2025-0418", file="Gas_Jahresrechnung_WS_2025.md"),
}

# Fuel card (litres per month), AdBlue 100 l per month, 2 washes per month.
DIESEL_MONTH = [3300, 3100, 3300, 3200, 3200, 3100, 3000, 2600, 3300, 3300, 3300, 3300]
ADBLUE_MONTH = [100] * 12
WASH_MONTH = [2] * 12

# 2024 comparison year: consultant summary (grade B, same boundary, Talbrueck excluded in 2024 too).
PRIOR_2024 = {
    "el_WN": 2290000, "el_WS": 1250000, "el_LO": 110000,
    "gas_WN": 1900000, "gas_WS": 250000, "diesel_l": 39000,
}

# Prices (only for realistic bills; never used in emissions).
PRICE_EL = D("0.2150")      # EUR/kWh net
BASE_FEE_EL = D("45.00")    # EUR/month
PRICE_GAS = D("0.0890")     # EUR/kWh net
VAT = D("0.19")
PRICE_DIESEL = D("1.65")
PRICE_ADBLUE = D("0.90")
PRICE_WASH = D("12.90")

# Appendix variant (base year 2023 with a foundry sold on 01.07.2024). Separate from the main case.
VARIANT_2023 = {
    "el_continuing": 3820000, "el_W3": 900000,
    "gas_continuing": 2200000, "gas_W3": 3000000,
    "diesel_l": 40000,
}
# Appendix steel (Scope 3 Cat. 1)
STEEL = {"t_2024": 2400, "t_2025": 2400, "eur_2024": 1800000, "eur_2025": 2160000,
         "F_SPEND": D("2.4"), "DEFLATOR_2025_vs_2024": D("1.2"), "PCF_kg_per_t": D("1650"), "S12_intensity": D("0.12")}
# F_SPEND: teaching spend factor, t CO2e per 1,000 EUR (kg per EUR). DEFLATOR: steel price index 2025 / 2024 (teaching value; price rise explains the +20 % spend).

# ---------------------------------------------------------------------------
# 3. Helpers
# ---------------------------------------------------------------------------
def r(x: D, dp: int = 1) -> D:
    return x.quantize(D(1).scaleb(-dp), rounding=ROUND_HALF_UP)


def fmt(x, dp: int = 1, lang: str = "en", sign: bool = False) -> str:
    x = D(x)
    q = r(x, dp)
    neg = q < 0
    s = f"{abs(q):,.{dp}f}"
    if lang == "de":
        s = s.replace(",", "X").replace(".", ",").replace("X", ".")
    if neg:
        s = MINUS + s
    elif sign and q > 0:
        s = "+" + s
    return s


def de_int(n: int) -> str:
    return f"{n:,}".replace(",", ".")


NUM: dict[str, dict] = {}


def put(key: str, value, unit: str = "", dp: int = 1, sign: bool = False, note: str = ""):
    v = D(value)
    entry = {
        "value": float(v) if v != v.to_integral_value() else int(v),
        "rounded": float(r(v, dp)) if dp > 0 else int(r(v, 0)),
        "unit": unit,
        "en": fmt(v, dp, "en", sign) + (f" {unit}" if unit and unit != "%" else ("%" if unit == "%" else "")),
        "de": fmt(v, dp, "de", sign) + (f" {unit}" if unit and unit != "%" else (" %" if unit == "%" else "")),
    }
    if note:
        entry["note"] = note
    NUM[key] = entry
    return v


def pct(a: D, b: D) -> D:
    return (a - b) / b * 100


# ---------------------------------------------------------------------------
# 4. Derived raw quantities
# ---------------------------------------------------------------------------
wn_bills_kwh = sum(b[3] for b in WN_BILLS)                          # 2,060,000
readings = {d: v for d, v in METER_READINGS}
oct_kwh = readings["31.10.2025"] - readings["30.09.2025"]           # 200,000
wn_year_meter = readings["31.12.2025"] - readings["31.12.2024"]     # 2,260,000
wn_kwh = wn_bills_kwh + oct_kwh
assert wn_kwh == wn_year_meter == 2260000
# monthly meter differences reproduce every monthly bill
for inv, m1, m2, kwh, _ in WN_BILLS:
    if m1 == m2:
        start = METER_READINGS[m1 - 1][1]
        end = METER_READINGS[m1][1]
        assert end - start == kwh, inv
lo_kwh = sum(q for _, q in LO_QUARTERS)
gas_kwh = {}
for site, g in GAS.items():
    exact = D(g["m3"]) * g["z"] * g["hs"]
    assert r(exact, 0) == g["kwh_printed"], (site, exact)
    g["kwh_exact"] = exact
    gas_kwh[site] = g["kwh_printed"]
diesel_l = sum(DIESEL_MONTH)
adblue_l = sum(ADBLUE_MONTH)
assert diesel_l == 38000 and adblue_l == 1200

# ---------------------------------------------------------------------------
# 5. The model: compute any combination of active traps
# ---------------------------------------------------------------------------
TRAPS = [
    dict(id="T1", key="duplicate", en="Duplicate March bill counted", de="Doppelte Märzrechnung gezählt", fix_en="Remove the duplicate March bill", fix_de="Doppelte Märzrechnung entfernen", caughtBy_en="Unique key: invoice no. + period + meter (fallback: period + meter + quantity)", caughtBy_de="Eindeutiger Schlüssel: Rechnungsnr. + Zeitraum + Zähler (Ersatz: Zeitraum + Zähler + Menge)", role="Clerk", kind="headline"),
    dict(id="T2", key="october", en="October missing", de="Oktober fehlt", fix_en="Add October from the meter readings", fix_de="Oktober aus den Zählerständen ergänzen", caughtBy_en="Site x month grid", caughtBy_de="Tabelle Standort x Monat", role="Clerk", kind="headline"),
    dict(id="T3", key="jv", en="Joint venture bill included", de="Rechnung des Gemeinschaftsunternehmens gezählt", fix_en="Exclude Talbrück (JV)", fix_de="Talbrück (GU) ausschließen", caughtBy_en="entity_on_document column + written boundary", caughtBy_de="Spalte entity_on_document + schriftliche Grenze", role="Clerk", kind="headline"),
    dict(id="T4", key="unit", en="\"1.240 MWh\" read as 1,240 kWh", de="„1.240 MWh“ als 1.240 kWh gelesen", fix_en="Read Werk Süd as 1,240 MWh", fix_de="Werk Süd als 1.240 MWh lesen", caughtBy_en="Value and unit kept as printed; kWh per employee per site; prior year on the same page", caughtBy_de="Wert und Einheit wie gedruckt; kWh je Beschäftigten je Standort; Vorjahr auf derselben Seite", role="Reader", kind="headline"),
    dict(id="T5", key="gasbasis", en="Hi factor on Hs kWh", de="Hi-Faktor auf Hs-kWh", fix_en="Use the Hs gas factor", fix_de="Hs-Gasfaktor verwenden", caughtBy_en="Factor ID must match the basis on the bill (page 2)", caughtBy_de="Faktor-ID muss zur Basis auf der Rechnung passen (Seite 2)", role="Reader", kind="background"),
    dict(id="T6", key="adblue", en="AdBlue counted as diesel", de="AdBlue als Diesel gezählt", fix_en="Drop AdBlue", fix_de="AdBlue herausnehmen", caughtBy_en="Product filter on the fuel-card export", caughtBy_de="Produktfilter im Tankkarten-Export", role="Clerk", kind="background"),
    dict(id="T7", key="mbmethod", en="Grid average instead of residual mix (market-based)", de="Netzdurchschnitt statt Residualmix (marktbasiert)", fix_en="Residual mix for kWh without a certificate", fix_de="Residualmix für kWh ohne Nachweis", caughtBy_en="Market-based order: certificate, supplier rate, residual mix", caughtBy_de="Reihenfolge marktbasiert: Nachweis, Lieferantenfaktor, Residualmix", role="Clerk", kind="method"),
]
TRAP_IDS = [t["id"] for t in TRAPS]
RAW_TRAPS = frozenset(TRAP_IDS)  # the constructed raw-folder answer: all fire


def compute(active: frozenset) -> dict:
    wn = wn_bills_kwh + (0 if "T2" in active else oct_kwh) + (WN_DUPLICATE[3] if "T1" in active else 0)
    jv = JV_BILL[3] if "T3" in active else 0
    ws = WS_KWH_MISREAD if "T4" in active else WS_KWH
    el = wn + jv + ws + lo_kwh
    s2lb = D(el) * f["F-EL-LB-2025"] / T
    covered = min(ws, GO_KWH)
    uncovered = el - covered
    mb_factor = f["F-EL-LB-2025"] if "T7" in active else f["F-EL-RM-2025"]
    s2mb = (D(covered) * f["F-EL-GO"] + D(uncovered) * mb_factor) / T
    gas_total = gas_kwh["WN"] + gas_kwh["WS"]
    gas_factor = f["F-GAS-HI"] if "T5" in active else f["F-GAS-HS"]
    s1_gas = D(gas_total) * gas_factor / T
    litres = diesel_l + (adblue_l if "T6" in active else 0)
    s1_dsl = D(litres) * f["F-DSL"] / T
    s1 = s1_gas + s1_dsl
    return dict(el_kwh=el, wn_kwh=wn, jv_kwh=jv, ws_kwh=ws, lo_kwh=lo_kwh, uncovered_kwh=uncovered,
                s2lb=s2lb, s2mb=s2mb, s1_gas=s1_gas, s1_dsl=s1_dsl, s1=s1, lb=s1 + s2lb, mb=s1 + s2mb)


RIGHT = compute(frozenset())
WRONG = compute(RAW_TRAPS)

# 2024
el24 = PRIOR_2024["el_WN"] + PRIOR_2024["el_WS"] + PRIOR_2024["el_LO"]
gas24 = PRIOR_2024["gas_WN"] + PRIOR_2024["gas_WS"]
s2lb24 = D(el24) * f["F-EL-LB-2024"] / T
s2mb24 = D(el24) * f["F-EL-RM-2024"] / T
s1gas24 = D(gas24) * f["F-GAS-HS"] / T
s1dsl24 = D(PRIOR_2024["diesel_l"]) * f["F-DSL"] / T
s1_24 = s1gas24 + s1dsl24
lb24 = s1_24 + s2lb24
mb24 = s1_24 + s2mb24

# ---------------------------------------------------------------------------
# 6. Checks on the headline arithmetic (fail loudly if an input changes)
# ---------------------------------------------------------------------------
assert RIGHT["el_kwh"] == 3610000
assert RIGHT["s2lb"] == D("1444") and RIGHT["s2mb"] == D("1422") and RIGHT["s1"] == D("471.2")
assert RIGHT["lb"] == D("1915.2") and RIGHT["mb"] == D("1893.2")
assert lb24 == D("2017.5") and mb24 == D("2674.5") and s1_24 == D("484.5")
assert WRONG["lb"] == D("1866.496") and WRONG["mb"] == D("1866.0") and WRONG["s1"] == D("516.0")
assert WRONG["s2lb"] == D("1350.496") and WRONG["s2mb"] == D("1350.0")

# ---------------------------------------------------------------------------
# 7. Numbers (flat, keyed). SPEC.md references these keys as n.<key>.
# ---------------------------------------------------------------------------
put("staff", COMPANY["staff_2025"], "", 0)
put("files_raw_2025", 22, "", 0)
put("files_wn_electricity", 12, "", 0)
put("months_wn_covered_raw", 11, "", 0)
put("el_wn_kwh", RIGHT["wn_kwh"], "kWh", 0)
put("el_ws_kwh", WS_KWH, "kWh", 0)
put("el_lo_kwh", lo_kwh, "kWh", 0)
put("el_total_kwh", RIGHT["el_kwh"], "kWh", 0)
put("el_total_mwh", D(RIGHT["el_kwh"]) / 1000, "MWh", 0)
put("el_ws_mwh", D(WS_KWH) / 1000, "MWh", 0)
put("el_uncovered_kwh", RIGHT["uncovered_kwh"], "kWh", 0)
put("el_uncovered_mwh", D(RIGHT["uncovered_kwh"]) / 1000, "MWh", 0)
put("el_total_2024_kwh", el24, "kWh", 0)
put("el_change_kwh", RIGHT["el_kwh"] - el24, "kWh", 0, sign=True)
put("el_change_pct", pct(D(RIGHT["el_kwh"]), D(el24)), "%", 1, sign=True)
put("oct_kwh", oct_kwh, "kWh", 0)
put("dup_kwh", WN_DUPLICATE[3], "kWh", 0)
put("jv_kwh", JV_BILL[3], "kWh", 0)
put("aug_kwh", 120000, "kWh", 0)
put("jul_kwh", 175000, "kWh", 0)
put("aug_vs_jul_pct", pct(D(120000), D(175000)), "%", 0, sign=True)
put("wn_net_raw_vs_right_kwh", WN_DUPLICATE[3] - oct_kwh, "kWh", 0, sign=True)
put("gas_total_kwh", gas_kwh["WN"] + gas_kwh["WS"], "kWh", 0)
put("gas_wn_kwh", gas_kwh["WN"], "kWh", 0)
put("gas_ws_kwh", gas_kwh["WS"], "kWh", 0)
put("gas_change_pct", pct(D(gas_kwh["WN"] + gas_kwh["WS"]), D(gas24)), "%", 1, sign=True)
put("diesel_l", diesel_l, "l", 0)
put("adblue_l", adblue_l, "l", 0)
put("go_mwh", GO_MWH, "MWh", 0)

# correct 2025
put("s1_2025", RIGHT["s1"], "t")
put("s1_gas_2025", RIGHT["s1_gas"], "t")
put("s1_gas_wn_2025", D(gas_kwh["WN"]) * f["F-GAS-HS"] / T, "t")
put("s1_gas_ws_2025", D(gas_kwh["WS"]) * f["F-GAS-HS"] / T, "t")
put("s1_diesel_2025", RIGHT["s1_dsl"], "t")
put("s2lb_2025", RIGHT["s2lb"], "t")
put("s2mb_2025", RIGHT["s2mb"], "t")
put("total_lb_2025", RIGHT["lb"], "t")
put("total_mb_2025", RIGHT["mb"], "t")
put("ws_lb_2025", D(WS_KWH) * f["F-EL-LB-2025"] / T, "t")
put("wn_el_lb_2025", D(RIGHT["wn_kwh"]) * f["F-EL-LB-2025"] / T, "t")
put("lo_el_lb_2025", D(lo_kwh) * f["F-EL-LB-2025"] / T, "t")
put("wn_el_mb_2025", D(RIGHT["wn_kwh"]) * f["F-EL-RM-2025"] / T, "t")
put("lo_el_mb_2025", D(lo_kwh) * f["F-EL-RM-2025"] / T, "t")

# 2024
put("s1_2024", s1_24, "t")
put("s2lb_2024", s2lb24, "t")
put("s2mb_2024", s2mb24, "t")
put("total_lb_2024", lb24, "t")
put("total_mb_2024", mb24, "t")

# change
chg_lb = RIGHT["lb"] - lb24
chg_mb = RIGHT["mb"] - mb24
put("chg_lb_t", chg_lb, "t", sign=True)
put("chg_lb_pct", pct(RIGHT["lb"], lb24), "%", sign=True)
put("chg_mb_t", chg_mb, "t", sign=True)
put("chg_mb_pct", pct(RIGHT["mb"], mb24), "%", sign=True)
put("chg_s1_t", RIGHT["s1"] - s1_24, "t", sign=True)
put("chg_s1_pct", pct(RIGHT["s1"], s1_24), "%", sign=True)

# drivers, location-based (consumption valued at 2024 factor; factor effect on 2025 consumption)
drv_lb = [
    ("grid_factor", "Grid factor 0.42 to 0.40 (teaching values)", "Netzfaktor 0,42 auf 0,40 (Lehrwerte)", D(RIGHT["el_kwh"]) * (f["F-EL-LB-2025"] - f["F-EL-LB-2024"]) / T, "3,610,000 x (0.40 - 0.42)"),
    ("less_electricity", "Less electricity", "Weniger Strom", D(RIGHT["el_kwh"] - el24) * f["F-EL-LB-2024"] / T, "(3,610,000 - 3,650,000) x 0.42"),
    ("less_gas", "Less gas", "Weniger Gas", D(gas_kwh["WN"] + gas_kwh["WS"] - gas24) * f["F-GAS-HS"] / T, "(2,090,000 - 2,150,000) x 0.18"),
    ("less_diesel", "Less diesel", "Weniger Diesel", D(diesel_l - PRIOR_2024["diesel_l"]) * f["F-DSL"] / T, "(38,000 - 39,000) x 2.50"),
]
assert sum(d[3] for d in drv_lb) == chg_lb
own_lb = sum(d[3] for d in drv_lb[1:])
put("drv_lb_grid_t", drv_lb[0][3], "t", sign=True)
put("drv_lb_elec_t", drv_lb[1][3], "t", sign=True)
put("drv_lb_gas_t", drv_lb[2][3], "t", sign=True)
put("drv_lb_diesel_t", drv_lb[3][3], "t", sign=True)
put("drv_lb_own_t", own_lb, "t", sign=True)
put("drv_lb_grid_share_pct", drv_lb[0][3] / chg_lb * 100, "%", 0)
put("drv_lb_own_share_pct", own_lb / chg_lb * 100, "%", 0)

drv_mb = [
    ("certificates", "Guarantees of origin for Werk Süd", "Herkunftsnachweise für Werk Süd", -D(GO_KWH) * f["F-EL-RM-2024"] / T, "1,240,000 x 0.60"),
    ("less_electricity", "Less electricity", "Weniger Strom", D(RIGHT["el_kwh"] - el24) * f["F-EL-RM-2024"] / T, "(3,610,000 - 3,650,000) x 0.60"),
    ("less_gas_diesel", "Less gas and diesel (Scope 1)", "Weniger Gas und Diesel (Scope 1)", drv_lb[2][3] + drv_lb[3][3], "-10.8 - 2.5"),
]
assert sum(d[3] for d in drv_mb) == chg_mb
own_mb = drv_mb[1][3] + drv_mb[2][3]
put("drv_mb_cert_t", drv_mb[0][3], "t", sign=True)
put("drv_mb_elec_t", drv_mb[1][3], "t", sign=True)
put("drv_mb_s1_t", drv_mb[2][3], "t", sign=True)
put("drv_mb_own_t", own_mb, "t", sign=True)
put("drv_mb_cert_share_pct", drv_mb[0][3] / chg_mb * 100, "%", 0)
put("drv_mb_own_share_pct", own_mb / chg_mb * 100, "%", 0)

# LB -> MB bridge 2025 (Scope 2)
bridge_cert = -D(GO_KWH) * f["F-EL-LB-2025"] / T
bridge_rm = D(RIGHT["uncovered_kwh"]) * (f["F-EL-RM-2025"] - f["F-EL-LB-2025"]) / T
assert RIGHT["s2lb"] + bridge_cert + bridge_rm == RIGHT["s2mb"]
put("bridge_cert_t", bridge_cert, "t", sign=True)
put("bridge_rm_t", bridge_rm, "t", sign=True)
put("bridge_net_t", bridge_cert + bridge_rm, "t", sign=True)

# wrong raw-folder answer (constructed)
put("wrong_el_kwh", WRONG["el_kwh"], "kWh", 0)
put("wrong_wn_kwh", WRONG["wn_kwh"], "kWh", 0)
put("wrong_s1", WRONG["s1"], "t")
put("wrong_s1_gas", WRONG["s1_gas"], "t")
put("wrong_s1_diesel", WRONG["s1_dsl"], "t")
put("wrong_s2lb", WRONG["s2lb"], "t")
put("wrong_s2mb", WRONG["s2mb"], "t")
put("wrong_total_lb", WRONG["lb"], "t")
put("wrong_total_mb", WRONG["mb"], "t")
put("wrong_chg_lb_t", WRONG["lb"] - lb24, "t", sign=True)
put("wrong_chg_lb_pct", pct(WRONG["lb"], lb24), "%", sign=True)
put("wrong_chg_mb_pct", pct(WRONG["mb"], mb24), "%", sign=True)
put("wrong_chg_s1_pct", pct(WRONG["s1"], s1_24), "%", sign=True)
put("chg_lb_pp_shift", pct(RIGHT["lb"], lb24) - pct(WRONG["lb"], lb24), "", 1, note="percentage points between the raw answer's change vs 2024 and the right change (location-based)")
put("wrong_minus_right_lb_t", WRONG["lb"] - RIGHT["lb"], "t", sign=True)
put("gap_lb_t", abs(WRONG["lb"] - RIGHT["lb"]), "t")
put("gap_lb_pct", abs(WRONG["lb"] - RIGHT["lb"]) / RIGHT["lb"] * 100, "%")
put("wrong_ws_site_t", D(WS_KWH_MISREAD) * f["F-EL-LB-2025"] / T, "t")
put("wrong_jv_site_t", D(JV_BILL[3]) * f["F-EL-LB-2025"] / T, "t")
put("wrong_per_employee_t", WRONG["lb"] / COMPANY["staff_2025"], "t")
put("per_employee_2025_t", RIGHT["lb"] / COMPANY["staff_2025"], "t")
put("per_employee_2024_t", lb24 / COMPANY["staff_2024"], "t")

# ---------------------------------------------------------------------------
# 8. Waterfalls (fixed order T1..T7), both methods Scope 1 + 2
# ---------------------------------------------------------------------------
def waterfall(method: str) -> list[dict]:
    active = set(TRAP_IDS)
    rows = []
    start = compute(frozenset(active))[method]
    rows.append(dict(step="start", label_en="Raw-folder answer (constructed)", label_de="Antwort auf den Rohordner (konstruiert)", change=None, running=start))
    prev = start
    for t in TRAPS:
        active.discard(t["id"])
        now = compute(frozenset(active))[method]
        rows.append(dict(step=t["id"], label_en=t["fix_en"], label_de=t["fix_de"], change=now - prev, running=now))
        prev = now
    assert prev == RIGHT[method]
    # rounded bars must sum to rounded end
    rounded_sum = r(start) + sum(r(x["change"]) for x in rows[1:])
    assert rounded_sum == r(prev), (method, rounded_sum, r(prev))
    out = []
    for x in rows:
        out.append({
            "step": x["step"], "label_en": x["label_en"], "label_de": x["label_de"],
            "change_t": None if x["change"] is None else float(r(x["change"])),
            "change_en": None if x["change"] is None else fmt(x["change"], 1, "en", True),
            "change_de": None if x["change"] is None else fmt(x["change"], 1, "de", True),
            "running_t": float(r(x["running"])),
            "running_en": fmt(x["running"], 1, "en"), "running_de": fmt(x["running"], 1, "de"),
        })
    UNROUNDED_RUNNING[method] = [x["running"] for x in rows]
    return out


UNROUNDED_RUNNING: dict[str, list] = {}
WF = {"lb": waterfall("lb"), "mb": waterfall("mb")}
put("wf_lb_min_t", min(UNROUNDED_RUNNING["lb"]), "t")
put("wf_lb_max_t", max(UNROUNDED_RUNNING["lb"]), "t")
# Trap effects in isolation (each trap alone against the right answer), both methods
isolated = {}
for t in TRAPS:
    c = compute(frozenset([t["id"]]))
    isolated[t["id"]] = {"lb_t": float(r(c["lb"] - RIGHT["lb"])), "mb_t": float(r(c["mb"] - RIGHT["mb"])),
                         "lb_en": fmt(c["lb"] - RIGHT["lb"], 1, "en", True), "mb_en": fmt(c["mb"] - RIGHT["mb"], 1, "en", True),
                         "lb_de": fmt(c["lb"] - RIGHT["lb"], 1, "de", True), "mb_de": fmt(c["mb"] - RIGHT["mb"], 1, "de", True)}
    t["isolated"] = isolated[t["id"]]
put("pair_dup_oct_t", compute(frozenset(["T1", "T2"]))["lb"] - RIGHT["lb"], "t", sign=True)
put("pair_dup_oct_mb_t", compute(frozenset(["T1", "T2"]))["mb"] - RIGHT["mb"], "t", sign=True)
put("pair_jv_unit_t", compute(frozenset(["T3", "T4"]))["lb"] - RIGHT["lb"], "t", sign=True)
put("jv_hides_unit_share_pct", D(JV_BILL[3]) * f["F-EL-LB-2025"] / T / (D(WS_KWH - WS_KWH_MISREAD) * f["F-EL-LB-2025"] / T) * 100, "%", 0)
put("jv_lb_t", D(JV_BILL[3]) * f["F-EL-LB-2025"] / T, "t", sign=True)
put("jv_rm_t", D(JV_BILL[3]) * f["F-EL-RM-2025"] / T, "t", sign=True)
put("unit_lb_t", -D(WS_KWH - WS_KWH_MISREAD) * f["F-EL-LB-2025"] / T, "t", sign=True)
put("dup_lb_t", D(WN_DUPLICATE[3]) * f["F-EL-LB-2025"] / T, "t", sign=True)
put("oct_lb_t", -D(oct_kwh) * f["F-EL-LB-2025"] / T, "t", sign=True)
put("gasbasis_t", D(gas_kwh["WN"] + gas_kwh["WS"]) * (f["F-GAS-HI"] - f["F-GAS-HS"]) / T, "t", sign=True)
put("adblue_t", D(adblue_l) * f["F-DSL"] / T, "t", sign=True)
put("mb_grid_avg_wrong_s2_t", D(RIGHT["uncovered_kwh"]) * f["F-EL-LB-2025"] / T, "t")
put("mb_grid_avg_too_low_t", D(RIGHT["uncovered_kwh"]) * (f["F-EL-RM-2025"] - f["F-EL-LB-2025"]) / T, "t")
put("last_year_factor_effect_t", D(RIGHT["el_kwh"]) * (f["F-EL-LB-2024"] - f["F-EL-LB-2025"]) / T, "t", sign=True)

# ---------------------------------------------------------------------------
# 9. All 128 trap combinations (for the demo)
# ---------------------------------------------------------------------------
combos = {}
for n in range(0, len(TRAP_IDS) + 1):
    for subset in itertools.combinations(TRAP_IDS, n):
        c = compute(frozenset(subset))
        mask = sum(1 << TRAP_IDS.index(i) for i in subset)
        combos[str(mask)] = {
            "traps": list(subset),
            "lb_t": float(r(c["lb"])), "mb_t": float(r(c["mb"])),
            "s1_t": float(r(c["s1"])), "s2lb_t": float(r(c["s2lb"])), "s2mb_t": float(r(c["s2mb"])),
            "vs2024_lb_pct": float(r(pct(c["lb"], lb24))), "vs2024_mb_pct": float(r(pct(c["mb"], mb24))),
            # signed: this state minus the right answer (negative = below). numbers.gap_lb_t is the absolute gap.
            "delta_vs_right_lb_t": float(r(c["lb"] - RIGHT["lb"])), "delta_vs_right_lb_pct": float(r((c["lb"] - RIGHT["lb"]) / RIGHT["lb"] * 100)),
            "delta_vs_right_mb_t": float(r(c["mb"] - RIGHT["mb"])), "delta_vs_right_mb_pct": float(r((c["mb"] - RIGHT["mb"]) / RIGHT["mb"] * 100)),
        }

only_jv = compute(frozenset(["T3"]))
jv_unit = compute(frozenset(["T3", "T4"]))
put("demo_only_jv_lb_t", only_jv["lb"], "t")
put("demo_only_jv_vs2024_pct", pct(only_jv["lb"], lb24), "%", sign=True)
put("demo_jv_unit_lb_t", jv_unit["lb"], "t")
put("demo_jv_unit_vs2024_pct", pct(jv_unit["lb"], lb24), "%", sign=True)
put("demo_jv_unit_mb_t", jv_unit["mb"], "t")
put("demo_jv_unit_vs2024_mb_pct", pct(jv_unit["mb"], mb24), "%", sign=True)
DEMO_SEQUENCE = [
    dict(n=1, action_en="Predict: which switch moves the total most? Duplicate March, Talbrück bill or \"1.240 MWh\".", action_de="Vorhersage: Welcher Schalter bewegt die Summe am meisten? Doppelter März, Talbrück-Rechnung oder „1.240 MWh“.", answer_key="unit_lb_t"),
    dict(n=2, action_en="Switch on only the Talbrück bill.", action_de="Nur die Talbrück-Rechnung einschalten.", state_mask=str(1 << 2), keys=["demo_only_jv_lb_t", "demo_only_jv_vs2024_pct"]),
    dict(n=3, action_en="Add the MWh misread.", action_de="Den MWh-Lesefehler dazuschalten.", state_mask=str((1 << 2) | (1 << 3)), keys=["demo_jv_unit_lb_t", "demo_jv_unit_vs2024_pct"]),
    dict(n=4, action_en="Switch the method to market-based. The MWh switch now shows 0 t.", action_de="Methode auf marktbasiert stellen. Der MWh-Schalter zeigt jetzt 0 t.", method="mb", state_mask=str((1 << 2) | (1 << 3)), keys=["demo_jv_unit_mb_t", "demo_jv_unit_vs2024_mb_pct"]),
    dict(n=5, action_en="Switch the method back to location-based. Then switch on only duplicate March and October. Together they move the total by only +2.0 t, so a check on the total misses both. (In market-based the pair moves it by +3.0 t.)", action_de="Die Methode wieder auf standortbasiert stellen. Dann nur doppelten März und Oktober einschalten. Zusammen bewegen sie die Summe nur um +2,0 t, deshalb übersieht eine Prüfung der Summe beide. (Marktbasiert sind es +3,0 t.)", method="lb", state_mask=str(1 | 2), keys=["pair_dup_oct_t", "pair_dup_oct_mb_t"]),
    dict(n=6, action_en="Open the evidence drawer from \"72.2 t\" in the rewritten sentence.", action_de="Die Belegschublade über „72,2 t“ im neuen Satz öffnen.", keys=["drv_lb_grid_t"]),
]

# ---------------------------------------------------------------------------
# 10. Control total, plausibility, ranking, secondary figures
# ---------------------------------------------------------------------------
docs_wn = wn_bills_kwh + WN_DUPLICATE[3] + JV_BILL[3]
docs_all = docs_wn + WS_KWH + lo_kwh
excluded = WN_DUPLICATE[3] + JV_BILL[3]
included = docs_all - excluded
ctl = included + oct_kwh
assert ctl == RIGHT["el_kwh"]
put("ctl_wn_genuine_kwh", wn_bills_kwh, "kWh", 0)
put("ctl_wn_folder_kwh", docs_wn, "kWh", 0)
put("ctl_docs_kwh", docs_all, "kWh", 0)
put("ctl_excluded_kwh", excluded, "kWh", 0)
put("ctl_included_kwh", included, "kWh", 0)
put("ctl_meter_kwh", oct_kwh, "kWh", 0)
put("ctl_total_kwh", ctl, "kWh", 0)
CONTROL_TOTAL = [
    ("Werk Nord: 10 echte Rechnungen", "Werk Nord: 10 genuine bills", wn_bills_kwh, "enthalten"),
    ("Werk Nord: Duplikat März (4711-03)", "Werk Nord: duplicate March (4711-03)", WN_DUPLICATE[3], "ausgeschlossen: Duplikat"),
    ("Talbrück Beschichtung GmbH", "Talbrück Beschichtung GmbH", JV_BILL[3], "ausgeschlossen: Grenze"),
    ("Werk Süd: Jahresübersicht", "Werk Süd: annual statement", WS_KWH, "enthalten"),
    ("Lager Ost: 4 Quartale", "Lager Ost: 4 quarters", lo_kwh, "enthalten"),
    ("Oktober Werk Nord aus Zählerständen", "October Werk Nord from meter readings", oct_kwh, "ergänzt: Zählerstand, DQ B"),
]

put("ws_kwh_per_employee", D(WS_KWH) / COMPANY["staff_WS"], "kWh", 0)
put("ws_misread_kwh_per_employee", D(WS_KWH_MISREAD) / COMPANY["staff_WS"], "kWh", 0)
put("wn_kwh_per_employee", D(RIGHT["wn_kwh"]) / COMPANY["staff_WN"], "kWh", 0)
put("lo_kwh_per_employee", D(lo_kwh) / COMPANY["staff_LO"], "kWh", 0)
put("ws_2024_kwh_per_employee", D(PRIOR_2024["el_WS"]) / COMPANY["staff_WS"], "kWh", 0)

sources_lb = [
    ("WN electricity", "Strom Werk Nord", RIGHT["wn_kwh"] * f["F-EL-LB-2025"] / T, RIGHT["wn_kwh"] * f["F-EL-RM-2025"] / T),
    ("WS electricity", "Strom Werk Süd", WS_KWH * f["F-EL-LB-2025"] / T, D(0)),
    ("WN gas", "Gas Werk Nord", gas_kwh["WN"] * f["F-GAS-HS"] / T, gas_kwh["WN"] * f["F-GAS-HS"] / T),
    ("Diesel fleet", "Diesel Flotte", diesel_l * f["F-DSL"] / T, diesel_l * f["F-DSL"] / T),
    ("LO electricity", "Strom Lager Ost", lo_kwh * f["F-EL-LB-2025"] / T, lo_kwh * f["F-EL-RM-2025"] / T),
    ("WS gas", "Gas Werk Süd", gas_kwh["WS"] * f["F-GAS-HS"] / T, gas_kwh["WS"] * f["F-GAS-HS"] / T),
]
RANKING = {
    "lb": [dict(en=a, de=b, t=float(r(lb)), share_pct=float(r(lb / RIGHT["lb"] * 100))) for a, b, lb, _ in sorted(sources_lb, key=lambda x: -x[2])],
    "mb": [dict(en=a, de=b, t=float(r(mb)), share_pct=float(r(mb / RIGHT["mb"] * 100))) for a, b, _, mb in sorted(sources_lb, key=lambda x: -x[3])],
}
assert sum(D(str(x["t"])) for x in RANKING["lb"]) == RIGHT["lb"]
assert sum(D(str(x["t"])) for x in RANKING["mb"]) == RIGHT["mb"]

put("renewable_share_el_pct", D(WS_KWH) / RIGHT["el_kwh"] * 100, "%")
gas_hi_mwh = D(gas_kwh["WN"] + gas_kwh["WS"]) / f["C-HS-HI"] / 1000
diesel_mwh = D(diesel_l) * f["C-DSL-E"] / 1000
energy_hi = D(RIGHT["el_kwh"]) / 1000 + gas_hi_mwh + diesel_mwh
put("energy_gas_hi_mwh", gas_hi_mwh, "MWh")
# Hi route for trace-two: convert Hs kWh to Hi with C-HS-HI, then apply F-GAS-HI. Differs from the Hs route by the rounding of 0.18.
gas_hi_route = gas_hi_mwh * 1000 * f["F-GAS-HI"] / T
put("gas_hi_route_t", gas_hi_route, "t")
put("gas_hi_route_diff_t", gas_hi_route - RIGHT["s1_gas"], "t")
put("energy_diesel_mwh", diesel_mwh, "MWh", 0)
put("energy_total_hi_mwh", energy_hi, "MWh")
put("renewable_share_energy_pct", D(WS_KWH) / 1000 / energy_hi * 100, "%")
put("intensity_lb_t_per_meur", RIGHT["lb"] / COMPANY["turnover_meur"], "t/Mio. EUR")

# ---------------------------------------------------------------------------
# 11. Trace-two exercise (act 4)
# ---------------------------------------------------------------------------
TRACE = [
    dict(n=1, mode="worked", figure_key="ws_lb_2025", rows=["E-WS-01"], factor="F-EL-LB-2025",
         quote="Verbrauch 2025: 1.240 MWh", file="Jahresuebersicht_2025_Oekostrom.md",
         arithmetic_en="1,240 MWh x 1,000 = 1,240,000 kWh; x 0.40 kg/kWh = 496,000 kg = 496.0 t",
         arithmetic_de="1.240 MWh x 1.000 = 1.240.000 kWh; x 0,40 kg/kWh = 496.000 kg = 496,0 t"),
    dict(n=2, mode="half", figure_key="s1_gas_2025", rows=["G-WN-01", "G-WS-01"], factor="F-GAS-HS",
         quote="Energiemenge 1.850.000 kWh / 240.000 kWh; Seite 2: Brennwert (Hs)",
         blanks_en=["the second row ID", "the factor ID and its basis"], blanks_de=["die zweite Zeilen-ID", "die Faktor-ID und ihre Basis"],
         arithmetic_en="(1,850,000 + 240,000) kWh(Hs) x 0.18 = 376.2 t",
         arithmetic_de="(1.850.000 + 240.000) kWh(Hs) x 0,18 = 376,2 t",
         slip_en="0.20 (the Hi factor) gives 418.0 t. Check page 2 of the gas bill: Brennwert (Hs).",
         slip_de="0,20 (Hi-Faktor) ergibt 418,0 t. Seite 2 der Gasrechnung prüfen: Brennwert (Hs).",
         slip_key="wrong_s1_gas",
         alt_en="Converting to Hi first (2,090,000 / 1.11 = 1,882,883 kWh(Hi) x 0.20) gives 376.6 t. That route is also right; the 0.4 t difference is the rounding of the teaching value 0.18.",
         alt_de="Wer zuerst auf Hi umrechnet (2.090.000 / 1,11 = 1.882.883 kWh(Hi) x 0,20), kommt auf 376,6 t. Auch dieser Weg ist richtig; die 0,4 t Unterschied sind die Rundung des Lehrwerts 0,18.",
         alt_key="gas_hi_route_t"),
    dict(n=3, mode="alone", figure_key="drv_lb_grid_t", rows=["E-WN-01 to E-WN-11", "E-WS-01", "E-LO-Q1 to E-LO-Q4"], factor="F-EL-LB-2025 and F-EL-LB-2024",
         arithmetic_en="3,610,000 kWh x (0.40 - 0.42) = -72,200 kg = -72.2 t",
         arithmetic_de="3.610.000 kWh x (0,40 - 0,42) = -72.200 kg = -72,2 t",
         slip_en="Using 2024 kWh (3,650,000) gives -73.0 t. The factor effect uses 2025 consumption.",
         slip_de="Mit den kWh von 2024 (3.650.000) kommen -73,0 t heraus. Der Faktoreffekt rechnet mit dem Verbrauch 2025.",
         slip_key="trace_slip_grid_t"),
]
put("trace_slip_grid_t", D(el24) * (f["F-EL-LB-2025"] - f["F-EL-LB-2024"]) / T, "t", sign=True)

# ---------------------------------------------------------------------------
# 12. Appendix: base-year variant (separate teaching variant) and steel
# ---------------------------------------------------------------------------
v = VARIANT_2023
lb23_rep = (D(v["el_continuing"] + v["el_W3"]) * f["F-EL-LB-2023"] + D(v["gas_continuing"] + v["gas_W3"]) * f["F-GAS-HS"] + D(v["diesel_l"]) * f["F-DSL"]) / T
w3 = (D(v["el_W3"]) * f["F-EL-LB-2023"] + D(v["gas_W3"]) * f["F-GAS-HS"]) / T
lb23_rest = lb23_rep - w3
mb23_rep = (D(v["el_continuing"] + v["el_W3"]) * f["F-EL-RM-2023"] + D(v["gas_continuing"] + v["gas_W3"]) * f["F-GAS-HS"] + D(v["diesel_l"]) * f["F-DSL"]) / T
mb23_w3 = (D(v["el_W3"]) * f["F-EL-RM-2023"] + D(v["gas_W3"]) * f["F-GAS-HS"]) / T
mb23_rest = mb23_rep - mb23_w3
assert lb23_rep == D("3160") and w3 == D("945") and lb23_rest == D("2215")
var_drv = [
    ("less_electricity", D(RIGHT["el_kwh"] - v["el_continuing"]) * f["F-EL-LB-2023"] / T),
    ("grid_factor", D(RIGHT["el_kwh"]) * (f["F-EL-LB-2025"] - f["F-EL-LB-2023"]) / T),
    ("less_gas", D(gas_kwh["WN"] + gas_kwh["WS"] - v["gas_continuing"]) * f["F-GAS-HS"] / T),
    ("less_diesel", D(diesel_l - v["diesel_l"]) * f["F-DSL"] / T),
]
assert sum(x[1] for x in var_drv) == RIGHT["lb"] - lb23_rest
put("var_2023_lb_reported_t", lb23_rep, "t")
put("var_w3_t", w3, "t")
put("var_2023_lb_restated_t", lb23_rest, "t")
put("var_chg_vs_reported_pct", pct(RIGHT["lb"], lb23_rep), "%", sign=True)
put("var_chg_vs_restated_pct", pct(RIGHT["lb"], lb23_rest), "%", sign=True)
put("var_chg_vs_restated_t", RIGHT["lb"] - lb23_rest, "t", sign=True)
put("var_drv_elec_t", var_drv[0][1], "t", sign=True)
put("var_drv_grid_t", var_drv[1][1], "t", sign=True)
put("var_drv_gas_t", var_drv[2][1], "t", sign=True)
put("var_drv_diesel_t", var_drv[3][1], "t", sign=True)
put("var_2023_mb_reported_t", mb23_rep, "t")
put("var_2023_mb_restated_t", mb23_rest, "t")
put("var_chg_mb_vs_restated_pct", pct(RIGHT["mb"], mb23_rest), "%", sign=True)

s = STEEL
put("steel_supplier_t", D(s["t_2025"]) * s["PCF_kg_per_t"] / T, "t", 0)
put("steel_spend_nominal_t", D(s["eur_2025"]) * s["F_SPEND"] / T, "t", 0)
put("steel_spend_2024_t", D(s["eur_2024"]) * s["F_SPEND"] / T, "t", 0)
put("steel_spend_deflated_t", D(s["eur_2025"]) / s["DEFLATOR_2025_vs_2024"] * s["F_SPEND"] / T, "t", 0)
put("steel_intensity_wrong_t", D(s["t_2025"]) * s["S12_intensity"], "t", 0)
put("steel_intensity_wrong_pct", (D(s["t_2025"]) * s["S12_intensity"] - D(s["t_2025"]) * s["PCF_kg_per_t"] / T) / (D(s["t_2025"]) * s["PCF_kg_per_t"] / T) * 100, "%", 0, sign=True)
put("steel_spend_yoy_pct", pct(D(s["eur_2025"]), D(s["eur_2024"])), "%", 0, sign=True)

# ---------------------------------------------------------------------------
# 13. Ledger (expected) rows
# ---------------------------------------------------------------------------
LEDGER_COLS = ["row_id", "site_id", "entity_on_document", "in_boundary", "carrier", "period_start", "period_end", "months",
               "qty_source", "unit_source", "basis", "qty_norm", "unit_norm", "source_file", "source_page", "source_quote",
               "invoice_no", "meter_id", "status", "reason", "instrument_id", "factor_lb", "factor_mb", "factor_edition",
               "dq", "t_lb", "t_mb", "role_proposed_by", "reviewed_by"]
ENT_WN = "Kellbrunn Präzisionsteile GmbH, Werk Nord"
ENT_WS = "Kellbrunn Präzisionsteile GmbH, Werk Süd"
ENT_LO = "Kellbrunn Präzisionsteile GmbH (Lager Ost, Mieterin)"
ENT_FL = "Kellbrunn Präzisionsteile GmbH"


def dec_de(x: D, dp: int = 1) -> str:
    return f"{r(D(x), dp):.{dp}f}".replace(".", ",")


def period(m1, m2):
    return f"2025-{m1:02d}-01", f"2025-{m2:02d}-{MONTH_END[m2 - 1]:02d}"


LEDGER = []


def add(**kw):
    row = {c: "" for c in LEDGER_COLS}
    row.update(kw)
    row["factor_edition"] = row["factor_edition"] or (FACTOR_EDITION if row["factor_lb"] else "")
    row["role_proposed_by"] = row["role_proposed_by"] or "Reader (KI-Vorschlag)"
    row["reviewed_by"] = row["reviewed_by"] or "Controlling, 2026-01-20"
    LEDGER.append(row)


for inv, m1, m2, kwh, fn in WN_BILLS:
    ps, pe = period(m1, m2)
    idx = f"{m1:02d}" if m1 != 11 else "11"
    add(row_id=f"E-WN-{idx}", site_id="WN", entity_on_document=ENT_WN, in_boundary="ja", carrier="Strom",
        period_start=ps, period_end=pe, months=str(m2 - m1 + 1), qty_source=de_int(kwh), unit_source="kWh",
        qty_norm=str(kwh), unit_norm="kWh", source_file=f"rohdaten_2025/Werk_Nord/Strom/{fn}", source_page="1",
        source_quote=f"Verbrauch {de_int(kwh)} kWh", invoice_no=inv, meter_id=METER_WN, status="actual",
        reason="Einbruch bestätigt: Betriebsferien" if m1 == 8 else ("zwei Monate auf einer Rechnung" if m1 == 11 else ""),
        factor_lb="F-EL-LB-2025", factor_mb="F-EL-RM-2025", dq="A",
        t_lb=dec_de(D(kwh) * f["F-EL-LB-2025"] / T), t_mb=dec_de(D(kwh) * f["F-EL-RM-2025"] / T))
    if m1 == 3:
        add(row_id="E-WN-03D", site_id="WN", entity_on_document=ENT_WN, in_boundary="ja", carrier="Strom",
            period_start=ps, period_end=pe, months="1", qty_source=de_int(kwh), unit_source="kWh", qty_norm="0", unit_norm="kWh",
            source_file=f"rohdaten_2025/Werk_Nord/Strom/{WN_DUPLICATE[4]}", source_page="1", source_quote=f"Verbrauch {de_int(kwh)} kWh",
            invoice_no=inv, meter_id=METER_WN, status="excluded", reason="Duplikat von E-WN-03 (Rechnung 4711-03, gleicher Zeitraum, gleicher Zähler)",
            dq="", t_lb="0,0", t_mb="0,0", role_proposed_by="Clerk (Regel Schlüssel)")
    if m1 == 9:
        add(row_id="E-WN-10", site_id="WN", entity_on_document=ENT_WN, in_boundary="ja", carrier="Strom",
            period_start="2025-10-01", period_end="2025-10-31", months="1", qty_source="5.012.300 minus 4.812.300", unit_source="kWh (Zählerstand)",
            qty_norm=str(oct_kwh), unit_norm="kWh", source_file="rohdaten_2025/Werk_Nord/Zaehlerstaende_2025.csv", source_page="Zeilen 30.09.2025 und 31.10.2025",
            source_quote="30.09.2025;...;4812300 / 31.10.2025;...;5012300", invoice_no="4711-10 (angefordert)", meter_id=METER_WN,
            status="actual_meter", reason="Rechnung fehlt; Zählerstand bis zur Rechnung", factor_lb="F-EL-LB-2025", factor_mb="F-EL-RM-2025", dq="B",
            t_lb=dec_de(D(oct_kwh) * f["F-EL-LB-2025"] / T), t_mb=dec_de(D(oct_kwh) * f["F-EL-RM-2025"] / T), role_proposed_by="Clerk (Regel Abdeckung)")
add(row_id="E-TB-01", site_id="TB", entity_on_document="Talbrück Beschichtung GmbH, Halle 3", in_boundary="nein", carrier="Strom",
    period_start="2025-01-01", period_end="2025-12-31", months="12", qty_source=de_int(JV_BILL[3]), unit_source="kWh", qty_norm="0", unit_norm="kWh",
    source_file=f"rohdaten_2025/Werk_Nord/Strom/{JV_BILL[4]}", source_page="1", source_quote="Rechnungsempfänger: Talbrück Beschichtung GmbH",
    invoice_no=JV_BILL[0], meter_id=METER_TB, status="excluded", reason="Grenze: operative Kontrolle liegt beim Partner (Kellbrunn 40 %); Kandidat Scope 3 Kat. 15",
    t_lb="0,0", t_mb="0,0", role_proposed_by="Clerk (Regel Grenze)")
add(row_id="E-WS-01", site_id="WS", entity_on_document=ENT_WS, in_boundary="ja", carrier="Strom", period_start="2025-01-01", period_end="2025-12-31",
    months="12", qty_source=WS_MWH_PRINTED, unit_source="MWh", qty_norm=str(WS_KWH), unit_norm="kWh",
    source_file="rohdaten_2025/Werk_Sued/Jahresuebersicht_2025_Oekostrom.md", source_page="1", source_quote=f"Verbrauch 2025: {WS_MWH_PRINTED} MWh",
    meter_id=METER_WS, status="actual", instrument_id="I-WS-GO", factor_lb="F-EL-LB-2025", factor_mb="F-EL-GO", dq="A",
    t_lb=dec_de(D(WS_KWH) * f["F-EL-LB-2025"] / T), t_mb="0,0")
for qi, (q, kwh) in enumerate(LO_QUARTERS):
    m1, m2 = qi * 3 + 1, qi * 3 + 3
    ps, pe = period(m1, m2)
    add(row_id=f"E-LO-{q}", site_id="LO", entity_on_document=ENT_LO, in_boundary="ja", carrier="Strom", period_start=ps, period_end=pe, months="3",
        qty_source=de_int(kwh), unit_source="kWh", qty_norm=str(kwh), unit_norm="kWh",
        source_file=f"rohdaten_2025/Lager_Ost/Nebenkosten_Strom_{q}_2025.md", source_page="1", source_quote=f"Unterzähler {METER_LO}: {de_int(kwh)} kWh",
        meter_id=METER_LO, status="actual", factor_lb="F-EL-LB-2025", factor_mb="F-EL-RM-2025", dq="A",
        t_lb=dec_de(D(kwh) * f["F-EL-LB-2025"] / T), t_mb=dec_de(D(kwh) * f["F-EL-RM-2025"] / T))
for site, rid, ent in (("WN", "G-WN-01", ENT_WN), ("WS", "G-WS-01", ENT_WS)):
    g = GAS[site]
    folder = "Werk_Nord/Gas" if site == "WN" else "Werk_Sued"
    add(row_id=rid, site_id=site, entity_on_document=ent, in_boundary="ja", carrier="Erdgas", period_start="2025-01-01", period_end="2025-12-31", months="12",
        qty_source=de_int(g["kwh_printed"]), unit_source="kWh", basis="Hs", qty_norm=str(g["kwh_printed"]), unit_norm="kWh(Hs)",
        source_file=f"rohdaten_2025/{folder}/{g['file']}", source_page="1 (Menge), 2 (Basis)",
        source_quote=f"Energiemenge {de_int(g['kwh_printed'])} kWh; Seite 2: Brennwert (Hs)", invoice_no=g["invoice"], status="actual",
        factor_lb="F-GAS-HS", factor_mb="F-GAS-HS", dq="A",
        t_lb=dec_de(D(g["kwh_printed"]) * f["F-GAS-HS"] / T), t_mb=dec_de(D(g["kwh_printed"]) * f["F-GAS-HS"] / T))
add(row_id="D-FL-01", site_id="FL", entity_on_document=ENT_FL, in_boundary="ja", carrier="Diesel", period_start="2025-01-01", period_end="2025-12-31",
    months="12", qty_source=de_int(diesel_l), unit_source="l", qty_norm=str(diesel_l), unit_norm="l", source_file="rohdaten_2025/Flotte/Tankkarten_2025.csv",
    source_page="Summe produkt = Diesel", source_quote="produkt=Diesel; einheit=l", status="actual", factor_lb="F-DSL", factor_mb="F-DSL", dq="A",
    t_lb=dec_de(D(diesel_l) * f["F-DSL"] / T), t_mb=dec_de(D(diesel_l) * f["F-DSL"] / T), role_proposed_by="Clerk (Regel Produktfilter)")
add(row_id="D-FL-02", site_id="FL", entity_on_document=ENT_FL, in_boundary="ja", carrier="AdBlue", period_start="2025-01-01", period_end="2025-12-31",
    months="12", qty_source=de_int(adblue_l), unit_source="l", qty_norm="0", unit_norm="l", source_file="rohdaten_2025/Flotte/Tankkarten_2025.csv",
    source_page="Summe produkt = AdBlue", source_quote="produkt=AdBlue; einheit=l", status="excluded", reason="kein Kraftstoff (Harnstofflösung)",
    t_lb="0,0", t_mb="0,0", role_proposed_by="Clerk (Regel Produktfilter)")
add(row_id="I-WS-GO", site_id="WS", entity_on_document=ENT_WS, in_boundary="ja", carrier="Herkunftsnachweis", period_start="2025-01-01", period_end="2025-12-31",
    months="12", qty_source=de_int(GO_MWH), unit_source="MWh", qty_norm=str(GO_KWH), unit_norm="kWh (abgedeckt)",
    source_file="rohdaten_2025/Werk_Sued/HKN_Bestaetigung_2025.md", source_page="1",
    source_quote="Herkunftsnachweise über 1.240 MWh ... entwertet ... Lieferstelle Werk Süd", status="instrument",
    reason="deckt E-WS-01 vollständig, sonst nichts", dq="A", role_proposed_by="Clerk (Regel Scope 2)")

# ledger totals match the model
lb_sum = sum(D(x["t_lb"].replace(",", ".")) for x in LEDGER if x["t_lb"])
mb_sum = sum(D(x["t_mb"].replace(",", ".")) for x in LEDGER if x["t_mb"])
assert lb_sum == RIGHT["lb"] and mb_sum == RIGHT["mb"], (lb_sum, mb_sum)

# ---------------------------------------------------------------------------
# 14. Coverage grid
# ---------------------------------------------------------------------------
GRID_ROWS = ["WN Strom", "WS Strom", "LO Strom", "WN Gas", "WS Gas", "FL Diesel"]
grid_expected = {
    "WN Strom": ["1", "1", "1", "1", "1", "1", "1", "1", "1", "Z", "S", "S"],
    "WS Strom": ["J"] * 12, "LO Strom": ["Q"] * 12, "WN Gas": ["J"] * 12, "WS Gas": ["J"] * 12, "FL Diesel": ["1"] * 12,
}
grid_raw = dict(grid_expected)
grid_raw["WN Strom"] = ["1", "1", "2", "1", "1", "1", "1", "1", "1", "0", "S", "S"]
GRID_LEGEND = {"1": "eine Rechnung", "2": "doppelt", "0": "fehlt", "S": "Teil einer Rechnung über zwei Monate", "Z": "Zählerstand statt Rechnung (DQ B)", "J": "Jahresrechnung", "Q": "Quartalsabrechnung"}

# ---------------------------------------------------------------------------
# 15. Documents (text-rendered bills). Written to the kit and embedded in JSON.
# ---------------------------------------------------------------------------
def eur(x: D) -> str:
    return fmt(x, 2, "de") + " €"


def el_bill(inv, m1, m2, kwh, *, addressee_lines, meter, noisy=False, header=None, customer_no=CUSTOMER_NO):
    months = m2 - m1 + 1
    net_energy = D(kwh) * PRICE_EL
    base = BASE_FEE_EL * months
    net = net_energy + base
    vat = r(net * VAT, 2)
    gross = net + vat
    advance = r(gross / months, -2) if months else D(0)
    ps = f"01.{m1:02d}.2025"
    pe = f"{MONTH_END[m2 - 1]:02d}.{m2:02d}.2025"
    supplier = "Lindmark Enerqie GmbH" if noisy else "Lindmark Energie GmbH"
    period_label = "Abrechnungs zeitraum" if noisy else "Abrechnungszeitraum"
    lines = []
    if header:
        lines += header
    lines += [
        f"# Stromrechnung {inv}",
        "",
        f"{supplier} · Vertrieb Gewerbekunden · Postfach 00 00 · (erfundener Lieferant)",
        "",
        "Rechnungsempfänger:",
        *addressee_lines,
        "",
        f"Kundennummer: {customer_no}",
        f"Rechnungsnummer: {inv}",
        f"Zählpunkt: {meter}",
        f"{period_label}: {ps} bis {pe}",
        "",
        "| Position | Menge | Preis | Betrag |",
        "|---|---|---|---|",
        f"| Verbrauch (Arbeitspreis) | {de_int(kwh)} kWh | {fmt(PRICE_EL, 4, 'de')} €/kWh | {eur(net_energy)} |",
        f"| Grundpreis | {months} Monat{'e' if months > 1 else ''} | {eur(BASE_FEE_EL)} | {eur(base)} |",
        f"| Summe netto | | | {eur(net)} |",
        f"| USt 19 % | | | {eur(vat)} |",
        f"| Rechnungsbetrag | | | {eur(gross)} |",
        "",
        f"Verbrauch {de_int(kwh)} kWh",
        f"Abschlag ab dem nächsten Monat: {eur(advance)} (Vorauszahlung, keine Verbrauchsmenge)",
        "",
        "Stromkennzeichnung nach § 42 EnWG: im Kit weggelassen (Vereinfachung, siehe README).",
    ]
    return lines


DOCS = []


def doc(path, lines, trap=None, note_en=""):
    DOCS.append({"path": path, "lines": lines, "trap": trap, "note_en": note_en})


ADDR_WN = ["Kellbrunn Präzisionsteile GmbH", "Werk Nord, Werkstraße 12", "(erfundener Standort in Hessen)"]
for inv, m1, m2, kwh, fn in WN_BILLS:
    doc(f"rohdaten_2025/Werk_Nord/Strom/{fn}", el_bill(inv, m1, m2, kwh, addressee_lines=ADDR_WN, meter=METER_WN),
        trap=("two-month" if m1 == 11 else ("real-dip" if m1 == 8 else None)))
doc(f"rohdaten_2025/Werk_Nord/Strom/{WN_DUPLICATE[4]}",
    el_bill(*WN_DUPLICATE[:4], addressee_lines=["Kellbrunn Präzisionsteile GmbH", "Werk Nord,", "Werkstraße 12", "(erfundener Standort in Hessen)"],
            meter=METER_WN, noisy=True,
            header=["WG: Rechnung März (weitergeleitet vom Einkauf, erneut gescannt)", ""]),
    trap="T1", note_en="Same invoice number 4711-03; OCR noise in supplier name and a stray line break, invoice number clean.")
doc(f"rohdaten_2025/Werk_Nord/Strom/{JV_BILL[4]}",
    el_bill(JV_BILL[0], 1, 12, JV_BILL[3], addressee_lines=["Talbrück Beschichtung GmbH", "Halle 3, Werkstraße 12", "z. Hd. Einkauf Kellbrunn Präzisionsteile GmbH (Rechnungsprüfung laut Dienstleistungsvertrag)"], meter=METER_TB, customer_no=CUSTOMER_NO_JV),
    trap="T3", note_en="Contract party, customer number and meter belong to the JV; Kellbrunn purchasing only checks the invoice.")

ws_lines = [
    "# Jahresübersicht Strom 2025",
    "",
    "Lindmark Energie GmbH · Tarif Ökostrom Plus · (erfundener Lieferant)",
    "",
    "Kunde: Kellbrunn Präzisionsteile GmbH, Werk Süd",
    f"Zählpunkt: {METER_WS}",
    "Zeitraum: 01.01.2025 bis 31.12.2025",
    "",
    f"Verbrauch 2025: {WS_MWH_PRINTED} MWh",
    f"Vorjahr: {WS_PRIOR_YEAR_PRINTED} MWh",
    "",
    "Ihr Tarif Ökostrom Plus: Für Ihre Liefermenge wurden Herkunftsnachweise entwertet (Bestätigung liegt bei).",
]
doc("rohdaten_2025/Werk_Sued/Jahresuebersicht_2025_Oekostrom.md", ws_lines, trap="T4")
go_lines = [
    "# Bestätigung über entwertete Herkunftsnachweise 2025",
    "",
    "Lindmark Energie GmbH · (erfundener Lieferant)",
    "",
    f"Herkunftsnachweise über {de_int(GO_MWH)} MWh, Erzeugungsjahr 2025, Wasserkraft,",
    "entwertet im Herkunftsnachweisregister für die Liefermenge an",
    "Kellbrunn Präzisionsteile GmbH, Lieferstelle Werk Süd,",
    f"Zählpunkt {METER_WS}.",
    "",
    "Andere Lieferstellen sind von dieser Bestätigung nicht erfasst.",
]
doc("rohdaten_2025/Werk_Sued/HKN_Bestaetigung_2025.md", go_lines, trap="scope2")


def gas_bill(site):
    g = GAS[site]
    net = D(g["kwh_printed"]) * PRICE_GAS
    vat = r(net * VAT, 2)
    addr = ADDR_WN if site == "WN" else ["Kellbrunn Präzisionsteile GmbH", "Werk Süd, Talweg 4", "(erfundener Standort in Hessen)"]
    return [
        f"# Gas-Jahresrechnung {g['invoice']}",
        "",
        "Lindmark Energie GmbH · Erdgas Gewerbe · (erfundener Lieferant)",
        "",
        "Rechnungsempfänger:",
        *addr,
        "",
        "Abrechnungszeitraum: 01.01.2025 bis 31.12.2025",
        "",
        "| Position | Menge | Preis | Betrag |",
        "|---|---|---|---|",
        f"| Erdgas, Energiemenge | {de_int(g['kwh_printed'])} kWh | {fmt(PRICE_GAS, 4, 'de')} €/kWh | {eur(net)} |",
        f"| USt 19 % | | | {eur(vat)} |",
        f"| Rechnungsbetrag | | | {eur(net + vat)} |",
        "",
        f"Energiemenge {de_int(g['kwh_printed'])} kWh",
        "",
        "--- Seite 2 ---",
        "",
        "Erläuterungen zur Abrechnung",
        f"Die Energiemenge wurde aus dem Volumen ermittelt: {de_int(g['m3'])} m³ × Zustandszahl {fmt(g['z'], 4, 'de')} × Brennwert (Hs) {fmt(g['hs'], 3, 'de')} kWh/m³ = {fmt(g['kwh_exact'], 2, 'de')} kWh, kaufmännisch gerundet {de_int(g['kwh_printed'])} kWh.",
        "Abrechnung nach Brennwert (Hs) gemäß DVGW-Arbeitsblatt G 685.",
    ]


doc("rohdaten_2025/Werk_Nord/Gas/Gas_Jahresrechnung_WN_2025.md", gas_bill("WN"), trap="T5")
doc("rohdaten_2025/Werk_Sued/Gas_Jahresrechnung_WS_2025.md", gas_bill("WS"), trap="T5")
for q, kwh in LO_QUARTERS:
    qi = int(q[1])
    doc(f"rohdaten_2025/Lager_Ost/Nebenkosten_Strom_{q}_2025.md", [
        f"# Nebenkostenabrechnung Strom {q} 2025",
        "",
        f"{META['landlord']} · (erfundene Vermieterin)",
        "",
        "Mieterin: Kellbrunn Präzisionsteile GmbH, Lager Ost",
        f"Zeitraum: 01.{(qi - 1) * 3 + 1:02d}.2025 bis {MONTH_END[qi * 3 - 1]:02d}.{qi * 3:02d}.2025",
        "",
        f"Unterzähler {METER_LO}: {de_int(kwh)} kWh",
        "Tarif: Graustrom (Vertrag der Vermieterin)",
        f"Umlage: {eur(D(kwh) * PRICE_EL)} netto",
    ])

# ---------------------------------------------------------------------------
# 16. Kit CSV writers
# ---------------------------------------------------------------------------
def write_csv(rel, header, rows):
    path = os.path.join(KIT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh, delimiter=";", lineterminator="\n")
        w.writerow(header)
        w.writerows([[str(c).replace(MINUS, "-") for c in row] for row in rows])


def write_text(rel, lines):
    path = os.path.join(KIT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")


for d in DOCS:
    write_text(d["path"], d["lines"])

write_csv("rohdaten_2025/Werk_Nord/Zaehlerstaende_2025.csv", ["datum", "zaehler", "wandlerfaktor", "stand_kwh", "erfasst_von"],
          [[dt, METER_WN, "1", str(val), "Haustechnik"] for dt, val in METER_READINGS])

# fuel card transactions
PLATES = [f"XX-KP {100 + i}" for i in range(1, COMPANY["vehicles"] + 1)]
PATTERN = [5237, 6118, 4890, 5745, 6302, 5511, 4976, 6034, 5823, 5469]  # hundredths of a litre
fuel_rows = []
for mi, total in enumerate(DIESEL_MONTH, start=1):
    remaining = total * 100
    day, k = 2, 0
    while remaining > 0:
        amt = min(PATTERN[k % len(PATTERN)], remaining)
        if 0 < remaining - amt < 2000:  # avoid a tiny last fill
            amt = remaining
        plate = PLATES[k % len(PLATES)]
        litres = D(amt) / 100
        fuel_rows.append([f"{min(day, MONTH_END[mi - 1]):02d}.{mi:02d}.2025", plate, "Diesel", fmt(litres, 2, "de").replace(".", ""), "l", fmt(litres * PRICE_DIESEL, 2, "de").replace(".", "")])
        remaining -= amt
        k += 1
        day = 2 + (k * 28) // 60
    for j in range(2):
        fuel_rows.append([f"{10 + j * 10:02d}.{mi:02d}.2025", PLATES[j], "AdBlue", "50,00", "l", fmt(D(50) * PRICE_ADBLUE, 2, "de")])
    for j in range(WASH_MONTH[mi - 1]):
        fuel_rows.append([f"{12 + j * 5:02d}.{mi:02d}.2025", PLATES[j + 3], "Waesche", "1", "Stk", fmt(PRICE_WASH, 2, "de")])
    fuel_rows.append([f"15.{mi:02d}.2025", PLATES[5], "Shop", "1", "Stk", "8,49"])
fuel_rows.sort(key=lambda x: (x[0][3:5], x[0][0:2]))
chk_d = sum(D(x[3].replace(",", ".")) for x in fuel_rows if x[2] == "Diesel")
chk_a = sum(D(x[3].replace(",", ".")) for x in fuel_rows if x[2] == "AdBlue")
assert chk_d == diesel_l and chk_a == adblue_l, (chk_d, chk_a)
write_csv("rohdaten_2025/Flotte/Tankkarten_2025.csv", ["datum", "kennzeichen", "produkt", "menge", "einheit", "betrag_eur"], fuel_rows)

write_csv("vorjahr/THG_2024_Zusammenfassung.csv",
          ["zeile", "standort", "traeger", "menge", "einheit", "faktor_lb", "t_lb", "faktor_mb", "t_mb", "grenze", "dq", "quelle"],
          [["V24-01", "WN", "Strom", str(PRIOR_2024["el_WN"]), "kWh", "F-EL-LB-2024", dec_de(D(PRIOR_2024["el_WN"]) * f["F-EL-LB-2024"] / T), "F-EL-RM-2024", dec_de(D(PRIOR_2024["el_WN"]) * f["F-EL-RM-2024"] / T), "operative Kontrolle; Talbrück ausgeschlossen", "B", "Berater, Zusammenfassung ohne Einzelrechnungen"],
           ["V24-02", "WS", "Strom", str(PRIOR_2024["el_WS"]), "kWh", "F-EL-LB-2024", dec_de(D(PRIOR_2024["el_WS"]) * f["F-EL-LB-2024"] / T), "F-EL-RM-2024", dec_de(D(PRIOR_2024["el_WS"]) * f["F-EL-RM-2024"] / T), "operative Kontrolle; Talbrück ausgeschlossen", "B", "Berater"],
           ["V24-03", "LO", "Strom", str(PRIOR_2024["el_LO"]), "kWh", "F-EL-LB-2024", dec_de(D(PRIOR_2024["el_LO"]) * f["F-EL-LB-2024"] / T), "F-EL-RM-2024", dec_de(D(PRIOR_2024["el_LO"]) * f["F-EL-RM-2024"] / T), "operative Kontrolle; Talbrück ausgeschlossen", "B", "Berater"],
           ["V24-04", "WN", "Erdgas (Hs)", str(PRIOR_2024["gas_WN"]), "kWh(Hs)", "F-GAS-HS", dec_de(D(PRIOR_2024["gas_WN"]) * f["F-GAS-HS"] / T), "F-GAS-HS", dec_de(D(PRIOR_2024["gas_WN"]) * f["F-GAS-HS"] / T), "operative Kontrolle", "B", "Berater"],
           ["V24-05", "WS", "Erdgas (Hs)", str(PRIOR_2024["gas_WS"]), "kWh(Hs)", "F-GAS-HS", dec_de(D(PRIOR_2024["gas_WS"]) * f["F-GAS-HS"] / T), "F-GAS-HS", dec_de(D(PRIOR_2024["gas_WS"]) * f["F-GAS-HS"] / T), "operative Kontrolle", "B", "Berater"],
           ["V24-06", "FL", "Diesel", str(PRIOR_2024["diesel_l"]), "l", "F-DSL", dec_de(D(PRIOR_2024["diesel_l"]) * f["F-DSL"] / T), "F-DSL", dec_de(D(PRIOR_2024["diesel_l"]) * f["F-DSL"] / T), "operative Kontrolle", "B", "Berater"],
           ["V24-SUM", "alle", "Summe Scope 1 + 2", "", "", "", dec_de(lb24), "", dec_de(mb24), "", "B", "180 Beschäftigte 2024"]])

write_csv("faktoren/faktoren_lehrwerte.csv", ["factor_id", "bezeichnung", "wert", "einheit", "basis", "jahr", "region", "hinweis", "status"],
          [[k, v["label_de"], fmt(v["value"], 2 if k != "C-DSL-E" else 1, "de"), v["unit"], v["basis"], v["year"], "DE", v["note"], "Lehrwert, kein amtlicher Faktor"] for k, v in FACTORS.items()])

write_csv("erwartet/belegtabelle_2025.csv", LEDGER_COLS, [[row[c] for c in LEDGER_COLS] for row in LEDGER])
blank = {c: "" for c in LEDGER_COLS}
worked = next(x for x in LEDGER if x["row_id"] == "E-WN-03")
half = dict(next(x for x in LEDGER if x["row_id"] == "E-WS-01"))
for c in ("qty_norm", "factor_lb", "factor_mb", "t_lb", "t_mb", "instrument_id"):
    half[c] = "?"
alone = dict(blank, row_id="E-WN-10")
write_csv("belegtabelle/belegtabelle_2025_leer.csv", LEDGER_COLS,
          [[worked[c] for c in LEDGER_COLS], [half[c] for c in LEDGER_COLS], [alone[c] for c in LEDGER_COLS]])
MONTH_COLS = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "dez"]
write_csv("belegtabelle/abdeckung_standort_monat_leer.csv", ["standort_traeger"] + MONTH_COLS, [[g] + [""] * 12 for g in GRID_ROWS])
write_csv("erwartet/abdeckung_standort_monat.csv", ["standort_traeger"] + MONTH_COLS, [[g] + grid_expected[g] for g in GRID_ROWS])
write_csv("erwartet/abdeckung_wie_angeliefert.csv", ["standort_traeger"] + MONTH_COLS + ["ausserhalb_raster"],
          [[g] + grid_raw[g] + (["Talbrück Beschichtung GmbH: 12 Monate"] if g == "WN Strom" else [""]) for g in GRID_ROWS])
wf_rows = []
for m in ("lb", "mb"):
    for i, x in enumerate(WF[m]):
        wf_rows.append(["standortbasiert" if m == "lb" else "marktbasiert", "Scope 1 + 2", str(i), x["step"], x["label_de"], "" if x["change_t"] is None else x["change_de"], x["running_de"]])
write_csv("erwartet/wasserfall.csv", ["methode", "umfang", "reihenfolge", "falle", "schritt", "aenderung_t", "laufende_summe_t"], wf_rows)
zr = [["standortbasiert", d[0], d[2], d[4].replace(",", "X").replace(".", ",").replace("X", "."), fmt(d[3], 1, "de", True), fmt(d[3] / chg_lb * 100, 0, "de")] for d in drv_lb]
zr.append(["standortbasiert", "summe", "Summe 2024 auf 2025", "2.017,5 auf 1.915,2", fmt(chg_lb, 1, "de", True), "100"])
zr += [["marktbasiert", d[0], d[2], d[4].replace(",", "X").replace(".", ",").replace("X", "."), fmt(d[3], 1, "de", True), fmt(d[3] / chg_mb * 100, 0, "de")] for d in drv_mb]
zr.append(["marktbasiert", "summe", "Summe 2024 auf 2025", "2.674,5 auf 1.893,2", fmt(chg_mb, 1, "de", True), "100"])
write_csv("erwartet/zerlegung_2024_2025.csv", ["methode", "treiber", "bezeichnung", "rechnung", "aenderung_t", "anteil_prozent"], zr)
# documents first, then their sum; the October meter reading is not a document and appears only below the sum
kt = [[a, str(q), s_] for a, _, q, s_ in CONTROL_TOTAL[:5]]
assert sum(q for _, _, q, _ in CONTROL_TOTAL[:5]) == docs_all
kt += [["Summe Belege Strom", str(docs_all), ""], ["minus ausgeschlossen (Duplikat, Grenze)", str(excluded), ""],
       ["plus Oktober Werk Nord aus Zählerständen", str(oct_kwh), CONTROL_TOTAL[5][3]], ["Kontrollsumme = Strom in der Grenze", str(ctl), "stimmt mit Belegtabelle"]]
write_csv("erwartet/kontrollsumme_strom_2025.csv", ["position", "kwh", "status"], kt)

# ---------------------------------------------------------------------------
# 17. JSON
# ---------------------------------------------------------------------------
def jsonable_trap(t):
    return {k: v for k, v in t.items()}


data = {
    "meta": META,
    "company": COMPANY,
    "question": {
        "en": "What were our Scope 1 and 2 emissions in 2025, and did they go down compared with 2024?",
        "de": "Wie hoch waren unsere Scope-1- und Scope-2-Emissionen 2025, und sind sie gegenüber 2024 gesunken?",
    },
    "factors": {k: {**{kk: vv for kk, vv in v.items() if kk != "value"}, "value": float(v["value"])} for k, v in FACTORS.items()},
    "factorEdition": FACTOR_EDITION,
    "inputs": {
        "wnBills": [dict(invoice=b[0], firstMonth=b[1], lastMonth=b[2], kwh=b[3], file=b[4]) for b in WN_BILLS],
        "wnDuplicate": dict(invoice=WN_DUPLICATE[0], kwh=WN_DUPLICATE[3], file=WN_DUPLICATE[4]),
        "wnMissingInvoice": WN_OCT_INVOICE,
        "jvBill": dict(invoice=JV_BILL[0], kwh=JV_BILL[3], file=JV_BILL[4], meter=METER_TB),
        "meterReadings": [dict(date=d_, kwh=v_) for d_, v_ in METER_READINGS],
        "ws": dict(printed=WS_MWH_PRINTED + " MWh", kwh=WS_KWH, misreadKwh=WS_KWH_MISREAD, priorYearPrinted=WS_PRIOR_YEAR_PRINTED + " MWh", meter=METER_WS),
        "go": dict(mwh=GO_MWH, kwh=GO_KWH, site="WS"),
        "lo": [dict(quarter=q, kwh=k) for q, k in LO_QUARTERS],
        "gas": {k: dict(m3=g["m3"], z=float(g["z"]), hs=float(g["hs"]), kwhExact=float(g["kwh_exact"]), kwhPrinted=g["kwh_printed"], invoice=g["invoice"], file=g["file"]) for k, g in GAS.items()},
        "dieselMonthL": DIESEL_MONTH, "adblueMonthL": ADBLUE_MONTH,
        "prior2024": PRIOR_2024,
        "meters": {"WN": METER_WN, "WS": METER_WS, "TB": METER_TB, "LO": METER_LO},
        "customerNo": CUSTOMER_NO, "customerNoJV": CUSTOMER_NO_JV,
        "variant2023": {**VARIANT_2023, "note": "Appendix A6 only. Werk 3 (foundry) sold on 2024-07-01; W3 = el_W3 plus gas_W3 (Hs). Factors: F-EL-LB-2023, F-EL-RM-2023, F-GAS-HS, F-DSL."},
        "steel": {"t_2024": STEEL["t_2024"], "t_2025": STEEL["t_2025"], "eur_2024": STEEL["eur_2024"], "eur_2025": STEEL["eur_2025"],
                  "spendFactor_kg_per_eur": float(STEEL["F_SPEND"]), "deflator_2025_vs_2024": float(STEEL["DEFLATOR_2025_vs_2024"]),
                  "supplierPcf_kg_per_t": float(STEEL["PCF_kg_per_t"]), "supplierS12Intensity_t_per_t": float(STEEL["S12_intensity"]),
                  "note": "Appendix A7 only. Teaching values; supplier Bandstahl Wendelin GmbH is fictional."},
    },
    "numbers": NUM,
    "traps": [jsonable_trap(t) for t in TRAPS],
    "trapNotes": {"twoMonthBill_en": "0 t in the sum; keeps the file count at 12 and hides the missing October.",
                  "twoMonthBill_de": "0 t in der Summe; hält die Dateizahl bei 12 und versteckt den fehlenden Oktober.",
                  "august_en": "August 120,000 kWh is real (plant holiday). Flag it, do not correct it.",
                  "august_de": "August 120.000 kWh ist echt (Betriebsferien). Markieren, nicht korrigieren."},
    "waterfall": WF,
    "combinations": combos,
    "trapBits": {t: 1 << i for i, t in enumerate(TRAP_IDS)},
    "demoSequence": DEMO_SEQUENCE,
    "drivers": {
        "lb": [dict(id=d[0], en=d[1], de=d[2], t=float(r(d[3])), arithmetic=d[4]) for d in drv_lb],
        "mb": [dict(id=d[0], en=d[1], de=d[2], t=float(r(d[3])), arithmetic=d[4]) for d in drv_mb],
        "convention_en": "Consumption effects use the 2024 factor; the factor effect uses 2025 consumption. The residual mix is held at 0.60 in both years on purpose, so the market-based bridge has no factor effect. Real residual mixes change every year.",
        "convention_de": "Verbrauchseffekte mit dem Faktor 2024; der Faktoreffekt mit dem Verbrauch 2025. Der Residualmix bleibt absichtlich in beiden Jahren bei 0,60, deshalb hat die marktbasierte Brücke keinen Faktoreffekt. Echte Residualmixe ändern sich jedes Jahr.",
    },
    "ranking": {**RANKING, "shareNote_en": "Shares are rounded one by one and may not add up to exactly 100%.", "shareNote_de": "Anteile einzeln gerundet; die Summe kann von 100 % abweichen."},
    "controlTotal": [dict(de=a, en=b, kwh=q, status=s_, group=("meter" if i == 5 else "document")) for i, (a, b, q, s_) in enumerate(CONTROL_TOTAL)],
    "ledger": LEDGER,
    "ledgerColumns": LEDGER_COLS,
    "coverage": {"rows": GRID_ROWS, "expected": grid_expected, "asDelivered": grid_raw, "legend": GRID_LEGEND},
    "traceTwo": TRACE,
    "documents": DOCS,
    "runs": {
        "status": "not_captured",
        "plannedConditions": ["A: raw folder", "B: ledger + coverage grid + rules", "C (optional): raw folder without the factor file"],
        "runsPerCondition": 5,
        "scoredItems": ["Scope 1", "Scope 2 LB", "Scope 2 MB", "change vs 2024 LB", "flag T1", "flag T2", "flag T3", "flag T4", "flag T5", "flag T6", "method T7", "August flagged not corrected", "asks about other Scope 1 sources"],
        "table": [],
    },
}

text = json.dumps(data, ensure_ascii=False, indent=1)
assert "–" not in text and "—" not in text, "en/em dash in data"
for root, _, files in os.walk(KIT):
    for fn in files:
        with open(os.path.join(root, fn), encoding="utf-8") as fh:
            body = fh.read()
        assert "–" not in body and "—" not in body, fn
with open(os.path.join(HERE, "w04-data.json"), "w", encoding="utf-8") as fh:
    fh.write(text + "\n")

# console summary
for k in ("total_lb_2025", "total_mb_2025", "wrong_total_lb", "wrong_total_mb", "chg_lb_pct", "chg_mb_pct", "wrong_chg_lb_pct", "gap_lb_t", "gap_lb_pct",
          "drv_lb_grid_share_pct", "drv_mb_cert_share_pct", "pair_dup_oct_t", "pair_jv_unit_t", "jv_hides_unit_share_pct", "demo_only_jv_lb_t",
          "demo_only_jv_vs2024_pct", "demo_jv_unit_lb_t", "demo_jv_unit_vs2024_pct", "demo_jv_unit_mb_t", "energy_total_hi_mwh", "renewable_share_energy_pct",
          "var_2023_mb_reported_t", "var_2023_mb_restated_t", "var_chg_mb_vs_restated_pct", "per_employee_2025_t", "wrong_per_employee_t"):
    print(f"{k:32s} {NUM[k]['en']:>18s}   {NUM[k]['de']}")
print("waterfall lb:", " | ".join(f"{x['step']} {x['running_en']}" for x in WF["lb"]))
print("waterfall mb:", " | ".join(f"{x['step']} {x['running_en']}" for x in WF["mb"]))
print("numbers:", len(NUM), "ledger rows:", len(LEDGER), "documents:", len(DOCS), "fuel rows:", len(fuel_rows), "combos:", len(combos))
