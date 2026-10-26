import Demo from "@/components/demos/angebote-mit-ki-vergleichen";
import { BEATS } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/beats";
import { demoMetadata, renderDemoRoute } from "../_lib/demo-route";

const SLUG = "angebote-mit-ki-vergleichen";

export function generateMetadata() {
  return demoMetadata(SLUG);
}

export default function DemoRoutePage() {
  return renderDemoRoute(SLUG, Demo, BEATS);
}
