"use client";

import { useId } from "react";
import { GlasButton, GlasPanel } from "@/components/demos/glas";
import { clean, columnIssue, FIELDS_BY_BOX, LOCKS, validateCard, type Field, type FieldError, type OwnCard } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/card";
import type { Pack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import { checklistMd, definitionsMd, projectInstructions, skillZip } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/files";
import { KINDS } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/logic";
import type { BoxFill } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/demo-state";
import type { Fmt } from "./fmt";

type Own = Pack["own"];
const LONG: ReadonlySet<Field> = new Set(["question", "who"]);

/** The fields still open or wrong, in box order: "Kästchen 1, Stichtag". */
export function openFields(errors: readonly FieldError[], own: Own, fmt: Fmt): readonly string[] {
  const fields = new Set(errors.map((error) => error.field));
  return FIELDS_BY_BOX.flatMap((box, index) => box.filter((field) => fields.has(field)).map((field) => fmt.t(own.openItem, { n: index + 1, field: own.fields[field] })));
}

/** The five boxes of the own card as glyph states: full when every field of the box is valid. */
export function ownFills(card: OwnCard, locale: "de" | "en"): readonly BoxFill[] {
  const wrong = new Set(validateCard(card, locale).map((error) => error.field));
  return FIELDS_BY_BOX.map((fields) => {
    const typed = fields.filter((field) => clean(String(card[field])) !== "");
    if (typed.length === 0) return "empty";
    return fields.every((field) => !wrong.has(field)) ? "full" : "half";
  });
}

/** Saves bytes as a file on the device: an object URL, no request. */
function save(name: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * The own card under the stage: five boxes as five groups of fields, the
 * kit example in grey under each field, then the files built live from the
 * card. Buttons stay off with one sentence that names what is missing.
 */
export function OwnForm({ pack, fmt, card, onChange, onClear }: { readonly pack: Pack; readonly fmt: Fmt; readonly card: OwnCard; readonly onChange: (card: OwnCard) => void; readonly onClear: () => void }) {
  const o = pack.own;
  const id = useId();
  const example = pack.presets[0]?.card as OwnCard;
  const errors = validateCard(card, pack.locale);
  const ready = errors.length === 0;
  const names = pack.files.names;
  const set = (field: Field, value: string) => onChange({ ...card, [field]: value });
  const errorText = (error: FieldError) => fmt.t(o.errors2[error.code], { detail: error.detail ?? "" });
  const fieldError = (field: Field) => {
    if (field === "column") {
      const issue = columnIssue(card);
      return issue ? errorText(issue) : null;
    }
    const error = errors.find((candidate) => candidate.field === field);
    if (!error || (error.code === "required" && clean(String(card[field])) === "")) return null;
    return errorText(error);
  };

  const input = (field: Field) => {
    const error = fieldError(field);
    const exampleValue = String(example[field]);
    const described = [exampleValue ? `${id}-${field}-ex` : "", error ? `${id}-${field}-err` : ""].filter(Boolean).join(" ");
    const props = {
      id: `${id}-${field}`,
      name: field,
      value: String(card[field]),
      "aria-invalid": error ? true : undefined,
      "aria-describedby": described || undefined,
      onChange: (event: { currentTarget: { value: string } }) => set(field, event.currentTarget.value),
      className: "w03-input",
      autoComplete: "off",
      spellCheck: false,
    };
    return (
      <div className="w03-field" key={field}>
        <label htmlFor={props.id} className="w03-label">
          {o.fields[field]}
        </label>
        {LONG.has(field) ? <textarea {...props} rows={2} /> : <input {...props} type="text" />}
        {exampleValue ? (
          <p id={`${id}-${field}-ex`} className="w03-example">
            {fmt.t(o.example, { value: exampleValue })}
          </p>
        ) : null}
        {error ? (
          <p id={`${id}-${field}-err`} className="w03-error" role="status">
            {error}
          </p>
        ) : null}
      </div>
    );
  };

  const choice = <T extends string>(field: "kind" | "lockedBy", options: readonly T[], labels: Readonly<Record<T, string>>) => (
    <fieldset className="w03-field" key={field}>
      <legend className="w03-label">{o.fields[field]}</legend>
      <div className="w03-pick-chips">
        {options.map((option) => (
          <label key={option} className="w03-radio">
            <input type="radio" name={`${id}-${field}`} value={option} checked={card[field] === option} onChange={() => set(field, option)} />
            <span>{labels[option]}</span>
          </label>
        ))}
      </div>
      <p className="w03-example">{fmt.t(o.example, { value: labels[example[field] as T] ?? "" })}</p>
    </fieldset>
  );

  return (
    <GlasPanel material="regular" shape="card" live={false} className="w03-own-form" data-w03-own-form="">
      <h2 className="w03-own-title">{o.boxesTitle}</h2>
      <form onSubmit={(event) => event.preventDefault()} noValidate className="w03-own-boxes">
        {FIELDS_BY_BOX.map((fields, index) => (
          <fieldset key={o.boxes[index]} className="w03-own-box">
            <legend className="w03-own-legend">{o.boxes[index]}</legend>
            {fields.map((field) => (field === "kind" ? choice("kind", KINDS, o.kindOptions) : field === "lockedBy" ? choice("lockedBy", LOCKS, o.locks) : input(field)))}
          </fieldset>
        ))}
      </form>
      <section className="w03-own-files" aria-label={o.filesTitle} data-w03-downloads="">
        <h3 className="w03-own-legend">{o.filesTitle}</h3>
        {ready ? null : (
          <p className="w03-own-note" data-w03-blocked="">
            {fmt.t(o.blocked, { list: openFields(errors, o, fmt).join(", ") })}
          </p>
        )}
        <div className="w03-own-buttons">
          <GlasButton variant="fill" size="compact" disabled={!ready} data-w03-download="skill" onClick={() => save("kennzahl-fragekarte.zip", new Uint8Array(skillZip(card, pack.files)), "application/zip")}>
            {o.skill}
          </GlasButton>
          <GlasButton variant="fill" size="compact" disabled={!ready} data-w03-download="definitions" onClick={() => save("kennzahlen.md", definitionsMd(card, pack.files), "text/markdown;charset=utf-8")}>
            {o.definitions}
          </GlasButton>
          <GlasButton variant="fill" size="compact" disabled={!ready} data-w03-download="instructions" onClick={() => save(names.instructions, projectInstructions(card, pack.files), "text/plain;charset=utf-8")}>
            {fmt.t(o.instructions, { file: names.instructions })}
          </GlasButton>
          <GlasButton variant="fill" size="compact" disabled={!ready} data-w03-download="checklist" onClick={() => save(names.checklist, checklistMd(card, pack.files), "text/markdown;charset=utf-8")}>
            {fmt.t(o.checklist, { file: names.checklist })}
          </GlasButton>
        </div>
      </section>
      <GlasButton variant="plain" size="compact" onClick={onClear} data-w03-clear="">
        {o.clear}
      </GlasButton>
    </GlasPanel>
  );
}
