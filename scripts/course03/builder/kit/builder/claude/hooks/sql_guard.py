#!/usr/bin/env python3
"""sql_guard.py: a PreToolUse hook for Claude Code that checks SQL before a database tool runs it.

In plain words
--------------
Claude Code can run a small program before it uses a tool. This program reads the SQL that Claude
is about to send to the FOLDLINE database connector and stops it when it breaks a course rule:
one read-only SELECT, schema-qualified names, only the five approved views, no identifier columns,
and a LIMIT on account-level detail.

It is a guardrail, not a lock. It runs only inside Claude Code, only for the tools that
settings.json points at it, and it reads SQL with simple patterns that a determined query can get
past. Another client with the same login skips it. The lock is the database grants on
foldline_ready_reader (warehouse/sql/60_access.sql): a forbidden read fails with SQLSTATE 42501
whatever this file says. Two locks: refuse early, enforce anyway.

How Claude Code calls it
------------------------
settings.json registers it under hooks.PreToolUse with a matcher for the connector's tools.
Claude Code sends one JSON object on stdin, with "tool_name" and "tool_input". This script:
  exit 0  -> the tool call goes ahead
  exit 2  -> the call is blocked; the message on stderr is shown to Claude, so it can fix the query
Any other exit code (for example python3 missing, or a crash before main) does not block: Claude Code
lets the call run. So this script returns 2 on bad input and on its own errors, and you test it
with --self-test before you rely on it.
The SQL argument name depends on your MCP server ("sql" or "query" are common). Check it with
your server's tool list and adjust SQL_KEYS below.

Try it without Claude
---------------------
    python3 sql_guard.py --self-test
prints one line per example query and exits 0 when every verdict matches.

Python 3.8+, standard library only. No network, no database, no credentials.
"""

import json
import re
import sys

ALLOWED = {
    "analytics.mrr_summary_monthly",
    "analytics.logo_churn_by_segment_quarter",
    "analytics.expansion_mrr_by_country_monthly",
    "analytics.account_mrr_monthly",
    "analytics.data_status_by_view",
}
# Catalog views the reader may use to look up column names. They show only objects the login
# is allowed to see, so they reveal nothing the grants do not already allow.
ALLOWED_CATALOG = {"information_schema.columns", "information_schema.tables"}
DETAIL_VIEW = "analytics.account_mrr_monthly"
MAX_ROWS = 1000
SQL_KEYS = ("sql", "query", "statement")
FORBIDDEN_COLUMNS = ("account_name", "contact_email", "contact_name", "phone", "address")
FORBIDDEN_WORDS = (
    "insert", "update", "delete", "merge", "truncate", "create", "alter", "drop", "grant",
    "revoke", "copy", "call", "do", "set", "reset", "begin", "start", "commit", "rollback",
    "savepoint", "lock", "vacuum", "cluster", "reindex", "refresh", "listen", "notify",
    "prepare", "execute", "into", "security", "pg_read_file", "pg_read_binary_file", "pg_ls_dir",
    "pg_sleep", "dblink", "lo_import", "lo_export", "set_config",
)


def strip_sql(sql):
    """Remove comments and string literals, lower-case, and drop identifier quotes."""
    sql = re.sub(r"/\*.*?\*/", " ", sql, flags=re.S)
    sql = re.sub(r"--[^\n]*", " ", sql)
    sql = re.sub(r"\$([a-z_]*)\$.*?\$\1\$", " '' ", sql, flags=re.S | re.I)
    sql = re.sub(r"'(?:[^']|'')*'", " '' ", sql)
    sql = sql.replace('"', "")
    return re.sub(r"\s+", " ", sql).strip().lower()


