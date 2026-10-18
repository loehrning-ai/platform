// S4: each step ticks one check card and fills its blank on the paper line
DECK.on('04', {
  state(step, d) {
    d.slide.querySelectorAll('[data-c]').forEach((c) => c.classList.toggle('done', Number(c.dataset.c) <= step));
    d.slide.querySelectorAll('[data-b]').forEach((b) => b.classList.toggle('done', Number(b.dataset.b) <= step));
  },
});
