import type { ReactNode } from "react";
import { LernbegleiterStrip } from "@/components/learning/lernbegleiter-strip";

export default function AiNativeKursLayout({ children }: { readonly children: ReactNode }) {
  return (
    <>
      <div className="pb-16">
        {children}
      </div>
      <LernbegleiterStrip />
    </>
  );
}
