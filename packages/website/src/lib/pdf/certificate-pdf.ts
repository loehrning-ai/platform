/**
 * Client-side PDF certificate generation (multi-course).
 * Uses jsPDF (dynamically imported to avoid SSR issues).
 *
 * API contract:
 *   generateCertificatePdf(data, course) -> Promise<Blob>
 */

import type { CourseConfig } from "@/lib/course/types";
import {
  CERTIFICATE_QR_VERSION,
  type CertificateCompletionMode,
} from "@/lib/course/certificate-constants";
import { normalizeWorkshopQuizScore } from "@/lib/progress/types";

// --- Brand tokens (Berliner Werkzeug CI v3.0) ---

const KUPFER = "#C4431A";
const KALKWEISS = "#F3F0E9";
const DRUCKERTINTE = "#0B0908";
const SCHIEFER = "#68605A";
const LEINEN = "#D4CEC5";

// --- Types ---

export interface CertificateData {
  readonly name: string;
  /** Canonical 0..1 ratio; historical whole percentages are normalized. */
  readonly score: number | null;
  readonly completionMode: CertificateCompletionMode;
  readonly completionDate: string; // formatted German date string
  readonly completedAt: string; // ISO timestamp
}

type NonQuizMode = Exclude<CertificateCompletionMode, "quiz">;

interface PdfTextLayout {
  readonly fontSize: number;
  readonly lines: readonly string[];
}

interface PdfTextMeasurer {
  setFontSize(size: number): void;
  splitTextToSize(text: string, maxWidth: number): string[];
}

/** Completion line for the non-quiz certificate paths, by course language. */
const COMPLETION_LABEL: Record<"de" | "en", Record<NonQuizMode, string>> = {
  de: {
    capstone: "Abschluss: Capstone-Rubrik vollständig",
    completion: "Abschluss: Alle Lektionen abgeschlossen",
  },
  en: {
    capstone: "Completion: capstone rubric fulfilled",
    completion: "Completion: all lessons finished",
  },
};

/**
 * Fit text to a bounded number of lines. This is deliberately independent of
 * certificate coordinates so every variable string can share the same
 * clipping-resistant contract and the layout can be regression-tested.
 */
export function fitTextLayout(
  doc: PdfTextMeasurer,
  text: string,
  maxWidth: number,
  maximumFontSize: number,
  minimumFontSize: number,
  maximumLines: number,
): PdfTextLayout {
  for (
    let fontSize = maximumFontSize;
    fontSize >= minimumFontSize;
    fontSize -= 0.5
  ) {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    if (lines.length <= maximumLines) return { fontSize, lines };
  }

  doc.setFontSize(minimumFontSize);
  const lines = doc.splitTextToSize(text, maxWidth);
  throw new Error(
    `Certificate text exceeds ${maximumLines} lines at the minimum font size (${lines.length} required).`,
  );
}

/**
 * Split a long name into at most two balanced lines without deleting or
 * transliterating Unicode. Canvas rendering then lets the browser use its
 * normal font-fallback chain instead of jsPDF's WinAnsi-only Helvetica.
 */
export function splitCertificateName(name: string): readonly string[] {
  const words = name.trim().split(/\s+/u);
  if (words.length <= 1) {
    const trimmed = name.trim();
    const characters =
      typeof Intl.Segmenter === "function"
        ? Array.from(
            new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(
              trimmed,
            ),
            ({ segment }) => segment,
          )
        : Array.from(trimmed);
    if (characters.length <= 28) return [name.trim()];
    const midpoint = Math.ceil(characters.length / 2);
    return [
      characters.slice(0, midpoint).join(""),
      characters.slice(midpoint).join(""),
    ];
  }

  let bestSplit = 1;
  let smallestDifference = Number.POSITIVE_INFINITY;
  for (let index = 1; index < words.length; index += 1) {
    const leftLength = words.slice(0, index).join(" ").length;
    const rightLength = words.slice(index).join(" ").length;
    const difference = Math.abs(leftLength - rightLength);
    if (difference < smallestDifference) {
      bestSplit = index;
      smallestDifference = difference;
    }
  }

  const first = words.slice(0, bestSplit).join(" ");
  const second = words.slice(bestSplit).join(" ");
  return first.length + second.length <= 36
    ? [name.trim()]
    : [first, second];
}

