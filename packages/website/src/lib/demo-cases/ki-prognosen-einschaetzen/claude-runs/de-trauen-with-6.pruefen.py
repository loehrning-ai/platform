"""Prüft eine Wochenprognose an ihren alten Fehlern. Nur Python-Standardbibliothek, kein Netz.
Aufruf: python3 pruefen.py DATEI.csv [--fehlmenge 1,50] [--rest 0,40] [--messlatte "wie letzte Woche"]   Ausgabe: JSON
English: --shortage and --leftover are the same as --fehlmenge and --rest.
Spalten (Kopfzeile): woche, ist; optional prognose, hinweis, bestand_ende. Trenner ; , oder Tab.
Gleiche Regeln wie loehrning.ai/demos/ki-prognosen-einschaetzen."""
import argparse, csv, datetime as dt, io, json, math, re, sys

LERNEN, MIN_LERNEN, PRUEF, FENSTER = 26, 20, 13, 52   # Wochen
BIAS_MAX, TREFFER_MIN = 0.05, 9                      # Prüfregel: |Bias| <= 5 %, >= 9 von 13 in der Spanne
ALIAS = {"woche": "woche", "week": "woche", "datum": "woche", "date": "woche", "kw": "woche",
         "ist": "ist", "verkauft": "ist", "absatz": "ist", "sales": "ist", "actual": "ist",
         "prognose": "prognose", "forecast": "prognose", "tool_prognose": "prognose",
         "hinweis": "hinweis", "note": "hinweis", "kommentar": "hinweis",
         "bestand_ende": "bestand", "bestand": "bestand", "stock_end": "bestand"}
AUSVERKAUFT = ("ausverkauft", "sold out", "stockout", "fehlbestand")

def zahl(s, zeile):
    t = (s or "").strip().replace(" ", "").replace(" ", "").replace(" ", "")
    if not t: return None
    if re.fullmatch(r"\d{1,3}(\.\d{3})+(,\d+)?", t): t = t.replace(".", "").replace(",", ".")
    elif re.fullmatch(r"\d{1,3}(,\d{3})+(\.\d+)?", t): t = t.replace(",", "")
    elif re.fullmatch(r"\d+,\d+", t): t = t.replace(",", ".")
    if not re.fullmatch(r"\d+(\.\d+)?", t): sys.exit(f"Zeile {zeile}: '{s}' ist keine Zahl (negativ oder Text).")
    return float(t)

def datum(s, zeile):
    s = s.strip()
    for f in ("%Y-%m-%d", "%d.%m.%Y", "%d.%m.%y", "%d/%m/%Y"):
        try: return dt.datetime.strptime(s, f).date()
        except ValueError: pass
    m = re.fullmatch(r"(?:KW|W)\s?(\d{1,2})[/ -](\d{4})", s, re.I) or re.fullmatch(r"(\d{4})-W(\d{2})", s)
    if m:
        w, j = (int(m[1]), int(m[2])) if s[0] in "KkWw" else (int(m[2]), int(m[1]))
        return dt.date.fromisocalendar(j, w, 1)
    sys.exit(f"Zeile {zeile}: '{s}' ist kein Datum. Erlaubt: 2025-10-27, 27.10.2025, KW 44/2025.")

