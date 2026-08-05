"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export interface RailItem {
  readonly id: string;
  readonly num: string;
  readonly label: string;
}

/**
 * Horizontal section dock rendered below the site Nav on all viewport sizes.
 * Starts with a "← Zurück zum Blog" link, then the article's section anchors
 * with active-section sync via IntersectionObserver.
 */
export function RailNav({
  kicker,
  items,
}: {
  kicker: string;
  items: readonly RailItem[];
}) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const trackedIds = items.map((i) => i.id);

    // Scroll-spy: active = latest tracked section whose top is above the
    // "read line" (150px: accounts for site Nav 64px + sticky railbar ~56px +
    // a small visual margin). This matches what the reader is looking at.
    const READ_LINE = 150;
    const compute = () => {
      let currentId: string | null = null;
      for (const id of trackedIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - READ_LINE <= 0) currentId = id;
      }
      if (!currentId) currentId = trackedIds[0] ?? null;
      setActive((prev) => (prev === currentId ? prev : currentId));
    };

    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [items]);

  const handleClick = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const t = document.getElementById(id);
    if (!t) return;
    // Account for the fixed site Nav (64px) + sticky railbar (~50px).
    const offset = 120;
    const targetTop = t.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: targetTop, behavior: "smooth" });
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav className="railbar" aria-label={kicker}>
      <div className="railbar__inner">
        <Link href="/blog" className="railbar__back" aria-label="Zurück zum Blog">
          <span aria-hidden="true">←</span> Zurück
        </Link>
        <span className="railbar__kicker">{kicker}</span>
        {items.map((i) => (
          <a
            key={i.id}
            href={`#${i.id}`}
            className={`railbar__item${active === i.id ? " railbar__item--active" : ""}`}
            data-target={i.id}
            onClick={handleClick(i.id)}
          >
            <span className="railbar__num">{i.num}</span>
            {i.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
