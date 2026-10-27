import csv, sys
r = list(csv.DictReader(open(sys.argv[1]), delimiter=';'))
d = {x['woche']: x for x in r}
cl = [x for x in d.values() if x['prognose'] and x['ist'] and not x['hinweis']]
allE = [int(x['ist']) - int(x['prognose']) for x in cl]
recE = [int(x['ist']) - int(x['prognose']) for x in cl if x['woche'] >= '2025-06-01']
F = 729
for name, E in [('alle', allE), ('ab Jun25', recE)]:
    for co, lab in [(0.40, 'Kantine'), (1.60, 'ohne')]:
        cost = lambda q: sum(1.5 * max(F + e - q, 0) + co * max(q - F - e, 0) for e in E) / len(E)
        best = min(range(680, 800), key=cost)
        print(name, lab, 'best', best, round(cost(best), 1), '@729', round(cost(729), 1),
              '@750', round(cost(750), 1), '@720', round(cost(720), 1))
