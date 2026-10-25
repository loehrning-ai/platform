"use client";

import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { HundredWeeks } from "./hundred-weeks";
import "./hundred-weeks.css";

/** Client entry of "Hundert Startwochen": receives exactly one language pack. */
export default function Demo({ copy }: { readonly copy: DemoPack }) {
  return <HundredWeeks copy={copy} />;
}
