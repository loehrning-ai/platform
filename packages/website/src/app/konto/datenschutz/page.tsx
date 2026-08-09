import { DatenschutzClient } from "./datenschutz-client";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function DatenschutzPage() {
  const locale = await getRequestLocale();
  return <DatenschutzClient locale={locale} />;
}
