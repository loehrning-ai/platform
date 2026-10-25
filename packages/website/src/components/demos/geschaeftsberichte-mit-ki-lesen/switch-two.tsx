import { useRef, type KeyboardEvent } from "react";

interface Props {
  readonly label: string;
  readonly options: readonly [string, string];
  readonly value: 0 | 1;
  readonly onChange: (value: 0 | 1) => void;
  readonly id: string;
}

/** Two-state switch: a radiogroup of two 48 px buttons with arrow keys and a roving tab stop. */
export function SwitchTwo({ label, options, value, onChange, id }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (event: KeyboardEvent, to: 0 | 1) => {
    event.preventDefault();
    onChange(to);
    refs.current[to]?.focus();
  };
  const key = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") move(event, 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") move(event, 0);
    else if (event.key === "Home") move(event, 0);
    else if (event.key === "End") move(event, 1);
  };
  return (
    <div role="radiogroup" aria-label={label} className="mg-switch" id={id} onKeyDown={key}>
      {options.map((text, index) => (
        <button
          key={text}
          ref={(node) => {
            refs.current[index] = node;
          }}
          type="button"
          role="radio"
          aria-checked={value === index}
          tabIndex={value === index ? 0 : -1}
          onClick={() => onChange(index as 0 | 1)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
