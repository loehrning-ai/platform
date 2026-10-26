# Workshop 06 on loehrning.ai: what changed against the rotfaden build

Workshop 06 "Welches Angebot ist günstiger?" was built with rotfaden (example `angebote-mit-ki-vergleichen`, rotfaden
commit b31ba1c). Its own `source/BUILD-LOG.md` lists 9 places where the build left the skill's path by hand. Bringing it
onto this site changed 10 more. The provenance line on the workshop page adds both lists: 9 plus 10 is 19
(`workshops-offers.test.ts` counts the numbered items of both files).

Every kit file not named below is the rotfaden output, byte for byte. The deck is rotfaden's `deck.html`, kept byte for
byte as `source/deck.html`; `build-deck.mjs` applies items 6 to 9 to it and writes `slides.html` (CI checks that the
two agree, and `scripts/workshops/sync-deck-keys.mjs` pins the result by sha256). Items 6, 8 and 9 belong in the
rotfaden example too; item 7 is this site's frame.

## Changes for the site: 10 places

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
5. **Five texts of `demo.json` are shorter and plainer.** The site's stage shows a caption in two lines at most,
   and on a 320 px phone rotfaden's longer sentences were cut before the line that decides; a long question above the
   paper chart left its bars flat. The guess and every total stay on the stage itself.
   - "Tipp": "Nach dem Warenpreis liegt {headline_winner} {headline_gap} vorn." (was "Nach der Ware ist … günstiger,
     um …")
   - "Kipp": "Geliefert und bezahlt liegt {winner} {gap} vorn. {last} ist am teuersten." (rotfaden's named the guess,
     the last offer with its total, the winner, the gap and the runner-up)
   - "Papier": "{factor}: {winner} liegt {gap} vorn. Entscheidet: {decider}." (was "… ist günstiger, um {gap}. Die
     Zeile, die entscheidet: {decider}.")
   - The paper question: "Wie stark steigt der Papierindex von C?" (was "Der Papierzuschlag von C folgt einem Index.
     Wie stark steigt er?")
   - "Mitnehmen": "Die Dateien von eben und die Methode für deinen Claude." (was "Die Dateien, die du gerade bewegt
     hast, und die Methode für deinen eigenen Claude.")
6. **The deck links to this site.** The closing slide named `loehrning-ai.github.io/rotfaden/w06` and the footer
   `github.com/loehrning-ai/rotfaden`; neither is public yet. The closing slide now names
   `loehrning.ai/demos/angebote-mit-ki-vergleichen` with a QR code to it (the take-home), the kit slide carries a QR
   code to `loehrning.ai/workshops/angebote-mit-ki-vergleichen/kit`, and the footer reads "Erfundener Fall ·
   loehrning.ai".
7. **The deck wears the site's frame**, as the decks of Workshops 01 to 05 do: the loehrning.ai mark in the corner and
   on the cover ("Workshop 06"), the author `loehrning.ai`, a "← Workshop" link back to the workshop page, and the
   toolbar always shown with "Neu starten R" and "Moderation P" (rotfaden shows it only under a mouse). On a phone held
   sideways the toolbar keeps rotfaden's rule, because it would cover the slide. The typeface stays: the decks of
   Workshops 01 to 05 set "Typing", a renamed derivative of Inter, and this deck sets Inter.
8. **Three presenter notes in the site's words.** "Wer würde diese Antwort an die Chefin weitergeben?" reads "Wer würde
   diese Antwort so weitergeben?", and the "Ungeprüft" mark of scene 4 is "das Urteil" in two notes instead of "der
   Stempel". The site's copy check now reads the notes of every deck.
9. **The objective stands on the arc slide word for word**, as the workshop page and the demo state it ("Danach kannst
   du Angebote auf einer gemeinsamen Basis vergleichen: …"), with the take-away line under it, and its note says it
   once aloud.
10. **The kit's CHANGELOG says where `tools/fall.py` is.** It named the script as if it were in the kit; it is in the
    rotfaden example, and the line now says so.

The kit zip is rebuilt by `build-kit.mjs` with the site's one zip writer (`src/lib/zip/store.ts`).
