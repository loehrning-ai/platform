-- Simplified site runtime quota counters. Application routes persist only
-- route-scoped SHA-256 pseudonymous keys, never raw client addresses.

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at
  ON public.rate_limits (expires_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.rate_limits FROM public, anon, authenticated;
GRANT ALL ON TABLE public.rate_limits TO service_role;

CREATE POLICY "Service role full access"
  ON public.rate_limits FOR ALL
  USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.rate_limit_consume(
  _key TEXT,
  _window_s INTEGER,
  _max INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  current_reset TIMESTAMPTZ;
BEGIN
  DELETE FROM public.rate_limits WHERE expires_at < now();

  INSERT INTO public.rate_limits (key, window_start, count, expires_at)
  VALUES (_key, now(), 1, now() + make_interval(secs => _window_s))
  ON CONFLICT (key) DO UPDATE
    SET
      window_start = CASE
        WHEN public.rate_limits.expires_at < now() THEN now()
        ELSE public.rate_limits.window_start
      END,
      count = CASE
        WHEN public.rate_limits.expires_at < now() THEN 1
        ELSE public.rate_limits.count + 1
      END,
      expires_at = CASE
        WHEN public.rate_limits.expires_at < now()
          THEN now() + make_interval(secs => _window_s)
        ELSE public.rate_limits.expires_at
      END
  RETURNING count, expires_at INTO current_count, current_reset;

  RETURN current_count <= _max AND current_reset >= now();
END;
$$;

REVOKE ALL ON FUNCTION public.rate_limit_consume(TEXT, INTEGER, INTEGER)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_consume(TEXT, INTEGER, INTEGER)
  TO service_role;
