"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { DemoIntroContent } from "@/components/demos/glas/intro";
import type { GlasTone } from "@/lib/glas";

/** What the v4 page hands to the stage: the intro card's strings, already localized. */
export interface DemoV4Page {
  readonly intro: DemoIntroContent;
  /** The stage's glass tone, chosen statically from the workshop palette (glasToneFor). */
  readonly stageTone: GlasTone;
}

const DemoV4Context = createContext<DemoV4Page | null>(null);

export function DemoV4Provider({ value, children }: { readonly value: DemoV4Page; readonly children: ReactNode }) {
  return <DemoV4Context.Provider value={value}>{children}</DemoV4Context.Provider>;
}

export function useDemoV4Page(): DemoV4Page {
  const value = useContext(DemoV4Context);
  if (!value) throw new Error("DemoGlasStage runs on the v4 page only: set SHELL = \"v4\" in the demo's intro.ts");
  return value;
}
