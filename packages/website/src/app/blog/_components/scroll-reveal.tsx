"use client";

import { useLayoutEffect } from "react";

/**
 * Attaches an IntersectionObserver that toggles `.revealed` on any element
 * matching the supplied selectors. Mirrors the behavior of post.js /
 * konkurrenz.js reveal observers. When `wrapHeadings` is true, any `.heading`
 * element that also matches the selectors has its text nodes split into
 * `.word-reveal` spans for staggered reveal.
 */
export function ScrollReveal({
  selectors,
  threshold = 0.2,
  once = true,
  wrapHeadings = false,
}: {
  selectors: string[];
  threshold?: number;
  once?: boolean;
  wrapHeadings?: boolean;
}) {
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const query = selectors.join(", ");
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(query));
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) return;

    const scope =
      nodes[0]?.closest<HTMLElement>(".blog-root") ??
      document.querySelector<HTMLElement>(".blog-root");
    if (!scope) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            if (once) obs.unobserve(entry.target);
          }
        }
      },
      { threshold },
    );

    if (wrapHeadings) {
      for (const el of nodes) {
        if (!el.classList.contains("heading")) continue;
        if (el.dataset.wrapped === "true") continue;
        // If the heading is already visible on load, pre-mark it as revealed
        // BEFORE wrapping so the newly-created spans don't flash invisible.
        const rect = el.getBoundingClientRect();
        const inView = rect.top < window.innerHeight * 0.9 && rect.bottom > 0;
        if (inView) el.classList.add("revealed");
        const counter = { n: 0 };
        const wrap = (node: Node): Node => {
          if (node.nodeType === Node.TEXT_NODE) {
            const parts = (node.textContent ?? "").split(/(\s+)/);
            const frag = document.createDocumentFragment();
            for (const part of parts) {
              if (/\s+/.test(part)) {
                frag.appendChild(document.createTextNode(part));
              } else if (part.length) {
                const span = document.createElement("span");
                span.className = "word-reveal";
                span.style.setProperty("--i", String(counter.n++));
                span.textContent = part;
                frag.appendChild(span);
              }
            }
            return frag;
          }
          if (node.nodeType === Node.ELEMENT_NODE) {
            const clone = (node as Element).cloneNode(false) as Element;
            node.childNodes.forEach((ch) => clone.appendChild(wrap(ch)));
            return clone;
          }
          return node.cloneNode(true);
        };
        const wrapped = wrap(el);
        el.replaceChildren();
        while (wrapped.firstChild) el.appendChild(wrapped.firstChild);
        el.dataset.wrapped = "true";
      }
    }

    for (const n of nodes) obs.observe(n);
    scope.dataset.scrollReveal = "active";
    return () => {
      obs.disconnect();
      delete scope.dataset.scrollReveal;
    };
  }, [selectors, threshold, once, wrapHeadings]);

  return null;
}
