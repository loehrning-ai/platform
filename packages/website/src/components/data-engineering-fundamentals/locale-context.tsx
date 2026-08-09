"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locale";

const DataEngineeringFundamentalsLocaleContext = createContext<Locale>("en");

export function DataEngineeringFundamentalsLocaleProvider({
  locale,
  children,
}: {
  readonly locale: Locale;
  readonly children: ReactNode;
}) {
  return (
    <DataEngineeringFundamentalsLocaleContext.Provider value={locale}>
      {children}
    </DataEngineeringFundamentalsLocaleContext.Provider>
  );
}

export function useDataEngineeringFundamentalsLocale(): {
  readonly locale: Locale;
  readonly text: (english: string, german: string) => string;
} {
  const locale = useContext(DataEngineeringFundamentalsLocaleContext);
  return {
    locale,
    text: (english, german) => (locale === "de" ? german : english),
  };
}
