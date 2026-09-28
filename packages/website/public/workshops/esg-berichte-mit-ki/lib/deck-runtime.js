(() => {
  // Step engine, Route chrome, motion helpers and evidence facade for the arrow-driven deck
  // (spec B.7 to B.10), plus the authenticated presenter sync kept from the previous runtime.
  // Deck-specific chrome is configured on <deck-stage>: data-route-stations="A|B|C" (one station per
  // act, act 1 = first station) and data-deck-title (the brand line beside the mark).
  const deckConfig = (name, fallback) => document.getElementById("stage")?.dataset?.[name] || fallback;
  const routeStations = () => deckConfig("routeStations", "").split("|").map((label) => label.trim()).filter(Boolean);
  const STATE_KEY = "esg-deck:presenter-state:v1";
  const COMMAND_KEY = "esg-deck:presenter-command:v1";
  const DECK_STARTED_KEY = "esg-deck:deck-started:v1";
  const CHANNEL_NAME = "esg-deck:v1";
  const WINDOW_PROTOCOL = "esg-deck:window:v1";
  const SHARED_PROTOCOL = "esg-deck:shared-auth:v1";
  const WINDOW_CHANNEL_PATTERN = /^[A-Za-z0-9._~-]{16,160}$/;
  const ALLOWED_PRESENTER_COMMANDS = new Set([
    "previous", "fragment-previous", "fragment-next", "next", "reset-current", "full-reset", "appendix-return", "goto",
  ]);
  const EVIDENCE_LOG_LIMIT = 6;

  function randomBase64Url(byteLength) {
    if (!globalThis.crypto?.getRandomValues) return "";
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(byteLength));
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function base64UrlBytes(value) {
    const base64 = String(value).replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }

  function createChannelId() {
    return randomBase64Url(24);
  }

  async function importSharedAuthKey(secret) {
    if (!secret || !globalThis.crypto?.subtle) return null;
    try {
      return await globalThis.crypto.subtle.importKey(
        "raw",
        base64UrlBytes(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"],
      );
    } catch (_error) {
      return null;
    }
  }

  function signedBody(envelope) {
    return JSON.stringify({ protocol: envelope.protocol, kind: envelope.kind, payload: envelope.payload });
  }

  async function signSharedEnvelope(kind, payload) {
    const keyPromise = sharedAuthKeyPromise;
    const key = await keyPromise;
    if (!key || keyPromise !== sharedAuthKeyPromise) return null;
    const body = { protocol: SHARED_PROTOCOL, kind, payload };
    const signature = await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(JSON.stringify(body)));
    if (keyPromise !== sharedAuthKeyPromise) return null;
    return { ...body, signature: randomBytesToBase64Url(new Uint8Array(signature)) };
  }

  async function verifySharedEnvelope(envelope, expectedKinds) {
    const keyPromise = sharedAuthKeyPromise;
    const key = await keyPromise;
    if (!key
      || !envelope
      || envelope.protocol !== SHARED_PROTOCOL
      || !expectedKinds.has(envelope.kind)
      || typeof envelope.signature !== "string") return false;
    try {
      const verified = await globalThis.crypto.subtle.verify(
        "HMAC",
        key,
        base64UrlBytes(envelope.signature),
        new TextEncoder().encode(signedBody(envelope)),
      );
      return verified && keyPromise === sharedAuthKeyPromise;
    } catch (_error) {
      return false;
    }
  }

  function randomBytesToBase64Url(bytes) {
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  const syncSessionId = createChannelId();
  let sharedAuthSecret = randomBase64Url(32);
  let sharedAuthKeyPromise = importSharedAuthKey(sharedAuthSecret);

  function rotateSharedAuthentication() {
    sharedAuthSecret = randomBase64Url(32);
    sharedAuthKeyPromise = importSharedAuthKey(sharedAuthSecret);
  }

  function create(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  /* ------------------------------------------------------------------ sealed record and formats */

  const MINUS = "−";
  const groupedInteger = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

  // Evidence formats (spec B.10): eur → −€19,960 (U+2212, no decimals), pct0 → 10%, int → 2,592,
  // of:<n> → 3 of 3.
  const format = Object.freeze({
    eur(value) {
      const amount = Math.round(Number(value));
      return `${amount < 0 ? MINUS : ""}€${groupedInteger.format(Math.abs(amount))}`;
    },
    pct0(value) {
      return `${Math.round(Number(value))}%`;
    },
    int(value) {
      return groupedInteger.format(Math.round(Number(value)));
    },
    of(value, total) {
      return `${groupedInteger.format(Math.round(Number(value)))} of ${total}`;
    },
  });

  function formatBinding(value, spec) {
    if (value === undefined || value === null || value === "") return null;
    if (!spec) return String(value);
    if (spec === "eur") return format.eur(value);
    if (spec === "pct0") return format.pct0(value);
    if (spec === "int") return format.int(value);
    const of = /^of:(\d+)$/.exec(spec);
    if (of) return format.of(value, of[1]);
    return null;
  }

  const sealed = Object.freeze({
    capture: (lane, caseId) => window.FOLDLINE_MODEL_CAPTURES?.captures?.[`${lane}:${caseId}`] ?? null,
    fixed: (lane, caseId) => window.FOLDLINE_REPLAY?.responses?.[`${lane}:${caseId}`] ?? null,
    truth: (caseId) => window.FOLDLINE_REPLAY?.responses?.[`ready:${caseId}`]?.evidence ?? null,
    corpus: () => window.FOLDLINE_REPLAY?.evaluation ?? [],
    summary: () => window.FOLDLINE_MODEL_CAPTURES?.summary ?? null,
    dataset: () => window.FOLDLINE_REPLAY?.dataset ?? null,
  });

  // data-ev grammar (spec B.10): capture:<lane>:<case>:<row>:<column> · truth:<case>:<row>:<column>
  // · summary:<lane>:<field> · corpus:ready-pass · dataset:<field> (the sealed dataset envelope; the
  // capture and replay copies must agree).
  function sealedValue(key) {
    const parts = String(key || "").split(":");
    const row = (value) => (/^\d+$/.test(value) ? Number(value) : -1);
    if (parts[0] === "capture" && parts.length === 5) return sealed.capture(parts[1], parts[2])?.rows?.[row(parts[3])]?.[parts[4]];
    if (parts[0] === "truth" && parts.length === 4) return sealed.truth(parts[1])?.rows?.[row(parts[2])]?.[parts[3]];
    if (parts[0] === "summary" && parts.length === 3) return sealed.summary()?.[parts[1]]?.[parts[2]];
    if (key === "corpus:ready-pass") return sealed.corpus().filter((entry) => entry.ready === "pass").length;
    if (parts[0] === "dataset" && parts.length === 2) {
      const value = sealed.dataset()?.[parts[1]];
      return value === window.FOLDLINE_MODEL_CAPTURES?.dataset?.[parts[1]] ? value : undefined;
    }
    return undefined;
  }

  const authoredText = new WeakMap();
  const authoredAriaHidden = new WeakSet();
  const bindingMismatches = [];

  // Every projected number is authored in its final text and bound to the sealed record. A typo
  // logs console.error (which fails every browser gate) and flags the presenter; the projector
  // keeps the authored text.
  function checkEvidenceBindings(root) {
    root.querySelectorAll("[data-ev]").forEach((element) => {
      const authored = element.textContent.trim();
      authoredText.set(element, authored);
      const expected = formatBinding(sealedValue(element.dataset.ev), element.dataset.format);
      if (expected === authored) return;
      const sceneId = element.closest("section.slide")?.id || "unknown scene";
      const message = `data-ev ${element.dataset.ev} on #${sceneId}: authored "${authored}", sealed record formats to ${expected === null ? "nothing" : `"${expected}"`}`;
      bindingMismatches.push(message);
      console.error(message);
    });
  }

  /* ------------------------------------------------------------------ motion helpers */

  const ROOT_STYLE = () => window.getComputedStyle(document.documentElement);

  // Motion tokens are read from the animating element, so a scene can shorten one short path
  // (spec B.7: 400 ms draws); custom properties inherit, so the :root value is the default.
  function cssMilliseconds(name, fallback, element) {
    const style = element instanceof Element ? window.getComputedStyle(element) : ROOT_STYLE();
    const value = Number.parseFloat(style.getPropertyValue(name));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  const easeOut = (t) => 1 - (1 - t) ** 3;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const clamp01 = (t) => Math.max(0, Math.min(1, t));

  // A CSS cubic-bezier() as a JS timing function (x → y), so rAF-driven motion (travel, the rare
  // non-evidence count) runs on the same curve as the motion tokens the CSS primitives use.
  function cubicBezier(x1, y1, x2, y2) {
    const sample = (a, b, t) => ((1 - 3 * b + 3 * a) * t + (3 * b - 6 * a)) * t * t + 3 * a * t;
    const slope = (a, b, t) => 3 * (1 - 3 * b + 3 * a) * t * t + 2 * (3 * b - 6 * a) * t + 3 * a;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i += 1) {
        const error = sample(x1, x2, t) - x;
        if (Math.abs(error) < 1e-5) return sample(y1, y2, t);
        const d = slope(x1, x2, t);
        if (Math.abs(d) < 1e-6) break;
        t -= error / d;
      }
      let low = 0;
      let high = 1;
      t = x;
      for (let i = 0; i < 24; i += 1) {
        const value = sample(x1, x2, t);
        if (Math.abs(value - x) < 1e-5) break;
        if (value < x) low = t;
        else high = t;
        t = (low + high) / 2;
      }
      return sample(y1, y2, t);
    };
  }

  const NAMED_EASINGS = Object.freeze({
    linear: [0, 0, 1, 1],
    ease: [0.25, 0.1, 0.25, 1],
    "ease-in": [0.42, 0, 1, 1],
    "ease-out": [0, 0, 0.58, 1],
    "ease-in-out": [0.42, 0, 0.58, 1],
  });

  // Reads an easing token (e.g. --ease-out, --ease-travel) from the element (scenes may override it)
  // and returns { css, fn }; without the token the fallback curve is kept.
  function easingToken(name, element, fallbackFn, fallbackCss) {
    const style = element instanceof Element ? window.getComputedStyle(element) : ROOT_STYLE();
    const css = style.getPropertyValue(name).trim();
    const named = NAMED_EASINGS[css];
    if (named) return { css, fn: named[0] === 0 && named[2] === 1 && named[1] === 0 && named[3] === 1 ? (t) => t : cubicBezier(...named) };
    const match = /^cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)$/.exec(css);
    if (match) {
      const [x1, y1, x2, y2] = match.slice(1).map(Number);
      if ([x1, y1, x2, y2].every(Number.isFinite) && x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1) return { css, fn: cubicBezier(x1, y1, x2, y2) };
    }
    return { css: fallbackCss, fn: fallbackFn };
  }

  // When an evidence value may appear: once the bar or card it labels has landed. That is the latest
  // end of any animation on its animating ancestors, or on its paired bar (…-label-s-g ↔ …-bar-s-g),
  // less half a fade so the value arrives with the landing rather than after it.
  function landingDelay(element, slide, fadeMs) {
    let end = 0;
    const consider = (node) => {
      node?.getAnimations?.().forEach((animation) => {
        const timing = animation.effect?.getComputedTiming?.();
        if (!timing || !Number.isFinite(timing.endTime)) return;
        end = Math.max(end, timing.endTime - (Number(animation.currentTime) || 0));
      });
    };
    for (let node = element.parentElement; node && node !== slide; node = node.parentElement) consider(node);
    const pair = /^(.*)-label-(\d+-\d+)$/.exec(element.id || "");
    if (pair) consider(slide?.querySelector(`#${CSS.escape(`${pair[1]}-bar-${pair[2]}`)}`));
    const order = Math.min(4, Math.max(0, Number.parseFloat(window.getComputedStyle(element).getPropertyValue("--order")) || 0));
    const own = order * cssMilliseconds("--m-stagger", 80, element);
    return Math.max(own, end > 0 ? end - fadeMs / 2 : 0);
  }

  function parseCount(text) {
    const match = /^([^\d−-]*?)([−-]?)([^\d−-]*?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(text);
    if (!match) return null;
    const [, lead, sign, unit, digits, tail] = match;
    const decimals = (digits.split(".")[1] || "").length;
    const grouped = digits.includes(",");
    const target = Number(digits.replace(/,/g, ""));
    const render = (value) => {
      const fixed = value.toFixed(decimals);
      const [whole, fraction] = fixed.split(".");
      const body = grouped ? `${groupedInteger.format(Number(whole))}${fraction ? `.${fraction}` : ""}` : fixed;
      return `${lead}${sign}${unit}${body}${tail}`;
    };
    return { target, render };
  }

  // Evidence values (data-ev) never count: a counting number shows false intermediate values (€174,117
  // beside a bar at 60 %, "1 of 3" beside an honesty line). They appear at their authored text with a
  // fade that starts as the bar or card they label lands. Only a value without an evidence binding
  // counts 0 → the authored text, on the --ease-out token, after the same landing delay; a negative
  // value carries its minus sign from the first frame.
  function countUp(element, { signal } = {}) {
    const finalText = authoredText.get(element) ?? element.textContent.trim();
    authoredText.set(element, finalText);
    const parsed = parseCount(finalText);
    if (!parsed || signal?.aborted || motionMode !== "full") {
      element.textContent = finalText;
      return Promise.resolve();
    }
    const slide = element.closest("section.slide");
    const fadeMs = cssMilliseconds("--m-fade", 200, element);
    const delay = landingDelay(element, slide, fadeMs);
    const ease = easingToken("--ease-out", element, easeOut, "cubic-bezier(0.16, 1, 0.3, 1)");
    if (element.hasAttribute("data-ev") || /^of:/.test(element.dataset.format || "")) {
      element.textContent = finalText;
      const fade = element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: fadeMs, delay, easing: ease.css, fill: "backwards" });
      signal?.addEventListener("abort", () => fade.finish(), { once: true });
      return fade.finished.then(() => undefined, () => undefined);
    }
    const duration = cssMilliseconds("--m-count", 600, element);
    return new Promise((resolve) => {
      let frame = 0;
      let started = null;
      const finish = () => {
        window.cancelAnimationFrame(frame);
        element.textContent = finalText;
        resolve();
      };
      signal?.addEventListener("abort", finish, { once: true });
      // The clock starts at the first frame (a rAF timestamp can precede performance.now() at the call).
      const tick = (now) => {
        if (signal?.aborted) return;
        if (started === null) started = now + delay;
        const t = clamp01((now - started) / duration);
        if (now - started >= duration) {
          signal?.removeEventListener("abort", finish);
          finish();
          return;
        }
        element.textContent = parsed.render(parsed.target * ease.fn(t));
        frame = window.requestAnimationFrame(tick);
      };
      element.textContent = parsed.render(0);
      frame = window.requestAnimationFrame(tick);
    });
  }

  // Places the packet's centre on a point of the path. An SVG packet is translated from its own
  // box centre; an HTML packet from its layout position inside its offset parent.
  function pathPlacer(element, pathElement) {
    const pathMatrix = pathElement.getScreenCTM();
    if (!pathMatrix) return null;
    if (element instanceof SVGGraphicsElement) {
      const parentMatrix = element.parentNode?.getScreenCTM?.()?.inverse();
      if (!parentMatrix) return null;
      const box = element.getBBox();
      const centreX = box.x + box.width / 2;
      const centreY = box.y + box.height / 2;
      return (point) => {
        const local = new DOMPoint(point.x, point.y).matrixTransform(pathMatrix).matrixTransform(parentMatrix);
        element.setAttribute("transform", `translate(${local.x - centreX} ${local.y - centreY})`);
      };
    }
    const container = element.offsetParent;
    if (!container) return null;
    return (point) => {
      const screen = new DOMPoint(point.x, point.y).matrixTransform(pathMatrix);
      const box = container.getBoundingClientRect();
      const scale = container.offsetWidth ? box.width / container.offsetWidth : 1;
      const x = (screen.x - box.left) / scale - element.offsetLeft - element.offsetWidth / 2;
      const y = (screen.y - box.top) / scale - element.offsetTop - element.offsetHeight / 2;
      element.style.transform = `translate(${x}px, ${y}px)`;
    };
  }

  // draw: each stroke is revealed from its start (stroke-dashoffset only). Lengths come from
  // getTotalLength(), so connectors never need pathLength. A dashed stroke keeps its own dash
  // pattern: a solid copy inside a temporary <mask> draws instead, and is removed on finish.
  let drawMaskSequence = 0;

  function drawShapes(element) {
    if (typeof element.getTotalLength === "function") return [element];
    return [...element.querySelectorAll("path, line, polyline, polygon, rect, circle, ellipse")];
  }

  function dashUnits(shape) {
    const authored = Number.parseFloat(shape.getAttribute("pathLength"));
    return Number.isFinite(authored) && authored > 0 ? authored : shape.getTotalLength();
  }

  function maskedDraw(shape, slide, timing) {
    const svg = shape.ownerSVGElement;
    const length = shape.getTotalLength();
    if (!svg || !(length > 0)) return null;
    const namespace = svg.namespaceURI;
    const box = shape.getBBox();
    const pad = Number.parseFloat(window.getComputedStyle(shape).strokeWidth || "0") * 2 + 24;
    const mask = document.createElementNS(namespace, "mask");
    drawMaskSequence += 1;
    mask.id = `${slide.id}-draw-mask-${drawMaskSequence}`;
    Object.entries({ maskUnits: "userSpaceOnUse", x: box.x - pad, y: box.y - pad, width: box.width + pad * 2, height: box.height + pad * 2 })
      .forEach(([name, value]) => mask.setAttribute(name, String(value)));
    const reveal = shape.cloneNode(false);
    [...reveal.attributes].map((attribute) => attribute.name)
      .filter((name) => !["d", "x", "y", "x1", "y1", "x2", "y2", "width", "height", "cx", "cy", "r", "rx", "ry", "points"].includes(name))
      .forEach((name) => reveal.removeAttribute(name));
    Object.entries({ fill: "none", stroke: "#fff", "stroke-width": pad, "stroke-linecap": "butt", "stroke-dasharray": `${length} ${length}` })
      .forEach(([name, value]) => reveal.setAttribute(name, String(value)));
    mask.append(reveal);
    let defs = svg.querySelector(":scope > defs");
    if (!defs) {
      defs = document.createElementNS(namespace, "defs");
      svg.prepend(defs);
    }
    defs.append(mask);
    const reference = `url(#${mask.id})`;
    shape.setAttribute("mask", reference);
    const animation = reveal.animate([{ strokeDashoffset: `${length}` }, { strokeDashoffset: "0" }], timing);
    const cleanup = () => {
      if (shape.getAttribute("mask") === reference) shape.removeAttribute("mask");
      mask.remove();
    };
    animation.finished.then(cleanup, cleanup);
    return animation;
  }

  function drawIn(element, { signal } = {}) {
    const slide = element.closest("section.slide");
    if (!slide || signal?.aborted || motionMode !== "full") return Promise.resolve();
    const order = Math.min(4, Math.max(0, Number.parseFloat(window.getComputedStyle(element).getPropertyValue("--order")) || 0));
    const timing = {
      duration: cssMilliseconds("--m-draw", 560, element),
      // --draw-delay lets a scene hold a connector until the element it joins has landed.
      delay: order * cssMilliseconds("--m-stagger", 80, element) + cssMilliseconds("--draw-delay", 0, element),
      easing: easingToken("--ease-out", element, easeOut, "cubic-bezier(0.16, 1, 0.3, 1)").css,
      fill: "backwards",
    };
    const animations = drawShapes(element).map((shape) => {
      if (window.getComputedStyle(shape).strokeDasharray !== "none") return maskedDraw(shape, slide, timing);
      const units = dashUnits(shape);
      if (!(units > 0)) return null;
      const dash = `${units} ${units}`;
      return shape.animate([
        { strokeDasharray: dash, strokeDashoffset: `${units}` },
        { strokeDasharray: dash, strokeDashoffset: "0" },
      ], timing);
    }).filter(Boolean);
    return Promise.all(animations.map((animation) => animation.finished.catch(() => undefined))).then(() => undefined);
  }

  // A thin mennige line follows the packet along its path, so the route stays readable while the
  // packet moves; it fades once the packet arrives and is then removed (the end state is unchanged).
  function travelTrail(pathElement) {
    const svg = pathElement.ownerSVGElement;
    if (!svg || typeof pathElement.getTotalLength !== "function") return null;
    const trail = pathElement.cloneNode(false);
    ["id", "class", "style", "pathLength", "data-motion", "data-step", "data-step-until", "data-focus", "mask", "marker-end", "marker-start"]
      .forEach((name) => trail.removeAttribute(name));
    const length = pathElement.getTotalLength();
    if (!(length > 0)) return null;
    const colour = ROOT_STYLE().getPropertyValue("--mennige").trim() || "#b73a15";
    Object.entries({
      class: "travel-trail",
      fill: "none",
      stroke: colour,
      "stroke-width": "4",
      "stroke-linecap": "butt",
      "stroke-linejoin": "miter",
      "stroke-dasharray": `${length} ${length}`,
      "stroke-dashoffset": `${length}`,
      "aria-hidden": "true",
      "pointer-events": "none",
    }).forEach(([name, value]) => trail.setAttribute(name, value));
    const transform = pathElement.getAttribute("transform");
    if (transform) trail.setAttribute("transform", transform);
    // Same coordinate system as the path; drawn just above it.
    pathElement.after(trail);
    return {
      progress(fraction) {
        trail.setAttribute("stroke-dashoffset", String(length * (1 - clamp01(fraction))));
      },
      settle(fadeMs, signal) {
        trail.setAttribute("stroke-dashoffset", "0");
        if (signal?.aborted || !(fadeMs > 0)) {
          trail.remove();
          return;
        }
        const fade = trail.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fadeMs, easing: "linear", fill: "forwards" });
        const remove = () => trail.remove();
        fade.finished.then(remove, remove);
      },
      remove() {
        trail.remove();
      },
    };
  }

  // travel: the packet moves along its data-path, disappears on arrival, and its data-target gets
  // .is-active. Aborting (the next press) jumps straight to that final state. The curve is the
  // --ease-travel token when a scene or tokens.css defines it (the cubic in-out otherwise).
  function travel(element, pathElement, { signal } = {}) {
    const slide = element.closest("section.slide");
    const target = element.dataset.target ? queryInSlide(slide, element.dataset.target) : null;
    const arrive = () => {
      element.removeAttribute("transform");
      element.style.removeProperty("transform");
      target?.classList.add("is-active");
    };
    if (!pathElement || typeof pathElement.getTotalLength !== "function") {
      console.error(`Story.travel on #${slide?.id}: data-path ${element.dataset.path} is not an SVG path in the scene`);
      arrive();
      return Promise.resolve();
    }
    const place = pathElement.isConnected ? pathPlacer(element, pathElement) : null;
    if (!place || signal?.aborted || motionMode !== "full") {
      arrive();
      return Promise.resolve();
    }
    const length = pathElement.getTotalLength();
    const duration = cssMilliseconds("--m-travel", 700, element);
    const ease = easingToken("--ease-travel", element, easeInOut, "").fn;
    target?.classList.remove("is-active");
    const trail = travelTrail(pathElement);
    return new Promise((resolve) => {
      let frame = 0;
      let started = null;
      const finish = () => {
        window.cancelAnimationFrame(frame);
        arrive();
        trail?.settle(signal?.aborted ? 0 : cssMilliseconds("--m-fade", 200, element), signal);
        resolve();
      };
      const abort = () => {
        trail?.remove();
        finish();
      };
      signal?.addEventListener("abort", abort, { once: true });
      const tick = (now) => {
        if (signal?.aborted) return;
        if (started === null) started = now;
        const t = clamp01((now - started) / duration);
        const eased = ease(t);
        place(pathElement.getPointAtLength(length * eased));
        trail?.progress(eased);
        if (t >= 1) {
          signal?.removeEventListener("abort", abort);
          finish();
          return;
        }
        frame = window.requestAnimationFrame(tick);
      };
      place(pathElement.getPointAtLength(0));
      frame = window.requestAnimationFrame(tick);
    });
  }

  // Shared Truth Chart geometry: one scale for every series, zero line included, a 6 px minimum
  // bar and a 12 px minimum below zero. `series` is an array of equal-length value arrays.
  function bars({ series, width, height, groupGap = 48, barGap = 8, min, max, minBar = 6, minNegativeBar = 12 } = {}) {
    if (!Array.isArray(series) || !series.length || series.some((row) => !Array.isArray(row) || row.length !== series[0].length || !row.length)) {
      throw new Error("Story.chart.bars needs a non-empty array of equal-length series");
    }
    if (!(width > 0) || !(height > 0)) throw new Error("Story.chart.bars needs a positive width and height");
    const values = series.flat().map(Number);
    if (values.some((value) => !Number.isFinite(value))) throw new Error("Story.chart.bars values must be finite numbers");
    const low = Math.min(0, min ?? Math.min(...values));
    const high = Math.max(0, max ?? Math.max(...values));
    const scale = height / (high - low || 1);
    const zeroY = high * scale;
    const groups = series[0].length;
    const groupWidth = (width - groupGap * (groups - 1)) / groups;
    const barWidth = (groupWidth - barGap * (series.length - 1)) / series.length;
    const result = [];
    series.forEach((row, seriesIndex) => row.forEach((raw, groupIndex) => {
      const value = Number(raw);
      const negative = value < 0;
      const barHeight = value === 0 ? 0 : Math.max(Math.abs(value) * scale, negative ? minNegativeBar : minBar);
      result.push({
        series: seriesIndex,
        group: groupIndex,
        value,
        negative,
        x: groupIndex * (groupWidth + groupGap) + seriesIndex * (barWidth + barGap),
        y: negative ? zeroY : zeroY - barHeight,
        width: barWidth,
        height: barHeight,
      });
    }));
    return { zeroY, scale, groupWidth, barWidth, bars: result };
  }

  /* ------------------------------------------------------------------ step engine (spec B.9) */

  const exportFinal = new URLSearchParams(window.location.search).get("export") === "final";
  const reducedMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)") || null;
  const registrations = new Map();
  const sceneRuntimes = new WeakMap();
  const evidenceLog = [];
  let motionMode = "full";
  let printing = false;
  let liveStepsBeforePrint = null;
  let engineReady = false;
  let demoReady = Promise.resolve();

  function runtimeFor(slide) {
    if (!sceneRuntimes.has(slide)) sceneRuntimes.set(slide, { step: 0, controller: null, evidenceController: null });
    return sceneRuntimes.get(slide);
  }

  function stepNumber(value) {
    return /^\d+$/.test(String(value ?? "")) ? Number(value) : 0;
  }

  function queryInSlide(slide, selector) {
    try {
      return slide?.querySelector(selector) || null;
    } catch (_error) {
      return null;
    }
  }

  // stepTotal = max(data-step, data-step-until − 1), or `steps` from Story.register.
  function stepTotal(slide) {
    const declared = registrations.get(slide.id)?.steps;
    if (Number.isInteger(declared) && declared >= 0) return declared;
    let total = 0;
    slide.querySelectorAll("[data-step]").forEach((element) => { total = Math.max(total, stepNumber(element.dataset.step)); });
    slide.querySelectorAll("[data-step-until]").forEach((element) => { total = Math.max(total, stepNumber(element.dataset.stepUntil) - 1); });
    return total;
  }

  function revealStep(element, slide) {
    const host = element.closest("[data-step]");
    return host && slide.contains(host) ? stepNumber(host.dataset.step) : 0;
  }

  // ?motion=full|reduced|static overrides the operating system for this page: a presenter whose laptop
  // has Reduce Motion switched on can still show the room the full choreography, and the reverse.
  const motionOverride = (() => {
    const value = new URLSearchParams(window.location.search).get("motion");
    return ["full", "reduced", "static"].includes(value) ? value : null;
  })();

  function detectMotion() {
    if (exportFinal || printing) return "static";
    if (motionOverride) return motionOverride;
    return reducedMotionQuery?.matches ? "reduced" : "full";
  }

  // A press during motion snaps every running animation to its final pose first; no press is
  // ever ignored or queued.
  function snap(slide) {
    const runtime = runtimeFor(slide);
    runtime.controller?.abort();
    runtime.controller = null;
    slide.getAnimations?.({ subtree: true }).forEach((animation) => {
      try {
        animation.finish();
      } catch (_error) {
        animation.cancel();
      }
    });
    slide.querySelectorAll(".is-entering").forEach((element) => element.classList.remove("is-entering"));
  }

  function applyStepVisibility(slide, step) {
    slide.querySelectorAll("[data-step], [data-step-until]").forEach((item) => {
      const from = stepNumber(item.dataset.step);
      const until = item.hasAttribute("data-step-until") ? stepNumber(item.dataset.stepUntil) : Number.POSITIVE_INFINITY;
      const revealed = step >= from && step < until;
      item.classList.toggle("is-step-hidden", !revealed);
      item.inert = !revealed;
      if (!authoredAriaHidden.has(item)) item.setAttribute("aria-hidden", revealed ? "false" : "true");
    });
  }

  function applyTravelTargets(slide, step) {
    slide.querySelectorAll('[data-motion="travel"][data-target]').forEach((packet) => {
      queryInSlide(slide, packet.dataset.target)?.classList.toggle("is-active", step >= revealStep(packet, slide));
    });
  }

  function buildChrome(slide) {
    const route = slide.dataset.route;
    if (!route || route === "none" || slide.querySelector(":scope > .story-chrome")) return;
    const chrome = create("header", "story-chrome");
    chrome.setAttribute("aria-hidden", "true");
    chrome.dataset.route = route;
    const brand = create("div", "story-chrome__brand");
    const mark = create("img", "story-chrome__mark");
    mark.src = "./assets/mark-black.svg";
    mark.width = 28;
    mark.height = 28;
    mark.alt = "";
    brand.append(mark, create("span", "story-chrome__title", deckConfig("deckTitle", document.title)));
    chrome.append(brand);
    if (slide.dataset.kind === "appendix") {
      chrome.append(create("p", "route-appendix", "Appendix"));
    } else if (route !== "hidden") {
      const list = create("ol", "route");
      routeStations().forEach((label, index) => {
        const station = create("li", "route__station");
        station.dataset.station = String(index + 1);
        const text = create("span", "route__text");
        text.append(create("span", "route__label", label), create("span", "route__bar"));
        station.append(create("span", "route__square"), text);
        list.append(station);
      });
      chrome.append(list);
    }
    slide.append(chrome);
  }

  // The Route (spec A.3): one current station; its underline is
  // (position of the scene in the station + step / stepTotal) / scenes in the station.
  function paintRoute(slide) {
    const chrome = slide.querySelector(":scope > .story-chrome");
    if (!chrome) return;
    const appendixLine = chrome.querySelector(".route-appendix");
    if (appendixLine) {
      // Opened from the cover (or a typed link before the show starts) there is no calling scene to
      // name; the cover's label is the deck title, so the line just says "Appendix".
      const caller = slide === stage?.currentSlide ? stage.appendixReturnSlide : null;
      const named = caller && caller.id !== "cover" ? caller : null;
      appendixLine.textContent = named ? `Appendix · Esc returns to ${named.dataset.label || named.id}` : "Appendix";
      return;
    }
    const list = chrome.querySelector(".route");
    if (!list) return;
    const act = stepNumber(slide.dataset.act);
    const current = Math.max(1, act);
    const members = slides.filter((candidate) => (candidate.dataset.kind || "main") === "main" && stepNumber(candidate.dataset.act) === act);
    const total = stepNumber(slide.dataset.stepTotal);
    const step = stepNumber(slide.dataset.stepCurrent);
    const progress = act >= 1 && members.length
      ? (members.indexOf(slide) + (total ? step / total : 1)) / members.length
      : 0;
    list.querySelectorAll(".route__station").forEach((station, index) => {
      const number = index + 1;
      station.dataset.state = number < current ? "past" : number === current ? "current" : "future";
      station.style.setProperty("--progress", number === current ? progress.toFixed(4) : "0");
    });
  }

  // Scene changes: each scene has its own header, so the Route would snap. On a press into the next or
  // previous scene the new header starts from the old one's picture (same act: the old underline; a new
  // act: an empty underline, or a full one going back), and the --m-route transition carries it on.
  function seedRoute(slide, previousSlide) {
    const list = slide.querySelector(":scope > .story-chrome .route");
    const previousList = previousSlide?.querySelector(":scope > .story-chrome .route");
    if (!list || !previousList) return null;
    const act = Math.max(1, stepNumber(slide.dataset.act));
    const previousAct = Math.max(1, stepNumber(previousSlide.dataset.act));
    const stations = [...list.querySelectorAll(".route__station")];
    const previousStations = [...previousList.querySelectorAll(".route__station")];
    stations.forEach((station, index) => {
      const source = previousStations[index];
      station.dataset.state = source?.dataset.state || "future";
      station.style.setProperty("--progress", source?.style.getPropertyValue("--progress") || "0");
    });
    const current = stations[act - 1];
    if (!current) return null;
    if (act !== previousAct) {
      current.dataset.state = "current";
      current.style.setProperty("--progress", act > previousAct ? "0" : "1");
    }
    const bar = current.querySelector(".route__bar");
    if (bar) void window.getComputedStyle(bar).transform;
    return act !== previousAct ? current.querySelector(".route__square") : null;
  }

  function stampRouteSquare(square) {
    if (!square) return;
    square.animate([{ transform: "scale(0.4)" }, { transform: "scale(1)" }], {
      duration: cssMilliseconds("--m-rise", 320),
      easing: easingToken("--ease-stamp", square, easeOut, "cubic-bezier(0.34, 1.4, 0.64, 1)").css,
    });
  }

  function makeContext(slide, fields) {
    return Object.freeze({
      slide,
      id: slide.id,
      motion: motionMode,
      q: (selector) => slide.querySelector(selector),
      qa: (selector) => [...slide.querySelectorAll(selector)],
      ...fields,
    });
  }

  function settleEntering(element, signal) {
    const done = () => {
      if (!signal.aborted) element.classList.remove("is-entering");
    };
    const animations = element.getAnimations({ subtree: true });
    if (!animations.length) {
      done();
      return;
    }
    Promise.all(animations.map((animation) => animation.finished)).then(done, () => undefined);
  }

  function enteringElements(slide, step) {
    return [...slide.querySelectorAll("[data-motion], [data-count]")]
      .filter((element) => revealStep(element, slide) === step && !element.closest(".is-step-hidden"));
  }

  // `data-count` (spec B.9 item 6) is an alias for data-motion="count". Every element of the step is
  // marked first, so a value can read the timing of the bar or card it labels, whatever the DOM order.
  function playEntering(slide, step, signal) {
    const entering = enteringElements(slide, step);
    entering.forEach((element) => element.classList.add("is-entering"));
    entering.forEach((element) => {
      const primitive = element.dataset.motion || "count";
      const release = () => element.classList.remove("is-entering");
      if (primitive === "count") countUp(element, { signal }).then(release);
      else if (primitive === "travel") travel(element, queryInSlide(slide, element.dataset.path), { signal }).then(release);
      else if (primitive === "draw") drawIn(element, { signal }).then(release);
      else settleEntering(element, signal);
    });
  }

  // Reduced motion reduces, it does not remove: what a press reveals fades in (opacity only, no
  // movement, no stagger), and a packet's arrival becomes a short fade-up of its target, so the cause
  // and effect of a step still reads. Nothing moves across the screen.
  function playReduced(slide, step) {
    const fadeMs = cssMilliseconds("--m-fade", 200);
    enteringElements(slide, step).forEach((element) => {
      if (element.dataset.motion === "travel") {
        const target = element.dataset.target ? queryInSlide(slide, element.dataset.target) : null;
        target?.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: fadeMs + 40, easing: "linear" });
        return;
      }
      element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: fadeMs, easing: "linear", fill: "backwards" });
    });
  }

  // Visible state is a pure function of (scene, step). Rendering the same step twice gives the
  // same picture; only a forward single press with full motion adds .is-entering.
  function renderSlide(slide, requestedStep, { direction = 0, entry = null, animate = false } = {}) {
    const total = stepTotal(slide);
    const step = Math.max(0, Math.min(total, Number.isFinite(requestedStep) ? Math.trunc(requestedStep) : total));
    const runtime = runtimeFor(slide);
    snap(slide);
    const previous = runtime.step;
    const controller = new AbortController();
    runtime.step = step;
    runtime.controller = controller;
    slide.dataset.stepCurrent = String(step);
    slide.dataset.stepTotal = String(total);
    slide.dataset.reached = Array.from({ length: step }, (_value, index) => index + 1).join(" ");
    slide.toggleAttribute("data-step-final", step === total);
    if (entry) slide.dataset.entry = entry;
    applyStepVisibility(slide, step);
    applyTravelTargets(slide, step);
    paintRoute(slide);
    const registration = registrations.get(slide.id);
    const ctx = makeContext(slide, { step, total, previous, direction, entry: slide.dataset.entry || "jump", signal: controller.signal });
    try {
      registration?.render?.(ctx);
    } catch (error) {
      console.error(`Story scene #${slide.id} render failed`, error);
    }
    if (!animate || motionMode === "static") return;
    if (motionMode === "reduced") {
      playReduced(slide, step);
      return;
    }
    playEntering(slide, step, controller.signal);
    try {
      registration?.animate?.(ctx);
    } catch (error) {
      console.error(`Story scene #${slide.id} animate failed`, error);
    }
  }

  function renderAllFinal() {
    slides.forEach((slide) => renderSlide(slide, Number.POSITIVE_INFINITY));
  }

  /* ------------------------------------------------------------------ evidence facade (spec B.10) */

  function evidenceLine(result) {
    const subject = `${result.caseId} ${result.lane}`;
    if (result.source === "live") return `LIVE · ${subject} matched sealed record · ${result.elapsedMs} ms`;
    if (result.reason === "live mismatch") return `REPLAY · ${subject} · live answer did not match the sealed record`;
    return `REPLAY · ${subject} · ${result.reason || "sealed record"}`;
  }

  function recordEvidence(result) {
    evidenceLog.unshift({
      lane: result.lane,
      caseId: result.caseId,
      source: result.source,
      matchesSealed: result.matchesSealed,
      reason: result.reason,
      elapsedMs: result.elapsedMs,
      at: Date.now(),
      text: evidenceLine(result),
    });
    evidenceLog.splice(EVIDENCE_LOG_LIMIT);
    publishState();
  }

  // Background only: the projector never waits for it and never shows its source.
  async function evidence(lane, caseId, { signal } = {}) {
    await demoReady;
    if (signal?.aborted) throw new DOMException("Request aborted", "AbortError");
    const result = await window.FoldlineDemo.evidence(lane, caseId, { signal });
    if (signal?.aborted) throw new DOMException("Request aborted", "AbortError");
    recordEvidence(result);
    return result;
  }

  function runLiveChecks(slide) {
    const runtime = runtimeFor(slide);
    runtime.evidenceController?.abort();
    runtime.evidenceController = null;
    const cases = (slide.dataset.liveCheck || "").split(/\s+/).filter(Boolean);
    if (!cases.length || motionMode === "static") return;
    const controller = new AbortController();
    runtime.evidenceController = controller;
    cases.forEach((token) => {
      const [lane, caseId] = token === "corpus" ? ["ready", "corpus"] : token.split(":");
      evidence(lane, caseId, { signal: controller.signal }).catch((error) => {
        if (error?.name !== "AbortError") console.warn(`Background evidence check ${token} on #${slide.id} failed`, error);
      });
    });
  }

  window.Story = Object.freeze({
    // Scene JS: one IIFE calling Story.register(id, { steps?, render(ctx), animate(ctx) }).
    register(sceneId, definition = {}) {
      if (typeof sceneId !== "string" || !sceneId) throw new TypeError("Story.register needs a scene id");
      if (registrations.has(sceneId)) throw new Error(`Story scene #${sceneId} is already registered`);
      ["render", "animate"].forEach((name) => {
        if (definition[name] !== undefined && typeof definition[name] !== "function") throw new TypeError(`Story.register(${sceneId}).${name} must be a function`);
      });
      registrations.set(sceneId, Object.freeze({ ...definition }));
      if (!engineReady) return;
      const slide = slides.find((candidate) => candidate.id === sceneId);
      if (!slide) {
        console.error(`Story.register: no scene #${sceneId} in the deck`);
        return;
      }
      renderSlide(slide, exportFinal ? Number.POSITIVE_INFINITY : runtimeFor(slide).step);
    },
    get motion() {
      return motionMode;
    },
    sealed,
    evidence,
    format,
    countUp,
    travel,
    chart: Object.freeze({ bars }),
  });

  let stage;
  let slides = [];
  let channel;
  let directPresenter = null;
  let expectedPresenterWindow = null;
  let presenterPairingOfferId = "";
  let presenterOfferTimers = [];
  let stateSequence = 0;
  let lastCommandSequence = 0;
  let sharedPublishChain = Promise.resolve();
  const seenCommandIds = new Set();
  const seenStateRequestIds = new Set();

  function isAllowedMessageOrigin(origin) {
    return window.location.protocol === "file:"
      ? origin === "null"
      : origin === window.location.origin;
  }

  function hasExpectedWindowPath(source, filename) {
    try {
      const sourceUrl = new URL(source.location.href);
      return sourceUrl.protocol === window.location.protocol && sourceUrl.pathname.endsWith(`/${filename}`);
    } catch (_error) {
      // Chromium can isolate file:// WindowProxy location access. The opener
      // relationship remains the authority for that opaque-origin fallback.
      return window.location.protocol === "file:";
    }
  }

  function isExpectedPresenterSource(source) {
    if (!source || source === window) return false;
    try {
      // Once P has selected a WindowProxy, a different opener child cannot claim it.
      const expectedSource = expectedPresenterWindow
        ? source === expectedPresenterWindow
        : source.opener === window;
      return expectedSource && hasExpectedWindowPath(source, "presenter.html");
    } catch (_error) {
      return false;
    }
  }

  function presenterDocument(source) {
    try {
      return source.document;
    } catch (_error) {
      return null;
    }
  }

  function releaseNavigatedPresenter() {
    if (!directPresenter?.document) return false;
    const currentDocument = presenterDocument(directPresenter.source);
    if (!currentDocument || currentDocument === directPresenter.document) return false;
    // Reloads retain the WindowProxy but replace its browser-owned Document.
    // Rearm from that local navigation evidence, never from an init message.
    expectedPresenterWindow = directPresenter.source;
    directPresenter = null;
    document.documentElement.dataset.presenterChannel = "pending";
    return true;
  }

  function targetOriginFor(origin) {
    // file:// messages have an opaque `null` origin and therefore cannot use
    // a literal origin target. Source, path, channel and challenge checks stay mandatory.
    return window.location.protocol === "file:" ? "*" : origin;
  }

  function postWindowEnvelope(peer, type, fields = {}) {
    if (!peer?.source || peer.source.closed) return;
    try {
      peer.source.postMessage({
        protocol: WINDOW_PROTOCOL,
        type,
        channelId: peer.channelId,
        timestamp: Date.now(),
        ...fields,
      }, targetOriginFor(peer.origin));
    } catch (_error) {
      // BroadcastChannel and storage remain available when a window closes.
    }
  }

  function clearPresenterOffers() {
    presenterOfferTimers.forEach((timer) => window.clearTimeout(timer));
    presenterOfferTimers = [];
  }

  function sendPresenterPairingOffer() {
    if (releaseNavigatedPresenter()) offerPresenterPairing();
    if (!expectedPresenterWindow || expectedPresenterWindow.closed || directPresenter?.authenticated) return;
    try {
      expectedPresenterWindow.postMessage({
        protocol: WINDOW_PROTOCOL,
        type: "pairing-offer",
        offerId: presenterPairingOfferId,
        timestamp: Date.now(),
      }, targetOriginFor(window.location.origin));
    } catch (_error) {
      // A loading or closed popup will be retried by the bounded offer schedule.
    }
  }

  function offerPresenterPairing() {
    presenterPairingOfferId = createChannelId();
    clearPresenterOffers();
    [0, 100, 250, 500, 1000, 2000, 3500].forEach((delay) => {
      presenterOfferTimers.push(window.setTimeout(sendPresenterPairingOffer, delay));
    });
  }

  function installPresenterWindowTracking() {
    const nativeOpen = window.open;
    window.open = function trackedWindowOpen(url, target, features) {
      // P again with a paired, open console brings it to the front instead of reloading it.
      if (target === "esg-presenter" && directPresenter?.authenticated && directPresenter.source
        && !directPresenter.source.closed && presenterDocument(directPresenter.source) === directPresenter.document) {
        try {
          directPresenter.source.focus();
          return directPresenter.source;
        } catch (_error) {
          // Fall through to a fresh open when the window cannot be focused.
        }
      }
      // Opaque file origins cannot expose a replaced Document. A fresh local
      // console avoids an old document claiming a new offer before navigation;
      // HTTP(S) keeps the familiar named-window reuse and automatic refresh.
      const windowTarget = window.location.protocol === "file:" && target === "esg-presenter"
        ? `esg-presenter-${createChannelId()}`
        : target;
      const opened = Reflect.apply(nativeOpen, window, [url, windowTarget, features]);
      try {
        const targetUrl = new URL(String(url), window.location.href);
        if (opened && target === "esg-presenter" && targetUrl.pathname.endsWith("/presenter.html")) {
          expectedPresenterWindow = opened;
          // P is a local user action: it navigates the named HTTP window or
          // selects a fresh file window, then rearms only that exact peer.
          directPresenter = null;
          offerPresenterPairing();
        }
      } catch (_error) {
        // Preserve native window.open behavior for unrelated or malformed URLs.
      }
      return opened;
    };
  }

  function postAuthenticatedPayload(payload) {
    if (!directPresenter?.authenticated) return;
    postWindowEnvelope(directPresenter, "payload", { payload });
  }

  function handleWindowMessage(event) {
    if (!isAllowedMessageOrigin(event.origin)) return;
    if (directPresenter) {
      if (event.source !== directPresenter.source || event.origin !== directPresenter.origin) return;
      if (releaseNavigatedPresenter()) offerPresenterPairing();
    }
    if (!directPresenter && !isExpectedPresenterSource(event.source)) return;
    const envelope = event.data;
    if (!envelope
      || envelope.protocol !== WINDOW_PROTOCOL
      || !WINDOW_CHANNEL_PATTERN.test(String(envelope.channelId || ""))
      || !Number.isFinite(envelope.timestamp)
      || Math.abs(Date.now() - envelope.timestamp) > 15000) return;

    if (!directPresenter) {
      if (envelope.type !== "handshake-init") return;
      // Named-window ownership is proved with the latest locally issued offer,
      // even when the selected presenter also happens to have this deck as opener.
      if (expectedPresenterWindow && (!WINDOW_CHANNEL_PATTERN.test(presenterPairingOfferId)
        || envelope.offerId !== presenterPairingOfferId)) return;
      directPresenter = {
        source: event.source,
        document: presenterDocument(event.source),
        origin: event.origin,
        channelId: envelope.channelId,
        challenge: createChannelId(),
        phase: "waiting-response",
        authenticated: false,
      };
      document.documentElement.dataset.presenterChannel = "challenged";
      postWindowEnvelope(directPresenter, "handshake-challenge", { challenge: directPresenter.challenge });
      return;
    }

    if (envelope.channelId !== directPresenter.channelId) return;
    // During pagehide the exact, already bound WindowProxy may temporarily hide
    // its location. It can relinquish that channel, but cannot use this exception
    // to authenticate or send commands from another document/path.
    if (envelope.type !== "disconnect" && !hasExpectedWindowPath(event.source, "presenter.html")) return;

    // The local phase determines the only permitted transition. A replayed init
    // cannot replace a pending challenge or an established shared key.
    if (directPresenter.phase === "waiting-response") {
      if (envelope.type !== "handshake-response" || envelope.challenge !== directPresenter.challenge) return;
      rotateSharedAuthentication();
      lastCommandSequence = 0;
      directPresenter.phase = "authenticated";
      directPresenter.authenticated = true;
      clearPresenterOffers();
      document.documentElement.dataset.presenterChannel = "authenticated";
      postWindowEnvelope(directPresenter, "handshake-ack", {
        challenge: directPresenter.challenge,
        sharedSecret: sharedAuthSecret,
      });
      publishState();
      return;
    }

    if (directPresenter.phase !== "authenticated" || !directPresenter.authenticated) return;
    if (envelope.type === "disconnect") {
      // A paired document relinquishes its channel on pagehide. Its replacement
      // must prove a fresh offer; arbitrary init/challenge replays never reset it.
      expectedPresenterWindow = directPresenter.source;
      directPresenter = null;
      document.documentElement.dataset.presenterChannel = "pending";
      offerPresenterPairing();
      return;
    }
    if (envelope.type !== "payload") return;
    const message = envelope.payload;
    if (message?.type === "request-state") publishState();
    else relayCommand(message);
  }

  function currentState() {
    const slide = stage?.currentSlide;
    if (!slide) return null;
    const index = slides.indexOf(slide);
    const next = slides[index + 1] || null;
    const mainSlides = slides.filter((candidate) => (candidate.dataset.kind || "main") === "main");
    const mainIndex = mainSlides.indexOf(slide);
    const startBudgetSeconds = mainIndex >= 0
      ? mainSlides.slice(0, mainIndex).reduce((sum, candidate) => sum + Number(candidate.dataset.seconds || 0), 0)
      : mainSlides.reduce((sum, candidate) => sum + Number(candidate.dataset.seconds || 0), 0);
    const seconds = Number(slide.dataset.seconds || 0);
    const step = stepNumber(slide.dataset.stepCurrent);
    const total = stepNumber(slide.dataset.stepTotal);
    const mode = window.FoldlineDemo?.mode || "replay";
    const status = window.FoldlineDemo?.statusDetail || (window.FoldlineDemo ? "Initializing" : "Static deck · no live checks");
    // In an appendix: the scene Esc returns to, or null when the appendix was opened directly.
    const returnSlide = (slide.dataset.kind || "main") === "appendix" ? stage?.appendixReturnSlide || null : undefined;
    const appendixReturn = returnSlide === undefined ? undefined
      : returnSlide ? { sceneId: returnSlide.id, label: returnSlide.dataset.label || returnSlide.id } : null;
    return {
      type: "state",
      syncSessionId,
      sequence: ++stateSequence,
      timestamp: Date.now(),
      sceneId: slide.id,
      label: slide.dataset.label,
      section: slide.dataset.section,
      kind: slide.dataset.kind || "main",
      index,
      total: slides.length,
      mainIndex,
      mainTotal: mainSlides.length,
      fragmentIndex: step,
      fragmentTotal: total,
      step,
      stepTotal: total,
      interactionProgress: null,
      seconds,
      startBudgetSeconds,
      endBudgetSeconds: startBudgetSeconds + seconds,
      noteKey: slide.dataset.noteKey || slide.id,
      note: slide.dataset.note || "No presenter note for this scene.",
      next: next ? { sceneId: next.id, label: next.dataset.label, kind: next.dataset.kind || "main" } : null,
      appendixReturn,
      runtimeMode: mode,
      motionMode,
      runtimeStatus: evidenceLog[0] ? `${status} · ${evidenceLog[0].text}` : status,
      evidence: {
        mode,
        status,
        recent: evidenceLog.slice(),
        bindingMismatches: bindingMismatches.slice(),
      },
      scenes: slides.map((candidate) => ({
        sceneId: candidate.id,
        label: candidate.dataset.label,
        kind: candidate.dataset.kind || "main",
        seconds: Number(candidate.dataset.seconds || 0),
      })),
    };
  }

  function publishState() {
    const state = currentState();
    if (!state) return;
    postAuthenticatedPayload(state);
    sharedPublishChain = sharedPublishChain.then(() => publishSharedState(state)).catch(() => undefined);
  }

  // The console asks for state every second over two paths. Every answer is broadcast, but the stored
  // copy (read once when a console pairs) is only rewritten when what it shows has changed.
  let storedStateSignature = "";

  async function publishSharedState(state) {
    const envelope = await signSharedEnvelope("state", state);
    if (!envelope) return;
    channel?.postMessage(envelope);
    const signature = JSON.stringify({ ...state, sequence: 0, timestamp: 0 });
    if (channel && signature === storedStateSignature) return;
    try {
      window.localStorage.setItem(STATE_KEY, JSON.stringify(envelope));
      storedStateSignature = signature;
    } catch (_error) {
      // Direct authenticated window messaging remains available.
    }
  }

  function validStateRequest(message) {
    const valid = Boolean(message
      && message.type === "request-state"
      && message.syncSessionId === syncSessionId
      && typeof message.requestId === "string"
      && WINDOW_CHANNEL_PATTERN.test(message.requestId)
      && Number.isFinite(message.timestamp)
      && Math.abs(Date.now() - message.timestamp) <= 15000);
    if (!valid || seenStateRequestIds.has(message.requestId)) return false;
    seenStateRequestIds.add(message.requestId);
    window.setTimeout(() => seenStateRequestIds.delete(message.requestId), 30000);
    return true;
  }

  async function acceptSharedMessage(envelope) {
    const peer = directPresenter;
    if (!peer?.authenticated
      || !await verifySharedEnvelope(envelope, new Set(["command", "request-state"]))
      || directPresenter !== peer || !peer.authenticated) return;
    if (envelope.kind === "request-state") {
      if (validStateRequest(envelope.payload)) publishState();
      return;
    }
    relayCommand(envelope.payload);
  }

  function relayCommand(message) {
    if (!message
      || message.type !== "command"
      || message.syncSessionId !== syncSessionId
      || !ALLOWED_PRESENTER_COMMANDS.has(message.command)
      || typeof message.commandId !== "string"
      || !WINDOW_CHANNEL_PATTERN.test(message.commandId)
      || !Number.isInteger(message.sequence)
      || message.sequence <= lastCommandSequence
      || !Number.isFinite(message.timestamp)
      || Math.abs(Date.now() - message.timestamp) > 15000) return;
    if (message.command === "goto" && !slides.some((slide) => slide.id === message.sceneId)) return;
    if (seenCommandIds.has(message.commandId)) return;
    lastCommandSequence = message.sequence;
    seenCommandIds.add(message.commandId);
    window.setTimeout(() => seenCommandIds.delete(message.commandId), 30000);
    window.dispatchEvent(new CustomEvent("deckcommand", { detail: message }));
  }

  // A reloaded deck has a new session and a new key, so an open presenter would otherwise keep
  // showing CONNECTED while its commands are dropped until the heartbeat times out. The notice is
  // unsigned and carries no state: it only tells the presenter to re-run the window handshake.
  function announceDeckStarted() {
    const notice = { type: "deck-started", syncSessionId, timestamp: Date.now() };
    channel?.postMessage(notice);
    try {
      window.localStorage.setItem(DECK_STARTED_KEY, JSON.stringify(notice));
    } catch (_error) {
      // The presenter heartbeat still re-pairs within its timeout.
    }
  }

  function initSync() {
    installPresenterWindowTracking();
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.addEventListener("message", (event) => { void acceptSharedMessage(event.data); });
    }
    window.addEventListener("storage", (event) => {
      if (event.key !== COMMAND_KEY || !event.newValue) return;
      try { void acceptSharedMessage(JSON.parse(event.newValue)); } catch (_error) { /* ignore malformed external commands */ }
    });
    window.addEventListener("message", handleWindowMessage);
    announceDeckStarted();
  }

  function wireStage() {
    // No interlocks: every press is a step. Inside a scene the engine moves one step; at either end
    // the stage changes scene.
    stage.addEventListener("fragmentrequest", (event) => {
      const slide = event.detail.slide;
      if (!slide) return;
      // A static export shows every scene at its final step; a press only changes scene.
      if (motionMode === "static") return;
      const runtime = runtimeFor(slide);
      const total = stepTotal(slide);
      if (event.detail.direction > 0 && runtime.step < total) {
        renderSlide(slide, runtime.step + 1, { direction: 1, animate: true });
      } else if (event.detail.direction < 0 && runtime.step > 0) {
        renderSlide(slide, runtime.step - 1, { direction: -1 });
      } else {
        snap(slide);
        return;
      }
      event.detail.handled = true;
      stage.syncHash();
      publishState();
    });

    const resetStep = () => (motionMode === "static" ? Number.POSITIVE_INFINITY : 0);

    stage.addEventListener("fragmentreset", (event) => {
      renderSlide(event.detail.slide, resetStep(), { entry: "jump" });
      stage.syncHash();
      publishState();
    });

    stage.addEventListener("deckreset", () => {
      slides.forEach((slide) => renderSlide(slide, resetStep(), { entry: "jump" }));
      stage.syncHash();
      publishState();
    });

    stage.addEventListener("slidechange", (event) => {
      const { slide, previousSlide } = event.detail;
      const entry = event.detail.entry || "jump";
      if (previousSlide && previousSlide !== slide) {
        snap(previousSlide);
        runtimeFor(previousSlide).evidenceController?.abort();
      }
      const pressed = entry === "forward" || entry === "backward";
      const newStation = motionMode === "full" && pressed && previousSlide && previousSlide !== slide
        ? seedRoute(slide, previousSlide)
        : null;
      if (motionMode === "static") {
        renderSlide(slide, Number.POSITIVE_INFINITY, { entry });
      } else {
        const requested = entry === "backward" ? Number.POSITIVE_INFINITY : entry === "forward" ? 0 : (event.detail.step ?? 0);
        renderSlide(slide, requested, {
          direction: entry === "forward" ? 1 : entry === "backward" ? -1 : 0,
          entry,
          animate: entry === "forward",
        });
      }
      stampRouteSquare(newStation);
      stage.syncHash();
      if (slide.dataset.kind === "appendix") paintRoute(slide);
      runLiveChecks(slide);
      publishState();
    });
  }

  function applyMotionMode() {
    const next = detectMotion();
    document.documentElement.dataset.motion = next;
    if (next === motionMode) return;
    motionMode = next;
    slides.forEach((slide) => snap(slide));
  }

  function wireMotion() {
    reducedMotionQuery?.addEventListener?.("change", () => {
      applyMotionMode();
      publishState();
    });
    // Print renders every scene at its final step, exactly like ?export=final, then restores the
    // live step of each scene.
    window.addEventListener("beforeprint", () => {
      if (printing) return;
      printing = true;
      liveStepsBeforePrint = new Map(slides.map((slide) => [slide, runtimeFor(slide).step]));
      document.documentElement.dataset.export = "final";
      applyMotionMode();
      renderAllFinal();
    });
    window.addEventListener("afterprint", () => {
      if (!printing) return;
      printing = false;
      if (!exportFinal) delete document.documentElement.dataset.export;
      applyMotionMode();
      if (!exportFinal) liveStepsBeforePrint?.forEach((step, slide) => renderSlide(slide, step));
      liveStepsBeforePrint = null;
      stage.syncHash();
    });
  }

  async function initialize() {
    stage = document.getElementById("stage");
    // The stage picks its first scene on DOMContentLoaded; make sure it has, whatever the listener order.
    stage?.boot?.();
    slides = stage ? [...stage.querySelectorAll("section.slide")] : [];
    if (!slides.length || typeof stage.syncHash !== "function") {
      console.error("Story: <deck-stage id=\"stage\"> with scene sections is required");
      return;
    }
    registrations.forEach((_definition, sceneId) => {
      if (!slides.some((slide) => slide.id === sceneId)) console.error(`Story.register: no scene #${sceneId} in the deck`);
    });
    slides.forEach((slide) => {
      slide.querySelectorAll('[aria-hidden="true"]').forEach((element) => authoredAriaHidden.add(element));
      buildChrome(slide);
    });
    checkEvidenceBindings(stage);
    if (exportFinal) document.documentElement.dataset.export = "final";
    motionMode = detectMotion();
    document.documentElement.dataset.motion = motionMode;
    const current = stage.currentSlide;
    slides.forEach((slide) => {
      const step = motionMode === "static"
        ? Number.POSITIVE_INFINITY
        : slide === current ? stepNumber(slide.dataset.stepCurrent) : 0;
      renderSlide(slide, step, { entry: "jump" });
    });
    engineReady = true;
    document.documentElement.dataset.story = "ready";
    stage.syncHash();
    initSync();
    wireStage();
    wireMotion();
    // The evidence adapter (lib/demo-adapter.js) is optional: a deck without data-live-check scenes
    // does not load it.
    window.FoldlineDemo?.addEventListener("modechange", () => publishState());
    demoReady = window.FoldlineDemo ? window.FoldlineDemo.initialize().then(() => undefined, (error) => {
      console.error("Evidence adapter failed to initialize", error);
    }) : Promise.resolve();
    if (current) runLiveChecks(current);
    publishState();
    await demoReady;
    publishState();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
