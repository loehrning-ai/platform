import Demo from "@/components/demos/audit-vorbereitung-mit-ki";
import { BEATS } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/beats";
import { demoMetadata, renderDemoRoute } from "../_lib/demo-route";

const SLUG = "audit-vorbereitung-mit-ki";

export function generateMetadata() {
  return demoMetadata(SLUG);
}

export default function DemoRoutePage() {
  return renderDemoRoute(SLUG, Demo, BEATS);
}
