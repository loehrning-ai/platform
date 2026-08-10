import "server-only";

/**
 * Generates a real, complete PDF of a book from its authored chapter
 * markdown (content/books/<slug>/*.md) — not a placeholder. Gated to logged-in
 * users at the route layer (src/app/api/buecher/[slug]/download.pdf/route.ts);
 * this module has no auth logic of its own.
 *
 * @react-pdf/renderer and unified/remark-parse are dynamically imported so
 * this stays out of any client bundle and the (large) PDF layout engine only
 * loads for an actual download request.
 */

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";
import type {
  Blockquote,
  Content,
  Heading,
  InlineCode,
  Link as MdLink,
  List,
  ListItem,
  Paragraph,
  PhrasingContent,
  Root,
  Table,
  TableCell,
  TableRow,
  Text as MdText,
} from "mdast";
import { loadBookManifest, loadBookChapter } from "@/lib/book-reader-content";
import type { Book } from "@/lib/books";

const BRAND_ORANGE = "#a5370f";
const INK = "#0b0908";
const MUTED = "#4f4640";
const BORDER = "#d4cec5";

async function pdfPrimitives() {
  const { Document, Page, Text, View, Link, Font, renderToBuffer } = await import(
    "@react-pdf/renderer"
  );
  // Built-in, always-embeddable PDF fonts — reliable across every reader
  // without registering our variable web fonts (avoids font-embedding risk
  // for a document meant to be portable and printable). Also disable
  // automatic hyphenation: react-pdf's default hyphenator assumes English
  // syllable rules, which mangles German words.
  Font.registerHyphenationCallback((word) => [word]);
  return { Document, Page, Text, View, Link, renderToBuffer };
}

function parseMarkdown(markdown: string): Root {
  return unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
}

/** Renders inline (phrasing) content as an array of Text-compatible nodes. */
function renderInline(
  nodes: readonly PhrasingContent[],
  T: Awaited<ReturnType<typeof pdfPrimitives>>["Text"],
  L: Awaited<ReturnType<typeof pdfPrimitives>>["Link"],
  keyPrefix: string,
): ReactNode[] {
  return nodes.map((node, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (node.type) {
      case "text":
        return (node as MdText).value;
      case "strong":
        return (
          <T key={key} style={{ fontFamily: "Helvetica-Bold" }}>
            {renderInline(node.children, T, L, key)}
          </T>
        );
      case "emphasis":
        return (
          <T key={key} style={{ fontFamily: "Helvetica-Oblique" }}>
            {renderInline(node.children, T, L, key)}
          </T>
        );
      case "inlineCode":
        return (
          <T key={key} style={{ fontFamily: "Courier", fontSize: 9.5 }}>
            {(node as InlineCode).value}
          </T>
        );
      case "link": {
        const linkNode = node as MdLink;
        return (
          <L key={key} src={linkNode.url} style={{ color: BRAND_ORANGE }}>
            {renderInline(linkNode.children, T, L, key)}
          </L>
        );
      }
      case "break":
        return "\n";
      default:
        return "";
    }
  });
}