def lesen(text):
    r = list(csv.reader(io.StringIO(text), csv.Sniffer().sniff(text.splitlines()[0], delimiters=";,\t")))
    kopf = [ALIAS.get(h.strip().lower()) for h in r[0]]
    if "woche" not in kopf or "ist" not in kopf: sys.exit("Kopfzeile braucht mindestens: woche;ist")
    tage, hinweise = {}, []
    for nr, z in enumerate(r[1:], start=2):
        if not any(c.strip() for c in z): continue
        d = {k: (z[i] if i < len(z) else "") for i, k in enumerate(kopf) if k}
        w = datum(d["woche"], nr)
        zeile = dict(ist=zahl(d.get("ist"), nr), f=zahl(d.get("prognose"), nr), hinweis=d.get("hinweis", "").strip(),
                     zensiert=zahl(d.get("bestand"), nr) == 0 or any(a in d.get("hinweis", "").lower() for a in AUSVERKAUFT))
        if w in tage:
            if tage[w] == zeile: hinweise.append(f"{w}: doppelte Zeile, einmal gezählt"); continue
            sys.exit(f"Zeile {nr}: {w} steht zweimal mit verschiedenen Werten. Eine Zeile löschen.")
        tage[w] = zeile
    ws = sorted(tage)
    if len(ws) > 1 and min(b - a for a, b in zip(ws, ws[1:])).days == 1:
        sys.exit("Tageswerte: bitte vorher zu Wochen (Montag bis Sonntag) summieren.")
    rows = [dict(woche=ws[0], **tage[ws[0]])]
    for w in ws[1:]:
        while (w - rows[-1]["woche"]).days > 7:
            leer = rows[-1]["woche"] + dt.timedelta(7)
            hinweise.append(f"{leer}: Woche fehlt in der Datei, zählt nicht")
            rows.append(dict(woche=leer, ist=None, f=None, hinweis="", zensiert=False))
        rows.append(dict(woche=w, **tage[w]))
    return rows, hinweise

def q(xs, p):  # Quantil wie Excel QUANTIL.INKL (Typ 7)
    s = sorted(xs); h = (len(s) - 1) * p; i = math.floor(h)
    return s[i] + (h - i) * (s[min(i + 1, len(s) - 1)] - s[i])

