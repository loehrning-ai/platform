# Baut register.csv aus den CSV-Dateien in ordner/. Zeilen mit # werden übersprungen.
import csv, datetime as dt
D = "ordner/"
STICHTAG = dt.date(2026, 11, 26)
NIF = "NICHT IN DATEIEN"
OM = "Büroleiterin (E-02)"
def rows(f):
    with open(D + f, encoding="utf-8") as fh:
        return list(csv.DictReader(l for l in fh if not l.startswith("#")))
def d(s): return dt.date.fromisoformat(s)
def plus_months(x, m):
    y, mo = divmod(x.month - 1 + m, 12)
    return dt.date(x.year + y, mo + 1, x.day)
def six_months_before(x):
    y, mo = divmod(x.month - 1 - 6, 12)
    return dt.date(x.year + y, mo + 1, x.day)

contracts = rows("contracts_register_2026.csv")
reg = {r["id"]: r["date_filed"] for r in rows("registration_M1M2_2026.csv")}
med = {r["id"]: r["last_exam_date"] for r in rows("medical_exams.csv")}
leave = {r["id"]: r["decision_date"] for r in rows("leave_decisions_2026.csv")}
ot_ids = sorted({r["id"] for r in rows("overtime_weekly_2026.csv") if float(r["overtime_hours"]) > 0})
# meldungen_ueberstunden_ordner.txt: Zeile "2026: (leer)", also keine Meldung 2026.
ot_notice = {}

out = []
for c in contracts:
    pid = c["id"]
    out.append([pid, "contract", c["start_date"], "", OM, "Vertragsordner im Büro, contracts_register_2026.csv", NIF])
    out.append([pid, "registration", reg.get(pid, "MISSING"), "", OM, "Ausdrucke der Arbeitsagentur, registration_M1M2_2026.csv", NIF])
    m = med.get(pid)
    out.append([pid, "medical-exam", m or "MISSING", plus_months(d(m), 24).isoformat() if m else "", OM,
                "Zettel vom Gesundheitszentrum, medical_exams.csv", NIF])
    if d(c["start_date"]) <= six_months_before(STICHTAG):
        out.append([pid, "leave-decision", leave.get(pid, "MISSING"), "", OM, "leave_decisions_2026.csv", NIF])
    if pid in ot_ids:
        out.append([pid, "overtime-notice", ot_notice.get(pid, "MISSING"), "", OM, "meldungen_ueberstunden_ordner.txt", NIF])
out.append(["FIRM", "safety-statement", "2019-03-14", "",
            "die Person mit dem Aktenordner (eine Berufsbezeichnung ist nicht angegeben)", "sicherheitserklaerung_2019.md", NIF])

with open("register.csv", "w", newline="", encoding="utf-8") as fh:
    w = csv.writer(fh)
    w.writerow(["person_id", "paper", "date", "valid_until", "owner", "where", "approved_by"])
    w.writerows(out)
print(len(out), "Zeilen")
