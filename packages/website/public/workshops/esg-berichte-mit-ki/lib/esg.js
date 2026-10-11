/* Workshop 04 deck behaviour: in-slide build steps, number counters, copy buttons, chrome.
 *
 * Build steps: a slide with data-steps="N" holds N extra key presses. Elements with data-at="k"
 * get the class "on" once the slide's step reaches k. → / Space / PageDown advance a step before
 * the deck moves on; ← / PageUp step back. Entering a slide resets it to step 0, so every slide
 * replays its motion when you arrive; coming back with ← shows it finished.
 *
 * Counters: <span data-count="653.7" data-dec="1">0</span> counts up when it (or its data-at
 * ancestor) turns on. Numbers are formatted with a comma thousands separator.
 */
(() => {
  const deck = document.querySelector('deck-stage');
  const slides = Array.from(deck.querySelectorAll(':scope > section'));
  const THREAD = ['Questionnaire', 'Check', 'Claims', 'Passport', 'Bank'];
  const FWD = new Set(['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Spacebar']);
  const BACK = new Set(['ArrowLeft', 'ArrowUp', 'PageUp']);
  let current = slides[0];

  const fmt = (v, dec) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.dec || '0', 10);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { el.textContent = fmt(target, dec); return; }
    const t0 = performance.now();
    const dur = parseInt(el.dataset.ms || '1100', 10);
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased, dec);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function render(slide, step) {
    slide.dataset.step = String(step);
    slide.querySelectorAll('[data-at]').forEach((el) => {
      const on = step >= parseInt(el.dataset.at, 10);
      const was = el.classList.contains('on');
      el.classList.toggle('on', on);
      if (on && !was) el.querySelectorAll('[data-count]').forEach(countUp);
      if (on && !was && el.hasAttribute('data-count')) countUp(el);
    });
  }

  function enter(slide, back = false) {
    current = slide;
    // arriving forward replays the builds; arriving backward shows the finished slide
    render(slide, back ? parseInt(slide.dataset.steps || '0', 10) : 0);
    // counters outside any build step run on arrival
    slide.querySelectorAll('[data-count]').forEach((el) => {
      if (!el.closest('[data-at]')) countUp(el);
    });
  }

  deck.addEventListener('slidechange', (e) => enter(e.detail.slide, e.detail.previousIndex > e.detail.index));
  // the deck may have mounted (and fired its init event) before this script ran
  requestAnimationFrame(() => enter(deck.querySelector(':scope > section[data-deck-active]') || slides[0]));

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const max = parseInt(current.dataset.steps || '0', 10);
    const step = parseInt(current.dataset.step || '0', 10);
    if (FWD.has(e.key) && step < max) {
      render(current, step + 1);
    } else if (BACK.has(e.key) && step > 0) {
      render(current, step - 1);
    } else {
      return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
  }, { capture: true });

  // claim cards flip on click as well as by build step
  document.querySelectorAll('.claim').forEach((card) => {
    card.addEventListener('click', () => card.classList.toggle('flip'));
  });

  // copy buttons on prompt cards
  document.querySelectorAll('.prompt-card').forEach((card) => {
    const btn = card.querySelector('.pc-copy');
    const body = card.querySelector('.pc-body');
    if (!btn || !body) return;
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(body.textContent.trim());
        btn.textContent = 'Copied';
        btn.classList.add('done');
      } catch {
        btn.textContent = 'Select and copy';
      }
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('done'); }, 1600);
    });
  });

  // chrome: brand, red-thread rail and page number, injected so every slide carries the same frame
  slides.forEach((slide, i) => {
    if (slide.hasAttribute('data-no-chrome')) return;
    const at = parseInt(slide.dataset.thread || '0', 10);
    const rail = THREAD.map((name, k) => {
      const state = k + 1 < at ? 'done' : k + 1 === at ? 'now' : '';
      return `<span class="rail-i ${state}"><b>${k + 1}</b>${name}</span>`;
    }).join('');
    const chrome = document.createElement('div');
    chrome.className = 'chrome';
    chrome.innerHTML =
      `<div class="chrome__topbar"><span class="brand"><span class="markdot"></span>loehrning.ai · Workshop 04</span>` +
      `<span class="rail">${rail}</span></div><div class="chrome__topline"></div>` +
      `<div class="chrome__footer"><span class="fleft"><span class="mini-rule"></span>${slide.dataset.label || ''}</span>` +
      `<span class="page">${String(i + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}</span></div>`;
    slide.prepend(chrome);
  });
})();
