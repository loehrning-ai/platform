/**
 * A strict, safe Markdown subset for recorded Claude answers (claude-desktop-
 * spec 5.3): paragraphs, headings, bold, italics, inline code, code blocks,
 * lists, GFM tables, rules and quotes. It builds React nodes, never HTML
 * strings. While an answer streams, an unfinished construct at the edge
 * (half a table, an open **) is drawn as plain text until it closes.
 */

import { Fragment, type ReactNode } from "react";

/** One list item; an indented list under it is its sub-list. */
export interface MdListItem {
  readonly text: string;
  readonly sub?: MdList;
}

export interface MdList {
  readonly type: "list";
  readonly ordered: boolean;
  readonly start: number;
  readonly items: readonly MdListItem[];
}

export type MdBlock =
  | { readonly type: "heading"; readonly level: number; readonly text: string }
  | { readonly type: "paragraph"; readonly text: string }
  | MdList
  | { readonly type: "table"; readonly head: readonly string[]; readonly align: readonly ("left" | "right" | "center")[]; readonly rows: readonly (readonly string[])[] }
  | { readonly type: "code"; readonly text: string }
  | { readonly type: "quote"; readonly text: string }
  | { readonly type: "rule" };

const TABLE_SEPARATOR = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function cells(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, "|"));
}

const LIST_ITEM = /^(\s*)(?:([-*+])|(\d+)[.)])\s+(.*)$/;

const indentOf = (line: string) => (/^\s*/.exec(line)?.[0] ?? "").replace(/\t/g, "    ").length;

/**
 * A list from `start`, with its nested lists: an item indented deeper than
 * the list opens a sub-list under the item before it, a deeper plain line
 * continues that item, and a blank line between two items keeps the list.
 */
function parseList(lines: readonly string[], start: number): { readonly list: MdList; readonly next: number } {
  const first = LIST_ITEM.exec(lines[start] as string) as RegExpExecArray;
  const indent = indentOf(lines[start] as string);
  const ordered = Boolean(first[3]);
  const items: { text: string; sub?: MdList }[] = [];
  let index = start;
  while (index < lines.length) {
    const line = lines[index] as string;
    const match = LIST_ITEM.exec(line);
    const depth = indentOf(line);
    if (match && depth === indent && Boolean(match[3]) === ordered) {
      items.push({ text: match[4] as string });
      index += 1;
    } else if (match && depth > indent && items.length > 0) {
      const nested = parseList(lines, index);
      const last = items[items.length - 1] as { text: string; sub?: MdList };
      last.sub = last.sub ? { ...last.sub, items: [...last.sub.items, ...nested.list.items] } : nested.list;
      index = nested.next;
    } else if (!match && line.trim() && depth > indent && items.length > 0) {
      const last = items[items.length - 1] as { text: string; sub?: MdList };
      last.text += ` ${line.trim()}`;
      index += 1;
    } else if (!line.trim()) {
      let ahead = index + 1;
      while (ahead < lines.length && !(lines[ahead] as string).trim()) ahead += 1;
      const following = ahead < lines.length ? LIST_ITEM.exec(lines[ahead] as string) : null;
      const followingDepth = ahead < lines.length ? indentOf(lines[ahead] as string) : -1;
      if (following && (followingDepth > indent || (followingDepth === indent && Boolean(following[3]) === ordered))) index = ahead;
      else break;
    } else break;
  }
  return { list: { type: "list", ordered, start: ordered ? Number(first[3]) : 1, items }, next: index };
}

