import "server-only";

import type { Element, ElementContent, Root, RootContent } from "hast";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import rehypeAutolink from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { parseDirective, type Directive } from "@/lib/book-directives";
import "./chapter-markdown.css";
import {
  CalloutRenderer,
  resolveCalloutStyle,
} from "./callout-renderer";

interface ChapterMarkdownProps {
  readonly rawMarkdown: string;
  readonly locale: Locale;
}

const TABLE_SCROLL_LABEL = {
  de: "Tabelle, horizontal scrollbar",
  en: "Table, horizontally scrollable",
} as const;

function localizeSafeLink(href: string, locale: Locale): string {
  const safeHref = defaultUrlTransform(href);
  return safeHref.startsWith("/") && !safeHref.startsWith("//")
    ? localizeHref(safeHref, locale)
    : safeHref;
}

/**
 * Reference React renderer retained as an output-equivalence oracle.
 * Production chapter pages use the opaque HTML renderer below so React never
 * hydrates the individual Markdown descendants.
 */
export function ChapterMarkdownReactTree({
  rawMarkdown,
  locale,
}: ChapterMarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSlug, [rehypeAutolink, { behavior: "wrap" }]]}
      components={{
        blockquote: ({ children }) => (
          <CalloutRenderer>{children}</CalloutRenderer>
        ),
        a: ({ href, title, children }) => (
          <a
            href={href ? localizeSafeLink(href, locale) : href}
            title={title}
          >
            {children}
          </a>
        ),
        input: ({ type, node: _node, ...rest }) => {
          void _node;
          return type === "checkbox" ? (
            <input
              type="checkbox"
              {...rest}
              aria-hidden="true"
              tabIndex={-1}
            />
          ) : (
            <input type={type} {...rest} />
          );
        },
        table: ({ children }) => (
          <div
            className={TABLE_WRAP_CLASS}
            data-horizontal-scroll
            tabIndex={0}
            role="group"
            aria-label={TABLE_SCROLL_LABEL[locale]}
          >
            <table>{children}</table>
          </div>
        ),
      }}
    >
      {rawMarkdown}
    </ReactMarkdown>
  );
}

/** The scroll wrapper of a table: narrow first columns break between words, never inside a word. */
const TABLE_WRAP_CLASS =
  "max-w-full overflow-x-auto overscroll-x-contain [&_td]:[hyphens:manual] [&_td]:[overflow-wrap:normal] [&_th]:[hyphens:manual] [&_th]:[overflow-wrap:normal] [&_td:first-child]:min-w-[8rem] [&_th:first-child]:min-w-[8rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange";

function textContent(node: RootContent | ElementContent): string {
  if (node.type === "text") return node.value;
  if ("children" in node) return node.children.map(textContent).join("");
  return "";
}

function firstStrongLabel(node: Element): string | null {
  const stack: Array<RootContent | ElementContent> = [...node.children];
  while (stack.length > 0) {
    const current = stack.shift();
    if (!current) continue;
    if (current.type === "element" && current.tagName === "strong") {
      const value = textContent(current).trim();
      return value.endsWith(":") ? value.slice(0, -1).trim() : value;
    }
    if ("children" in current) stack.unshift(...current.children);
  }
  return null;
}

function classNames(value: string): string[] {
  return value.split(/\s+/).filter(Boolean);
}

function transformElement(element: Element, locale: Locale): Element {
  element.children = transformChildren(element.children, locale);

  // Sanitize every URL-bearing property the Markdown pipeline can emit before
  // any locale transformation. Raw HTML is escaped below, so href/src cover
  // the generated HAST surface without accepting attacker-defined elements.
  for (const property of ["href", "src"] as const) {
    const value = element.properties[property];
    if (typeof value === "string") {
      element.properties[property] = defaultUrlTransform(value);
    }
  }

  if (element.tagName === "a") {
    const href = element.properties.href;
    const title = element.properties.title;
    element.properties = {
      href:
        typeof href === "string"
          ? localizeSafeLink(href, locale)
          : href,
      title: typeof title === "string" ? title : undefined,
    };
    return element;
  }

  if (
    element.tagName === "input" &&
    element.properties.type === "checkbox"
  ) {
    element.properties.ariaHidden = "true";
    element.properties.tabIndex = -1;
    return element;
  }

  if (element.tagName === "table") {
    removeTableFormattingWhitespace(element);
    labelTableCells(element);
    return {
      type: "element",
      tagName: "div",
      properties: {
        className: classNames(TABLE_WRAP_CLASS),
        dataHorizontalScroll: "true",
        tabIndex: 0,
        role: "group",
        ariaLabel: TABLE_SCROLL_LABEL[locale],
      },
      children: [element],
    };
  }

  if (element.tagName === "blockquote") {
    const label = firstStrongLabel(element);
    const style = resolveCalloutStyle(label);
    if (!style) {
      element.properties = {
        className: classNames(
          "not-prose my-4 border-l-4 border-border bg-card/20 px-4 py-3 text-sm text-foreground/80 italic",
        ),
      };
      return element;
    }

    return {
      type: "element",
      tagName: "div",
      properties: {
        className: classNames(
          style.endBox
            ? `not-prose mt-10 mb-4 ${style.border} ${style.bg} px-5 py-4`
            : `not-prose my-4 rounded-r px-4 py-3 ${style.border} ${style.bg} ${style.mono ? "font-mono text-xs" : ""}`,
        ),
        role: "note",
        ariaLabel: label ?? undefined,
        dataEndbox: style.endBox ? "true" : undefined,
      },
      children: [
        {
          type: "element",
          tagName: "div",
          properties: {
            className: classNames(
              "text-sm leading-relaxed text-foreground/90",
            ),
          },
          children: element.children,
        },
      ],
    };
  }

  return element;
}

