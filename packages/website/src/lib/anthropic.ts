import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { isAnthropicRuntimeReady } from "@/lib/provider-readiness";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!isAnthropicRuntimeReady()) {
    throw new Error("Anthropic runtime compliance gate is not ready");
  }
  if (client) return client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable");
  }

  client = new Anthropic({ apiKey });
  return client;
}

/**
 * Returns null if Anthropic is not configured.
 */
export function tryGetAnthropicClient(): Anthropic | null {
  try {
    return getAnthropicClient();
  } catch {
    return null;
  }
}
