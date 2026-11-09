# Liest register.csv und gibt drei Listen aus: abgelaufen, läuft in 60 Tagen ab, fehlt.
# Aufruf: python3 check.py [JJJJ-MM-TT]   (ohne Datum gilt das Systemdatum)
import csv, sys, datetime as dt
heute = dt.date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else dt.date.today()
grenze = heute + dt.timedelta(days=60)
abgelaufen, bald, fehlt = [], [], []
with open("register.csv", encoding="utf-8") as fh:
    for r in csv.DictReader(l for l in fh if not l.startswith("#")):
        tag = f'{r["person_id"]} {r["paper"]}'
        if r["date"] == "MISSING":
            fehlt.append(tag); continue
        if r["valid_until"]:
            v = dt.date.fromisoformat(r["valid_until"])
            if v < heute: abgelaufen.append(f"{tag} gültig bis {v}")
            elif v <= grenze: bald.append(f"{tag} gültig bis {v}")
print(f"Stichtag {heute}")
for name, liste in (("abgelaufen", abgelaufen), ("läuft in den nächsten 60 Tagen ab", bald), ("fehlt", fehlt)):
    print(f"\n{name}: {len(liste)}")
    for x in liste: print("  " + x)
