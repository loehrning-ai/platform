"use client";

import { useEffect, useState } from "react";

const DAYS = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];
const MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

export function Dateline({ prefix = "Nürnberg" }: { prefix?: string }) {
  const [label, setLabel] = useState(prefix);

  useEffect(() => {
    const dt = new Date();
    setLabel(
      `${prefix} · ${DAYS[dt.getDay()]} · ${dt.getDate()}. ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`,
    );
  }, [prefix]);

  return <>{label}</>;
}
