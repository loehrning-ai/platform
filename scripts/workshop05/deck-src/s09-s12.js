// S9: the timeline builds with the steps; from step 5 each press (or a click on a card) flies one use into its box.
(() => {
  const slide = document.querySelector('.s9');
  const uses = Array.from(slide.querySelectorAll('.s9-use'));
  const slots = uses.map((u) => u.parentElement);
  const clicked = new Set();
  const timers = new Map();
  const zoneOf = (u) => slide.querySelector('.s9-box[data-b="' + u.dataset.to + '"] .s9-zone');
  const reasonOf = (u) => u.querySelector('.s9-ur');

  function place(u, animate) {
    if (u.classList.contains('placed')) return;
    const box = zoneOf(u).closest('.s9-box');
    const settle = () => { zoneOf(u).appendChild(u); u.classList.add('placed'); };
    const reason = reasonOf(u);
    clearTimeout(timers.get(u));
    if (animate && !DECK.reduce) {
      reason.textContent = '';
      DECK.flip(u, settle, { ms: 640 });
      timers.set(u, setTimeout(() => {
        box.classList.remove('hit'); void box.offsetWidth; box.classList.add('hit');
        DECK.type(reason, u.dataset.reason, 14);
      }, 580));
    } else {
      settle();
      reason.textContent = u.dataset.reason;
    }
  }
  function unplace(u) {
    clearTimeout(timers.get(u));
    if (!u.classList.contains('placed')) return;
    slots[uses.indexOf(u)].appendChild(u);
    u.classList.remove('placed');
    reasonOf(u).textContent = '';
  }
  uses.forEach((u, i) => u.addEventListener('click', () => { clicked.add(i); place(u, true); }));
  DECK.on('09', {
    state(step, d) {
      if (d.reset) clicked.clear();
      uses.forEach((u, i) => {
        const want = i + 1 <= step - 5 || clicked.has(i);
        if (want) place(u, !d.instant && !d.backward && i + 1 === step - 5); else unplace(u);
      });
    },
  });
})();

// S11: each step starts one countdown (write 6, swap 3, read 1); the ring and the digits run from the same clock.
(() => {
  const slide = document.querySelector('.s11');
  const timer = slide.querySelector('.s11-timer');
  const time = slide.querySelector('.s11-time');
  const phases = Array.from(slide.querySelectorAll('[data-ph]'));
  const SECONDS = [360, 360, 180, 60];
  let tick = 0;
  const text = (ms) => { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  DECK.on('11', {
    state(step, d) {
      clearInterval(tick);
      const total = SECONDS[step] * 1000;
      phases.forEach((p) => p.classList.toggle('on', Number(p.dataset.ph) === step));
      timer.classList.remove('run');
      timer.style.setProperty('--dur', SECONDS[step] + 's');
      time.textContent = text(total);
      if (step === 0 || d.instant) return;
      void timer.getBoundingClientRect();
      timer.classList.add('run');
      const t0 = performance.now();
      tick = setInterval(() => {
        const left = Math.max(0, total - (performance.now() - t0));
        time.textContent = text(left);
        if (left <= 0) clearInterval(tick);
      }, 250);
    },
    leave() { clearInterval(tick); },
  });
})();
