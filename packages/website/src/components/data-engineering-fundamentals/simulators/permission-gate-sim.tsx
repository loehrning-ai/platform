"use client";

import { useState, type CSSProperties } from "react";
import { Panel } from "../primitives";

// ─── PermissionGateSim (plan 011 stage 8) ────────────────────────────
// Ported from `src/chapters/Ch8_Govern.js`: drag actor annotations onto
// columns and ship a dbt spec — the Access Gateway blocks any deploy with
// an unannotated PII column.

interface ColumnDef {
  readonly id: string;
  readonly type: string;
  readonly pii: boolean;
  readonly required: ActorId | null;
  readonly note: string;
}

type ActorId = "canonicalEmployee" | "canonicalApp" | "canonicalCW" | "none";

const ACTOR_LABEL: Record<ActorId, string> = {
  canonicalEmployee: "PII_Person",
  canonicalApp: "Service_Identity",
  canonicalCW: "PII_Contractor",
  none: "none",
};

const COLUMNS: readonly ColumnDef[] = [
  { id: "user_id", type: "STRING", pii: false, required: null, note: "non-PII internal id" },
  { id: "employee_email", type: "STRING", pii: true, required: "canonicalEmployee", note: "identifies a human" },
  { id: "account_id", type: "STRING", pii: true, required: "canonicalEmployee", note: "device ↔ user linkage" },
  { id: "event_type", type: "INT", pii: false, required: null, note: "CVSS bucket, 0–4" },
  { id: "manager_unixname", type: "STRING", pii: true, required: "canonicalEmployee", note: "identifies a human" },
];

const CHIPS: readonly { id: ActorId; swatch: string }[] = [
  { id: "canonicalEmployee", swatch: "#7C5CFF" },
  { id: "canonicalApp", swatch: "#2D7DFF" },
  { id: "canonicalCW", swatch: "#22D3EE" },
  { id: "none", swatch: "#B9C0CA" },
];

type ShipState = "idle" | "deploying" | "blocked" | "shipped";

