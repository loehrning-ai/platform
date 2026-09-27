import { Rich } from "./rich";
import { SectionHead, copyFor, type SectionProps } from "./shared";

export function Grenzen({ locale, context }: SectionProps) {
  const paragraphs = copyFor(locale).grenzen;

  return (
    <section className="wz-section" id="grenzen" aria-labelledby="grenzen-h">
      <SectionHead id="grenzen" index="05" locale={locale} />
      <div className="wz-body wz-prose">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>
            <Rich source={paragraph} context={context} />
          </p>
        ))}
      </div>
    </section>
  );
}
