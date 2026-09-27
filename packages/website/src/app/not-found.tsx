import { BrandButton } from "@/components/ui/brand-button";
import { localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function NotFound() {
  const locale = await getRequestLocale();
  const copy =
    locale === "en"
      ? {
          title: "Page not found.",
          body: "This page does not exist or has moved.",
          home: "Back to home",
        }
      : {
          title: "Seite nicht gefunden.",
          body: "Diese Seite gibt es nicht oder sie ist umgezogen.",
          home: "Zur Startseite",
        };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 font-mono text-6xl font-bold text-brand-orange">
        404
      </span>
      <h1 className="text-3xl font-bold tracking-[-0.04em] text-foreground">
        {copy.title}
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">{copy.body}</p>
      <div className="mt-8">
        <BrandButton
          href={localizeHref("/", locale)}
          variant="primary"
          surface="light"
        >
          {copy.home}
        </BrandButton>
      </div>
    </div>
  );
}
