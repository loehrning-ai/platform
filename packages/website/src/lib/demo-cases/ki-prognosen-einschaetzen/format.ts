export type DemoLocale = "de" | "en";

const INTL: Readonly<Record<DemoLocale, string>> = { de: "de-DE", en: "en-US" };

/** 1.180 (de) or 1,180 (en), no decimals unless asked for. */
export function formatNumber(
  value: number,
  locale: DemoLocale,
  maxFraction = 0,
): string {
  const rounded = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(INTL[locale], {
    maximumFractionDigits: maxFraction,
    minimumFractionDigits: 0,
    useGrouping: true,
  })
    .format(rounded)
    .replace(/^-/, "−");
}

/** Replaces {name} slots in a copy template; unknown slots stay visible so tests catch them. */
export function fill(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/g, (slot, name: string) =>
    name in values ? String(values[name]) : slot,
  );
}
