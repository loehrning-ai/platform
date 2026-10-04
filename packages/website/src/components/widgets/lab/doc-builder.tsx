"use client";

import { useMemo, useState, type JSX } from "react";
import { m } from "framer-motion";
import { Check, Copy, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraftValue } from "@/components/widgets/tier-a/use-draft-value";
import {
  LabButton,
  LabLive,
  LabSurface,
  labLocale,
  useLabCompletion,
  type LabBaseProps,
} from "./_lab";

export interface DocField {
  readonly id: string;
  readonly label: string;
  readonly type: "text" | "textarea" | "select" | "checkboxes";
  readonly help?: string;
  readonly placeholder?: string;
  /** For select and checkboxes. */
  readonly options?: readonly string[];
  readonly default?: string | readonly string[];
  readonly required?: boolean;
}

export interface DocBuilderProps extends LabBaseProps {
  readonly fields: readonly DocField[];
  /**
   * Markdown template. `{{fieldId}}` inserts a value; checkbox fields insert
   * a bullet list. Empty values insert `[Label]` so gaps stay visible.
   */
  readonly template: string;
  /** Download file name, e.g. "ki-richtlinie.md". */
  readonly filename: string;
}

type Values = Readonly<Record<string, string | readonly string[]>>;

const COPY = {
  de: {
    region: "Dokument-Baukasten",
    form: "Ausfüllen",
    preview: "Vorschau",
    required: "Pflichtfeld",
    progress: (done: number, total: number) => `${done} von ${total} Pflichtfeldern ausgefüllt`,
    download: "Als Markdown herunterladen",
    copy: "Text kopieren",
    copied: "Kopiert.",
    copyFailed: "Kopieren nicht möglich. Nutze den Download.",
    downloaded: "Heruntergeladen. Ersetze offene [Platzhalter] vor der Freigabe.",
    fillFirst: "Fülle zuerst alle Pflichtfelder aus.",
    loading: "Entwurf wird geladen …",
  },
  en: {
    region: "Document builder",
    form: "Fill in",
    preview: "Preview",
    required: "Required",
    progress: (done: number, total: number) => `${done} of ${total} required fields filled`,
    download: "Download as Markdown",
    copy: "Copy text",
    copied: "Copied.",
    copyFailed: "Copying is not available. Use the download.",
    downloaded: "Downloaded. Replace open [placeholders] before approval.",
    fillFirst: "Fill in all required fields first.",
    loading: "Loading draft …",
  },
} as const;

function defaults(fields: readonly DocField[]): Values {
  return Object.fromEntries(
    fields.map((field) => [
      field.id,
      field.default ?? (field.type === "checkboxes" ? [] : ""),
    ]),
  );
}

function isFilled(value: string | readonly string[] | undefined): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" && value.trim().length > 0;
}

/** Render the template with the current values (exported for tests). */
export function renderDocTemplate(
  template: string,
  fields: readonly DocField[],
  values: Values,
): string {
  const byId = new Map(fields.map((field) => [field.id, field]));
  return template.replace(/\{\{\s*([A-Za-z0-9_-]+)\s*\}\}/g, (_, id: string) => {
    const field = byId.get(id);
    if (!field) return `[${id}]`;
    const value = values[id];
    if (!isFilled(value)) return `[${field.label}]`;
    if (Array.isArray(value)) return value.map((entry) => `- ${entry}`).join("\n");
    return String(value).trim();
  });
}

