#!/usr/bin/env python3
"""Recompute every number in CHECK-YOUR-RESULT.md from the demo files.

In plain words
--------------
The check sheet tells you what Claude should answer and which wrong answers you may see.
This script does the arithmetic again from the CSV files, so nobody has to trust the sheet.
It needs only Python 3.8 or newer. No packages, no database, no network, no AI.

    python3 check_numbers.py

It reads two folders and never writes anything:
  A-export-tables/        the two files for Chat A (export lane)
  ../claude/project/      the approved-view files for Project B

Every line prints PASS or FAIL. The last line says "DEMO NUMBERS n of n PASS".
These checks test the demo files and the course's arithmetic. They do not test Claude.
Claude's answers go into AI-RUN-LOG.md.

For builders
------------
- The expected values below are the workshop's fixed facts (DECK), the demo-only fill,
  the replay rows (G04, G05) and the dry-run observations. They are typed in by hand on
  purpose: the truth must not be computed by the thing under test.
- Exit code 0 when every check passes, 1 otherwise. Safe to run in CI.
"""

import csv
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
A_DIR = HERE / "A-export-tables"
B_DIR = HERE.parent / "claude" / "project"

Q2 = ["2026-04-01", "2026-05-01", "2026-06-01"]
SEGMENTS = ["Enterprise", "Mid-Market", "SMB"]

RESULTS = []


def check(label, actual, expected):
    ok = actual == expected
    RESULTS.append(ok)
    status = "PASS" if ok else "FAIL"
    print(f"  {status}  {label}: {fmt(actual)}" + ("" if ok else f"   (expected {fmt(expected)})"))
    return ok


def fmt(value):
    if isinstance(value, list):
        return " / ".join(fmt(v) for v in value) if value else "none"
    if isinstance(value, tuple):
        return " ".join(fmt(v) for v in value)
    if isinstance(value, int) and not isinstance(value, bool):
        return f"{value:,}"
    return str(value)


