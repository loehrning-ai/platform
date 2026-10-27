import type { DemoComponentProps } from "@/components/demos/demo-page";
import { formatBytes } from "@/components/demos/take-home/for-your-claude";
import { COPY } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { takeHomeFor } from "@/lib/demo-takehome";
import { resolveKit } from "@/lib/demo-takehome.server";
import { Fehlerliste } from "./fehlerliste";

/**
 * "Die Fehlerliste" (workshop 1) on the v4 shell: the kit prognose-pruefen
 * visualized. The server picks one language pack and reads the kit zip's
 * size; the client demo never sends the visitor's data anywhere.
 */
export default function Demo({ locale }: DemoComponentProps) {
  const entry = takeHomeFor("ki-prognosen-einschaetzen");
  if (!entry) throw new Error("W01 has no take-home entry");
  const kit = resolveKit(entry.kit[locale]);
  return <Fehlerliste copy={COPY[locale]} kitHref={kit.href} kitSize={formatBytes(kit.bytes, locale)} />;
}
