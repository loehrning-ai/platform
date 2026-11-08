# Builds register.csv from the folder files. Skips lines starting with #.
import csv, datetime as dt
F = "folder/"
D = dt.date.fromisoformat
def rows(name):
    with open(F + name, newline="") as fh:
        return list(csv.DictReader(l for l in fh if not l.startswith("#")))
def add_months(d, n):
    y, m = divmod(d.month - 1 + n, 12)
    y += d.year; m += 1
    import calendar
    return dt.date(y, m, min(d.day, calendar.monthrange(y, m)[1]))

NIF = "NOT IN FILES"
OM = "office manager (E-02)"
CUT = dt.date(2026, 11, 26)
people = [r["id"] for r in rows("employee_records_2026.csv")]
start = {r["id"]: D(r["f09"]) for r in rows("employee_records_2026.csv")}
con = {r["id"]: r["start_date"] for r in rows("contracts_register_2026.csv")}
reg = {r["id"]: r["date_filed"] for r in rows("registration_M1M2_2026.csv")}
med = {r["id"]: r["last_exam_date"] for r in rows("medical_exams.csv")}
lev = {r["id"]: r["decision_date"] for r in rows("leave_decisions_2026.csv")}
ot_people = sorted({r["id"] for r in rows("overtime_weekly_2026.csv") if float(r["overtime_hours"]) > 0})
# overtime_notices_folder.txt lists "2026: (empty)", so no 2026 notice exists for anyone.
notices_2026 = {}

out = []
for p in people:
    out.append([p, "contract", con.get(p, "MISSING"), "", OM, "contracts folder in the office", NIF])
    out.append([p, "registration", reg.get(p, "MISSING"), "", OM, "Employment Agency print-outs", NIF])
    m = med.get(p)
    out.append([p, "medical-exam", m or "MISSING", add_months(D(m), 24).isoformat() if m else "", OM, "health centre slips", NIF])
    if add_months(start[p], 6) <= CUT:
        out.append([p, "leave-decision", lev.get(p, "MISSING"), "", OM, "leave decisions", NIF])
    if p in ot_people:
        out.append([p, "overtime-notice", notices_2026.get(p, "MISSING"), "", OM, "overtime notices folder", NIF])
out.append(["FIRM", "safety-statement", "2019-03-14", "", "person with the binder (no job title in files)", "safety_statement_2019.md", NIF])

with open("register.csv", "w", newline="") as fh:
    fh.write("# Fictional training material, invented for the exercise.\n")
    w = csv.writer(fh)
    w.writerow(["person_id", "paper", "date", "valid_until", "owner", "where", "approved_by"])
    w.writerows(out)
print(len(out), "rows")
