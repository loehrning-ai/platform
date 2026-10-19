/**
 * One note per figure, on its single most telling mark (wave-1 review, item 9).
 * The text may use number tokens of its own figure or of another; they are
 * resolved when the page is built, so a note cannot drift from its chart.
 * `id` is the element (data-id) the leader points at. The engine leaves a note
 * out when it would have to cover marks or words (dense plots such as C4 on a phone,
 * C6, C9 and C11 carry none), so every entry here is checked by a test.
 */
export interface BookAnnotation {
  readonly id: string;
  readonly text: string;
}

export const FIGURE_ANNOTATIONS: Readonly<Record<string, BookAnnotation>> = {
  c5: { id: "q5", text: "Faktor {{c5.ratio}} ({{c5.ratio.range}}) gegenüber dem kürzesten Fünftel mit nur {{c5.q1_hits}} Treffern" },
  c8: { id: "k037", text: "Fast alle Kreise liegen im Zufallsband. Nur wenige Städte stehen darüber." },
};
