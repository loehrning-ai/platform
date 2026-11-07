import type { ClaudeSceneData } from "@/lib/claude-runs";

/**
 * Workshop 05 shows no Claude recording: every AI-looking result in the deck is computed from the
 * kit files, and the demo draws no depicted Claude window. The shared collector
 * (src/lib/claude-scenes.ts) still imports this entry, so it stays and says "none".
 */
export const SCENE: ClaudeSceneData | null = null;
