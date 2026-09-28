import { PosterArt } from "@/components/plakat/poster-art";
import { coursePlakat } from "@/lib/plakat/palettes";

/**
 * The course's poster, from lg only: the Grundlagenpfad course in its track
 * scene (Lemons: Ultramarin, Butter, Mennige), its numeral and its motif, in
 * the 16:9 landscape crop (SPEC §3.5). A flat printed object: no frame, no
 * shadow, no filter and no hover motion. Server-rendered SVG, decorative
 * (the title beside it names the course), so there is no image request at
 * all. The phone rows are hairline rows led by the course number, so below
 * lg the poster is not rendered.
 */
export function CourseArtwork({ slug }: { readonly slug: string }) {
  const poster = coursePlakat(slug);
  if (!poster) return null;
  return (
    <span
      data-course-artwork
      className="relative block aspect-[16/9] overflow-hidden max-lg:hidden"
    >
      <PosterArt
        plakat={poster.plakat}
        motif={poster.motif}
        numeral={poster.numeral}
        format="landscape"
      />
    </span>
  );
}
