"use client";

import { useState, type CSSProperties } from "react";
import { Panel } from "../primitives";
import { useDataEngineeringFundamentalsLocale } from "../locale-context";

// ─── PermissionGateSim ────────────────────────────
// Ported from `src/chapters/Ch8_Govern.js`: drag actor annotations onto
// columns and evaluate a DatasetSpec — the reference Access Gateway blocks
// metadata that violates its configured actor rules.

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

export const COLUMNS: readonly ColumnDef[] = [
  { id: "user_id", type: "STRING", pii: false, required: null, note: "non-PII internal id" },
  { id: "employee_email", type: "STRING", pii: true, required: "canonicalEmployee", note: "identifies a human" },
  { id: "account_id", type: "STRING", pii: true, required: "canonicalEmployee", note: "device ↔ user linkage" },
  { id: "event_type", type: "INT", pii: false, required: null, note: "CVSS bucket, 0–4" },
  { id: "manager_unixname", type: "STRING", pii: true, required: "canonicalEmployee", note: "identifies a human" },
];

export const COLUMNS_DE: readonly ColumnDef[] = [
  { ...COLUMNS[0], note: "interne ID ohne Personenbezug" },
  { ...COLUMNS[1], note: "identifiziert eine Person" },
  { ...COLUMNS[2], note: "Verknüpfung zwischen Gerät und Person" },
  { ...COLUMNS[3], note: "CVSS-Kategorie, 0–4" },
  { ...COLUMNS[4], note: "identifiziert eine Person" },
];

const CHIPS: readonly { id: ActorId; swatch: string }[] = [
  { id: "canonicalEmployee", swatch: "#7C5CFF" },
  { id: "canonicalApp", swatch: "#2D7DFF" },
  { id: "canonicalCW", swatch: "#22D3EE" },
  { id: "none", swatch: "#B9C0CA" },
];

type ShipState = "idle" | "deploying" | "blocked" | "shipped";

