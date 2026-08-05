-- Close two data-lifecycle gaps left by the per-course progress transition:
-- 1. schedule the already service-only feedback retention function;
-- 2. remove the duplicate private legacy progress blob, but only after proving
--    its complete known shape and an exact target representation for every
--    data-bearing field. Unknown data must survive for manual inspection.

create extension if not exists pg_cron;

do $schedule$
begin
  if to_regprocedure('public.prune_beta_feedback()') is null then
    raise exception
      'Cannot schedule feedback retention: public.prune_beta_feedback() is missing';
  end if;

  perform cron.schedule(
    'beta-feedback-retention-daily',
    '29 3 * * *',
    'select public.prune_beta_feedback()'
  );
end
$schedule$;

do $legacy_cleanup$
declare
  legacy_row record;
  legacy_course record;
  legacy_lesson record;
  legacy_exercise record;
begin
  if to_regclass('private.user_course_progress_v4_legacy') is null then
    return;
  end if;

  -- Hold both sides stable from the first proof through the DROP. Without the
  -- target lock, a concurrent account deletion could remove a converted row
  -- after it was verified but before its only remaining source was dropped.
  lock table private.user_course_progress_v4_legacy
    in access exclusive mode;
  lock table public.user_course_progress in share mode;

  -- The original table had exactly these four data-bearing columns. Refuse to
  -- destroy an installation-specific column that this migration cannot map.
  if (
    select array_agg(
      column_name::text || ':' || udt_name::text || ':' || is_nullable::text
      order by column_name::text
    )
    from information_schema.columns
    where table_schema = 'private'
      and table_name = 'user_course_progress_v4_legacy'
  ) is distinct from array[
    'created_at:timestamptz:NO',
    'progress:jsonb:NO',
    'updated_at:timestamptz:NO',
    'user_id:uuid:NO'
  ]::text[] then
    raise exception
      'Legacy progress cleanup blocked: unexpected source table columns';
  end if;

  for legacy_row in
    select user_id, progress, created_at, updated_at
    from private.user_course_progress_v4_legacy
  loop
    if jsonb_typeof(legacy_row.progress) is distinct from 'object' then
      raise exception
        'Legacy progress cleanup blocked: progress for user % is not an object',
        legacy_row.user_id;
    end if;

    -- All seven v2 root keys are mandatory and no eighth key may disappear.
    -- Nested extension keys remain safe because complete course slices,
    -- streaks, and ledger maps are copied and compared as JSONB values.
    if not (
      legacy_row.progress ?& array[
        'schemaVersion',
        'courses',
        'xp',
        'checkpoints',
        'badges',
        'streak',
        'lastActivity'
      ]
    ) or exists (
      select 1
      from jsonb_object_keys(legacy_row.progress) as root_key(key)
      where root_key.key <> all (
        array[
          'schemaVersion',
          'courses',
          'xp',
          'checkpoints',
          'badges',
          'streak',
          'lastActivity'
        ]::text[]
      )
    ) then
      raise exception
        'Legacy progress cleanup blocked: missing or unexpected top-level keys for user %',
        legacy_row.user_id;
    end if;

    if legacy_row.progress -> 'schemaVersion' is distinct from '2'::jsonb
      or jsonb_typeof(legacy_row.progress -> 'courses')
        is distinct from 'object'
      or jsonb_typeof(legacy_row.progress -> 'xp')
        is distinct from 'number'
      or jsonb_typeof(legacy_row.progress -> 'checkpoints')
        is distinct from 'object'
      or jsonb_typeof(legacy_row.progress -> 'badges')
        is distinct from 'object'
      or jsonb_typeof(legacy_row.progress -> 'streak')
        is distinct from 'object'
      or jsonb_typeof(legacy_row.progress -> 'lastActivity')
        is distinct from 'string' then
      raise exception
        'Legacy progress cleanup blocked: malformed root shape for user %',
        legacy_row.user_id;
    end if;

    if (legacy_row.progress ->> 'xp')::numeric < 0 then
      raise exception
        'Legacy progress cleanup blocked: invalid xp for user %',
        legacy_row.user_id;
    end if;

    if exists (
      select 1
      from jsonb_each(
        legacy_row.progress -> 'checkpoints'
      ) as checkpoint(key, value)
      where jsonb_typeof(checkpoint.value) is distinct from 'boolean'
    ) then
      raise exception
        'Legacy progress cleanup blocked: malformed checkpoints for user %',
        legacy_row.user_id;
    end if;

    if exists (
      select 1
      from jsonb_each(
        legacy_row.progress -> 'badges'
      ) as badge(key, value)
      where jsonb_typeof(badge.value) is distinct from 'string'
    ) then
      raise exception
        'Legacy progress cleanup blocked: malformed badges for user %',
        legacy_row.user_id;
    end if;

    if not (
      (legacy_row.progress -> 'streak') ?& array['days', 'last']
    ) or jsonb_typeof(legacy_row.progress -> 'streak' -> 'days')
      is distinct from 'number'
      or jsonb_typeof(legacy_row.progress -> 'streak' -> 'last')
        not in ('string', 'null') then
      raise exception
        'Legacy progress cleanup blocked: malformed streak for user %',
        legacy_row.user_id;
    end if;

    if (legacy_row.progress -> 'streak' ->> 'days')::numeric < 0
      or (
        legacy_row.progress -> 'streak' ->> 'days'
      )::numeric <> trunc(
        (legacy_row.progress -> 'streak' ->> 'days')::numeric
      ) then
      raise exception
        'Legacy progress cleanup blocked: invalid streak days for user %',
        legacy_row.user_id;
    end if;

    for legacy_course in
      select key, value
      from jsonb_each(legacy_row.progress -> 'courses')
    loop
      if not (
        legacy_course.key = any (
          array[
            'ai-native',
            'ai-native-operator',
            'claude',
            'codex',
            'data-engineering-fundamentals',
            'data-infrastructure',
            'data-science',
            'eu-ai-act-kurs',
            'ki-fuehrerschein',
            'ki-und-gesellschaft'
          ]::text[]
        )
      ) then
        raise exception
          'Legacy progress cleanup blocked: unknown course slug % for user %',
          legacy_course.key,
          legacy_row.user_id;
      end if;

      if jsonb_typeof(legacy_course.value) is distinct from 'object'
        or not (
          legacy_course.value ?& array[
            'lessons',
            'workshopQuiz',
            'capstoneSubmitted',
            'startedAt',
            'lastActivity'
          ]
        )
        or jsonb_typeof(legacy_course.value -> 'lessons')
          is distinct from 'object'
        or jsonb_typeof(legacy_course.value -> 'workshopQuiz')
          is distinct from 'object'
        or jsonb_typeof(legacy_course.value -> 'capstoneSubmitted')
          is distinct from 'boolean'
        or jsonb_typeof(legacy_course.value -> 'startedAt')
          is distinct from 'string'
        or jsonb_typeof(legacy_course.value -> 'lastActivity')
          is distinct from 'string'
        or (
          legacy_course.value ? 'resetAt'
          and jsonb_typeof(legacy_course.value -> 'resetAt')
            is distinct from 'string'
        ) then
        raise exception
          'Legacy progress cleanup blocked: malformed course % for user %',
          legacy_course.key,
          legacy_row.user_id;
      end if;

      if not (
        (legacy_course.value -> 'workshopQuiz') ?& array[
          'passed',
          'score',
          'completedAt'
        ]
      )
        or jsonb_typeof(
          legacy_course.value -> 'workshopQuiz' -> 'passed'
        ) is distinct from 'boolean'
        or jsonb_typeof(
          legacy_course.value -> 'workshopQuiz' -> 'score'
        ) is distinct from 'number'
        or jsonb_typeof(
          legacy_course.value -> 'workshopQuiz' -> 'completedAt'
        ) not in ('string', 'null') then
        raise exception
          'Legacy progress cleanup blocked: malformed workshop quiz in course % for user %',
          legacy_course.key,
          legacy_row.user_id;
      end if;

      if (
        legacy_course.value -> 'workshopQuiz' ->> 'score'
      )::numeric < 0 then
        raise exception
          'Legacy progress cleanup blocked: invalid workshop score in course % for user %',
          legacy_course.key,
          legacy_row.user_id;
      end if;

      for legacy_lesson in
        select key, value
        from jsonb_each(legacy_course.value -> 'lessons')
      loop
        if jsonb_typeof(legacy_lesson.value) is distinct from 'object'
          or not (
            legacy_lesson.value ?& array[
              'sectionsRead',
              'quizScore',
              'quizTotal',
              'completed',
              'exercisesCompleted'
            ]
          )
          or jsonb_typeof(legacy_lesson.value -> 'sectionsRead')
            is distinct from 'array'
          or jsonb_typeof(legacy_lesson.value -> 'quizScore')
            not in ('number', 'null')
          or jsonb_typeof(legacy_lesson.value -> 'quizTotal')
            not in ('number', 'null')
          or jsonb_typeof(legacy_lesson.value -> 'completed')
            is distinct from 'boolean'
          or jsonb_typeof(legacy_lesson.value -> 'exercisesCompleted')
            is distinct from 'object' then
          raise exception
            'Legacy progress cleanup blocked: malformed lesson % in course % for user %',
            legacy_lesson.key,
            legacy_course.key,
            legacy_row.user_id;
        end if;

        if exists (
          select 1
          from jsonb_array_elements(
            legacy_lesson.value -> 'sectionsRead'
          ) as section(value)
          where jsonb_typeof(section.value) is distinct from 'string'
        ) then
          raise exception
            'Legacy progress cleanup blocked: malformed section list in lesson % for user %',
            legacy_lesson.key,
            legacy_row.user_id;
        end if;

        if jsonb_typeof(legacy_lesson.value -> 'quizScore') = 'number' then
          if (legacy_lesson.value ->> 'quizScore')::numeric < 0 then
            raise exception
              'Legacy progress cleanup blocked: invalid quiz score in lesson % for user %',
              legacy_lesson.key,
              legacy_row.user_id;
          end if;
        end if;

        if jsonb_typeof(legacy_lesson.value -> 'quizTotal') = 'number' then
          if (legacy_lesson.value ->> 'quizTotal')::numeric < 0 then
            raise exception
              'Legacy progress cleanup blocked: invalid quiz total in lesson % for user %',
              legacy_lesson.key,
              legacy_row.user_id;
          end if;
        end if;

        for legacy_exercise in
          select key, value
          from jsonb_each(legacy_lesson.value -> 'exercisesCompleted')
        loop
          if jsonb_typeof(legacy_exercise.value) is distinct from 'object'
            or not (
              legacy_exercise.value ?& array[
                'exerciseId',
                'kind',
                'completed',
                'score',
                'attempts',
                'completedAt',
                'skipped'
              ]
            )
            or jsonb_typeof(legacy_exercise.value -> 'exerciseId')
              is distinct from 'string'
            or jsonb_typeof(legacy_exercise.value -> 'kind')
              is distinct from 'string'
            or jsonb_typeof(legacy_exercise.value -> 'completed')
              is distinct from 'boolean'
            or jsonb_typeof(legacy_exercise.value -> 'score')
              not in ('number', 'null')
            or jsonb_typeof(legacy_exercise.value -> 'attempts')
              is distinct from 'number'
            or jsonb_typeof(legacy_exercise.value -> 'completedAt')
              not in ('string', 'null')
            or jsonb_typeof(legacy_exercise.value -> 'skipped')
              is distinct from 'boolean'
            or (
              legacy_exercise.value ? 'summary'
              and jsonb_typeof(legacy_exercise.value -> 'summary')
                is distinct from 'string'
            ) then
            raise exception
              'Legacy progress cleanup blocked: malformed exercise % in lesson % for user %',
              legacy_exercise.key,
              legacy_lesson.key,
              legacy_row.user_id;
          end if;

          if jsonb_typeof(legacy_exercise.value -> 'score') = 'number' then
            if (legacy_exercise.value ->> 'score')::numeric < 0 then
              raise exception
                'Legacy progress cleanup blocked: invalid exercise score % for user %',
                legacy_exercise.key,
                legacy_row.user_id;
            end if;
          end if;

          if (legacy_exercise.value ->> 'attempts')::numeric < 0
            or (
              legacy_exercise.value ->> 'attempts'
            )::numeric <> trunc(
              (legacy_exercise.value ->> 'attempts')::numeric
            ) then
            raise exception
              'Legacy progress cleanup blocked: invalid exercise attempts % for user %',
              legacy_exercise.key,
              legacy_row.user_id;
          end if;
        end loop;
      end loop;
    end loop;
  end loop;

  if exists (
    select 1
    from private.user_course_progress_v4_legacy as legacy
    where not exists (
      select 1
      from public.user_course_progress as current_progress
      where current_progress.user_id = legacy.user_id
        and current_progress.course_slug = '_meta'
        and current_progress.created_at = legacy.created_at
        and current_progress.updated_at = legacy.updated_at
        and current_progress.progress = jsonb_build_object(
          'schemaVersion', 3,
          'xp', legacy.progress -> 'xp',
          'checkpoints', legacy.progress -> 'checkpoints',
          'badges', legacy.progress -> 'badges',
          'streak', legacy.progress -> 'streak',
          'lastActivity', legacy.progress -> 'lastActivity'
        )
    )
  ) then
    raise exception
      'Legacy progress cleanup blocked: metadata conversion is not exact';
  end if;

  if exists (
    select 1
    from private.user_course_progress_v4_legacy as legacy
    cross join lateral jsonb_object_keys(
      legacy.progress -> 'courses'
    ) as source_course(course_slug)
    where not exists (
      select 1
      from public.user_course_progress as current_progress
      where current_progress.user_id = legacy.user_id
        and current_progress.course_slug = source_course.course_slug
        and current_progress.created_at = legacy.created_at
        and current_progress.updated_at = legacy.updated_at
        and current_progress.progress = jsonb_build_object(
          'schemaVersion', 3,
          'slice',
          legacy.progress -> 'courses' -> source_course.course_slug
        )
    )
  ) then
    raise exception
      'Legacy progress cleanup blocked: course conversion is not exact';
  end if;

  -- No CASCADE: an unexpected dependency must also block cleanup for
  -- inspection. At this point every source column and every JSONB value is
  -- either represented exactly in the target or is the checked v2-to-v3
  -- schema marker.
  drop table private.user_course_progress_v4_legacy;
end
$legacy_cleanup$;
