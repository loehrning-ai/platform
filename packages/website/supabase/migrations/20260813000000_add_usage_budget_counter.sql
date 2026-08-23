-- Multi-unit usage reservations for paid AI and isolated execution features.
-- The existing rate_limits table stores only route-scoped pseudonymous HMAC
-- keys or fixed global feature keys. No prompt, command, output, or raw user/IP
-- identifier is accepted by this function.

create or replace function public.usage_budget_consume(
  _key text,
  _window_s integer,
  _max integer,
  _cost integer
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
  current_reset timestamptz;
begin
  if
    _key is null or length(_key) < 1 or length(_key) > 256 or
    _window_s < 1 or _window_s > 2678400 or
    _max < 1 or _max > 2000000000 or
    _cost < 1 or _cost > 1000000
  then
    return false;
  end if;

  -- Coordinate with paired reservations during rolling deploys and serialize
  -- every writer for this key before the table upsert executes.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(_key, 0)
  );

  delete from public.rate_limits where expires_at < now();

  insert into public.rate_limits (key, window_start, count, expires_at)
  values (_key, now(), _cost, now() + make_interval(secs => _window_s))
  on conflict (key) do update
    set
      window_start = case
        when public.rate_limits.expires_at < now() then now()
        else public.rate_limits.window_start
      end,
      count = case
        when public.rate_limits.expires_at < now() then _cost
        when public.rate_limits.count > _max - _cost then _max + 1
        else public.rate_limits.count + _cost
      end,
      expires_at = case
        when public.rate_limits.expires_at < now()
          then now() + make_interval(secs => _window_s)
        else public.rate_limits.expires_at
      end
  returning count, expires_at into current_count, current_reset;

  return current_count <= _max and current_reset >= now();
end;
$$;

