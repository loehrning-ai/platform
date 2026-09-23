(() => {
  const DESIGN_W = 1920;
  const DESIGN_H = 1080;
  const STORAGE_KEY = "foldline-deck:last-scene:v1";
  const TOOLBAR_ZONE_PX = 140;
  const TOOLBAR_HIDE_MS = 2000;
  const TOOLBAR_TOUCH_MS = 4000;
  // How a scene is entered decides its first step (spec B.9): forward presses enter at step 0,
  // backward presses at the final step, and every jump (presenter goto, reset) at step 0.
  const ENTRY_BY_REASON = Object.freeze({ "fragment-next": "forward", "fragment-previous": "backward" });

  // Future step elements stay hidden until the step engine (lib/deck-runtime.js) is ready. Without
  // JavaScript this never runs, so nothing is hidden and the final meaning stays on the page.
  document.documentElement.dataset.story = "pending";

  const styles = `
    :host {
      position: fixed;
      inset: 0;
      display: block;
      overflow: hidden;
      color: #121212;
      background: #f3f0e9;
      font-family: "Typing", system-ui, -apple-system, "Segoe UI", sans-serif;
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
      transition: opacity 200ms ease;
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

    .control:first-child {
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

    @media (prefers-reduced-motion: reduce) {
      .controls {
        transition: none;
      }
    }

    @media print {
      :host {
        position: static;
        overflow: visible;
        background: none;
      }

      .stage {
        position: static;
        display: block;
      }

      .canvas {
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
      this._hideTimer = null;
      this._appendixReturnIndex = null;
      this._boundKey = this._onKey.bind(this);
      this._boundResize = this._fit.bind(this);
      this._boundPointerMove = this._onPointerMove.bind(this);
      this._boundPointerDown = this._onPointerDown.bind(this);
      this._boundCommand = this._onExternalCommand.bind(this);
      this._boundHash = this._onHashChange.bind(this);
    }

    connectedCallback() {
      this._render();
      window.addEventListener("keydown", this._boundKey);
      window.addEventListener("resize", this._boundResize);
      window.addEventListener("pointermove", this._boundPointerMove, { passive: true });
      window.addEventListener("pointerdown", this._boundPointerDown, { passive: true });
      window.addEventListener("deckcommand", this._boundCommand);
      window.addEventListener("hashchange", this._boundHash);
      this._syncPrintPage();
    }

    disconnectedCallback() {
      window.removeEventListener("keydown", this._boundKey);
      window.removeEventListener("resize", this._boundResize);
      window.removeEventListener("pointermove", this._boundPointerMove);
      window.removeEventListener("pointerdown", this._boundPointerDown);
      window.removeEventListener("deckcommand", this._boundCommand);
      window.removeEventListener("hashchange", this._boundHash);
      if (this._hideTimer) window.clearTimeout(this._hideTimer);
    }

    _render() {
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
        <button class="control fullscreen" type="button" aria-label="Enter fullscreen" title="Fullscreen">
          <svg viewBox="0 0 100 100" aria-hidden="true"><path d="M12 38V12h26M62 12h26v26M88 62v26H62M38 88H12V62"/></svg>
        </button>
      `;
      if (new URLSearchParams(window.location.search).get("export") === "final") controls.hidden = true;

      const live = document.createElement("div");
      live.className = "live-region";
      live.setAttribute("aria-live", "polite");
      live.setAttribute("aria-atomic", "true");

      this._root.append(style, stage, controls, live);
      this._canvas = canvas;
      this._slot = slot;
      this._controls = controls;
      this._live = live;

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
        action();
      });
    }

    get designWidth() {
      return Number.parseInt(this.getAttribute("width"), 10) || DESIGN_W;
    }

    get designHeight() {
      return Number.parseInt(this.getAttribute("height"), 10) || DESIGN_H;
    }

    _collect() {
      this._slides = this._slot.assignedElements({ flatten: true }).filter((element) => element.matches("section.slide"));
      const total = this._slides.length;
      this._slides.forEach((slide, index) => {
        const label = slide.dataset.label || slide.querySelector("h1,h2")?.textContent?.trim() || "Scene";
        slide.dataset.deckIndex = String(index);
        slide.setAttribute("role", "group");
        slide.setAttribute("aria-roledescription", "slide");
        slide.setAttribute("aria-label", `${index + 1} of ${total}: ${label}`);
      });
      const requested = this._hashTarget();
      const resume = new URLSearchParams(window.location.search).get("resume") === "1";
      const restored = resume ? this._restoreIndex() : null;
      this._index = requested?.index ?? restored ?? 0;
      this._index = Math.max(0, Math.min(total - 1, this._index));
      this._apply("init", requested?.index === this._index ? requested.step : 0);
      this._fit();
    }

    // The deck writes `#scene/step` on every press, so every URL is a deep link. A hash a person
    // types or pastes moves the deck; the echo of our own replaceState is ignored.
    // A hash that names no scene (a typo, or the skip link's #stage) is replaced by the canonical
    // `#<id>/<step>`, so a reload never drops the room back to the cover.
    _onHashChange() {
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

    _hashTarget() {
      const [rawId, rawStep] = window.location.hash.replace(/^#/, "").split("/");
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

    _restoreIndex() {
      try {
        const id = window.localStorage.getItem(STORAGE_KEY);
        const index = this._slides.findIndex((slide) => slide.id === id);
        return index >= 0 ? index : null;
      } catch (_error) {
        return null;
      }
    }

    // Resolves the step a scene is entered at. The step engine owns clamping and rendering; the
    // stage only records the request on the section so the hash it writes is already right.
    _entryStep(slide, reason, requestedStep) {
      const entry = ENTRY_BY_REASON[reason] || "jump";
      const total = Number.parseInt(slide.dataset.stepTotal || "", 10);
      let step;
      if (entry === "forward") step = 0;
      else if (entry === "backward") step = Number.isInteger(total) ? total : null;
      else if (reason === "appendix-return") step = Number.parseInt(slide.dataset.stepCurrent || "0", 10) || 0;
      else step = Number.isInteger(requestedStep) ? requestedStep : 0;
      if (step !== null && Number.isInteger(total)) step = Math.max(0, Math.min(total, step));
      return { entry, step };
    }

    _apply(reason, requestedStep = null) {
      if (!this._slides.length) return;
      const previousIndex = this._previousIndex ?? -1;
      const previousSlide = previousIndex >= 0 ? this._slides[previousIndex] : null;
      const slide = this._slides[this._index];
      this._slides.forEach((candidate, index) => {
        const active = index === this._index;
        candidate.toggleAttribute("data-deck-active", active);
        candidate.setAttribute("aria-hidden", active ? "false" : "true");
        candidate.inert = !active;
      });
      const returnControl = this._controls.querySelector(".return");
      returnControl.hidden = slide.dataset.kind !== "appendix" || this._appendixReturnIndex === null;
      try {
        window.localStorage.setItem(STORAGE_KEY, slide.id);
      } catch (_error) {
        // The presentation remains functional when storage is unavailable.
      }
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
      this._live.textContent = `${slide.dataset.label || slide.id}, scene ${this._index + 1} of ${this._slides.length}`;
      this._previousIndex = this._index;
    }

    // Writes `#<id>/<step>` from the current section. The step engine calls this after every press.
    syncHash() {
      const slide = this.currentSlide;
      if (!slide) return;
      this._writtenHash = `#${encodeURIComponent(slide.id)}/${slide.dataset.stepCurrent || "0"}`;
      try {
        window.history.replaceState(null, "", this._writtenHash);
      } catch (_error) {
        // Hash persistence is convenience, not a runtime dependency.
      }
    }

    _syncPrintPage() {
      const id = "foldline-deck-print-page";
      let style = document.getElementById(id);
      if (!style) {
        style = document.createElement("style");
        style.id = id;
        document.head.appendChild(style);
      }
      style.textContent = `@page { size: ${this.designWidth}px ${this.designHeight}px; margin: 0; }
        @media print { html, body { margin: 0 !important; padding: 0 !important; overflow: visible !important; height: auto !important; } }`;
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

    // Only a pointer shows the toolbar: moving inside the bottom band, or a tap there on touch.
    // Keyboard presses never show it, so the projector stays clean while presenting.
    _onPointerMove(event) {
      if (event.pointerType === "touch") return;
      if (event.clientY < window.innerHeight - TOOLBAR_ZONE_PX) return;
      this._showControls(TOOLBAR_HIDE_MS);
    }

    _onPointerDown(event) {
      if (event.pointerType === "mouse") return;
      if (event.clientY < window.innerHeight - TOOLBAR_ZONE_PX) return;
      this._showControls(TOOLBAR_TOUCH_MS);
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

    // Buttons, links and summaries are not typing targets; only real text inputs keep arrow keys.
    _isTypingTarget(target) {
      if (!target) return false;
      return Boolean(target.isContentEditable || target.closest?.("input, select, textarea, [contenteditable]"));
    }

    _onKey(event) {
      if (event.metaKey || event.ctrlKey || event.altKey || this._isTypingTarget(event.target)) return;
      let handled = true;
      // Five keys (README contract): ArrowRight is the next press, ArrowLeft the previous press
      // (a scene is left only once its steps are used up, and entered at its final step), r resets
      // the whole deck, P opens the presenter console and Escape leaves an appendix.
      // Space, Enter, Home, End, F, PageUp and PageDown are deliberately unbound (spec E12).
      if (event.key === "ArrowRight") this.fragment(1);
      else if (event.key === "ArrowLeft") this.fragment(-1);
      else if (event.key === "r" || event.key === "R") this.fullReset();
      else if (event.key === "p" || event.key === "P") this.openPresenter();
      else if (event.key === "Escape" && this.currentSlide?.dataset.kind === "appendix") this.returnFromAppendix();
      else handled = false;
      if (!handled) return;
      event.preventDefault();
      this._releaseToolbarFocus();
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
      const slide = this._slides[this._index];
      const detail = { direction, handled: false, slide };
      this.dispatchEvent(new CustomEvent("fragmentrequest", { detail, bubbles: true, composed: true }));
      if (detail.handled) return;
      if (direction > 0) {
        // The show ends on the last main scene: a forward press never walks into the appendix.
        if ((slide?.dataset.kind || "main") === "main" && this._index >= this._lastMainIndex()) return;
        this.goTo(this._index + 1, "fragment-next");
      } else {
        this.goTo(this._index - 1, "fragment-previous");
      }
    }

    resetCurrent() {
      const slide = this._slides[this._index];
      this.dispatchEvent(new CustomEvent("fragmentreset", { detail: { slide }, bubbles: true, composed: true }));
      this._live.textContent = `${slide.dataset.label || slide.id} reset`;
    }

    fullReset() {
      this.dispatchEvent(new CustomEvent("deckreset", { bubbles: true, composed: true }));
      this.goTo(0, "full-reset");
    }

    toggleFullscreen() {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else document.documentElement.requestFullscreen?.();
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

    // Entering the appendix from a main scene remembers that scene for Esc; any other move to a
    // main scene forgets it. Presses, presenter jumps and typed hashes share this bookkeeping.
    _trackAppendixReturn(nextIndex, reason) {
      const current = this._slides[this._index];
      const target = this._slides[nextIndex];
      const targetKind = target?.dataset.kind || "main";
      if ((current?.dataset.kind || "main") === "main" && targetKind === "appendix") {
        this._appendixReturnIndex = this._index;
      } else if (targetKind === "main" && reason !== "appendix-return") {
        this._appendixReturnIndex = null;
      }
    }

    goToId(sceneId, reason = "api") {
      const index = this._slides.findIndex((slide) => slide.id === sceneId);
      if (index >= 0) this.goTo(index, reason);
    }

    returnFromAppendix() {
      if (this.currentSlide?.dataset.kind !== "appendix" || this._appendixReturnIndex === null) return;
      const target = this._appendixReturnIndex;
      this._appendixReturnIndex = null;
      this.goTo(target, "appendix-return");
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
