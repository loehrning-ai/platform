import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { getRequestLocale } from "@/lib/i18n/request-locale";

/**
 * Guard for /demos/<anything else>. Every live demo has its own static route
 * folder next to this one (so a demo page ships only its own component); a
 * retired slug is redirected in the proxy before it gets here, and every
 * other slug is a 404.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: DEMOS_PAGE_COPY[locale].metadata.missingTitle,
    robots: { index: false, follow: false },
  };
}

export default function UnknownDemoPage(): never {
  notFound();
}
