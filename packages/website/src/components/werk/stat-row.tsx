import type { ReactNode } from "react";
import { cx } from "./cx";

export type Stat = {
  readonly label: ReactNode;
  readonly value: ReactNode;
  readonly note?: ReactNode;
};

export type StatRowProps = {
  /** Two to four stats. Every value must come from data, never invented. */
  readonly stats: readonly Stat[];
  readonly className?: string;
};

/**
 * Evidence row: label, large tabular value, optional caption. No boxes and
 * no icons; stats are separated by hairlines from sm up. Inside .dark-section
 * the hairline token switches to the dark hairline automatically.
 */
export function StatRow({ stats, className }: StatRowProps) {
  return (
    <dl
      className={cx(
        "grid grid-cols-2 gap-y-6",
        stats.length >= 4 ? "sm:grid-cols-4" : stats.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
        className,
      )}
    >
      {stats.map((stat, index) => (
        <div
          key={index}
          className="flex flex-col pr-6 sm:border-l sm:border-hairline sm:pl-6 sm:first:border-l-0 sm:first:pl-0"
        >
          <dt className="text-label text-muted-foreground">{stat.label}</dt>
          <dd className="mt-1 text-num-lg font-bold text-foreground tabular-nums">
            {stat.value}
          </dd>
          {stat.note ? (
            <dd className="mt-1 text-caption text-muted tabular-nums">{stat.note}</dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
