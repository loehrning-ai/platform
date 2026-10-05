"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface NetworkInformationLike {
  readonly saveData?: boolean;
}

/**
 * True when decorative entrance motion should be skipped: the learner asked
 * for reduced motion, or the browser reports Save-Data. Purposeful state
 * changes (a ring filling after a real completion) still resolve, but the
 * drawn hero path, spring-in cards and the completion burst render in their
 * final state. Server render and the first client render agree (false for
 * Save-Data until mounted), so hydration never changes markup.
 */
export function useCalmMotion(): boolean {
  const reduce = useReducedMotion();
  const [saveData, setSaveData] = useState(false);
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformationLike })
      .connection;
    setSaveData(connection?.saveData === true);
  }, []);
  return Boolean(reduce) || saveData;
}