/** Renders block-level markdown nodes into the PDF document tree. */
function renderBlock(
  node: Content,
  P: Awaited<ReturnType<typeof pdfPrimitives>>,
  keyPrefix: string,
): ReactNode {
  const { Text: T, View: V, Link: L } = P;
  switch (node.type) {
    case "heading": {
      const h = node as Heading;
      const sizeByDepth: Record<number, number> = { 1: 20, 2: 16, 3: 13, 4: 11.5 };
      return (
        <T
          key={keyPrefix}
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: sizeByDepth[h.depth] ?? 11,
            color: INK,
            marginTop: h.depth <= 2 ? 16 : 12,
            marginBottom: 6,
          }}
        >
          {renderInline(h.children, T, L, keyPrefix)}
        </T>
      );
    }
    case "paragraph": {
      const p = node as Paragraph;
      return (
        <T
          key={keyPrefix}
          style={{ fontSize: 10.5, lineHeight: 1.55, color: INK, marginBottom: 8 }}
        >
          {renderInline(p.children, T, L, keyPrefix)}
        </T>
      );
    }
    case "blockquote": {
      const bq = node as Blockquote;
      return (
        <V
          key={keyPrefix}
          style={{
            borderLeft: `2 solid ${BRAND_ORANGE}`,
            paddingLeft: 10,
            marginBottom: 10,
            marginTop: 4,
          }}
        >
          {bq.children.map((child, i) =>
            renderBlock(child, P, `${keyPrefix}-bq-${i}`),
          )}
        </V>
      );
    }
    case "list": {
      const list = node as List;
      return (
        <V key={keyPrefix} style={{ marginBottom: 8 }}>
          {list.children.map((item, i) => {
            const li = item as ListItem;
            const marker = list.ordered ? `${(list.start ?? 1) + i}.` : "•";
            return (
              <V
                key={`${keyPrefix}-li-${i}`}
                wrap={false}
                style={{ flexDirection: "row", marginBottom: 3 }}
              >
                <T style={{ width: 16, fontSize: 10.5, color: BRAND_ORANGE }}>
                  {marker}
                </T>
                <V style={{ flex: 1 }}>
                  {li.children.map((child, ci) =>
                    renderBlock(child, P, `${keyPrefix}-li-${i}-${ci}`),
                  )}
                </V>
              </V>
            );
          })}
        </V>
      );
    }
    case "table": {
      const table = node as Table;
      const rows = table.children as TableRow[];
      return (
        <V
          key={keyPrefix}
          style={{
            marginBottom: 10,
            borderTop: `0.5 solid ${BORDER}`,
            borderLeft: `0.5 solid ${BORDER}`,
          }}
        >
          {rows.map((row, ri) => (
            <V key={`${keyPrefix}-row-${ri}`} wrap={false} style={{ flexDirection: "row" }}>
              {row.children.map((cell, ci) => {
                const c = cell as TableCell;
                return (
                  <V
                    key={`${keyPrefix}-row-${ri}-cell-${ci}`}
                    style={{
                      flex: 1,
                      padding: 5,
                      borderRight: `0.5 solid ${BORDER}`,
                      borderBottom: `0.5 solid ${BORDER}`,
                      backgroundColor: ri === 0 ? "#f5e8e2" : undefined,
                    }}
                  >
                    <T
                      style={{
                        fontSize: 9,
                        lineHeight: 1.4,
                        fontFamily: ri === 0 ? "Helvetica-Bold" : "Helvetica",
                        color: ri === 0 ? BRAND_ORANGE : INK,
                      }}
                    >
                      {renderInline(c.children, T, L, `${keyPrefix}-row-${ri}-${ci}`)}
                    </T>
                  </V>
                );
              })}
            </V>
          ))}
        </V>
      );
    }
    case "thematicBreak":
      return (
        <V
          key={keyPrefix}
          style={{ borderBottom: `0.5 solid ${BORDER}`, marginVertical: 12 }}
        />
      );
    case "code":
      return (
        <T
          key={keyPrefix}
          style={{
            fontFamily: "Courier",
            fontSize: 9,
            backgroundColor: "#f5e8e2",
            padding: 8,
            marginBottom: 8,
          }}
        >
          {(node as { value: string }).value}
        </T>
      );
    default:
      return null;
  }
}

export async function generateBookPdf(book: Book, bookSlug: string): Promise<Buffer> {
  const P = await pdfPrimitives();
  const { Document, Page, Text, View } = P;

  const manifest = await loadBookManifest(bookSlug, "de");
  const chapters = await Promise.all(
    manifest.chapters.map((c) => loadBookChapter(bookSlug, c.slug, "de")),
  );

  const pageStyle = {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 52,
    fontFamily: "Helvetica",
  };

  const doc = (
    <Document
      title={book.title}
      author={book.author}
      subject={book.subtitle}
      creator="loehrning.ai"
    >
      {/* Title page */}
      <Page size="A4" style={pageStyle}>
        <View style={{ marginTop: 140 }}>
          <Text style={{ fontSize: 10, color: BRAND_ORANGE, marginBottom: 10 }}>
            loehrning.ai · Lernbuch
          </Text>
          <Text
            style={{ fontFamily: "Helvetica-Bold", fontSize: 28, color: INK, lineHeight: 1.2 }}
          >
            {book.title}
          </Text>
          <Text style={{ fontSize: 13, color: MUTED, marginTop: 10, fontFamily: "Helvetica-Oblique" }}>
            {book.subtitle}
          </Text>
          <Text style={{ fontSize: 10, color: MUTED, marginTop: 30 }}>
            {book.author} · {book.edition}
          </Text>
          <Text style={{ fontSize: 9, color: MUTED, marginTop: 4 }}>
            Stand {book.lastReviewed} · {chapters.length} Kapitel
          </Text>
          {manifest.adaptationNote && (
            <Text style={{ fontSize: 8.5, color: MUTED, marginTop: 40, lineHeight: 1.5 }}>
              {manifest.adaptationNote}
            </Text>
          )}
        </View>
      </Page>

      {/* One page-flow per chapter */}
      {chapters.map((chapter, i) => {
        const tree = parseMarkdown(chapter.rawMarkdown);
        return (
          <Page key={chapter.meta.slug} size="A4" style={pageStyle} wrap>
            <Text
              style={{ fontSize: 9, color: BRAND_ORANGE, marginBottom: 4 }}
              fixed
            >
              {String(i + 1).padStart(2, "0")} · {book.title}
            </Text>
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 18,
                color: INK,
                marginBottom: 14,
              }}
            >
              {chapter.meta.title}
            </Text>
            {tree.children.map((node, ni) => renderBlock(node, P, `${chapter.meta.slug}-${ni}`))}
            <Text
              style={{
                position: "absolute",
                bottom: 24,
                left: 52,
                right: 52,
                fontSize: 8,
                color: MUTED,
                textAlign: "center",
              }}
              render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
              fixed
            />
          </Page>
        );
      })}
    </Document>
  );

  return P.renderToBuffer(doc);
}
