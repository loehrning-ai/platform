import { EN_COPY } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy-en";
import { ForecastReleaseEn } from "./forecast-release-en";
import { demoLinks, DemoFrame } from "./frame";

/** Demo 01 in English: a server component that reaches only the English copy. */
export default function ForecastReleaseDemoEn() {
  const links = demoLinks("en");
  return (
    <DemoFrame copy={EN_COPY} locale="en" caseHref={links.caseHref}>
      <ForecastReleaseEn workshopHref={links.workshopHref} caseHref={links.caseHref} />
    </DemoFrame>
  );
}
