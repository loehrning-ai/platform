import Image from "next/image";
import { PosterArt } from "@/components/plakat/poster-art";
import {
  COURSE_PICTURE_HEIGHT,
  COURSE_PICTURE_WIDTH,
  coursePeoplePicture,
} from "@/components/course/course-people-picture";
import { coursePlakat } from "@/lib/plakat/palettes";
import { cn } from "@/lib/utils";

interface CourseArtworkProps {
  readonly slug: string;
  readonly wide: boolean;
  readonly plateClassName: string;
  readonly accentClassName: string;
}

/**
 * A static, server-rendered editorial plate: the course's people picture
 * (public/course-covers, recoloured to Ultramarin, Butter and Mennige) in a
 * thin registration frame. The two registration layers move a few pixels
 * with the parent card's hover/focus state; the artwork and all course
 * information remain visible on touch and with reduced motion. A course
 * without a picture shows its poster in the same plate.
 */
export function CourseArtwork({
  slug,
  wide,
  plateClassName,
  accentClassName,
}: CourseArtworkProps) {
  const picture = coursePeoplePicture(slug);
  const poster = picture ? undefined : coursePlakat(slug);
  return (
    <span
      data-course-artwork
      className={cn(
        "relative block h-full min-h-[4.75rem] overflow-hidden border-r border-foreground/10 bg-paper sm:aspect-[16/7] sm:h-auto sm:min-h-0 sm:border-b sm:border-r-0",
        plateClassName,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 translate-x-0 translate-y-0 border-[3px] border-brand-cobalt/20 transition-transform duration-300 group-hover:-translate-x-1 group-hover:translate-y-1 group-focus-visible:-translate-x-1 group-focus-visible:translate-y-1 motion-reduce:transform-none motion-reduce:transition-none"
      />
      {picture ? (
        <Image
          src={picture.src}
          alt=""
          width={COURSE_PICTURE_WIDTH}
          height={COURSE_PICTURE_HEIGHT}
          loading="lazy"
          fetchPriority="low"
          decoding="async"
          sizes={
            wide
              ? "(max-width: 639px) 220px, (min-width: 1280px) 606px, (min-width: 1024px) 54vw, (min-width: 768px) calc(50vw - 60px), calc(100vw - 48px)"
              : "(max-width: 639px) 220px, (min-width: 1280px) 426px, (min-width: 1024px) 38vw, (min-width: 768px) calc(50vw - 60px), calc(100vw - 48px)"
          }
          className={cn(
            "absolute inset-0 h-full w-full scale-[1.008] object-cover transition-transform duration-300 group-hover:translate-x-[3px] group-hover:-translate-y-[2px] group-hover:scale-[1.015] group-focus-visible:translate-x-[3px] group-focus-visible:-translate-y-[2px] group-focus-visible:scale-[1.015] motion-reduce:transform-none motion-reduce:transition-none sm:object-center",
            picture.focus,
          )}
        />
      ) : poster ? (
        <span aria-hidden="true" className="absolute inset-0 block">
          <PosterArt
            plakat={poster.plakat}
            motif={poster.motif}
            numeral={null}
            format="landscape"
          />
        </span>
      ) : null}
      <span
        aria-hidden="true"
        className="absolute inset-[7px] border border-paper/55 mix-blend-screen transition-transform duration-300 group-hover:-translate-x-[3px] group-hover:translate-y-[2px] group-focus-visible:-translate-x-[3px] group-focus-visible:translate-y-[2px] motion-reduce:transform-none motion-reduce:transition-none"
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute bottom-0 left-0 h-1.5 w-0 transition-[width] duration-300 group-hover:w-1/3 group-focus-visible:w-1/3 motion-reduce:transition-none",
          accentClassName,
        )}
      />
    </span>
  );
}
