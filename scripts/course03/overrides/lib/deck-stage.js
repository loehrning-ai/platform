(() => {
  const DESIGN_W = 1920;
  const DESIGN_H = 1080;
  const STORAGE_KEY = "foldline-deck:last-scene:v1";
  const POSITION_KEY = "foldline-deck:last-position:v1";
  const SESSION_POSITION_KEY = "foldline-deck:session-position:v1";
  const APPENDIX_RETURN_KEY = "foldline-deck:appendix-return:v1";
  const TOUCH_HINT_KEY = "foldline-deck:touch-hint-seen:v1";
  const ROTATE_DISMISSED_KEY = "foldline-deck:rotate-dismissed:v1";
  const TOOLBAR_ZONE_PX = 140;
  const TOOLBAR_HIDE_MS = 2000;
  const TOOLBAR_TOUCH_MS = 4000;
  // A full reset sends the room back to the cover, so it takes a deliberate second R (WCAG 2.1.4).
  const RESET_CONFIRM_MS = 1500;
  // One Back gesture stays inside the deck and asks for a second one.
  const BACK_CONFIRM_MS = 3000;
  const SWIPE_MIN_PX = 48;
  const TAP_MAX_PX = 12;
  const TAP_MAX_MS = 500;
  const SWIPE_MAX_MS = 800;
  // How a scene is entered decides its first step (spec B.9): forward presses enter at step 0,
  // backward presses at the final step, and every jump (presenter goto, reset) at step 0.
  const ENTRY_BY_REASON = Object.freeze({ "fragment-next": "forward", "fragment-previous": "backward" });

  const GLYPH_ENTER_FULLSCREEN = "M12 38V12h26M62 12h26v26M88 62v26H62M38 88H12V62";
  const GLYPH_EXIT_FULLSCREEN = "M38 12v26H12M62 12v26h26M88 62H62v26M12 62h26v26";

  // Future step elements stay hidden until the step engine (lib/deck-runtime.js) is ready. Without
  // JavaScript this never runs, so nothing is hidden and the final meaning stays on the page.
  document.documentElement.dataset.story = "pending";

  function readStorage(storage, key) {
    try {
      return window[storage].getItem(key);
    } catch (_error) {
      return null;
    }
  }

  function writeStorage(storage, key, value) {
    try {
      if (value === null) window[storage].removeItem(key);
      else window[storage].setItem(key, value);
    } catch (_error) {
      // The presentation remains functional when storage is unavailable.
    }
  }

  function readJson(storage, key) {
    try {
      const value = JSON.parse(readStorage(storage, key) || "null");
      return value && typeof value === "object" ? value : null;
    } catch (_error) {
      return null;
    }
  }

  function navigationType() {
    try {
      return window.performance?.getEntriesByType?.("navigation")?.[0]?.type || "";
    } catch (_error) {
      return "";
    }
  }

  const styles = `
    :host {
      position: fixed;
      inset: 0;
      display: block;
      overflow: hidden;
      color: #121212;
      background: #f3f0e9;
      font-family: "Typing", system-ui, -apple-system, "Segoe UI", sans-serif;
      /* Horizontal swipes step through the deck; pinch zoom stays with the browser. */
      touch-action: pan-y pinch-zoom;
    }

    /* A zoomed-in phone pans freely; swipes and edge taps pause until the zoom is undone. */
    :host([data-zoomed]) {
      touch-action: auto;
    }

    /* The letterbox follows the active scene, so the dark cover never sits between paper bands. */
    :host([data-dark]),
    :host([data-dark]) .canvas {
      background: #141414;
    }

    .stage {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .canvas {
      position: relative;
      flex: 0 0 auto;
      width: var(--deck-width);
      height: var(--deck-height);
      transform-origin: center center;
      background: #f3f0e9;
    }

    ::slotted(*) {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      visibility: hidden;
      opacity: 0;
      pointer-events: none;
    }

    ::slotted([data-deck-active]) {
      visibility: visible;
      opacity: 1;
      pointer-events: auto;
    }

    /* Light toolbar (spec B.8): hidden until the pointer moves near the bottom edge or keyboard
       focus is inside it. A pointer click never keeps it up (the button is blurred and
       :focus-visible does not match a clicked button). It sits in the empty safe band. */
    .controls {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 2147483000;
      display: flex;
      align-items: stretch;
      opacity: 0;
      pointer-events: none;
      transition: opacity 200ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .controls[data-visible],
    .controls:hover,
    .controls:has(:focus-visible) {
      opacity: 1;
      pointer-events: auto;
    }

    .controls[hidden],
    .control[hidden] {
      display: none;
    }

    .control {
      position: relative;
      display: inline-flex;
      width: 48px;
      height: 48px;
      align-items: center;
      justify-content: center;
      margin: 0 0 0 -2px;
      padding: 0;
      border: 2px solid #121212;
      color: #121212;
      background: #f3f0e9;
      cursor: pointer;
      font: inherit;
      touch-action: manipulation;
    }

    .control:first-of-type {
      margin-left: 0;
    }

    .control:hover,
    .control:active {
      z-index: 1;
      color: #97300f;
      border-color: #97300f;
    }

    .control:focus-visible {
      z-index: 2;
      outline: 3px solid #b73a15;
      outline-offset: 2px;
    }

    .control svg {
      width: 24px;
      height: 24px;
      fill: none;
      stroke: currentColor;
      stroke-width: 9;
      stroke-linecap: square;
      stroke-linejoin: miter;
    }

    /* Where the show is: scene of 18 (or appendix page of 8), press of the scene, and one segment
       per main scene. It shows with the toolbar; screen readers get the same facts from the live region. */
    .progress {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 6px;
      margin-right: 8px;
      padding: 0 12px;
      border: 2px solid #121212;
      color: #121212;
      background: #f3f0e9;
      font: 600 16px/1 "JetBrains Mono", ui-monospace, monospace;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .progress__rail {
      display: flex;
      gap: 2px;
    }

    .progress__segment {
      width: 6px;
      height: 4px;
      background: #d4cec5;
    }

    .progress__segment[data-state="past"] {
      background: #121212;
    }

    .progress__segment[data-state="current"] {
      background: #b73a15;
    }

    .notice {
      position: fixed;
      left: 50%;
      /* Above the toolbar row (16 px inset + 56 px buttons), so the two never overlap. */
      bottom: 88px;
      z-index: 2147483001;
      max-width: calc(100vw - 32px);
      padding: 12px 16px;
      border: 2px solid #f3f0e9;
      color: #f3f0e9;
      background: #121212;
      font: 600 18px/1.3 "Typing", system-ui, sans-serif;
      opacity: 0;
      pointer-events: none;
      transform: translate(-50%, 8px);
      transition: opacity 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .notice[data-visible] {
      opacity: 1;
      transform: translate(-50%, 0);
    }

    .rotate {
      position: fixed;
      top: 16px;
      right: 16px;
      left: 16px;
      z-index: 2147483001;
      display: none;
      align-items: center;
      gap: 12px;
      padding: 12px 12px 12px 16px;
      border: 2px solid #121212;
      color: #121212;
      background: #f3f0e9;
      font: 500 16px/1.4 "Typing", system-ui, sans-serif;
    }

    .rotate p {
      flex: 1 1 auto;
      margin: 0;
    }

    .rotate a {
      color: #97300f;
      font-weight: 700;
    }

    .rotate a:focus-visible,
    .rotate button:focus-visible {
      outline: 3px solid #b73a15;
      outline-offset: 2px;
    }

    .rotate button {
      flex: 0 0 auto;
      min-width: 44px;
      min-height: 44px;
      border: 2px solid #121212;
      color: #121212;
      background: #f3f0e9;
      font: 600 16px/1 "Typing", system-ui, sans-serif;
      cursor: pointer;
    }

    @media (orientation: portrait) and (max-width: 700px) {
      .rotate:not([data-dismissed]) {
        display: flex;
      }
    }

    .live-region {
      position: fixed;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }

    @media (hover: none), (pointer: coarse) {
      .control {
        width: 56px;
        height: 56px;
      }
    }

    /* A popup console on a phone or tablet is of no use; the room is driven from a laptop. */
    @media (hover: none) and (pointer: coarse) {
      .control.presenter {
        display: none;
      }
    }

    @media (max-width: 560px) {
      .progress__rail {
        display: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .controls,
      .notice {
        transition: none;
      }

      .notice,
      .notice[data-visible] {
        transform: translate(-50%, 0);
      }
    }

    @media print {
      :host,
      :host([data-dark]) {
        position: static;
        overflow: visible;
        background: none;
      }

      .stage {
        position: static;
        display: block;
      }

      .canvas,
      :host([data-dark]) .canvas {
        width: auto;
        height: auto;
        transform: none !important;
        background: none;
      }

      ::slotted(*) {
        position: relative !important;
        inset: auto !important;
        display: block !important;
        width: var(--deck-width) !important;
        height: var(--deck-height) !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        break-after: page;
        page-break-after: always;
      }

      ::slotted(*:last-child) {
        break-after: auto;
        page-break-after: auto;
      }

      .controls,
      .notice,
      .rotate,
      .live-region {
        display: none !important;
      }
    }
  `;

  class DeckStage extends HTMLElement {
    constructor() {
      super();
      this._root = this.attachShadow({ mode: "open" });
      this._slides = [];
      this._index = 0;
      this._booted = false;
      this._rendered = false;
      this._hideTimer = null;
      this._noticeTimer = null;
      this._resetArmedAt = 0;
      this._resetTimer = null;
      this._backArmedAt = 0;
      this._ignoreNextHash = false;
      this._guarded = false;
      this._touch = null;
      this._appendixReturnIndex = null;
      this._appendixReturnStep = null;
      this._boundKey = this._onKey.bind(this);
      this._boundResize = this._fit.bind(this);
      this._boundPointerMove = this._onPointerMove.bind(this);
      this._boundPointerDown = this._onPointerDown.bind(this);
      this._boundPointerUp = this._onPointerUp.bind(this);
      this._boundPointerCancel = () => { this._touch = null; };
      this._boundCommand = this._onExternalCommand.bind(this);
      this._boundHash = this._onHashChange.bind(this);
      this._boundPopState = this._onPopState.bind(this);
      this._boundSkip = this._onSkipLink.bind(this);
      this._boundFullscreen = this._syncFullscreenControl.bind(this);
      this._boundZoom = this._syncZoom.bind(this);
      this._boundBoot = this.boot.bind(this);
    }

    connectedCallback() {
      // The requested position is read once, before anything can rewrite the address bar. The deck is
      // defined in <head>, so it upgrades while its 26 scenes are still being parsed; the first scene
      // is chosen only when the whole list exists (DOMContentLoaded), never from a partial list.
      if (this._initialHash === undefined) this._initialHash = window.location.hash;
      if (!this._rendered) this._render();
      window.addEventListener("keydown", this._boundKey);
      window.addEventListener("resize", this._boundResize);
      window.addEventListener("pointermove", this._boundPointerMove, { passive: true });
      window.addEventListener("pointerdown", this._boundPointerDown, { passive: true });
      window.addEventListener("pointerup", this._boundPointerUp, { passive: true });
      window.addEventListener("pointercancel", this._boundPointerCancel, { passive: true });
      window.addEventListener("deckcommand", this._boundCommand);
      window.addEventListener("hashchange", this._boundHash);
      window.addEventListener("popstate", this._boundPopState);
      document.addEventListener("click", this._boundSkip);
      document.addEventListener("fullscreenchange", this._boundFullscreen);
      window.visualViewport?.addEventListener("resize", this._boundZoom);
      this._syncPrintPage();
      this._syncFullscreenControl();
      if (this._booted) return;
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", this._boundBoot, { once: true });
      else window.queueMicrotask(this._boundBoot);
    }

    disconnectedCallback() {
      window.removeEventListener("keydown", this._boundKey);
      window.removeEventListener("resize", this._boundResize);
      window.removeEventListener("pointermove", this._boundPointerMove);
      window.removeEventListener("pointerdown", this._boundPointerDown);
      window.removeEventListener("pointerup", this._boundPointerUp);
      window.removeEventListener("pointercancel", this._boundPointerCancel);
      window.removeEventListener("deckcommand", this._boundCommand);
      window.removeEventListener("hashchange", this._boundHash);
      window.removeEventListener("popstate", this._boundPopState);
      document.removeEventListener("click", this._boundSkip);
      document.removeEventListener("fullscreenchange", this._boundFullscreen);
      document.removeEventListener("DOMContentLoaded", this._boundBoot);
      window.visualViewport?.removeEventListener("resize", this._boundZoom);
      if (this._hideTimer) window.clearTimeout(this._hideTimer);
      if (this._noticeTimer) window.clearTimeout(this._noticeTimer);
      if (this._resetTimer) window.clearTimeout(this._resetTimer);
    }

    _render() {
      this._rendered = true;
      const style = document.createElement("style");
      style.textContent = styles;

      const stage = document.createElement("div");
      stage.className = "stage";

      const canvas = document.createElement("div");
      canvas.className = "canvas";
      canvas.style.setProperty("--deck-width", `${this.designWidth}px`);
      canvas.style.setProperty("--deck-height", `${this.designHeight}px`);
      const slot = document.createElement("slot");
      slot.addEventListener("slotchange", () => this._collect());
      canvas.appendChild(slot);
      stage.appendChild(canvas);

      // Glyphs are drawn inline: shadow DOM cannot <use> the document's icon sprite.
      const controls = document.createElement("div");
      controls.className = "controls";
      controls.setAttribute("data-deck-chrome", "");
      controls.setAttribute("role", "toolbar");
      controls.setAttribute("aria-label", "Presentation controls");
      controls.innerHTML = `
        <div class="progress" aria-hidden="true"><span class="progress__text"></span><span class="progress__rail"></span></div>
        <button class="control previous" type="button" aria-label="Back one press" title="Back one press (ArrowLeft)">
          <svg viewBox="0 0 100 100" aria-hidden="true"><path d="M62 18 30 50l32 32"/></svg>
        </button>
        <button class="control next" type="button" aria-label="Forward one press" title="Forward one press (ArrowRight)">
          <svg viewBox="0 0 100 100" aria-hidden="true"><path d="m38 18 32 32-32 32"/></svg>
        </button>
        <button class="control return" type="button" aria-label="Return from appendix" title="Return from appendix (Escape)" hidden>
          <svg viewBox="0 0 100 100" aria-hidden="true"><path d="M38 22 14 46l24 24M14 46h60v34H50"/></svg>
        </button>
        <button class="control presenter" type="button" aria-label="Open presenter view" title="Presenter view (P)">
          <svg viewBox="0 0 100 100" aria-hidden="true"><path d="M10 16h80v52H10zM50 68v14M30 86h40"/></svg>
        </button>
        <button class="control fullscreen" type="button" aria-label="Enter fullscreen" title="Enter fullscreen">
          <svg viewBox="0 0 100 100" aria-hidden="true"><path d="${GLYPH_ENTER_FULLSCREEN}"/></svg>
        </button>
      `;
      const exportFinal = new URLSearchParams(window.location.search).get("export") === "final";
      if (exportFinal) controls.hidden = true;

      const notice = document.createElement("div");
      notice.className = "notice";
      notice.setAttribute("aria-hidden", "true");

      // Phones in portrait get the 1920 × 1080 canvas at a fifth of its size; say so once, offer the
      // reflowing guide, and let the viewer dismiss it.
      const rotate = document.createElement("div");
      rotate.className = "rotate";
      rotate.setAttribute("role", "note");
      rotate.innerHTML = `
        <p>Turn your phone sideways for a larger view, or <a href="./guide.html">read the text guide</a>.</p>
        <button type="button" aria-label="Dismiss this hint">OK</button>
      `;
      if (exportFinal || readStorage("sessionStorage", ROTATE_DISMISSED_KEY) === "1") rotate.setAttribute("data-dismissed", "");
      rotate.querySelector("button").addEventListener("click", () => {
        rotate.setAttribute("data-dismissed", "");
        writeStorage("sessionStorage", ROTATE_DISMISSED_KEY, "1");
      });

      const live = document.createElement("div");
      live.className = "live-region";
      live.setAttribute("aria-live", "polite");
      live.setAttribute("aria-atomic", "true");

      this._root.append(style, stage, controls, notice, rotate, live);
      this._canvas = canvas;
      this._slot = slot;
      this._controls = controls;
      this._notice = notice;
      this._rotate = rotate;
      this._live = live;
      this._progressText = controls.querySelector(".progress__text");
      this._progressRail = controls.querySelector(".progress__rail");

      this._bindControl(".previous", () => this.fragment(-1));
      this._bindControl(".next", () => this.fragment(1));
      this._bindControl(".return", () => this.returnFromAppendix());
      this._bindControl(".presenter", () => this.openPresenter());
      this._bindControl(".fullscreen", () => this.toggleFullscreen());
    }

    // A pointer click (event.detail > 0) must not leave focus on the button: a focused button would
    // keep the toolbar up and turn the unbound Enter and Space keys into toolbar presses.
    _bindControl(selector, action) {
      const control = this._controls.querySelector(selector);
      control.addEventListener("click", (event) => {
        if (event.detail > 0) control.blur();
        this._armBackGuard();
        action();
      });
    }

    get designWidth() {
      return Number.parseInt(this.getAttribute("width"), 10) || DESIGN_W;
    }

    get designHeight() {
      return Number.parseInt(this.getAttribute("height"), 10) || DESIGN_H;
    }

    _collectSlides() {
      this._slides = this._slot.assignedElements({ flatten: true }).filter((element) => element.matches("section.slide"));
      const total = this._slides.length;
      this._slides.forEach((slide, index) => {
        const label = slide.dataset.label || slide.querySelector("h1,h2")?.textContent?.trim() || "Scene";
        slide.dataset.deckIndex = String(index);
        slide.setAttribute("role", "group");
        slide.setAttribute("aria-roledescription", "slide");
        slide.setAttribute("aria-label", `${index + 1} of ${total}: ${label}`);
      });
    }

    // slotchange fires many times while the parser is still adding scenes. Before boot it only records
    // the list; nothing is chosen, rendered, written to the address bar or stored.
    _collect() {
      const current = this._booted ? this.currentSlide : null;
      this._collectSlides();
      if (!this._booted) return;
      const index = current ? this._slides.indexOf(current) : -1;
      this._index = Math.max(0, Math.min(this._slides.length - 1, index >= 0 ? index : this._index));
      this._renderProgress();
      this._fit();
    }

    // Chooses the first scene exactly once, from the complete scene list: the hash (as typed, or as
    // captured before the page finished parsing), then ?resume=1, then this tab's last position when
    // the page is a reload or a Back/Forward return. Safe to call more than once.
    boot() {
      if (this._booted || !this._slot) return;
      this._collectSlides();
      if (!this._slides.length) return;
      this._booted = true;
      const requested = this._hashTarget(window.location.hash) || this._hashTarget(this._initialHash);
      let index = requested?.index ?? null;
      let step = requested?.step ?? null;
      if (index === null) {
        const resume = new URLSearchParams(window.location.search).get("resume") === "1";
        const kind = navigationType();
        const restored = resume
          ? this._restorePosition("localStorage", POSITION_KEY) ?? this._restoreLegacyIndex()
          : kind === "reload" || kind === "back_forward"
            ? this._restorePosition("sessionStorage", SESSION_POSITION_KEY)
            : null;
        if (restored && typeof restored === "object") {
          index = restored.index;
          step = restored.step;
        } else if (Number.isInteger(restored)) {
          index = restored;
        }
      }
      this._index = Math.max(0, Math.min(this._slides.length - 1, index ?? 0));
      this._restoreAppendixReturn();
      this._apply("init", Number.isInteger(step) ? step : 0);
      this._fit();
      this._maybeShowTouchHint();
    }

    get booted() {
      return this._booted;
    }

    // The deck writes `#scene/step` on every press, so every URL is a deep link. A hash a person
    // types or pastes moves the deck; the echo of our own replaceState is ignored.
    // A hash that names no scene (a typo) is replaced by the canonical `#<id>/<step>`.
    _onHashChange() {
      if (!this._booted) return;
      if (this._ignoreNextHash) {
        this._ignoreNextHash = false;
        this.syncHash();
        return;
      }
      if (window.location.hash === this._writtenHash) return;
      const target = this._hashTarget();
      if (!target) {
        this.syncHash();
        return;
      }
      const currentStep = Number.parseInt(this.currentSlide?.dataset.stepCurrent || "0", 10);
      if (target.index === this._index && (target.step ?? 0) === currentStep) {
        this.syncHash();
        return;
      }
      this._trackAppendixReturn(target.index, "hash");
      this._previousIndex = this._index;
      this._index = target.index;
      this._apply("hash", target.step ?? 0);
    }

    _hashTarget(hash = window.location.hash) {
      const [rawId, rawStep] = String(hash || "").replace(/^#/, "").split("/");
      if (!rawId) return null;
      let id;
      try {
        id = decodeURIComponent(rawId);
      } catch (_error) {
        return null;
      }
      const index = this._slides.findIndex((slide) => slide.id === id);
      if (index < 0) return null;
      return { index, step: /^\d+$/.test(rawStep || "") ? Number(rawStep) : null };
    }

    _restorePosition(storage, key) {
      const saved = readJson(storage, key);
      if (!saved || typeof saved.id !== "string") return null;
      const index = this._slides.findIndex((slide) => slide.id === saved.id);
      if (index < 0) return null;
      return { index, step: Number.isInteger(saved.step) && saved.step >= 0 ? saved.step : 0 };
    }

    _restoreLegacyIndex() {
      const id = readStorage("localStorage", STORAGE_KEY);
      const index = this._slides.findIndex((slide) => slide.id === id);
      return index >= 0 ? index : null;
    }

    // A reload inside the appendix keeps its Esc target (and the step the calling scene was at).
    _restoreAppendixReturn() {
      const slide = this._slides[this._index];
      if (slide?.dataset.kind !== "appendix") {
        this._setAppendixReturn(null);
        return;
      }
      const saved = readJson("sessionStorage", APPENDIX_RETURN_KEY);
      const index = saved ? this._slides.findIndex((candidate) => candidate.id === saved.returnId) : -1;
      if (index < 0 || (this._slides[index].dataset.kind || "main") !== "main") return;
      this._appendixReturnIndex = index;
      this._appendixReturnStep = Number.isInteger(saved.returnStep) ? saved.returnStep : 0;
    }

    _setAppendixReturn(index, step = null) {
      this._appendixReturnIndex = index;
      this._appendixReturnStep = index === null ? null : step;
      if (!this._booted) return;
      const target = index === null ? null : this._slides[index];
      writeStorage("sessionStorage", APPENDIX_RETURN_KEY, target
        ? JSON.stringify({ returnId: target.id, returnStep: Number.isInteger(step) ? step : 0 })
        : null);
    }

    // Resolves the step a scene is entered at. The step engine owns clamping and rendering; the
    // stage only records the request on the section so the hash it writes is already right.
    _entryStep(slide, reason, requestedStep) {
      const entry = ENTRY_BY_REASON[reason] || "jump";
      const total = Number.parseInt(slide.dataset.stepTotal || "", 10);
      let step;
      if (entry === "forward") step = 0;
      else if (entry === "backward") step = Number.isInteger(total) ? total : null;
      else if (reason === "appendix-return") step = Number.isInteger(requestedStep) ? requestedStep : Number.parseInt(slide.dataset.stepCurrent || "0", 10) || 0;
      else step = Number.isInteger(requestedStep) ? requestedStep : 0;
      if (step !== null && Number.isInteger(total)) step = Math.max(0, Math.min(total, step));
      return { entry, step };
    }

    _apply(reason, requestedStep = null) {
      if (!this._slides.length) return;
      const previousIndex = this._previousIndex ?? -1;
      const previousSlide = previousIndex >= 0 ? this._slides[previousIndex] : null;
      const slide = this._slides[this._index];
      const focusWasOnSlide = Boolean(previousSlide && document.activeElement === previousSlide);
      this._slides.forEach((candidate, index) => {
        const active = index === this._index;
        candidate.toggleAttribute("data-deck-active", active);
        candidate.setAttribute("aria-hidden", active ? "false" : "true");
        candidate.inert = !active;
        if (!active && candidate.getAttribute("tabindex") === "-1") candidate.removeAttribute("tabindex");
      });
      this.toggleAttribute("data-dark", slide.classList.contains("dark"));
      const returnControl = this._controls.querySelector(".return");
      returnControl.hidden = slide.dataset.kind !== "appendix" || this._appendixReturnIndex === null;
      const { entry, step } = this._entryStep(slide, reason, requestedStep);
      if (step !== null) slide.dataset.stepCurrent = String(step);
      this.syncHash();
      const detail = {
        index: this._index,
        previousIndex,
        total: this._slides.length,
        slide,
        previousSlide,
        reason,
        entry,
        step,
      };
      this.dispatchEvent(new CustomEvent("slidechange", { detail, bubbles: true, composed: true }));
      this._live.textContent = this._sceneAnnouncement(slide);
      this._previousIndex = this._index;
      // Keyboard and screen-reader users who moved focus onto the scene keep it on the new scene.
      if (focusWasOnSlide) this._focusSlide(slide);
    }

    _mainSlides() {
      return this._slides.filter((candidate) => (candidate.dataset.kind || "main") === "main");
    }

    _appendixSlides() {
      return this._slides.filter((candidate) => candidate.dataset.kind === "appendix");
    }

    _position(slide) {
      const appendix = slide.dataset.kind === "appendix";
      const list = appendix ? this._appendixSlides() : this._mainSlides();
      return { appendix, number: list.indexOf(slide) + 1, count: list.length };
    }

    // Main scenes are counted out of 18 and appendix pages out of 8, as the presenter counts them.
    _sceneAnnouncement(slide) {
      const { appendix, number, count } = this._position(slide);
      const label = slide.dataset.label || slide.id;
      const where = appendix ? `appendix page ${number} of ${count}` : `scene ${number} of ${count}`;
      const step = Number.parseInt(slide.dataset.stepCurrent || "0", 10) || 0;
      const total = Number.parseInt(slide.dataset.stepTotal || "0", 10) || 0;
      return `${label}, ${where}${step > 0 && total > 0 ? `, step ${step} of ${total}` : ""}`;
    }

    // A press inside a scene is announced as its step plus the first thing it reveals, briefly.
    _announceStep(slide, direction) {
      const step = Number.parseInt(slide.dataset.stepCurrent || "0", 10) || 0;
      const total = Number.parseInt(slide.dataset.stepTotal || "0", 10) || 0;
      let text = `${direction < 0 ? "Back to step" : "Step"} ${step} of ${total}`;
      if (direction > 0 && step > 0) {
        const revealed = [...slide.querySelectorAll(`[data-step="${step}"]`)]
          .filter((element) => element.getAttribute("aria-hidden") !== "true" && !element.parentElement?.closest(`[data-step="${step}"]`))
          .map((element) => this._readableText(element))
          .filter(Boolean);
        if (revealed.length) {
          const summary = revealed.slice(0, 2).join(". ");
          text += `: ${summary.length > 160 ? `${summary.slice(0, 157).trimEnd()}…` : summary}`;
        }
      }
      this._live.textContent = text;
    }

    // Visible text as sentences: rendered lines (innerText) become short phrases, so "Room vote" and
    // "Put this in the board pack?" are not read as one run-on word.
    _readableText(element) {
      const label = element.getAttribute("aria-label");
      if (label) return label.trim();
      const raw = typeof element.innerText === "string" ? element.innerText : element.textContent || "";
      return raw.split(/\n+/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean)
        .map((line) => (/[.?!:…]$/.test(line) ? line : `${line}.`)).join(" ");
    }

    // Writes `#<id>/<step>` from the current section. The step engine calls this after every press.
    syncHash() {
      const slide = this.currentSlide;
      if (!slide || !this._booted) return;
      const step = slide.dataset.stepCurrent || "0";
      this._writtenHash = `#${encodeURIComponent(slide.id)}/${step}`;
      try {
        // The history entry keeps its state, so the Back guard marker survives every press.
        window.history.replaceState(window.history.state, "", this._writtenHash);
      } catch (_error) {
        // Hash persistence is convenience, not a runtime dependency.
      }
      const position = JSON.stringify({ id: slide.id, step: Number.parseInt(step, 10) || 0 });
      writeStorage("localStorage", STORAGE_KEY, slide.id);
      writeStorage("localStorage", POSITION_KEY, position);
      writeStorage("sessionStorage", SESSION_POSITION_KEY, position);
      this._renderProgress();
    }

    _renderProgress() {
      const slide = this.currentSlide;
      if (!slide || !this._progressText) return;
      const { appendix, number, count } = this._position(slide);
      const step = Number.parseInt(slide.dataset.stepCurrent || "0", 10) || 0;
      const total = Number.parseInt(slide.dataset.stepTotal || "0", 10) || 0;
      const pad = (value) => String(value).padStart(2, "0");
      const scene = appendix ? `Appendix ${number} / ${count}` : `${pad(number)} / ${pad(count)}`;
      this._progressText.textContent = total > 0 ? `${scene} · ${step} / ${total}` : scene;
      const mains = this._mainSlides();
      if (this._progressRail.childElementCount !== mains.length) {
        this._progressRail.replaceChildren(...mains.map(() => {
          const segment = document.createElement("span");
          segment.className = "progress__segment";
          return segment;
        }));
      }
      const currentMain = appendix ? mains.length : mains.indexOf(slide);
      [...this._progressRail.children].forEach((segment, index) => {
        segment.dataset.state = index < currentMain ? "past" : index === currentMain ? "current" : "future";
      });
    }

    _syncPrintPage() {
      const id = "foldline-deck-print-page";
      let style = document.getElementById(id);
      if (!style) {
        style = document.createElement("style");
        style.id = id;
        document.head.appendChild(style);
      }
      // Also: no overscroll swipe-to-navigate on the deck page, and a visible inset focus ring when the
      // skip link moves keyboard focus onto the active scene.
      style.textContent = `@page { size: ${this.designWidth}px ${this.designHeight}px; margin: 0; }
        @media print { html, body { margin: 0 !important; padding: 0 !important; overflow: visible !important; height: auto !important; } }
        html, body { overscroll-behavior: none; }
        deck-stage > section.slide:focus { outline: none; }
        deck-stage > section.slide:focus-visible { outline: 6px solid #b73a15; outline-offset: -6px; }`;
    }

    _fit() {
      if (!this._canvas) return;
      if (this.hasAttribute("noscale")) {
        this._canvas.style.transform = "none";
        return;
      }
      const scale = Math.min(window.innerWidth / this.designWidth, window.innerHeight / this.designHeight);
      this._canvas.style.transform = `scale(${scale})`;
    }

    _syncZoom() {
      const zoomed = (window.visualViewport?.scale || 1) > 1.05;
      this.toggleAttribute("data-zoomed", zoomed);
    }

    _fromChrome(event) {
      const path = event.composedPath?.() || [];
      return path.includes(this._controls) || path.includes(this._rotate);
    }

    // A pointer shows the toolbar: moving inside the bottom band. Keyboard presses never show it, so
    // the projector stays clean while presenting.
    _onPointerMove(event) {
      if (event.pointerType === "touch") return;
      if (event.clientY < window.innerHeight - TOOLBAR_ZONE_PX) return;
      this._showControls(TOOLBAR_HIDE_MS);
    }

    // Touch and pen: swipe left or right for one press, tap the right or left third for one press,
    // tap the middle or the bottom band for the toolbar.
    _onPointerDown(event) {
      if (event.pointerType === "mouse") return;
      if (!event.isPrimary || this._fromChrome(event) || this._isTypingTarget(event.target) || event.target?.closest?.("a, button")) {
        this._touch = null;
        return;
      }
      this._touch = { id: event.pointerId, x: event.clientX, y: event.clientY, at: performance.now() };
    }

    _onPointerUp(event) {
      const start = this._touch;
      this._touch = null;
      if (!start || event.pointerId !== start.id || event.pointerType === "mouse") return;
      if (this.hasAttribute("data-zoomed") || !this._booted) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      const elapsed = performance.now() - start.at;
      if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.5 && elapsed <= SWIPE_MAX_MS) {
        this._armBackGuard();
        this.fragment(dx < 0 ? 1 : -1);
        this._showControls(TOOLBAR_HIDE_MS);
        return;
      }
      if (Math.abs(dx) > TAP_MAX_PX || Math.abs(dy) > TAP_MAX_PX || elapsed > TAP_MAX_MS) return;
      if (start.y >= window.innerHeight - TOOLBAR_ZONE_PX) {
        this._showControls(TOOLBAR_TOUCH_MS);
        return;
      }
      const third = window.innerWidth / 3;
      if (start.x > third * 2) {
        this._armBackGuard();
        this.fragment(1);
      } else if (start.x < third) {
        this._armBackGuard();
        this.fragment(-1);
      } else {
        this._showControls(TOOLBAR_TOUCH_MS);
      }
    }

    _maybeShowTouchHint() {
      if (this._controls.hidden || !window.matchMedia?.("(pointer: coarse)").matches) return;
      this._showControls(TOOLBAR_TOUCH_MS);
      if (readStorage("localStorage", TOUCH_HINT_KEY) === "1") return;
      writeStorage("localStorage", TOUCH_HINT_KEY, "1");
      this._showNotice("Swipe, or tap the right or left edge, to step through.", TOOLBAR_TOUCH_MS);
    }

    _showControls(durationMs) {
      if (!this._controls || this._controls.hidden) return;
      this._controls.setAttribute("data-visible", "");
      if (this._hideTimer) window.clearTimeout(this._hideTimer);
      this._hideTimer = window.setTimeout(() => {
        this._hideTimer = null;
        if (!this._controls.matches(":has(:focus-visible)")) this._controls.removeAttribute("data-visible");
      }, durationMs);
    }

    // A short visible hint in the safe band; the live region carries the same words.
    _showNotice(text, durationMs, { announce = true } = {}) {
      if (!this._notice) return;
      this._notice.textContent = text;
      this._notice.setAttribute("data-visible", "");
      if (announce) this._live.textContent = text;
      if (this._noticeTimer) window.clearTimeout(this._noticeTimer);
      this._noticeTimer = window.setTimeout(() => {
        this._noticeTimer = null;
        this._notice.removeAttribute("data-visible");
      }, durationMs);
    }

    _hideNotice() {
      if (this._noticeTimer) window.clearTimeout(this._noticeTimer);
      this._noticeTimer = null;
      this._notice?.removeAttribute("data-visible");
    }

    // Buttons, links and summaries are not typing targets; only real text inputs keep arrow keys.
    _isTypingTarget(target) {
      if (!target) return false;
      return Boolean(target.isContentEditable || target.closest?.("input, select, textarea, [contenteditable]"));
    }

    _onKey(event) {
      if (event.metaKey || event.ctrlKey || event.altKey || this._isTypingTarget(event.target)) return;
      const key = event.key;
      const isReset = key === "r" || key === "R";
      const inAppendix = this.currentSlide?.dataset.kind === "appendix";
      const bound = key === "ArrowRight" || key === "ArrowLeft" || isReset || key === "p" || key === "P"
        || (key === "Escape" && (inAppendix || this._resetArmedAt));
      if (!bound) return;
      event.preventDefault();
      // A held key auto-repeats; only the first keydown is a press, so a long press never skips a vote.
      if (event.repeat) return;
      if (!isReset) this._disarmReset();
      // Five keys (README contract): ArrowRight is the next press, ArrowLeft the previous press
      // (a scene is left only once its steps are used up, and entered at its final step), R twice
      // within 1.5 s resets the whole deck, P opens the presenter console and Escape leaves an appendix.
      // Space, Enter, Home, End, F, PageUp and PageDown are deliberately unbound (spec E12).
      if (key === "ArrowRight") this.fragment(1);
      else if (key === "ArrowLeft") this.fragment(-1);
      else if (isReset) this._resetKey();
      else if (key === "p" || key === "P") this.openPresenter();
      else if (key === "Escape" && inAppendix) this.returnFromAppendix();
      if (key === "ArrowRight" || key === "ArrowLeft") this._armBackGuard();
      this._releaseToolbarFocus();
    }

    // One R arms the reset and says how to confirm; a second R inside the window resets. Any other key
    // (or waiting) cancels, so a stray R never sends the room back to the cover.
    _resetKey() {
      const now = performance.now();
      if (this._resetArmedAt && now - this._resetArmedAt <= RESET_CONFIRM_MS) {
        this._disarmReset();
        this._hideNotice();
        this.fullReset();
        return;
      }
      this._resetArmedAt = now;
      if (this._resetTimer) window.clearTimeout(this._resetTimer);
      this._resetTimer = window.setTimeout(() => this._disarmReset(), RESET_CONFIRM_MS);
      this._showNotice("Press R again to go back to the cover", RESET_CONFIRM_MS);
    }

    _disarmReset() {
      if (!this._resetArmedAt) return;
      this._resetArmedAt = 0;
      if (this._resetTimer) window.clearTimeout(this._resetTimer);
      this._resetTimer = null;
      this._hideNotice();
    }

    // Back guard: after the first local press, one extra history entry sits in front of the deck. A
    // single Back (trackpad swipe, mouse button, Alt+Left) lands on it, stays in the deck and asks for a
    // second Back, which then leaves. Typed hashes keep their own entries and navigate as before.
    _armBackGuard() {
      if (this._guarded || !this._booted) return;
      this._guarded = true;
      try {
        const base = { ...(window.history.state || {}), foldlineDeckBase: true };
        window.history.replaceState(base, "");
        window.history.pushState({ foldlineDeckGuard: true }, "", this._writtenHash || window.location.hash);
      } catch (_error) {
        this._guarded = false;
      }
    }

    _onPopState(event) {
      if (!this._booted || !event.state?.foldlineDeckBase) return;
      const now = performance.now();
      if (this._backArmedAt && now - this._backArmedAt <= BACK_CONFIRM_MS) {
        this._backArmedAt = 0;
        this._guarded = false;
        this._ignoreNextHash = true;
        this._hideNotice();
        window.history.back();
        return;
      }
      this._backArmedAt = now;
      try {
        window.history.pushState({ foldlineDeckGuard: true }, "", this._writtenHash || window.location.hash);
      } catch (_error) {
        return;
      }
      this._showNotice("Press Back again to leave the presentation", BACK_CONFIRM_MS);
    }

    // The skip link lands keyboard and screen-reader focus on the active scene itself.
    _onSkipLink(event) {
      const link = event.target?.closest?.('a[href="#stage"]');
      if (!link || !this._booted) return;
      event.preventDefault();
      this._focusSlide(this.currentSlide);
    }

    _focusSlide(slide) {
      if (!slide) return;
      slide.setAttribute("tabindex", "-1");
      slide.focus({ preventScroll: true });
    }

    // Presenting with the keys while a toolbar button holds keyboard focus (a stray Tab) hands the
    // projector back: the button is blurred and the toolbar hides.
    _releaseToolbarFocus() {
      const focused = this._root.activeElement;
      if (!focused || !this._controls.contains(focused)) return;
      focused.blur();
      if (this._hideTimer) window.clearTimeout(this._hideTimer);
      this._hideTimer = null;
      this._controls.removeAttribute("data-visible");
    }

    _onExternalCommand(event) {
      const command = event.detail?.command;
      if (command === "next") this.next();
      else if (command === "previous") this.prev();
      else if (command === "fragment-next") this.fragment(1);
      else if (command === "fragment-previous") this.fragment(-1);
      else if (command === "reset-current") this.resetCurrent();
      else if (command === "full-reset") this.fullReset();
      else if (command === "appendix-return") this.returnFromAppendix();
      else if (command === "goto" && event.detail?.sceneId) this.goToId(event.detail.sceneId, "presenter");
    }

    _lastMainIndex() {
      let last = 0;
      this._slides.forEach((slide, index) => {
        if ((slide.dataset.kind || "main") === "main") last = index;
      });
      return last;
    }

    // One press. The step engine handles it inside the scene; otherwise the deck changes scene.
    fragment(direction) {
      if (!this._booted) return;
      const slide = this._slides[this._index];
      const detail = { direction, handled: false, slide };
      this.dispatchEvent(new CustomEvent("fragmentrequest", { detail, bubbles: true, composed: true }));
      if (detail.handled) {
        this._announceStep(slide, direction);
        return;
      }
      const kind = slide?.dataset.kind || "main";
      if (direction > 0) {
        // The show ends on the last main scene: a forward press never walks into the appendix.
        if (kind === "main" && this._index >= this._lastMainIndex()) return;
        this.goTo(this._index + 1, "fragment-next");
        return;
      }
      // Backward from the first appendix page never walks into the main path: it returns to the scene
      // that opened the appendix (like Esc), or stays put when the appendix was opened directly.
      const previous = this._slides[this._index - 1];
      if (kind === "appendix" && (previous?.dataset.kind || "main") === "main") {
        if (this._appendixReturnIndex !== null) this.returnFromAppendix();
        else this._live.textContent = "First appendix page";
        return;
      }
      this.goTo(this._index - 1, "fragment-previous");
    }

    resetCurrent() {
      const slide = this._slides[this._index];
      if (!slide) return;
      this.dispatchEvent(new CustomEvent("fragmentreset", { detail: { slide }, bubbles: true, composed: true }));
      this._live.textContent = `${slide.dataset.label || slide.id} reset`;
    }

    fullReset() {
      this.dispatchEvent(new CustomEvent("deckreset", { bubbles: true, composed: true }));
      this.goTo(0, "full-reset");
    }

    _syncFullscreenControl() {
      const control = this._controls?.querySelector(".fullscreen");
      if (!control) return;
      control.hidden = document.fullscreenEnabled === false || typeof document.documentElement.requestFullscreen !== "function";
      const active = Boolean(document.fullscreenElement);
      const label = active ? "Exit fullscreen" : "Enter fullscreen";
      control.setAttribute("aria-label", label);
      control.setAttribute("title", label);
      control.querySelector("path")?.setAttribute("d", active ? GLYPH_EXIT_FULLSCREEN : GLYPH_ENTER_FULLSCREEN);
    }

    toggleFullscreen() {
      const exiting = Boolean(document.fullscreenElement);
      let request;
      try {
        request = exiting ? document.exitFullscreen?.() : document.documentElement.requestFullscreen?.();
      } catch (error) {
        request = Promise.reject(error);
      }
      Promise.resolve(request).then(() => this._syncFullscreenControl(), () => {
        this._syncFullscreenControl();
        this._showNotice(exiting
          ? "Could not leave fullscreen. Press Esc or use the browser menu."
          : "Fullscreen is not available here. Use F11 or the browser menu.", 4000);
      });
    }

    openPresenter() {
      window.open("./presenter.html", "foldline-presenter", "width=1180,height=820");
    }

    goTo(index, reason = "api") {
      if (!this._slides.length) return;
      const next = Math.max(0, Math.min(this._slides.length - 1, index));
      if (next === this._index) return;
      this._trackAppendixReturn(next, reason);
      this._index = next;
      this._apply(reason);
    }

    // Entering the appendix from a main scene remembers that scene (and its step) for Esc; any other
    // move to a main scene forgets it. Presses, presenter jumps and typed hashes share this bookkeeping.
    _trackAppendixReturn(nextIndex, reason) {
      const current = this._slides[this._index];
      const target = this._slides[nextIndex];
      const targetKind = target?.dataset.kind || "main";
      if ((current?.dataset.kind || "main") === "main" && targetKind === "appendix") {
        this._setAppendixReturn(this._index, Number.parseInt(current?.dataset.stepCurrent || "0", 10) || 0);
      } else if (targetKind === "main" && reason !== "appendix-return") {
        this._setAppendixReturn(null);
      }
    }

    goToId(sceneId, reason = "api") {
      const index = this._slides.findIndex((slide) => slide.id === sceneId);
      if (index >= 0) this.goTo(index, reason);
    }

    returnFromAppendix() {
      if (this.currentSlide?.dataset.kind !== "appendix" || this._appendixReturnIndex === null) return;
      const target = this._appendixReturnIndex;
      const step = this._appendixReturnStep;
      this._setAppendixReturn(null);
      if (target === this._index) return;
      this._trackAppendixReturn(target, "appendix-return");
      this._index = target;
      this._apply("appendix-return", Number.isInteger(step) ? step : null);
    }

    // Presenter "Next scene": the next scene at step 0, mirroring "Previous scene". Like a press,
    // it never walks from the last main scene into the appendix. One press is fragment(1).
    next() {
      const slide = this._slides[this._index];
      if ((slide?.dataset.kind || "main") === "main" && this._index >= this._lastMainIndex()) return;
      this.goTo(this._index + 1, "next");
    }

    prev() {
      this.goTo(this._index - 1, "previous");
    }

    get index() {
      return this._index;
    }

    get length() {
      return this._slides.length;
    }

    get currentSlide() {
      return this._slides[this._index] || null;
    }

    get appendixReturnSlide() {
      return this._appendixReturnIndex === null ? null : this._slides[this._appendixReturnIndex] || null;
    }
  }

  if (!window.customElements.get("deck-stage")) {
    window.customElements.define("deck-stage", DeckStage);
  }
})();
