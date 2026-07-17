import {
  BookOpen,
  Bot,
  Database,
  FileText,
  Github,
  GraduationCap,
  LineChart,
  Pencil,
  Play,
  Presentation,
  Scale,
  Server,
  Sparkles,
  TerminalSquare,
  TrendingUp,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps the string icon names stored in tracks.ts / resource lists to lucide
 * components, so data modules stay free of React imports.
 */
const ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Bot,
  Database,
  FileText,
  Github,
  GraduationCap,
  LineChart,
  Pencil,
  Play,
  Presentation,
  Scale,
  Server,
  Sparkles,
  TerminalSquare,
  TrendingUp,
  Users,
  Workflow,
};

export function iconByName(name: string): LucideIcon {
  return ICONS[name] ?? BookOpen;
}
