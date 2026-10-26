import type { ClaudeSceneData } from "@/lib/claude-runs";
import type { Locale } from "@/lib/i18n/locale";

/** A kit file as the scene shows it: the chip, the preview and the download (exact bytes from the shipped zip). */
export interface SceneKitFile {
  readonly name: string;
  readonly path: string;
  readonly bytes: number;
  /** The file's text, read from the kit zip at build time; null for binary files. */
  readonly text: string | null;
  readonly sha256: string;
}

/** Everything the client scene needs, serializable. */
export interface ClaudeDesktopSceneProps {
  readonly scene: ClaudeSceneData;
  readonly locale: Locale;
  /** The skill zip the visitor downloads (/skills/<name>.zip). */
  readonly skillName: string;
  /** Kit files by name, for every file any shown take attached. */
  readonly kitFiles: Readonly<Record<string, SceneKitFile>>;
  readonly initialPromptId?: string;
  /** "auto" follows prefers-color-scheme. */
  readonly theme?: "auto" | "light" | "dark";
}
