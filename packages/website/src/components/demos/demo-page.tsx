import type { Locale } from "@/lib/i18n/locale";

/** What every demo component receives from the page shell. */
export interface DemoComponentProps {
  readonly locale: Locale;
}
