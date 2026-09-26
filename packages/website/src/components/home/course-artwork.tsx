import Image from "next/image";

/**
 * The course cover as a flat, framed object, from lg only: a 1px ink frame on
 * the Bogen sheet, no shadow, no registration layers and no hover motion. The
 * phone rows are hairline rows led by the course number, so below lg the
 * plate is not rendered and its lazy image is never requested.
 */
export function CourseArtwork({ src }: { readonly src: string }) {
  return (
    <span
      data-course-artwork
      className="relative block aspect-[16/9] overflow-hidden border border-foreground bg-card max-lg:hidden"
    >
      <Image
        src={src}
        alt=""
        width={1440}
        height={630}
        loading="lazy"
        fetchPriority="low"
        decoding="async"
        sizes="(min-width: 1280px) 282px, 23vw"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
    </span>
  );
}
