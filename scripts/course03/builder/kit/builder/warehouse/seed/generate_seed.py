#!/usr/bin/env python3
"""FOLDLINE seed generator: the single source of every number in the builder kit.

In plain words
--------------
FOLDLINE is a made-up SaaS company with 144 business accounts. This script invents
their monthly subscription values (MRR) from January 2025 to June 2026 so that the
workshop's fixed numbers come out exactly: ending MRR 334,675 / 344,450 / 387,015,
net new MRR 32,380, logo churn 4 of 40 = 10 % per segment, and so on.

It then writes the same data in every shape the kit needs:
  ../sql/10_export_lane_data.sql   the seven look-alike export tables (saas_bad)
  ../sql/20_source_seed.sql        the "as received" source tables (saas_ready)
  ../../claude-demo/A-export-tables/*.csv   Chat A inputs (export lane)
  ../../claude/project/*.csv       the five approved views as CSV (Project B / Setup A)
  builder-data.json                numbers for the web page (page workstream copies it)

You never have to run it: its output is committed. Run it only if you change the seed.

    python3 generate_seed.py            # regenerate every output file
    python3 generate_seed.py --check    # exit 1 if a committed file differs (for CI)

Rules this script follows
-------------------------
- Standard library only. Deterministic: no random module, no clock, no network.
- Every fixed fact is asserted here AND again inside the generated SQL (DO blocks),
  so a hand edit to a generated file fails loudly at load time.
- Synthetic identifiers only: 'Account 0001' names, contact_email NULL. No addresses.
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent          # kit/builder/warehouse/seed
BUILDER = HERE.parent.parent                     # kit/builder

# ------------------------------------------------------------------------------------
# 1. Fixed facts. These come from the deck; the generator must reproduce them exactly.
# ------------------------------------------------------------------------------------
MONTHS = [f"2025-{m:02d}-01" for m in range(1, 13)] + [f"2026-{m:02d}-01" for m in range(1, 7)]
IDX = {m: i for i, m in enumerate(MONTHS)}
APR, MAY, JUN = IDX["2026-04-01"], IDX["2026-05-01"], IDX["2026-06-01"]
DEC, JAN, FEB, MAR = IDX["2025-12-01"], IDX["2026-01-01"], IDX["2026-02-01"], IDX["2026-03-01"]

ENDING = {  # month-end level (ending MRR, EUR). Dec-Feb are demo-only fill, not in the deck.
    DEC: 258_785, JAN: 272_995, FEB: 294_475, MAR: 354_635,
    APR: 334_675, MAY: 344_450, JUN: 387_015,
}
CHANGE = {JAN: 14_210, FEB: 21_480, MAR: 60_160, APR: -19_960, MAY: 9_775, JUN: 42_565}
Q2_NET_NEW = 32_380
RECORDED_WRONG_G01 = [-19_960, 9_775, 42_565]     # recorded AI run: monthly_revenue summed per month
RECORDED_WRONG_G02 = -17_595                       # recorded AI run: June change minus March change
DRY_RUN_RUNNING_TOTALS = [75_890, 85_665, 128_230]  # Chat A dry runs: running sum from January
DECK_BAD_CHECKS = {                                # deck's export-lane database checks (fixedSql)
    "G01": [314_715, 354_225, 429_580],
    "G02": 27_055,
    "G03_pct": 8.33,
    "G04": {"CH": 1990, "AT": 1955, "DE": 1895, "NL": 1885, "PL": 1825, "FR": 1780, "SE": 1780, "GB": 705},
}
G04 = {"CH": 1990, "DE": 1780, "FR": 1780, "SE": 1780, "NL": 1655, "PL": 1640, "AT": 1565, "GB": 705}
# Retry duplicates the deck's bad G04 reveals: bad minus true, per country (the other four are 0).
G04_DUP = {c: DECK_BAD_CHECKS["G04"][c] - G04[c] for c in G04 if DECK_BAD_CHECKS["G04"][c] != G04[c]}
G05 = {6: ("PL", 7705), 132: ("NL", 7695), 60: ("NL", 7595), 114: ("AT", 7435), 78: ("PL", 7385),
       42: ("AT", 7335), 69: ("FR", 7280), 33: ("DE", 7265), 123: ("CH", 7250), 87: ("SE", 7235)}
LOADED_AT = "2026-07-01T06:00:00Z"
COMPLETE_THROUGH = "2026-06-01"
EVAL_CLOCK = "2026-07-01T09:00:00Z"
WHAT_IF_CLOCK = "2026-07-03T18:00:00Z"
WARN_AFTER_HOURS = 36
DEFINITION_VERSION = "1.0.0"
RETRY_EVERY = 19   # "billing_events repeats every 19th movement in a retry batch"

SEGMENTS = ["Enterprise", "Mid-Market", "SMB"]
COUNTRIES = ["AT", "CH", "DE", "FR", "GB", "NL", "PL", "SE"]
KEYS = list(range(1, 145))


def r5(x: float) -> int:
    """Round to a multiple of 5 EUR (all FOLDLINE prices are multiples of 5)."""
    return int(round(x / 5.0)) * 5


def fmt_eur(x: int) -> str:
    return f"{x:,}"


# ------------------------------------------------------------------------------------
# 2. Accounts: segment, country, start month, churn month, plan.
# ------------------------------------------------------------------------------------
SEG = {k: SEGMENTS[k % 3] for k in KEYS}            # 48 per segment
assert all(SEG[k] == "Enterprise" for k in G05)

COUNTRY = {k: c for k, (c, _) in G05.items()}
_left = {c: 18 - sum(1 for v in COUNTRY.values() if v == c) for c in COUNTRIES}
_ci = 0
for _k in KEYS:
    if _k in COUNTRY:
        continue
    while _left[COUNTRIES[_ci % 8]] == 0:
        _ci += 1
    COUNTRY[_k] = COUNTRIES[_ci % 8]
    _left[COUNTRY[_k]] -= 1
    _ci += 1

START: dict[int, int] = {}
for _k in range(1, 101):                              # 100 accounts join during 2025
    START[_k] = (_k - 1) * 12 // 100
for _i, _k in enumerate(range(101, 121)):             # Q1 2026: 4 in Jan, 4 in Feb, 12 in Mar
    START[_k] = JAN if _i < 4 else FEB if _i < 8 else MAR
Q2_NEW = {  # 8 per segment: 2 in April, 2 in May, 4 in June
    "Enterprise": {APR: [126, 129], MAY: [135, 138], JUN: [123, 132, 141, 144]},
    "Mid-Market": {APR: [121, 124], MAY: [127, 130], JUN: [133, 136, 139, 142]},
    "SMB":        {APR: [122, 125], MAY: [128, 131], JUN: [134, 137, 140, 143]},
}
for _s, _d in Q2_NEW.items():
    for _m, _ks in _d.items():
        for _k in _ks:
            assert SEG[_k] == _s
            START[_k] = _m
assert len(START) == 144

CHURN = {  # 4 per segment in Q2: 1 in April, 2 in May, 1 in June. None of them is in G05.
    21: APR, 9: MAY, 51: MAY, 72: JUN,        # Enterprise (April: the largest ordinary account)
    100: APR, 25: MAY, 55: MAY, 73: JUN,      # Mid-Market
    41: APR, 26: MAY, 56: MAY, 74: JUN,       # SMB
}
assert not set(CHURN) & set(G05)
for _s in SEGMENTS:
    assert [SEG[k] for k in CHURN].count(_s) == 4


def plan_for(k: int) -> str:
    if k in G05:
        return "Enterprise"
    return {"Enterprise": "Scale", "Mid-Market": "Growth", "SMB": "Starter"}[SEG[k]]


BASE = {"Enterprise": 3650, "Mid-Market": 2150, "SMB": 1150}
SEG_WEIGHT = {"Enterprise": 3.2, "Mid-Market": 1.9, "SMB": 1.0}
ENTERPRISE_CAP = 6400          # ordinary accounts stay well below the top-10 floor of 7,235


def wobble(k: int) -> float:
    return 0.75 + ((k * 37) % 23) / 22 * 0.5      # 0.75 .. 1.25, deterministic


# ------------------------------------------------------------------------------------
# 3. The movement plan. Organic movements follow simple arithmetic rules; "balancer"
#    amounts are then solved so each month-end lands exactly on the fixed facts.
# ------------------------------------------------------------------------------------
INIT: dict[int, int] = {k: r5(BASE[SEG[k]] * wobble(k)) for k in KEYS}
for _k, (_c, _t) in G05.items():
    INIT[_k] = r5(_t * 0.78)
INIT[114] = 7435           # a large March 2026 deal (AT)
INIT[123], INIT[132] = 7250, 7695   # two large June 2026 deals (CH, NL)
for _s in SEGMENTS:                   # April 2026 joiners start small (pilot contracts)
    for _k in Q2_NEW[_s][APR]:
        INIT[_k] = r5(INIT[_k] * 0.65)

# Plan deltas: (account, month) -> signed EUR delta. Filled below.
PLAN: dict[tuple[int, int], int] = {}

# G05 continuing accounts climb to their June value by March 2026 and then stay flat.
for _k, (_c, _t) in G05.items():
    if START[_k] > MAR or _k == 114:
        continue
    mid = START[_k] + 6
    mid_value = r5(_t * 0.9)
    if mid < MAR:
        PLAN[(_k, mid)] = mid_value - INIT[_k]
        PLAN[(_k, MAR)] = _t - mid_value
    else:
        PLAN[(_k, MAR)] = _t - INIT[_k]


def organic_delta(k: int, i: int, prev: int) -> int:
    """Ordinary upgrades and downgrades before Q2 2026. Rule-based, no randomness."""
    if k in G05 or i >= APR or prev <= 0:
        return 0
    if (k * 7 + i * 5) % 17 == 0 or (i == MAR and k % 7 == 0):   # upgrade (more in March)
        up = r5(prev * (0.08 + ((k + i) % 4) * 0.03))
        cap = ENTERPRISE_CAP if SEG[k] == "Enterprise" else 4200 if SEG[k] == "Mid-Market" else 2600
        return up if prev + up <= cap else 0
    if (k * 11 + i * 3) % 29 == 0:                                # downgrade
        return -r5(prev * 0.10)
    return 0


# Q2 expansion plan per country (G04). Each country: one event per month on different
# accounts, plus the "target" event whose retry duplicate the deck's bad G04 reveals.
def q2_expansion_split(total: int, target: int | None) -> list[int]:
    rest = total - (target or 0)
    a = r5(rest * 0.22)
    b = r5(rest * 0.27)
    return [a, b, rest - a - b]


# ------------------------------------------------------------------------------------
# 4. Simulation.
# ------------------------------------------------------------------------------------
def simulate(init, plan, overrides=None):
    """Return {k: [mrr per month]} given starting values and planned deltas."""
    overrides = overrides or {}
    out = {}
    for k in KEYS:
        row = [0] * 18
        for i in range(18):
            prev = row[i - 1] if i else 0
            if i < START[k]:
                v = 0
            elif i == START[k]:
                v = overrides.get((k, i), init[k])
            elif CHURN.get(k) == i:
                v = 0
            elif prev == 0:
                v = 0
            else:
                d = plan.get((k, i))
                if d is None:
                    d = organic_delta(k, i, prev)
                v = prev + d
            row[i] = v
        out[k] = row
    return out


def total(mrr, i):
    return sum(mrr[k][i] for k in KEYS)


def distribute(amount: int, keys: list[int], weight) -> dict[int, int]:
    """Split amount over keys by weight, in multiples of 5, summing exactly."""
    assert amount % 5 == 0, amount
    wsum = sum(weight(k) for k in keys)
    parts = {k: r5(amount * weight(k) / wsum) for k in keys}
    diff = amount - sum(parts.values())
    j = 0
    while diff:
        step = 5 if diff > 0 else -5
        parts[keys[j % len(keys)]] += step
        diff -= step
        j += 1
    return parts


def balance_new_accounts(month: int, target_total: int, keys: list[int], init: dict, plan: dict):
    """Solve the start values of the given new accounts so the month-end hits target."""
    mrr = simulate(init, plan)
    current_new = sum(init[k] for k in keys)
    residual = target_total - total(mrr, month)
    parts = distribute(current_new + residual, keys, lambda k: SEG_WEIGHT[SEG[k]] * wobble(k))
    init.update(parts)


# 4a. Pre-Q2 months: December's joiners, then Jan, Feb and Mar joiners are the balancers.
PRE_Q2_BALANCERS = {
    DEC: [k for k in KEYS if START[k] == DEC],
    JAN: [k for k in KEYS if START[k] == JAN],
    FEB: [k for k in KEYS if START[k] == FEB],
    MAR: [k for k in KEYS if START[k] == MAR and k != 114],
}
for _m in (DEC, JAN, FEB, MAR):
    balance_new_accounts(_m, ENDING[_m], PRE_Q2_BALANCERS[_m], INIT, PLAN)
_mrr = simulate(INIT, PLAN)
for _m in (DEC, JAN, FEB, MAR):
    assert total(_mrr, _m) == ENDING[_m], (_m, total(_mrr, _m))
for _k in KEYS:     # freeze organic deltas so later edits cannot move pre-Q2 history
    for _i in range(1, APR):
        if START[_k] < _i and (_k, _i) not in PLAN and _mrr[_k][_i - 1] > 0:
            _d = _mrr[_k][_i] - _mrr[_k][_i - 1]
            if _d:
                PLAN[(_k, _i)] = _d

# 4b. Q2 structure: who expands, who contracts, which retry duplicates the deck shows.
ACTIVE_MAR = [k for k in KEYS if _mrr[k][MAR] > 0]
assert len(ACTIVE_MAR) == 120
for _s in SEGMENTS:
    assert sum(1 for k in ACTIVE_MAR if SEG[k] == _s) == 40

CONTINUING = [k for k in ACTIVE_MAR if k not in CHURN and k not in G05]
_used: set[int] = set()
EXP_EVENTS: list[dict] = []       # {country, month, amount, target}
EXP_TARGET_MONTH_CHOICES = [APR, MAY, JUN]


def build_q2_events(target_months: dict[str, int]):
    """Assign Q2 expansion events to accounts. Returns list of (k, month, amount, target)."""
    events = []
    used: set[int] = set()
    for c in COUNTRIES:
        pool = [k for k in CONTINUING if COUNTRY[k] == c and k not in used]
        pool.sort(key=lambda k: (-_mrr[k][MAR] if SEG[k] != "Enterprise" else _mrr[k][MAR], k))
        split = q2_expansion_split(G04[c], G04_DUP.get(c))
        plan_c = [(APR, split[0], False), (MAY, split[1], False), (JUN, split[2], False)]
        if c in G04_DUP:
            plan_c.append((target_months[c], G04_DUP[c], True))
        for (m, amt, tgt), k in zip(plan_c, pool):
            events.append((k, m, amt, tgt))
            used.add(k)
    return events, used


Q2_CONTRACT = {  # organic downgrades in May and June (fixed); April's are the balancer
    MAY: 5, JUN: 2,
}
APR_CONTRACTORS = {"Enterprise": 10, "Mid-Market": 10, "SMB": 8}


def q2_structure(target_months):
    exp_events, used = build_q2_events(target_months)
    free = [k for k in CONTINUING if k not in used]
    free.sort(key=lambda k: (-(_mrr[k][MAR]), k))
    # April downgrades hit every segment, so each segment's April change is negative too
    apr_contract = sorted(k for s in SEGMENTS for k in [f for f in free if SEG[f] == s][:APR_CONTRACTORS[s]])
    rest = [k for k in free if k not in apr_contract]
    may_contract = sorted(rest[:Q2_CONTRACT[MAY]])
    jun_contract = sorted(rest[Q2_CONTRACT[MAY]:Q2_CONTRACT[MAY] + Q2_CONTRACT[JUN]])
    return exp_events, apr_contract, may_contract, jun_contract


def month_events(mrr) -> dict[int, list[tuple[int, str, int]]]:
    """Every account-month with a non-zero change becomes one billing movement."""
    ev = {}
    for i in range(18):
        lst = []
        for k in KEYS:
            prev = mrr[k][i - 1] if i else 0
            cur = mrr[k][i]
            if cur == prev:
                continue
            if prev == 0:
                t = "new"
            elif cur == 0:
                t = "churn"
            elif cur > prev:
                t = "expansion"
            else:
                t = "contraction"
            lst.append((k, t, cur - prev))
        ev[i] = lst
    return ev


# Choose the month for each retry-duplicated expansion so that it can sit on a
# "every 19th movement" slot. Pre-Q2 event counts are fixed; Q2 counts are structural.
_pre_q2_count = sum(len(v) for i, v in month_events(_mrr).items() if i < APR)


def q2_counts(target_months):
    exp_events, apr_c, may_c, jun_c = q2_structure(target_months)
    n = {APR: 0, MAY: 0, JUN: 0}
    for m in n:
        n[m] += sum(1 for k in KEYS if START[k] == m)          # new
        n[m] += sum(1 for k, cm in CHURN.items() if cm == m)   # churn
        n[m] += sum(1 for e in exp_events if e[1] == m)        # expansion
    n[APR] += len(apr_c)
    n[MAY] += len(may_c)
    n[JUN] += len(jun_c)
    return n


def slots(offset: int, count: int) -> list[int]:
    return [p for p in range(1, count + 1) if (offset + p) % RETRY_EVERY == 0]


PENDING_KEYS = sorted(Q2_NEW["SMB"][JUN])      # June SMB sign-ups: invoice not yet posted


def feasible(target_months):
    n = q2_counts(target_months)
    off = _pre_q2_count
    ok = True
    for m in (APR, MAY, JUN):
        s = slots(off, n[m])
        if m == JUN:   # the pending tail may not hold a target
            s = [p for p in s if p <= n[m] - len(PENDING_KEYS)]
        need = sum(1 for c, tm in target_months.items() if tm == m)
        ok &= len(s) >= need
        off += n[m]
    return ok


TARGET_MONTHS = None
_countries_dup = sorted(G04_DUP)
_preferred = [{"AT": MAY, "DE": APR, "NL": MAY, "PL": JUN}]
from itertools import product
for _combo in _preferred + [dict(zip(_countries_dup, c)) for c in product((APR, MAY, JUN), repeat=len(_countries_dup))]:
    if feasible(_combo):
        TARGET_MONTHS = _combo
        break
assert TARGET_MONTHS, "no feasible placement for the retry duplicates"

EXP_EVENTS, APR_CONTRACT, MAY_CONTRACT, JUN_CONTRACT = q2_structure(TARGET_MONTHS)
for (_k, _m, _amt, _tgt) in EXP_EVENTS:
    PLAN[(_k, _m)] = _amt
for _k in MAY_CONTRACT:
    PLAN[(_k, MAY)] = -r5(_mrr[_k][MAR] * 0.12)
for _k in JUN_CONTRACT:
    PLAN[(_k, JUN)] = -r5(_mrr[_k][MAR] * 0.10)
for _k in CONTINUING:          # everybody else is flat in Q2
    for _m in (APR, MAY, JUN):
        PLAN.setdefault((_k, _m), 0)
for _k in G05:
    for _m in (APR, MAY, JUN):
        if START[_k] < _m:
            PLAN.setdefault((_k, _m), 0)
for _k in CHURN:
    for _m in (APR, MAY, JUN):
        if _m < CHURN[_k]:
            PLAN.setdefault((_k, _m), 0)

# 4c. April balancer: the size of the April downgrades (a plan migration).
_mrr = simulate(INIT, PLAN | {(k, APR): 0 for k in APR_CONTRACT})
_need = ENDING[APR] - total(_mrr, APR)            # negative: total April downgrade
assert _need < 0
_parts = distribute(-_need, APR_CONTRACT, lambda k: _mrr[k][MAR])
for _k, _p in _parts.items():
    assert 0 < _p <= 0.40 * _mrr[_k][MAR], (_k, _p, _mrr[_k][MAR])
    PLAN[(_k, APR)] = -_p

# 4d. May balancer: May joiners' start values.
balance_new_accounts(MAY, ENDING[MAY], sorted(k for k in KEYS if START[k] == MAY), INIT, PLAN)

# Q2 new accounts stay flat after joining.
for _k in KEYS:
    for _m in (MAY, JUN):
        if START[_k] in (APR, MAY) and START[_k] < _m:
            PLAN.setdefault((_k, _m), 0)

# 4e. June: first a provisional balance over all June joiners except the two fixed deals.
JUNE_FREE = sorted(k for k in KEYS if START[k] == JUN and k not in (123, 132))
balance_new_accounts(JUN, ENDING[JUN], JUNE_FREE, INIT, PLAN)


# ------------------------------------------------------------------------------------
# 5. Billing movements: event ids, the retry duplicates, pending events.
# ------------------------------------------------------------------------------------
def order_events(mrr):
    """Assign global event ids month by month. Returns list of event dicts."""
    ev = month_events(mrr)
    out = []
    next_id = 1
    target_set = {(k, m) for (k, m, a, t) in EXP_EVENTS if t}
    june_balancers = set(k for k in JUNE_FREE if k not in PENDING_KEYS)
    for i in range(18):
        lst = sorted(ev[i], key=lambda e: e[0])
        n = len(lst)
        pos_slots = [p for p in range(1, n + 1) if (next_id - 1 + p) % RETRY_EVERY == 0]
        seq: list = [None] * n
        pending = [e for e in lst if i == JUN and e[0] in PENDING_KEYS]
        # pending events form the tail of June (dt on or after 2026-06-25)
        for j, e in enumerate(pending):
            seq[n - len(pending) + j] = e
        rest = [e for e in lst if e not in pending]
        if i < APR:                      # before Q2: plain account order, nothing constrained
            seq = list(lst)
            pos_slots = []
        free_slots = [p for p in pos_slots if seq[p - 1] is None]
        targets = [e for e in rest if (e[0], i) in target_set]
        for e in targets:
            p = free_slots.pop(0)
            seq[p - 1] = e
        rest = [e for e in rest if e not in targets]
        # remaining slots: never an expansion (bad G04 would drift), never a June balancer
        fillers = [e for e in rest if e[1] != "expansion" and e[0] not in june_balancers]
        fillers.sort(key=lambda e: ({"contraction": 0, "new": 1, "churn": 2}[e[1]], e[0]))
        for p in free_slots:
            e = fillers.pop(0)
            seq[p - 1] = e
            rest.remove(e)
        it = iter(rest)
        for p in range(n):
            if seq[p] is None:
                seq[p] = next(it)
        n_main = n - len(pending)
        for p, (k, t, amt) in enumerate(seq):
            eid = next_id + p
            if p < n_main:
                day = 1 + (p * 24) // max(n_main, 1)
            else:
                day = 25 + (p - n_main) * 5 // max(len(pending), 1)
            out.append({
                "event_id": eid, "k": k, "month": i, "type": t, "amount": amt,
                "dt": f"{MONTHS[i][:8]}{day:02d}",
                "status": "pending" if (i == JUN and k in PENDING_KEYS) else "posted",
                "dup": eid % RETRY_EVERY == 0,
            })
        next_id += n
    return out


_mrr = simulate(INIT, PLAN)
_events = order_events(_mrr)


def q2_posted_sum(events):
    s = 0
    for e in events:
        if e["month"] >= APR and e["status"] == "posted":
            s += e["amount"] * (2 if e["dup"] else 1)
    return s


# 4f/5a. June SMB joiners are "pending" in billing. Size them so the deck's bad G02
# (sum of posted Q2 billing events = 27,055) reproduces; the other June joiners absorb
# the difference so June's ending MRR stays exact.
_dup_posted = q2_posted_sum(_events) - sum(e["amount"] for e in _events if e["month"] >= APR and e["status"] == "posted")
_pending_target = Q2_NET_NEW + _dup_posted - DECK_BAD_CHECKS["G02"]
assert 4 * 600 <= _pending_target <= 4 * 2600, _pending_target
INIT.update(distribute(_pending_target, PENDING_KEYS, lambda k: wobble(k)))
_june_balancers = [k for k in JUNE_FREE if k not in PENDING_KEYS]
_mrr = simulate(INIT, PLAN)
_res = ENDING[JUN] - total(_mrr, JUN)
INIT.update(distribute(sum(INIT[k] for k in _june_balancers) + _res, _june_balancers,
                       lambda k: SEG_WEIGHT[SEG[k]] * wobble(k)))

MRR = simulate(INIT, PLAN)
EVENTS = order_events(MRR)

# ------------------------------------------------------------------------------------
# 6. Derived views (computed here independently of SQL, used for CSVs and assertions).
# ------------------------------------------------------------------------------------
def summary_rows():
    rows = []
    for i, m in enumerate(MONTHS):
        new = exp = con = chn = 0
        for k in KEYS:
            p = MRR[k][i - 1] if i else 0
            c = MRR[k][i]
            if p == 0 and c > 0:
                new += c
            elif p > 0 and c == 0:
                chn += p
            elif c > p:
                exp += c - p
            elif c < p:
                con += p - c
        rows.append({
            "month_start": m, "ending_mrr_eur": total(MRR, i), "new_mrr_eur": new,
            "expansion_mrr_eur": exp, "contraction_mrr_eur": con, "churned_mrr_eur": chn,
            "net_new_mrr_eur": new + exp - con - chn,
            "active_accounts": sum(1 for k in KEYS if MRR[k][i] > 0),
        })
    return rows


SUMMARY = summary_rows()


def churn_rows():
    rows = []
    for q in range(1, 6):                     # quarters with a prior month in the data: 2025-Q2 .. 2026-Q2
        first = q * 3
        start_m, end_m = first - 1, first + 2
        for s in SEGMENTS:
            base = [k for k in KEYS if SEG[k] == s and MRR[k][start_m] > 0]
            churned = [k for k in base if MRR[k][end_m] == 0]
            ps = MONTHS[first]
            y, mo = int(ps[:4]), int(ps[5:7]) + 3
            if mo > 12:
                y, mo = y + 1, mo - 12
            rows.append({
                "period_start": ps, "period_end_exclusive": f"{y}-{mo:02d}-01", "customer_segment": s,
                "starting_accounts": len(base), "churned_accounts": len(churned),
                "logo_churn_rate_pct": (f"{round(100 * len(churned) / len(base), 1):.1f}" if base else ""),
            })
    return rows


CHURN_VIEW = churn_rows()


def expansion_rows():
    rows = []
    for i, m in enumerate(MONTHS):
        for c in COUNTRIES:
            v = 0
            for k in KEYS:
                if COUNTRY[k] != c or i == 0:
                    continue
                p, cur = MRR[k][i - 1], MRR[k][i]
                if p > 0 and cur > p:
                    v += cur - p
            rows.append({"month_start": m, "country_code": c, "expansion_mrr_eur": v})
    return rows


EXPANSION_VIEW = expansion_rows()


def account_key(k: int) -> str:
    return f"fl_{k:04d}"


# ------------------------------------------------------------------------------------
# 7. Assertions: every fixed fact, the replay rows, and the export-lane traps.
# ------------------------------------------------------------------------------------
def assert_all():
    for i, v in ENDING.items():
        assert total(MRR, i) == v, (MONTHS[i], total(MRR, i), v)
    for i, v in CHANGE.items():
        assert total(MRR, i) - total(MRR, i - 1) == v, MONTHS[i]
        assert SUMMARY[i]["net_new_mrr_eur"] == v
    assert sum(SUMMARY[i]["net_new_mrr_eur"] for i in (APR, MAY, JUN)) == Q2_NET_NEW
    assert ENDING[MAR] + Q2_NET_NEW == ENDING[JUN]
    assert sum(ENDING[i] for i in (APR, MAY, JUN)) == 1_066_140        # levels summed: meaningless
    assert CHANGE[JUN] - CHANGE[MAR] == RECORDED_WRONG_G02
    run = 0
    running = []
    for i in (JAN, FEB, MAR, APR, MAY, JUN):
        run += CHANGE[i]
        running.append(run)
    assert running[3:] == DRY_RUN_RUNNING_TOTALS, running
    # accounts
    assert sum(1 for k in KEYS for i in range(18)) == 2592
    for s in SEGMENTS:
        seg_keys = [k for k in KEYS if SEG[k] == s]
        assert len(seg_keys) == 48
        start = [k for k in seg_keys if MRR[k][MAR] > 0]
        churned = [k for k in start if MRR[k][JUN] == 0]
        new = [k for k in seg_keys if MRR[k][MAR] == 0 and MRR[k][JUN] > 0]
        assert (len(start), len(churned), len(new)) == (40, 4, 8), s
        assert sum(1 for k in seg_keys if MRR[k][JUN] > 0) == 44
    assert [SUMMARY[i]["active_accounts"] for i in (APR, MAY, JUN)] == [123, 123, 132]
    assert sum(1 for k in KEYS if any(MRR[k][i] > 0 for i in (APR, MAY, JUN))) == 141
    for r in CHURN_VIEW:
        if r["period_start"] == "2026-04-01":
            assert (r["starting_accounts"], r["churned_accounts"], r["logo_churn_rate_pct"]) == (40, 4, "10.0")
    # G04 (ready): Q2 expansion by country
    for c, v in G04.items():
        got = sum(r["expansion_mrr_eur"] for r in EXPANSION_VIEW
                  if r["country_code"] == c and r["month_start"] >= "2026-04-01")
        assert got == v, (c, got, v)
    # G05: top ten in June, and every other account below 7,235
    top = sorted(((MRR[k][JUN], k) for k in KEYS), key=lambda x: (-x[0], account_key(x[1])))[:10]
    assert [k for _, k in top] == [6, 132, 60, 114, 78, 42, 69, 33, 123, 87], top
    for k, (c, t) in G05.items():
        assert MRR[k][JUN] == t and COUNTRY[k] == c
    assert all(MRR[k][JUN] < 7235 for k in KEYS if k not in G05)
    assert all(v >= 0 and v % 5 == 0 for row in MRR.values() for v in row)
    # export lane: recorded AI mistake and deck check rows
    mr = monthly_revenue_rows()
    assert all(r["amount"] < 0 for r in mr if r["dt"] == MONTHS[APR]), "April must be negative in every segment"

    for i, want in zip((APR, MAY, JUN), RECORDED_WRONG_G01):
        assert sum(r["amount"] for r in mr if r["dt"] == MONTHS[i]) == want
    ah = acct_history_rows()
    for i, want in zip((APR, MAY, JUN), DECK_BAD_CHECKS["G01"]):
        assert sum(r["balance"] + r["change"] for r in ah if r["dt"] == MONTHS[i]) == want
    be = billing_event_rows()
    posted = sum(r["amount"] for r in be if "2026-04-01" <= r["dt"] < "2026-07-01" and r["status"] == "posted")
    assert posted == DECK_BAD_CHECKS["G02"], posted
    for c, want in DECK_BAD_CHECKS["G04"].items():
        got = sum(r["amount"] for r in be if "2026-04-01" <= r["dt"] < "2026-07-01" and r["type"] == "E"
                  and COUNTRY[r["acct_id"]] == c)
        assert got == want, (c, got, want)
    cm = customer_master_rows()
    for s in SEGMENTS:
        rows = [r for r in cm if r["seg"] == s]
        assert len(rows) == 48 and sum(r["status"] == "C" for r in rows) == 4
        assert round(4 * 100.0 / 48, 2) == DECK_BAD_CHECKS["G03_pct"]
    assert not any(r["status"] == "active" for r in cm)       # 'A', never 'active'
    # retry duplicates: every 19th movement id, and nothing else
    ids = [r["event_id"] for r in be]
    dups = {i for i in ids if ids.count(i) > 1}
    assert dups == {i for i in set(ids) if i % RETRY_EVERY == 0}
    # deduplicated movements reconcile with the snapshots every month
    seen = {}
    for r in be:
        seen[r["event_id"]] = r
    for i, m in enumerate(MONTHS):
        mv = sum(r["amount"] for r in seen.values() if r["dt"][:8] == m[:8])
        assert mv == SUMMARY[i]["net_new_mrr_eur"], m


# ------------------------------------------------------------------------------------
# 8. Row builders for each output.
# ------------------------------------------------------------------------------------
TYPE_CODE = {"new": "N", "expansion": "E", "contraction": "D", "churn": "C"}


def start_date(k: int) -> str:
    """Day the subscription started (inside the start month; active at that month's end)."""
    return f"{MONTHS[START[k]][:8]}{1 + (k * 7) % 20:02d}"


def churn_date(k: int) -> str:
    """Day the subscription ended (inside the churn month; zero at that month's end)."""
    return f"{MONTHS[CHURN[k]][:8]}{5 + (k * 3) % 20:02d}"


def status_code(k: int) -> tuple[str, str]:
    """customer_master.status as exported on 2026-07-01: A, C or N, and its date."""
    if k in CHURN:
        return "C", churn_date(k)
    if START[k] >= APR:
        return "N", start_date(k)
    return "A", start_date(k)


def customer_master_rows():
    rows = []
    for k in KEYS:
        st, st_dt = status_code(k)
        rows.append({"id": k, "seg": SEG[k], "country": COUNTRY[k], "plan": plan_for(k),
                     "status": st, "status_dt": st_dt})
    return rows


def monthly_revenue_rows():
    """Export window 2026-01 .. 2026-06 only; amount = each month's CHANGE per segment."""
    rows = []
    for i in range(JAN, JUN + 1):
        for s in SEGMENTS:
            ks = [k for k in KEYS if SEG[k] == s]
            rows.append({"dt": MONTHS[i], "segment": s,
                         "amount": sum(MRR[k][i] for k in ks) - sum(MRR[k][i - 1] for k in ks)})
    return rows


def acct_history_rows():
    """balance = month-END MRR, change = the month's change. Summing both double counts."""
    rows = []
    for k in KEYS:
        for i in range(START[k], 18):
            prev = MRR[k][i - 1] if i else 0
            if i == START[k]:
                state = "N"
            elif k in CHURN and i >= CHURN[k]:
                state = "C"
            else:
                state = "A"
            rows.append({"acct_id": k, "dt": MONTHS[i], "balance": MRR[k][i],
                         "change": MRR[k][i] - prev, "state": state})
    return rows


def billing_event_rows():
    rows = []
    for e in EVENTS:
        base = {"event_id": e["event_id"], "acct_id": e["k"], "dt": e["dt"], "type": TYPE_CODE[e["type"]],
                "status": e["status"], "amount": e["amount"], "retry_batch": None}
        rows.append(base)
        if e["dup"]:
            rows.append(dict(base, retry_batch=f"rb-{e['dt'][:4]}{e['dt'][5:7]}-{e['event_id']:04d}"))
    return rows


def subscription_export_rows():
    return [{"customer_id": k, "date": "2026-06-01", "amount": MRR[k][JUN]} for k in KEYS]


def usage_log_rows():
    rows = []
    for k in KEYS:
        for i in (APR, MAY, JUN):
            if MRR[k][i] > 0:
                rows.append({"acct_id": k, "dt": MONTHS[i], "events": 40 + (k * 13 + i * 7) % 260})
    return rows


def ticket_rows():
    rows = []
    codes = ["O", "P", "C", "R"]
    for t in range(1, 61):
        k = 1 + (t * 17) % 144
        day = 1 + (t * 7) % 28
        month = 4 + t % 3
        st = codes[t % 4]
        closed = f"2026-{month:02d}-{min(day + 2, 28):02d}" if st in ("C", "R") else None
        rows.append({"id": t, "acct_id": k, "opened": f"2026-{month:02d}-{day:02d}", "closed": closed,
                     "status": st, "prio": 1 + t % 3})
    return rows


# ------------------------------------------------------------------------------------
# 9. Writers.
# ------------------------------------------------------------------------------------
def sql_lit(v) -> str:
    if v is None:
        return "NULL"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def insert_block(table: str, cols: list[str], rows: list[dict], per_stmt: int = 200) -> str:
    out = []
    for s in range(0, len(rows), per_stmt):
        chunk = rows[s:s + per_stmt]
        vals = ",\n".join("  (" + ", ".join(sql_lit(r[c]) for c in cols) + ")" for r in chunk)
        out.append(f"INSERT INTO {table} ({', '.join(cols)}) VALUES\n{vals};\n")
    return "\n".join(out)


SOURCE_DDL = """--
-- 20_source_seed.sql: the SOURCE layer of the approved database (saas_ready).
--
-- In plain words
--   This is the delivery room. The billing system and the CRM drop their files here
--   exactly as they arrive. We never rename or fix anything in this layer, so we can
--   always prove what we received. The AI never sees this layer.
--
--   The names here are as bad as the export lane's (id, seg, status 'A'/'C'/'N',
--   period as text, money in cents, retry duplicates). That is on purpose: real feeds
--   look like this. The next layer, core (30_core.sql), renames, types, decodes and
--   deduplicates them.
--
-- For builders
--   - Rebuilt from scratch on every run (DROP SCHEMA ... CASCADE), so the file is
--     idempotent. The cascade also drops core's staging views; 30_core.sql rebuilds them.
--   - Owned by foldline_owner (NOLOGIN). Nobody reads source except the owner.
--   - contact_email is NULL for every row: synthetic data, no addresses at all.
--   - The DO block at the end refuses to continue if the fixed facts are not in the data.
--
SET client_min_messages = warning;
SET ROLE foldline_owner;                  -- everything below is created and owned by the owner role
DROP SCHEMA IF EXISTS source CASCADE;
CREATE SCHEMA source;
COMMENT ON SCHEMA source IS 'Layer 1 of 3. Feeds exactly as received; never renamed. Only foldline_owner reads it. Never exposed to AI tools.';

CREATE TABLE source.crm_accounts (       -- CRM export, one row per account, as received
  id            integer,                  -- as received: the CRM's own number
  seg           text,                     -- as received: segment name
  country       text,                     -- as received: ISO country code
  plan          text,                     -- as received: plan name
  status        text,                     -- as received: 'A' active, 'C' churned, 'N' new this quarter
  status_dt     date,                     -- as received: date of the last status change
  created_dt    date,                     -- as received: day the first subscription started
  account_name  text,                     -- direct identifier (synthetic 'Account 0001')
  contact_email text                      -- direct identifier (always NULL in this kit)
);

CREATE TABLE source.billing_account_mrr ( -- billing snapshot, one row per account per month
  acct_id   integer,                      -- as received: same number as crm_accounts.id
  period    text,                         -- as received: 'YYYY-MM' text, not a date
  mrr_cents bigint                        -- as received: month-END recurring value in euro CENTS
);

CREATE TABLE source.billing_events (      -- billing movement feed, as received
  event_id    integer,                    -- movement id; retry batches REPEAT it
  acct_id     integer,
  dt          date,                       -- posting date
  type        text,                       -- 'N' new, 'E' expansion, 'D' downgrade, 'C' cancel
  status      text,                       -- 'posted' or 'pending' (invoice not yet posted)
  amount      numeric(12,2),              -- signed EUR change of monthly recurring value
  retry_batch text                        -- NULL for the original row; set on a retried copy
);

CREATE TABLE source.load_log (            -- one row per completed load
  loaded_at        timestamptz,           -- when the load finished (UTC)
  complete_through text,                  -- 'YYYY-MM': last month the load vouches for
  dataset_id       text
);

"""


HEADER = ("-- GENERATED by warehouse/seed/generate_seed.py. Do not edit by hand:\n"
          "-- change the generator and re-run it. Synthetic FOLDLINE data only.\n")


def export_lane_data_sql() -> str:
    parts = [HEADER, """-- The seven export tables, filled with the SAME company as the approved lane.
-- Every trap is deliberate and documented in 10_export_lane.sql.
-- Run while connected to the export database (saas_bad), after 10_export_lane.sql.

"""]
    parts.append(insert_block("public.customer_master", ["id", "seg", "country", "plan", "status", "status_dt"],
                              customer_master_rows()))
    parts.append(insert_block("public.subscription_export", ["customer_id", "date", "amount"],
                              subscription_export_rows()))
    parts.append(insert_block("public.billing_events",
                              ["event_id", "acct_id", "dt", "type", "status", "amount", "retry_batch"],
                              billing_event_rows()))
    parts.append(insert_block("public.monthly_revenue", ["dt", "segment", "amount"], monthly_revenue_rows()))
    parts.append(insert_block("public.acct_history", ["acct_id", "dt", "balance", "change", "state"],
                              acct_history_rows(), per_stmt=500))
    parts.append(insert_block("public.usage_log", ["acct_id", "dt", "events"], usage_log_rows()))
    parts.append(insert_block("public.tickets", ["id", "acct_id", "opened", "closed", "status", "prio"],
                              ticket_rows()))
    g01 = DECK_BAD_CHECKS["G01"]
    parts.append(f"""
-- Self-check: the export lane must reproduce the recorded wrong answers exactly.
DO $check$
DECLARE
  v_wrong numeric[];
  v_deck  numeric[];
  v_posted numeric;
  v_rows bigint;
BEGIN
  SELECT array_agg(s ORDER BY dt) INTO v_wrong
  FROM (SELECT dt, sum(amount) AS s FROM public.monthly_revenue
        WHERE dt >= DATE '2026-04-01' AND dt < DATE '2026-07-01' GROUP BY dt) x;
  IF v_wrong <> ARRAY[{RECORDED_WRONG_G01[0]}, {RECORDED_WRONG_G01[1]}, {RECORDED_WRONG_G01[2]}]::numeric[] THEN
    RAISE EXCEPTION 'export lane: monthly_revenue sums % do not reproduce the recorded AI answer', v_wrong;
  END IF;
  SELECT array_agg(s ORDER BY dt) INTO v_deck
  FROM (SELECT dt, sum(balance + change) AS s FROM public.acct_history
        WHERE dt >= DATE '2026-04-01' AND dt < DATE '2026-07-01' GROUP BY dt) x;
  IF v_deck <> ARRAY[{g01[0]}, {g01[1]}, {g01[2]}]::numeric[] THEN
    RAISE EXCEPTION 'export lane: acct_history check % does not match the deck', v_deck;
  END IF;
  SELECT sum(amount) INTO v_posted FROM public.billing_events
  WHERE dt >= DATE '2026-04-01' AND dt < DATE '2026-07-01' AND status = 'posted';
  IF v_posted <> {DECK_BAD_CHECKS["G02"]} THEN
    RAISE EXCEPTION 'export lane: posted billing events % do not match the deck', v_posted;
  END IF;
  SELECT count(*) INTO v_rows FROM public.customer_master;
  IF v_rows <> 144 THEN RAISE EXCEPTION 'export lane: % customer_master rows, expected 144', v_rows; END IF;
END
$check$;
""")
    return "".join(parts)


def source_seed_sql() -> str:
    crm = []
    for k in KEYS:
        st, st_dt = status_code(k)
        crm.append({"id": k, "seg": SEG[k], "country": COUNTRY[k], "plan": plan_for(k), "status": st,
                    "status_dt": st_dt, "created_dt": start_date(k), "account_name": f"Account {k:04d}",
                    "contact_email": None})
    mrr_rows = [{"acct_id": k, "period": MONTHS[i][:7], "mrr_cents": MRR[k][i] * 100}
                for k in KEYS for i in range(18)]
    parts = [HEADER, SOURCE_DDL]
    parts.append(insert_block("source.crm_accounts",
                              ["id", "seg", "country", "plan", "status", "status_dt", "created_dt",
                               "account_name", "contact_email"], crm))
    parts.append(insert_block("source.billing_account_mrr", ["acct_id", "period", "mrr_cents"], mrr_rows,
                              per_stmt=600))
    parts.append(insert_block("source.billing_events",
                              ["event_id", "acct_id", "dt", "type", "status", "amount", "retry_batch"],
                              billing_event_rows()))
    parts.append("INSERT INTO source.load_log (loaded_at, complete_through, dataset_id) VALUES\n"
                 f"  ('{LOADED_AT}', '{COMPLETE_THROUGH[:7]}', 'foldline_saas_2026q2');\n")
    endings = ", ".join(f"('{MONTHS[i][:7]}', {v})" for i, v in sorted(ENDING.items()))
    parts.append(f"""
-- Self-check: the source must carry the fixed facts before anything is built on it.
DO $check$
DECLARE
  v_bad text;
  v_rows bigint;
BEGIN
  SELECT string_agg(e.period || ': ' || coalesce(s.eur::text, 'missing') || ' <> ' || e.eur, '; ') INTO v_bad
  FROM (VALUES {endings}) AS e(period, eur)
  LEFT JOIN (SELECT period, sum(mrr_cents) / 100 AS eur FROM source.billing_account_mrr GROUP BY period) s
    USING (period)
  WHERE s.eur IS DISTINCT FROM e.eur;
  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION 'source seed does not match the fixed facts: %', v_bad;
  END IF;
  SELECT count(*) INTO v_rows FROM source.billing_account_mrr;
  IF v_rows <> 2592 THEN RAISE EXCEPTION 'source seed: % account-months, expected 2592', v_rows; END IF;
  SELECT count(*) INTO v_rows FROM source.crm_accounts;
  IF v_rows <> 144 THEN RAISE EXCEPTION 'source seed: % accounts, expected 144', v_rows; END IF;
END
$check$;

RESET ROLE;
""")
    return "".join(parts)


def csv_text(cols: list[str], rows: list[dict]) -> str:
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\n")
    w.writerow(cols)
    for r in rows:
        w.writerow(["" if r[c] is None else r[c] for c in cols])
    return buf.getvalue()


STATE = {"complete_through_month": COMPLETE_THROUGH, "data_loaded_at_utc": LOADED_AT, "quality_status": "passing"}


def outputs() -> dict[Path, str]:
    out: dict[Path, str] = {}
    out[BUILDER / "warehouse/sql/10_export_lane_data.sql"] = export_lane_data_sql()
    out[BUILDER / "warehouse/sql/20_source_seed.sql"] = source_seed_sql()
    # Chat A inputs (export lane). Deck column names.
    out[BUILDER / "claude-demo/A-export-tables/monthly_revenue.csv"] = csv_text(
        ["dt", "segment", "amount"], monthly_revenue_rows())
    out[BUILDER / "claude-demo/A-export-tables/customer_master.csv"] = csv_text(
        ["id", "seg", "country", "plan", "status", "status_dt"], customer_master_rows())
    # Approved views as CSV (Project knowledge). Same columns as the SQL views.
    proj = BUILDER / "claude/project"
    out[proj / "mrr_summary_monthly.csv"] = csv_text(
        ["month_start", "ending_mrr_eur", "new_mrr_eur", "expansion_mrr_eur", "contraction_mrr_eur",
         "churned_mrr_eur", "net_new_mrr_eur", "active_accounts", "complete_through_month",
         "data_loaded_at_utc", "quality_status"], [r | STATE for r in SUMMARY])
    out[proj / "logo_churn_by_segment_quarter.csv"] = csv_text(
        ["period_start", "period_end_exclusive", "customer_segment", "starting_accounts", "churned_accounts",
         "logo_churn_rate_pct", "complete_through_month", "data_loaded_at_utc", "quality_status"],
        [r | STATE for r in CHURN_VIEW])
    out[proj / "expansion_mrr_by_country_monthly.csv"] = csv_text(
        ["month_start", "country_code", "expansion_mrr_eur", "complete_through_month", "data_loaded_at_utc",
         "quality_status"], [r | STATE for r in EXPANSION_VIEW])
    acct_rows = [{"month_start": MONTHS[i], "account_key": account_key(k), "customer_segment": SEG[k],
                  "country_code": COUNTRY[k], "plan_name": plan_for(k), "ending_mrr_eur": MRR[k][i]} | STATE
                 for i in range(18) for k in KEYS]
    out[proj / "account_mrr_monthly.csv"] = csv_text(
        ["month_start", "account_key", "customer_segment", "country_code", "plan_name", "ending_mrr_eur",
         "complete_through_month", "data_loaded_at_utc", "quality_status"], acct_rows)
    status_rows = [{"view_name": f"analytics.{v}", "data_loaded_at_utc": LOADED_AT,
                    "complete_through_month": COMPLETE_THROUGH, "quality_status": "passing",
                    "warn_after_hours": WARN_AFTER_HOURS, "hard_expiry_hours": None,
                    "owner_team": "revenue_analytics", "definition_version": DEFINITION_VERSION}
                   for v in ("account_mrr_monthly", "expansion_mrr_by_country_monthly",
                             "logo_churn_by_segment_quarter", "mrr_summary_monthly")]
    out[proj / "data_status_by_view.csv"] = csv_text(
        ["view_name", "data_loaded_at_utc", "complete_through_month", "quality_status", "warn_after_hours",
         "hard_expiry_hours", "owner_team", "definition_version"], status_rows)
    out[HERE / "builder-data.json"] = json.dumps(page_data(), indent=1) + "\n"
    return out


def page_data() -> dict:
    top10 = sorted(((MRR[k][JUN], k) for k in KEYS), key=lambda x: (-x[0], account_key(x[1])))[:10]
    return {
        "_note": "GENERATED by warehouse/seed/generate_seed.py. Synthetic FOLDLINE data. Labels say where each number comes from.",
        "company": {"name": "FOLDLINE", "accounts": 144, "per_segment": 48, "segments": SEGMENTS,
                    "countries": COUNTRIES, "currency": "EUR", "timezone": "UTC",
                    "first_month": MONTHS[0], "complete_through_month": COMPLETE_THROUGH,
                    "account_months": 2592},
        "question": "Show ending MRR by month for the last complete quarter.",
        "months": SUMMARY,
        "origin": {
            "deck": ["ending Mar-Jun", "net new Mar-Jun", "Q2 net new", "logo churn Q2", "G04", "G05"],
            "demo_only_fill": ["ending Dec 2025-Feb 2026", "net new Jan-Feb 2026"],
            "generated": ["months before Dec 2025", "movement components per month (may change)"],
        },
        "q2": {"march_ending_mrr_eur": ENDING[MAR], "net_new_mrr_eur": Q2_NET_NEW,
               "june_ending_mrr_eur": ENDING[JUN], "levels_summed_meaningless_eur": 1_066_140},
        "logo_churn_q2": [r for r in CHURN_VIEW if r["period_start"] == "2026-04-01"],
        "accounts_per_segment_q2": {"starting": 40, "churned": 4, "new": 8, "ending": 44},
        "g04_expansion_by_country_q2": [{"country_code": c, "expansion_mrr_eur": v}
                                        for c, v in sorted(G04.items(), key=lambda x: (-x[1], x[0]))],
        "g05_top_accounts_june": [{"account_key": account_key(k), "customer_segment": SEG[k],
                                   "country_code": COUNTRY[k], "plan_name": plan_for(k), "ending_mrr_eur": v}
                                  for v, k in top10],
        "recorded_ai_answers": {
            "_label": "Recorded AI run, one run each: an observation, not a benchmark.",
            "g01_export_lane_eur": RECORDED_WRONG_G01, "g02_export_lane_eur": RECORDED_WRONG_G02,
            "g03_export_lane": "0 of 0, no rate (searched 'active'; the table says 'A')",
        },
        "dry_runs": {"_label": "Chat A dry runs, one run each: observations.",
                     "running_totals_from_january_eur": DRY_RUN_RUNNING_TOTALS},
        "deck_export_lane_checks": {
            "_label": "Deck database checks on the export lane (fixedSql), reproduced by this seed.",
            "g01_acct_history_balance_plus_change_eur": DECK_BAD_CHECKS["G01"],
            "g02_billing_events_posted_eur": DECK_BAD_CHECKS["G02"],
            "g03_customer_master_pct": DECK_BAD_CHECKS["G03_pct"],
            "g04_billing_events_type_e_eur": DECK_BAD_CHECKS["G04"],
        },
        "freshness": {"data_loaded_at_utc": LOADED_AT, "evaluation_clock_utc": EVAL_CLOCK, "age_hours": 3,
                      "warn_after_hours": WARN_AFTER_HOURS, "hard_expiry_hours": None,
                      "what_if_clock_utc": WHAT_IF_CLOCK, "what_if_age_hours": 60,
                      "what_if_state": "stale_disclosed (answer with a warning)"},
        "definition_version": DEFINITION_VERSION,
        "retry_duplicates": {"every_nth_movement": RETRY_EVERY,
                             "q2_duplicate_event_ids": sorted({e["event_id"] for e in EVENTS
                                                               if e["dup"] and e["month"] >= APR})},
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true", help="compare with committed files, write nothing")
    ap.add_argument("--summary", action="store_true", help="print the monthly components")
    args = ap.parse_args()
    assert_all()
    files = outputs()
    if args.summary:
        for r in SUMMARY:
            print(r)
    if args.check:
        stale = [p for p, text in files.items() if not p.exists() or p.read_text() != text]
        for p in stale:
            print(f"differs: {p.relative_to(BUILDER)}")
        print("seed check:", "OK" if not stale else f"{len(stale)} file(s) differ")
        return 1 if stale else 0
    for p, text in files.items():
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text)
        print(f"wrote {p.relative_to(BUILDER)}")
    print("all fixed facts asserted: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
