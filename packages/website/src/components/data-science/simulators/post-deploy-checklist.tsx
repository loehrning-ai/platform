"use client";

import { useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";

interface ChecklistItem {
  readonly id: string;
  readonly label: string;
  readonly desc: string;
}

const CHECKLIST_ITEMS: readonly ChecklistItem[] = [
  { id: "model_card", label: "Model card written", desc: "Document intended use, limitations, training data, and known failure modes." },
  { id: "fairness", label: "Fairness audit done", desc: "Check fraud flag rates across demographic segments. Disparate impact threshold: 0.8 ratio." },
  { id: "drift", label: "Feature drift monitoring set up", desc: "PSI or KS test on V1-V28 distributions weekly. Alert at PSI > 0.2." },
  { id: "champion", label: "Champion/challenger pipeline", desc: "New model trained in shadow; replaces champion only if PR-AUC lifts by ≥ 0.5pp." },
  { id: "rollback", label: "Rollback plan documented", desc: "One-command revert to prior model version. Test it in staging before going live." },
  { id: "sla", label: "SLA defined", desc: "Scoring latency p99 < 50ms. Batch inference: 100k txns in < 2 minutes." },
  { id: "alerts", label: "Alert thresholds set", desc: "PagerDuty alert if: PR-AUC drops < 0.85, daily fraud flag rate changes > 30%, or scoring errors > 0.1%." },
  { id: "shadow", label: "Shadow mode first (2 weeks)", desc: "Log predictions without acting on them. Verify distribution matches expectations before live routing." },
];

export function PostDeployChecklist() {
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pct = Math.round((checked.size / CHECKLIST_ITEMS.length) * 100);
  const barColor = pct === 100 ? "var(--mint-ink)" : pct >= 50 ? "var(--lime-ink)" : "var(--coral-ink)";

  return (
    <Panel
      eyebrow="SIMULATOR"
      title="Production readiness checklist"
      meta={`${checked.size} / ${CHECKLIST_ITEMS.length} complete`}
      caption="No model should go live without clearing every item. Each checkbox is a class of production failure you're explicitly ruling out."
    >
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>Readiness</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: barColor, fontWeight: 700 }}>
            {pct}%{pct === 100 ? ", ship it." : ""}
          </span>
        </div>
        <div style={{ height: 6, background: "var(--bg-hi)", borderRadius: 3 }}>
          <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: barColor, transition: "width 0.4s ease, background 0.3s ease" }} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {CHECKLIST_ITEMS.map((item) => {
          const done = checked.has(item.id);
          const open = expanded === item.id;
          return (
            <div
              key={item.id}
              style={{
                borderRadius: 8,
                border: done ? "1px solid rgba(100,226,181,0.35)" : "1px solid var(--hair)",
                background: done ? "rgba(100,226,181,0.07)" : "var(--bg-hi)",
                overflow: "hidden",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", cursor: "pointer" }}
                onClick={() => setExpanded(open ? null : item.id)}
              >
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => toggle(item.id)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--mint)" }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: 13.5,
                    color: done ? "var(--mint-ink)" : "var(--ink-1)",
                    textDecoration: done ? "line-through" : "none",
                    transition: "color 0.2s",
                  }}
                >
                  {item.label}
                </span>
                <span style={{ color: "var(--ink-4)", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
              </div>
              {open && <div style={{ padding: "0 14px 12px 42px", fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.6 }}>{item.desc}</div>}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export default PostDeployChecklist;