export function PermissionGateSim() {
  const { locale, text } = useDataEngineeringFundamentalsLocale();
  const columns = locale === "de" ? COLUMNS_DE : COLUMNS;
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

  const chipLabel = (id: ActorId) => (id === "none" ? text("none", "keine") : ACTOR_LABEL[id]);

  const ship = () => {
    setShipState("deploying");
    const push = (line: string) => setConsoleLines((l) => [...l, line]);
    setConsoleLines([text("[access-gateway] starting deploy of dim_users.spec…", "[access-gateway] Deployment von dim_users.spec wird gestartet …")]);
    const violations: { col: string; needed: string }[] = [];
    for (const c of columns) {
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
    schedule(text("[access-gateway] reading column actor annotations…", "[access-gateway] Akteur-Annotationen der Spalten werden gelesen …"), 300);
    schedule(
      text(
        `[access-gateway] ${columns.length} columns · ${columns.filter((c) => c.required).length} require actor annotations`,
        `[access-gateway] ${columns.length} Spalten · ${columns.filter((c) => c.required).length} benötigen Akteur-Annotationen`,
      ),
      250,
    );
    if (violations.length > 0) {
      violations.forEach((v) => {
        schedule(text(`[access-gateway] ✕ BLOCKED · column "${v.col}" missing required actor <${v.needed}>`, `[access-gateway] ✕ BLOCKIERT · Spalte "${v.col}" ohne erforderlichen Akteur <${v.needed}>`), 200);
      });
      schedule(text("[access-gateway] evaluation blocked. Patch DatasetSpec and run again.", "[access-gateway] Prüfung blockiert. DatasetSpec korrigieren und erneut ausführen."), 400);
      setTimeout(() => setShipState("blocked"), delay + 200);
    } else if (zoneRequired && !zone) {
      schedule(text('[access-gateway] ✕ BLOCKED · catalog flags dataset as PII-regional · data_classification "pii_secure" required', '[access-gateway] ✕ BLOCKIERT · Katalog kennzeichnet Datensatz als regional gebundene PII · data_classification "pii_secure" erforderlich'), 250);
      schedule(text("[access-gateway] evaluation blocked. Add <data_classification: pii_secure> to DatasetSpec.", "[access-gateway] Prüfung blockiert. <data_classification: pii_secure> zur DatasetSpec hinzufügen."), 400);
      setTimeout(() => setShipState("blocked"), delay + 200);
    } else {
      schedule(text("[access-gateway] ✓ actor annotations complete", "[access-gateway] ✓ Akteur-Annotationen vollständig"), 200);
      if (zone) schedule(text("[access-gateway] ✓ data_classification resolved · pii_secure", "[access-gateway] ✓ data_classification aufgelöst · pii_secure"), 150);
      schedule(text("[access-gateway] ✓ ACL <dataset_acl: corp_assets> bound", "[access-gateway] ✓ ACL <dataset_acl: corp_assets> gebunden"), 150);
      schedule(text("[access-gateway] ✓ reference policy evaluation accepted · v237 → v238", "[access-gateway] ✓ Referenzregelprüfung akzeptiert · v237 → v238"), 250);
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
    for (const c of columns) {
      if (c.required) next[c.id] = c.required;
    }
    setAssignments(next);
    setShipState("idle");
    setConsoleLines([]);
  };

  return (
    <Panel
      eyebrow={text("live simulator · deploy gate", "Live-Simulator · Deployment-Schranke")}
      title={text("Permission Gate", "Berechtigungsschranke")}
      meta={shipState === "shipped" ? text("✓ shipped", "✓ ausgeliefert") : shipState === "blocked" ? text("✕ blocked", "✕ blockiert") : shipState === "deploying" ? text("deploying…", "Deployment läuft …") : text("ready to ship", "bereit zur Auslieferung")}
      caption={text("Course reference gate. It checks declared actor, classification, and ACL metadata; passing does not establish privacy or legal compliance.", "Referenzschranke des Kurses. Sie prüft deklarierte Akteur-, Klassifikations- und ACL-Metadaten; eine bestandene Prüfung belegt keine Datenschutz- oder Rechtskonformität.")}
    >
      <div className="pg-layout">
        <div className="pg-chip-rail">
          <div className="pg-rail-lab">{text("Drag an actor", "Akteur zuweisen")}</div>
          {CHIPS.map((c) => (
            <button
              type="button"
              key={c.id}
              className={`pg-chip ${dragging === c.id ? "dragging" : ""}`}
              draggable
              onDragStart={() => setDragging(c.id)}
              onDragEnd={() => setDragging(null)}
              onClick={() => setDragging((d) => (d === c.id ? null : c.id))}
              aria-pressed={dragging === c.id}
              style={{ "--sw": c.swatch } as CSSProperties}
            >
              <span className="dot" />
              <code>{chipLabel(c.id)}</code>
            </button>
          ))}
          <div className="pg-rail-hint">
            {text("Select a chip, then use a column's assign button, or drag.", "Chip auswählen und über die Zuweisen-Schaltfläche oder per Drag-and-drop einer Spalte zuordnen.")}
          </div>
          <label className="pg-zone-toggle">
            <input type="checkbox" checked={zoneRequired} onChange={(e) => setZoneRequired(e.target.checked)} />
            <span>
              {text("Catalog requires Policy Zone", "Katalog verlangt die Richtlinienzone")} <code>pii_secure</code>
            </span>
          </label>
          <label className="pg-zone-toggle" style={{ marginTop: 6 }}>
            <input type="checkbox" checked={zone} onChange={(e) => setZone(e.target.checked)} />
            <span>
              {text("Add", "Hinzufügen:")} <code>data_classification: pii_secure</code> {text("to DatasetSpec", "zur DatasetSpec")}
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
            <span className="sp">· 5 {text("columns", "Spalten")}</span>
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
            {columns.map((c, i) => {
              const assigned = assignments[c.id];
              const ok = !c.required || assigned === c.required;
              const bad = !!c.required && (!assigned || assigned === "none" || assigned !== c.required);
              return (
                <div
                  key={c.id}
                  className={`pg-col-row ${bad ? "bad" : ""} ${ok && c.required ? "ok" : ""} ${dragging ? "drop" : ""}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => assignTo(c.id)}
                >
                  <span className="ln">{(zone ? 6 : 5) + i}</span>
                  <span className="pg-col-inner">
                    <span className="mk">-</span>
                    <span className="nm">{c.id}</span>
                    <span className="ty">: {c.type}</span>
                    {c.pii && <span className="pii">PII</span>}
                    <span className="actor">
                      {assigned ? (
                        <button
                          type="button"
                          className="pill-actor"
                          onClick={() => clearCol(c.id)}
                          aria-label={`${text("Remove", "Entferne")} ${chipLabel(assigned)} ${text("from", "von")} ${c.id}`}
                        >
                          actors: [<code>{chipLabel(assigned)}</code>]<i>×</i>
                        </button>
                      ) : dragging ? (
                        <button
                          type="button"
                          className="pill-assign"
                          onClick={() => assignTo(c.id)}
                          aria-label={`${text("Assign", "Weise")} ${chipLabel(dragging)} ${text("to", "zu")} ${c.id}`}
                        >
                          {text("Assign", "Zuweisen")} <code>{chipLabel(dragging)}</code>
                        </button>
                      ) : c.required ? (
                        <span className="pill-need">
                          {text("needs", "benötigt")} <code>{ACTOR_LABEL[c.required]}</code>
                        </span>
                      ) : (
                        <span className="pill-opt">{text("actor optional", "Akteur optional")}</span>
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
          <span>Access Gateway · {text("deploy log", "Deployment-Protokoll")}</span>
          <span className={`pg-status ${shipState}`}>
            {shipState === "idle" && text("ready", "bereit")}
            {shipState === "deploying" && text("● deploying", "● Deployment läuft")}
            {shipState === "blocked" && text("✕ blocked", "✕ blockiert")}
            {shipState === "shipped" && text("✓ shipped", "✓ ausgeliefert")}
          </span>
        </div>
        <div className="pg-console-body">
          {consoleLines.length === 0 ? (
            <div className="empty">{text("[access-gateway] waiting for ship…", "[access-gateway] wartet auf Auslieferung …")}</div>
          ) : (
            consoleLines.map((l, i) => (
              <div key={i} className={`pg-c-ln ${l.includes("BLOCKED") || l.includes("aborted") || l.includes("BLOCKIERT") || l.includes("abgebrochen") ? "err" : l.includes("✓") ? "ok" : ""}`}>
                {l}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="ctl-row">
        <button type="button" className="btn btn-primary" onClick={ship} disabled={shipState === "deploying"}>
          {shipState === "deploying" ? text("● Evaluating…", "● Prüfung läuft …") : text("Evaluate DatasetSpec", "DatasetSpec prüfen")}
        </button>
        <button type="button" className="btn" onClick={autofix}>
          {text("Autofix · assign PII actors", "Automatisch korrigieren · PII-Akteure zuweisen")}
        </button>
        <button type="button" className="btn" onClick={reset}>
          {text("Reset", "Zurücksetzen")}
        </button>
        {shipState === "shipped" && (
          <span style={{ color: "var(--theme-green)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
            ✓ {text("reference evaluation", "Referenzprüfung")} {confetti} · DatasetSpec v238 {text("accepted", "akzeptiert")}
          </span>
        )}
        {shipState === "blocked" && (
          <span style={{ color: "var(--theme-red)", fontFamily: "var(--font-mono)", fontSize: 12 }}>✕ {text("patch the DatasetSpec and evaluate again", "DatasetSpec korrigieren und erneut prüfen")}</span>
        )}
      </div>
    </Panel>
  );
}

export default PermissionGateSim;