revoke all on function public.usage_budget_consume(text, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.usage_budget_consume(text, integer, integer, integer)
  to service_role;

-- Reserve one request's estimated token cost from its caller ledger and the
-- deployment-wide ledger as a single all-or-nothing transaction. Deterministic
-- advisory-lock ordering serializes requests that share either key without
-- deadlocking. A refused reservation performs no table mutation.
create or replace function public.usage_budget_consume_pair(
  _caller_key text,
  _global_key text,
  _window_s integer,
  _caller_max integer,
  _global_max integer,
  _cost integer
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  reservation_time timestamptz;
  caller_count integer := 0;
  caller_window_start timestamptz;
  caller_reset timestamptz;
  global_count integer := 0;
  global_window_start timestamptz;
  global_reset timestamptz;
begin
  if
    _caller_key is null or length(_caller_key) < 1 or
    length(_caller_key) > 256 or
    _global_key is null or length(_global_key) < 1 or
    length(_global_key) > 256 or
    _caller_key = _global_key or
    _window_s < 1 or _window_s > 2678400 or
    _caller_max < 1 or _caller_max > 2000000000 or
    _global_max < 1 or _global_max > 2000000000 or
    _cost < 1 or _cost > 1000000
  then
    return false;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(least(_caller_key, _global_key), 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(greatest(_caller_key, _global_key), 0)
  );
  reservation_time := clock_timestamp();

  select
    case when rl.expires_at < reservation_time then 0 else rl.count end,
    case
      when rl.expires_at < reservation_time then reservation_time
      else rl.window_start
    end,
    case
      when rl.expires_at < reservation_time
        then reservation_time + make_interval(secs => _window_s)
      else rl.expires_at
    end
  into caller_count, caller_window_start, caller_reset
  from public.rate_limits as rl
  where rl.key = _caller_key
  for update;

  caller_count := coalesce(caller_count, 0);
  caller_window_start := coalesce(caller_window_start, reservation_time);
  caller_reset := coalesce(
    caller_reset,
    reservation_time + make_interval(secs => _window_s)
  );

  select
    case when rl.expires_at < reservation_time then 0 else rl.count end,
    case
      when rl.expires_at < reservation_time then reservation_time
      else rl.window_start
    end,
    case
      when rl.expires_at < reservation_time
        then reservation_time + make_interval(secs => _window_s)
      else rl.expires_at
    end
  into global_count, global_window_start, global_reset
  from public.rate_limits as rl
  where rl.key = _global_key
  for update;

  global_count := coalesce(global_count, 0);
  global_window_start := coalesce(global_window_start, reservation_time);
  global_reset := coalesce(
    global_reset,
    reservation_time + make_interval(secs => _window_s)
  );

  if
    caller_count > _caller_max - _cost or
    global_count > _global_max - _cost
  then
    return false;
  end if;

  insert into public.rate_limits (key, window_start, count, expires_at)
  values (
    _caller_key,
    caller_window_start,
    caller_count + _cost,
    caller_reset
  )
  on conflict (key) do update
    set
      window_start = excluded.window_start,
      count = excluded.count,
      expires_at = excluded.expires_at;

  insert into public.rate_limits (key, window_start, count, expires_at)
  values (
    _global_key,
    global_window_start,
    global_count + _cost,
    global_reset
  )
  on conflict (key) do update
    set
      window_start = excluded.window_start,
      count = excluded.count,
      expires_at = excluded.expires_at;

  return true;
end;
$$;

revoke all on function public.usage_budget_consume_pair(
  text, text, integer, integer, integer, integer
) from public, anon, authenticated;
grant execute on function public.usage_budget_consume_pair(
  text, text, integer, integer, integer, integer
) to service_role;

-- Keep rolling deployments atomic with the multi-key replacement below.
-- Older application workers still call this single-key function, so it must
-- participate in the same per-key transaction advisory-lock protocol.
create or replace function public.rate_limit_consume(
  _key text,
  _window_s integer,
  _max integer
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  reservation_time timestamptz := clock_timestamp();
  current_count integer;
  current_start timestamptz;
  current_reset timestamptz;
begin
  if
    _key is null or
    length(_key) < 1 or
    length(_key) > 256 or
    _window_s is null or
    _window_s < 1 or
    _window_s > 2678400 or
    _max is null or
    _max < 1 or
    _max > 2000000000
  then
    return false;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(_key, 0)
  );

  select
    case when rl.expires_at < reservation_time then 0 else rl.count end,
    case when rl.expires_at < reservation_time then reservation_time else rl.window_start end,
    case when rl.expires_at < reservation_time
      then reservation_time + make_interval(secs => _window_s)
      else rl.expires_at end
  into current_count, current_start, current_reset
  from public.rate_limits as rl
  where rl.key = _key
  for update;

  current_count := coalesce(current_count, 0);
  if current_count >= _max then return false; end if;
  current_start := coalesce(current_start, reservation_time);
  current_reset := coalesce(
    current_reset,
    reservation_time + make_interval(secs => _window_s)
  );

  insert into public.rate_limits (key, window_start, count, expires_at)
  values (_key, current_start, current_count + 1, current_reset)
  on conflict (key) do update
    set window_start = excluded.window_start,
        count = excluded.count,
        expires_at = excluded.expires_at;

  return true;
end;
$$;

revoke all on function public.rate_limit_consume(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.rate_limit_consume(text, integer, integer)
  to service_role;

-- Reserve one request across every caller/IP/global scope or mutate none.
create or replace function public.rate_limit_consume_multi(
  _keys text[],
  _window_s integer,
  _maxes integer[]
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  reservation_time timestamptz := clock_timestamp();
  entry_count integer;
  current_key text;
  current_max integer;
  current_count integer;
  current_start timestamptz;
  current_reset timestamptz;
  index integer;
begin
  entry_count := coalesce(array_length(_keys, 1), 0);
  if
    entry_count < 1 or entry_count > 4 or
    entry_count <> coalesce(array_length(_maxes, 1), 0) or
    _window_s < 1 or _window_s > 2678400 or
    (
      select count(distinct entries.key)
      from unnest(_keys) as entries(key)
    ) <> entry_count
  then
    return false;
  end if;

  for current_key in
    select entries.key
    from unnest(_keys) as entries(key)
    order by entries.key
  loop
    if current_key is null or length(current_key) < 1 or length(current_key) > 256 then
      return false;
    end if;
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(current_key, 0)
    );
  end loop;

  for index in 1..entry_count loop
    current_key := _keys[index];
    current_max := _maxes[index];
    if
      current_max is null or
      current_max < 1 or
      current_max > 2000000000
    then
      return false;
    end if;
    select
      case when rl.expires_at < reservation_time then 0 else rl.count end
    into current_count
    from public.rate_limits as rl
    where rl.key = current_key
    for update;
    if coalesce(current_count, 0) >= current_max then return false; end if;
  end loop;

  for index in 1..entry_count loop
    current_key := _keys[index];
    select
      case when rl.expires_at < reservation_time then 0 else rl.count end,
      case when rl.expires_at < reservation_time then reservation_time else rl.window_start end,
      case when rl.expires_at < reservation_time
        then reservation_time + make_interval(secs => _window_s)
        else rl.expires_at end
    into current_count, current_start, current_reset
    from public.rate_limits as rl
    where rl.key = current_key
    for update;
    current_count := coalesce(current_count, 0);
    current_start := coalesce(current_start, reservation_time);
    current_reset := coalesce(
      current_reset,
      reservation_time + make_interval(secs => _window_s)
    );
    insert into public.rate_limits (key, window_start, count, expires_at)
    values (current_key, current_start, current_count + 1, current_reset)
    on conflict (key) do update
      set window_start = excluded.window_start,
          count = excluded.count,
          expires_at = excluded.expires_at;
  end loop;
  return true;
end;
$$;

revoke all on function public.rate_limit_consume_multi(text[], integer, integer[])
  from public, anon, authenticated;
grant execute on function public.rate_limit_consume_multi(text[], integer, integer[])
  to service_role;
