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

// --- Brand tokens (Berliner Werkzeug CI v3.0) ---

const KUPFER = "#C4431A";
const KALKWEISS = "#F3F0E9";
const DRUCKERTINTE = "#0B0908";
const SCHIEFER = "#68605A";
const LEINEN = "#D4CEC5";

// --- Types ---

export interface CertificateData {
  readonly name: string;
  readonly score: number | null; // 0-1 normalized for quiz path
  readonly completionMode: CertificateCompletionMode;
  readonly completionDate: string; // formatted German date string
  readonly completedAt: string; // ISO timestamp
}

type NonQuizMode = Exclude<CertificateCompletionMode, "quiz">;

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

  doc.setFillColor(KALKWEISS);
  doc.rect(0, 0, W, H, "F");

  doc.setFillColor(KUPFER);
  doc.rect(0, 0, W, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(DRUCKERTINTE);
  doc.text(course.certificateTitle.toUpperCase(), W / 2, 40, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(SCHIEFER);
  doc.text(course.certificateSubtitle, W / 2, 50, { align: "center" });

  doc.setDrawColor(KUPFER);
  doc.setLineWidth(0.5);
  doc.line(W / 2 - 40, 58, W / 2 + 40, 58);

  const isEn = course.language === "en";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(SCHIEFER);
  doc.text(isEn ? "This certifies that" : "Hiermit wird bestätigt, dass", W / 2, 72, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(DRUCKERTINTE);
  doc.text(data.name, W / 2, 86, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(SCHIEFER);
  doc.text(
    isEn
      ? `has successfully completed the ${course.certificateTitle} by loehrning.ai.`
      : `den ${course.certificateTitle} der loehrning.ai erfolgreich absolviert hat.`,
    W / 2,
    98,
    { align: "center" },
  );

  const leftX = 40;
  let y = 115;

  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  doc.setTextColor(DRUCKERTINTE);
  doc.text(`${isEn ? "Date:      " : "Datum:      "}${data.completionDate}`, leftX, y);
  y += 7;
  doc.text(
    data.completionMode === "quiz"
      ? isEn
        ? `Score:      ${Math.round((data.score ?? 0) * 100)}% (passed)`
        : `Ergebnis:   ${Math.round((data.score ?? 0) * 100)}% (bestanden)`
      : COMPLETION_LABEL[course.language][data.completionMode],
    leftX,
    y,
  );

  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(SCHIEFER);
  for (const mod of course.certificateModules) {
    doc.text(`•  ${mod}`, leftX, y);
    y += 5;
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(KUPFER);
  doc.text(course.certificateReferenceLabel, leftX, y);

  const verificationUrl = buildVerificationUrl(data, course);
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
      ? "Locally generated certificate of completion. No cryptographic signature."
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
