# Analytics Reading Rules

How to read the product usage figures this platform collects, and what you must
not read into them. It is written for whoever opens the Vercel Analytics
dashboard or the owner statistics page months from now, without the context of
the change that introduced them.

Every fact below comes from the code in this tree. The source of truth is:

- `src/lib/analytics/registry.ts`: event names and every value an event may carry
- `src/lib/analytics/dispatch.ts`: the runtime filter in front of the Vercel SDK
- `src/lib/analytics/events.ts`: the typed helpers the components call
- `src/lib/analytics/url-policy.ts`: what the page URL on every record may contain
- `src/lib/admin/analytics-aggregates.ts` and `src/lib/admin/vercel-analytics.ts`:
  the two readers behind the statistics page
- `src/lib/auth/admin-identity.ts`: the owner gate
- `src/app/konto/statistik/page.tsx`: the statistics page

When those files change, update this note. The rules in sections 3, 6 and 7 are
reading rules, not code: nothing in the transport enforces them, so the reader
has to.

## 1. The eleven events

Every event carries at most two properties, always named `subject` and `facet`.
Both are lowercase slugs from the closed lists below. The dispatcher drops any
event name that is not listed, any other key, and any value that is not a
declared member of that event's list. A number, a boolean, an identifier, an
e-mail address or free text cannot reach Vercel.

| Event | Question it answers | `subject` | `facet` |
| --- | --- | --- | --- |
| `course_started` | Which course do people start, and from which surface? | course slug | referrer source |
| `lesson_reached` | Where do people drop off inside a block course? | block-course slug | lesson ordinal |
| `lesson_completed` | Which lesson positions are durably completed? | course slug | lesson ordinal |
| `course_completion` | Does anyone finish, and is the final exam working? | course slug | completion step |
| `login_flow` | How many sign-in attempts per method, and does the magic link go out? | sign-in method | flow step |
| `login_gate` | Why was the login page shown, and what could it offer? | gate reason | availability |
| `ki_check` | Does the diagnostic hand people into a course? | diagnostic step | recommended course (CTA steps only) |
| `material_opened` | Is workshop material actually opened? | workshop slug | material kind |
| `platform_failure` | What is silently failing behind a notice? | failure source | failure reason |
| `advanced_surface` | Is the agent-token surface used once it is offered? | `agent_token` | token step |
| `demo_cta_clicked` | Do demos convert into a course, or dead-end? | demo slug | CTA target |

### Vocabularies

- **Course slugs** (10): `ki-fuehrerschein`, `eu-ai-act-kurs`, `ai-native`,
  `ki-und-gesellschaft`, `data-engineering-fundamentals`, `data-science`,
  `data-infrastructure`, `codex`, `claude`, `ai-native-operator`.
- **Block-course slugs** (3, `lesson_reached` only): `ki-fuehrerschein`,
  `eu-ai-act-kurs`, `ki-und-gesellschaft`.
- **Lesson ordinals** (39): `l01` to `l39`. The position of the lesson in the
  course's canonical order, never the lesson id. Canonical lengths at the time
  of writing: ki-fuehrerschein 18, eu-ai-act-kurs 24, ki-und-gesellschaft 9,
  ai-native 27, ai-native-operator 39, and 12 each for claude, codex,
  data-infrastructure, data-engineering-fundamentals and data-science. The
  authoritative lengths are `CANONICAL_LESSON_IDS` in
  `src/lib/courses/completion.ts`.
- **Referrer sources** (6): `katalog` (`/kurse`), `ki_check` (`/ki-check`),
  `home` (exactly `/`), `demo` (`/demos`), `hub` (`/lernpfad`), `direct`
  (everything else, including every external referrer). The `/en` prefix is
  stripped first. An external referrer never contributes a host, a path or a
  query string.
- **Completion steps** (7): `exam_blocked`, `exam_started`, `exam_unavailable`,
  `exam_passed`, `exam_failed`, `exam_timeout`, `record_downloaded`. The three
  outcomes are disjoint: a timed-out attempt is `exam_timeout`, never also
  `exam_failed`.
- **Sign-in methods** (3): `magic_link`, `google`, `github`.
- **Flow steps** (3): `started`, `link_sent`, `link_failed`. `link_sent` and
  `link_failed` exist only for `magic_link`; OAuth methods only ever report
  `started` because the browser leaves the page.
