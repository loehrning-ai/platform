# Builder cheat sheet

One page. Print it on A4 in two columns. Every block has a good line (**Do**) and a bad line (**Don't**).
FOLDLINE numbers are synthetic and match the workshop deck.

---

### 1. Bathtub: level or change?

- **Level** = the water at one moment. Ending MRR on 30 Jun 2026: **€387,015**.
- **Change** = what flowed in or out during the month. June net new: **+€42,565**.
- Last level + change = new level: **354,635 + 32,380 = 387,015**.

- **Do:** "Ending MRR, end of June: €387,015."
- **Don't:** "Ending MRR, April: −€19,960." That is April's change. A level cannot be negative here.

### 2. Can I add it?

| | Across segments | Across months | One quarter figure |
| --- | --- | --- | --- |
| Level | add | **never** (1,066,140 means nothing) | three rows, or the last month |
| Change | add | add | sum: **32,380** |
| Rate | recompute | recompute | recompute: 12 of 120 = **10 %** |

- **Do:** Rate = total numerator ÷ total denominator: 480 ÷ 21,000 = **2.29 %**.
- **Don't:** Average of rates: (2 % + 8 %) ÷ 2 = **5.00 %**. Averages ignore the size of each group.
- **Don't:** Wrong base: 4 of 48 = 8.33 % (new joiners counted in the churn base).
- **Don't:** 0 ÷ 0 shown as 0 %. Say "no rate".

### 3. Names

1. Say the shape: `ending_mrr_eur` (level), `net_new_mrr_eur` (change).
2. Say the unit: `_eur`, `_pct` (0–100), `_units`.
3. Say the time: `month_start`, `period_start` + `period_end_exclusive`, `_at_utc`.
4. Put the grain in the view name: `_monthly`, `_by_segment_quarter`.
5. Use words, not codes: `active` / `churned` / `new`.
6. Keys: `account_key` (pseudonymous, served) vs `account_id` (core only).
7. Always write the schema: `analytics.mrr_summary_monthly`.

**Banned:** `amount`, `dt`, `seg`, `status` = A/C/N, `final_v2`, `ending_mrr` as an alias on a
sum of changes.

### 4. Layers

**source → core → analytics.** The AI reaches only analytics.

- **Do:** The login sees 5 approved views.
- **Don't:** The login sees all 7 export tables. "Three of them sound like the answer."

### 5. Two locks

- Instructions **guide**: CLAUDE.md, Project instructions, a Skill.
- Grants **enforce**: `permission denied` = SQLSTATE **42501**.

- **Do:** "Refuse early, enforce anyway."
- **Don't:** "The prompt says don't read emails, so we're safe."
- **Don't:** "The login is read-only, so it's least privilege." Read-only still reads too much.

### 6. Freshness

- Loaded 06:00, checked 09:00 UTC → **3 h**, fresh: answer.
- Warn after **36 h**. At **60 h**: answer **with a warning** (load time and age).
- Block only on a written rule: incomplete period, failing quality check.

- **Don't:** hide the age. **Don't:** invent an expiry nobody wrote down.

### 7. Tests

Five behaviours: **answer / ask back / refuse / deny / stale.**

- **Do:** Write the right answer before asking the AI. Grade value and behaviour.
- **Do:** Keep two planes: database checks (deck: 9 of 9; this kit: 22 of 22) and AI runs (FOLDLINE: one each, an observation; yours: at least 3 per case).
- **Don't:** grade SQL text. **Don't:** test one happy path only. **Don't:** say "9 of 9, so the AI scores 9 of 9."

### 8. Finish with one sentence

> "For this question, using this approved data and this definition, we tested these boundaries;
> the next unknown is this one."
