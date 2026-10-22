import Demo from "@/components/demos/geschaeftsberichte-mit-ki-lesen";
import { demoMetadata, renderDemoRoute } from "../_lib/demo-route";

const SLUG = "geschaeftsberichte-mit-ki-lesen";

export function generateMetadata() {
  return demoMetadata(SLUG);
}

export default function DemoRoutePage() {
  return renderDemoRoute(SLUG, Demo);
}
