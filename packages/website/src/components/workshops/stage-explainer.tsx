import type { ReactNode } from "react";
import type { Workshop } from "@/lib/workshops";

interface Props {
  readonly workshop: Workshop;
}

/**
 * The one always-visible explainer under the stage cards: what the kit (or,
 * for a workshop without a kit zip, the lab) is and what you do with it.
 * Heading as a question, two short sentences, then two or three plain facts.
 * The text lives in the registry (`Workshop.stageExplainer`, per locale), so
 * a new workshop adds data and no page code. Nothing here opens or closes:
 * the page never hides content behind a toggle (docs/workshop-standard.md).
 */
export function StageExplainer({ workshop }: Props): ReactNode {
  const { heading, body, facts } = workshop.stageExplainer;
  return (
    <section
      aria-labelledby="workshop-explainer-heading"
      data-stage-explainer=""
      className="mx-auto max-w-[75rem] px-4 pt-6 sm:px-6 sm:pt-8"
    >
      <div className="border-t-2 border-scene-line pt-4 sm:grid sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:gap-x-10 sm:pt-5">
        <h2
          id="workshop-explainer-heading"
          className="text-[1.25rem]/[1.2] font-bold text-foreground text-balance"
        >
          {heading}
        </h2>
        <div className="mt-2 sm:mt-0">
          <p className="max-w-[58ch] text-[1rem]/[1.55] text-foreground text-pretty sm:text-[1.0625rem]/[1.55]">
            {body}
          </p>
          {facts && facts.length > 0 ? (
            <ul
              data-workshop-facts=""
              className="mt-3 flex list-none flex-wrap gap-2 p-0 tabular-nums"
            >
              {facts.map((fact) => (
                <li
                  key={fact}
                  className="border-[1.5px] border-foreground px-2.5 py-1 text-[1rem]/[1.3] font-semibold text-foreground"
                >
                  {fact}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