- **Gate reasons** (12): `progress_save`, `kurs_login`, `anderes_geraet`,
  `abgelaufen`, `ungueltig`, `auth_not_configured`, `auth_unavailable`,
  `missing_code`, `invalid_link`, `untrusted_origin`, `invalid_code_format`,
  `fallback`. Any reason the login page does not know becomes `fallback`; the
  raw query parameter is never sent. No event fires when the page is opened
  without a reason, so the `/login` pageview is the denominator.
- **Availability** (4): `all`, `oauth_only`, `magic_only`, `none`. What the
  login page could offer when the gate was shown. It separates "nobody chose
  GitHub" from "GitHub was never offered".
- **Diagnostic steps** (4): `started`, `completed`, `cta_start`, `cta_course`.
  Only the two CTA steps carry a `facet`, and it is only the recommended course
  slug. No answer from the diagnostic ever leaves the browser.
- **Workshop slugs** (2): `ki-prognosen-einschaetzen`,
  `geschaeftsberichte-mit-ki-lesen`. **Material kinds** (2): `html`, `zip`.
- **Failure sources** (2): `progress_sync`, `ai_grading`. **Failure reasons**:
  `permanent`, `retry_exhausted`, `startup` for `progress_sync`;
  `provider_not_ready`, `quota_unavailable`, `budget_exhausted`,
  `rate_limited`, `network`, `parse_error`, `timeout`, `bad_request` for
  `ai_grading`. The dispatcher checks membership of the combined list, so it
  does not stop a reason from the other source; the helpers never produce one.
- **Token steps** (4): `available`, `minted`, `revoked`, `failed`.
- **Demo slugs** (12): `excel`, `word`, `outbound-workflow`, `agent-pipeline`,
  `n8n-supply-chain`, `rag-vertragsassistent`, `rechnung-zu-sap`,
  `prompt-scanner`, `cost-drift-observability`, `fine-tune-playground`,
  `roi-rechner`, `llm-observability`.
- **CTA targets** (6): `kurs`, `lektion`, `next-demo`, `pdf-download`,
  `copy-link`, `back-to-gallery`.

### When each event fires

- `course_started`: on the first durable progress in a course, decided by
  reading the learner's completed lessons **before** the write. Block courses
  report it after the first persisted section read or lesson completion and
  additionally dedupe per course per document; ai-native,
  data-engineering-fundamentals and data-science report it after the first
  persisted lesson or chapter completion.
- `lesson_reached`: block courses only, when a lesson becomes active through the
  lesson list or the `#lesson=` fragment, once per course and ordinal per
  document, and only after the learner's progress has loaded.
- `lesson_completed`: only after the completion was durably persisted, and only
  when that lesson was not already complete. For data-engineering-fundamentals
  and data-science, the chapter transfer checkpoint is the only completion
  path; the learner's written answer is never read.
- `course_completion`: `exam_blocked` when the exam gate resolves closed,
  `exam_started` when the questions are ready, `exam_unavailable` when they fail
  to load, an outcome once the result is saved, `record_downloaded` after a
  successful record download.
- `platform_failure`: `progress_sync` once per failure kind per document;
  `ai_grading` at each grading fallback, reason only.
- `advanced_surface`: `available` once per view of the token panel, the others
  after the request resolves.

### Which courses report which course event

Not every course is instrumented for every course event. A course that is not
listed for an event never sends it, so a missing row is not a zero:

| Event or step | Courses that send it |
| --- | --- |
| `lesson_reached` | `ki-fuehrerschein`, `eu-ai-act-kurs`, `ki-und-gesellschaft` |
| `course_started`, `lesson_completed` | the three block courses, `ai-native`, `data-engineering-fundamentals`, `data-science` |
| `course_completion` exam steps (`exam_*`) | the three block courses, `ai-native`, `ai-native-operator`, `claude` (the courses with a final exam page) |
| `course_completion` `record_downloaded` | all ten courses (every course has a record page) |

`claude`, `codex`, `data-infrastructure` and `ai-native-operator` report
neither `course_started` nor `lesson_completed`; their lesson readers persist
completions without sending an event. For those four, lesson reach is read
from pageviews only (rule 3), and there is no start or completion count.

No event is derived from the progress store. The store replays its state to
every new subscriber and re-emits across tabs, so a state-derived event would
report a full set of fake completions on every page load.

## 2. Query shapes

