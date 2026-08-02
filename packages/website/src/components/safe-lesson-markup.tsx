import { createElement, Fragment, type ReactNode } from "react";

type AllowedTag = "b" | "br" | "code" | "em" | "p" | "pre" | "span" | "strong";

interface ElementNode {
  readonly type: "element";
  readonly tag: AllowedTag;
  readonly className?: string;
  readonly children: MarkupNode[];
}

type MarkupNode = string | ElementNode;

const ALLOWED_TAGS = new Set<AllowedTag>([
  "b",
  "br",
  "code",
  "em",
  "p",
  "pre",
  "span",
  "strong",
]);

const ALLOWED_SPAN_CLASSES = new Set([
  "accent",
  "chip",
  "tok-c",
  "tok-f",
  "tok-k",
  "tok-n",
  "tok-s",
  "tok-t",
]);

const BLOCKED_CONTENT_TAGS = new Set([
  "iframe",
  "math",
  "noscript",
  "object",
  "script",
  "style",
  "svg",
  "template",
]);

const NAMED_ENTITIES = new Map<string, string>([
  ["amp", "&"],
  ["apos", "'"],
  ["gt", ">"],
  ["ldquo", "\u201c"],
  ["lt", "<"],
  ["nbsp", "\u00a0"],
  ["quot", '"'],
  ["rdquo", "\u201d"],
  ["rsquo", "\u2019"],
]);

function decodeEntity(entity: string): string {
  if (!entity.startsWith("#")) return NAMED_ENTITIES.get(entity) ?? `&${entity};`;

  const hexadecimal = entity[1]?.toLowerCase() === "x";
  const digits = hexadecimal ? entity.slice(2) : entity.slice(1);
  const codePoint = Number.parseInt(digits, hexadecimal ? 16 : 10);
  if (
    !Number.isFinite(codePoint) ||
    codePoint <= 0 ||
    codePoint > 0x10ffff ||
    (codePoint >= 0xd800 && codePoint <= 0xdfff)
  ) {
    return "\ufffd";
  }
  return String.fromCodePoint(codePoint);
}

function decodeEntities(value: string): string {
  return value.replace(
    /&(#(?:x[0-9a-f]+|[0-9]+)|[a-z][a-z0-9]+);/gi,
    (_match, entity: string) => decodeEntity(entity.toLowerCase()),
  );
}

function allowedClassName(tag: AllowedTag, token: string): string | undefined {
  if (tag !== "span") return undefined;

  const match = token.match(/\sclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  const rawClassName = match?.[1] ?? match?.[2];
  if (!rawClassName) return undefined;

  const classes = rawClassName.split(/\s+/).filter((name) => ALLOWED_SPAN_CLASSES.has(name));
  return classes.length > 0 ? classes.join(" ") : undefined;
}

function appendText(nodes: MarkupNode[], value: string): void {
  if (!value) return;
  const decoded = decodeEntities(value);
  const previous = nodes.at(-1);
  if (typeof previous === "string") {
    nodes[nodes.length - 1] = previous + decoded;
    return;
  }
  nodes.push(decoded);
}

function parseMarkup(html: string): MarkupNode[] {
  const root: MarkupNode[] = [];
  const stack: Array<{ tag: AllowedTag | null; children: MarkupNode[] }> = [
    { tag: null, children: root },
  ];
  const blockedTags: string[] = [];
  const tokenPattern = /<!--[\s\S]*?-->|<\/?\s*[a-z][^>]*>|<|[^<]+/gi;

  for (const match of html.matchAll(tokenPattern)) {
    const token = match[0];
    if (token.startsWith("<!--")) continue;

    const tagMatch = token.match(/^<\s*(\/?)\s*([a-z][a-z0-9-]*)/i);
    if (!tagMatch) {
      if (blockedTags.length === 0) appendText(stack.at(-1)!.children, token);
      continue;
    }

    const closing = tagMatch[1] === "/";
    const tagName = tagMatch[2].toLowerCase();
    const selfClosing = /\/\s*>$/.test(token);

    if (blockedTags.length > 0) {
      if (closing) {
        const blockedIndex = blockedTags.lastIndexOf(tagName);
        if (blockedIndex >= 0) blockedTags.length = blockedIndex;
      } else if (BLOCKED_CONTENT_TAGS.has(tagName) && !selfClosing) {
        blockedTags.push(tagName);
      }
      continue;
    }

    if (BLOCKED_CONTENT_TAGS.has(tagName)) {
      if (!closing && !selfClosing) blockedTags.push(tagName);
      continue;
    }

    if (!ALLOWED_TAGS.has(tagName as AllowedTag)) continue;
    const tag = tagName as AllowedTag;

    if (closing) {
      for (let index = stack.length - 1; index > 0; index -= 1) {
        if (stack[index].tag === tag) {
          stack.length = index;
          break;
        }
      }
      continue;
    }

    const node: ElementNode = {
      type: "element",
      tag,
      className: allowedClassName(tag, token),
      children: [],
    };
    stack.at(-1)!.children.push(node);

    if (tag !== "br" && !selfClosing) {
      stack.push({ tag, children: node.children });
    }
  }

  return root;
}

function renderNode(node: MarkupNode, key: string): ReactNode {
  if (typeof node === "string") return node;

  const props: { key: string; className?: string } = { key };
  if (node.className) props.className = node.className;

  return createElement(
    node.tag,
    props,
    ...node.children.map((child, index) => renderNode(child, `${key}.${index}`)),
  );
}

export interface SafeLessonMarkupProps {
  readonly html: string;
}

/**
 * Renders the narrowly scoped formatting vocabulary used by imported lesson
 * content without creating an HTML injection boundary.
 */
export function SafeLessonMarkup({ html }: SafeLessonMarkupProps) {
  return createElement(
    Fragment,
    null,
    ...parseMarkup(html).map((node, index) => renderNode(node, String(index))),
  );
}
