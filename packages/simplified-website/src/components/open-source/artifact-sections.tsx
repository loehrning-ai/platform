import { OpenSourceArtifactCard } from "./artifact-card";
import {
  OPEN_SOURCE_ARTIFACT_SECTIONS,
  type OpenSourceArtifactSection,
} from "@/lib/open-source/artifacts";

export function OpenSourceArtifactSections({
  sections = OPEN_SOURCE_ARTIFACT_SECTIONS,
}: {
  sections?: readonly OpenSourceArtifactSection[];
}) {
  return sections.map((section) => {
    if (section.artifacts.length === 0) return null;

    const headingId = `open-source-${section.kind}-heading`;

    return (
      <section
        key={section.kind}
        aria-labelledby={headingId}
        className="mt-14"
      >
        <h2
          id={headingId}
          className="text-2xl font-bold tracking-[-0.03em] text-foreground"
        >
          {section.heading}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {section.artifacts.map((artifact) => (
            <OpenSourceArtifactCard key={artifact.id} artifact={artifact} />
          ))}
        </div>
      </section>
    );
  });
}
