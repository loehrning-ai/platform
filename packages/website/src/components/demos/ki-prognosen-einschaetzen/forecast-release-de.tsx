"use client";

import { DE_COPY } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy-de";
import { ForecastRelease } from "./forecast-release";

interface Props {
  readonly workshopHref: string;
  readonly caseHref: string;
}

/**
 * The run with the German copy. Copy holds functions, so it cannot cross
 * from the server as props; this client entry imports only its own locale's
 * module (see index.tsx for what that buys today).
 */
export function ForecastReleaseDe(props: Props) {
  return <ForecastRelease copy={DE_COPY} locale="de" {...props} />;
}
