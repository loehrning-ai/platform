"use client";

import { useId, useState } from "react";
import {
  clean,
  columnIssue,
  EMPTY_CARD,
  FIELDS_BY_BOX,
  isoDate,
  LOCKS,
  lintQuestion,
  metricSlug,
  validateCard,
  type Field,
  type FieldError,
  type OwnCard,
} from "@/lib/demo-cases/datenbereitschaft-fuer-ki/card";
import type { Pack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import {
  behaviourTests,
  checklistMd,
  definitionsMd,
  expectedText,
  fill,
  projectInstructions,
  skillZip,
  source,
} from "@/lib/demo-cases/datenbereitschaft-fuer-ki/files";
import { KINDS } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/logic";

type Own = Pack["own"];

/** The fields still open or wrong, in box order: "Kästchen 1 Stichtag". */
export function openFields(
  errors: readonly FieldError[],
  own: Own,
): readonly string[] {
  const fields = new Set(errors.map((error) => error.field));
  return FIELDS_BY_BOX.flatMap((box, index) =>
    box
      .filter((field) => fields.has(field))
      .map((field) =>
        fill(own.openItem, { n: index + 1, field: own.fieldShort[field] }),
      ),
  );
}

/** The visitor's line for the take-home block; empty while the card is not complete. */
export function takeHomeLine(card: OwnCard, pack: Pack): string {
  if (validateCard(card, pack.locale).length > 0 || card.kind === "") return "";
  return fill(pack.own.takeHomeLine, {
    metric: clean(card.metric),
    slug: metricSlug(card.metric),
    kind: pack.own.kinds[card.kind],
    source: source(card, pack.files),
    values: expectedText(card, pack.locale),
    unit: clean(card.unit),
    sourceOfTruth: clean(card.source),
  });
}

/** Beat 7 on the stage: the card as it fills in, box by box, live. */
export function OwnPreview({
  pack,
  card,
}: {
  readonly pack: Pack;
  readonly card: OwnCard;
}) {
  const own = pack.own;
  const errors = validateCard(card, pack.locale);
  const empty = Object.values(card).every((value) => value === "");
  const wrong = new Set(errors.map((error) => error.field));
  const tests = behaviourTests(card, pack.files);
  return (
    <div
      className="fk-own-preview"
      data-fk-own-preview={errors.length === 0 ? "ready" : "open"}
    >
      <p className="fk-own-metric">{clean(card.metric) || own.heading}</p>
      <ol className="fk-own-boxes">
        {FIELDS_BY_BOX.map((fields, index) => {
          const done =
            fields.every((field) => !wrong.has(field)) &&
            fields.some((field) => clean(String(card[field])) !== "");
          return (
            <li
              key={own.boxes[index]}
              className="fk-own-box"
              data-done={done ? "" : undefined}
            >
              <span className="fk-own-mark" aria-hidden="true" />
              <span className="fk-own-box-name">{own.boxes[index]}</span>
              <span className="fk-own-box-value">
                {summary(card, index, pack)}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="fk-own-status">
        {empty
          ? own.preview.empty
          : errors.length === 0
            ? own.preview.ready
            : fill(own.preview.open, {
                list: openFields(errors, own).slice(0, 3).join(", "),
              })}
      </p>
      {errors.length === 0 ? (
        <p className="fk-origin">{fill(own.preview.tests, tests)}</p>
      ) : null}
    </div>
  );
}

function summary(card: OwnCard, box: number, pack: Pack): string {
  const c = (field: Field) => clean(String(card[field]));
  if (box === 0)
    return [c("question"), isoDate(card.clock) ?? c("clock")]
      .filter(Boolean)
      .join(" · ");
  if (box === 1) return [c("view"), c("column")].filter(Boolean).join(" · ");
  if (box === 2)
    return [card.kind ? pack.own.kinds[card.kind] : "", c("who")]
      .filter(Boolean)
      .join(" · ");
  if (box === 3)
    return [c("never"), card.lockedBy ? pack.own.locks[card.lockedBy] : ""]
      .filter(Boolean)
      .join(" · ");
  return [
    c("expected")
      ? `${expectedText(card, pack.locale)} ${c("unit")}`.trim()
      : "",
    c("source"),
  ]
    .filter(Boolean)
    .join(" · ");
}

function errorText(error: FieldError, own: Own): string {
  return fill(own.errors[error.code], { detail: error.detail ?? "" });
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

const TEXT_FIELDS: readonly Field[] = [
  "metric",
  "question",
  "clock",
  "view",
  "column",
  "who",
  "never",
  "expected",
  "unit",
  "source",
];
const LONG: ReadonlySet<Field> = new Set(["question", "who"]);

/**
 * The own card below the lever: five boxes, one vertical card, never
 * collapsible. Under each field the FOLDLINE example; errors name the
 * token; question hints never block. Then the three files.
 */
export function OwnForm({
  pack,
  card,
  onChange,
}: {
  readonly pack: Pack;
  readonly card: OwnCard;
  readonly onChange: (card: OwnCard) => void;
}) {
  const own = pack.own;
  const id = useId();
  const example = pack.presets[0]?.card as OwnCard;
  const errors = validateCard(card, pack.locale);
  const hints = lintQuestion(card);
  const [copied, setCopied] = useState(false);
  const set = (field: Field, value: string) => {
    setCopied(false);
    onChange({ ...card, [field]: value });
  };
  const fieldError = (field: Field) => {
    if (field === "column") {
      const issue = columnIssue(card);
      return issue ? `${errorText(issue, own)} ${own.columnDropped}` : null;
    }
    const error = errors.find((candidate) => candidate.field === field);
    if (
      !error ||
      (error.code === "required" && clean(String(card[field])) === "")
    )
      return null;
    return errorText(error, own);
  };
  const ready = errors.length === 0;
  const never = clean(card.never);
  const names = pack.files.names;

  const input = (field: Field) => {
    const error = fieldError(field);
    const exampleValue = String(example[field]);
    const described = [
      exampleValue ? `${id}-${field}-ex` : "",
      error ? `${id}-${field}-err` : "",
    ]
      .filter(Boolean)
      .join(" ");
    const props = {
      id: `${id}-${field}`,
      name: field,
      value: String(card[field]),
      "aria-invalid": error ? true : undefined,
      "aria-describedby": described || undefined,
      onChange: (event: { currentTarget: { value: string } }) =>
        set(field, event.currentTarget.value),
      className: "fk-input",
      autoComplete: "off",
      spellCheck: false,
    };
    return (
      <div className="fk-field" key={field}>
        <label htmlFor={props.id} className="fk-label">
          {own.fields[field]}
        </label>
        {LONG.has(field) ? (
          <textarea {...props} rows={3} />
        ) : (
          <input {...props} type="text" />
        )}
        {exampleValue ? (
          <p id={`${id}-${field}-ex`} className="fk-example">
            {fill(own.example, { value: exampleValue })}
          </p>
        ) : null}
        {error ? (
          <p id={`${id}-${field}-err`} className="fk-error" role="status">
            {error}
          </p>
        ) : null}
        {field === "question" && hints.length > 0 ? (
          <ul className="fk-hints">
            {hints.map((hint) => (
              <li key={hint}>{own.hints[hint]}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  };

  const choice = <T extends string>(
    field: "kind" | "lockedBy",
    options: readonly T[],
    labels: Readonly<Record<T, string>>,
  ) => (
    <fieldset className="fk-field fk-choice" key={field}>
      <legend className="fk-label">{own.fields[field]}</legend>
      <div className="fk-choice-row">
        {options.map((option) => (
          <label key={option} className="fk-pill">
            <input
              type="radio"
              name={`${id}-${field}`}
              value={option}
              checked={card[field] === option}
              onChange={() => set(field, option)}
            />
            <span>{labels[option]}</span>
          </label>
        ))}
      </div>
      <p className="fk-example">
        {fill(own.example, { value: labels[example[field] as T] ?? "" })}
      </p>
    </fieldset>
  );

  return (
    <div className="fk-own" data-fk-own="">
      <h2 className="fk-own-heading">{own.heading}</h2>
      <p className="fk-note">{own.lede}</p>
      <p className="fk-privacy" data-fk-privacy="">
        {own.privacy}
      </p>
      <button
        type="button"
        className="fk-button fk-button-quiet"
        onClick={() => onChange(EMPTY_CARD)}
        data-fk-clear=""
      >
        {own.clear}
      </button>
      <form
        className="fk-own-form"
        onSubmit={(event) => event.preventDefault()}
        noValidate
      >
        {FIELDS_BY_BOX.map((fields, index) => (
          <fieldset key={own.boxes[index]} className="fk-own-fieldset">
            <legend className="fk-own-legend">{own.boxes[index]}</legend>
            {fields.map((field) =>
              field === "kind"
                ? choice("kind", KINDS, own.kinds)
                : field === "lockedBy"
                  ? choice("lockedBy", LOCKS, own.locks)
                  : TEXT_FIELDS.includes(field)
                    ? input(field)
                    : null,
            )}
          </fieldset>
        ))}
      </form>
      <section
        className="fk-downloads"
        aria-label={own.downloads.heading}
        data-fk-downloads=""
      >
        <h3 className="fk-own-legend">{own.downloads.heading}</h3>
        {ready ? null : (
          <p className="fk-note" data-fk-blocked="">
            {fill(own.downloads.blocked, {
              list: openFields(errors, own).join(", "),
            })}
          </p>
        )}
        <div className="fk-download">
          <button
            type="button"
            className="fk-button"
            disabled={!ready}
            data-fk-download="skill"
            onClick={() =>
              save(
                "kennzahl-fragekarte.zip",
                new Uint8Array(skillZip(card, pack.files)),
                "application/zip",
              )
            }
          >
            {own.downloads.skill}
          </button>
          <p className="fk-note">{own.downloads.skillWhere}</p>
        </div>
        <div className="fk-download">
          <div className="fk-download-row">
            <button
              type="button"
              className="fk-button"
              disabled={!ready}
              data-fk-download="copy"
              onClick={() => {
                void navigator.clipboard
                  ?.writeText(projectInstructions(card, pack.files))
                  .then(() => setCopied(true));
              }}
            >
              {copied ? own.downloads.copied : own.downloads.copy}
            </button>
            <button
              type="button"
              className="fk-button"
              disabled={!ready}
              data-fk-download="instructions"
              onClick={() =>
                save(
                  names.instructions,
                  projectInstructions(card, pack.files),
                  "text/plain;charset=utf-8",
                )
              }
            >
              {fill(own.downloads.instructionsFile, {
                file: names.instructions,
              })}
            </button>
            <button
              type="button"
              className="fk-button"
              disabled={!ready}
              data-fk-download="definitions"
              onClick={() =>
                save(
                  "kennzahlen.md",
                  definitionsMd(card, pack.files),
                  "text/markdown;charset=utf-8",
                )
              }
            >
              {own.downloads.definitionsFile}
            </button>
          </div>
          <p className="fk-note">
            {own.downloads.instructionsWhere}
            {never ? ` ${fill(own.downloads.lockWhere, { never })}` : ""}
          </p>
        </div>
        <div className="fk-download">
          <button
            type="button"
            className="fk-button"
            disabled={!ready}
            data-fk-download="checklist"
            onClick={() =>
              save(
                names.checklist,
                checklistMd(card, pack.files),
                "text/markdown;charset=utf-8",
              )
            }
          >
            {own.downloads.checklist}
          </button>
          <p className="fk-note">
            {fill(own.downloads.checklistWhere, { file: names.checklist })}
          </p>
        </div>
      </section>
    </div>
  );
}

/** Beat 8 on the stage: the three files, made from the visitor's card or shipped in the kit. */
export function TakeHomeScene({
  pack,
  fromCard,
}: {
  readonly pack: Pack;
  readonly fromCard: boolean;
}) {
  const copy = pack.takehome;
  return (
    <div className="fk-takehome">
      <p className="fk-objective" data-fk-objective="">
        {copy.objective}
      </p>
      <ol className="fk-files" data-fk-files="">
        {copy.files.map((file) => (
          <li key={file.name} className="fk-file-card">
            <p className="fk-file-card-name">{file.name}</p>
            <p className="fk-file-card-where">{file.where}</p>
            <p className="fk-file-card-does">{file.does}</p>
          </li>
        ))}
      </ol>
      <p className="fk-origin" data-fk-origin="">
        {fromCard ? copy.fromCard : copy.fromKit}
      </p>
    </div>
  );
}
