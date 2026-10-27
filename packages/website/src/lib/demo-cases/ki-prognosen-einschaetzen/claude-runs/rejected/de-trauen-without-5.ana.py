import csv, sys, statistics as st
r = list(csv.DictReader(open(sys.argv[1]), delimiter=';'))
print(len(r), len(set(x['woche'] for x in r)))
def acc(rows):
    a = sum(abs(int(x['prognose']) - int(x['ist'])) for x in rows)
    s = sum(int(x['ist']) for x in rows)
    return 1 - a / s
y = [x for x in r if '2024-12-30' <= x['woche'] <= '2025-12-22' and x['prognose'] and x['ist']]
print('incl sold', acc(y), len(y))
y2 = [x for x in y if 'ausverkauft' not in x['hinweis']]
print('excl sold', acc(y2), len(y2))
seen = set(); u = []
for x in r:
    if x['woche'] in seen: continue
    seen.add(x['woche']); u.append(x)
nv = [(int(u[i]['ist']), int(u[i-1]['ist'])) for i in range(1, len(u))
      if '2024-12-30' <= u[i]['woche'] <= '2025-12-22' and 'ausverkauft' not in u[i]['hinweis'] and u[i]['ist']]
print('naive last week', 1 - sum(abs(a-b) for a, b in nv) / sum(a for a, b in nv))
for lab, lo, hi in [('2024', '2024-01-01', '2024-12-29'), ('2025 all', '2024-12-30', '2025-12-22'),
                    ('since may25', '2025-05-19', '2025-12-22'), ('Q4 25', '2025-10-01', '2025-12-22')]:
    z = [x for x in u if lo <= x['woche'] <= hi and x['prognose'] and x['ist'] and not x['hinweis']]
    e = [int(x['ist']) - int(x['prognose']) for x in z]
    q = [int(x['ist']) / int(x['prognose']) for x in z]
    print(lab, len(e), 'mean err', round(st.mean(e), 1), 'sd', round(st.stdev(e), 1),
          'ratio', round(st.mean(q), 3), 'sd', round(st.stdev(q), 3), 'ist>prog', sum(1 for v in e if v > 0))
    print('  sorted ratios', sorted(round(v, 3) for v in q))