def read(path):
    with open(path, newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def section(title):
    print()
    print(title)


def pct(numerator, denominator, places):
    if denominator == 0:
        return None
    return round(100 * numerator / denominator, places)


PROJECT_B_FILES = ["PROJECT-INSTRUCTIONS.txt", "metric-definitions.md", "mrr_summary_monthly.csv",
                   "logo_churn_by_segment_quarter.csv", "expansion_mrr_by_country_monthly.csv",
                   "account_mrr_monthly.csv", "data_status_by_view.csv"]
APPROVED_METRICS = ["ending_mrr", "net_new_mrr", "logo_churn_rate", "expansion_mrr", "account_ending_mrr"]


def main():
    # ------------------------------------------------------------------ upload set
    section("0. Project B upload set (../claude/project/)")
    missing = [f for f in PROJECT_B_FILES if not (B_DIR / f).is_file()]
    check("Required Project B files missing", missing, [])
    if missing:
        print()
        print(f"DEMO NUMBERS {sum(RESULTS)} of {len(RESULTS)} PASS. Stopped: the Project B upload set is incomplete.")
        return 1
    definitions = (B_DIR / "metric-definitions.md").read_text(encoding="utf-8")
    check("Approved metrics without 'name (version 1.0.0)' in metric-definitions.md",
          [m for m in APPROVED_METRICS if f"### {m} (version 1.0.0)" not in definitions], [])

    revenue = read(A_DIR / "monthly_revenue.csv")
    customers = read(A_DIR / "customer_master.csv")
    summary = {r["month_start"]: r for r in read(B_DIR / "mrr_summary_monthly.csv")}
    churn = read(B_DIR / "logo_churn_by_segment_quarter.csv")
    expansion = read(B_DIR / "expansion_mrr_by_country_monthly.csv")
    accounts = read(B_DIR / "account_mrr_monthly.csv")
    status = read(B_DIR / "data_status_by_view.csv")

    # ------------------------------------------------------------------ truth
    section("1. Truth: Project B files (approved views)")
    ending = {m: int(summary[m]["ending_mrr_eur"]) for m in summary}
    change = {m: int(summary[m]["net_new_mrr_eur"]) for m in summary}
    check("Ending MRR Apr / May / Jun 2026", [ending[m] for m in Q2], [334675, 344450, 387015])
    check("Ending MRR Mar 2026", ending["2026-03-01"], 354635)
    check("Ending MRR Dec 2025 (demo-only fill)", ending["2025-12-01"], 258785)
    check("Ending MRR Jan / Feb 2026 (demo-only fill)",
          [ending["2026-01-01"], ending["2026-02-01"]], [272995, 294475])
    check("Net new MRR Jan..Jun 2026",
          [change[m] for m in ["2026-01-01", "2026-02-01", "2026-03-01"] + Q2],
          [14210, 21480, 60160, -19960, 9775, 42565])
    q2_net_new = sum(change[m] for m in Q2)
    check("Q2 net new = sum of the three changes", q2_net_new, 32380)
    check("Q2 net new = Jun ending - Mar ending", ending["2026-06-01"] - ending["2026-03-01"], 32380)
    check("Bathtub: 354,635 + 32,380", ending["2026-03-01"] + q2_net_new, 387015)
    check("Bathtub from Dec: 258,785 + 14,210 + 21,480 + 60,160 - 19,960",
          ending["2025-12-01"] + sum(change[m] for m in
                                     ["2026-01-01", "2026-02-01", "2026-03-01", "2026-04-01"]),
          334675)
    bad = [m for m in summary if m >= "2025-02-01"
           and int(summary[m]["ending_mrr_eur"]) - change[m] != ending[prev_month(m)]]
    check("Every month: previous ending + change = ending (months failing)", len(bad), 0)
    check("Counter-example: the three Q2 levels summed (describes nothing)",
          sum(ending[m] for m in Q2), 1066140)
    check("complete_through_month / quality_status (every row)",
          sorted({(r["complete_through_month"], r["quality_status"]) for r in summary.values()}),
          [("2026-06-01", "passing")])

    # ------------------------------------------------------------------ chat A
    section("2. Chat A: monthly_revenue.csv (amount = each month's change)")
    company = defaultdict(int)
    by_segment = defaultdict(int)
    for r in revenue:
        company[r["dt"]] += int(r["amount"])
        by_segment[(r["dt"], r["segment"])] += int(r["amount"])
    months = sorted(company)
    check("Rows / months / segments", [len(revenue), len(months), len({r["segment"] for r in revenue})],
          [18, 6, 3])
    check("Company sum of amount per month equals net new MRR (months that differ)",
          len([m for m in months if company[m] != change[m]]), 0)
    check("Recorded wrong answer: sum(amount) by month for Q2", [company[m] for m in Q2],
          [-19960, 9775, 42565])
    check("April amount is negative in every segment",
          all(by_segment[("2026-04-01", s)] < 0 for s in SEGMENTS), True)
    print("       April by segment: " + " / ".join(
        f"{s} {by_segment[('2026-04-01', s)]:,}" for s in SEGMENTS))

    running = {}
    total = 0
    for m in months:
        total += company[m]
        running[m] = total
    check("Running total from January, end of March (dry run 'opening')", running["2026-03-01"], 95850)
    check("Rehearsal pattern (2 of 2 runs): running totals from January for Q2", [running[m] for m in Q2],
          [75890, 85665, 128230])
    check("Gap to the truth in every Q2 month (the missing Dec 2025 level)",
          sorted({ending[m] - running[m] for m in Q2}), [258785])
    check("Running-total Q2 growth 128,230 - 95,850 (a change, so it is right)",
          running["2026-06-01"] - running["2026-03-01"], 32380)
    seg_running = {}
    for s in SEGMENTS:
        acc = 0
        for m in months:
            acc += by_segment[(m, s)]
            seg_running[(m, s)] = acc
    print("       Running totals by segment in this file:")
    for m in ["2026-03-01"] + Q2:
        print(f"         {m[:7]}: " + " / ".join(f"{s} {seg_running[(m, s)]:,}" for s in SEGMENTS)
              + f"  = {running[m]:,}")
    check("Recorded wrong net new: June change - March change", company["2026-06-01"] - company["2026-03-01"],
          -17595)
    check("Chat A net new, adding the three Q2 changes (right answer, same table)",
          sum(company[m] for m in Q2), 32380)

    # ------------------------------------------------------------------ customers
    section("3. Chat A: customer_master.csv (status A / C / N)")
    check("Rows", len(customers), 144)
    seg_counts = {s: sum(1 for r in customers if r["seg"] == s) for s in SEGMENTS}
    check("Accounts per segment", [seg_counts[s] for s in SEGMENTS], [48, 48, 48])
    codes = defaultdict(int)
    for r in customers:
        codes[r["status"]] += 1
    check("Status codes A / C / N", [codes["A"], codes["C"], codes["N"]], [108, 12, 24])
    check("Other status values", sorted(set(codes) - {"A", "C", "N"}), [])
    per_seg = {s: [sum(1 for r in customers if r["seg"] == s and r["status"] == c) for c in "ACN"]
               for s in SEGMENTS}
    check("Per segment A / C / N (same in all three)", sorted({tuple(v) for v in per_seg.values()}),
          [(36, 4, 8)])
    cn_outside_q2 = [r for r in customers if r["status"] in "CN"
                     and not ("2026-04-01" <= r["status_dt"] < "2026-07-01")]
    check("Every C and N status date falls in Q2 2026 (rows outside)", len(cn_outside_q2), 0)
    a_after_march = [r for r in customers if r["status"] == "A" and r["status_dt"] >= "2026-04-01"]
    check("No A account starts after March 2026 (rows)", len(a_after_march), 0)
    monthly_moves = []
    for m in Q2:
        prefix = m[:7]
        monthly_moves.append((sum(1 for r in customers if r["status"] == "N" and r["status_dt"].startswith(prefix)),
                              sum(1 for r in customers if r["status"] == "C" and r["status_dt"].startswith(prefix))))
    check("New / churned accounts per month, all segments (Apr, May, Jun)", monthly_moves,
          [(6, 3), (6, 6), (12, 3)])
    start_base = {s: per_seg[s][0] + per_seg[s][1] for s in SEGMENTS}
    check("Starting accounts per segment (A + C, active on 1 Apr)", [start_base[s] for s in SEGMENTS],
          [40, 40, 40])
    check("Logo churn rate, right base: 4 of 40", [pct(per_seg[s][1], start_base[s], 1) for s in SEGMENTS],
          [10.0, 10.0, 10.0])
    check("Logo churn rate, wrong base with new accounts: 4 of 48",
          [pct(per_seg[s][1], seg_counts[s], 2) for s in SEGMENTS], [8.33, 8.33, 8.33])
    check("Rows with status = 'active' (the recorded search)",
          sum(1 for r in customers if r["status"] == "active"), 0)
    check("Active at end of March (A + C) / end of June (A + N)",
          [codes["A"] + codes["C"], codes["A"] + codes["N"]], [120, 132])
    check("Accounts per segment at end of June: 40 + 8 - 4", 40 + 8 - 4, 44)

    # ------------------------------------------------------------------ consistency with G05
    section("4. The two lanes describe the same company (customer_master vs account_mrr_monthly)")
    june = {r["account_key"]: r for r in accounts if r["month_start"] == "2026-06-01"}
    check("account_mrr_monthly rows (144 accounts x 18 months)", len(accounts), 2592)
    mismatch = []
    for r in customers:
        key = f"fl_{int(r['id']):04d}"
        a = june.get(key)
        if a is None or (a["customer_segment"], a["country_code"], a["plan_name"]) != (r["seg"], r["country"], r["plan"]):
            mismatch.append(key)
    check("Accounts whose segment, country or plan differ between lanes", len(mismatch), 0)
    churned_keys = {f"fl_{int(r['id']):04d}" for r in customers if r["status"] == "C"}
    check("Churned accounts with June MRR above 0", sum(1 for k in churned_keys if int(june[k]["ending_mrr_eur"]) > 0), 0)
    check("Sum of account June MRR = company ending MRR",
          sum(int(r["ending_mrr_eur"]) for r in june.values()), 387015)
    q2_account_sums = [sum(int(r["ending_mrr_eur"]) for r in accounts if r["month_start"] == m) for m in Q2]
    check("Sum of account MRR per Q2 month = company ending MRR", q2_account_sums, [334675, 344450, 387015])
    top = sorted(june.values(), key=lambda r: (-int(r["ending_mrr_eur"]), r["account_key"]))[:10]
    check("G05 top ten in June (replay)",
          [(r["account_key"], int(r["ending_mrr_eur"])) for r in top],
          [("fl_0006", 7705), ("fl_0132", 7695), ("fl_0060", 7595), ("fl_0114", 7435), ("fl_0078", 7385),
           ("fl_0042", 7335), ("fl_0069", 7280), ("fl_0033", 7265), ("fl_0123", 7250), ("fl_0087", 7235)])
    check("G05 accounts that churned in the export (fl_0087 must not)",
          sorted(k for k in churned_keys if k in {r["account_key"] for r in top}), [])
    check("fl_0006 / fl_0060 / fl_0087 in the export: segment, country",
          [(r["seg"], r["country"]) for r in customers if int(r["id"]) in (6, 60, 87)],
          [("Enterprise", "PL"), ("Enterprise", "NL"), ("Enterprise", "SE")])

    # ------------------------------------------------------------------ churn, expansion
    section("5. Project B: churn and expansion views")
    q2_churn = sorted((r["customer_segment"], int(r["starting_accounts"]), int(r["churned_accounts"]),
                       r["logo_churn_rate_pct"]) for r in churn
                      if r["period_start"] == "2026-04-01" and r["period_end_exclusive"] == "2026-07-01")
    check("G03 logo churn Q2 by segment", q2_churn,
          [("Enterprise", 40, 4, "10.0"), ("Mid-Market", 40, 4, "10.0"), ("SMB", 40, 4, "10.0")])
    check("Churn view uses period_start / period_end_exclusive (no quarter_start)",
          "quarter_start" not in churn[0] and "period_end_exclusive" in churn[0], True)
    pooled = pct(sum(x[2] for x in q2_churn), sum(x[1] for x in q2_churn), 1)
    check("Pooled Q2 churn, all segments: 12 of 120", pooled, 10.0)
    exp = defaultdict(int)
    for r in expansion:
        if r["month_start"] in Q2:
            exp[r["country_code"]] += int(r["expansion_mrr_eur"])
    check("G04 expansion MRR by country, Q2",
          sorted(exp.items(), key=lambda kv: (-kv[1], kv[0])),
          [("CH", 1990), ("DE", 1780), ("FR", 1780), ("SE", 1780), ("NL", 1655), ("PL", 1640),
           ("AT", 1565), ("GB", 705)])

    # ------------------------------------------------------------------ freshness
    section("6. Freshness (evaluation clock, never the wall clock)")
    loaded = {r["data_loaded_at_utc"] for r in status}
    check("data_loaded_at_utc (every view)", sorted(loaded), ["2026-07-01T06:00:00Z"])
    check("warn_after_hours / hard_expiry_hours", sorted({(r["warn_after_hours"], r["hard_expiry_hours"]) for r in status}),
          [("36", "")])
    loaded_at = parse(next(iter(loaded)))
    age_1 = hours(parse("2026-07-01T09:00:00Z") - loaded_at)
    age_2 = hours(parse("2026-07-03T18:00:00Z") - loaded_at)
    check("Age at 2026-07-01 09:00 UTC (hours), state", [age_1, state(age_1)], [3, "fresh"])
    check("Age at 2026-07-03 18:00 UTC (hours), state", [age_2, state(age_2)], [60, "stale_disclosed"])
    check("Views listed in data_status_by_view", len(status), 4)

    # ------------------------------------------------------------------ refusal inputs
    section("7. What the Project B files do not contain (why R01 and R02 must refuse)")
    headers = set()
    for f in sorted(B_DIR.glob("*.csv")):
        with open(f, newline="", encoding="utf-8") as handle:
            headers.update(next(csv.reader(handle)))
    words = ("email", "phone", "contact", "account_name", "address", "cost", "cogs", "margin", "profit", "recogni")
    forbidden = sorted(h for h in headers if any(w in h for w in words))
    check("Columns about identifiers, cost or profit", forbidden, [])
    check("A plan column exists (so 'no plan column' is not a valid refusal reason)", "plan_name" in headers, True)
    check("Identifier column is pseudonymous account_key only",
          sorted(h for h in headers if h.endswith("_key") or h.endswith("_id") or h == "id"), ["account_key"])

    check("Check sheet or answer key inside the Project B folder (must be none)",
          sorted(p.name for p in B_DIR.iterdir() if "CHECK" in p.name.upper() or "ANSWER" in p.name.upper()), [])

    passed = sum(RESULTS)
    print()
    print(f"DEMO NUMBERS {passed} of {len(RESULTS)} PASS. "
          "These check the demo files and the arithmetic, not Claude. Log Claude's answers in AI-RUN-LOG.md.")
    return 0 if passed == len(RESULTS) else 1


def prev_month(month):
    year, mon = int(month[:4]), int(month[5:7])
    year, mon = (year - 1, 12) if mon == 1 else (year, mon - 1)
    return f"{year:04d}-{mon:02d}-01"


def parse(text):
    return datetime.strptime(text, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)


def hours(delta):
    return int(delta.total_seconds() // 3600)


def state(age_hours):
    # Warn after 36 h and still answer. No hard expiry was written, so there is no block state.
    return "fresh" if age_hours <= 36 else "stale_disclosed"


if __name__ == "__main__":
    sys.exit(main())
