"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { notifyUrlStateChanged } from "@/lib/navigation/url-state";
import { getMotionAwareScrollBehavior } from "@/lib/animation-policy";

export interface RailItem {
  readonly id: string;
  readonly num: string;
  readonly label: string;
}

/** Header plus rail when the stylesheet cannot be measured (tests, no CSS). */
const FALLBACK_STACK = 104;

/**
 * The height the fixed header and this sticky rail cover at the top of the
 * viewport: the rail's sticky top (the header height) plus its own height.
 */
function stackHeight(rail: HTMLElement | null): number {
  if (!rail) return FALLBACK_STACK;
  const top = Number.parseFloat(window.getComputedStyle(rail).top);
  const measured = (Number.isFinite(top) ? top : 0) + rail.offsetHeight;
  return measured > 0 ? measured : FALLBACK_STACK;
}

/**
 * Horizontal section dock rendered below the site Nav on all viewport sizes.
 * Starts with a "← Zurück zum Blog" link, then the article's section anchors
 * with active-section sync on scroll. The active item carries
 * aria-current="location" and scrolls into view inside the rail (never the
 * window). On a phone the rail tucks under the header while the reader
 * scrolls down and returns on the way up.
 */
export function RailNav({
  kicker,
  items,
  locale = "de",
}: {
  kicker: string;
  items: readonly RailItem[];
  locale?: Locale;
}) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);
  const railRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const trackedIds = items.map((i) => i.id);

    // Scroll-spy: active = latest tracked section whose top is above the
    // "read line": the measured header and rail plus a small margin. This
    // matches what the reader is looking at.
    const compute = () => {
      const readLine = stackHeight(railRef.current) + 46;
      let currentId: string | null = null;
      for (const id of trackedIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - readLine <= 0) currentId = id;
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

  // Keep the active item in view inside the horizontal rail, so a phone
  // reader always sees where they are. Only the rail scrolls, never the page.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !active || rail.scrollWidth <= rail.clientWidth) return;
    const item = rail.querySelector<HTMLElement>(
      `[data-target="${CSS.escape(active)}"]`,
    );
    if (!item || typeof rail.scrollTo !== "function") return;
    rail.scrollTo({
      left: Math.max(0, item.offsetLeft - (rail.clientWidth - item.offsetWidth) / 2),
      behavior: getMotionAwareScrollBehavior(),
    });
  }, [active]);

  // Phones: tuck the rail under the header on the way down, show it on the
  // way up. The header, the rail and the tab bar together took 28% of a
  // 568px screen. A focused rail never tucks.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const phone =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(max-width: 63.99rem)")
        : null;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (Math.abs(delta) < 8) return;
      lastY = y;
      const tuck =
        Boolean(phone?.matches) &&
        delta > 0 &&
        y > 240 &&
        !rail.contains(document.activeElement);
      rail.toggleAttribute("data-tucked", tuck);
    };
    const show = () => rail.removeAttribute("data-tucked");
    window.addEventListener("scroll", onScroll, { passive: true });
    rail.addEventListener("focusin", show);
    return () => {
      window.removeEventListener("scroll", onScroll);
      rail.removeEventListener("focusin", show);
    };
  }, []);

  const handleClick =
    (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const t = document.getElementById(id);
      if (!t) return;
      // Clear the fixed header and the sticky rail, plus a small margin.
      const offset = stackHeight(railRef.current) + 16;
      const targetTop = t.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({
        top: targetTop,
        behavior: getMotionAwareScrollBehavior(),
      });
      window.history.replaceState(null, "", `#${id}`);
      notifyUrlStateChanged();
    };

  // Keep a keyboard-focused rail item fully visible inside the horizontal
  // scroller (WCAG 2.4.11 Focus Not Obscured).
  const revealOnFocus = (e: React.FocusEvent<HTMLElement>) => {
    e.currentTarget.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: getMotionAwareScrollBehavior(),
    });
  };

  return (
    <nav className="railbar" aria-label={kicker} ref={railRef}>
      <div className="railbar__inner">
        <Link
          href={localizeHref("/blog", locale)}
          className="railbar__back"
          onFocus={revealOnFocus}
          aria-label={locale === "de" ? "Zurück zum Blog" : "Back to the blog"}
        >
          <span aria-hidden="true">←</span>{" "}
          {locale === "de" ? "Zurück" : "Back"}
        </Link>
        <span className="railbar__kicker">{kicker}</span>
        {items.map((i) => (
          <a
            key={i.id}
            href={`#${i.id}`}
            className={`railbar__item${active === i.id ? " railbar__item--active" : ""}`}
            aria-current={active === i.id ? "location" : undefined}
            data-target={i.id}
            onClick={handleClick(i.id)}
            onFocus={revealOnFocus}
          >
            <span className="railbar__num">{i.num}</span>
            {i.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
