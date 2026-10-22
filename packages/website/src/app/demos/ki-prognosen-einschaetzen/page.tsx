import Demo from "@/components/demos/ki-prognosen-einschaetzen";
import { demoMetadata, renderDemoRoute } from "../_lib/demo-route";

const SLUG = "ki-prognosen-einschaetzen";

export function generateMetadata() {
  return demoMetadata(SLUG);
}

export default function DemoRoutePage() {
  return renderDemoRoute(SLUG, Demo);
}
