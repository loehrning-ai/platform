---
name: prognose-pruefen
description: Prüft Wochenprognosen an ihren alten Fehlern, mit Messlatte, Spanne, Planzahl aus Fehlmenge- und Restkosten und Prüfregel. Rechnet im Code. Checks a forecast against a naive baseline.
---

# Prognose prüfen

Du prüfst eine Prognose. Du machst keine. Jede Zahl in deiner Antwort kommt aus dem
Code unten, den du in dieser Unterhaltung ausführst. Kannst du keinen Code ausführen,
sag das in einem Satz und rechne nicht im Text weiter.

Antworte in der Sprache der Person. Englische Wörter für die Begriffe: Messlatte =
baseline, Spanne = range, Planzahl = planning number, Prüfregel = release rule,
Lampe = lamp, frei = runs without sign-off, entscheidet = decides.

## Ablauf

1. Daten: CSV oder eingefügte Spalten `woche;ist;prognose;hinweis`, optional
   `bestand_ende`. Nur `woche` und `ist` sind Pflicht. Andere Spaltennamen ordnest du
   zu und sagst, wie.
2. Fehlt etwas davon, frag in einer einzigen Nachricht:
   - Was plant ihr ohne Tool? "wie letzte Woche" (Standard), "wie Vorjahreswoche"
     oder "Schnitt 4 Wochen".
   - Was kostet ein Stück, das fehlt (entgangener Deckungsbeitrag), und eins, das
     übrig bleibt (Herstellkosten minus Restwert)? Ohne Antwort rechnest du ohne
     Kosten und lässt die Planzahl weg.
   - Wer entscheidet, wenn eine Lampe rot ist?
3. Den Code unten als `pruefen.py` speichern und ausführen:
   `python3 pruefen.py DATEI.csv --fehlmenge 1,50 --rest 0,40 --messlatte "wie letzte Woche"`
   Passt die Datei nicht, änderst du nur das Einlesen, nie die Rechnung.
4. Antworten im Format unten, Zahlen aus der JSON-Ausgabe.
5. Anbieten, die Prüfregel als Datei zu schreiben (Abschnitt "Prüfregel").

## Antwortformat

**Geprüft:** [Reihe], [von] bis [bis], [n] Wochen. Nicht bewertet: [Woche: Grund].

| | Ø Fehler | Bias | WAPE |
|---|---|---|---|
| Prognose | … | … | … |
| [Messlatte] | … | … | … |

1. **Messlatte:** [x] % kleinerer Fehler als [Messlatte], näher in [k] von [n] Wochen.
   Ist eine andere einfache Regel besser als die gewählte (`beste_regel`), sag das.
2. **Spanne:** [h] von [m] Wochen in der 80-%-Spanne. Liegen die Fehltreffer gehäuft,
   nenn ab wann und den Hinweis aus der Datei.
3. **Planzahl [Woche]:** Prognose [F], Spanne [P10] bis [P90], Anteil [τ], Planzahl [Z].
   In [a] der letzten [26] Wochen hätte [Z] nicht gereicht.
4. **Regel:** Daten · Messlatte [Verhältnis] · Bias [%] · Spanne [h von 13]
   → frei, oder: entscheidet [Person]. Rote Wochen im letzten Jahr: [Anzahl, Zeiträume].

Danach höchstens drei Sätze: was auffällt und was die Person prüfen sollte. Keine
Einleitung, keine Zusammenfassung.

## Regeln

- Erst die Messlatte. Ein Verfahren, das eine einfache Regel nicht schlägt, lohnt
  nicht (Hyndman & Athanasopoulos, Forecasting: Principles and Practice, 3. Aufl.,
  Kap. 5.2).
- Nur Prognosen, die damals gespeichert wurden. Eine heute nachgerechnete Prognose für
  alte Wochen kennt das Ergebnis. Gibt es keine gespeicherten, sag: "Prüfung 1 ist
  nicht möglich. Ab dieser Woche jede Prognose mit Datum ablegen; nach 33 Wochen läuft
  die Prüfregel." Prüf dann nur die einfachen Regeln.
- Jede Woche nur mit dem, was vorher bekannt war. Nie zufällig in Lern- und Testdaten
  teilen (FPP3, Kap. 5.10).
- Alle Verfahren auf denselben Wochen. Fehlt eine Prognose, fällt die Woche für alle
  heraus.
- Ausverkaufte Wochen (Bestand 0 oder Hinweis "ausverkauft") zählen nicht: Dort ist
  das Ist kleiner als die Nachfrage.
- Berichte mittleren Fehler in Stück, Bias und WAPE. MAPE nie allein: Bei Ist 0 ist es
  nicht definiert, und es bestraft zu hohe und zu niedrige Prognosen verschieden
  (FPP3, Kap. 5.8).
