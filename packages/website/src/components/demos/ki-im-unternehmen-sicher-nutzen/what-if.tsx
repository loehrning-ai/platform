"use client";

import { useRef, type KeyboardEvent } from "react";
import {
  fixParts,
  goalOf,
  stateLight,
  type LocalScene,
} from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/core";
import type { W05Text } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/pack";
import type { DialState } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/types";
import { LightLabel } from "./glyphs";

/** Placeholder tokens like "[E-MAIL]" never break inside, not even at a hyphen. */
function NoBreakTokens({ text }: { readonly text: string }) {
  const parts = text.split(/(\[[^\]]+\])/);
  // One inline wrapper: the option is a flex box, and loose children would
  // each become a flex item, losing the spaces and the line wrap between them.
  return (
    <span className="min-w-0">
      {parts.map((part, i) =>
        part.startsWith("[") ? (
          <span key={i} className="whitespace-nowrap" data-token="">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </span>
  );
}

interface DialOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

/**
 * A segmented radio group with a roving tabindex: Tab enters on the checked
 * option, arrows move and select, Home and End jump to the ends.
 */
function RadioDial<T extends string>({
  id,
  label,
  options,
  value,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly options: readonly DialOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  const move = (next: number) => {
    const target = (next + options.length) % options.length;
    const option = options[target];
    if (!option) return;
    onChange(option.value);
    refs.current[target]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, () => void> = {
      ArrowRight: () => move(index + 1),
      ArrowDown: () => move(index + 1),
      ArrowLeft: () => move(index - 1),
      ArrowUp: () => move(index - 1),
      Home: () => move(0),
      End: () => move(options.length - 1),
    };
    const action = keys[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  return (
    <div className="grid gap-1">
      <span id={`${id}-label`} className="text-[0.875rem] font-bold">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={`${id}-label`} className="w05-dial" data-dial={id}>
        {options.map((option, position) => {
          const checked = option.value === value;
          return (
            <button
              key={option.value}
              ref={(element) => {
                refs.current[position] = element;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              className="w05-option anti-btn"
              onClick={() => onChange(option.value)}
              onKeyDown={onKeyDown}
            >
              <NoBreakTokens text={option.label} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  readonly scene: LocalScene;
  readonly text: W05Text;
  readonly dial: DialState;
  readonly headingId: string;
  readonly onDial: (dial: DialState) => void;
}

/** "Was müsste anders sein?": one or two dials, the result right under them. */
export function WhatIf({ scene, text, dial, headingId, onDial }: Props) {
  const copy = text.ui;
  const { light } = stateLight(scene, dial);
  const parts = fixParts(text, scene.id, dial);
  const accountOptions = scene.accountDial.map((account) => ({
    value: account,
    label: text.accounts[account].dialLabel,
  }));
  const contentOptions = scene.contentDial.map((option) => ({
    value: option.id,
    label: option.label,
  }));

  return (
    <section aria-labelledby={headingId} className="border-t border-[rgb(31_74_56/0.35)] pt-3">
      {goalOf(scene) === "leaveRed" ? null : (
        <p className="mb-1 text-[0.875rem] font-semibold text-muted-foreground">{copy.changeHeading}</p>
      )}
      <h4 id={headingId} className="text-[1.0625rem] font-bold leading-snug">
        {copy.goals[goalOf(scene)]}
      </h4>
      <div className="mt-3 grid gap-3">
        {accountOptions.length > 1 ? (
          <RadioDial
            id={`w05-${scene.id}-account`}
            label={copy.accountDial}
            options={accountOptions}
            value={dial.account}
            onChange={(account) => onDial({ ...dial, account })}
          />
        ) : null}
        <RadioDial
          id={`w05-${scene.id}-content`}
          label={copy.contentDial}
          options={contentOptions}
          value={dial.content}
          onChange={(content) => onDial({ ...dial, content })}
        />
      </div>
      <div
        className="mt-3 border-2 border-[#1f4a38] bg-[var(--color-paper)] p-3"
        data-now-light={light}
        data-found={parts.found ? "" : undefined}
      >
        <p className="flex flex-wrap items-center gap-x-2 text-[1.0625rem]">
          <span className="font-bold">{copy.now}</span>
          <LightLabel light={light} copy={copy} glyphClassName="size-5" />
        </p>
        <p className="mt-1.5 text-[0.9375rem] leading-normal" data-fix-line="">
          {parts.found ? <strong className="font-bold">{copy.found} </strong> : null}
          {parts.reason}
        </p>
        {/* What changed on the route shows once, in the strip above (the
            underlined rows); the live region still says it in words. */}
        {parts.todo.length > 0 ? (
          <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3">
            <p className="text-[0.9375rem] font-bold leading-snug">{copy.todo}</p>
            <ul className="grid gap-1" data-todo="">
              {parts.todo.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[0.9375rem] leading-snug">
                  <span
                    aria-hidden="true"
                    className="mt-[0.2rem] inline-block size-3.5 shrink-0 border-[1.5px] border-current"
                  />
                  <span>{item.charAt(0).toUpperCase() + item.slice(1)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
