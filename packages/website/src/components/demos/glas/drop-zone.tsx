"use client";

import { useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { cx } from "@/components/werk/cx";
import { GLAS_PRIORITY } from "./budget";
import { GlasButton } from "./button";
import { GlasIcon } from "./icons";
import { GlasPanel } from "./panel";

/**
 * DropZone (glass-spec 4.12): "Deine Datei". Regular glass, one sentence,
 * a button that opens the file picker. Drag over lifts it with a Mennige rim.
 * The file never leaves the browser: onFile gets the File object, the demo
 * reads it locally. Errors are a sentence inside the zone, never a toast.
 */
export function GlasDropZone({
  text,
  buttonLabel,
  accept,
  onFile,
  error,
  className,
  children,
}: {
  /** "Zieh deine CSV hierher oder tippe auf den Knopf. Die Datei bleibt auf diesem Gerät." */
  readonly text: ReactNode;
  readonly buttonLabel: string;
  /** The input's accept list (".csv,text/csv"). */
  readonly accept: string;
  readonly onFile: (file: File) => void;
  /** What is wrong and how to fix it, in two sentences. */
  readonly error?: ReactNode;
  readonly className?: string;
  readonly children?: ReactNode;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement | null>(null);
  const [over, setOver] = useState(false);
  const take = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };
  return (
    <GlasPanel
      material="regular"
      live={GLAS_PRIORITY.panel}
      className={cx("glas-drop", className)}
      data-over={over ? "" : undefined}
      onDragOver={(event: DragEvent) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event: DragEvent) => {
        event.preventDefault();
        setOver(false);
        take(event.dataTransfer?.files ?? null);
      }}
    >
      <GlasIcon name="upload" className="glas-drop-icon" />
      <p id={`${id}-text`} className="glas-drop-text">
        {text}
      </p>
      <input ref={input} id={`${id}-input`} type="file" accept={accept} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(event) => take(event.target.files)} />
      <GlasButton variant="fill" icon="doc" onClick={() => input.current?.click()} aria-describedby={`${id}-text`}>
        {buttonLabel}
      </GlasButton>
      {error ? (
        <p className="glas-drop-error" role="alert">
          {error}
        </p>
      ) : null}
      {children}
    </GlasPanel>
  );
}
