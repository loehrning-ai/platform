"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/locale";

export function Dateline({
  prefix,
  locale = "de",
}: {
  prefix?: string;
  locale?: Locale;
}) {
  const resolvedPrefix = prefix ?? (locale === "de" ? "Nürnberg" : "Nuremberg");
  const [label, setLabel] = useState(resolvedPrefix);

  useEffect(() => {
    const dt = new Date();
    const date = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(dt);
    setLabel(`${resolvedPrefix} · ${date}`);
  }, [locale, resolvedPrefix]);

  return <>{label}</>;
}
