import { DE_COPY } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy-de";
import { ForecastReleaseDe } from "./forecast-release-de";
import { demoLinks, DemoFrame } from "./frame";

/** Demo 01 in German: a server component that reaches only the German copy. */
export default function ForecastReleaseDemoDe() {
  const links = demoLinks("de");
  return (
    <DemoFrame copy={DE_COPY} locale="de" caseHref={links.caseHref}>
      <ForecastReleaseDe workshopHref={links.workshopHref} caseHref={links.caseHref} />
    </DemoFrame>
  );
}
