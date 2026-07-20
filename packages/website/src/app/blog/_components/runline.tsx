"use client";

import { Fragment } from "react";

export function Runline({ items }: { items: string[] }) {
  const seq = [...items, ...items];

  return (
    <div className="runline" aria-hidden="true">
      <div className="runline__track">
        {seq.map((t, i) => (
          <Fragment key={`${t}-${i}`}>
            <span>
              <span className="dot">●</span> {t}
            </span>
            {i < seq.length - 1 ? <span style={{ color: "var(--leinen)" }}>/</span> : null}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
