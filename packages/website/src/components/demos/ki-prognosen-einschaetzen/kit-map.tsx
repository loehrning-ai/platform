"use client";

/**
 * The last beat's stage: the kit's file tree, each file next to the beat it
 * was on screen. The zip, the skill and the rule follow in the take-home
 * block under the demo.
 */
export function KitMap({
  root,
  label,
  tree,
}: {
  readonly root: string;
  readonly label: string;
  readonly tree: readonly { readonly file: string; readonly beat: string }[];
}) {
  return (
    <div className="fl-kit">
      <p className="fl-kit-root">{root}/</p>
      <ul className="fl-kit-list" aria-label={label}>
        {tree.map((entry) => (
          <li key={entry.file} className="fl-kit-row">
            <span className="fl-kit-file">{entry.file}</span>
            <span className="fl-kit-beat">{entry.beat}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
