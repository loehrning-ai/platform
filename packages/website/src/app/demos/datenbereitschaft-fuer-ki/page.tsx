import Demo from "@/components/demos/datenbereitschaft-fuer-ki";
import { BEATS } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/beats";
import { demoMetadata, renderDemoRoute } from "../_lib/demo-route";

const SLUG = "datenbereitschaft-fuer-ki";

export function generateMetadata() {
  return demoMetadata(SLUG);
}

export default function DemoRoutePage() {
  return renderDemoRoute(SLUG, Demo, BEATS);
}
