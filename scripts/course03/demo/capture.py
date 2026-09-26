#!/usr/bin/env python3
"""Capture real PostgreSQL output for the course 03 database demo page.

Builds nothing itself. Run the kit first (warehouse/sql/00_build_all.sql) with
  -v bad_db=<export db> -v ready_db=<approved db>
then run this script with the same names:
  python3 capture.py --bad-db saas_bad --ready-db saas_ready --build-log build.log
Connection settings come from the usual PGHOST / PGPORT / PGUSER variables.
It writes demo-data.json next to this file, embeds the same JSON into demo.html and
refreshes the static values in the page (sync-values.mjs). Pass --date to keep a capture date.
All data is synthetic (FOLDLINE is a made-up company).
"""
import argparse
import datetime
import json
import os
import re
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
LIB = os.path.join(REPO, "packages", "website", "public", "workshops", "datenbereitschaft-fuer-ki", "lib")
KIT = os.path.join(REPO, "scripts", "course03", "builder", "kit", "builder")

LANES = {
    "bad": {"role": "foldline_bad_reader", "search_path": "public"},
    "ready": {"role": "foldline_ready_reader", "search_path": "analytics"},
}


def psql(db, sql):
    """Run SQL as the connecting user; return (stdout, stderr, code)."""
    p = subprocess.run(
        ["psql", "-X", "-q", "-At", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=verbose", "-d", db],
        input="\\set VERBOSITY verbose\n" + sql, capture_output=True, text=True,
    )
    return p.stdout, p.stderr, p.returncode


def as_reader(lane, db, sql):
    cfg = LANES[lane]
    prefix = "SET ROLE %s;\nSET search_path = %s;\n" % (cfg["role"], cfg["search_path"])
    return psql(db, prefix + sql)


def rows_json(lane, db, sql):
    body = sql.strip().rstrip(";")
    wrapped = "SELECT coalesce(json_agg(t), '[]'::json) FROM (\n%s\n) AS t;\n" % body
    out, err, code = as_reader(lane, db, wrapped)
    if code != 0:
        m = re.search(r"ERROR:\s+([0-9A-Z]{5}):\s+(.*)", err)
        return {"error": {"sqlstate": m.group(1) if m else None, "message": m.group(2).strip() if m else err.strip()}}
    rows = json.loads(out.strip())
    cols = list(rows[0].keys()) if rows else []
    return {"columns": cols, "rows": [[r[c] for c in cols] for r in rows]}


def load_captures():
    js = os.path.join(LIB, "model-capture-data.js")
    code = (
        "const fs=require('fs');const vm=require('vm');const w={};"
        "vm.runInNewContext(fs.readFileSync(%r,'utf8'),{window:w,Object});"
        "process.stdout.write(JSON.stringify(w.FOLDLINE_MODEL_CAPTURES));" % js
    )
    return json.loads(subprocess.run(["node", "-e", code], capture_output=True, text=True, check=True).stdout)


def load_replay():
    js = os.path.join(LIB, "replay-data.js")
    code = (
        "const fs=require('fs');const vm=require('vm');const w={};"
        "vm.runInNewContext(fs.readFileSync(%r,'utf8'),{window:w,Object});"
        "process.stdout.write(JSON.stringify(w.FOLDLINE_REPLAY));" % js
    )
    return json.loads(subprocess.run(["node", "-e", code], capture_output=True, text=True, check=True).stdout)


# The deck's labels for the three requests the course rules answer before any query (scene honest-no).
RULE_QUESTIONS = {"C01": "How much MRR?", "R01": "Profit by plan?", "R02": "Customer emails and lifetime value"}


def course_rules():
    responses = load_replay()["responses"]
    rules = []
    for rid, question in RULE_QUESTIONS.items():
        ev = responses["ready:" + rid]["evidence"]
        rules.append({"id": rid, "question": question, "behavior": ev["behavior"], "message": ev["message"]})
    return rules


def find_sql_cases(obj, acc):
    if isinstance(obj, dict):
        if "caseId" in obj and "lane" in obj and isinstance(obj.get("sql"), str) and obj.get("question"):
            acc.setdefault((obj["caseId"], obj["lane"]), obj)
        for v in obj.values():
            find_sql_cases(v, acc)
    elif isinstance(obj, list):
        for v in obj:
            find_sql_cases(v, acc)
    return acc


def relations(lane, db):
    role = LANES[lane]["role"]
    listing = (
        "SELECT coalesce(json_agg(t ORDER BY t.schema, t.name), '[]'::json) FROM ("
        " SELECT n.nspname AS schema, c.relname AS name,"
        " CASE c.relkind WHEN 'v' THEN 'view' ELSE 'table' END AS kind,"
        " obj_description(c.oid, 'pg_class') AS comment"
        " FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace"
        " WHERE c.relkind IN ('r','v','m') AND n.nspname NOT IN ('pg_catalog','information_schema')"
        " AND has_table_privilege('%s', c.oid, 'SELECT')) AS t;" % role
    )
    out, err, code = psql(db, listing)
    assert code == 0, err
    rels = json.loads(out.strip())
    for r in rels:
        q = '"%s"."%s"' % (r["schema"], r["name"])
        colsql = (
            "SELECT json_agg(json_build_object('name', a.attname, 'type', format_type(a.atttypid, a.atttypmod)) ORDER BY a.attnum)"
            " FROM pg_attribute a WHERE a.attrelid = '%s'::regclass AND a.attnum > 0 AND NOT a.attisdropped;" % q
        )
        out, err, code = psql(db, colsql)
        assert code == 0, err
        r["columns"] = json.loads(out.strip())
        out, err, code = as_reader(lane, db, "SELECT count(*) FROM %s;" % q)
        assert code == 0, err
        r["rowCount"] = int(out.strip().splitlines()[-1])
        sample = rows_json(lane, db, "SELECT * FROM %s ORDER BY 1 DESC, 2 LIMIT 8" % q)
        assert "error" not in sample, sample
        r["rows"] = sample["rows"]
        if r["kind"] == "view":
            out, err, code = psql(db, "SELECT pg_get_viewdef('%s'::regclass, true);" % q)
            r["definition"] = out.strip()
    return rels


def check_lines(build_log):
    lines = {}
    if not build_log or not os.path.exists(build_log):
        return lines
    for line in open(build_log, encoding="utf-8"):
        parts = [p.strip() for p in line.split("|")]
        if len(parts) == 5 and re.match(r"^[A-Z]+-?[A-Z]?\d\d$", parts[0]) and parts[4] in ("PASS", "FAIL", "SKIP"):
            lines[parts[0]] = {"kind": parts[1], "expected": parts[2], "actual": parts[3], "result": parts[4]}
        m = re.match(r"^(DB CHECKS .*)$", line.strip())
        if m:
            lines["_summary"] = m.group(1)
    return lines


def metric_text(name):
    text = open(os.path.join(KIT, "semantic/metric.yml"), encoding="utf-8").read()
    m = re.search(r"\n  - name: %s\b.*?(?=\n  - name: |\Z)" % re.escape(name), text, re.S)
    if not m:
        return None
    block = m.group(0).strip("\n")
    out = []
    for line in block.splitlines():
        out.append(re.sub(r"\s+#.*$", "", line) if not line.strip().startswith("#") else None)
    return "\n".join(l for l in out if l is not None and l.strip())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--bad-db", default="saas_bad")
    ap.add_argument("--ready-db", default="saas_ready")
    ap.add_argument("--build-log")
    ap.add_argument("--date", default=datetime.date.today().isoformat())
    a = ap.parse_args()
    dbs = {"bad": a.bad_db, "ready": a.ready_db}

    ver, _, _ = psql(a.ready_db, "SHOW server_version;")
    recorded_raw = load_captures()
    caps = find_sql_cases(recorded_raw, {})
    cases = []
    for cid in ("G01", "G02", "G03"):
        entry = {"id": cid}
        for lane in ("bad", "ready"):
            c = caps.get((cid, lane))
            if not c:
                continue
            entry["question"] = c["question"]
            res = rows_json(lane, dbs[lane], c["sql"])
            entry[lane] = {"sql": c["sql"], **res}
        cases.append(entry)

    forbidden_sql = "SELECT account_name, contact_email FROM core.accounts LIMIT 1"
    forbidden = {"sql": forbidden_sql, **rows_json("ready", dbs["ready"], forbidden_sql)}

    data = {
        "capturedOn": a.date,
        "postgres": ver.strip(),
        "company": "FOLDLINE (synthetic)",
        "clockUtc": "2026-07-01T09:00:00Z",
        "lanes": {
            lane: {"role": LANES[lane]["role"], "searchPath": LANES[lane]["search_path"], "relations": relations(lane, dbs[lane])}
            for lane in ("bad", "ready")
        },
        "cases": cases,
        "forbidden": forbidden,
        "checks": check_lines(a.build_log),
        "definitions": {n: metric_text(n) for n in ("ending_mrr", "net_new_mrr", "logo_churn_rate")},
        "recorded": {"capturedAtUtc": recorded_raw["capturedAtUtc"], "summary": recorded_raw["summary"]},
        "rules": course_rules(),
    }
    blob = json.dumps(data, ensure_ascii=False, indent=1)
    with open(os.path.join(HERE, "demo-data.json"), "w", encoding="utf-8") as f:
        f.write(blob + "\n")
    page = os.path.join(HERE, "demo.html")
    if os.path.exists(page):
        html = open(page, encoding="utf-8").read()
        safe = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
        html = re.sub(
            r'(<script type="application/json" id="demo-data">).*?(</script>)',
            lambda m: m.group(1) + safe + m.group(2), html, count=1, flags=re.S,
        )
        with open(page, "w", encoding="utf-8") as f:
            f.write(html)
        # The page also shows the values as static text (final state without JavaScript); refresh them.
        subprocess.run(["node", os.path.join(HERE, "sync-values.mjs")], check=True)
    print("captured", len(cases), "cases;", sum(len(v["relations"]) for v in data["lanes"].values()), "relations")


if __name__ == "__main__":
    main()
