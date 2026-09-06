import type { Metadata } from "next";
import { getClaudeCourseBundle } from "@/lib/claude-course/localization";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { buildTechnicalCourseMetadata } from "@/lib/technical-courses/routes";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const bundle = await getClaudeCourseBundle(locale);
  return buildTechnicalCourseMetadata({
    courseSlug: "claude",
    locale,
    target: { kind: "verification" },
    title:
      locale === "de"
        ? `Zertifikatdaten lesen: ${bundle.config.title}`
        : `Read certificate data: ${bundle.config.title}`,
    description:
      locale === "de"
        ? "Liest die Zertifikatdaten aus dem QR-Code der Teilnahmebestätigung. Nicht servergeprüft, nicht kryptografisch signiert."
        : "Reads certificate data encoded in the QR code. The data is not server-verified or cryptographically signed.",
    availableContentLocales: ["de", "en"],
  });
}

export default function VerifizierungLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
