#!/usr/bin/env python3
"""Generate a small, realistic weekly demand series for the take-home homework.

Deterministic (seeded) so it is reproducible on any machine. Trend + annual
seasonality + a Q4 holiday bump + noise — enough structure that a naive baseline
is beatable by simple smoothing, and MAE/bias are meaningful. Two years (104
weeks); the homework hides the last ~14 weeks as a test set.

    python3 make-demand-series.py   ->   demand-weekly.csv  (week_start, units)
"""
import csv, math, random, datetime, os

random.seed(42)  # reproducible
START = datetime.date(2024, 1, 1)
WEEKS = 104
BASE, TREND, AMP = 520, 1.6, 140

rows = []
for w in range(WEEKS):
    d = START + datetime.timedelta(weeks=w)
    season = AMP * math.sin(2 * math.pi * (w % 52) / 52 - math.pi / 2)
    holiday = 95 if d.month in (11, 12) else 0
    noise = random.gauss(0, 34)
    units = max(0, round(BASE + TREND * w + season + holiday + noise))
    rows.append((d.isoformat(), units))

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "demand-weekly.csv")
with open(out, "w", newline="") as f:
    wr = csv.writer(f)
    wr.writerow(["week_start", "units"])
    wr.writerows(rows)
print(f"wrote {len(rows)} rows -> {out}")
