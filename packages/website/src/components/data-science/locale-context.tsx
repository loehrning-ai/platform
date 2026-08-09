"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locale";

const DataScienceLocaleContext = createContext<Locale>("en");

export function DataScienceLocaleProvider({
  locale,
  children,
}: {
  readonly locale: Locale;
  readonly children: ReactNode;
}) {
  return (
    <DataScienceLocaleContext.Provider value={locale}>
      {children}
    </DataScienceLocaleContext.Provider>
  );
}

export function useDataScienceLocale(): {
  readonly locale: Locale;
  readonly text: (english: string, german: string) => string;
} {
  const locale = useContext(DataScienceLocaleContext);
  return {
    locale,
    text: (english, german) => (locale === "de" ? german : english),
  };
}
