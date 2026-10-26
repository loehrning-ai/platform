# Workshop 06 on loehrning.ai: what changed against the rotfaden build

Workshop 06 "Welches Angebot ist günstiger?" was built with rotfaden (example `angebote-mit-ki-vergleichen`, rotfaden
commit b31ba1c). Its own `source/BUILD-LOG.md` lists 9 places where the build left the skill's path by hand. Bringing it
onto this site changed 5 more. The provenance line on the workshop page adds both lists: 9 plus 5 is 14
(`workshops-offers.test.ts` counts the numbered items of both files).

The deck (`slides.html`) and every kit file not named below are the rotfaden output, byte for byte.

## Changes for the site: 5 places

1. **The demo is a React port.** `/demos/angebote-mit-ki-vergleichen` runs on the site's v3 demo shell instead of
   rotfaden's `demo.html`. It imports `demo.json` with one caption shortened (item 5)
   (`packages/website/src/lib/demo-cases/angebote-mit-ki-vergleichen/demo.json`) and reads the case from the kit's
   `kostenzeilen.csv` with the same parser and the same rule: a line one offer lacks is open, never 0. Like the kit, it
   counts one year; rotfaden's horizon switch is left out.
2. **The skill speaks both languages.** `content/skills/angebote-vergleichen/SKILL.md` adds an English trigger clause
   to the description (187 characters, the claude.ai limit is 200), one line with the English words for the cost lines,
   two rules under "Nie" (a missing line is never counted as 0; keys and tokens are never repeated) and an English
   section, as every skill on this site has. The kit carries this skill.
3. **`take-home/INSTALL.md` uses the site's install text** (`src/lib/claude-ui.ts`), in German and in English, so the
   kit, the demo page in both languages and every other workshop say the same steps.
4. **No zip inside the zip.** The site's zip check forbids nested archives, so `take-home/angebote-vergleichen.zip`
   left the kit. The same skill is one tap away at `/skills/angebote-vergleichen.zip`; `INSTALL.md` says where.
5. **The reveal caption is shorter.** rotfaden's caption for the "Kipp" beat named the guess, the last offer with its
   total, the winner, the gap and the runner-up. The site's stage shows a caption in two lines at most, and on a phone
   the sentence was cut after the last total. It now reads "Geliefert und bezahlt gewinnt {winner}, um {gap}. {last}
   ist am teuersten." The guess and every total stay on the stage itself.

The kit zip is rebuilt by `build-kit.mjs` with the site's one zip writer (`src/lib/zip/store.ts`).