The primary interface is the Vercel Web Analytics aggregate query, reachable as
the Vercel MCP tool `get_web_analytics`. `by` takes one or two dimensions,
`filter` is OData and supports `eventData/<property>`, and `limit` is 1 to 100
with a default of 10; everything past the limit is folded into "Others". Always
pass a `limit` sized to the vocabulary you break down (40 for lesson ordinals,
12 for demo slugs or gate reasons, 100 for a two-dimension matrix).

Replace `<projectId>` and `<teamId>` with the project's `prj_` id and the team's
`team_` id from the Vercel dashboard. Never commit either value into this file.
Dates are ISO dates or timestamps; `since` and `until` go together.

**Is anyone finding the site** (pageviews, no custom event):

```js
get_web_analytics({ projectId: "<projectId>", teamId: "<teamId>", dataset: "visits", mode: "aggregate", by: ["day"], since: "<since>", until: "<until>" })
get_web_analytics({ projectId: "<projectId>", teamId: "<teamId>", dataset: "visits", mode: "aggregate", by: ["route"], limit: 50, since: "<since>", until: "<until>" })
get_web_analytics({ projectId: "<projectId>", teamId: "<teamId>", dataset: "visits", mode: "aggregate", by: ["referrerHostname"], limit: 20, since: "<since>", until: "<until>" })
```

**Do they start a course, and which surface converts:**

```js
get_web_analytics({ projectId: "<projectId>", teamId: "<teamId>", dataset: "events", mode: "aggregate", by: ["eventData/subject", "eventData/facet"], filter: "eventName eq 'course_started'", limit: 100, since: "<since>", until: "<until>" })
```

