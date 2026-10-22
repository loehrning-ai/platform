"use client";

import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { requestAnchor } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/cases";
import { viewName, type DemoText } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-shared";
import { TABLES, type TableId } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/data";
import type { Action, DefState } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/engine";
import { formatEur } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/format";
import type { Blank, BlankValues, DefinitionRequest } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/model";
import { liveText, optionLabel, shortPath } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/text";
import { Chip } from "./chip";
import { DefinitionReceipt } from "./receipt";
import { Rich } from "./rich";
import { focusFirstInput, useReducedMotionScroll } from "./focus";

interface Props {
  readonly request: DefinitionRequest;
  readonly state: DefState;
  readonly text: DemoText;
  readonly dispatch: (action: Action) => void;
  readonly announce: (message: string) => void;
  readonly nextLabel: string;
  readonly onNext: () => void;
}

const quote = (text: string, locale: Locale): string => (locale === "de" ? `„${text}“` : `“${text}”`);

function optionContent(request: DefinitionRequest, blank: Blank, value: string, text: DemoText) {
  if (blank === "kind") {
    const option = (request.id === "05" ? text.kind05 : text.kind)[value as BlankValues["kind"]];
    return { label: option.label, gloss: option.gloss };
  }
  if (blank === "table") {
    const table = TABLES[value as TableId];
    return {
      label: <code>{value}</code>,
      tag: table.approved ? text.tableTag.approved : text.tableTag.export,
      gloss: viewName(table.id, text),
    };
  }
  return { label: optionLabel(request, blank, value, text) };
}

/**
 * One definition request (01, 02, 03, 05): the header with the question, the
 * form of blanks and fixed lines, Prüfen, and the receipt beside it on
 * desktop. Every fieldset and fixed line is always rendered.
 */
export function DefinitionRequestSection({ request, state, text, dispatch, announce, nextLabel, onNext }: Props) {
  const { locale } = text;
  const anchor = requestAnchor(request.id);
  const fieldsets = useRef<Partial<Record<Blank, HTMLFieldSetElement | null>>>({});
  const receiptHeading = useRef<HTMLHeadingElement>(null);
  const pending = useRef(false);
  const behavior = useReducedMotionScroll();

  useEffect(() => {
    if (!pending.current || !state.receipt) return;
    pending.current = false;
    const receipt = state.receipt;
    if (receipt.verdict === "open" && receipt.changeBlank) {
      focusFirstInput(fieldsets.current[receipt.changeBlank], behavior());
    } else {
      receiptHeading.current?.focus();
    }
    announce(liveText(receipt, request, text));
  }, [state.attempt, state.receipt, announce, request, text, behavior]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    pending.current = true;
    dispatch({ type: "check", request: request.id });
  };

  const fieldset = (blank: Blank): ReactNode => {
    const options = (request.options[blank] ?? []) as readonly string[];
    const columns = blank === "kind" && options.length === 2 ? 2 : blank === "grain" && options.length === 2 ? 2 : 1;
    const legendId = `${anchor}-${blank}-legend`;
    return (
      <fieldset
        key={blank}
        className="dr3-fieldset"
        data-blank={blank}
        ref={(element) => {
          fieldsets.current[blank] = element;
        }}
      >
        <legend id={legendId} className="dr3-legend">
          {text.legends[blank]}
        </legend>
        <div className="dr3-chips" data-columns={columns}>
          {options.map((value) => {
            const content = optionContent(request, blank, value, text);
            return (
              <Chip
                key={value}
                type="radio"
                name={`dr3-${request.id}-${blank}`}
                value={value}
                checked={state.definition[blank] === value}
                onChange={() => dispatch({ type: "choose", request: request.id, blank, value: value as BlankValues[Blank] })}
                label={content.label}
                tag={content.tag}
                gloss={content.gloss}
              />
            );
          })}
        </div>
      </fieldset>
    );
  };

  return (
    <section id={anchor} aria-labelledby={`${anchor}-h`} className="dr3-section" data-request={request.id}>
      <h2 id={`${anchor}-h`} tabIndex={-1} className="dr3-h2">
        {text.requestWord} {request.id} · {text.requestTitles[request.id]}
      </h2>
      <p className="dr3-path">
        {text.path} <code>{shortPath(anchor, text)}</code>
      </p>
      <p className="dr3-question">
        <Rich text={quote(text.questions[request.id], locale)} locale={locale} />
      </p>
      <p className="dr3-context">{request.id === "05" ? text.context05 : text.context}</p>
      {request.id === "01" ? (
        <p className="dr3-start">
          {text.start01}
          <strong>
            {[-19_960, 9_775, 42_565].map((amount) => formatEur(amount, locale)).join(" · ")}
          </strong>
        </p>
      ) : null}
      {request.id === "05" ? <p className="dr3-decision">{text.decision05}</p> : null}

      <div className="dr3-grid">
        <form className="dr3-form" onSubmit={onSubmit} noValidate aria-label={`${text.requestWord} ${request.id}`}>
          {request.items.map((item) =>
            item.type === "blank" ? (
              fieldset(item.blank)
            ) : (
              <p key={item.line} className="dr3-fixed" data-fixed={item.line}>
                <span className="dr3-fixed-note">{text.fixedNote}</span>
                {text.fixed[item.line]}
              </p>
            ),
          )}
          <div>
            <button type="submit" className="dr3-btn dr3-btn-wide anti-btn" data-check={request.id}>
              {text.check}
            </button>
          </div>
        </form>
        <DefinitionReceipt
          ref={receiptHeading}
          request={request}
          state={state}
          text={text}
          headingId={`${anchor}-receipt`}
          nextLabel={nextLabel}
          onNext={onNext}
          onChangeBlank={(blank) => focusFirstInput(fieldsets.current[blank], behavior())}
        />
      </div>
    </section>
  );
}
