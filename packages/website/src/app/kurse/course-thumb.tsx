import Image from "next/image";
import { coursePeoplePicture } from "@/components/course/course-people-picture";
import { PosterThumb, POSTER_THUMB_SIZE } from "@/components/plakat/poster-thumb";
import { cx } from "@/components/werk/cx";
import { coursePlakat } from "@/lib/plakat/palettes";

/**
 * Rendered widths of a 1440 x 630 cover cropped (object-cover) into the 4:5
 * box: the picture is as tall as the box, so it is 16/7 x 5/4 = 2.86 times
 * the box width.
 */
const PICTURE_SIZES = {
  xs: "183px",
  sm: "(min-width: 1024px) 275px, (min-width: 640px) 229px, 206px",
} as const;

/**
 * The course's thumbnail in the /kurse ledger and the next-course sheet, in
 * the poster's 4:5 box. The Grundlagenpfad courses show their people picture,
 * cropped to its subject, with a hairline edge (the cover's cream ground is
 * close to the page) and their sequence number on an Ultramarin tab (Butter
 * on Ultramarin, 10.97:1). The Technikkurse keep their poster. Decorative:
 * the row's heading and link name the course, so the thumb is aria-hidden,
 * the picture's alt is empty and nothing here takes focus.
 */
export function CourseThumb({
  slug,
  numeral,
  size,
  className,
}: {
  readonly slug: string;
  /** "01" to "04" for the Grundlagenpfad rows; null where the number would repeat. */
  readonly numeral: string | null;
  readonly size: "xs" | "sm";
  readonly className?: string;
}) {
  const picture = coursePeoplePicture(slug);
  if (picture) {
    return (
      <span
        aria-hidden="true"
        data-course-thumb="picture"
        className={cx(
          "relative block aspect-[4/5] shrink-0 overflow-hidden bg-paper after:pointer-events-none after:absolute after:inset-0 after:border after:border-foreground/15 after:content-['']",
          POSTER_THUMB_SIZE[size],
          className,
        )}
      >
        <Image
          src={picture.src}
          alt=""
          fill
          sizes={PICTURE_SIZES[size]}
          className={cx("object-cover", picture.focus)}
        />
        {numeral ? (
          <span
            data-course-thumb-numeral
            className="absolute left-0 top-0 bg-ultramarin px-1.5 pb-1 pt-0.5 text-[0.8125rem] font-bold leading-none tracking-[-0.02em] text-butter tabular-nums sm:text-[0.9375rem]"
          >
            {numeral}
          </span>
        ) : null}
      </span>
    );
  }
  const poster = coursePlakat(slug);
  if (poster) {
    return (
      <PosterThumb
        plakat={poster.plakat}
        motif={poster.motif}
        numeral={numeral}
        size={size}
        className={className}
      />
    );
  }
  return <span aria-hidden="true" className={className} />;
}
