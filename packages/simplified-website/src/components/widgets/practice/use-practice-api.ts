"use client";

// ─── usePracticeApi (shared course architecture) ───────────────────────────
//
// Client helper the Practice Room widgets use to talk to
// POST /api/ai-native/practice. The route is feature-flagged OFF by default
// (R5); when it answers 503 (flag/API absent) or fails for any other reason,
// the widgets fall back to a deterministic STATIC quality score and show an
// honest "Live-Modus nicht verfügbar" note.
//
// "available" is tri-state:
//   null  — not yet probed (or never called)
//   true  — last live call succeeded
//   false — last live call failed (route off, network, malformed, etc.)

import { useCallback, useState } from "react";
import type {
  PlacedWord,
  PracticeRequestBody,
} from "./practice-types";

export interface PracticeApiState {
  /** Whether the last live attempt succeeded. null = not yet attempted. */
  readonly available: boolean | null;
  readonly loading: boolean;
}

export interface PracticeApi extends PracticeApiState {
  /** Run an assembled prompt. Resolves to text, or null if live mode failed. */
  readonly complete: (prompt: string) => Promise<string | null>;
  /** Place a word. Resolves to coordinates, or null if live mode failed. */
  readonly place: (
    word: string,
    existing: readonly { readonly w: string; readonly x: number; readonly y: number }[],
  ) => Promise<PlacedWord | null>;
}

const ENDPOINT = "/api/ai-native/practice";

async function postPractice(body: PracticeRequestBody): Promise<unknown | null> {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

export function usePracticeApi(): PracticeApi {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const complete = useCallback(async (prompt: string): Promise<string | null> => {
    setLoading(true);
    const json = await postPractice({ mode: "complete", prompt });
    setLoading(false);
    const ok =
      json !== null &&
      typeof json === "object" &&
      typeof (json as { text?: unknown }).text === "string";
    setAvailable(ok);
    return ok ? (json as { text: string }).text : null;
  }, []);

  const place = useCallback<PracticeApi["place"]>(async (word, existing) => {
    setLoading(true);
    const json = await postPractice({
      mode: "place-word",
      word,
      existing: existing.map((p) => ({ w: p.w, x: p.x, y: p.y })),
    });
    setLoading(false);
    const obj = json as Partial<PlacedWord> | null;
    const ok =
      obj !== null &&
      typeof obj === "object" &&
      typeof obj.x === "number" &&
      typeof obj.y === "number";
    setAvailable(ok);
    return ok
      ? {
          x: obj!.x as number,
          y: obj!.y as number,
          near: typeof obj!.near === "string" ? obj!.near : "",
          why: typeof obj!.why === "string" ? obj!.why : "",
        }
      : null;
  }, []);

  return { available, loading, complete, place };
}