def check(sql):
    """Return None when the SQL may run, else one sentence saying what to fix."""
    s = strip_sql(sql)
    if not s:
        return "Empty query."
    body = s.rstrip("; ")
    if ";" in body:
        return "One statement per call. Remove the extra statements."
    if not re.match(r"^(select|with)\b", body):
        return "Only a read-only SELECT (or WITH ... SELECT) is allowed."
    for word in FORBIDDEN_WORDS:
        if re.search(r"\b" + re.escape(word) + r"\b", body):
            return f"'{word.upper()}' is not allowed. Send one read-only SELECT on the approved views."
    for col in FORBIDDEN_COLUMNS:
        if re.search(r"\b" + col + r"\b", body):
            return ("Direct customer identifiers are outside the approved AI data surface. "
                    "Use approved pseudonymous analytics keys or an authorized operational workflow.")

    ctes = set(re.findall(r"(?:\bwith|,)\s*(?:recursive\s+)?([a-z_]\w*)\s+as\s*\(", body))
    # FROM inside EXTRACT(... FROM x), SUBSTRING(... FROM n) and similar is an argument, not a table.
    scan = re.sub(r"\b(extract|substring|trim|overlay|position)\s*\(([^()]*?)\bfrom\b", r"\1(\2 ", body)
    used = []
    for match in re.finditer(r"\b(?:from|join)\s+([a-z_][\w.]*(?:\s*,\s*[a-z_][\w.]*)*)(\s*\()?", scan):
        names, call = match.group(1), match.group(2)
        if call:
            return "Functions in FROM are not allowed. Read one of the five approved views."
        for name in re.split(r"\s*,\s*", names):
            used.append(name.strip())
    if not used:
        return "Name the approved view you read, for example analytics.mrr_summary_monthly."
    for name in used:
        if name in ctes:
            continue
        if "." not in name:
            return (f"'{name}' is not schema-qualified. Write analytics.<view>; the reader's "
                    "search_path is empty.")
        if name not in ALLOWED and name not in ALLOWED_CATALOG:
            return (f"'{name}' is not an approved view. Use one of: "
                    + ", ".join(sorted(ALLOWED)) + ".")

    if DETAIL_VIEW in used and "group by" not in body:
        limit = re.search(r"\blimit\s+(\d+)\b", body)
        if not limit or int(limit.group(1)) > MAX_ROWS:
            return f"Account-level detail needs LIMIT {MAX_ROWS} or less."
    return None


def main():
    try:
        event = json.load(sys.stdin)
    except ValueError:
        print("sql_guard: could not read the hook input; blocking to be safe.", file=sys.stderr)
        return 2
    if not isinstance(event, dict):
        print("sql_guard: unexpected hook input; blocking to be safe.", file=sys.stderr)
        return 2
    tool_input = event.get("tool_input") or {}
    if not isinstance(tool_input, dict):
        print("sql_guard: unexpected tool_input; blocking to be safe.", file=sys.stderr)
        return 2
    sql = next((tool_input[k] for k in SQL_KEYS if isinstance(tool_input.get(k), str)), None)
    if sql is None:
        return 0  # A tool without SQL (for example "list tables"). Nothing to check here.
    try:
        problem = check(sql)
    except Exception as exc:  # Fail closed: a guard that crashes must not let the query through.
        print(f"sql_guard: internal error ({exc.__class__.__name__}); blocking to be safe.", file=sys.stderr)
        return 2
    if problem:
        print(f"Blocked by sql_guard (course rule, not the database): {problem}", file=sys.stderr)
        return 2
    return 0


SELF_TEST = [
    ("SELECT month_start, ending_mrr_eur FROM analytics.mrr_summary_monthly "
     "WHERE month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01' ORDER BY month_start", True),
    ("SELECT * FROM mrr_summary_monthly", False),
    ("SELECT sum(amount) FROM public.monthly_revenue GROUP BY dt", False),
    ("SELECT contact_email FROM core.accounts", False),
    ("SELECT 1; DROP VIEW analytics.mrr_summary_monthly", False),
    ("SELECT account_key, ending_mrr_eur FROM analytics.account_mrr_monthly WHERE month_start = DATE '2026-06-01'", False),
    ("SELECT account_key, ending_mrr_eur FROM analytics.account_mrr_monthly "
     "WHERE month_start = DATE '2026-06-01' ORDER BY ending_mrr_eur DESC, account_key LIMIT 10", True),
    ("WITH q AS (SELECT * FROM analytics.mrr_summary_monthly) SELECT * FROM q", True),
    ("SELECT * INTO analytics.scratch FROM analytics.mrr_summary_monthly", False),
    ("SELECT * FROM generate_series(1, 10)", False),
    ("SELECT column_name FROM information_schema.columns WHERE table_schema = 'analytics'", True),
    ("-- harmless comment\nSELECT view_name, data_loaded_at_utc FROM analytics.data_status_by_view", True),
]


def self_test():
    ok = 0
    for sql, want in SELF_TEST:
        problem = check(sql)
        got = problem is None
        ok += got == want
        verdict = "allow" if got else "block"
        print(f"{'PASS' if got == want else 'FAIL'}  {verdict:5}  {sql[:70]!r}" + ("" if got else f"  -> {problem}"))
    print(f"SQL GUARD SELF-TEST {ok} of {len(SELF_TEST)} PASS. A guardrail test, not a database test.")
    return 0 if ok == len(SELF_TEST) else 1


if __name__ == "__main__":
    sys.exit(self_test() if "--self-test" in sys.argv[1:] else main())
