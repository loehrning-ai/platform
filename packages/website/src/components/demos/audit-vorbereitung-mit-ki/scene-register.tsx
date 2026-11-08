"use client";

import type { CSSProperties } from "react";
import type { Model } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";
import type { RegisterDay, RegisterListEntry } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/register";
import type { Fmt } from "./fmt";

type Count = "rows" | "expired" | "expiring" | "missing";
const COUNTS: readonly Count[] = ["rows", "expired", "expiring", "missing"];
const LISTS = ["expired", "expiring", "missing"] as const;

/** The value of one count on a day: the length of its list, or the number of rows. */
const valueOf = (day: RegisterDay, count: Count): number => (count === "rows" ? day.rows : day[count].length);

/** The count that is running up: a whole number between 0 and the value while the opening run is on. */
const shown = (value: number, progress: number): number => (progress >= 1 ? value : Math.min(value, Math.floor(value * progress)));

/** "E-02 Medical exam": the id and the readable name of the paper; never a person name. */
function entryText(fmt: Fmt, entry: RegisterListEntry): string {
  return `${entry.id} ${fmt.copy.register.paper[entry.paper]}`;
}

/**
 * Scene 5: the register on one of three dates. The counts run up once when the beat opens (progress goes
 * from 0 to 1) and then follow the picked date at once. Every number comes from the model, which takes it
 * from the oracle; the lists show ids and the name of the paper only.
 */
export function RegisterStage({ fmt, model, pick, progress }: { readonly fmt: Fmt; readonly model: Model; readonly pick: number; readonly progress: number }) {
  const { copy } = fmt;
  const day = model.register[pick] ?? (model.register[model.register.length - 1] as RegisterDay);
  const done = progress >= 1;
  const now = Object.fromEntries(COUNTS.map((count) => [count, shown(valueOf(day, count), progress)])) as Record<Count, number>;
  return (
    <div className="w05-register" data-w05-register={day.date} data-w05-register-state={done ? "done" : "counting"}>
      <p className="w05-lead">{copy.register.heading}</p>
      <p className="w05-hint">{fmt.t(copy.register.hint, { days: model.expiringDays })}</p>
      <p className="w05-label">{fmt.t(copy.register.asOf, { date: fmt.date(day.date) })}</p>
      <dl className="w05-counts w05-reg-counts">
        {COUNTS.map((count) => (
          <div key={count} className="w05-count" data-w05-register-count={count} data-value={valueOf(day, count)} data-zero={valueOf(day, count) === 0 ? "" : undefined}>
            <dt>{copy.register.counts[count]}</dt>
            <dd>{now[count]}</dd>
          </div>
        ))}
      </dl>
      <p className="w05-hint" data-w05-register-result="">
        {fmt.t(copy.register.result, { rows: now.rows, expired: now.expired, expiring: now.expiring, missing: now.missing })}
      </p>
      {/* Keyed by the picked date, so the three lists build up again each time. */}
      <div className="w05-reg-lists" key={day.date}>
        {LISTS.map((list, index) => (
          <section key={list} className="w05-reg-list" data-w05-register-list={list} style={{ "--k": index } as CSSProperties}>
            <h3 className="w05-label">{copy.register.lists[list]}</h3>
            {day[list].length === 0 ? (
              <p className="w05-hint">{copy.register.none}</p>
            ) : (
              <ul className="w05-reg-entries">
                {day[list].map((entry) => (
                  <li key={`${entry.id}-${entry.paper}`} className="w05-reg-entry">
                    {entryText(fmt, entry)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
      <p className="w05-hint" data-w05-register-note="">
        {copy.register.note}
      </p>
    </div>
  );
}