/** Parses Markdown into blocks. Pure. */
export function parseMarkdown(source: string): readonly MdBlock[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MdBlock[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] as string;
    if (!line.trim()) {
      index += 1;
      continue;
    }
    const fence = /^\s*```/.exec(line);
    if (fence) {
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !/^\s*```/.test(lines[index] as string)) {
        body.push(lines[index] as string);
        index += 1;
      }
      index += 1;
      blocks.push({ type: "code", text: body.join("\n") });
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: (heading[1] as string).length, text: (heading[2] as string).trim() });
      index += 1;
      continue;
    }
    if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(line)) {
      blocks.push({ type: "rule" });
      index += 1;
      continue;
    }
    if (line.includes("|") && index + 1 < lines.length && TABLE_SEPARATOR.test(lines[index + 1] as string)) {
      const head = cells(line);
      const align = cells(lines[index + 1] as string).map((cell) => (cell.startsWith(":") && cell.endsWith(":") ? "center" : cell.endsWith(":") ? "right" : "left") as "left" | "right" | "center");
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && (lines[index] as string).includes("|") && (lines[index] as string).trim()) {
        rows.push(cells(lines[index] as string));
        index += 1;
      }
      blocks.push({ type: "table", head, align, rows });
      continue;
    }
    if (LIST_ITEM.test(line)) {
      const { list, next } = parseList(lines, index);
      blocks.push(list);
      index = next;
      continue;
    }
    if (/^\s*>/.test(line)) {
      const body: string[] = [];
      while (index < lines.length && /^\s*>/.test(lines[index] as string)) {
        body.push((lines[index] as string).replace(/^\s*>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", text: body.join(" ") });
      continue;
    }
    const body: string[] = [];
    while (index < lines.length) {
      const current = lines[index] as string;
      if (!current.trim() || /^(#{1,6})\s/.test(current) || /^\s*```/.test(current) || /^\s*(?:[-*+]|\d+[.)])\s+/.test(current) || /^\s*>/.test(current)) break;
      if (current.includes("|") && index + 1 < lines.length && TABLE_SEPARATOR.test(lines[index + 1] as string)) break;
      body.push(current);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: body.join("\n") });
  }
  return blocks;
}

type Inline = { readonly kind: "text" | "strong" | "em" | "code"; readonly text: string } | { readonly kind: "break" };

/** Inline Markdown into spans. At the stream edge, an unmatched opener is dropped instead of shown. */
export function parseInline(text: string, edge = false): readonly Inline[] {
  const out: Inline[] = [];
  // An underscore inside a word (strom_2025.csv) is a letter, never emphasis: _ and __ only open and close at a word edge.
  const pattern =
    /(`[^`\n]+`)|(\*\*[^*\n](?:[^*\n]|\*(?!\*))*?\*\*)|((?<![\p{L}\p{N}_])__[^_\n]+__(?![\p{L}\p{N}_]))|(\*[^*\s][^*\n]*?\*)|((?<![\p{L}\p{N}_])_[^_\s][^_\n]*?_(?![\p{L}\p{N}_]))|(\n)/gu;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (at > last) out.push({ kind: "text", text: text.slice(last, at) });
    const token = match[0];
    if (match[1]) out.push({ kind: "code", text: token.slice(1, -1) });
    else if (match[2] || match[3]) out.push({ kind: "strong", text: token.slice(2, -2) });
    else if (match[4] || match[5]) out.push({ kind: "em", text: token.slice(1, -1) });
    else out.push({ kind: "break" });
    last = at + token.length;
  }
  if (last < text.length) {
    let tail = text.slice(last);
    if (edge) tail = tail.replace(/(\*\*|`|\*|(?<![\p{L}\p{N}_])__|(?<![\p{L}\p{N}_])_)(?=[^*_`]*$)/u, "");
    out.push({ kind: "text", text: tail });
  }
  return out;
}

/** Turns plain text into nodes (a demo can make file citations tappable); the text itself never changes. */
export type RenderText = (text: string) => ReactNode;

function renderInline(text: string, edge = false, renderText?: RenderText): ReactNode {
  const plain = (value: string) => (renderText ? renderText(value) : value);
  return parseInline(text, edge).map((part, index) => {
    if (part.kind === "break") return <br key={index} />;
    if (part.kind === "strong") return <strong key={index}>{plain(part.text)}</strong>;
    if (part.kind === "em") return <em key={index}>{plain(part.text)}</em>;
    if (part.kind === "code") return <code key={index}>{plain(part.text)}</code>;
    return <Fragment key={index}>{plain(part.text)}</Fragment>;
  });
}

function ListView({ list, edge, renderText }: { readonly list: MdList; readonly edge: boolean; readonly renderText?: RenderText }) {
  const items = list.items.map((item, position) => {
    const last = edge && position === list.items.length - 1;
    return (
      <li key={position}>
        {renderInline(item.text, last && !item.sub, renderText)}
        {item.sub ? <ListView list={item.sub} edge={last} renderText={renderText} /> : null}
      </li>
    );
  });
  return list.ordered ? <ol start={list.start}>{items}</ol> : <ul>{items}</ul>;
}

/**
 * Renders Markdown as React. `streaming` marks the last block as the stream
 * edge: an unfinished table header shows as plain text, an open marker is
 * dropped.
 */
export function MarkdownLite({
  source,
  streaming = false,
  tableLabel,
  renderText,
}: {
  readonly source: string;
  readonly streaming?: boolean;
  /** When set, wide tables become a focusable, named scroll region (the transcript); else plain. */
  readonly tableLabel?: string;
  /** Optional: draws plain text runs (paragraphs, list items, cells, inline code). */
  readonly renderText?: RenderText;
}) {
  const blocks = parseMarkdown(source);
  return (
    <>
      {blocks.map((block, index) => {
        const edge = streaming && index === blocks.length - 1;
        switch (block.type) {
          case "heading": {
            const level = Math.min(6, Math.max(3, block.level + 2));
            const Tag = `h${level}` as "h3" | "h4" | "h5" | "h6";
            return <Tag key={index}>{renderInline(block.text, edge, renderText)}</Tag>;
          }
          case "paragraph":
            return <p key={index}>{renderInline(block.text, edge, renderText)}</p>;
          case "list":
            return <ListView key={index} list={block} edge={edge} renderText={renderText} />;
          case "table":
            // One record over many columns is drawn as label and value per line, so no column hides off to the side.
            if (block.rows.length === 1 && block.head.length >= 5) {
              const row = block.rows[0] as readonly string[];
              return (
                <div key={index} className="cds-table" data-record="" role={tableLabel ? "region" : undefined} aria-label={tableLabel} tabIndex={tableLabel ? 0 : undefined}>
                  <table>
                    <tbody>
                      {block.head.map((cell, position) => (
                        <tr key={position}>
                          <th scope="row">{renderInline(cell, false, renderText)}</th>
                          <td>{renderInline(row[position] ?? "", false, renderText)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
            return (
              <div key={index} className="cds-table" role={tableLabel ? "region" : undefined} aria-label={tableLabel} tabIndex={tableLabel ? 0 : undefined}>
                <table>
                  <thead>
                    <tr>
                      {block.head.map((cell, position) => (
                        <th key={position} style={{ textAlign: block.align[position] ?? "left" }}>
                          {renderInline(cell, false, renderText)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {block.head.map((_, position) => (
                          <td key={position} style={{ textAlign: block.align[position] ?? "left" }}>
                            {renderInline(row[position] ?? "", false, renderText)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "code":
            return (
              <pre key={index}>
                <code>{block.text}</code>
              </pre>
            );
          case "quote":
            return <blockquote key={index}>{renderInline(block.text, edge, renderText)}</blockquote>;
          case "rule":
            return <hr key={index} />;
          default:
            return null;
        }
      })}
    </>
  );
}
