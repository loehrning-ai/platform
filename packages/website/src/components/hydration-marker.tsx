"use client";

import { useEffect, useRef } from "react";

/**
 * Document-level readiness signal owned by a leaf client island.
 *
 * This component must remain a sibling after the server-owned route tree. It
 * must never wrap App Router children or mutate the document singleton while
 * React is still claiming streamed route markup.
 */
export function HydrationMarker() {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    marker.dataset.hydrated = "true";
    return () => {
      delete marker.dataset.hydrated;
    };
  }, []);

  return (
    <span
      ref={markerRef}
      data-app-hydration-marker="true"
      hidden
      aria-hidden="true"
    />
  );
}
