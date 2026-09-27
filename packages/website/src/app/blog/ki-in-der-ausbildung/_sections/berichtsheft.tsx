import { Rich } from "./rich";
import { SectionHead, copyFor, type SectionProps } from "./shared";

export function Berichtsheft({ locale, context }: SectionProps) {
  const paragraphs = copyFor(locale).berichtsheft;

  return (
    <section
      className="wz-section"
      id="berichtsheft"
      aria-labelledby="berichtsheft-h"
    >
      <SectionHead id="berichtsheft" index="04" locale={locale} />
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