Read the course marginal with `by: ["eventData/subject"]` and the source marginal
with `by: ["eventData/facet"]`. Only six courses send this event (see "Which
courses report which course event"); an absent `claude`, `codex`,
`data-infrastructure` or `ai-native-operator` row means "not measured", not
"nobody started".

**Where do they drop off inside a block course:**

```js
get_web_analytics({ projectId: "<projectId>", teamId: "<teamId>", dataset: "events", mode: "aggregate", by: ["eventData/facet"], filter: "eventName eq 'lesson_reached' and eventData/subject eq 'ki-fuehrerschein'", limit: 40, since: "<since>", until: "<until>" })
```

Read it against the canonical length of that course (18 here). Swap
`lesson_reached` for `lesson_completed` to separate "never opened lesson 4" from
"opened lesson 4 and never finished it". For the seven routed courses use
`dataset: "visits", by: ["route"]` instead, and read rule 3 before you put the
two side by side.

**Does anyone finish, and is the exam broken** (exam steps exist only for the
six courses with a final exam page; `record_downloaded` exists for all ten):

```js
get_web_analytics({ projectId: "<projectId>", teamId: "<teamId>", dataset: "events", mode: "aggregate", by: ["eventData/subject", "eventData/facet"], filter: "eventName eq 'course_completion'", limit: 100, since: "<since>", until: "<until>" })
```

Check `exam_unavailable` first, every time: a non-zero count means the final
exam has been failing to load for that course and invalidates every other ratio
for it. Then, per course:

- pass rate = `exam_passed` / (`exam_passed` + `exam_failed` + `exam_timeout`)
- timeout share = `exam_timeout` / the same denominator
- gate friction = `exam_blocked` / `exam_started`
- record conversion = `record_downloaded` / `exam_passed`

**Does anyone sign in** (three sources, read together; see rule 5):

```js
get_web_analytics({ projectId: "<projectId>", teamId: "<teamId>", dataset: "visits", mode: "aggregate", by: ["route"], filter: "route eq '/login' or route eq '/en/login'", limit: 10, since: "<since>", until: "<until>" })
get_web_analytics({ projectId: "<projectId>", teamId: "<teamId>", dataset: "events", mode: "aggregate", by: ["eventData/subject", "eventData/facet"], filter: "eventName eq 'login_flow'", limit: 20, since: "<since>", until: "<until>" })
get_web_analytics({ projectId: "<projectId>", teamId: "<teamId>", dataset: "visits", mode: "aggregate", by: ["route"], filter: "route eq '/konto' or route eq '/en/konto'", limit: 10, since: "<since>", until: "<until>" })
get_web_analytics({ projectId: "<projectId>", teamId: "<teamId>", dataset: "events", mode: "aggregate", by: ["eventData/subject", "eventData/facet"], filter: "eventName eq 'login_gate'", limit: 100, since: "<since>", until: "<until>" })
```

**Does the diagnostic hand people into a course:**

```js
get_web_analytics({ projectId: "<projectId>", teamId: "<teamId>", dataset: "events", mode: "aggregate", by: ["eventData/subject"], filter: "eventName eq 'ki_check'", limit: 10, since: "<since>", until: "<until>" })
get_web_analytics({ projectId: "<projectId>", teamId: "<teamId>", dataset: "events", mode: "aggregate", by: ["eventData/facet"], filter: "eventName eq 'ki_check' and eventData/subject eq 'cta_start'", limit: 20, since: "<since>", until: "<until>" })
```

**Is something silently broken** (worth running on a schedule):

```js
get_web_analytics({ projectId: "<projectId>", teamId: "<teamId>", dataset: "events", mode: "count", filter: "eventName eq 'platform_failure'", since: "<since>", until: "<until>" })
get_web_analytics({ projectId: "<projectId>", teamId: "<teamId>", dataset: "events", mode: "aggregate", by: ["eventData/subject", "eventData/facet"], filter: "eventName eq 'platform_failure'", limit: 20, since: "<since>", until: "<until>" })
```

Any non-zero `progress_sync` count is a retention incident: cross-device sync is
failing and the learner only sees a notice. `ai_grading` with `network`,
`timeout` or `parse_error` is an operational signal.

**Activation and dead weight:**

```js
get_web_analytics({ projectId: "<projectId>", teamId: "<teamId>", dataset: "events", mode: "aggregate", by: ["eventData/facet"], filter: "eventName eq 'advanced_surface'", limit: 10, since: "<since>", until: "<until>" })
get_web_analytics({ projectId: "<projectId>", teamId: "<teamId>", dataset: "events", mode: "aggregate", by: ["eventData/subject", "eventData/facet"], filter: "eventName eq 'material_opened'", limit: 10, since: "<since>", until: "<until>" })
get_web_analytics({ projectId: "<projectId>", teamId: "<teamId>", dataset: "events", mode: "aggregate", by: ["eventData/facet"], filter: "eventName eq 'demo_cta_clicked'", limit: 10, since: "<since>", until: "<until>" })
```

Read `minted` / `available`, never `minted` alone: a zero without `available`
cannot be told apart from the panel never rendering.

**Dashboard equivalent.** Vercel project, Analytics, Events panel: click an event
name to break it down by `subject` or `facet`, and use the dashboard filter to
pin one value. CSV export is capped per panel and there is no raw event export;
the aggregate query is the real interface.

**Two limits to state whenever a number is quoted.** Analytics is frozen at fire
time: a property that was not sent then can never be recovered. And every
breakdown is top-N, with the rest folded into "Others".

## 3. The comparability rule

**Block-course drop-off and routed-course drop-off are different measurements
and must never land in the same table, chart or ratio.**

- Block courses (`ki-fuehrerschein`, `eu-ai-act-kurs`, `ki-und-gesellschaft`)
  show several lessons on one route, `<course>/kurs/[blockId]`, and switch
  lessons with a `#lesson=` fragment. A pageview cannot tell those lessons
  apart, so their drop-off comes from the `lesson_reached` custom event, which
  is deduplicated and counted at most once per lesson per document.
- Routed courses (`ai-native`, `ai-native-operator`, `claude`, `codex`,
  `data-infrastructure`, `data-engineering-fundamentals`, `data-science`) have
  one `page.tsx` per lesson, for example `ai-native/kurs/[moduleId]/[lessonId]`,
  `kurse/open-source/codex/kurs/[lessonId]`,
  `kurse/open-source/data-science/[chapterSlug]` or
  `kurse/open-source/ai-native-operator/[moduleId]/[lessonNum]`. Their drop-off
  comes from raw path pageviews, which count refreshes, back-navigation and
  repeat visits.

A routed-course curve is inflated relative to a block-course curve by an unknown
and uneven factor. Compare lessons within one course, never across the two
families.

`lesson_completed` is comparable across the six courses that send it (the three
block courses, `ai-native`, `data-engineering-fundamentals`, `data-science`),
because in each of them it fires only on a newly persisted completion. It is
not a ten-course series: `claude`, `codex`, `data-infrastructure` and
`ai-native-operator` do not send it, so never read their absence as zero
completions.

## 4. `course_started` counts start occasions, not people

The "was this course unstarted" check reads the learner's progress on the
current device before the write. One learner who starts on a phone and later on
a laptop before the two have synced counts twice, and a progress reset for a
course (`POST /api/account/reset-progress`) makes the same person startable
again. Block courses also dedupe per document, so a new tab after a reload can
count again if the first write had not landed.

Every start-to-completion ratio therefore has a denominator inflated by an
unknown factor. Read it as a lower bound on conversion, and read changes in it
over time rather than its absolute value.

## 5. There is no "sign-in completed" event, and there cannot be one

The session is established by the server route `src/app/auth/callback/route.ts`
after the magic link or the OAuth provider redirects back. The browser never
witnesses the transition, so no client code can report it truthfully. The
obvious substitute is wrong: the Supabase client emits `SIGNED_IN` when it
restores an existing session from storage, and re-emits events it receives from
other tabs, so listening for it would count page loads and open tabs.

Read sign-in as three independent counts over the same window:

1. `/login` pageviews: the top of the funnel.
2. `login_flow` with `started` per method, and for `magic_link` the share of
   `link_sent` against `link_failed`.
3. `/konto` pageviews: sessions that landed in the account area. This includes
   returning signed-in visitors, so it is an upper bound, not a count of new
   sign-ins.

Treat `login_gate` as the failure-mode breakdown: why people were sent to the
login page, against what it could offer them.

## 6. Low-numbers reading rules

The user base is small. These rules bind the reader, because the payload cannot
enforce them:

- Suppress every cell below **5** occurrences. Do not quote it, do not chart it,
  do not round it to "a few".
- Do not read or export any `subject` by `facet` cross-tab crossed again with
  the page URL, route, country, device or referrer while the user base is small.
  Two dimensions of the event are the ceiling.
- Publish no per-event export, and share no screenshot of a breakdown that shows
  a cell below 5.
- A count of 1 against a handful of known account holders is quasi-personal no
  matter what the payload contains. "Someone passed the eu-ai-act-kurs exam
  yesterday" can identify a person the reader knows.

The statistics page applies the same threshold mechanically (see section 10);
the rules above apply to everything read outside it.

## 7. Permanently unanswerable by design

These questions cannot be answered from this data, and no query will change
that:

- cohort retention, day-1 or day-7 return rate
- per-user funnels, or "did the person who opened the demo later finish the
  course"
- any join against `user_course_progress` or any other account data

There is no persistent visitor id and no cookie or device storage. Vercel's
visitor counting uses a server-side request hash that is discarded after 24
hours. Every "funnel" in this document is a ratio of two independent counts over
the same window, not a path followed by the same people.

The events are deliberately not joinable to a learning account. The privacy
notice (section 5 and section 10) and the account privacy centre's export,
deletion and residue statements are true only while that holds. Adding any
identifier to an event would make all of them false at once.

## 8. Intentionally dark helpers

`trackTermOpened`, `trackExternalBenchmarkVisible`, `trackDemoOpen`,
`trackDemoFilter`, `trackDemoEngagedSeconds` and `trackDemoEmptyState` in
`src/lib/analytics.ts` still run at their call sites. In development they log
through `console.debug`. In production their event names are not in the
registry, so the dispatcher drops them and nothing is sent.

The reasons they stay unregistered: glossary ids are slugged from German labels,
dwell time is a number, and the filter and empty-state events carry three
properties, above the two-property cap.

An empty or missing row for `term_opened`, `external_benchmark_visible`,
`demo_opened` or the other demo gallery names is correct behaviour, not a bug.

## 9. Billing

A custom event is billed exactly like a pageview. As of September 2026, Vercel
Pro includes no separate allowance for custom events, and additional events
cost USD 0.03 per thousand; check Vercel's current pricing page before relying
on that figure. The quota is pooled across every project in the same Vercel team, so
other projects draw on the same meter. A burst of `platform_failure` events from
a broken release costs money as well as signalling an incident.

## 10. The owner statistics page: `/konto/statistik`

A server-rendered page for the platform owner only. Nothing links to it; it is
reached by typing the address. It stores nothing: both sections are computed on
each request. There is no JSON endpoint and no client component behind it.

### Gate states

`requireAdminUser()` classifies the request once per render. It always resolves
the authenticated user first, compares the verified account id with
`LOEHRNING_ADMIN_USER_ID` in constant time, and never consults profile metadata,
provider identity data or an e-mail address.

| State | Meaning | What the page does |
| --- | --- | --- |
| `signed-out` | No signed-in user | Redirects to the localized `/login?next=/konto/statistik` |
| `disabled` | No valid owner id configured | Ordinary 404 |
| `denied` | Signed in, but not the owner | Ordinary 404 |
| `unavailable` | The session or its claims could not be verified | Panel without numbers; the failure is reported |
| `reauth` | The owner, but the last interactive sign-in is too old | Panel without numbers (see below) |
| `admin` | The owner with a recent sign-in | Both sections |

Disabled and denied are indistinguishable from a missing page on purpose. Both
readers re-check the gate themselves and return nothing unless it is `admin`.

### The 24-hour re-sign-in rule

The page opens only within 24 hours (`ADMIN_RECENT_AUTH_MAX_AGE_SECONDS`) of an
interactive sign-in: a magic link, a one-time code or an OAuth sign-in recorded
in the session's signed authentication methods, with 60 seconds of clock skew
allowed. A session cookie that has simply been refreshed does not count.

When the sign-in is older, the page shows a panel with two steps: sign out
through the app's normal sign-out form (`POST /auth/logout`), then sign in again
through `/login?next=/konto/statistik`. It does not redirect a signed-in owner
to `/login` directly, because the login page sends a signed-in visitor straight
back to `next` and the two pages would bounce.

### Section 1: platform head-counts

Read with the server-side Supabase client as head-counts only: no row and no
named column is returned, no auth schema is read, and account totals are
deliberately not shown.

- **Floor 20** (`GLOBAL_ACTIVITY_FLOOR`): below 20 rows in
  `user_course_progress` the section shows no figures at all, only an
  insufficient-data note.
- **k = 5** (`MIN_REPORTABLE_COUNT`): a total below 5 is shown as suppressed,
  never as a number, and a per-course row below 5 is omitted.
- Totals: course progress rows, assessment runs, assessment answers, beta
  feedback, agent access events, agent access tokens and stored account model
  keys. The last three come from newer migrations that may not be applied in
  every environment. A count that fails is shown as unavailable, never as zero,
  and never fails the page.
- Per course: course progress rows per course slug. If any per-course count
  fails, the section says the list is incomplete.

### Section 2: Vercel Web Analytics

Read server-side from the Vercel API for the **last 30 days** on each request,
with `VERCEL_ANALYTICS_API_TOKEN`, `VERCEL_ANALYTICS_TEAM_ID` and the injected
`VERCEL_PROJECT_ID`. The token is never logged, returned or shown.

- **Totals**: pageviews and visitors, shown unsuppressed. "Visitors" is Vercel's
  daily-hash estimate (section 7), not people.
- **Top routes**: up to 20 rows by the dynamic `route` dimension, never the raw
  request path. This series is subject to rule 3.
- **Events by name**: up to 20 rows, registered event names only.
- **Course starts by course**: `course_started` broken down by `subject`. Only
  the six instrumented courses can appear (section 1).
- **Lesson completions by course**: `lesson_completed` broken down by `subject`,
  summed over all lesson positions. The same six courses only.
- **Course completion by step**: `course_completion` broken down by `facet`,
  summed over all courses. Check `exam_unavailable` per course with the query
  in section 2 before reading a pass rate from it.

Every breakdown row below 5 is omitted and every breakdown is top 20; totals are
shown as they are. These are one-dimension views; the two-dimension questions in
section 2 still need the aggregate query, under the rules of section 6.

Each part has its own state:

- **disabled**: the token, team id or project id is missing or malformed. No
  request is made.
- **not enabled**: Vercel answered that Web Analytics is not switched on for the
  project. The whole section says so.
- **unavailable**: a request failed or the response did not have the expected
  shape. Only that part says so; the others still render.

### Activation order

Each step assumes the previous one (the variables are documented in
`docs/deployment.md`):

1. Switch Web Analytics on for the project in the Vercel dashboard.
2. Merge the code.
3. Make one Production environment change that sets
   `VERCEL_TELEMETRY_ENABLED=true`, `VERCEL_TDDDG_ASSESSMENT_AT` and
   `VERCEL_EVENT_ASSESSMENT_AT` together.
4. Set `LOEHRNING_ADMIN_USER_ID`, `VERCEL_ANALYTICS_API_TOKEN` and
   `VERCEL_ANALYTICS_TEAM_ID`.
5. Redeploy.

Until step 1, the analytics script answers 404 and a dashboard looks exactly like
zero traffic. Until step 4, the page's Vercel section shows its disabled state.
