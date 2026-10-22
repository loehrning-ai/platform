import { Fragment } from "react";

interface Props {
  readonly items: readonly string[];
}

/**
 * "A 3 % · B 5 % · C 9 %": each item stays on one line, and a no-break space
 * holds the dot to the item before it, so a line can only break after a dot.
 */
export function InlineList({ items }: Props) {
  return (
    <>
      {items.map((item, i) => (
        <Fragment key={item}>
          {i > 0 ? "\u00A0· " : null}
          <span className="fr-nowrap">{item}</span>
        </Fragment>
      ))}
    </>
  );
}
