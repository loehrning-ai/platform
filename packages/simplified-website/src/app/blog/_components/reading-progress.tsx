"use client";

import { useEffect, useRef } from "react";

export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = h <= 0 ? 0 : Math.max(0, Math.min(1, window.scrollY / h)) * 100;
      if (barRef.current) barRef.current.style.width = `${pct}%`;
    };
    handle();
    window.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
    };
  }, []);

  return <div ref={barRef} className="progress" id="progress" />;
}
