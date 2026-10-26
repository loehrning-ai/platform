"use client";

import { useGlas } from "./glas-root";
import { GlasToggle } from "./toggle";

/**
 * The "Weniger Glas" row (glass-spec 8.2): frost instead of live glass,
 * remembered on this device. The web twin of iOS's own clear or tinted
 * setting, because prefers-reduced-transparency only exists in Chromium.
 */
export function LessGlassRow({ label, description }: { readonly label: string; readonly description?: string }) {
  const { lessGlass, setLessGlass } = useGlas();
  return <GlasToggle checked={lessGlass} onChange={setLessGlass} label={label} description={description} className="glas-less" />;
}
