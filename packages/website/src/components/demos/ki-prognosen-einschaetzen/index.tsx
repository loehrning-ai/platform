/*
 * DEMO · /demos/ki-prognosen-einschaetzen (and /en/demos/ki-prognosen-einschaetzen)
 * Workshop 01 "Kann KI die Zukunft vorhersagen?" · "1.050 Stück, sieben Morgen"
 * The one question (printed by the band): "Wann darf der Plan allein raus?"
 *
 * - Server component. The case strip and the sources render here; the run
 *   (split, owner, seven mornings, result) and "Zum Mitnehmen" are one client
 *   island, server-rendered in its start state, so every section and the
 *   full takeaways are in the HTML on load. Only the participant's own week
 *   needs playing.
 * - Copy holds functions, so it cannot cross from the server as props. Each
 *   locale has its own copy module and its own chain (index-de.tsx ->
 *   forecast-release-de.tsx -> copy-de.ts, same for en); no client module
 *   imports the two-locale map in copy.ts. This
 *   default export still renders both chains for the shared registry, so the
 *   route's client bundle holds both until the registry imports index-de or
 *   index-en per locale route.
 * - Logic, data and copy: src/lib/demo-cases/ki-prognosen-einschaetzen/ (pure,
 *   unit-tested). Styles: forecast-release.css, scoped to `.fr`.
 * - Motion is seek(t) from useProgress (pool split 700 ms, stamp 400 ms),
 *   started only by a tap; prefers-reduced-motion shows the end state.
 * - No collapsible UI. Hover, focus and press bring in the scene's anti
 *   colour (Mennige offset block), never a tint of the button.
 */
import type { Locale } from "@/lib/i18n/locale";
import ForecastReleaseDemoDe from "./index-de";
import ForecastReleaseDemoEn from "./index-en";

interface Props {
  readonly locale: Locale;
}

export default function ForecastReleaseDemo({ locale }: Props) {
  return locale === "en" ? <ForecastReleaseDemoEn /> : <ForecastReleaseDemoDe />;
}
