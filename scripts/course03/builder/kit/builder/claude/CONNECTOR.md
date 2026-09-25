# Setup C: connect Claude Code to the approved views with a read-only login

## In plain words

In Setups A and B, Claude reads copies of the approved views: CSV files. In Setup C, Claude asks
the database directly, through a **connector**. A connector is a small program (an MCP server;
MCP is the Model Context Protocol) that Claude Code starts and that runs SQL for it.

The connector logs in as one database user: `foldline_ready_reader`. That login can read five
views and nothing else. So even if Claude ignores every instruction, the database answers a
forbidden read with "permission denied" (SQLSTATE 42501). That is the lock.

The connection string (the DSN: host, database, user) lives in an environment variable,
`FOLDLINE_READY_DSN`. It never goes into a file.

## What you need

- The FOLDLINE warehouse built with `warehouse/sql/00_build_all.sql`, and the reader allowed to log
  in. On a local sandbox: `psql -X -d postgres -f warehouse/sql/65_local_login.sql` (login without a
  password, local only). On a shared server, create the login outside version control.
- Claude Code in a repository that holds the files from Setup B.
- A PostgreSQL MCP server that you have reviewed. Pick a maintained one, read its code or docs, and
  write down which tool name it exposes and which argument carries the SQL.

## Steps

| # | Do this | Done when |
| --- | --- | --- |
| 1 | Set the environment variable in your shell or your secret manager, for example `export FOLDLINE_READY_DSN="postgresql://foldline_ready_reader@localhost:5432/saas_ready"`. No password in the string; a real password goes in `~/.pgpass` or the secret manager | `psql "$FOLDLINE_READY_DSN" -c "select current_user"` prints `foldline_ready_reader` |
| 2 | Copy `claude/mcp.example.json` to `.mcp.json` at the repository root. Replace the `command` (and `args`) with your reviewed server. Keep `"${FOLDLINE_READY_DSN}"` exactly as written: Claude Code fills it from the environment when it starts the server. If your server reads another variable name, change the key, not the value | `.mcp.json` contains `${FOLDLINE_READY_DSN}` and no host, user or password |
| 3 | Copy `claude/settings.example.json` to `.claude/settings.json` and `claude/hooks/sql_guard.py` to `hooks/sql_guard.py`. Set the matcher to your server's tool names (`mcp__<server name>__<tool>`). Set `SQL_KEYS` in the hook to your server's SQL argument | `python3 hooks/sql_guard.py --self-test` prints `12 of 12 PASS` |
| 4 | Start Claude Code in the repository and approve the project server when asked. Run `/mcp` to see it connected | The server `foldline-ready` shows as connected |
| 5 | Prove the lock, through Claude: ask it to run `SELECT contact_email FROM core.accounts LIMIT 1` | The hook blocks it. Then run the same SQL with `psql "$FOLDLINE_READY_DSN"`: PostgreSQL answers 42501. That second result is the one that counts |
| 6 | Run the ai_run cases three times each and log them | Rows in `claude-demo/AI-RUN-LOG.md`, setup C |

Test D01 in `warehouse/sql/70_checks.sql` proves the same denial without Claude. Run it as the
login: `psql -X -d saas_ready -U foldline_ready_reader -f warehouse/sql/70_checks.sql`.

## Which part does what

| Part | Kind | What it stops | What it does not stop |
| --- | --- | --- | --- |
| Grants on `foldline_ready_reader` (`60_access.sql`) | **Lock** (database) | Every read outside five views, every write, TEMP, CONNECT to `saas_bad`, for every client | Wrong meaning: a legal query on the right view can still answer the wrong question |
| `sql_guard.py` hook | Guardrail (application, Claude Code only) | Multi-statement SQL, unqualified names, other schemas, identifier columns, detail without LIMIT, before the query runs | Anything sent by another client with the same login; clever SQL its patterns miss |
| A connector's own "read-only" switch | Guardrail | Accidental writes, if the server implements it correctly | A server bug or a statement that ends its read-only transaction. The role does not rely on it |
| Role settings (`search_path = ''`, `statement_timeout`, read-only default) | Guardrail | Unqualified names and runaway queries by default | A client that runs `SET` or `BEGIN READ WRITE` |
| `CLAUDE.md`, the Skill | Guidance | Most wrong routes, politely and early | Nothing, if Claude ignores them |

Two locks: refuse early, enforce anyway.

## What works and what does not

| What works | What does not | Why it fails |
| --- | --- | --- |
| `.mcp.json` with `"DATABASE_URL": "${FOLDLINE_READY_DSN}"` | `"DATABASE_URL": "postgresql://<owner login>:<password>@<host>/saas_ready"` | The file is read by Claude and usually committed. The credential leaks, and it is the owner's (AP-A05) |
| Writing `.mcp.json` by hand with the literal `${FOLDLINE_READY_DSN}` | Running a setup command with `"$FOLDLINE_READY_DSN"` in double quotes | Your shell expands the variable before the command runs, so the real string lands in the config file |
| The connector logs in as `foldline_ready_reader` | The connector logs in as the builder or `postgres` "for the demo" | Every instruction becomes the only lock. D01 would return email addresses instead of 42501 (AP-A04) |
| One connector per lane: `foldline_ready_reader` for the approved lane | One login that sees both lanes | The export tables are one query away. FOLDLINE's `foldline_bad_reader` saw all seven |
| Test the lock with `psql` as the login | "Claude refused, so the data is safe" | A refusal is guidance. Only the 42501 from PostgreSQL proves the lock |
| Schema-qualified SQL, `search_path = ''` on the role | Relying on a `search_path` of `analytics,public` | The recorded ready run did this. Another connection finds nothing, or something else (AP-C05) |

## Repeat the workshop comparison against the database

| Lane | Login | Environment variable | What Claude can see |
| --- | --- | --- | --- |
| Export (Chat A) | `foldline_bad_reader` | `FOLDLINE_BAD_DSN` | All seven export tables in `saas_bad.public` |
| Approved (Project B) | `foldline_ready_reader` | `FOLDLINE_READY_DSN` | Five views in `saas_ready.analytics` |

Use two separate repositories or two separate sessions, one server each. Same question, word for
word. The grants, not the prompt, decide what each can read.

## Safety

- Synthetic data only. Never point this setup at employer or customer data for a workshop.
- No credentials in any file. Check with a secret scan before you commit.
- Claude Code features, file names and menus change. Verify `.mcp.json`, hook and settings syntax
  against the current Claude Code documentation before you rely on them.
