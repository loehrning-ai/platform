import type { ReactNode } from "react";
import { DsChapterLayoutClient } from "@/components/data-science/ds-chapter-layout-client";
import { getDsLocaleRegistry } from "@/lib/data-science/content";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function DsChapterLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const locale = await getRequestLocale();
  const bundle = (await getDsLocaleRegistry()).get(locale);

  return (
    <DsChapterLayoutClient
      locale={locale}
      chapters={bundle.content.chapters.map((chapter) => chapter.meta)}
    >
      {children}
    </DsChapterLayoutClient>
  );
}
