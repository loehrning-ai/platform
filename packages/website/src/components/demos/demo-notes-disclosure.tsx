"use client";

import {
  createContext,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";
import { DisclosureGlyph } from "./evidence-badge";

type NotesDisclosureState = {
  readonly open: boolean;
  readonly toggle: () => void;
  readonly panelId: (part: string) => string;
};

const NotesDisclosureContext = createContext<NotesDisclosureState | null>(null);

/**
 * Phone-only disclosure for the notes under a demo engine. Below sm the
 * checks and the run table fold behind one 44px button, closed by default;
 * from sm up the button is gone and every panel shows as before. One button
 * drives several panels (the checks sit in one column, the run table in the
 * other), so the state lives here and the panels read it from context.
 */
export function DemoNotesDisclosure({
  children,
  className,
  panels,
}: {
  children: ReactNode;
  className?: string;
  /** Panel parts the button controls, e.g. ["checks", "run"]. */
  panels: readonly string[];
}) {
  const [open, setOpen] = useState(false);
  const base = useId();
  const value: NotesDisclosureState = {
    open,
    toggle: () => setOpen((current) => !current),
    panelId: (part) => `${base}-${part}`,
  };
  return (
    <NotesDisclosureContext.Provider value={value}>
      <div
        className={className}
        data-demo-notes-open={open ? "true" : "false"}
        data-demo-notes-panels={panels.join(" ")}
      >
        {children}
      </div>
    </NotesDisclosureContext.Provider>
  );
}

function useNotesDisclosure(): NotesDisclosureState {
  const state = useContext(NotesDisclosureContext);
  if (!state) {
    throw new Error("DemoNotesToggle and DemoNotesPanel need DemoNotesDisclosure");
  }
  return state;
}

export function DemoNotesToggle({
  label,
  panels,
  className,
}: {
  label: string;
  panels: readonly string[];
  className?: string;
}) {
  const { open, toggle, panelId } = useNotesDisclosure();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-controls={panels.map(panelId).join(" ")}
      data-demo-notes-toggle
      className={[
        "flex min-h-11 w-full items-center justify-between gap-3 border-y border-hairline text-left text-body font-semibold text-foreground sm:hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
      <DisclosureGlyph open={open} />
    </button>
  );
}

/** Hidden below sm until the toggle opens it; always shown from sm up. */
export function DemoNotesPanel({
  part,
  children,
  className,
}: {
  part: string;
  children: ReactNode;
  className?: string;
}) {
  const { open, panelId } = useNotesDisclosure();
  return (
    <div
      id={panelId(part)}
      data-demo-notes-panel={part}
      className={[open ? "" : "max-sm:hidden", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
