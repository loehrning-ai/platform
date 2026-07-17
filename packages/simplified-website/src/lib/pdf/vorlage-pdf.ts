import "server-only";
import type { Vorlage } from "@/lib/vorlagen";
import { CATEGORY_LABELS } from "@/lib/vorlagen";

// Brand tokens (Berliner Werkzeug CI v3.0)
const KUPFER = "#F97316";
const KALKWEISS = "#F3F0E9";
const DRUCKERTINTE = "#0B0908";
const SCHIEFER = "#68605A";
const LEINEN = "#D4CEC5";
const WHITE = "#FFFFFF";

interface MdBlock {
  readonly type:
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "paragraph"
    | "ul"
    | "ol"
    | "blockquote"
    | "code"
    | "hr"
    | "table";
  readonly text?: string;
  readonly items?: readonly string[];
  readonly rows?: readonly (readonly string[])[];
  readonly headerRow?: readonly string[];
}

/** Parse markdown into a flat block list (display-only, no full AST). */
function parseMarkdown(md: string): readonly MdBlock[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: MdBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal rule
    if (/^\s*---+\s*$/.test(line)) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    // Headings
    const h = /^(#{1,4})\s+(.+?)\s*$/.exec(line);
    if (h) {
      const level = h[1].length as 1 | 2 | 3 | 4;
      const text = stripInline(h[2]);
      blocks.push({ type: `h${level}` as MdBlock["type"], text });
      i += 1;
      continue;
    }

    // Code fence
    if (/^```/.test(line)) {
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: "code", text: buf.join("\n") });
      i += 1;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "blockquote", text: stripInline(buf.join(" ")) });
      continue;
    }

    // Table: header line + separator line
    if (/^\|.+\|\s*$/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const headerCells = splitTableRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\|.+\|\s*$/.test(lines[i])) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: "table", headerRow: headerCells, rows });
      continue;
    }

    // Unordered list
    if (/^[\s]*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\s]*[-*+]\s+/.test(lines[i])) {
        items.push(stripInline(lines[i].replace(/^[\s]*[-*+]\s+/, "")));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Ordered list
    if (/^[\s]*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\s]*\d+\.\s+/.test(lines[i])) {
        items.push(stripInline(lines[i].replace(/^[\s]*\d+\.\s+/, "")));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Blank line
    if (/^\s*$/.test(line)) {
      i += 1;
      continue;
    }

    // Paragraph (collect until blank line or block start)
    const paraBuf: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^#{1,4}\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^[\s]*[-*+]\s+/.test(lines[i]) &&
      !/^[\s]*\d+\.\s+/.test(lines[i]) &&
      !/^\|.+\|\s*$/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^\s*---+\s*$/.test(lines[i])
    ) {
      paraBuf.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: "paragraph", text: stripInline(paraBuf.join(" ")) });
  }

  return blocks;
}

function splitTableRow(line: string): string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((c) => stripInline(c.trim()));
}

/** Strip basic inline markdown for plain-text PDF rendering. */
function stripInline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`([^`]+?)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export async function generateVorlagePdf(vorlage: Vorlage): Promise<Buffer> {
  const ReactPDF = await import("@react-pdf/renderer");
  const { Document, Page, Text, View, StyleSheet, renderToBuffer } = ReactPDF;
  const React = await import("react");
  const e = React.createElement;

  const s = StyleSheet.create({
    page: {
      paddingTop: 40,
      paddingBottom: 50,
      paddingHorizontal: 40,
      fontFamily: "Helvetica",
      fontSize: 10,
      lineHeight: 1.5,
      color: DRUCKERTINTE,
      backgroundColor: KALKWEISS,
    },
    coverPage: {
      paddingTop: 0,
      paddingBottom: 50,
      paddingHorizontal: 0,
      fontFamily: "Helvetica",
      fontSize: 10,
      lineHeight: 1.5,
      color: DRUCKERTINTE,
      backgroundColor: KALKWEISS,
    },
    coverHeader: {
      backgroundColor: KUPFER,
      paddingHorizontal: 40,
      paddingTop: 80,
      paddingBottom: 40,
    },
    coverDossier: {
      fontSize: 10,
      color: WHITE,
      opacity: 0.9,
      letterSpacing: 2.5,
      textTransform: "uppercase",
      fontFamily: "Helvetica-Bold",
      marginBottom: 16,
    },
    coverTitle: {
      fontFamily: "Helvetica-Bold",
      fontSize: 30,
      color: WHITE,
      letterSpacing: -0.5,
      lineHeight: 1.15,
      marginBottom: 18,
      maxWidth: 470,
    },
    coverSubtitle: {
      fontSize: 13,
      color: WHITE,
      opacity: 0.95,
      lineHeight: 1.45,
      maxWidth: 470,
    },
    coverBody: { paddingHorizontal: 40, paddingTop: 28 },
    coverLabel: {
      fontSize: 8,
      color: KUPFER,
      letterSpacing: 1.6,
      textTransform: "uppercase",
      fontFamily: "Helvetica-Bold",
      marginBottom: 5,
      marginTop: 14,
    },
    coverInfo: { fontSize: 11, color: DRUCKERTINTE, marginBottom: 10 },
    coverPill: {
      borderWidth: 0.6,
      borderColor: LEINEN,
      paddingHorizontal: 7,
      paddingVertical: 3,
      fontSize: 9,
      color: SCHIEFER,
      letterSpacing: 0.6,
      marginRight: 6,
      marginBottom: 6,
    },
    coverPillRow: { flexDirection: "row", flexWrap: "wrap" },
    h1: {
      fontSize: 22,
      fontFamily: "Helvetica-Bold",
      color: DRUCKERTINTE,
      marginTop: 18,
      marginBottom: 8,
      letterSpacing: -0.4,
    },
    h2: {
      fontSize: 16,
      fontFamily: "Helvetica-Bold",
      color: DRUCKERTINTE,
      marginTop: 14,
      marginBottom: 6,
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 13,
      fontFamily: "Helvetica-Bold",
      color: DRUCKERTINTE,
      marginTop: 10,
      marginBottom: 4,
    },
    h4: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: KUPFER,
      marginTop: 8,
      marginBottom: 3,
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    paragraph: {
      fontSize: 10,
      color: DRUCKERTINTE,
      marginBottom: 7,
      lineHeight: 1.55,
    },
    listItem: {
      fontSize: 10,
      color: DRUCKERTINTE,
      marginBottom: 3,
      paddingLeft: 12,
    },
    blockquote: {
      borderLeftWidth: 2,
      borderLeftColor: KUPFER,
      paddingLeft: 10,
      marginVertical: 8,
      fontSize: 10,
      color: SCHIEFER,
      fontFamily: "Helvetica-Oblique",
    },
    code: {
      fontFamily: "Courier",
      fontSize: 8.5,
      color: DRUCKERTINTE,
      backgroundColor: WHITE,
      borderWidth: 0.4,
      borderColor: LEINEN,
      padding: 8,
      marginVertical: 6,
      lineHeight: 1.35,
    },
    hr: {
      borderBottomWidth: 0.5,
      borderBottomColor: LEINEN,
      marginVertical: 10,
    },
    tableContainer: {
      borderWidth: 0.4,
      borderColor: LEINEN,
      marginVertical: 8,
    },
    tableHeaderRow: {
      flexDirection: "row",
      backgroundColor: WHITE,
      borderBottomWidth: 0.6,
      borderBottomColor: LEINEN,
    },
    tableHeaderCell: {
      flex: 1,
      paddingVertical: 5,
      paddingHorizontal: 6,
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: DRUCKERTINTE,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 0.4,
      borderBottomColor: LEINEN,
    },
    tableCell: {
      flex: 1,
      paddingVertical: 5,
      paddingHorizontal: 6,
      fontSize: 9,
      color: DRUCKERTINTE,
    },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 40,
      right: 40,
      borderTopWidth: 0.5,
      borderTopColor: LEINEN,
      paddingTop: 6,
      flexDirection: "row",
      justifyContent: "space-between",
      fontSize: 8,
      color: SCHIEFER,
    },
    footerBrand: {
      fontFamily: "Helvetica-Bold",
      color: DRUCKERTINTE,
      letterSpacing: 1,
    },
  });

  // Drop the leading H1 from the body — the cover page already shows the title.
  const bodyWithoutTitle = vorlage.body.replace(/^\s*#\s+.+\n+/, "");
  const blocks = parseMarkdown(bodyWithoutTitle);

  function renderBlock(b: MdBlock, idx: number) {
    switch (b.type) {
      case "h1":
        return e(Text, { key: idx, style: s.h1 }, b.text ?? "");
      case "h2":
        return e(Text, { key: idx, style: s.h2 }, b.text ?? "");
      case "h3":
        return e(Text, { key: idx, style: s.h3 }, b.text ?? "");
      case "h4":
        return e(Text, { key: idx, style: s.h4 }, b.text ?? "");
      case "paragraph":
        return e(Text, { key: idx, style: s.paragraph }, b.text ?? "");
      case "blockquote":
        return e(Text, { key: idx, style: s.blockquote }, b.text ?? "");
      case "code":
        return e(Text, { key: idx, style: s.code }, b.text ?? "");
      case "hr":
        return e(View, { key: idx, style: s.hr });
      case "ul":
        return e(
          View,
          { key: idx, style: { marginBottom: 6 } },
          ...(b.items ?? []).map((it, j) =>
            e(Text, { key: j, style: s.listItem }, `• ${it}`),
          ),
        );
      case "ol":
        return e(
          View,
          { key: idx, style: { marginBottom: 6 } },
          ...(b.items ?? []).map((it, j) =>
            e(Text, { key: j, style: s.listItem }, `${j + 1}. ${it}`),
          ),
        );
      case "table":
        return e(
          View,
          { key: idx, style: s.tableContainer },
          e(
            View,
            { style: s.tableHeaderRow },
            ...(b.headerRow ?? []).map((cell, j) =>
              e(Text, { key: j, style: s.tableHeaderCell }, cell),
            ),
          ),
          ...(b.rows ?? []).map((row, j) =>
            e(
              View,
              { key: j, style: s.tableRow },
              ...row.map((cell, k) => e(Text, { key: k, style: s.tableCell }, cell)),
            ),
          ),
        );
    }
  }

  const coverPills: string[] = [
    CATEGORY_LABELS[vorlage.category],
    ...(vorlage.pflicht ? ["Pflicht-Vorlage"] : []),
    ...vorlage.articleRefs,
  ];

  const coverPage = e(
    Page,
    { size: "A4", style: s.coverPage },
    e(
      View,
      { style: s.coverHeader },
      e(Text, { style: s.coverDossier }, `Governance-Vorlage · loehrning.ai`),
      e(Text, { style: s.coverTitle }, vorlage.title),
      e(Text, { style: s.coverSubtitle }, vorlage.jobToBeDone),
    ),
    e(
      View,
      { style: s.coverBody },
      e(Text, { style: s.coverLabel }, "Kategorie und Pflichten"),
      e(
        View,
        { style: s.coverPillRow },
        ...coverPills.map((p, i) => e(Text, { key: i, style: s.coverPill }, p)),
      ),
      e(Text, { style: s.coverLabel }, "Für wen"),
      e(Text, { style: s.coverInfo }, vorlage.audience.join(" · ") || "-"),
      e(Text, { style: s.coverLabel }, "Umfang"),
      e(
        Text,
        { style: s.coverInfo },
        `${vorlage.pages} Seiten · ${vorlage.estReadMinutes} Min. Lesezeit · ${vorlage.estCompleteMinutes} Min. Ausfüllen`,
      ),
      vorlage.editorNotes.length > 0
        ? e(Text, { style: s.coverLabel }, "Editor's Notes")
        : null,
      vorlage.editorNotes.length > 0
        ? e(
            View,
            { style: { marginBottom: 12 } },
            ...vorlage.editorNotes.map((n, i) =>
              e(Text, { key: i, style: s.listItem }, `• ${n}`),
            ),
          )
        : null,
      e(Text, { style: s.coverLabel }, "Nutzungsrechte"),
      e(
        Text,
        { style: s.coverInfo },
        "CC BY 4.0: frei nutzbar mit Quellenangabe. Diese Vorlage ersetzt keine Rechtsberatung im Einzelfall.",
      ),
      e(Text, { style: s.coverLabel }, "Stand"),
      e(Text, { style: s.coverInfo }, vorlage.lastReviewed),
    ),
    e(
      View,
      { style: s.footer, fixed: true },
      e(Text, null, "Tim Löhr · loehrning.ai · kontakt@loehrning.ai"),
      e(Text, { style: s.footerBrand }, `LOEHRNING.AI · VORLAGE`),
    ),
  );

  const bodyPage = e(
    Page,
    { size: "A4", style: s.page },
    ...blocks.map((b, i) => renderBlock(b, i)),
    e(
      View,
      { style: s.footer, fixed: true },
      e(Text, null, `${vorlage.title} · loehrning.ai/vorlagen/${vorlage.slug}`),
      e(Text, { style: s.footerBrand }, "LOEHRNING.AI"),
    ),
  );

  const doc = e(
    Document,
    {
      title: `${vorlage.title} (Governance-Vorlage)`,
      author: "Tim Löhr · loehrning.ai",
      subject: vorlage.jobToBeDone,
      keywords: vorlage.articleRefs.join(", "),
    },
    coverPage,
    bodyPage,
  );

  return renderToBuffer(doc);
}
