"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { GlasButton, GlasPanel } from "@/components/demos/glas";
import type { ItemId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/case";
import { parseDateTokens } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/dates";
import { lineOf } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/decision-lines";
import type { OwnBoard, Place } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/own-board";
import type { OwnFile } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/own-folder";
import type { Fmt } from "./fmt";
import type { OwnFolder } from "./use-own-folder";

/** The lines the page read in a visitor's text file: the date and the approver. */
export function readLines(file: OwnFile): { readonly date: number | null; readonly approval: number | null } {
  const text = file.entry.text ?? "";
  if (!text) return { date: null, approval: null };
  const lines = text.split("\n");
  const iso = file.date?.source === "text" ? file.date.iso : null;
  const dateIndex = iso ? lines.findIndex((line) => parseDateTokens(line).some((token) => token.iso === iso)) : -1;
  return { date: dateIndex < 0 ? null : dateIndex + 1, approval: file.approvedBy ? lineOf(text, file.approvedBy) : null };
}

function tri(value: boolean | null): "pass" | "fail" | "open" {
  return value === null ? "open" : value ? "pass" : "fail";
}

function OwnCard({
  fmt,
  file,
  moving,
  onMove,
  onOpen,
}: {
  readonly fmt: Fmt;
  readonly file: OwnFile;
  readonly moving: boolean;
  readonly onMove: () => void;
  readonly onOpen: (() => void) | null;
}) {
  const { copy } = fmt;
  return (
    <li className="w05-own-card" data-moving={moving ? "" : undefined} data-w05-own-card={file.entry.name}>
      <button type="button" className="w05-own-pick" onClick={onMove} aria-pressed={moving} aria-label={`${file.entry.name}. ${copy.own.moveHint}`}>
        <span className="w05-file">{file.entry.name}</span>
        <span className="w05-own-meta">
          <span className="w05-own-tri" data-state={tri(file.dateTest)}>
            {copy.check.date}
          </span>
          <span className="w05-own-tri" data-state={tri(file.approvalTest)}>
            {copy.check.approval}
          </span>
          {file.date ? <span>{fmt.date(file.date.iso)}</span> : null}
        </span>
        {file.notMet || file.notes.length > 0 ? (
          <span className="w05-own-notes">
            {[file.notMet ? copy.own.bound.notMet : null, ...file.notes.map((note) => copy.own.notes[note])].filter(Boolean).join(" ")}
          </span>
        ) : null}
      </button>
      {onOpen ? (
        <button type="button" className="w05-link-button" onClick={onOpen} data-w05-own-open="">
          {fmt.t(copy.folder.openFile, { file: file.entry.name })}
        </button>
      ) : null}
    </li>
  );
}

/**
 * Scene 4, the stage: a drop panel until files are in, then the visitor's
 * files as cards beside the request each most likely answers. Tap a card,
 * then a request (or "Passt zu keiner"), to move it; each row's bound is a
 * sentence and a stamp, never "covered".
 */
export function OwnStage({
  fmt,
  own,
  board,
  moving,
  onPick,
  onPlace,
  onOpen,
}: {
  readonly fmt: Fmt;
  readonly own: OwnFolder;
  readonly board: OwnBoard | null;
  readonly moving: OwnFile | null;
  readonly onPick: (file: OwnFile | null) => void;
  readonly onPlace: (to: Place) => void;
  readonly onOpen: (file: OwnFile) => void;
}) {
  const { copy } = fmt;
  const pickId = useId();
  const folderRef = useRef<HTMLInputElement | null>(null);
  const [fine, setFine] = useState(false);
  const [over, setOver] = useState(false);
  useEffect(() => {
    // A folder picker only where a desktop file manager is: phones offer files, not folders.
    setFine(typeof matchMedia === "function" && matchMedia("(pointer: fine)").matches);
  }, []);
  useEffect(() => {
    folderRef.current?.setAttribute("webkitdirectory", "");
  }, [fine]);
  const take = (files: FileList | null) => {
    if (files && files.length > 0) void own.addFiles(Array.from(files));
  };
  const result = own.result;

  const drop = (
    <GlasPanel
      material="regular"
      className="w05-drop"
      data-over={over ? "" : undefined}
      data-w05-drop=""
      onDragOver={(event: DragEvent) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event: DragEvent) => {
        event.preventDefault();
        setOver(false);
        take(event.dataTransfer.files);
      }}
    >
      <p className="w05-drop-title">{copy.own.drop}</p>
      <div className="w05-drop-actions">
        <label className="w05-pick" htmlFor={pickId}>
          {copy.own.pick}
        </label>
        <input id={pickId} type="file" multiple className="sr-only" onChange={(event) => take(event.target.files)} data-w05-own-input="" />
        {fine ? (
          <label className="w05-pick">
            <input ref={folderRef} type="file" multiple className="sr-only" onChange={(event) => take(event.target.files)} />
            {copy.own.pickFolder}
          </label>
        ) : null}
      </div>
      <p className="w05-privacy" data-w05-privacy="">
        {copy.own.privacy}
      </p>
    </GlasPanel>
  );

  if (!board || !result) return <div className="w05-own">{drop}</div>;

  const rowButton = (id: ItemId | null, label: string) =>
    moving ? (
      <button type="button" className="w05-own-target" onClick={() => onPlace(id)} data-w05-own-target={id ?? "none"}>
        {label}
      </button>
    ) : (
      <span className="w05-own-row-name">{label}</span>
    );

  return (
    <div className="w05-own" data-w05-own="" data-moving={moving ? "" : undefined}>
      <p className="w05-hint" aria-live="polite">
        {moving ? fmt.t(copy.own.moving, { file: moving.entry.name }) : copy.own.afterDrop}
      </p>
      {own.unread.length > 0 ? <p className="w05-hint">{own.unread.map((line) => fmt.t(copy.own.unread, { line })).join(" ")}</p> : null}
      {result.ignored > 0 ? <p className="w05-hint">{fmt.t(copy.own.ignored, { n: result.ignored })}</p> : null}
      {result.overCap ? <p className="w05-hint">{fmt.t(copy.own.overCap, result.overCap)}</p> : null}
      {result.copiedDates ? <p className="w05-hint">{copy.own.copiedDates}</p> : null}
      <ol className="w05-own-rows">
        {board.rows.map((row) => (
          <li key={row.id} className="w05-own-row" data-w05-own-row={row.id} data-bound={row.bound}>
            <div className="w05-own-row-head">
              <span className="w05-request-id">{row.id}</span>
              {rowButton(row.id, copy.own.genericName[row.id])}
              <span className="w05-stamp" data-status={row.bound === "open" ? "open" : row.bound === "weak" ? "weak" : "gap"}>
                {copy.own.boundStamp[row.bound]}
              </span>
            </div>
            <p className="w05-own-bound">{copy.own.bound[row.bound]}</p>
            {row.files.length > 0 ? (
              <ul className="w05-own-cards">
                {row.files.map((file) => (
                  <OwnCard
                    key={file.entry.name}
                    fmt={fmt}
                    file={file}
                    moving={moving?.entry.name === file.entry.name}
                    onMove={() => onPick(moving?.entry.name === file.entry.name ? null : file)}
                    onOpen={file.entry.text ? () => onOpen(file) : null}
                  />
                ))}
              </ul>
            ) : null}
          </li>
        ))}
        <li className="w05-own-row" data-w05-own-row="none">
          <div className="w05-own-row-head">{rowButton(null, copy.own.none)}</div>
          {board.none.length > 0 ? (
            <ul className="w05-own-cards">
              {board.none.map((file) => (
                <OwnCard
                  key={file.entry.name}
                  fmt={fmt}
                  file={file}
                  moving={moving?.entry.name === file.entry.name}
                  onMove={() => onPick(moving?.entry.name === file.entry.name ? null : file)}
                  onOpen={file.entry.text ? () => onOpen(file) : null}
                />
              ))}
            </ul>
          ) : null}
        </li>
      </ol>
      {board.skipped.length > 0 ? <p className="w05-hint">{board.skipped.map((file) => `${file.entry.name}: ${copy.own.notes.lock}`).join(" ")}</p> : null}
      <div className="w05-own-more">{drop}</div>
    </div>
  );
}

