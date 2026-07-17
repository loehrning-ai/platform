-- Remove the retired scan insight cache. This stays idempotent for fresh
-- installations that never created the legacy table.
--
-- The `rate_limits` table and `rate_limit_consume` RPC are retained because
-- src/lib/security/rate-limit.ts invokes
-- `rate_limit_consume`, and the AI-native practice/grade endpoints depend on it
-- for fail-closed token-abuse protection.

DROP TABLE IF EXISTS scan_insight_cache;