def pruefen(rows, hinweise, fehlmenge, rest, messlatte):
    ist = [r["ist"] for r in rows]
    regeln = {"wie letzte Woche": lambda t: ist[t - 1] if t >= 1 else None,
              "wie Vorjahreswoche": lambda t: ist[t - 52] if t >= 52 else None,
              "Schnitt 4 Wochen": lambda t: sum(ist[t - 4:t]) / 4 if t >= 4 and None not in ist[t - 4:t] else None}
    hat_prognose = any(r["f"] is not None for r in rows)
    if messlatte not in regeln: sys.exit(f"Messlatte unbekannt. Erlaubt: {', '.join(regeln)}")
    letzte = max(t for t, r in enumerate(rows) if r["ist"] is not None)
    naechste = letzte + 1 if letzte + 1 < len(rows) else None
    gueltig = lambda t: ist[t] is not None and not rows[t]["zensiert"]
    F = (lambda t: rows[t]["f"]) if hat_prognose else regeln[messlatte]  # ohne Prognose: die Messlatte selbst
    wochen = [t for t in range(max(0, letzte - FENSTER + 1), letzte + 1)
              if gueltig(t) and F(t) is not None and regeln[messlatte](t) is not None]
    if len(wochen) < PRUEF: sys.exit(f"Zu wenig vergleichbare Wochen: {len(wochen)}. Nötig: {PRUEF}, besser 52.")
    A = sum(ist[t] for t in wochen)
    def kennzahlen(g):
        if any(g(t) is None for t in wochen): return None
        e = [g(t) - ist[t] for t in wochen]
        return dict(mae=sum(map(abs, e)) / len(e), bias=sum(e) / A, wape=sum(map(abs, e)) / A)
    tabelle = {"Prognose": kennzahlen(F)} if hat_prognose else {}
    tabelle.update({k: kennzahlen(g) for k, g in regeln.items()})
    def fehler(t, n):
        ws = [k for k in range(t) if gueltig(k) and F(k) is not None and regeln[messlatte](k) is not None][-n:]
        return [ist[k] - F(k) for k in ws], ws
    def spanne(t):
        e, _ = fehler(t, LERNEN); return (q(e, .1), q(e, .9)) if len(e) >= MIN_LERNEN else None
    def treffer(t):
        s = spanne(t); return None if s is None else s[0] <= ist[t] - F(t) <= s[1]
    def lampen(t):
        _, ws = fehler(t, PRUEF)
        if len(ws) < PRUEF: return None
        m = sum(abs(F(k) - ist[k]) for k in ws); mr = sum(abs(regeln[messlatte](k) - ist[k]) for k in ws)
        b = sum(F(k) - ist[k] for k in ws) / sum(ist[k] for k in ws); h = sum(1 for k in ws if treffer(k))
        l = dict(daten=ist[t - 1] is not None and F(t) is not None, messlatte=(m < mr) if hat_prognose else None,
                 bias=abs(b) <= BIAS_MAX, spanne=h >= TREFFER_MIN)
        return dict(l, frei=all(v for v in l.values() if v is not None), verhaeltnis=m / mr, bias_wert=b, treffer=h)
    gezaehlt = [t for t in wochen if treffer(t) is not None]
    out = dict(hinweise=hinweise, geprueft="Prognose" if hat_prognose else messlatte, messlatte=messlatte,
               von=str(rows[wochen[0]]["woche"]), bis=str(rows[wochen[-1]]["woche"]), wochen=len(wochen),
               nicht_bewertet=[(str(rows[t]["woche"]), "Ist fehlt" if ist[t] is None else "ausverkauft: Ist ist kleiner als die Nachfrage"
                                if rows[t]["zensiert"] else "keine Prognose gespeichert" if F(t) is None else "Vorwoche fehlt")
                               for t in range(wochen[0], letzte + 1) if t not in wochen],
               tabelle=tabelle, naeher=sum(abs(F(t) - ist[t]) < abs(regeln[messlatte](t) - ist[t]) for t in wochen),
               zu_hoch=sum(F(t) > ist[t] for t in wochen),
               spanne_treffer=sum(treffer(t) for t in gezaehlt), spanne_wochen=len(gezaehlt))
    out["beste_regel"] = min((k for k in regeln if tabelle[k]), key=lambda k: tabelle[k]["mae"])
    if hat_prognose: out["vorsprung"] = 1 - tabelle["Prognose"]["mae"] / tabelle[messlatte]["mae"]
    streifen = [t for t in range(max(1, (naechste or letzte) - FENSTER + 1), (naechste or letzte) + 1)]
    sperre = [(str(rows[t]["woche"]), [k for k in ("daten", "messlatte", "bias", "spanne") if l[k] is False])
              for t in streifen if (l := lampen(t)) and not l["frei"]]
    out.update(regel_wochen=len(streifen), regel_frei=len(streifen) - len(sperre), regel_rot=sperre)
    if fehlmenge and rest:
        tau = fehlmenge / (fehlmenge + rest)
        kosten = lambda Q, D: fehlmenge * max(0, D - Q) + rest * max(0, Q - D)
        mit = [t for t in wochen if fehler(t, LERNEN)[0]]  # ohne Fehler davor keine Planzahl: Woche fällt heraus
        out["anteil"] = tau
        out["kosten_wochen"] = len(mit)
        out["kosten"] = {"Messlatte": sum(kosten(regeln[messlatte](t), ist[t]) for t in mit),
                         "Prognose": sum(kosten(F(t), ist[t]) for t in mit),
                         "Planzahl": sum(kosten(F(t) + q(fehler(t, LERNEN)[0], tau), ist[t]) for t in mit)}
    if naechste is not None and F(naechste) is not None:
        e, _ = fehler(naechste, LERNEN); n = dict(woche=str(rows[naechste]["woche"]), prognose=F(naechste), lampen=lampen(naechste))
        if len(e) >= MIN_LERNEN:
            n.update(p10=F(naechste) + q(e, .1), p50=F(naechste) + q(e, .5), p90=F(naechste) + q(e, .9))
            if fehlmenge and rest:
                z = math.floor(F(naechste) + q(e, out["anteil"]) + 0.5)  # kaufmännisch runden, wie die Demo
                n.update(planzahl=z, zu_wenig=sum(F(naechste) + x > z for x in e), uebrig=sum(F(naechste) + x < z for x in e), von=len(e))
        out["naechste"] = n
    return out

if __name__ == "__main__":
    a = argparse.ArgumentParser(); a.add_argument("datei")
    a.add_argument("--fehlmenge", "--shortage"); a.add_argument("--rest", "--leftover")  # Kosten je Stück
    a.add_argument("--messlatte", default="wie letzte Woche"); a = a.parse_args()
    rows, hinweise = lesen(open(a.datei, encoding="utf-8-sig").read())
    e = pruefen(rows, hinweise, a.fehlmenge and zahl(a.fehlmenge, "--fehlmenge"), a.rest and zahl(a.rest, "--rest"), a.messlatte)
    print(json.dumps(e, ensure_ascii=False, indent=1, default=str))
