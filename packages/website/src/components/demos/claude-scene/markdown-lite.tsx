/**
 * A strict, safe Markdown subset for recorded Claude answers (claude-desktop-
 * spec 5.3): paragraphs, headings, bold, italics, inline code, code blocks,
 * lists, GFM tables, rules and quotes. It builds React nodes, never HTML
 * strings. While an answer streams, an unfinished construct at the edge
 * (half a table, an open **) is drawn as plain text until it closes.
 */

import { Fragment, type ReactNode } from "react";

export type MdBlock =
  | { readonly type: "heading"; readonly level: number; readonly text: string }
  | { readonly type: "paragraph"; readonly text: string }
  | { readonly type: "list"; readonly ordered: boolean; readonly start: number; readonly items: readonly string[] }
  | { readonly type: "table"; readonly head: readonly string[]; readonly align: readonly ("left" | "right" | "center")[]; readonly rows: readonly (readonly string[])[] }
  | { readonly type: "code"; readonly text: string }
  | { readonly type: "quote"; readonly text: string }
  | { readonly type: "rule" };

const TABLE_SEPARATOR = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function cells(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, "|"));
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
    const listItem = /^\s*(?:([-*+])|(\d+)[.)])\s+(.*)$/.exec(line);
    if (listItem) {
      const ordered = Boolean(listItem[2]);
      const start = ordered ? Number(listItem[2]) : 1;
      const items: string[] = [];
      while (index < lines.length) {
        const current = lines[index] as string;
        const match = /^\s*(?:([-*+])|(\d+)[.)])\s+(.*)$/.exec(current);
        if (match && Boolean(match[2]) === ordered) {
          items.push(match[3] as string);
          index += 1;
        } else if (current.trim() && /^\s{2,}\S/.test(current) && items.length > 0) {
          items[items.length - 1] += ` ${current.trim()}`;
          index += 1;
        } else break;
      }
      blocks.push({ type: "list", ordered, start, items });
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
  const pattern = /(`[^`\n]+`)|(\*\*[^*\n](?:[^*\n]|\*(?!\*))*?\*\*)|(__[^_\n]+__)|(\*[^*\s][^*\n]*?\*)|(_[^_\s][^_\n]*?_)|(\n)/g;
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
    if (edge) tail = tail.replace(/(\*\*|__|`|\*|_)(?=[^*_`]*$)/, "");
    out.push({ kind: "text", text: tail });
  }
  return out;
}

function renderInline(text: string, edge = false): ReactNode {
  return parseInline(text, edge).map((part, index) => {
    if (part.kind === "break") return <br key={index} />;
    if (part.kind === "strong") return <strong key={index}>{part.text}</strong>;
    if (part.kind === "em") return <em key={index}>{part.text}</em>;
    if (part.kind === "code") return <code key={index}>{part.text}</code>;
    return <Fragment key={index}>{part.text}</Fragment>;
  });
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
}: {
  readonly source: string;
  readonly streaming?: boolean;
  /** When set, wide tables become a focusable, named scroll region (the transcript); else plain. */
  readonly tableLabel?: string;
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
            return <Tag key={index}>{renderInline(block.text, edge)}</Tag>;
          }
          case "paragraph":
            return <p key={index}>{renderInline(block.text, edge)}</p>;
          case "list": {
            const items = block.items.map((item, position) => <li key={position}>{renderInline(item, edge && position === block.items.length - 1)}</li>);
            return block.ordered ? (
              <ol key={index} start={block.start}>
                {items}
              </ol>
            ) : (
              <ul key={index}>{items}</ul>
            );
          }
          case "table":
            return (
              <div key={index} className="cds-table" role={tableLabel ? "region" : undefined} aria-label={tableLabel} tabIndex={tableLabel ? 0 : undefined}>
                <table>
                  <thead>
                    <tr>
                      {block.head.map((cell, position) => (
                        <th key={position} style={{ textAlign: block.align[position] ?? "left" }}>
                          {renderInline(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {block.head.map((_, position) => (
                          <td key={position} style={{ textAlign: block.align[position] ?? "left" }}>
                            {renderInline(row[position] ?? "")}
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
            return <blockquote key={index}>{renderInline(block.text, edge)}</blockquote>;
          case "rule":
            return <hr key={index} />;
          default:
            return null;
        }
      })}
    </>
  );
}
