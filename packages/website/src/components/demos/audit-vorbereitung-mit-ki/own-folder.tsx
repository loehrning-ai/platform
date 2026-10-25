"use client";

import { useEffect, useId, useRef, useState } from "react";
import { itemById } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/case";
import { GENERIC_ITEM_IDS } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/classify";
import type { W05Copy } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { formatShort } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/dates";
import { fill } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/fill";
import type { OwnFile } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/own-folder";
import { NetLine } from "./net-line";
import { FileName } from "./stage-links";
import { WINDOWS, type OwnFolder } from "./use-own-folder";
import type { Loc } from "./words";

export const PASTE_ID = "w05-paste";

function Tri({ value, copy }: { readonly value: boolean | null; readonly copy: W05Copy }) {
  return (
    <span className="w05-tri" data-state={value === null ? "open" : value ? "pass" : "fail"}>
      {value === null ? copy.folder.unknown : value ? "✓" : "✗"}
    </span>
  );
}

function FileRow({ file, copy }: { readonly file: OwnFile; readonly copy: W05Copy }) {
  return (
    <li className="w05-own-file-row">
      <FileName name={file.entry.name} className="w05-own-name" />
      <span className="w05-own-meta">
        {copy.type[file.type]} · {file.date?.iso ?? copy.folder.unknown}
      </span>
      <span className="w05-own-tests">
        <span>
          {copy.test.date} <Tri value={file.dateTest} copy={copy} />
        </span>
        <span>
          {copy.test.approval} <Tri value={file.approvalTest} copy={copy} />
        </span>
      </span>
      {file.notes.length > 0 ? <span className="w05-own-notes">{file.notes.map((note) => copy.folder.notes[note]).join(" · ")}</span> : null}
    </li>
  );
}

