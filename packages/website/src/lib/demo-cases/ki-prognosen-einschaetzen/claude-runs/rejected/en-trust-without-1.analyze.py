import csv, sys, statistics as st

rows = list(csv.DictReader(open(sys.argv[1]), delimiter=';'))
print('rows', len(rows), 'unique weeks', len({r['week'] for r in rows}))
seen = set(); R = []
for r in rows:
    if r['week'] in seen:
        continue
    seen.add(r['week']); R.append(r)
idx = {r['week']: i for i, r in enumerate(R)}

def acc(sel, label):
    a = sum(int(r['actual']) for r in sel)
    e = sum(abs(int(r['forecast']) - int(r['actual'])) for r in sel)
    b = sum(int(r['forecast']) - int(r['actual']) for r in sel)
    print(f"{label:22} n={len(sel):3} acc {100*(1-e/a):.1f}%  bias/wk {b/len(sel):+.1f}  bias {100*b/a:+.1f}%")

def ok(r):
    return r['forecast'] and r['actual']

y25 = [r for r in R if '2024-12-30' <= r['week'] <= '2025-12-22' and ok(r)]
acc([r for r in y25 if 'sold out' not in r['note']], 'tool definition')
acc(y25, 'incl sold-out')
acc([r for r in y25 if not r['note']], 'no noted weeks')
acc([r for r in R if r['week'] >= '2025-04-14' and ok(r) and not r['note']], 'post-delist clean')
acc([r for r in R if r['week'] >= '2025-11-03' and ok(r) and not r['note']], 'since Nov 25')
acc([r for r in R if '2024-03-01' <= r['week'] <= '2024-04-30' and ok(r) and not r['note']], 'Mar-Apr 2024')
acc([r for r in R if '2025-04-07' <= r['week'] <= '2025-06-02' and ok(r) and not r['note']], 'Apr-May 2025')

# naive benchmarks
e = a = e52 = a52 = 0
for r in y25:
    if r['note']:
        continue
    p = R[idx[r['week']] - 1]
    e += abs(int(p['actual']) - int(r['actual'])); a += int(r['actual'])
print(f"naive last-week 2025 acc {100*(1-e/a):.1f}%")

sel = [r for r in R if r['week'] >= '2025-04-14' and ok(r) and not r['note']]
ratios = sorted(int(r['actual']) / int(r['forecast']) for r in sel)
n = len(ratios)
print('n', n, f"ratio mean {st.mean(ratios):.3f} sd {st.stdev(ratios):.3f}")
for q in [.5, .7, .75, .79, .85, .9]:
    k = ratios[min(n - 1, int(q * n))]
    print(q, round(k, 3), round(729 * k))

# newsvendor expected cost over empirical ratios
def cost(Q, cu, co):
    tot = 0
    for k in ratios:
        d = 729 * k
        tot += cu * max(d - Q, 0) + co * max(Q - d, 0)
    return tot / n
for cu, co, lab in [(1.5, .4, 'canteen'), (1.5, 1.6, 'no canteen')]:
    best = min(range(650, 900), key=lambda Q: cost(Q, cu, co))
    print(lab, 'CR', round(cu/(cu+co), 3), 'best Q', best, 'cost', round(cost(best, cu, co), 1),
          'cost@729', round(cost(729, cu, co), 1))

# year-end weeks
for w in ['2024-12-16', '2024-12-23', '2024-12-30', '2025-01-06', '2025-12-15', '2025-12-22', '2025-12-29']:
    r = R[idx[w]]; print(w, r['actual'], r['forecast'])
