"use client";

import { createContext, useContext, type JSX, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locale";

const DataInfraWidgetLocaleContext = createContext<Locale>("en");

export function DataInfraWidgetLocaleProvider({
  locale,
  children,
}: {
  readonly locale: Locale;
  readonly children: ReactNode;
}): JSX.Element {
  return (
    <DataInfraWidgetLocaleContext.Provider value={locale}>
      {children}
    </DataInfraWidgetLocaleContext.Provider>
  );
}

export function useDataInfraWidgetLocale(): {
  readonly locale: Locale;
  readonly text: (english: string, german: string) => string;
} {
  const locale = useContext(DataInfraWidgetLocaleContext);
  return {
    locale,
    text: (english, german) => (locale === "de" ? german : english),
  };
}
