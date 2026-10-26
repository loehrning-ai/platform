"use client";

import { useEffect, useRef, useState } from "react";
import type { DerivedFilm } from "@/lib/open-source/artifacts";

/**
 * A real output film without native controls, which would cover the frame
 * on a phone. It loads nothing before the first press, loops muted, and
 * stops when it leaves the view or the tab is hidden.
 */
export function OutputFilm({
  film,
  title,
  labels,
}: {
  readonly film: DerivedFilm;
  readonly title: string;
  readonly labels: { readonly play: string; readonly pause: string };
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const stop = () => video.pause();
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) stop();
    });
    observer.observe(video);
    const onHidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, []);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => setPlaying(false));
    else video.pause();
  };

  return (
    <>
      <video
        ref={videoRef}
        className="block h-auto w-full border border-foreground bg-[#121212]"
        // An upright film stops at 80 % of the viewport height, so its
        // play button stays on screen with the frame.
        style={{
          maxWidth: `min(${film.width}px, calc(80svh * ${film.width} / ${film.height}))`,
          aspectRatio: `${film.width} / ${film.height}`,
        }}
        muted
        loop
        playsInline
        preload="none"
        poster={film.poster.src}
        width={film.width}
        height={film.height}
        disablePictureInPicture
        disableRemotePlayback
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src={film.src} type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={toggle}
        className="mt-3 inline-flex min-h-11 min-w-[7.5rem] items-center justify-center border-2 border-foreground bg-background px-4 text-sm font-semibold text-foreground transition-colors duration-100 hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background active:bg-foreground active:text-background"
      >
        {playing ? labels.pause : labels.play}
        <span className="sr-only">{`: ${title}`}</span>
      </button>
    </>
  );
}
