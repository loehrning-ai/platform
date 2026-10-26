"use client";

import { useEffect, useRef } from "react";
import type { DerivedFilm } from "@/lib/open-source/artifacts";
import { driverSlot, type StageDriver } from "./stage-driver";

/**
 * A muted specimen film driven only through `seek`, `play` and `pause`. It
 * loads nothing until the first interaction or autoplay; until then, and
 * without JavaScript, the poster (the rest frame) is the stage.
 */
export function FilmStage({
  id,
  film,
}: {
  readonly id: string;
  readonly film: DerivedFilm;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let prepared = false;
    const prepare = () => {
      if (prepared) return;
      prepared = true;
      video.preload = "auto";
      video.load();
    };
    const driver: StageDriver = {
      prepare,
      seek(s, fast) {
        prepare();
        if (fast && typeof video.fastSeek === "function") video.fastSeek(s);
        else video.currentTime = s;
      },
      play(fromS) {
        prepare();
        video.currentTime = fromS;
        video.play().catch(() => undefined);
      },
      pause() {
        video.pause();
      },
      time() {
        return video.currentTime;
      },
    };
    const slot = driverSlot(id);
    slot.current = driver;
    return () => {
      video.pause();
      if (slot.current === driver) slot.current = null;
    };
  }, [id]);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full bg-[#121212] object-cover"
      muted
      playsInline
      preload="none"
      poster={film.poster.src}
      disablePictureInPicture
      disableRemotePlayback
      width={film.width}
      height={film.height}
    >
      <source src={film.src} type="video/mp4" />
    </video>
  );
}
