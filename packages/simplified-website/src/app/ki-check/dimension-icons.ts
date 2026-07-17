import {
  Lightbulb,
  Scale,
  ScanSearch,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/**
 * Resolves the dimension icon names stored in lib/ki-check/questions.ts to
 * lucide components. Kept local to the route so the data module stays free of
 * React imports (courses/track-icon.ts covers the course icons instead).
 */
const DIMENSION_ICONS: Record<string, LucideIcon> = {
  Lightbulb,
  ScanSearch,
  Scale,
  ShieldCheck,
  Workflow,
};

export function dimensionIcon(name: string): LucideIcon {
  return DIMENSION_ICONS[name] ?? Lightbulb;
}
