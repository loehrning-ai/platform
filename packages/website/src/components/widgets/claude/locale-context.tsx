"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locale";

const ClaudeWidgetLocaleContext = createContext<Locale>("en");

export function ClaudeWidgetLocaleProvider({
  locale,
  children,
}: {
  readonly locale: Locale;
  readonly children: ReactNode;
}) {
  return (
    <ClaudeWidgetLocaleContext.Provider value={locale}>
      {children}
    </ClaudeWidgetLocaleContext.Provider>
  );
}

export function useClaudeWidgetLocale(): Locale {
  return useContext(ClaudeWidgetLocaleContext);
}
