-- HMAC-SHA-256 v1 replaces the reversible SHA-256(namespace || identity)
-- limiter keys. The old counters cannot be translated without the raw identity,
-- which was deliberately never stored. Remove only those exact legacy shapes;
-- unrelated shared-project counters and the new versioned keys are untouched.
--
-- This is an intentional one-time quota reset. Every affected window is at most
-- 24 hours, and retaining the obsolete hashes would extend their privacy risk.

delete from public.rate_limits
where key ~
  '^[a-z0-9-]{1,64}:(sha256|user-sha256):[0-9a-f]{64}$';
