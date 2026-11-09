# Reads register.csv and prints expired, expiring in the next 60 days, and missing papers.
# Usage: python3 check.py [YYYY-MM-DD]
import csv, sys, datetime as dt
today = dt.date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else dt.date.today()
limit = today + dt.timedelta(days=60)
with open("register.csv", newline="") as fh:
    rows = list(csv.DictReader(l for l in fh if not l.startswith("#")))
expired, expiring, missing = [], [], []
for r in rows:
    tag = f'{r["person_id"]} {r["paper"]} {r["valid_until"] or r["date"]}'
    if r["date"] == "MISSING":
        missing.append(tag); continue
    if r["valid_until"]:
        v = dt.date.fromisoformat(r["valid_until"])
        if v < today: expired.append(tag)
        elif v <= limit: expiring.append(tag)
print(f"Today {today}. Data rows read: {len(rows)}")
for name, lst in (("EXPIRED", expired), ("EXPIRING IN 60 DAYS", expiring), ("MISSING", missing)):
    print(f"{name}: {len(lst)}")
    for t in lst: print("  " + t)