export function DocBuilderWidget({
  fields,
  template,
  filename,
  lessonId,
  cpId,
  locale,
  title,
}: DocBuilderProps): JSX.Element {
  const copy = COPY[labLocale(locale)];
  const { complete } = useLabCompletion({ lessonId, cpId });
  const initial = useMemo(() => defaults(fields), [fields]);
  const [values, setValues, ready] = useDraftValue<Values>(
    `loehrning:lab-doc-builder:${lessonId ?? "preview"}:v1`,
    initial,
  );
  const [status, setStatus] = useState<"idle" | "copied" | "downloaded" | "copy-failed">("idle");

  const required = fields.filter((field) => field.required);
  const filled = required.filter((field) => isFilled(values[field.id])).length;
  const ready2Export = filled === required.length;
  const markdown = renderDocTemplate(template, fields, values);

  const update = (id: string, value: string | readonly string[]) => {
    setValues({ ...values, [id]: value });
    setStatus("idle");
  };

  const download = () => {
    if (!ready2Export) return;
    try {
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Download unsupported (tests, locked-down browsers): copy still works.
    }
    setStatus("downloaded");
    complete();
  };

  const copyText = async () => {
    if (!ready2Export) return;
    try {
      if (typeof navigator.clipboard?.writeText !== "function") throw new Error("no clipboard");
      await navigator.clipboard.writeText(markdown);
      setStatus("copied");
      complete();
    } catch {
      setStatus("copy-failed");
    }
  };

  return (
    <LabSurface label={copy.region} title={title}>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-label text-muted-foreground">{copy.form}</p>
            <p className="text-xs tabular-nums text-muted-foreground">{copy.progress(filled, required.length)}</p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-track" aria-hidden="true">
            <m.div
              className="h-full rounded-full bg-lab-accent"
              initial={false}
              animate={{ width: `${required.length ? (filled / required.length) * 100 : 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          {!ready ? <p className="text-sm text-muted-foreground">{copy.loading}</p> : null}
          {fields.map((field) => {
            const id = `doc-${field.id}`;
            const value = values[field.id];
            const label = (
              <span className="text-sm font-semibold text-foreground">
                {field.label}
                {field.required ? <span className="ml-1 text-xs font-normal text-muted-foreground">({copy.required})</span> : null}
              </span>
            );
            if (field.type === "checkboxes") {
              const selected = Array.isArray(value) ? value : [];
              return (
                <fieldset key={field.id} className="min-w-0">
                  <legend>{label}</legend>
                  {field.help ? <p className="mt-0.5 text-xs text-muted-foreground">{field.help}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {field.options?.map((option) => {
                      const on = selected.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={on}
                          disabled={!ready}
                          onClick={() =>
                            update(field.id, on ? selected.filter((entry) => entry !== option) : [...selected, option])
                          }
                          className={cn(
                            "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-left text-sm transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent disabled:opacity-60",
                            on ? "border-lab-accent bg-lab-accent-soft text-foreground" : "border-lab-line bg-paper text-foreground hover:border-lab-accent/50",
                          )}
                        >
                          {on ? <Check className="h-3.5 w-3.5 text-lab-accent" aria-hidden="true" /> : null}
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              );
            }
            if (field.type === "select") {
              return (
                <div key={field.id}>
                  <label htmlFor={id}>{label}</label>
                  {field.help ? <p className="mt-0.5 text-xs text-muted-foreground">{field.help}</p> : null}
                  <select
                    id={id}
                    disabled={!ready}
                    value={typeof value === "string" ? value : ""}
                    onChange={(event) => update(field.id, event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-xl border border-lab-line bg-paper px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
                  >
                    <option value="">{field.placeholder ?? "\u2014"}</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }
            const inputClass =
              "mt-2 min-h-11 w-full rounded-xl border border-lab-line bg-paper px-3 py-2 text-[15px] text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent";
            return (
              <div key={field.id}>
                <label htmlFor={id}>{label}</label>
                {field.help ? <p className="mt-0.5 text-xs text-muted-foreground">{field.help}</p> : null}
                {field.type === "textarea" ? (
                  <textarea
                    id={id}
                    disabled={!ready}
                    value={typeof value === "string" ? value : ""}
                    placeholder={field.placeholder}
                    maxLength={1200}
                    rows={3}
                    onChange={(event) => update(field.id, event.target.value)}
                    className={inputClass}
                  />
                ) : (
                  <input
                    id={id}
                    type="text"
                    disabled={!ready}
                    value={typeof value === "string" ? value : ""}
                    placeholder={field.placeholder}
                    maxLength={200}
                    onChange={(event) => update(field.id, event.target.value)}
                    className={inputClass}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="min-w-0">
          <p className="mb-2 text-label text-muted-foreground">{copy.preview}</p>
          <pre
            data-doc-preview
            className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-lab-line bg-paper p-4 font-mono text-[13px] leading-relaxed text-foreground shadow-lab-sm"
          >
            {markdown}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <LabButton onClick={download} disabled={!ready2Export || !ready}>
              <Download className="h-4 w-4" aria-hidden="true" />
              {copy.download}
            </LabButton>
            <LabButton tone="secondary" onClick={copyText} disabled={!ready2Export || !ready}>
              <Copy className="h-4 w-4" aria-hidden="true" />
              {copy.copy}
            </LabButton>
          </div>
          <LabLive className="mt-2 text-sm">
            {status === "downloaded" ? <span className="text-lab-good">{copy.downloaded}</span> : null}
            {status === "copied" ? <span className="text-lab-good">{copy.copied}</span> : null}
            {status === "copy-failed" ? <span className="text-lab-warn">{copy.copyFailed}</span> : null}
            {status === "idle" && !ready2Export ? <span className="text-muted-foreground">{copy.fillFirst}</span> : null}
          </LabLive>
        </div>
      </div>
    </LabSurface>
  );
}