export function certificateModulePositions(
  moduleCount: number,
  startY = 140,
): readonly { readonly x: number; readonly y: number }[] {
  const columns = moduleCount > 6 ? 2 : 1;
  const rows = Math.ceil(moduleCount / columns);
  return Array.from({ length: moduleCount }, (_, index) => {
    const column = Math.floor(index / rows);
    const row = index % rows;
    return { x: 40 + column * 80, y: startY + row * 5 };
  });
}

async function renderNameAsPng(name: string): Promise<string> {
  if (typeof document === "undefined") {
    throw new Error("Certificate name rendering requires a browser.");
  }
  await document.fonts?.ready;

  const canvas = document.createElement("canvas");
  canvas.width = 2400;
  canvas.height = 204;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Certificate name canvas is unavailable.");
  }

  const lines = splitCertificateName(name);
  const availableWidth = canvas.width - 120;
  const family =
    getComputedStyle(document.body).fontFamily ||
    '"Loehrning Sans", "Noto Sans", Arial, sans-serif';
  let fontSize = lines.length === 1 ? 104 : 78;
  const minimumFontSize = 24;

  while (fontSize > minimumFontSize) {
    context.font = `700 ${fontSize}px ${family}`;
    if (
      lines.every(
        (line) => context.measureText(line).width <= availableWidth,
      )
    ) {
      break;
    }
    fontSize -= 2;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = DRUCKERTINTE;
  context.font = `700 ${fontSize}px ${family}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  const lineHeight = fontSize * 1.05;
  const firstBaseline =
    canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    context.fillText(
      line,
      canvas.width / 2,
      firstBaseline + index * lineHeight,
      availableWidth,
    );
  });

  return canvas.toDataURL("image/png");
}

// --- Verification URL ---

function buildVerificationUrl(
  data: CertificateData,
  course: CourseConfig,
): string {
  const payload = JSON.stringify({
    n: data.name,
    s: data.score === null ? null : Math.round(data.score * 100),
    m: data.completionMode,
    d: data.completedAt,
    c: course.slug,
    v: CERTIFICATE_QR_VERSION,
  });
  const encoded = btoa(
    encodeURIComponent(payload).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16)),
    ),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `https://loehrning.ai${course.basePath}/verifizierung#${encoded}`;
}

// --- PDF generation ---

