import Demo from "@/components/demos/ki-im-unternehmen-sicher-nutzen";
import { demoMetadata, renderDemoRoute } from "../_lib/demo-route";

const SLUG = "ki-im-unternehmen-sicher-nutzen";

export function generateMetadata() {
  return demoMetadata(SLUG);
}

export default function DemoRoutePage() {
  return renderDemoRoute(SLUG, Demo);
}
