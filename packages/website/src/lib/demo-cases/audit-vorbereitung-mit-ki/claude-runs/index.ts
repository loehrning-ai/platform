import type { ClaudeSceneData } from "@/lib/claude-runs";

/**
 * The demo of workshop 05 draws no Claude window, so it uses no recording: every AI-looking result
 * in the demo is computed from the kit files. The deck, not the demo, carries the recordings of this
 * workshop (the takes named in scripts/workshop05/deck-src/takes.json); the recorder writes them into
 * this folder, and scripts/__tests__/workshop05-takes.test.mjs guards them. The shared collector
 * (src/lib/claude-scenes.ts) still imports this entry, so it stays and says "none".
 */
export const SCENE: ClaudeSceneData | null = null;
