import type { ReactNode } from "react";
import { CheckGlyph } from "./glyphs";

interface ChipProps {
  readonly type: "radio" | "checkbox";
  readonly name: string;
  readonly value: string;
  readonly checked: boolean;
  readonly onChange: () => void;
  readonly label: ReactNode;
  readonly tag?: ReactNode;
  readonly gloss?: ReactNode;
}

/**
 * One option: a native radio or checkbox inside a 44px label, so arrow keys,
 * Space and Enter work without custom code. Chosen: Terrakotta tief fill and
 * Bogen text. The mark tells pick one from tick several before anything is
 * chosen: a radio is a diamond that fills, a checkbox a square that gets a
 * check. Hover and focus bring in an offset block in the anti colour (demo.css).
 */
export function Chip({ type, name, value, checked, onChange, label, tag, gloss }: ChipProps) {
  return (
    <label className="dr3-chip" data-type={type}>
      <input
        className="dr3-chip-input"
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
      />
      <span className="dr3-chip-face">
        <span className="dr3-chip-mark" aria-hidden="true">
          {type === "checkbox" ? <CheckGlyph /> : <span className="dr3-chip-dot" />}
        </span>
        <span className="dr3-chip-text">
          <span className="dr3-chip-label">{label}</span>
          {tag ? <span className="dr3-chip-tag">{tag}</span> : null}
          {gloss ? <span className="dr3-chip-gloss">{gloss}</span> : null}
        </span>
      </span>
    </label>
  );
}
