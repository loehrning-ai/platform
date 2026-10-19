// S5: the plan switch. Steps 0 to 2 walk the three plans; a click on a segment jumps to it.
(() => {
  const slide = document.querySelector('.s5');
  const setPlan = (p) => {
    slide.dataset.plan = String(p);
    slide.querySelectorAll('.s5-opt').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.plan === String(p))));
  };
  slide.querySelectorAll('.s5-opt').forEach((b) => b.addEventListener('click', () => setPlan(b.dataset.plan)));
  DECK.on('05', { state(step) { if (step <= 2) setPlan(step); } });
})();

// S6: step 2 sends the folder (a wave of reach, then the files that are read fly to the cloud); step 3 is the globe.
(() => {
  const slide = document.querySelector('.s6');
  const files = slide.querySelector('.s6-files');
  const read = Array.from(files.querySelectorAll('.rd'));
  const canvas = slide.querySelector('canvas[data-globe]');
  const globe = window.ESGGlobe && window.ESGGlobe.get(canvas);
  const VIEW = { lon: -32, lat: 40, zoom: 1.04 };
  const STORED = [-77, 39];
  const LABELS = [['skopje', 'your laptop'], [STORED, 'stored: US', 'left']];
  let timer = 0, timer2 = 0;
  const pkt = slide.querySelector('.s6-pkt');

  function aim() {
    const sc = DECK.scaleOf(slide);
    const cloud = slide.querySelector('.s6-pkt').getBoundingClientRect();
    const cx = cloud.left + cloud.width / 2, cy = cloud.top + cloud.height / 2;
    read.forEach((el) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--tx', ((cx - (r.left + r.width / 2)) / sc).toFixed(1) + 'px');
      el.style.setProperty('--ty', ((cy - (r.top + r.height / 2)) / sc).toFixed(1) + 'px');
    });
  }

  DECK.on('06', {
    state(step, d) {
      clearTimeout(timer); clearTimeout(timer2);
      pkt.classList.remove('hit');
      const sent = step >= 2;
      files.classList.toggle('reach', sent);
      read.forEach((el) => el.classList.remove('fly', 'gone'));
      if (sent) {
        aim();
        if (d.instant || DECK.reduce) read.forEach((el) => el.classList.add('gone'));
        else {
          timer = setTimeout(() => read.forEach((el) => el.classList.add('fly')), 900);
          timer2 = setTimeout(() => pkt.classList.add('hit'), 2300);
        }
      }
      if (!globe) return;
      globe.clearArcs();
      if (step < 3) { globe.reset(); return; }
      if (d.instant) { globe.still(VIEW); globe.arc(STORED, { ms: 0, labels: LABELS }); return; }
      globe.settle({ ...VIEW, ms: 1300, short: true });
      globe.arc(STORED, { ms: 1100, delay: 1250, lift: 0.18, labels: LABELS });
    },
    leave() { clearTimeout(timer); clearTimeout(timer2); },
  });
})();

