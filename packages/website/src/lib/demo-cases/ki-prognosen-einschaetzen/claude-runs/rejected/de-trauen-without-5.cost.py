import csv, sys
r = list(csv.DictReader(open(sys.argv[1]), delimiter=';'))
seen = set(); u = []
for x in r:
    if x['woche'] in seen: continue
    seen.add(x['woche']); u.append(x)
def ratios(lo, hi):
    return [int(x['ist']) / int(x['prognose']) for x in u
            if lo <= x['woche'] <= hi and x['prognose'] and x['ist'] and not x['hinweis']]
P = 729
for lab, q in [('alle sauberen Wochen', ratios('2024-01-01', '2025-12-22')),
               ('seit Mai 2025', ratios('2025-05-19', '2025-12-22'))]:
    for over in (0.40, 1.60):
        best = None
        res = []
        for Q in range(700, 791, 5):
            c = sum(1.50 * max(P*v - Q, 0) + over * max(Q - P*v, 0) for v in q) / len(q)
            res.append((Q, round(c, 1)))
            if best is None or c < best[1]: best = (Q, c)
        print(lab, 'over', over, 'best', best[0], round(best[1], 1))
        print('  ', [t for t in res if t[0] in (720, 729, 740, 750, 755, 760, 770)])
