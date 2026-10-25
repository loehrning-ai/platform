import Demo from "@/components/demos/ki-prognosen-einschaetzen";
import { BEATS } from "@/lib/demo-cases/ki-prognosen-einschaetzen/beats";
import { demoMetadata, renderDemoRoute } from "../_lib/demo-route";

const SLUG = "ki-prognosen-einschaetzen";

export function generateMetadata() {
  return demoMetadata(SLUG);
}

export default function DemoRoutePage() {
  return renderDemoRoute(SLUG, Demo, BEATS);
}
