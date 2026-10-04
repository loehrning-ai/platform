"use client";

import { createContext, useContext } from "react";

/**
 * Set by the lesson-engine reader around the one exercise of a lesson.
 * Widgets use it to drop their own outer chrome (the reader already shows
 * the exercise title and instructions) and to report completion.
 */
export interface LabEmbedContextValue {
  readonly embedded: boolean;
  /** Called once when the exercise reaches its done state. */
  readonly onComplete?: () => void;
}

export const LabEmbedContext = createContext<LabEmbedContextValue>({
  embedded: false,
});

export function useLabEmbed(): LabEmbedContextValue {
  return useContext(LabEmbedContext);
}
