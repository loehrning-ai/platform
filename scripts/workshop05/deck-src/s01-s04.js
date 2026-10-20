// S4: each step ticks one check card and fills its blank on the paper line
DECK.on('04', {
  state(step, d) {
    d.slide.querySelectorAll('[data-c]').forEach((c) => c.classList.toggle('done', Number(c.dataset.c) <= step));
    d.slide.querySelectorAll('[data-b]').forEach((b) => b.classList.toggle('done', Number(b.dataset.b) <= step));
  },
});

// S1: the cover globe. A prompt leaves the laptop in Skopje and lands in the US cloud, on a loop; the globe settles with both ends inside the panel.
(() => {
  const slide = document.querySelector('.s1');
  const canvas = slide.querySelector('canvas[data-globe]');
  const globe = window.ESGGlobe && window.ESGGlobe.get(canvas);
  if (!globe) return;
  const VIEW = { lon: -8, lat: 36, zoom: 1 };
  const STORED = [-77, 39];
  const LABELS = [['skopje', 'your laptop', 'left'], [STORED, 'the cloud']];
  let t1 = 0, t2 = 0, loop = 0;
  const stop = () => { clearTimeout(t1); clearTimeout(t2); clearInterval(loop); };
  const send = (ms) => { globe.clearArcs(); globe.arc(STORED, { ms, lift: 0.2, labels: LABELS }); };
  DECK.on('01', {
    state(step, d) {
      stop();
      globe.clearArcs();
      if (DECK.reduce || d.instant && d.backward) { globe.still(VIEW); globe.arc(STORED, { ms: 0, labels: LABELS }); return; }
      globe.reset();
      t1 = setTimeout(() => globe.settle({ ...VIEW, ms: 1700, short: true }), 700);
      t2 = setTimeout(() => { send(1500); loop = setInterval(() => send(1500), 7000); }, 2500);
    },
    leave() { stop(); },
  });
})();
