"use client";

import { EN_COPY } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy-en";
import { ForecastRelease } from "./forecast-release";

interface Props {
  readonly workshopHref: string;
  readonly caseHref: string;
}

/**
 * The run with the English copy. Copy holds functions, so it cannot cross
 * from the server as props; this client entry imports only its own locale's
 * module (see index.tsx for what that buys today).
 */
export function ForecastReleaseEn(props: Props) {
  return <ForecastRelease copy={EN_COPY} locale="en" {...props} />;
}
