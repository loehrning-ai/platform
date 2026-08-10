import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ChapterMarkdownReactTree,
  renderChapterMarkdownHtml,
} from "./chapter-markdown";

function parseOpaqueHtml(markdown: string, locale: "de" | "en") {
  const article = document.createElement("article");
  article.innerHTML = renderChapterMarkdownHtml({
    rawMarkdown: markdown,
    locale,
  });
  return article;
}

function withCanonicalAttributeOrder<T extends HTMLElement>(element: T): T {
  const clone = element.cloneNode(true) as T;
  for (const node of [clone, ...clone.querySelectorAll("*")]) {
    const attributes = [...node.attributes].sort((left, right) =>
      left.name.localeCompare(right.name),
    );
    for (const attribute of attributes) node.removeAttribute(attribute.name);
    for (const attribute of attributes) {
      node.setAttribute(attribute.name, attribute.value);
    }
  }
  return clone;
}

function reparseElement(element: HTMLElement): Element {
  const template = document.createElement("template");
  template.innerHTML = element.outerHTML;
  const parsed = template.content.firstElementChild;
  if (!parsed) throw new Error("Expected a parsed contract root.");
  return parsed;
}

const CONTRACT_MARKDOWN = [
  "## A precise heading",
  "",
  "A paragraph with **strong text**, `inline code`, and an [internal link](/eu-ai-act-kurs).",
  "",
  "[External source](https://example.com/source \"Source title\")",
  "",
  "- [x] Verified item",
  "- [ ] Open item",
  "",
  "| Measure | Result |",
  "|---|---|",
  "| Exposure | Limited |",
  "",
  "> **Note:** This is a recognized callout.",
  "",
  "> **Unclassified:** This remains a blockquote.",
  "",
  "```ts",
  "const value = 1;",
  "",
  "return value;",
  "```",
].join("\n");

describe("opaque chapter Markdown renderer", () => {
  it.each(["de", "en"] as const)(
    "preserves the reference renderer DOM contract in %s",
    (locale) => {
      const reference = render(
        <article>
          <ChapterMarkdownReactTree
            rawMarkdown={CONTRACT_MARKDOWN}
            locale={locale}
          />
        </article>,
      ).container.querySelector("article");
      const opaque = parseOpaqueHtml(CONTRACT_MARKDOWN, locale);

      expect(reference).not.toBeNull();
      const opaqueContract = reparseElement(
        withCanonicalAttributeOrder(opaque),
      );
      const referenceContract = reference
        ? reparseElement(withCanonicalAttributeOrder(reference))
        : null;
      expect(opaqueContract.isEqualNode(referenceContract)).toBe(true);
      expect(opaque.querySelector("pre code")?.textContent).toBe(
        "const value = 1;\n\nreturn value;\n",
      );
      expect(opaque.querySelector("h2")?.id).toBe("a-precise-heading");
      expect(opaque.querySelector("h2 > a")?.getAttribute("href")).toBe(
        "#a-precise-heading",
      );
      expect(
        opaque.querySelector('[role="group"][data-horizontal-scroll]'),
      ).toHaveAttribute(
        "aria-label",
        locale === "de"
          ? "Tabelle, horizontal scrollbar"
          : "Table, horizontally scrollable",
      );
      for (const checkbox of opaque.querySelectorAll(
        'input[type="checkbox"]',
      )) {
        expect(checkbox).toHaveAttribute("aria-hidden", "true");
        expect(checkbox).toHaveAttribute("tabindex", "-1");
      }
      expect(opaque.querySelector('[role="note"]')).toHaveAttribute(
        "aria-label",
        "Note",
      );
      expect(opaque.querySelector("blockquote")).toHaveTextContent(
        "Unclassified: This remains a blockquote.",
      );
    },
  );

  it("localizes only safe root-relative links", () => {
    const markdown = [
      "[Internal](/kurse)",
      "[Fragment](#section)",
      "[External](https://example.com/path)",
      "[Protocol relative](//example.com/path)",
    ].join("\n\n");

    const english = parseOpaqueHtml(markdown, "en");
    const german = parseOpaqueHtml(markdown, "de");

    expect(english.querySelector('a[href="/en/kurse"]')).not.toBeNull();
    expect(german.querySelector('a[href="/kurse"]')).not.toBeNull();
    expect(english.querySelector('a[href="#section"]')).not.toBeNull();
    expect(
      english.querySelector('a[href="https://example.com/path"]'),
    ).not.toBeNull();
    expect(
      english.querySelector('a[href="//example.com/path"]'),
    ).not.toBeNull();
  });

  it("escapes raw HTML and strips executable Markdown URL schemes", () => {
    const maliciousMarkdown = [
      '<script data-test="raw-script">globalThis.pwned = true</script>',
      '<img data-test="raw-image" src="x" onerror="globalThis.pwned = true">',
      "<svg onload=alert(1)><a href=javascript:alert(1)>x</a></svg>",
      "",
      "[Unsafe link](javascript:alert(1))",
      "",
      "[Unsafe VBScript link](vbscript:msgbox(1))",
      "",
      "[Unsafe data link](data:text/html;base64,PHNjcmlwdD4=)",
      "",
      "![Unsafe image](javascript:alert(1))",
      "",
      "![Unsafe VBScript image](vbscript:msgbox(1))",
      "",
      "![Unsafe data image](data:text/html;base64,PHN2Zz4=)",
      "",
      "[Safe mail](mailto:security@example.com)",
    ].join("\n");
    const opaque = parseOpaqueHtml(maliciousMarkdown, "en");

    expect(opaque.querySelector("script")).toBeNull();
    expect(opaque.querySelector('[data-test="raw-image"]')).toBeNull();
    expect(opaque.querySelector("svg")).toBeNull();
    expect(opaque.textContent).toContain("<script");
    expect(opaque.textContent).toContain("<svg");
    expect(
      opaque.querySelector('a[href^="javascript" i]'),
    ).toBeNull();
    expect(
      opaque.querySelector('img[src^="javascript" i]'),
    ).toBeNull();
    for (const label of [
      "Unsafe link",
      "Unsafe VBScript link",
      "Unsafe data link",
    ]) {
      const link = [...opaque.querySelectorAll("a")].find(
        (candidate) => candidate.textContent === label,
      );
      expect(link, label).toBeDefined();
      expect(link?.getAttribute("href") ?? "", label).toBe("");
    }
    for (const alt of [
      "Unsafe image",
      "Unsafe VBScript image",
      "Unsafe data image",
    ]) {
      const image = opaque.querySelector(`img[alt="${alt}"]`);
      expect(image, alt).not.toBeNull();
      expect(image?.getAttribute("src") ?? "", alt).toBe("");
    }
    expect(opaque.querySelector("[onerror], [onload]")).toBeNull();
    expect(
      opaque.querySelector('a[href="mailto:security@example.com"]'),
    ).not.toBeNull();
  });
});
