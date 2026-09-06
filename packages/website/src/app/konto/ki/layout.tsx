import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { AGENT_ACCOUNT_COPY } from "./ki-copy";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = AGENT_ACCOUNT_COPY[locale];
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    robots: { index: false, follow: false },
    // Protected utility page: suppress the canonical inherited from root.
    alternates: { canonical: null },
    openGraph: null,
    twitter: null,
  };
}

export default function KontoKiLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
