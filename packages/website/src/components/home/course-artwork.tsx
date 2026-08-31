import Image from "next/image";
import { cn } from "@/lib/utils";

interface CourseArtworkProps {
  readonly src: string;
  readonly wide: boolean;
  readonly plateClassName: string;
  readonly accentClassName: string;
}

/**
 * A static, server-rendered editorial plate. The two registration layers move
 * a few pixels with the parent card's hover/focus state; the artwork and all
 * course information remain visible on touch and with reduced motion.
 */
export function CourseArtwork({
  src,
  wide,
  plateClassName,
  accentClassName,
}: CourseArtworkProps) {
  return (
    <span
      data-course-artwork
      className={cn(
        "relative block aspect-[16/7] overflow-hidden border-b border-foreground/10 bg-paper",
        plateClassName,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 translate-x-0 translate-y-0 border-[3px] border-brand-cobalt/20 transition-transform duration-300 group-hover:-translate-x-1 group-hover:translate-y-1 group-focus-visible:-translate-x-1 group-focus-visible:translate-y-1 motion-reduce:transform-none motion-reduce:transition-none"
      />
      <Image
        src={src}
        alt=""
        width={1440}
        height={630}
        loading="lazy"
        fetchPriority="low"
        decoding="async"
        sizes={
          wide
            ? "(min-width: 1280px) 606px, (min-width: 1024px) 54vw, calc(100vw - 48px)"
            : "(min-width: 1280px) 426px, (min-width: 1024px) 38vw, calc(100vw - 48px)"
        }
        className="absolute inset-0 h-full w-full scale-[1.008] object-cover object-center transition-transform duration-300 group-hover:translate-x-[3px] group-hover:-translate-y-[2px] group-hover:scale-[1.015] group-focus-visible:translate-x-[3px] group-focus-visible:-translate-y-[2px] group-focus-visible:scale-[1.015] motion-reduce:transform-none motion-reduce:transition-none"
      />
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