/** "Dein Ordner": the four tests on the visitor's own files, as far as names, dates and text files carry them. */
export function OwnFolderSection({
  own,
  copy,
  locale,
  since,
  onFirstInput,
  onExport,
}: {
  readonly own: OwnFolder;
  readonly copy: W05Copy;
  readonly locale: Loc;
  readonly since: number | null;
  readonly onFirstInput: () => void;
  readonly onExport: () => void;
}) {
  const words = copy.folder;
  const id = useId();
  const [list, setList] = useState("");
  const [fine, setFine] = useState(false);
  const [dateDraft, setDateDraft] = useState(own.audit);
  const folderRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDateDraft(own.audit), [own.audit]);
  useEffect(() => {
    // A folder picker only where a mouse and a desktop file manager are: phones offer files, not folders.
    setFine(typeof matchMedia === "function" && matchMedia("(pointer: fine)").matches);
  }, []);
  useEffect(() => {
    folderRef.current?.setAttribute("webkitdirectory", "");
  }, [fine]);

  const result = own.result;
  const take = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onFirstInput();
    void own.addFiles(Array.from(files));
  };

  return (
    <section
      className="w05-section"
      aria-labelledby="w05-own"
      id="dein-ordner"
      data-w05-own=""
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        take(event.dataTransfer.files);
      }}
    >
      <h2 id="w05-own" className="w05-h2">
        {words.heading}
      </h2>
      <p className="w05-privacy" data-w05-privacy="">
        {words.privacy}
      </p>
      <p className="w05-lede">{words.insight}</p>

      <div className="w05-settings">
        <label className="w05-field">
          <span className="w05-label">{words.auditDate}</span>
          <input
            type="date"
            className="w05-input"
            value={dateDraft}
            min="2000-01-01"
            max="2100-12-31"
            onChange={(event) => {
              setDateDraft(event.target.value);
              own.setAudit(event.target.value);
            }}
            aria-describedby={`${id}-window`}
            data-w05-audit=""
          />
        </label>
        <p id={`${id}-window`} className="w05-note" aria-live="polite">
          {own.dateError ? words.dateError : own.windowFrom ? fill(words.windowFrom, { date: formatShort(own.windowFrom, locale) }) : words.windowNone}
        </p>
        <div className="w05-field" role="group" aria-label={words.window}>
          <span className="w05-label">{words.window}</span>
          <span className="w05-picks">
            {WINDOWS.map((months) => (
              <button key={months} type="button" className="w05-pick" aria-pressed={own.months === months} onClick={() => own.setMonths(months)}>
                {fill(words.months, { n: months })}
              </button>
            ))}
          </span>
        </div>
        <div className="w05-field" role="group" aria-label={words.items}>
          <span className="w05-label">{words.items}</span>
          <span className="w05-picks w05-item-picks">
            {GENERIC_ITEM_IDS.map((item) => (
              <button key={item} type="button" className="w05-pick" aria-pressed={own.enabled.has(item)} onClick={() => own.toggle(item)} title={itemById(item).label[locale]}>
                {item}
              </button>
            ))}
          </span>
        </div>
      </div>

      <div className="w05-actions">
        <label className="w05-button is-primary w05-file-input">
          {words.pickFiles}
          <input type="file" multiple className="sr-only" onChange={(event) => take(event.target.files)} data-w05-files="" />
        </label>
        {fine ? (
          <label className="w05-button w05-file-input">
            {words.pickFolder}
            <input ref={folderRef} type="file" multiple className="sr-only" onChange={(event) => take(event.target.files)} />
          </label>
        ) : null}
      </div>

      <label className="w05-field">
        <span className="w05-label">{words.pasteLabel}</span>
        <textarea
          id={PASTE_ID}
          className="w05-textarea"
          rows={5}
          value={list}
          spellCheck={false}
          onChange={(event) => {
            onFirstInput();
            setList(event.target.value);
          }}
          data-w05-paste=""
        />
      </label>
      <div className="w05-actions">
        <button type="button" className="w05-button" onClick={() => own.addList(list)} data-w05-read-list="">
          {words.readList}
        </button>
        <button
          type="button"
          className="w05-button"
          onClick={() => {
            setList("");
            own.clear();
          }}
          data-w05-clear=""
        >
          {words.clear}
        </button>
        {result ? (
          <button type="button" className="w05-button" onClick={onExport} data-w05-export="">
            {words.export}
          </button>
        ) : null}
      </div>
      <NetLine template={copy.net} pathsTemplate={copy.netPaths} since={since} />

      {own.unread.length > 0 ? (
        <ul className="w05-notices">
          {own.unread.map((line) => (
            <li key={line}>{fill(words.unread, { line })}</li>
          ))}
        </ul>
      ) : null}

      {result ? (
        <div className="w05-own-out" data-w05-own-out="">
          <ul className="w05-notices">
            {result.ignored > 0 ? <li>{fill(words.ignored, { n: result.ignored })}</li> : null}
            {result.overCap ? (
              <li>{fill(words.overCap, { listed: result.overCap.listed.toLocaleString(locale), total: result.overCap.total.toLocaleString(locale) })}</li>
            ) : null}
            {result.copiedDates ? <li>{words.copiedDates}</li> : null}
          </ul>

          <ol className="w05-own-items">
            {result.items.map((item) => (
              <li key={item.id} className="w05-own-item" data-item={item.id} data-bound={item.bound}>
                <p className="w05-own-item-head">
                  <b>{item.id}</b> {itemById(item.id).label[locale]} <span className="w05-own-bound">{copy.own.bound[item.bound]}</span>
                </p>
                {item.candidates.length > 0 ? (
                  <>
                    <p className="w05-label">{words.candidates}</p>
                    <ul className="w05-own-files">
                      {item.candidates.map((file, index) => (
                        <FileRow key={`${file.entry.name}-${index}`} file={file} copy={copy} />
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="w05-note">{words.noCandidate}</p>
                )}
              </li>
            ))}
          </ol>

          {result.chains.length > 0 ? (
            <>
              <h3 className="w05-h3">{words.chains}</h3>
              <ul className="w05-chains">
                {result.chains.map((chain) => (
                  <li key={chain.stem} className="w05-chain">
                    <p>{fill(words.chain, { n: chain.files.length })}</p>
                    <ul className="w05-stack">
                      {chain.files.map((file, index) => (
                        <li key={`${file.entry.name}-${index}`}>
                          <FileName name={file.entry.name} />
                        </li>
                      ))}
                    </ul>
                    <p className="w05-note">{chain.approved ? fill(words.chainApproved, { name: chain.approved.entry.name }) : words.chainNone}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <h3 className="w05-h3">{words.files}</h3>
          <ul className="w05-own-files">
            {result.files.map((file, index) => (
              <FileRow key={`${file.entry.name}-${index}`} file={file} copy={copy} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
