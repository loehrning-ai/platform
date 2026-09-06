# Hosted tools

The platform itself is a Vercel deployment. Exactly one tool is meant to run
outside it: the resume editor at `https://cv.loehrning.ai`, which is the
published `loehrning-ai/cv-engine` source at a pinned revision, on a container
host we operate. Same code as the repository, our accounts, our server.

That host does not exist yet. `cv.loehrning.ai` has no DNS record and nothing
answers on it, so this file is a plan for a deployment rather than a
description of one, and no surface of the platform offers the hosted instance:
`/open-source` publishes cv-engine as source-only, and the account handoff
route answers 404 while its two variables are unset. Nothing here is live until
the checklist below has actually been worked through.

This file is the operator runbook for that host. cv-engine ships its own
`DEPLOY.md` and that stays the authority on the image, the compose profile, the
release workflow and the schema contract. What follows covers only the part that
is specific to running it as a piece of this platform: one shared Supabase
project, one login, one deletion, and no operator AI key.

Read it top to bottom the first time. The order of the sections is the order of
the work, and two of the gates have to pass before DNS exists.

## What runs where

- **Editor and API.** gunicorn (1 worker, 120 s timeout) in a Docker container on
  a Hetzner Cloud CX22, Ubuntu 24.04, EU location. Published on
  `127.0.0.1:8000` only, never on the public interface.
- **TLS and ingress.** Caddy in a second container on the same host, ports 80,
  443 and 443/udp. Automatic Let's Encrypt certificate for `cv.loehrning.ai`,
  plus HSTS, `nosniff` and `strict-origin-when-cross-origin`.
- **Account erasure worker and PDF cleanup worker.** Two more containers from the
  same image, `prod` compose profile only. Both must report healthy or the
  release is incomplete.
- **Accounts, documents, saved jobs, provider-key vault rows.** The platform's
  own Supabase project, region eu-west-1. cv-engine has no database of its own
  here.
- **Uploaded CV photos.** A Docker named volume on the Hetzner disk, mounted at
  `/app/design/photos`, one directory per account id. Declared as
  `onepager_photos`, which Compose prefixes with the project name. This is the
  only learner content that lives on the VM.
- **Rendered PDFs.** Not stored. Object storage stays off, so WeasyPrint renders
  and streams each PDF in process.
- **AI.** No operator key. Every generation runs on a key the learner brings.
- **Analytics.** Off. With `POSTHOG_KEY` unset the analytics module is a no-op
  and makes no network calls.

**No operator Anthropic key is set on this host, deliberately.**
`ANTHROPIC_API_KEY` is left out of the environment file entirely and
`profiles.managed_credits_remaining` defaults to 0, so the deployment funds no
generations at all. The managed path refuses with a named
`managed_ai_not_offered` (HTTP 402) and spends no credit, and the AI badge
reports the feature as unavailable instead of promising a generation the
instance cannot run. Everything deterministic (import, ATS scoring, editing,
preview, PDF build, export, deletion) works untouched. A learner who wants
generation stores their own provider key; it is encrypted with AES-256-GCM
under a per-key data key that is itself wrapped by `ONEPAGER_KEK`, with the
account id as additional authenticated data, so a stolen row cannot be replayed
under a different account.

If an operator key is ever added, the honesty copy on `/open-source` and in
cv-engine's own landing and tour text stops being true and both have to change
in the same release.

## Two gates before DNS

Both gates are database work and neither needs the host to exist. Run them in
this order. Do not create the DNS record and do not start the `prod` profile
until both are green.

### Gate 1: migration replay on a disposable cluster

From a cv-engine checkout:

```bash
lsof -nP -iTCP:55432 -sTCP:LISTEN     # empty output means the port is free
PGPROBE_PORT=55432 ./tools/db/replay_migrations.sh
```

The script creates a throwaway PostgreSQL cluster in a temporary directory,
installs a minimal Supabase shim (the `anon`, `authenticated` and `service_role`
roles, `auth.users`, `auth.uid()`), replays every file under
`supabase/migrations/` in order, then executes the behavioural probes in
`tools/db/migration_probes.sql`. Nothing hosted is touched and the cluster is
destroyed on exit, including on failure.

Exit 0 is the pass. Exit 127 means the local PostgreSQL toolchain is missing,
which is not a pass. Pick a different `PGPROBE_PORT` if the default is busy;
the script refuses rather than colliding.