// S7: six pastes, two presses each (the paste, then the reveal). Drag the card onto a lamp or tap a lamp to count a vote.
(() => {
  const slide = document.querySelector('.s7');
  const cards = Array.from(slide.querySelectorAll('.s7-card'));
  const lampBox = slide.querySelector('.s7-lamps');
  const lamps = Array.from(lampBox.querySelectorAll('.s7-lamp'));
  const reason = slide.querySelector('.s7-reason');
  const acct = slide.querySelector('.s7-acct');
  const no = slide.querySelector('.s7-no');
  const timer = slide.querySelector('.s7-timer');
  const dots = Array.from(slide.querySelectorAll('.s7-score i'));
  const deckBox = slide.querySelector('.s7-deck');
  const NAME = { g: 'GREEN', a: 'AMBER', r: 'RED' };
  let scene = 0, revealed = false;

  function paint(step, d) {
    const prevScene = scene;
    const prevRevealed = revealed;
    scene = Math.ceil(step / 2);
    revealed = step > 0 && step % 2 === 0;
    cards.forEach((c, i) => { c.classList.toggle('is-cur', scene === 0 ? i === 0 && !document.documentElement.classList.contains('deck-js') : i + 1 === scene); c.classList.remove('ghost'); });
    const card = cards[Math.max(0, scene - 1)];
    {
      const first = Math.max(1, scene);
      no.textContent = String(first);
      acct.textContent = card.dataset.acct;
      acct.className = 'pill s7-acct ' + card.dataset.acct.toLowerCase();
      lamps.forEach((l) => { l.dataset.tally = 's7k' + first + ':' + l.dataset.light; });
      DECK.tally.paint('s7k' + first);
    }
    const win = scene > 0 && revealed ? card.dataset.light : null;
    lampBox.classList.toggle('revealed', !!win);
    lamps.forEach((l) => l.classList.toggle('win', l.dataset.light === win));
    reason.dataset.light = win || '';
    if (win) {
      reason.innerHTML = '<b>' + NAME[win] + '</b><span></span>';
      DECK.type(reason.querySelector('span'), card.dataset.why, 16);
    } else {
      reason.textContent = '';
    }
    dots.forEach((dot, i) => {
      const done = i + 1 < scene || (i + 1 === scene && revealed);
      dot.classList.toggle('on', done);
      dot.innerHTML = done ? '<svg class="lt" viewBox="0 0 24 24" aria-hidden="true"><use href="#lt-' + cards[i].dataset.light + '"/></svg>' : '';
    });
    timer.classList.toggle('paused', revealed);
    if (scene === 0 || d.instant) timer.classList.remove('run');
    else if (!revealed && (scene !== prevScene || prevRevealed)) { timer.classList.remove('run'); void timer.getBoundingClientRect(); timer.classList.add('run'); }
    if (!d.instant && !d.backward && !revealed && scene > 0 && scene !== prevScene) {
      card.classList.remove('drop'); void card.offsetWidth; card.classList.add('drop');
    }
  }
  DECK.on('07', { state: paint });

  // drag with spring physics: the card follows the pointer, a lamp under it takes the vote, the card springs home
  const lampAt = (card, x, y) => {
    card.style.pointerEvents = 'none';
    const el = document.elementFromPoint(x, y);
    card.style.pointerEvents = '';
    return el ? el.closest('.s7-lamp') : null;
  };
  deckBox.addEventListener('pointerdown', (e) => {
    const card = e.target.closest('.s7-card.is-cur');
    if (!card || revealed || scene === 0) return;
    const sc = DECK.scaleOf(slide);
    const sx = e.clientX, sy = e.clientY;
    const sp = card._sp || (card._sp = DECK.spring(card));
    card.setPointerCapture(e.pointerId);
    card.classList.add('drag');
    slide.querySelector('.s7-chat').classList.add('dragging');
    const hot = (x, y) => { const l = lampAt(card, x, y); lamps.forEach((o) => o.classList.toggle('hot', o === l)); return l; };
    const move = (ev) => { sp.to((ev.clientX - sx) / sc, (ev.clientY - sy) / sc, 520, 34); hot(ev.clientX, ev.clientY); };
    const up = (ev) => {
      card.removeEventListener('pointermove', move);
      card.removeEventListener('pointerup', up);
      card.removeEventListener('pointercancel', up);
      card.classList.remove('drag');
      setTimeout(() => slide.querySelector('.s7-chat').classList.remove('dragging'), 900);
      const lamp = hot(ev.clientX, ev.clientY);
      lamps.forEach((o) => o.classList.remove('hot'));
      if (lamp) {
        DECK.tally.bump(lamp.dataset.tally, 1, lamp);
        const c = card.getBoundingClientRect(), l = lamp.getBoundingClientRect();
        const homeX = (c.left + c.width / 2) / 1 - sp.x * sc, homeY = (c.top + c.height / 2) - sp.y * sc;
        sp.to(((l.left + l.width / 2) - homeX) / sc, ((l.top + l.height / 2) - homeY) / sc, 320, 26);
        card.classList.add('ghost');
        setTimeout(() => { card.classList.remove('ghost'); sp.to(0, 0, 150, 11); }, 420);
      } else {
        sp.to(0, 0, 150, 11);
      }
    };
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerup', up);
    card.addEventListener('pointercancel', up);
  });
})();

// S8: on the step the four details lift out of the email and fly into their placeholders.
(() => {
  const slide = document.querySelector('.s8');
  const chips = Array.from(slide.querySelectorAll('.s8-slot'));
  DECK.on('08', {
    state(step, d) {
      if (step !== 1 || d.instant || d.backward || DECK.reduce) return;
      const sc = DECK.scaleOf(slide);
      chips.forEach((slot, i) => {
        const chip = slot.querySelector('.s8-chip');
        const span = slide.querySelector('.pii[data-k="' + slot.dataset.k + '"]').getBoundingClientRect();
        const to = chip.getBoundingClientRect();
        const dx = (span.left - to.left) / sc, dy = (span.top - to.top) / sc;
        chip.animate([
          { transformOrigin: '0 0', transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + Math.min(1, span.width / to.width) + ',' + Math.min(1, span.height / to.height) + ')', opacity: 0 },
          { opacity: 1, offset: 0.25 },
          { transformOrigin: '0 0', transform: 'none', opacity: 1 },
        ], { duration: 760, delay: 120 + i * 130, easing: 'cubic-bezier(.65,0,.3,1)', fill: 'backwards' });
      });
    },
  });
})();