/** A table of four or more columns stacks into cards on phones (chapter-markdown.css): each cell carries its column name. */
const STACK_FROM_COLUMNS = 4;

function labelTableCells(table: Element): void {
  const elements = (node: Element): Element[] => node.children.filter((c): c is Element => c.type === "element");
  const head = elements(table).find((child) => child.tagName === "thead");
  const body = elements(table).find((child) => child.tagName === "tbody");
  const headRow = head ? elements(head).find((row) => row.tagName === "tr") : undefined;
  if (!headRow || !body) return;
  const labels = elements(headRow).map((cell) => textContent(cell).trim());
  if (labels.length < STACK_FROM_COLUMNS) return;
  for (const row of elements(body)) {
    elements(row).forEach((cell, index) => {
      if (cell.tagName === "td" && labels[index] && textContent(cell).trim() !== "") cell.properties = { ...cell.properties, dataLabel: labels[index] };
    });
  }
  table.properties = { ...table.properties, className: ["md-stack"] };
}

function removeTableFormattingWhitespace(element: Element): void {
  element.children = element.children.filter(
    (child) => child.type !== "text" || child.value.trim() !== "",
  );
  for (const child of element.children) {
    if (child.type === "element") removeTableFormattingWhitespace(child);
  }
}

function transformChildren(
  children: ElementContent[],
  locale: Locale,
): ElementContent[];
function transformChildren(
  children: RootContent[],
  locale: Locale,
): RootContent[];
function transformChildren(
  children: Array<RootContent | ElementContent>,
  locale: Locale,
): Array<RootContent | ElementContent> {
  return children.map((child) => {
    if (child.type === "raw") {
      // ReactMarkdown treats raw HTML as text unless rehype-raw is explicitly
      // enabled. Preserve that fail-closed behavior before stringification.
      return { type: "text", value: child.value };
    }
    return child.type === "element" ? transformElement(child, locale) : child;
  });
}

function transformBookTree(tree: Root, locale: Locale): void {
  tree.children = transformChildren(tree.children, locale);
}

/**
 * Render trusted local Markdown to escaped HTML entirely on the server.
 *
 * The returned string is inserted as one opaque article payload. Raw HTML is
 * converted to text and URLs pass ReactMarkdown's protocol allowlist before
 * serialization. React therefore claims the article host but never walks the
 * streamed Markdown descendants that triggered the concurrent cursor race.
 */
export function renderChapterMarkdownHtml({
  rawMarkdown,
  locale,
}: ChapterMarkdownProps): string {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeAutolink, { behavior: "wrap" })
    .use(() => (tree) => transformBookTree(tree as Root, locale))
    .use(rehypeStringify);

  return String(processor.processSync(rawMarkdown));
}

/** One piece of a chapter: a run of rendered Markdown, or a directive line that stands for a figure. */
export type ChapterSegment =
  | { readonly kind: "html"; readonly html: string }
  | { readonly kind: "directive"; readonly directive: Directive };

function directiveOf(node: RootContent): Directive | null {
  if (node.type !== "element" || node.tagName !== "p") return null;
  const text = textContent(node).trim();
  return text.startsWith("::") ? parseDirective(text) : null;
}

/**
 * Renders a chapter as a list of segments. The Markdown is parsed and
 * transformed once (heading ids stay unique across the whole chapter), then
 * cut at the directive paragraphs; each run of nodes between two directives
 * becomes one opaque HTML string. The reader renders the HTML segments as
 * opaque payloads and places a figure island for every directive, so React
 * still never walks the Markdown descendants.
 */
export function renderChapterSegments({
  rawMarkdown,
  locale,
}: ChapterMarkdownProps): ChapterSegment[] {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeAutolink, { behavior: "wrap" })
    .use(() => (tree) => transformBookTree(tree as Root, locale));
  const tree = processor.runSync(processor.parse(rawMarkdown)) as Root;
  const stringifier = unified().use(rehypeStringify);

  const segments: ChapterSegment[] = [];
  let run: RootContent[] = [];
  const flush = (): void => {
    const meaningful = run.filter((node) => node.type !== "text" || node.value.trim() !== "");
    if (meaningful.length > 0) {
      segments.push({ kind: "html", html: String(stringifier.stringify({ type: "root", children: meaningful })) });
    }
    run = [];
  };
  for (const node of tree.children) {
    const directive = directiveOf(node);
    if (directive) {
      flush();
      segments.push({ kind: "directive", directive });
    } else {
      run.push(node);
    }
  }
  flush();
  return segments;
}
