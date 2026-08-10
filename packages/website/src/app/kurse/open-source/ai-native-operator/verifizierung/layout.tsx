import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getAiNativeOperatorCourseCopy } from "@/lib/ai-native-operator/course-copy";
import { getAiNativeOperatorLocaleRegistry } from "@/lib/ai-native-operator/data";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  (await getAiNativeOperatorLocaleRegistry()).get(locale);
  const copy = getAiNativeOperatorCourseCopy(locale).verificationMetadata;
  return {
    title: copy.title,
    description: copy.description,
    robots: { index: false, follow: false },
    alternates: { canonical: null },
  };
}

export default function VerifizierungLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return children;
}
