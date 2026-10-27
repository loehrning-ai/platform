import csv, statistics as st, sys
rows = list(csv.DictReader(open(sys.argv[1]), delimiter=';'))
seen = set(); r = []
for x in rows:
    if x['woche'] in seen:
        print('dup', x['woche']); continue
    seen.add(x['woche']); r.append(x)

def acc(sel):
    a = sum(abs(int(x['prognose']) - int(x['ist'])) for x in sel)
    s = sum(int(x['ist']) for x in sel)
    return round(1 - a / s, 4), len(sel), round(a / len(sel), 1)

y25 = [x for x in r if '2024-12-30' <= x['woche'] <= '2025-12-22' and x['prognose'] and x['ist']]
print('all25', acc(y25))
print('no sold', acc([x for x in y25 if 'ausverkauft' not in x['hinweis']]))
print('no hinweis', acc([x for x in y25 if not x['hinweis']]))
ist = {x['woche']: int(x['ist']) for x in r if x['ist']}
hin = {x['woche']: x['hinweis'] for x in r}
ws = sorted(ist)
a = s = 0
for i, w in enumerate(ws):
    if '2024-12-30' <= w <= '2025-12-22' and 'ausverkauft' not in hin[w]:
        a += abs(ist[w] - ist[ws[i-1]]); s += ist[w]
print('naive', round(1 - a / s, 4))
for per, lo, hi in [('2024', '2024-01-01', '2024-12-23'), ('2025', '2024-12-30', '2025-12-22'),
                    ('since jun25', '2025-06-01', '2025-12-22'), ('jun24+', '2024-06-01', '2025-12-22'),
                    ('all', '2024-01-01', '2025-12-22')]:
    e = sorted(int(x['ist']) - int(x['prognose']) for x in r
               if lo <= x['woche'] <= hi and x['ist'] and x['prognose'] and not x['hinweis'])
    n = len(e)
    print(per, n, 'mean', round(st.mean(e), 1), 'sd', round(st.stdev(e), 1),
          'q50', e[n//2], 'q79', e[int(0.79*n)], 'q48', e[int(0.48*n)], 'min', e[0], 'max', e[-1])
for x in r:
    if x['ist'] and x['prognose'] and '2025-03-30' < x['woche'] < '2025-07-01':
        print(x['woche'], int(x['ist']) - int(x['prognose']), x['hinweis'][:25])