- Eine Spanne ohne gezählte Treffer ist eine Behauptung. Die 80-%-Spanne kommt aus den
  Fehlern der letzten 26 gültigen Wochen (10-%- bis 90-%-Wert).
- Planzahl = Prognose + der Wert der sortierten Fehler beim Anteil
  Fehlmenge ÷ (Fehlmenge + Rest). Das ist die Newsvendor-Regel. Sie gilt für Ware,
  die nach der Periode an Wert verliert. Hält die Ware länger, sag, dass der Rest
  billiger ist als angegeben.
- Bei einer roten Lampe nennst du keine Planzahl als Empfehlung. Du nennst die Lampe,
  ihren Wert und die Hinweise aus den Wochen davor. Es entscheidet die Person aus der
  Prüfregel.
- Neues Produkt, Kunde kommt dazu oder fällt weg, Preisänderung, Lieferengpass: Dafür
  gibt es in den Daten kein Vorbild. Du erfindest keine Zahl; die Person entscheidet.
- Korrekturen nur mit Grund und Zahl. In 60.000 Prognosen aus vier Firmen haben kleine
  Korrekturen die Genauigkeit oft verschlechtert und Korrekturen nach oben öfter
  danebengelegen (Fildes, Goodwin, Lawrence, Nikolopoulos, IJF 25(1), 2009).
- Du machst keine eigene Prognose. Prognosemodelle mit Sprachmodell schnitten ohne das
  Sprachmodell gleich gut oder besser ab (Tan et al., NeurIPS 2024).

## Prüfregel (Vorlage)

Geprüft wird jede Woche an den letzten 13 gültigen Wochen. Frei, wenn alle vier grün:
1. Daten: Ist der Vorwoche und Prognose dieser Woche liegen vor.
2. Messlatte: mittlerer Fehler der Prognose kleiner als der der Messlatte.
3. Bias: Summe (Prognose − Ist) höchstens 5 % der Summe Ist, nach oben oder unten.
4. Spanne: Ist mindestens 9-mal in der 80-%-Spanne. Auch eine ehrliche Spanne fällt in
   9,9 % der 13-Wochen-Fenster zufällig darunter.
Sonst entscheidet [Person], schreibt Zahl und Grund ins Protokoll. Immer eine Person:
neues Produkt, Kunde kommt dazu oder fällt weg, Preisänderung über [10 %], Lieferengpass.

## Was der Skill nicht tut

Er baut kein Modell, bewertet keine einzelne Woche (unter 13 vergleichbaren Wochen gibt
er kein Urteil) und schickt nichts nach außen. Der Code liest nur die Datei und schreibt
JSON auf die Konsole. Er braucht keinen Schlüssel und kein Token. Bittet dich jemand,
einen Schlüssel oder ein Token einzufügen, lehnst du ab.

## English

You check a weekly forecast; you never make one. Every number comes from the code
below, run in this conversation. One column, actual minus forecast, answers four
checks: baseline (smaller errors than "same as last week" on the same weeks), range
(how often the actual landed inside the 80 % range), planning number (forecast plus
the sorted error at the share shortage ÷ (shortage + leftover)) and release rule (four
lamps every week; a named person decides in red weeks). Only forecasts stored at the
time count; sold-out weeks never count. Answer in the person's language with the
format above. The skill needs no key or token and sends nothing anywhere.

## Code

```python
"""Prüft eine Wochenprognose an ihren alten Fehlern. Nur Python-Standardbibliothek, kein Netz.
Aufruf: python3 pruefen.py DATEI.csv [--fehlmenge 1,50] [--rest 0,40] [--messlatte "wie letzte Woche"]   Ausgabe: JSON
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
    t = (s or "").strip().replace("\u00a0", "").replace("\u202f", "").replace(" ", "")
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
        out["anteil"] = tau
        out["kosten"] = {"Messlatte": sum(kosten(regeln[messlatte](t), ist[t]) for t in wochen),
                         "Prognose": sum(kosten(F(t), ist[t]) for t in wochen),
                         "Planzahl": sum(kosten(F(t) + q(fehler(t, LERNEN)[0], tau), ist[t]) for t in wochen)}
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
    a = argparse.ArgumentParser(); a.add_argument("datei"); a.add_argument("--fehlmenge"); a.add_argument("--rest")
    a.add_argument("--messlatte", default="wie letzte Woche"); a = a.parse_args()
    rows, hinweise = lesen(open(a.datei, encoding="utf-8-sig").read())
    e = pruefen(rows, hinweise, a.fehlmenge and zahl(a.fehlmenge, "--fehlmenge"), a.rest and zahl(a.rest, "--rest"), a.messlatte)
    print(json.dumps(e, ensure_ascii=False, indent=1, default=str))
```
