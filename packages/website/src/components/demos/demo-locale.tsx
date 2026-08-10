"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locale";

interface DemoLocaleValue {
  readonly locale: Locale;
  readonly text: (de: string, en: string) => string;
}

const DemoLocaleContext = createContext<DemoLocaleValue>({
  locale: "de",
  text: (de) => de,
});

export function DemoLocaleProvider({
  locale,
  children,
}: {
  readonly locale: Locale;
  readonly children: ReactNode;
}) {
  const value = useMemo<DemoLocaleValue>(
    () => ({
      locale,
      text: (de, en) => (locale === "de" ? de : en),
    }),
    [locale],
  );

  return (
    <DemoLocaleContext.Provider value={value}>
      {children}
    </DemoLocaleContext.Provider>
  );
}

export function useDemoLocale(): DemoLocaleValue {
  return useContext(DemoLocaleContext);
}
