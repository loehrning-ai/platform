/**
 * Renders a parsed question sheet (src/lib/vorlagen/question-sheet.ts) inside
 * a Werkzeichnung article (post-wz.css): the one boxed object on the page,
 * with groups as sections and questions as numbered rows.
 *
 * Server component. Every string is rendered as React text; the only markup
 * read from the Markdown source is a bare https URL, which becomes a link.
 * Legal references are kept on one line (keepLegalRefsTogether). URLs may
 * break only after a slash, never at a hyphen, so a wrapped URL is never
 * mistaken for a hyphenated word on paper. In the English sheet the German
 * terms it quotes carry lang="de" (WCAG 3.1.2).
 *
 * Headings: H3 sheet title, H4 group titles and sheet sub-sections, H5
 * questions. Each question is <li id="frage-{n}">, so a page can link to it,
 * and its H5 starts with the visible number square, so heading navigation
 * announces "Frage 3" / "Question 3" as the printed sheet shows it.
 */

import { Fragment, type ReactNode } from "react";
import {
  SHEET_LABELS,
  type QuestionSheet,
  type SheetLocale,
} from "@/lib/vorlagen/question-sheet";
import { keepLegalRefsTogether } from "./legal-text";

const URL_IN_TEXT = /https:\/\/[^\s<>"')]+[^\s<>"').,;:]/g;

/** German terms the English sheet quotes, marked for screen-reader voices. */
const GERMAN_TERMS_IN_ENGLISH = [
  "Jugend- und Auszubildendenvertretung",
  "Bundesarbeitsgericht",
  "Berichtsheft",
] as const;

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const GERMAN_TERM = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:${GERMAN_TERMS_IN_ENGLISH.map(escapeRegExp).join("|")})(?![\\p{L}\\p{N}])`,
  "gu",
);

const QUESTION_WORD: Record<SheetLocale, string> = {
  de: "Frage",
  en: "Question",
};

/**
 * "https://loehrning.ai/blog/ki-in-der-ausbildung" ->
 * ["https://loehrning.ai/", "blog/", "ki-in-der-ausbildung"].
 */
function urlParts(url: string): string[] {
  return url.match(/^https:\/\/[^/]+\/?|[^/]+\/?/g) ?? [url];
}

/** A URL that wraps only after a slash (each part is white-space: nowrap). */
export function UrlText({ url }: { url: string }): ReactNode {
  return urlParts(url).map((part, index) => (
    <Fragment key={index}>
      {index > 0 ? <wbr /> : null}
      <span className="wz-url__part">{part}</span>
    </Fragment>
  ));
}

/** Plain text: legal references kept together, German terms tagged in EN. */
function Words({ text, locale }: { text: string; locale: SheetLocale }): ReactNode {
  if (locale !== "en") return keepLegalRefsTogether(text);
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(GERMAN_TERM)) {
    parts.push(keepLegalRefsTogether(text.slice(last, match.index)));
    parts.push(
      <span lang="de" key={`de-${match.index}`}>
        {match[0]}
      </span>,
    );
    last = match.index + match[0].length;
  }
  parts.push(keepLegalRefsTogether(text.slice(last)));
  return parts.map((part, index) => <Fragment key={index}>{part}</Fragment>);
}

/** Sheet text with bare https URLs turned into links. */
function Inline({ text, locale }: { text: string; locale: SheetLocale }): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_IN_TEXT)) {
    parts.push(<Words text={text.slice(last, match.index)} locale={locale} />);
    parts.push(
      <a className="wz-url" href={match[0]}>
        <UrlText url={match[0]} />
      </a>,
    );
    last = match.index + match[0].length;
  }
  parts.push(<Words text={text.slice(last)} locale={locale} />);
  return parts.map((part, index) => <Fragment key={index}>{part}</Fragment>);
}

const withoutColon = (label: string) => label.replace(/:$/, "");

export function QuestionSheetView({
  sheet,
  locale,
  idBase = "fragenliste",
  anchorPrefix = "frage",
}: {
  sheet: QuestionSheet;
  locale: SheetLocale;
  /** Prefix for the heading ids the sections point to with aria-labelledby. */
  idBase?: string;
  /** Question anchors are `${anchorPrefix}-${n}`. */
  anchorPrefix?: string;
}) {
  const labels = SHEET_LABELS[locale];
  const statusLabel = withoutColon(labels.status.replaceAll("**", ""));
  const ids = {
    title: `${idBase}-titel`,
    usage: `${idBase}-einsatz`,
    limits: `${idBase}-grenzen`,
    sources: `${idBase}-quellen`,
    group: (letter: string) => `${idBase}-gruppe-${letter.toLowerCase()}`,
  };
  const text = (value: string) => <Words text={value} locale={locale} />;

  return (
    <article className="wz-sheet" aria-labelledby={ids.title}>
      <header className="wz-sheet__mast">
        <h3 className="wz-sheet__title" id={ids.title}>
          {sheet.meta.title}
        </h3>
        {sheet.intro.map((paragraph) => (
          <p className="wz-sheet__intro" key={paragraph}>
            <Inline text={paragraph} locale={locale} />
          </p>
        ))}
        <p className="wz-sheet__status">
          {statusLabel}: <Inline text={sheet.status} locale={locale} />
        </p>
      </header>

      <section className="wz-steps-block" aria-labelledby={ids.usage}>
        <h4 className="wz-steps__title" id={ids.usage}>
          {labels.usage}
        </h4>
        <ol className="wz-steps" role="list">
          {sheet.usage.steps.map((step) => (
            <li key={step}>{text(step)}</li>
          ))}
        </ol>
        {sheet.usage.after.map((paragraph) => (
          <p className="wz-steps__after" key={paragraph}>
            <Inline text={paragraph} locale={locale} />
          </p>
        ))}
      </section>

      {sheet.groups.map((group) => (
        <section
          className="wz-group"
          aria-labelledby={ids.group(group.letter)}
          key={group.letter}
        >
          <div className="wz-group__head">
            <span className="wz-group__letter">{group.letter}</span>
            <h4 className="wz-group__title" id={ids.group(group.letter)}>
              {text(group.title)}
            </h4>
          </div>
          <ol
            className="wz-qs"
            role="list"
            start={group.questions[0]?.number ?? 1}
          >
            {group.questions.map((question) => (
              <li
                className="wz-q"
                id={`${anchorPrefix}-${question.number}`}
                key={question.number}
              >
                <h5 className="wz-q__head">
                  <span className="wz-q__num">
                    <span className="sr-only">{QUESTION_WORD[locale]}</span>{" "}
                    {question.number}
                  </span>{" "}
                  <span className="wz-q__text">{text(question.text)}</span>
                </h5>
                <div className="wz-q__basis">
                  <span className="wz-q__label">
                    {withoutColon(labels.legalBasis)}
                  </span>
                  <p>{text(question.legalBasis)}</p>
                </div>
                <div className="wz-q__answer">
                  <span className="wz-q__label">{labels.answer}</span>{" "}
                  <p>{text(question.answer)}</p>
                </div>
                {question.note ? (
                  <p className="wz-q__aside" data-kind="note">
                    <span>
                      <b>{withoutColon(labels.note)}.</b> {text(question.note)}
                    </span>
                  </p>
                ) : null}
                {question.open ? (
                  <p className="wz-q__aside wz-q__aside--open" data-kind="open">
                    <span>
                      <b>{withoutColon(labels.open)}.</b> {text(question.open)}
                    </span>
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ))}

      <section className="wz-sheet__limits" aria-labelledby={ids.limits}>
        <h4 id={ids.limits}>{labels.limits}</h4>
        {sheet.limits.map((paragraph) => (
          <p key={paragraph}>
            <Inline text={paragraph} locale={locale} />
          </p>
        ))}
      </section>

      {/* Hidden on screen (the page lists its own sources); printed with the sheet. */}
      <section className="wz-sheet__sources" aria-labelledby={ids.sources}>
        <h4 id={ids.sources}>{labels.sources}</h4>
        <ul>
          {sheet.meta.sources.map((source) => (
            <li key={source.url}>
              {source.title}: <UrlText url={source.url} />
            </li>
          ))}
        </ul>
      </section>

      <p className="wz-sheet__licence">
        {sheet.meta.license} · <LicenceAttribution text={sheet.meta.attribution} />
      </p>
    </article>
  );
}

/** The attribution line as text, its URL wrapping only after a slash. */
function LicenceAttribution({ text }: { text: string }): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_IN_TEXT)) {
    parts.push(text.slice(last, match.index));
    parts.push(<UrlText url={match[0]} />);
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return parts.map((part, index) => <Fragment key={index}>{part}</Fragment>);
}