/** Scene 4, the dock: the audit date (the window is the kit's twelve months), the pasted list, and clearing. */
export function OwnDock({ fmt, own, onClear }: { readonly fmt: Fmt; readonly own: OwnFolder; readonly onClear: () => void }) {
  const { copy } = fmt;
  const dateId = useId();
  const listId = useId();
  const [draft, setDraft] = useState(own.audit);
  const [paste, setPaste] = useState(false);
  const [list, setList] = useState("");
  useEffect(() => setDraft(own.audit), [own.audit]);
  return (
    <div className="w05-own-dock">
      <div className="w05-own-date">
        <label htmlFor={dateId} className="w05-label">
          {copy.own.stichtag}
        </label>
        <input
          id={dateId}
          type="date"
          className="w05-input"
          value={draft}
          min="2000-01-01"
          max="2100-12-31"
          onChange={(event) => {
            setDraft(event.target.value);
            own.setAudit(event.target.value);
          }}
          data-w05-stichtag=""
        />
      </div>
      <p className="w05-hint" aria-live="polite">
        {own.dateError ? copy.own.dateError : own.windowFrom ? fmt.t(copy.own.window, { from: fmt.date(own.windowFrom) }) : copy.own.noAudit}
      </p>
      <div className="w05-row-buttons">
        <GlasButton variant="fill" size="compact" onClick={() => setPaste(!paste)} aria-expanded={paste} data-w05-paste-open="">
          {copy.own.pasteOpen}
        </GlasButton>
        {own.entries.length > 0 || own.audit ? (
          <GlasButton variant="plain" size="compact" onClick={onClear} data-w05-own-clear="">
            {copy.own.clear}
          </GlasButton>
        ) : null}
      </div>
      {paste ? (
        <div className="w05-paste">
          <label htmlFor={listId} className="w05-hint">
            {copy.own.pasteLabel}
          </label>
          <textarea id={listId} className="w05-input w05-textarea" rows={3} value={list} onChange={(event) => setList(event.target.value)} data-w05-paste="" />
          <GlasButton
            variant="fill"
            size="compact"
            disabled={list.trim() === ""}
            onClick={() => {
              own.addList(list);
              setList("");
              setPaste(false);
            }}
            data-w05-paste-read=""
          >
            {copy.own.readList}
          </GlasButton>
        </div>
      ) : null}
    </div>
  );
}