### Gate 2: apply to the shared project, then prove RLS on it

Apply cv-engine's migrations in order against the platform project with `psql`
and the direct connection string from the Supabase dashboard.

Two things not to do:

- Do not run a `db push` from either repository against the shared project. The
  two migration lineages are independent, cv-engine's early versions are not
  timestamped, and a push would try to reconcile a ledger it does not own.
- Do not copy cv-engine's SQL into `packages/website/supabase/migrations/`. That
  directory's filename list is pinned exactly by
  `src/lib/progress/database-migration-contract.test.ts`, so a copy fails the
  unit test immediately, which is the intended outcome.

Verify the result from the outside instead of by reading a ledger. The read-only
service-role `release_schema_contract()` probe is the authority on which of
cv-engine's runtime functions exist and are executable, and it is the same probe
the platform's account deletion route uses to decide whether the coordination
runs.

Then run the live RLS gate against the shared project:

```bash
ONEPAGER_LIVE_RLS_REQUIRED=1 python3 tools/ci/live_rls_gate.py
```

Setting `ONEPAGER_LIVE_RLS_REQUIRED` makes a missing input a hard failure rather
than an honest skip. The gate reads, by name only:

- `ONEPAGER_RLS_SUPABASE_URL`
- `ONEPAGER_RLS_SUPABASE_PUBLISHABLE_KEY`
- `ONEPAGER_RLS_SUPABASE_JWKS_URL`
- `ONEPAGER_RLS_USER_A_JWT`, `ONEPAGER_RLS_USER_A_ID`
- `ONEPAGER_RLS_USER_B_JWT`, `ONEPAGER_RLS_USER_B_ID`

Use two throwaway accounts created through the platform's own login, not through
cv-engine, so the gate proves the thing that actually matters here: a platform
account sees zero foreign documents. The gate rejects a publishable key whose
role claim looks privileged, which is exactly the mistake it exists to catch.
No service-role material belongs in these variables.

Last check of this gate: sign up one more throwaway account through the
platform's own login and confirm `public.profiles` gained a row for it with
`managed_credits_remaining` at 0. cv-engine's `on_auth_user_created` trigger now
fires for **every** platform sign-up, not only for editor users, and the zero
default is what keeps an ordinary course learner from being handed
operator-funded AI they never asked for.

A failure in gate 2 is a stop, not a warning.

## Provisioning checklist

1. **Create the server.** Hetzner Cloud, CX22 or larger, image Ubuntu 24.04, an
   EU location (Nuremberg or Falkenstein) for data residency. Add your SSH key
   during creation. Record the IPv4 address.

2. **Harden the host before anything listens.** As root:

   ```bash
   adduser --disabled-password --gecos "" deploy
   install -d -m 700 -o deploy -g deploy ~deploy/.ssh
   # place your public key in ~deploy/.ssh/authorized_keys, then:
   chown deploy:deploy ~deploy/.ssh/authorized_keys
   chmod 600 ~deploy/.ssh/authorized_keys
   apt-get update && apt-get install -y ufw unattended-upgrades
   dpkg-reconfigure -plow unattended-upgrades
   ufw default deny incoming
   ufw default allow outgoing
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw allow 443/udp
   ufw --force enable
   ```

   Disable password authentication and root login in `/etc/ssh/sshd_config`
   (`PasswordAuthentication no`, `PermitRootLogin no`) and reload sshd.

   Know what the firewall does and does not cover: Docker publishes ports by
   writing its own iptables rules ahead of ufw's, so 80 and 443 are reachable
   whether or not ufw says so. ufw is protecting host services such as sshd.
   The app container is bound to `127.0.0.1:8000` for exactly this reason, and
   it is that binding, not the firewall, that keeps gunicorn off the public
   interface. Add a Hetzner Cloud Firewall (22, 80, 443 TCP plus 443 UDP) if you
   want a rule set that sits outside the guest and therefore does cover
   Docker-published ports.

3. **Install Docker.**

   ```bash
   curl -fsSL https://get.docker.com | sh
   usermod -aG docker deploy
   ```

4. **Both gates above must be green.** DNS comes after them, not before.

5. **Configure Supabase Auth for the new host.** In the platform project, under
   Authentication then URL Configuration, add `https://cv.loehrning.ai` to the
   redirect allow-list. Leave the Site URL on the platform apex. The handoff
   asks for no redirect target and does not depend on this entry, but
   cv-engine's own sign-in (the fallback path) does.

