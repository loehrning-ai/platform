"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { SENTENCE_BLANK_MAX } from "@/lib/demo-cases/ki-prognosen-einschaetzen/data";
import type { ForecastCopy } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy-types";
import { ownerAccepted, type Owner } from "@/lib/demo-cases/ki-prognosen-einschaetzen/logic";
import { loadDraft, saveDraft } from "@/lib/demo-cases/ki-prognosen-einschaetzen/storage";
import {
  BLANK_COUNT,
  buildTakeaways,
  ownerText,
  prefillOwner,
  type SentenceDraft,
} from "@/lib/demo-cases/ki-prognosen-einschaetzen/takeaways";
import { CopyButton } from "./copy-button";

interface Props {
  readonly owner: Owner | null;
  /** The owner is fixed: the mornings have started. */
  readonly ownerLocked: boolean;
  readonly copy: ForecastCopy;
  readonly headingRef: RefObject<HTMLHeadingElement | null>;
}

/**
 * One blank as a one-line field that wraps instead of scrolling, so a long
 * value (the prefilled owner on a 360px phone) is never cut off. Enter does
 * not add a line; pasted line breaks become spaces.
 */
function BlankField({ id, value, onChange }: { readonly id: string; readonly value: string; readonly onChange: (next: string) => void }) {
  const field = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
    };
    fit();
    if (typeof ResizeObserver !== "function") return;
    // Refit only when the width changes (rotation, layout), never on our own height change.
    let width = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === width) return;
      width = el.clientWidth;
      requestAnimationFrame(fit);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);
  return (
    <textarea
      ref={field}
      id={id}
      className="fr-input fr-input-blank"
      rows={1}
      maxLength={SENTENCE_BLANK_MAX}
      autoComplete="off"
      value={value}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.preventDefault();
      }}
      onChange={(event) => onChange(event.currentTarget.value.replace(/[\r\n]+/g, " "))}
    />
  );
}

/**
 * "Zum Mitnehmen": always rendered, on load and without play. The split
 * rule, the morning check with the participant's owner, and the five
 * sentences as a fill-in form whose copy holds the filled text.
 */
export function Takeaways({ owner, ownerLocked, copy, headingRef }: Props) {
  const t = copy.takeaways;
  const [draft, setDraft] = useState<SentenceDraft>(() => ({ blanks: Array.from({ length: BLANK_COUNT }, () => ""), prefill: null }));
  const { blanks } = draft;
  const setBlank = (index: number, next: string) =>
    setDraft((current) => ({ ...current, blanks: current.blanks.map((value, j) => (j === index ? next : value)) }));
  const [announcement, setAnnouncement] = useState("");
  const loaded = useRef(false);

  // Runs before the prefill effect below, so the stored draft and its marker come first.
  useEffect(() => {
    const stored = loadDraft();
    if (stored) setDraft(stored);
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (loaded.current) saveDraft(draft);
  }, [draft]);

  // Sentence 5 follows the chosen role until the visitor edits it (see prefillOwner).
  const role = ownerLocked && ownerAccepted(owner) ? ownerText(owner, copy) : null;
  useEffect(() => {
    if (role) setDraft((current) => prefillOwner(current, role));
  }, [role]);

  const texts = buildTakeaways({ owner: ownerLocked ? owner : null, blanks, copy });
  const announce = (ok: boolean, title: string) => setAnnouncement(ok ? t.copiedAnnouncement(title) : t.copyFailed);

  // Index of each blank in reading order: offset of its sentence plus the blanks before it.
  const blankAt = (sentence: number, partIndex: number) =>
    t.sentences.slice(0, sentence).flat().filter((part) => typeof part !== "string").length +
    (t.sentences[sentence] ?? []).slice(0, partIndex).filter((part) => typeof part !== "string").length;

  return (
    <>
      <h2 ref={headingRef} tabIndex={-1} id="fr-h-takeaways" className="fr-h2">
        {t.heading}
      </h2>
      <p className="fr-lead">{t.intro}</p>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <div className="fr-takeaways">
        <article className="fr-take" aria-labelledby="fr-take-1">
          <h3 id="fr-take-1" className="fr-h3">
            <span className="fr-take-n" aria-hidden="true">1</span>
            {t.titles[0]}
          </h3>
          <p className="fr-take-text">{texts.rule}</p>
          <CopyButton text={texts.rule} title={t.titles[0]} label={t.copy} copiedLabel={t.copied} onResult={announce} />
        </article>

        <article className="fr-take" aria-labelledby="fr-take-2">
          <h3 id="fr-take-2" className="fr-h3">
            <span className="fr-take-n" aria-hidden="true">2</span>
            {t.titles[1]}
          </h3>
          <p className="fr-small">{t.checkNote}</p>
          <pre className="fr-check" data-testid="fr-check-text">
            {texts.check}
          </pre>
          <CopyButton text={texts.check} title={t.titles[1]} label={t.copy} copiedLabel={t.copied} onResult={announce} />
        </article>

        <article className="fr-take fr-take-form" aria-labelledby="fr-take-3">
          <h3 id="fr-take-3" className="fr-h3">
            <span className="fr-take-n" aria-hidden="true">3</span>
            {t.titles[2]}
          </h3>
          <p className="fr-small">{t.sentencesNote}</p>
          <ol className="fr-sentences">
            {t.sentences.map((parts, sentence) => (
              <li key={sentence} className="fr-sentence">
                <p className="fr-sentence-text">
                  {parts.map((part, i) => {
                    if (typeof part === "string") return <span key={i}>{part}</span>;
                    const value = blanks[blankAt(sentence, i)] ?? "";
                    return (
                      <span key={i} className="fr-blank" data-filled={value.trim() ? "" : undefined}>
                        {value.trim() ? value : t.blank}
                      </span>
                    );
                  })}
                </p>
                <div className="fr-sentence-fields">
                  {parts.map((part, i) => {
                    if (typeof part === "string") return null;
                    const index = blankAt(sentence, i);
                    const id = `fr-blank-${index}`;
                    return (
                      <div key={i} className="fr-field">
                        <label htmlFor={id} className="fr-label">
                          {part.label}
                        </label>
                        <BlankField
                          id={id}
                          value={blanks[index] ?? ""}
                          onChange={(next) => setBlank(index, next)}
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="fr-example">
                  <span>{t.examplePrefix}</span> {t.examples[sentence]}
                </p>
              </li>
            ))}
          </ol>
          <CopyButton text={texts.sentences} title={t.titles[2]} label={t.copy} copiedLabel={t.copied} onResult={announce} />
        </article>
      </div>
    </>
  );
}
