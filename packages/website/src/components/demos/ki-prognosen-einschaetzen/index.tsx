import { COPY } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import type { DemoComponentProps } from "@/components/demos/demo-page";
import { Fehlerliste } from "./fehlerliste";

/**
 * "Die Fehlerliste" (workshop 1): the kit prognose-pruefen visualized. The
 * server picks one language pack; the client demo runs on the v3 shell's
 * clock and never sends the visitor's data anywhere.
 */
export default function Demo({ locale }: DemoComponentProps) {
  return <Fehlerliste copy={COPY[locale]} />;
}