6. **DNS at GoDaddy.** The zone is served by GoDaddy's nameservers, so the
   record is created there, not in Vercel. Add one A record: host `cv`, value
   the Hetzner IPv4 address, TTL 600. Do not add an AAAA record unless the host
   is genuinely reachable over IPv6, because Let's Encrypt will prefer it and
   certificate validation will fail against an unreachable address. Confirm
   propagation before starting Caddy:

   ```bash
   dig +short cv.loehrning.ai A
   ```

7. **Lay down the release tree.** Create it once as root and hand it to the
   deploy user, then do everything else as `deploy`:

   ```bash
   install -d -m 750 -o deploy -g deploy /opt/onepager   # as root
   # then, as deploy:
   umask 077
   # copy or extract the checked-out release artifact into /opt/onepager
   cd /opt/onepager
   ```

8. **Write the environment file.** `cp .env.example .env`, then
   `chmod 600 .env`, then fill it in on the host. Values are typed directly into
   the file on the server. No secret value goes into a chat, a commit, a shell
   history line or this document. The keys, by name, are in the next section.

9. **Build, scan, pin, start.** cv-engine's `DEPLOY.md` section 6 has the exact
   block, including the one-time Caddy volume ownership fix and the read-only
   schema probe. The shape of it:

   ```bash
   docker compose -p onepager --profile prod --env-file .env config --quiet
   docker compose -p onepager --profile prod --env-file .env build app caddy
   bash tools/ci/scan_container_images.sh
   export ONEPAGER_APP_IMAGE="$(docker image inspect onepager:dev --format '{{.Id}}')"
   export ONEPAGER_CADDY_IMAGE="$(docker image inspect onepager-caddy:2.11.4 --format '{{.Id}}')"
   export COMPOSE_FILE="docker-compose.yml:docker-compose.release.yml"
   # append both image IDs and COMPOSE_FILE to .env, then:
   docker compose -p onepager --profile prod --env-file .env up -d --no-build --pull never
   docker compose -p onepager ps
   ```

   The release override removes both build definitions and fails closed if
   either image reference is missing, so the host cannot silently rebuild source
   or fall back to a mutable tag after the scan.

10. **Smoke test.** In order:

    ```bash
    curl -fsS https://cv.loehrning.ai/healthz     # {"ok": true}
    curl -fsS https://cv.loehrning.ai/            # landing page HTML
    curl -fsS https://cv.loehrning.ai/robots.txt  # crawl rules, /auth/ disallowed
    curl -i   https://cv.loehrning.ai/api/cvs     # 401 without a bearer token
    ```

    Then, with a throwaway platform account: sign in, create a document, build a
    PDF, run the account export, and ask for an AI generation with no provider
    key stored. That last one must answer with the named
    `managed_ai_not_offered` refusal (HTTP 402). A 503 or an actual generation
    means the operator-key posture is wrong and the deployment is not ready.

    Finally confirm both workers are healthy:

    ```bash
    for svc in purge-worker pdf-cleanup-worker; do
      id="$(docker compose -p onepager --profile prod ps -q "$svc")"
      docker inspect --format '{{.State.Health.Status}}' "$id"
    done
    ```

11. **Only then turn the platform surface on.** Set the two platform variables
    described under "Rollback" below, in Vercel preview and production, and
    redeploy.

## Environment keys, by name

Never a value in this file, and never a value in a commit. `.env` lives on the
host at mode 600 and is written there by hand.

Required, and the app refuses to start without them:

