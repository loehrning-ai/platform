# Historical fileless migrations

Eight migrations are recorded as applied on project `sprqejhlsehqeizubwlb` with
no corresponding file in this directory. They predate this repository's
practice of committing every migration and were applied directly.

| Version | Name |
|---|---|
| 20260421203216 | journey_leads |
| 20260421203233 | scan_insight_cache |
| 20260421203300 | journey_consultations |
| 20260421203316 | nurture_columns |
| 20260421203343 | journey_leads_v3 |
| 20260421203503 | deep_analysis_jobs |
| 20260421203522 | deep_analysis_idempotency |
| 20260421203611 | security_hardening |

Reproducing them as a single committed baseline migration is real, valuable
follow-up work, but it must reproduce the pre-`20260716160839` schema state
exactly:
`005_drop_scan_insight_cache.sql` drops a table one of these fileless
migrations (`scan_insight_cache`) creates, so a dump of the *current* schema
would make that later migration a silent no-op if ever replayed against a
fresh project. Do not attempt this without pulling the actual historical
schema state at each of the eight versions above.

Until that baseline lands, `scripts/verify-migrations-tracked.mjs` treats
exactly this list as an accepted, named exception — not a silent gap — so a
*new* untracked migration still fails the gate.
