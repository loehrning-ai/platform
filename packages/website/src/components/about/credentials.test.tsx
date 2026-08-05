import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * credentials.test.tsx (regression coverage)
 *
 * Credentials renders three academic cards from a fixed catalog. The real
 * branching lives in the per-card conditionals:
 *   - `c.subtitle && ...` -> the "KI-Forschung" card has an EMPTY subtitle, so
 *     it must render no subtitle paragraph (the other two cards do), which
 *     means its first <p> is the DETAIL line;
 *   - `"journals" in c && c.journals` -> only the "KI-Forschung" card carries a
 *     journals list (publication + Best Paper Award), so exactly two <li> are
 *     mounted site-wide, nested in that card.
 * framer-motion is stubbed to plain DOM; the lucide icons render as real SVGs.
 * Assertions target those derivations and the exact catalog strings (which are
 * load-bearing academic claims), not layout.
 */

vi.mock("framer-motion", async () => {
  const { createElement, forwardRef } = await import("react");
  const cache = new Map<string, unknown>();
  const DROP = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "custom",
    "whileInView",
    "viewport",
  ]);
  const clean = (p: Record<string, unknown>) => {
    const o: Record<string, unknown> = {};
    for (const k in p) if (!DROP.has(k)) o[k] = p[k];
    return o;
  };
  const m = new Proxy(
    {},
    {
      get: (_t, tag: string) => {
        if (!cache.has(tag)) {
          cache.set(
            tag,
            forwardRef<HTMLElement, Record<string, unknown>>((props, ref) =>
              createElement(tag, { ...clean(props), ref }),
            ),
          );
        }
        return cache.get(tag);
      },
    },
  );
  return { __esModule: true, m, motion: m };
});

import { Credentials } from "./credentials";

describe("<Credentials>", () => {
  it("renders the section heading and all three credential titles", () => {
    render(<Credentials />);
    const sectionHeading = screen.getByRole("heading", {
      name: "Akademischer Hintergrund",
      level: 2,
    });
    expect(sectionHeading).toBeInTheDocument();
    expect(sectionHeading).toHaveClass("js-reveal");
    for (const title of [
      "M.Sc. Informatik",
      "Internationale Ausbildung",
      "KI-Forschung",
    ]) {
      expect(
        screen.getByRole("heading", { name: title, level: 3 }),
      ).toBeInTheDocument();
    }
  });

  it("renders a subtitle only for the cards that define one", () => {
    render(<Credentials />);
    // Cards 0 and 1 carry non-empty subtitles.
    expect(screen.getByText("FAU Erlangen-Nürnberg")).toBeInTheDocument();
    expect(
      screen.getByText("Oxford ML Summer School · EELISA Pisa"),
    ).toBeInTheDocument();

    // KI-Forschung has subtitle: "" -> the `c.subtitle && ...` guard drops the
    // subtitle line, so the FIRST <p> under its heading is the detail.
    const kiCard = screen.getByRole("heading", { name: "KI-Forschung" })
      .parentElement as HTMLElement;
    expect(kiCard.querySelector("p")?.textContent).toBe(
      "Machine Learning in klinischen Studien und angewandter Datenanalyse",
    );

    // A card WITH a subtitle instead leads with the subtitle line.
    const mscCard = screen.getByRole("heading", { name: "M.Sc. Informatik" })
      .parentElement as HTMLElement;
    expect(mscCard.querySelector("p")?.textContent).toBe(
      "FAU Erlangen-Nürnberg",
    );
  });

  it("renders the journals list only for the research credential", () => {
    const { container } = render(<Credentials />);
    // Only KI-Forschung defines `journals` (two entries: the journal
    // publication and the Best Paper Award) -> exactly two <li> site-wide.
    const items = container.querySelectorAll("ul li");
    expect(items).toHaveLength(2);
    expect(items[0]?.textContent).toContain(
      "Publikation: Journal of Evolutionary Intelligence",
    );
    expect(items[1]?.textContent).toContain(
      "Best Paper Award: Machine Learning in klinischen Studien",
    );

    // That list is nested inside the KI-Forschung card, not the others.
    const kiCard = screen.getByRole("heading", { name: "KI-Forschung" })
      .parentElement as HTMLElement;
    expect(kiCard.querySelector("ul li")).not.toBeNull();
    const mscCard = screen.getByRole("heading", { name: "M.Sc. Informatik" })
      .parentElement as HTMLElement;
    expect(mscCard.querySelector("ul")).toBeNull();
  });

  it("renders the detail line for every credential card", () => {
    render(<Credentials />);
    expect(
      screen.getByText(
        "Abschluss mit Auszeichnung, Deutschlandstipendium. Schwerpunkt Daten, Machine Learning und Software Engineering",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("NLP × Finance (Oxford) · Innovation Management (SSSA)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Machine Learning in klinischen Studien und angewandter Datenanalyse",
      ),
    ).toBeInTheDocument();
  });
});