- `PUBLIC_BASE_URL` (`https://cv.loehrning.ai`; CORS echoes only this origin)
- `ONEPAGER_DOMAIN` (`cv.loehrning.ai`, the host Caddy gets a certificate for)
- `ACME_EMAIL` (Let's Encrypt expiry and recovery notices)
- `SUPABASE_URL` (the platform project)
- `SUPABASE_PUBLISHABLE_KEY` (browser-safe)
- `SUPABASE_JWKS_URL` (local JWT verification)
- `SUPABASE_SERVICE_ROLE_KEY` (server only, never reaches a browser)
- `ONEPAGER_KEK` (base64 of exactly 32 bytes; the BYO-key envelope)
- `ONEPAGER_REVIEW_TOKEN_SECRET` (reviewed-apply token signing)
- `FLASK_SECRET_KEY` (fallback signing secret; keep it distinct from the above)
- `ONEPAGER_PRIVACY_CONTACT` (a monitored address; a public origin refuses to
  start without one)

Set here on purpose:

- `ONEPAGER_R2_NEVER_USED` set to `1`. A durable assertion that this deployment
  has never put a PDF in object storage. It is mutually exclusive with the
  `R2_*` group, and once object storage has ever been enabled you must keep
  working bucket credentials instead so erasure can still delete historical
  objects. In never-used mode the PDF cleanup worker is a fail-closed no-op that
  requires `pdf_artifacts` and `pdf_artifact_cleanup_queue` to stay empty; any
  durable artifact evidence makes it unhealthy rather than pretending cleanup is
  available.

Left absent on purpose:

- The operator AI key. See the top of this file.
- `POSTHOG_KEY`, so analytics stays a no-op.
- `ONEPAGER_DEMO_MODE`. The server refuses demo mode on a non-loopback
  `PUBLIC_BASE_URL` anyway, but leave it unset.
- Every ambient provider SDK key (`GOOGLE_API_KEY`, `GEMINI_API_KEY`,
  `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `DEEPSEEK_API_KEY`, `GROQ_API_KEY`,
  `MISTRAL_API_KEY`). Several SDKs read those names automatically and would
  silently override a learner's vault key. Their absence is a security control.

## One login, two surfaces

Both surfaces trust the same Supabase project. The platform issues the session;
cv-engine verifies the bearer token locally against the project's JWKS
(`SUPABASE_JWKS_URL`) and never calls the platform. Nothing is embedded: the
hosted tool is opened by a link, so the platform's CSP is unchanged.

### The handoff

The account page submits an ordinary same-origin form POST, no fields and no
JavaScript, to `/konto/werkzeuge/cv-engine/oeffnen`. A POST rather than a link,
because the request mints a one-time credential and a GET would let a prefetch,
a crawler or a shared URL burn it silently.

On the happy path that route verifies the cookie session, charges a per-account
budget (5 per minute per account, with an independent 30 per minute per client),
asks Supabase Auth Admin for a one-time magic-link token for the signed-in
address, and answers `303` to
`https://cv.loehrning.ai/auth/handoff#token_hash=...&type=magiclink`.

The token rides in the URL fragment on purpose. Browsers never send a fragment
to a server, so it cannot appear in a Caddy log, a proxy log or a `Referer`
header. cv-engine's handoff page reads the fragment in the browser, calls
`verifyOtp`, scrubs the fragment with `history.replaceState`, and replaces the
location with the editor. The Flask process never sees the token, and a test
asserts that over the source.

Every failure that is not a security refusal ends in the same harmless place:
`303` to `https://cv.loehrning.ai/?hinweis=anmelden`, which carries no
credential and lands on cv-engine's own sign-in with a short notice. That covers
an admin API that will not mint a magic link for an account which only ever
signed in through an identity provider, a timeout, and a payload the route
refuses to trust. The handoff is an accelerator, never a requirement.

Security refusals answer with a status instead of a redirect, because a redirect
would turn a refusal into a usable side effect: cross-origin submission `403`,
unaccepted content type `415`, capability off `404`, exhausted budget `429`,
authentication backend down `503`.

### The cookie domain, and what it means for every future subdomain

The platform's auth cookies are host scoped. `AUTH_COOKIE_OPTIONS` in
`src/lib/supabase/config.ts` sets `secure` in production and
`sameSite: "lax"`, and deliberately sets no `domain`, so the cookie is issued
for `loehrning.ai` alone and `cv.loehrning.ai` never receives it. That is why
the handoff exists at all: a single-use token is the only thing that crosses the
host boundary, and it is spent on arrival.

Widening that cookie to `.loehrning.ai` looks like a shortcut and is not one.
`httpOnly` is intentionally false, because the browser Supabase client reads the
token. A `Domain=.loehrning.ai` cookie would therefore hand a live,
script-readable platform session to every current and future `*.loehrning.ai`
host: this editor, any status page, any preview host, any subdomain ever pointed
at a third-party service. One compromised or careless subdomain would become a
full account takeover across the platform.

So the rule for every future subdomain is: it gets its own handoff, not the
session cookie. If that decision is ever revisited it is a security review with
a written argument, not a config tweak, and the reviewer has to say what
prevents a third-party subdomain from reading the token.

### Deletion, in both directions

One identity means one deletion, and it can start from either side.

**Started on the platform.** `/api/account/delete` probes for cv-engine's schema
with the service-role `release_schema_contract()`. Three outcomes, all explicit:

- Schema absent (a `PGRST202` or `42883` answer): cv-engine was never applied
  here, there is nothing to coordinate, and the platform deletion proceeds
  untouched.
- Schema available: the route calls
  `request_account_deletion_with_artifact_detach()` **before**
  `auth.admin.deleteUser()`. The transition stamps the profile, copies live
  artefacts into the cleanup queue, drops the artefact rows and soft-deletes the
  documents in one transaction, so the cascade that follows removes rows the
  tool has already accounted for. That call uses the learner's own cookie-bound
  session, not the service client: the function takes no arguments, derives its
  owner from `auth.uid()`, and is granted to `authenticated` alone, so a
  service-role call would arrive unauthenticated and delete nothing while
  looking correct.
- Anything else, including a schema that is present but whose transition cannot
  be called: `503 cv_engine_cleanup_unavailable` and nothing is deleted. The
  refusal happens before sessions are revoked and before the auth user is
  touched, so a retry is safe.

**Started in the editor.** cv-engine's own flow stamps a D+30 deadline and the
purge worker on this host completes it: it claims the account, deletes its
object-storage prefix (none here) and its photo directory, revalidates the
claim lease, then hard-deletes the Supabase Auth user. That cascade removes the
platform's rows too, `user_course_progress` included. Deleting the account
inside the resume editor therefore ends the platform account as well, thirty
days later. That is the intended meaning of one identity, but it is worth
knowing before someone is surprised by it.

**One residual to sweep.** A platform-initiated deletion removes the auth user
immediately, and `private.account_deletion_claims` and `public.profiles` cascade
away with it, so the purge worker never claims that account and its photo
directory under `onepager_photos` stays on the disk. Nothing else survives:
documents, saved jobs, vault rows and artefact bookkeeping all cascade, and no
PDFs are stored. Sweep the orphans in the monthly maintenance window.

Resolve the volume rather than guessing its name. Compose prefixes a named
volume with the project name, so the volume declared as `onepager_photos` is not
what Docker calls it:

```bash
photo_volume="$(docker compose -p onepager --profile prod ps -q app \
  | xargs docker inspect --format \
    '{{range .Mounts}}{{if eq .Destination "/app/design/photos"}}{{.Name}}{{end}}{{end}}')"
docker run --rm -v "$photo_volume:/photos:ro" --entrypoint python3.13 \
  "$ONEPAGER_APP_IMAGE" -c 'import os; print("\n".join(sorted(os.listdir("/photos"))))'
```

Each name is an account id. In the Supabase SQL editor, list the ids that are
still live:

```sql
select id from auth.users order by id;
```

Remove each directory that is not in that list:

```bash
docker run --rm -v "$photo_volume:/photos" --user 999:999 --entrypoint python3.13 \
  "$ONEPAGER_APP_IMAGE" -c 'import shutil, sys; shutil.rmtree("/photos/" + sys.argv[1])' \
  <account-id>
```

### One rough edge

cv-engine's sign-in card renders a "Continue with GitHub" button
unconditionally. Only Google is enabled on the platform project, so that button
leads to a provider error. Either leave it alone and know why it fails, or
enable the provider on the project, which is a change to the platform's own
provider posture and needs its own review and attestation. Do not enable it
casually to make a button work.

## What is logged, and what is not

Not logged:

- **No HTTP access log.** The `Caddyfile` declares no `log` directive, so no
  per-request line with a path or query string is written for the site. Confirm
  it after the first deploy with `docker compose -p onepager logs caddy` and
  look for the absence of request lines. If you ever add access logging, strip
  the query string first.
- **No application access log.** gunicorn runs without an access log file, so
  there is no per-request record from the app either.
- **No secrets in application logs.** A redaction filter sits on the root logger
  and masks the rendered message before any handler emits it: bearer headers,
  `Cookie:` headers, JWT-shaped strings, session and access and refresh token
  assignments, generic `api_key` / `token` / `secret` / `password` assignments,
  the `sk-ant-`, `sk-or-v1-`, `sk-proj-`, `sk-svcacct-` and generic `sk-`
  families, `gsk_`, Google `AIza` keys and `ya29.` access tokens.
- **No identifiers in worker logs.** Both workers log cycle-level counts and
  exception class names only: never owner identifiers, claim tokens, object
  keys, credentials or exception messages.
- **No handoff token anywhere.** It travels in a fragment, the platform route
  never logs it, its named errors carry no payload, and the redirect it issues
  carries `Referrer-Policy: no-referrer` so the account URL the learner came
  from does not reach this host either.
- **No analytics.** With `POSTHOG_KEY` unset the module makes no network call.

Logged, and worth knowing about:

- Caddy's own runtime log (startup, ACME certificate issuance and renewal, TLS
  errors) and the application's error and exception traces go to container
  stderr, which Docker's json-file driver keeps on the VM disk. Cap it so a
  noisy day cannot fill the disk, for example with
  `{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}` in
  `/etc/docker/daemon.json`, then restart Docker.
- Supabase keeps its own Auth logs for the project, including sign-in events and
  client IP addresses, under its own retention. Those are outside this host and
  outside this runbook.
- `cv.loehrning.ai` becomes public knowledge the moment Let's Encrypt issues the
  certificate, because it is published in Certificate Transparency logs. Treat
  the hostname as public from the start; never assume an unlisted subdomain is
  unknown.

## Uptime check

Point an external HTTP monitor at `https://cv.loehrning.ai/healthz` from an EU
probe. It is unauthenticated and exempt from the auth wrapper. Expect HTTP 200
and the body `{"ok": true}`. A 60 second interval and an alert after two
consecutive failures is enough at this scale. Enable the monitor's TLS expiry
check as well: Caddy renews on its own, but a failed renewal is otherwise
silent until the certificate dies.

Know the limit of that signal. `/healthz` touches neither auth nor the database,
so a green check with a broken Supabase project still means nobody can sign in.
The second signal is the two worker healthchecks, which do reach the database:

```bash
for svc in purge-worker pdf-cleanup-worker; do
  id="$(docker compose -p onepager --profile prod ps -q "$svc")"
  docker inspect --format '{{.State.Health.Status}}' "$id"
done
```

If `purge-worker` turns unhealthy, suspect the service-role key or a Supabase
outage. If `pdf-cleanup-worker` turns unhealthy, suspect that object storage got
switched on, or that a row appeared in `pdf_artifacts` or
`pdf_artifact_cleanup_queue` while the never-used assertion is still set.

## Monthly image digest bump

Both images are pinned by digest, which means they never drift and they never
pick up a patch on their own. Once a month:

1. Bump the digest pins: the Wolfi base in `Dockerfile`, and the Go builder plus
   the Wolfi runtime in `Dockerfile.caddy`.
2. Expect the pinned `apk add` versions in `Dockerfile` (Python, pip, Cairo,
   Pango, GDK-Pixbuf, HarfBuzz, fontconfig, the font package, CA certificates,
   libffi, shared-mime-info) to move with the base. Wolfi retires old package
   revisions quickly, so a build that fails on an unresolvable pin is the
   expected signal, not a surprise. Bump to the versions the new base carries.
3. Rebuild both images and rerun `bash tools/ci/scan_container_images.sh`. Trivy
   is itself pinned by digest, scans an exported image tar without touching the
   Docker socket, fails closed if the vulnerability database cannot update, and
   rejects any critical or high finding known at scan time.
4. Regenerate `requirements.lock` and `requirements-audit.lock` with hashes if a
   Python dependency moved.
5. Record the new content-addressed image IDs, write them into `.env`, and
   restart with the release override. Never `docker compose pull`, and never
   rebuild on the host without rerunning the scan.
6. The host OS is handled by unattended-upgrades. Reboot when
   `/var/run/reboot-required` appears.
7. Sweep the orphaned photo directories in the same window.

A clean scan is a point-in-time result, not a guarantee: it says only that
nothing critical or high was known at that moment. Rerun it for every release
and whenever the vulnerability database moves, and record the date in the
operations notes.

## Rotating each secret

- **`SUPABASE_SERVICE_ROLE_KEY`.** This now has two consumers. Rotate it in the
  Supabase dashboard, then update **both** the platform's Vercel environment and
  this host's `.env`, then restart the compose project. Rotating in one place
  only breaks the other quietly: on the platform, privileged routes fail closed;
  on this host, both workers go unhealthy and the schema probe stops answering.
  Modern `sb_secret_` keys are accepted by the platform's validator, so there is
  no reason to fall back to a legacy JWT-shaped key.
- **`SUPABASE_PUBLISHABLE_KEY`.** Browser-safe, but the platform inlines its own
  copy at build time and derives the CSP from it, so a rotation needs a Vercel
  redeploy as well as a restart here.
- **`SUPABASE_JWKS_URL`.** Not a secret. cv-engine's JWKS client refetches when
  it sees an unknown key id, so a Supabase signing-key rotation needs no action
  on this host.
- **`ONEPAGER_KEK`.** Base64 of exactly 32 bytes; generate with
  `openssl rand -base64 32`. It wraps a per-key data key for every stored
  provider key, with the account id as additional authenticated data, and there
  is no re-wrap tool in the repository. Changing it makes every stored key
  undecryptable: the tool answers `key_decrypt_failed` and asks the learner to
  re-enter the key rather than failing silently, and the AI settings panel has a
  replace-key control for exactly that. So a rotation is a user-visible event.
  Announce it, and in the same window delete `public.user_llm_keys` so the panel
  asks for a fresh key instead of holding an unusable one. Do not rotate this on
  a routine schedule; rotate it because it leaked.
- **`ONEPAGER_REVIEW_TOKEN_SECRET` and `FLASK_SECRET_KEY`.** Signing secrets for
  reviewed-apply tokens. `openssl rand -base64 48` each, kept distinct from one
  another. Rotation invalidates in-flight review tokens only and the learner
  repeats the review step, so these are safe to rotate on a schedule.
- **SSH access.** Rotate by replacing the deploy user's
  `~/.ssh/authorized_keys`. There is no password login to fall back to, so keep
  a second key or a Hetzner console session available before you remove the
  first one.
- **`ACME_EMAIL`, `ONEPAGER_PRIVACY_CONTACT`, `ONEPAGER_DOMAIN`,
  `PUBLIC_BASE_URL`.** Not secrets. The privacy contact is load-bearing: a
  public origin refuses to start without it, so keep the mailbox monitored.
- **The operator AI key.** None is set, so there is nothing to rotate.
- **`RATE_LIMIT_HMAC_SECRET`.** Platform-only, and it never belongs on this host.
  Rotating it resets active rate-limit counters; see `docs/deployment.md`.

## Rollback

The platform's account surface is gated by two environment variables, both
required together:

- `CV_ENGINE_HOSTED_URL`, the exact HTTPS origin. A `loehrning.ai` host, and no
  path, port, query, fragment or credentials. Anything else is rejected and the
  capability stays off.
- `CV_ENGINE_HOSTED_CONFIRMED_AT`, `YYYY-MM-DD`, today or earlier. A dated
  record that someone actually reached the deployment and reviewed it.

Unset either one in the Vercel project (preview and production) and redeploy.
`cvEngineHandoffOrigin()` returns null, so the handoff route answers `404` and
the account surface that submits to it renders nothing. That is the whole
rollback for the account side: one deploy, no code change, no data movement.
Data stays in the shared Supabase project, and the VM keeps running or is
stopped independently, as you prefer.

Two things do **not** come back with an environment unset, and assuming they do
is the trap:

- **The open-source registry entry is a build-time constant.** cv-engine's
  `delivery: "hosted-service"` and its `launchHref` live in
  `src/lib/open-source/artifacts.ts`, and the hub's data-flow copy names Hetzner
  and eu-west-1 in both locales. Taking the hosted mode off `/open-source` is a
  code revert, not an environment flip. It is deliberately not
  environment-driven, because the sitemap, `llms.txt` and the knowledge-graph
  endpoint must be identical across every environment.
- **cv-engine's schema stays applied to the shared project.** Removing it is a
  separate, deliberate migration. Leave it in place during a rollback: the
  deletion and export coordination is keyed on schema presence, not on these two
  variables, precisely so a learner's rows are still deleted and still exported
  after the surface has been taken away.

## Cost

About 4 to 6 EUR per month for a CX22-class instance in an EU location, plus
Hetzner's separate monthly charge for the IPv4 address. Nothing else in this
deployment costs anything at rest: the Supabase project is the platform's
existing one, object storage is off, analytics is off, and with no operator AI
key there is no per-generation cost on our side. Record the actual invoice
figure in the operations notes once the first month has been billed.