export async function generateCertificatePdf(
  data: CertificateData,
  course: CourseConfig,
): Promise<Blob> {
  const normalizedQuizScore =
    data.completionMode === "quiz"
      ? normalizeWorkshopQuizScore(data.score)
      : null;
  if (data.completionMode === "quiz" && normalizedQuizScore === null) {
    throw new Error("Certificate quiz score is invalid.");
  }
  const normalizedData: CertificateData = {
    ...data,
    score: normalizedQuizScore,
  };

  const jsPDFModule = await import("jspdf");
  const jsPDF = jsPDFModule.default;
  const QRCode = await import("qrcode");

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const W = 297;
  const H = 210;
  const TEXT_MAX_WIDTH = 225;

  doc.setFillColor(KALKWEISS);
  doc.rect(0, 0, W, H, "F");

  doc.setFillColor(KUPFER);
  doc.rect(0, 0, W, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(DRUCKERTINTE);
  const titleLayout = fitTextLayout(
    doc,
    course.certificateTitle.toUpperCase(),
    TEXT_MAX_WIDTH,
    32,
    18,
    1,
  );
  doc.setFontSize(titleLayout.fontSize);
  doc.text([...titleLayout.lines], W / 2, 38, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(SCHIEFER);
  const subtitleLayout = fitTextLayout(
    doc,
    course.certificateSubtitle,
    TEXT_MAX_WIDTH,
    14,
    8.5,
    3,
  );
  doc.setFontSize(subtitleLayout.fontSize);
  doc.text([...subtitleLayout.lines], W / 2, 48, {
    align: "center",
    lineHeightFactor: 1.15,
  });

  doc.setDrawColor(KUPFER);
  doc.setLineWidth(0.5);
  doc.line(W / 2 - 40, 64, W / 2 + 40, 64);

  const isEn = course.language === "en";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(SCHIEFER);
  doc.text(isEn ? "This certifies that" : "Hiermit wird bestätigt, dass", W / 2, 73, {
    align: "center",
  });

  const namePng = await renderNameAsPng(data.name);
  doc.addImage(namePng, "PNG", 30, 76, W - 60, 20);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(SCHIEFER);
  const completionSentence = isEn
    ? `has successfully completed the ${course.certificateTitle} by loehrning.ai.`
    : `den ${course.certificateTitle} der loehrning.ai erfolgreich absolviert hat.`;
  const completionLayout = fitTextLayout(
    doc,
    completionSentence,
    TEXT_MAX_WIDTH,
    11,
    9,
    2,
  );
  doc.setFontSize(completionLayout.fontSize);
  doc.text([...completionLayout.lines], W / 2, 102, {
    align: "center",
    lineHeightFactor: 1.15,
  });

  const leftX = 40;
  let y = 119;

  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  doc.setTextColor(DRUCKERTINTE);
  doc.text(`${isEn ? "Date:      " : "Datum:      "}${data.completionDate}`, leftX, y);
  y += 7;
  doc.text(
    data.completionMode === "quiz"
      ? isEn
        ? `Score:      ${Math.round((normalizedData.score ?? 0) * 100)}% (passed)`
        : `Ergebnis:   ${Math.round((normalizedData.score ?? 0) * 100)}% (bestanden)`
      : COMPLETION_LABEL[course.language][data.completionMode],
    leftX,
    y,
  );

  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(SCHIEFER);
  const modulePositions = certificateModulePositions(
    course.certificateModules.length,
    y,
  );
  course.certificateModules.forEach((mod, index) => {
    const position = modulePositions[index];
    doc.text(`•  ${mod}`, position.x, position.y);
  });
  if (modulePositions.length > 0) {
    y = Math.max(...modulePositions.map((position) => position.y)) + 5;
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(KUPFER);
  const referenceLayout = fitTextLayout(
    doc,
    course.certificateReferenceLabel,
    145,
    9,
    7.5,
    2,
  );
  doc.setFontSize(referenceLayout.fontSize);
  doc.text([...referenceLayout.lines], leftX, y, { lineHeightFactor: 1.15 });

  const verificationUrl = buildVerificationUrl(normalizedData, course);
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 200,
    margin: 1,
    color: { dark: DRUCKERTINTE, light: KALKWEISS },
  });
  doc.addImage(qrDataUrl, "PNG", W - 80, 108, 35, 35);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(SCHIEFER);
  doc.text(isEn ? "Scan QR code" : "QR-Code scannen", W - 62.5, 147, { align: "center" });
  doc.text(isEn ? "Data readable, not verified" : "Daten lesbar, nicht geprüft", W - 62.5, 151, {
    align: "center",
  });

  doc.setDrawColor(LEINEN);
  doc.setLineWidth(0.3);
  doc.line(40, H - 30, W - 40, H - 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(SCHIEFER);
  doc.text("loehrning.ai  |  Tim Löhr", W / 2, H - 22, { align: "center" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(
    isEn
      ? "Locally generated certificate of participation. No cryptographic signature."
      : "Lokal erzeugte Teilnahmebestätigung. Keine kryptografische Signatur.",
    W / 2,
    H - 16,
    { align: "center" },
  );
  doc.text(
    isEn ? "Not an official or legally binding credential." : "Keine behördliche oder rechtliche Bescheinigung.",
    W / 2,
    H - 11,
    { align: "center" },
  );

  doc.setFillColor(KUPFER);
  doc.rect(0, H - 4, W, 4, "F");

  return doc.output("blob");
}
