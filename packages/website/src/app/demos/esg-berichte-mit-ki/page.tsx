import Demo from "@/components/demos/esg-berichte-mit-ki";
import { BEATS } from "@/lib/demo-cases/esg-berichte-mit-ki/beats";
import { demoMetadata, renderDemoRoute } from "../_lib/demo-route";

const SLUG = "esg-berichte-mit-ki";

export function generateMetadata() {
  return demoMetadata(SLUG);
}

export default function DemoRoutePage() {
  return renderDemoRoute(SLUG, Demo, BEATS);
}
