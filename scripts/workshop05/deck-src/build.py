#!/usr/bin/env python3
"""Assemble the Workshop 05 deck (slides.html) from its partials.

Run from anywhere:  python3 scripts/workshop05/deck-src/build.py

Partials, one set per slide range so reviewers can own a range:
  s01-s04.{html,css,js}  s05-s08.{html,css,js}  s09-s12.{html,css,js}  s13-end.{html,css,js}
Shared pieces: sprite.html (icons and lights), shared.css, shared.js, notes.json (presenter notes, one string per slide).
Runtime (not inlined): lib/tokens.css, lib/deck.css, lib/motion.css, lib/deck-stage.js, lib/motion.js, lib/geo.js, lib/globe.js.

Placeholders in a partial are replaced per slide:
  <!--@amb-->    ambient backdrop         <!--@route-->  route bar, from the section's data-route="0..4"
  <!--@foot-->   footer with the page number only (no cover footer: the cover has no page counter)
"""
import json
import os
import re
import sys
from typing import Optional

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "..", "packages", "website", "public", "workshops", "ki-im-unternehmen-sicher-nutzen", "slides.html"))
RANGES = ["s01-s04", "s05-s08", "s09-s12", "s13-end"]
STOPS = ["ACCOUNT", "PLACE", "PASTE", "LAW", "PAGE"]
BACK_HREF = "/workshops/ki-im-unternehmen-sicher-nutzen"
MAIN = 12


def read(name: str, required: bool = True) -> str:
    path = os.path.join(HERE, name)
    if not os.path.exists(path):
        if required:
            sys.exit("missing partial: " + name)
        return ""
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def attr(tag: str, name: str) -> Optional[str]:
    m = re.search(r'\b' + re.escape(name) + r'="([^"]*)"', tag)
    return m.group(1) if m else None


def decorate(section: str) -> str:
    open_tag = re.match(r"<section\b[^>]*>", section).group(0)
    n = attr(open_tag, "data-n")
    kind = attr(open_tag, "data-kind")
    route = attr(open_tag, "data-route")
    if kind == "main":
        pager = '<b>%s</b> / %02d' % (n, MAIN)
    else:
        pager = '<b>%s</b> / appendix' % n
    amb = '<div class="amb" aria-hidden="true"><i></i><i></i><i></i></div>'
    foot = '<footer class="foot"><span class="pg">%s</span></footer>' % pager
    if route is not None:
        stops = "".join('<span class="route-stop">%s</span>' % s for s in STOPS)
        rt = ('<nav class="route" data-stop="%s" aria-label="Route: account, place, paste, law, page">'
              '<div class="route-stops">%s</div><i class="route-track"></i><i class="route-dot"></i></nav>') % (route, stops)
    else:
        rt = ""
    if n == "01":
        foot = ""
    section = section.replace("<!--@amb-->", amb).replace("<!--@foot-->", foot).replace("<!--@route-->", rt)
    return section


def main() -> None:
    partial = "--partial" in sys.argv  # development: build whatever partials exist, skip the whole-deck checks
    sections, css, js = [], [read("shared.css")], [read("shared.js", False)]
    for rng in RANGES:
        html = read(rng + ".html", not partial)
        if not html and partial:
            continue
        found = re.findall(r"<section\b.*?</section>", html, flags=re.S)
        if not found:
            sys.exit("no sections in " + rng)
        sections += [decorate(s) for s in found]
        css.append(read(rng + ".css", False))
        js.append(read(rng + ".js", False))

    notes = json.loads(read("notes.json", not partial) or "[]")
    if partial:
        notes = (notes + [""] * len(sections))[: len(sections)]
    if len(notes) != len(sections):
        sys.exit("notes.json has %d entries for %d slides" % (len(notes), len(sections)))

    head = """<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Where Your Data Goes: Using Claude at Work · loehrning.ai</title>
<meta name="description" content="A customer asks where its data goes. Check your own Claude account, sort what people paste, see the EU AI Act in four boxes and write one page." />
<link rel="icon" href="./assets/favicon.svg" />
<link rel="stylesheet" href="./lib/tokens.css" />
<link rel="stylesheet" href="./lib/deck.css" />
<link rel="stylesheet" href="./lib/motion.css" />
<style data-part="shared and slides">
%s
</style>
<script src="./lib/deck-stage.js"></script>
</head>
<body>
%s
<a class="deck-back" href="%s" aria-label="Back to the workshop page">← Workshop</a>

<!-- speaker notes, one per slide in deck order (deck-stage.js reads them when <deck-stage> connects, so they stay above it).
     Presenter view: press P (lib/presenter.js). Lines in a note: Time, Say, Students, Cue, Remember. -->
<script type="application/json" id="speaker-notes">
%s
</script>

<deck-stage width="1920" height="1080" data-total="%d">
""" % ("\n".join(c for c in css if c.strip()), read("sprite.html"), BACK_HREF, json.dumps(notes, indent=0, ensure_ascii=False), len(sections))

    tail_scripts = ['<script src="./lib/geo.js"></script>', '<script src="./lib/globe.js"></script>', '<script src="./lib/motion.js"></script>', '<script src="./lib/presenter.js"></script>']
    for name, code in zip(["shared"] + RANGES, js):
        if code.strip():
            # a slide script needs the engine; without it the slide simply stays static
            tail_scripts.append('<script data-part="%s">\nif (window.DECK) {\n%s\n}\n</script>' % (name, code.strip()))
    html = head + "\n".join(sections) + "\n</deck-stage>\n" + "\n".join(tail_scripts) + "\n</body>\n</html>\n"

    # checks the registry tests lean on
    main_secs = [s for s in sections if 'data-kind="main"' in re.match(r"<section\b[^>]*>", s).group(0)]
    seconds = sum(int(attr(re.match(r"<section\b[^>]*>", s).group(0), "data-seconds")) for s in main_secs)
    for s in sections:
        tag = re.match(r"<section\b[^>]*>", s).group(0)
        for a in ("data-n", "data-act", "data-kind", "data-label", "data-seconds", "data-note"):
            if attr(tag, a) is None:
                sys.exit("%s is missing %s" % (attr(tag, "data-n"), a))
    if not partial and (len(main_secs) != MAIN or seconds != 4500):
        sys.exit("main slides %d, seconds %d (want %d and 4500)" % (len(main_secs), seconds, MAIN))
    bad = [m for m in re.finditer("[–—]", html)]
    if bad:
        sys.exit("em or en dash at offset %d: %r" % (bad[0].start(), html[max(0, bad[0].start() - 40):bad[0].start() + 40]))
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(html)
    print("%s: %d bytes, %d lines, %d slides (%d main = %d s, %d appendix)" % (os.path.relpath(OUT), len(html.encode()), html.count("\n"), len(sections), len(main_secs), seconds, len(sections) - len(main_secs)))


if __name__ == "__main__":
    main()