export function PermissionGateSim() {
  const [assignments, setAssignments] = useState<Partial<Record<string, ActorId>>>({});
  const [dragging, setDragging] = useState<ActorId | null>(null);
  const [zoneRequired, setZoneRequired] = useState(false);
  const [zone, setZone] = useState(false);
  const [shipState, setShipState] = useState<ShipState>("idle");
  const [consoleLines, setConsoleLines] = useState<readonly string[]>([]);
  const [confetti, setConfetti] = useState(0);

  const assignTo = (colId: string) => {
    if (!dragging) return;
    setAssignments((a) => ({ ...a, [colId]: dragging }));
    setDragging(null);
  };

  const clearCol = (colId: string) => {
    setAssignments((a) => {
      const n = { ...a };
      delete n[colId];
      return n;
    });
  };

  const chipLabel = (id: ActorId) => (id === "none" ? "none" : ACTOR_LABEL[id]);

  const ship = () => {
    setShipState("deploying");
    const push = (line: string) => setConsoleLines((l) => [...l, line]);
    setConsoleLines(["[access-gateway] starting deploy of dim_users.spec…"]);
    const violations: { col: string; needed: string }[] = [];
    for (const c of COLUMNS) {
      if (c.required) {
        const got = assignments[c.id];
        if (!got || got === "none" || got !== c.required) {
          violations.push({ col: c.id, needed: ACTOR_LABEL[c.required] });
        }
      }
    }
    let delay = 500;
    const schedule = (line: string, ms = 250) => {
      delay += ms;
      setTimeout(() => push(line), delay);
    };
    schedule("[access-gateway] reading column actor annotations…", 300);
    schedule(`[access-gateway] ${COLUMNS.length} columns · ${COLUMNS.filter((c) => c.required).length} require actor annotations`, 250);
    if (violations.length > 0) {
      violations.forEach((v) => {
        schedule(`[access-gateway] ✕ BLOCKED · column "${v.col}" missing required actor <${v.needed}>`, 200);
      });
      schedule("[access-gateway] deploy aborted. Patch dbt and re-ship.", 400);
      setTimeout(() => setShipState("blocked"), delay + 200);
    } else if (zoneRequired && !zone) {
      schedule('[access-gateway] ✕ BLOCKED · catalog flags dataset as PII-regional · data_classification "pii_secure" required', 250);
      schedule("[access-gateway] deploy aborted. Add <data_classification: pii_secure> to dbt header.", 400);
      setTimeout(() => setShipState("blocked"), delay + 200);
    } else {
      schedule("[access-gateway] ✓ actor annotations complete", 200);
      if (zone) schedule("[access-gateway] ✓ data_classification resolved · pii_secure", 150);
      schedule("[access-gateway] ✓ ACL <dataset_acl: corp_assets> bound", 150);
      schedule("[access-gateway] ✓ deployed to prod · v237 → v238", 250);
      setTimeout(() => {
        setShipState("shipped");
        setConfetti((c) => c + 1);
      }, delay + 200);
    }
  };

  const reset = () => {
    setAssignments({});
    setShipState("idle");
    setConsoleLines([]);
  };

  const autofix = () => {
    const next = { ...assignments };
    for (const c of COLUMNS) {
      if (c.required) next[c.id] = c.required;
    }
    setAssignments(next);
    setShipState("idle");
    setConsoleLines([]);
  };

  return (
    <Panel
      eyebrow="live simulator · deploy gate"
      title="Permission Gate"
      meta={shipState === "shipped" ? "✓ shipped" : shipState === "blocked" ? "✕ blocked" : shipState === "deploying" ? "deploying…" : "ready to ship"}
      caption="Access Gateway reads the DatasetSpec at deploy time. Every column that names a human must have an actor annotation. No annotation, no ship."
    >
      <div className="pg-layout">
        <div className="pg-chip-rail">
          <div className="pg-rail-lab">Drag an actor</div>
          {CHIPS.map((c) => (
            <div
              key={c.id}
              className={`pg-chip ${dragging === c.id ? "dragging" : ""}`}
              draggable
              onDragStart={() => setDragging(c.id)}
              onDragEnd={() => setDragging(null)}
              onClick={() => setDragging((d) => (d === c.id ? null : c.id))}
              style={{ "--sw": c.swatch } as CSSProperties}
            >
              <span className="dot" />
              <code>{chipLabel(c.id)}</code>
            </div>
          ))}
          <div className="pg-rail-hint">Click a chip, then click a column, or drag.</div>
          <label className="pg-zone-toggle">
            <input type="checkbox" checked={zoneRequired} onChange={(e) => setZoneRequired(e.target.checked)} />
            <span>
              Catalog requires Policy Zone <code>pii_secure</code>
            </span>
          </label>
          <label className="pg-zone-toggle" style={{ marginTop: 6 }}>
            <input type="checkbox" checked={zone} onChange={(e) => setZone(e.target.checked)} />
            <span>
              Add <code>data_classification: pii_secure</code> to dbt
            </span>
          </label>
        </div>

        <div className="pg-ide">
          <div className="pg-ide-head">
            <span className="dots">
              <i />
              <i />
              <i />
            </span>
            <span className="f">dim_users.spec.yaml</span>
            <span className="sp">· 5 columns</span>
          </div>
          <div className="pg-ide-body">
            <div className="pg-ide-ln">
              <span className="ln">1</span>
              <span>
                <span className="tok-k">dataset</span>: <span className="tok-s">dim_users</span>
              </span>
            </div>
            <div className="pg-ide-ln">
              <span className="ln">2</span>
              <span>
                <span className="tok-k">owner</span>: <span className="tok-s">analytics_oncall</span>
              </span>
            </div>
            <div className="pg-ide-ln">
              <span className="ln">3</span>
              <span>
                <span className="tok-k">dataset_acl</span>: <span className="tok-s">corp_assets</span>
              </span>
            </div>
            {zone && (
              <div className="pg-ide-ln">
                <span className="ln">4</span>
                <span>
                  <span className="tok-k">data_classification</span>: <span className="tok-s">pii_secure</span>
                </span>
              </div>
            )}
            <div className="pg-ide-ln">
              <span className="ln">{zone ? 5 : 4}</span>
              <span>
                <span className="tok-k">columns</span>:
              </span>
            </div>
            {COLUMNS.map((c, i) => {
              const assigned = assignments[c.id];
              const ok = !c.required || assigned === c.required;
              const bad = !!c.required && (!assigned || assigned === "none" || assigned !== c.required);
              return (
                <div
                  key={c.id}
                  className={`pg-col-row ${bad ? "bad" : ""} ${ok && c.required ? "ok" : ""} ${dragging ? "drop" : ""}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => assignTo(c.id)}
                  onClick={() => dragging && assignTo(c.id)}
                >
                  <span className="ln">{(zone ? 6 : 5) + i}</span>
                  <span className="pg-col-inner">
                    <span className="mk">-</span>
                    <span className="nm">{c.id}</span>
                    <span className="ty">: {c.type}</span>
                    {c.pii && <span className="pii">PII</span>}
                    <span className="actor">
                      {assigned ? (
                        <span
                          className="pill-actor"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearCol(c.id);
                          }}
                        >
                          actors: [<code>{chipLabel(assigned)}</code>]<i>×</i>
                        </span>
                      ) : c.required ? (
                        <span className="pill-need">
                          needs <code>{ACTOR_LABEL[c.required]}</code>
                        </span>
                      ) : (
                        <span className="pill-opt">actor optional</span>
                      )}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`pg-console ${shipState}`}>
        <div className="pg-console-head">
          <span>Access Gateway · deploy log</span>
          <span className={`pg-status ${shipState}`}>
            {shipState === "idle" && "ready"}
            {shipState === "deploying" && "● deploying"}
            {shipState === "blocked" && "✕ blocked"}
            {shipState === "shipped" && "✓ shipped"}
          </span>
        </div>
        <div className="pg-console-body">
          {consoleLines.length === 0 ? (
            <div className="empty">[access-gateway] waiting for ship…</div>
          ) : (
            consoleLines.map((l, i) => (
              <div key={i} className={`pg-c-ln ${l.includes("BLOCKED") || l.includes("aborted") ? "err" : l.includes("✓") ? "ok" : ""}`}>
                {l}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="ctl-row">
        <button className="btn btn-primary" onClick={ship} disabled={shipState === "deploying"}>
          {shipState === "deploying" ? "● Deploying…" : "🚢 Ship dbt"}
        </button>
        <button className="btn" onClick={autofix}>
          Autofix · assign PII actors
        </button>
        <button className="btn" onClick={reset}>
          Reset
        </button>
        {shipState === "shipped" && (
          <span style={{ color: "var(--theme-green)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
            ✓ confetti {confetti}× · dbt v238 is live
          </span>
        )}
        {shipState === "blocked" && (
          <span style={{ color: "var(--theme-red)", fontFamily: "var(--font-mono)", fontSize: 12 }}>✕ patch the dbt and re-ship</span>
        )}
      </div>
    </Panel>
  );
}

export default PermissionGateSim;
