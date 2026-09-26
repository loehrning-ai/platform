(() => {
  const CHANNEL_NAME = "esg-deck:v1";
  const STATE_KEY = "esg-deck:presenter-state:v1";
  const COMMAND_KEY = "esg-deck:presenter-command:v1";
  const DECK_STARTED_KEY = "esg-deck:deck-started:v1";
  const TIMER_KEY = "esg-deck:timer:v1";
  const WINDOW_PROTOCOL = "esg-deck:window:v1";
  const SHARED_PROTOCOL = "esg-deck:shared-auth:v1";
  const WINDOW_CHANNEL_PATTERN = /^[A-Za-z0-9._~-]{16,160}$/;
  const SHARED_SECRET_PATTERN = /^[A-Za-z0-9_-]{43}$/;
  const HEARTBEAT_INTERVAL_MS = 1000;
  const HEARTBEAT_TIMEOUT_MS = 3500;

  function bytesToBase64Url(bytes) {
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
    if (!globalThis.crypto?.getRandomValues) return "";
    return bytesToBase64Url(globalThis.crypto.getRandomValues(new Uint8Array(24)));
  }

  async function importSharedAuthKey(secret) {
    if (!SHARED_SECRET_PATTERN.test(String(secret || "")) || !globalThis.crypto?.subtle) return null;
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
    const key = sharedAuthKey;
    if (!key) return null;
    const body = { protocol: SHARED_PROTOCOL, kind, payload };
    const signature = await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(JSON.stringify(body)));
    if (key !== sharedAuthKey) return null;
    return { ...body, signature: bytesToBase64Url(new Uint8Array(signature)) };
  }

  async function verifySharedEnvelope(envelope, expectedKind) {
    const key = sharedAuthKey;
    if (!key
      || !envelope
      || envelope.protocol !== SHARED_PROTOCOL
      || envelope.kind !== expectedKind
      || typeof envelope.signature !== "string") return false;
    try {
      const verified = await globalThis.crypto.subtle.verify(
        "HMAC",
        key,
        base64UrlBytes(envelope.signature),
        new TextEncoder().encode(signedBody(envelope)),
      );
      return verified && key === sharedAuthKey;
    } catch (_error) {
      return false;
    }
  }

  const nodes = {};
  let channel = null;
  let state = null;
  let sharedAuthKey = null;
  let activeSyncSessionId = "";
  let commandSequence = 0;
  let sharedPublishChain = Promise.resolve();
  let directDeck = window.opener ? {
    source: window.opener,
    origin: window.location.origin,
    channelId: createChannelId(),
    challenge: null,
    offerId: null,
    phase: "waiting-challenge",
    authenticated: false,
  } : null;
  let manifestSignature = "";
  let lastStateSignature = "";
  let lastStateSequence = 0;
  let lastLiveStateAt = 0;
  let connectionStatus = "";
  let timerState = readTimer();
  let selectDirty = false;
  const NOTE_OPEN_KEY = "esg-deck:presenter-note-open:v1";

  function byId(id) { return document.getElementById(id); }

  function isAllowedMessageOrigin(origin) {
    return window.location.protocol === "file:"
      ? origin === "null"
      : origin === window.location.origin;
  }

  function hasExpectedDeckPath(source) {
    try {
      const sourceUrl = new URL(source.location.href);
      return sourceUrl.protocol === window.location.protocol && sourceUrl.pathname.endsWith("/slides.html");
    } catch (_error) {
      // A local file opener can expose only a restricted WindowProxy. The
      // exact opener reference, opaque origin and channel proof remain required.
      return window.location.protocol === "file:";
    }
  }

  function isExpectedDeckSource(source) {
    return Boolean(directDeck && source === directDeck.source && hasExpectedDeckPath(source));
  }

  function targetOriginFor(origin) {
    // file:// has an opaque `null` origin; the authenticated source and
    // challenge-bound channel constrain this required wildcard fallback.
    return window.location.protocol === "file:" ? "*" : origin;
  }

  function postWindowEnvelope(type, fields = {}) {
    if (!directDeck?.source || directDeck.source.closed) return;
    try {
      directDeck.source.postMessage({
        protocol: WINDOW_PROTOCOL,
        type,
        channelId: directDeck.channelId,
        timestamp: Date.now(),
        ...fields,
      }, targetOriginFor(directDeck.origin));
    } catch (_error) {
      // BroadcastChannel and storage remain available when the opener closes.
    }
  }

  function beginWindowHandshake() {
    if (!directDeck || directDeck.phase !== "waiting-challenge") return;
    document.documentElement.dataset.windowChannel = "pending";
    postWindowEnvelope("handshake-init", { offerId: directDeck.offerId });
  }

  function acceptPairingOffer(event) {
    // This is only an unprivileged named-window bootstrap. The offered source is
    // bound before any challenge/key is accepted, and the deck must subsequently
    // verify this exact presenter WindowProxy and the echoed offer nonce.
    if (directDeck && directDeck.phase !== "waiting-challenge") return;
    const envelope = event.data;
    if (!envelope || envelope.protocol !== WINDOW_PROTOCOL
      || envelope.type !== "pairing-offer"
      || !WINDOW_CHANNEL_PATTERN.test(String(envelope.offerId || ""))
      || !Number.isFinite(envelope.timestamp)
      || Math.abs(Date.now() - envelope.timestamp) > 15000) return;
    if (directDeck?.source === event.source && directDeck.offerId === envelope.offerId) return;
    directDeck = {
      source: event.source,
      origin: event.origin,
      channelId: createChannelId(),
      challenge: null,
      offerId: envelope.offerId,
      phase: "waiting-challenge",
      authenticated: false,
    };
    beginWindowHandshake();
  }

  async function handleWindowMessage(event) {
    if (!isAllowedMessageOrigin(event.origin) || !event.source || event.source === window
      || !hasExpectedDeckPath(event.source)) return;
    acceptPairingOffer(event);
    // All authentication-bearing envelopes require the already bound exact peer.
    if (!directDeck || !isExpectedDeckSource(event.source) || event.origin !== directDeck.origin) return;
    const envelope = event.data;
    if (!envelope
      || envelope.protocol !== WINDOW_PROTOCOL
      || envelope.channelId !== directDeck.channelId
      || !Number.isFinite(envelope.timestamp)
      || Math.abs(Date.now() - envelope.timestamp) > 15000) return;
    if (directDeck.phase === "waiting-challenge") {
      if (envelope.type !== "handshake-challenge"
        || !WINDOW_CHANNEL_PATTERN.test(String(envelope.challenge || ""))) return;
      directDeck.challenge = envelope.challenge;
      directDeck.phase = "waiting-ack";
      postWindowEnvelope("handshake-response", { challenge: directDeck.challenge });
      return;
    }

    if (directDeck.phase === "waiting-ack") {
      if (envelope.type !== "handshake-ack" || !directDeck.challenge
        || envelope.challenge !== directDeck.challenge
        || !SHARED_SECRET_PATTERN.test(String(envelope.sharedSecret || ""))) return;
      const acknowledgedPeer = directDeck;
      acknowledgedPeer.phase = "importing-key";
      const importedKey = await importSharedAuthKey(envelope.sharedSecret);
      if (directDeck !== acknowledgedPeer || acknowledgedPeer.phase !== "importing-key") return;
      if (!importedKey) {
        acknowledgedPeer.phase = "waiting-ack";
        return;
      }
      sharedAuthKey = importedKey;
      directDeck.phase = "authenticated";
      directDeck.authenticated = true;
      activeSyncSessionId = "";
      commandSequence = 0;
      lastStateSequence = 0;
      lastStateSignature = "";
      document.documentElement.dataset.windowChannel = "authenticated";
      setDeckControlAvailability();
      void readStoredState();
      postWindowEnvelope("payload", { payload: { type: "request-state", timestamp: Date.now(), syncSessionId: activeSyncSessionId } });
      return;
    }

    if (directDeck.phase !== "authenticated" || !directDeck.authenticated || envelope.type !== "payload") return;
    renderState(envelope.payload, { authenticated: true });
  }

  function readTimer() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(TIMER_KEY));
      if (parsed && Number.isFinite(parsed.accumulatedMs)) return parsed;
    } catch (_error) {
      // Start from a clean local timer.
    }
    return { accumulatedMs: 0, startedAt: null, running: false };
  }

  function writeTimer() {
    try { window.localStorage.setItem(TIMER_KEY, JSON.stringify(timerState)); } catch (_error) { /* in-memory timer remains */ }
  }

  function elapsedMs() {
    return timerState.accumulatedMs + (timerState.running && timerState.startedAt ? Date.now() - timerState.startedAt : 0);
  }

  function formatTime(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function formatBudget(total) {
    const totalSeconds = Math.round(Number(total || 0));
    return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
  }

  function timerStarted() {
    return timerState.running || timerState.accumulatedMs > 0;
  }

  function startTimer() {
    if (timerState.running) return;
    timerState.startedAt = Date.now();
    timerState.running = true;
    writeTimer();
    renderClock();
  }

  function toggleTimer() {
    if (timerState.running) {
      timerState.accumulatedMs = elapsedMs();
      timerState.startedAt = null;
      timerState.running = false;
      writeTimer();
      renderClock();
    } else {
      startTimer();
    }
  }

  function resetTimer() {
    timerState = { accumulatedMs: 0, startedAt: null, running: false };
    writeTimer();
    renderClock();
    announce("Workshop clock reset to 00:00.");
  }

  // The clock target is the sum of the main scenes' data-seconds, as the deck reports them, so the
  // bar and the "target" label never drift from the deck. 75:00 is only the pre-pairing fallback.
  const FALLBACK_TARGET_SECONDS = 75 * 60;
  function workshopTargetSeconds() {
    const total = (state?.scenes || []).filter((scene) => scene.kind === "main").reduce((sum, scene) => sum + (Number(scene.seconds) || 0), 0);
    return total > 0 ? total : FALLBACK_TARGET_SECONDS;
  }
  const PACE_TOLERANCE_SECONDS = 30;

  function setText(node, text) {
    if (node && node.textContent !== text) node.textContent = text;
  }

  function setPace(pace, text) {
    if (nodes.paceState.dataset.pace !== pace) nodes.paceState.dataset.pace = pace;
    setText(nodes.paceState, text);
  }

  // A big clock, one pace pill (early, on time, behind) against the locked scene window, and a thin
  // 75-minute bar with the scene window marked. Behind shows the scene's cut instruction.
  function renderClock() {
    const elapsed = elapsedMs();
    const started = timerStarted();
    const timerState_ = started ? timerState.running ? "running" : "paused" : "not-started";
    if (nodes.timer.dataset.state !== timerState_) nodes.timer.dataset.state = timerState_;
    setText(nodes.timer, started ? formatTime(elapsed) : "00:00");
    setText(nodes.timerToggle, timerState.running ? "Pause" : started ? "Resume" : "Start clock");
    const elapsedSeconds = elapsed / 1000;
    const WORKSHOP_TARGET_SECONDS = workshopTargetSeconds();
    setText(nodes.clockTarget, `target ${formatBudget(WORKSHOP_TARGET_SECONDS)}`);
    nodes.clockFill.style.transform = `scaleX(${Math.min(1, elapsedSeconds / WORKSHOP_TARGET_SECONDS).toFixed(4)})`;
    const main = state?.kind === "main";
    const start = main ? Number(state.startBudgetSeconds) || 0 : 0;
    const end = main ? Number(state.endBudgetSeconds) || 0 : 0;
    nodes.clockWindow.hidden = !main;
    if (main) {
      nodes.clockWindow.style.left = `${(start / WORKSHOP_TARGET_SECONDS) * 100}%`;
      nodes.clockWindow.style.width = `${Math.max(0.6, ((end - start) / WORKSHOP_TARGET_SECONDS) * 100)}%`;
    }
    let cut = "";
    if (!started) {
      setPace("not-started", state && !(state.sceneId === "cover" && state.fragmentIndex === 0) ? "CLOCK NOT STARTED" : "Press Start clock on your first word");
    } else if (!state) {
      setPace("idle", "No scene state");
    } else if (!main) {
      setPace("idle", "Appendix · off clock");
    } else if (elapsedSeconds < start - PACE_TOLERANCE_SECONDS) {
      setPace("early", `EARLY · ${formatBudget(start - elapsedSeconds)}`);
    } else if (elapsedSeconds > end + PACE_TOLERANCE_SECONDS) {
      setPace("behind", `BEHIND · ${formatBudget(elapsedSeconds - end)}`);
      cut = window.FOLDLINE_PRESENTER_NOTES?.[state.noteKey]?.cut || "";
    } else {
      setPace("on-time", `ON TIME · ${formatBudget(Math.max(0, end - elapsedSeconds))} left`);
    }
    nodes.paceCut.hidden = !cut;
    setText(nodes.paceCut, cut ? `Cut: ${cut}` : "");
  }

  function sceneNumber(scene, mainNumber, appendixNumber) {
    return scene.kind === "appendix" ? `A${appendixNumber}` : String(mainNumber).padStart(2, "0");
  }

  function populateSceneSelect(scenes) {
    const signature = JSON.stringify((scenes || []).map((scene) => [scene.sceneId, scene.label, scene.kind]));
    if (!scenes?.length || signature === manifestSignature) return;
    manifestSignature = signature;
    nodes.sceneSelect.replaceChildren();
    const mainGroup = document.createElement("optgroup");
    mainGroup.label = "Main path";
    const appendixGroup = document.createElement("optgroup");
    appendixGroup.label = "Appendix (Q&A)";
    let mainNumber = 0;
    let appendixNumber = 0;
    scenes.forEach((scene) => {
      const option = document.createElement("option");
      option.value = scene.sceneId;
      const appendix = scene.kind === "appendix";
      option.textContent = `${sceneNumber(scene, appendix ? mainNumber : ++mainNumber, appendix ? ++appendixNumber : appendixNumber)} · ${scene.label || scene.sceneId}`;
      (appendix ? appendixGroup : mainGroup).appendChild(option);
    });
    nodes.sceneSelect.append(mainGroup);
    if (appendixGroup.children.length) nodes.sceneSelect.append(appendixGroup);
    selectDirty = false;
  }

  function spokenLines(lines) {
    let insideSources = false;
    return (lines || []).flatMap((line) => String(line).split(/\r?\n/)).filter((line) => {
      const value = String(line).trim();
      if (value === "[Sources]") {
        insideSources = true;
        return false;
      }
      if (value === "[/Sources]") {
        insideSources = false;
        return false;
      }
      return Boolean(value) && !insideSources;
    });
  }

  // say[] entries become separate note lines. Must-say lines lead; cues and spoken lines keep their authored
  // order; if-asked, vocabulary and source-path lines are muted; a multi-line entry (verbatim SQL) collapses.
  const NOTE_MUST = /^(Must say|Say once|Say aloud)/i;
  const NOTE_CUE = /^(Presenter cue|Before (each of )?press|On press|Act bridge|Callback|Let the room)/i;
  const NOTE_DETAIL = /^(If asked|Evidence levels?|Keep the|Cause source|Arithmetic|Verbatim|Search path)/i;
  const VOTE_CUE = /\b(hands?|vote|split)\b/i;

  // The presses a say[] line belongs to. The notes' sayAt map is authoritative; otherwise the line's own
  // wording decides ("On press 3", "Before press 3", "on the last press", "at 65:00"). Untagged lines
  // stay in the full note.
  function stepsForLine(text, index, richNote, total) {
    const authored = richNote?.sayAt?.[String(index)];
    if (Array.isArray(authored)) return authored.filter((step) => Number.isInteger(step));
    const steps = new Set();
    const value = String(text);
    const order = richNote?.revealOrder || [];
    if (/\b(?:on|at) the last press\b/i.test(value)) steps.add(total);
    const each = value.match(/\bbefore each of presses (\d+)\s*[\u2013-]\s*(\d+)/i);
    if (each) for (let step = Number(each[1]); step <= Number(each[2]); step += 1) steps.add(step - 1);
    const span = value.match(/\(press(?:es)? (\d+)\s*[\u2013-]\s*(\d+)\)/i);
    if (span) for (let step = Number(span[1]); step <= Number(span[2]); step += 1) steps.add(step);
    for (const match of value.matchAll(/\bbefore press (\d+)\b/gi)) steps.add(Number(match[1]) - 1);
    for (const match of value.matchAll(/\b(?:on|at|after) press (\d+)\b/gi)) steps.add(Number(match[1]));
    for (const match of value.matchAll(/\bat (\d{2}:\d{2})\b/g)) {
      const step = order.findIndex((line) => String(line).startsWith(match[1]));
      if (step >= 0) steps.add(step);
    }
    return [...steps].filter((step) => step >= 0 && step <= total);
  }

  function noteEntries(richNote, total) {
    return (richNote?.say || []).flatMap((entry, index) => {
      const kept = spokenLines([entry]);
      if (!kept.length) return [];
      if (kept.length > 1) return [{ kind: "block", head: kept[0].trim(), body: kept.slice(1).join("\n"), steps: [], index }];
      const text = kept[0].trim();
      const kind = NOTE_MUST.test(text) ? "must" : NOTE_CUE.test(text) ? "cue" : NOTE_DETAIL.test(text) ? "detail" : "say";
      let steps = stepsForLine(text, index, richNote, total);
      // A single-view page (appendix) has only its entry: every spoken line belongs to it.
      if (!steps.length && total === 0 && kind !== "detail") steps = [0];
      // An untagged opening cue belongs to scene entry, or to the scene's room vote when it is about hands.
      if (!steps.length && kind === "cue") {
        const votes = (richNote?.ask || []).filter((item) => !item.aloud && Number.isInteger(item.at)).map((item) => item.at);
        steps = VOTE_CUE.test(text) && votes.length ? votes : [0];
      }
      return [{ kind, text, steps, index }];
    });
  }

  // The hero keeps the spoken part; a trailing technical reference stays in the full note.
  function heroText(text) {
    return String(text).split(/\s+Technical reference for Q&A:/)[0];
  }

  function noteParagraph(entry, className) {
    const paragraph = document.createElement("p");
    paragraph.className = `note-line note-line--${entry.kind}${className ? ` ${className}` : ""}`;
    paragraph.textContent = entry.text;
    return paragraph;
  }

  // [0, 1, 2, 5] → "entry to press 2 · press 5"
  function pressRangeLabel(steps) {
    const name = (value) => (value === 0 ? "entry" : `press ${value}`);
    const sorted = [...new Set(steps)].sort((a, b) => a - b);
    const ranges = [];
    sorted.forEach((value) => {
      const last = ranges[ranges.length - 1];
      if (last && value === last[1] + 1) last[1] = value;
      else ranges.push([value, value]);
    });
    return ranges.map(([from, to]) => (from === to ? name(from) : from === 0 ? `entry to press ${to}` : `presses ${from} to ${to}`)).join(" · ");
  }

  function renderSpeakerNote(richNote, step, total) {
    const root = nodes.speakerNote;
    root.replaceChildren();
    const entries = noteEntries(richNote, total);
    if (!entries.length) {
      root.textContent = state.note || "·";
      return;
    }
    const rank = (entry) => (entry.kind === "must" && !entry.steps.length ? 0 : entry.kind === "detail" || entry.kind === "block" ? 2 : 1);
    [...entries].sort((a, b) => rank(a) - rank(b) || a.index - b.index).forEach((entry) => {
      if (entry.kind === "block") {
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        const pre = document.createElement("pre");
        summary.textContent = entry.head;
        pre.textContent = entry.body;
        details.append(summary, pre);
        root.appendChild(details);
        return;
      }
      const current = entry.steps.includes(step);
      const paragraph = noteParagraph(entry, current ? "is-current" : entry.steps.length ? "is-other-press" : "");
      if (entry.steps.length) {
        const tag = document.createElement("span");
        tag.className = "press-tag";
        tag.textContent = pressRangeLabel(entry.steps);
        paragraph.prepend(tag);
      }
      root.appendChild(paragraph);
    });
  }

  // Say this: the lines that belong to the current press. Must say: scene-wide must lines with no press.
  function renderSayNow(richNote, step, total) {
    const entries = noteEntries(richNote, total).filter((entry) => entry.kind !== "block");
    const now = entries.filter((entry) => entry.kind !== "detail" && entry.steps.includes(step));
    nodes.sayNow.replaceChildren();
    if (now.length) {
      now.forEach((entry) => nodes.sayNow.appendChild(noteParagraph({ ...entry, text: heroText(entry.text) })));
    } else {
      const empty = document.createElement("p");
      empty.className = "say-empty";
      const vote = !nodes.voteCard.hidden;
      const ask = !nodes.stepAskRow.hidden;
      empty.textContent = !richNote
        ? state?.note || "·"
        : vote
          ? "Run the vote: take hands for each option, then say the split aloud."
          : ask
            ? "Ask the question above and take two answers before the next press."
            : "No scripted line for this press. Speak to what is on screen; the full note is below.";
      nodes.sayNow.appendChild(empty);
    }
    const musts = entries.filter((entry) => entry.kind === "must" && !entry.steps.length);
    nodes.mustBlock.hidden = !musts.length;
    nodes.mustLines.replaceChildren(...musts.map((entry) => noteParagraph(entry)));
  }

  function renderPressMeter(step, total) {
    const count = Math.max(0, Math.min(12, total));
    if (nodes.pressMeter.childElementCount !== count + 1) {
      nodes.pressMeter.replaceChildren(...Array.from({ length: count + 1 }, () => document.createElement("i")));
    }
    [...nodes.pressMeter.children].forEach((dot, index) => {
      dot.className = index < step ? "done" : index === step ? "current" : "";
    });
  }

  function isAppendixState() {
    return state?.kind === "appendix";
  }

  function appendixReturnAvailable() {
    // Older decks do not report their return target; an appendix scene then assumes Esc can return.
    return isAppendixState() && state.appendixReturn !== null;
  }

  function setDeckControlAvailability() {
    const paired = Boolean(directDeck?.authenticated && activeSyncSessionId);
    const pairing = paired ? "paired" : directDeck ? "pairing" : "unpaired";
    if (document.documentElement.dataset.pairingState !== pairing) document.documentElement.dataset.pairingState = pairing;
    document.querySelectorAll("[data-deck-command]").forEach((control) => {
      const disabled = !paired || (control.dataset.deckCommand === "appendix-return" && !appendixReturnAvailable());
      if (control.disabled !== disabled) control.disabled = disabled;
    });
    if (!paired) cancelConfirm(nodes.resetConfirm);
    if (nodes.sceneSelect) {
      nodes.sceneSelect.disabled = !paired || !state;
      nodes.sceneGo.disabled = !paired || !state;
    }
  }

  function openerCanReauthenticate() {
    try {
      return Boolean(directDeck?.source && !directDeck.source.closed);
    } catch (_error) {
      return false;
    }
  }

  function restartWindowHandshake() {
    if (!directDeck || !openerCanReauthenticate()) return;
    if (directDeck.authenticated) postWindowEnvelope("disconnect");
    // Replacing the peer object also invalidates any in-flight key import.
    directDeck = { ...directDeck, authenticated: false, challenge: null, channelId: createChannelId(), phase: "waiting-challenge" };
    sharedAuthKey = null;
    activeSyncSessionId = "";
    lastStateSequence = 0;
    lastStateSignature = "";
    connectionStatus = "";
    document.documentElement.dataset.windowChannel = "pending";
    setDeckControlAvailability();
    beginWindowHandshake();
  }

  // One polite announcement per burst: a connection change and the first scene arrive together, so
  // they are joined instead of the second silently replacing the first.
  let pendingAnnouncements = [];
  let announceTimer = 0;
  function announce(text) {
    pendingAnnouncements.push(text);
    window.clearTimeout(announceTimer);
    announceTimer = window.setTimeout(() => {
      const message = pendingAnnouncements.join(" ");
      pendingAnnouncements = [];
      nodes.announcer.textContent = "";
      window.requestAnimationFrame(() => { nodes.announcer.textContent = message; });
    }, 80);
  }

  // Connection text is visual only (no live region). Transitions are announced once through the
  // announcer; the stale age is shown but never read out second by second.
  function renderConnectionHealth() {
    if (!directDeck?.authenticated) {
      const connection = directDeck ? "pairing" : "unpaired";
      if (nodes.connectionState.dataset.state !== connection) nodes.connectionState.dataset.state = connection;
      nodes.runtimeBlock.dataset.connection = connection;
      setText(nodes.connectionState, connection === "pairing" ? "CONNECTING" : "NOT CONNECTED");
      if (!state) setText(nodes.runtimeStatus, connection === "pairing" ? "Connecting to the deck that opened this console" : "Read only until a deck connects");
      nodes.pairingGuide.hidden = connection !== "unpaired";
      if (connection !== connectionStatus) {
        connectionStatus = connection;
        announce(connection === "pairing"
          ? "Presenter console is connecting to the deck. Controls unlock when it is connected."
          : "Presenter console is not connected. Open the deck and press P.");
      }
      setDeckControlAvailability();
      return;
    }
    nodes.pairingGuide.hidden = true;
    const ageMs = lastLiveStateAt ? Date.now() - lastLiveStateAt : Number.POSITIVE_INFINITY;
    if (ageMs > HEARTBEAT_TIMEOUT_MS && openerCanReauthenticate()) {
      restartWindowHandshake();
      renderConnectionHealth();
      return;
    }
    const connection = !lastLiveStateAt ? "disconnected" : ageMs > HEARTBEAT_TIMEOUT_MS ? "stale" : "connected";
    if (nodes.connectionState.dataset.state !== connection) nodes.connectionState.dataset.state = connection;
    nodes.runtimeBlock.dataset.connection = connection;
    setText(nodes.connectionState, connection === "connected"
      ? "CONNECTED"
      : connection === "stale"
        ? `STALE · ${Math.round(ageMs / 1000)}s`
        : "DISCONNECTED");
    if (connection !== connectionStatus) {
      connectionStatus = connection;
      if (connection !== "connected") setText(nodes.runtimeStatus, "Deck closed or asleep: bring the deck tab back, or reopen slides.html and press P there (a new console opens; close this one).");
      announce(connection === "connected"
        ? "Presenter connected to the deck."
        : connection === "stale"
          ? "Presenter lost the deck. The note shown is the last known scene."
          : "Presenter disconnected from the deck.");
    }
  }

  function renderState(nextState, { live = true, authenticated = false } = {}) {
    if (!authenticated
      || !directDeck?.authenticated
      || !nextState
      || nextState.type !== "state"
      || typeof nextState.sceneId !== "string"
      || !WINDOW_CHANNEL_PATTERN.test(String(nextState.syncSessionId || ""))
      || !Number.isInteger(nextState.sequence)
      || nextState.sequence < 1
      || !Number.isFinite(nextState.timestamp)
      || Math.abs(Date.now() - nextState.timestamp) > 15000) return;
    if (activeSyncSessionId && nextState.syncSessionId === activeSyncSessionId && nextState.sequence <= lastStateSequence) return;
    if (nextState.syncSessionId !== activeSyncSessionId) lastStateSequence = 0;
    activeSyncSessionId = nextState.syncSessionId;
    lastStateSequence = nextState.sequence;
    if (live) lastLiveStateAt = Date.now();
    const stateSignature = `${nextState.sceneId}:${nextState.fragmentIndex}:${nextState.runtimeMode}:${nextState.runtimeStatus}:${JSON.stringify(nextState.interactionProgress || null)}:${JSON.stringify(nextState.evidence || null)}:${JSON.stringify(nextState.appendixReturn ?? "unknown")}`;
    const previous = state;
    const sceneChanged = previous?.sceneId !== nextState.sceneId;
    state = nextState;
    renderConnectionHealth();
    if (stateSignature === lastStateSignature) return;
    lastStateSignature = stateSignature;
    // The clock starts itself on the first forward press from the cover (the cover note says to start
    // on the first word); Start stays available for anyone who starts talking earlier.
    if (!timerStarted() && previous?.sceneId === "cover" && previous.fragmentIndex === 0
      && (nextState.sceneId !== "cover" || nextState.fragmentIndex > 0) && nextState.kind === "main") {
      startTimer();
      showToast("Clock started on the first press.");
    }
    nodes.runtimeMode.dataset.mode = state.runtimeMode;
    setText(nodes.runtimeMode, `${String(state.runtimeMode || "replay").toUpperCase()} PATH`);
    renderRuntimeBlock();
    const step = Number.isInteger(state.fragmentIndex) ? state.fragmentIndex : 0;
    const total = Number.isInteger(state.fragmentTotal) ? state.fragmentTotal : 0;
    setText(nodes.currentSection, state.section || document.title);
    setText(nodes.currentLabel, state.label || state.sceneId);
    setText(nodes.currentId, state.sceneId);
    setText(nodes.currentCounter, state.kind === "main"
      ? `${String(state.mainIndex + 1).padStart(2, "0")} / ${state.mainTotal}`
      : `A${state.index - state.mainTotal + 1}`);
    const progress = state.interactionProgress;
    setText(nodes.fragmentState, progress
      ? `${progress.label} · ${progress.done} / ${progress.total}`
      : total === 0 ? `complete on entry · 0 / 0` : `press ${step} / ${total}`);
    renderPressMeter(step, total);
    setText(nodes.sceneWindow, state.kind === "main" ? `${formatBudget(state.startBudgetSeconds)} to ${formatBudget(state.endBudgetSeconds)}` : "off clock");
    setText(nodes.noteHook, `note:${state.noteKey}`);
    nodes.notesPanel.dataset.noteKey = state.noteKey;
    const richNote = window.FOLDLINE_PRESENTER_NOTES?.[state.noteKey];
    renderStepLines(richNote, step, total);
    renderVoteCard(richNote, step);
    renderSayNow(richNote, step, total);
    renderSpeakerNote(richNote, step, total);
    renderLines(nodes.audienceAsks, richNote?.ask?.map((item) => `${item.at === 0 ? "entry" : `press ${item.at}`} · ${item.text}`) || []);
    renderLines(nodes.expectedAudience, richNote?.expectedAudience || []);
    renderLines(nodes.revealCut, richNote ? [`Reveal: ${richNote.revealOrder.join(" → ")}`, `Cut: ${richNote.cut}`] : []);
    renderAppendixRoutes(richNote?.appendixRoutes || []);
    renderAppendixBanner();
    const endOfMain = state.kind === "main" && state.mainIndex === state.mainTotal - 1;
    setText(nodes.nextLabel, endOfMain ? "None · Q&A uses the appendix routes" : state.next?.label || "End of deck");
    setText(nodes.nextId, endOfMain ? "·" : state.next?.sceneId || "·");
    setText(nodes.nextKind, endOfMain ? "end" : state.next?.kind || "end");
    document.documentElement.dataset.deckKind = state.kind || "main";
    populateSceneSelect(state.scenes);
    if (!selectDirty) nodes.sceneSelect.value = state.sceneId;
    if (sceneChanged) {
      // A new scene starts the note at its top, so the new note is never hidden above the fold.
      nodes.notesPanel.scrollTop = 0;
      nodes.cueColumn.scrollTop = 0;
      announce(state.kind === "main"
        ? `Scene ${state.mainIndex + 1} of ${state.mainTotal}: ${state.label || state.sceneId}.`
        : `Appendix: ${state.label || state.sceneId}.`);
    } else {
      // Keep the current press's first line in view inside the full note.
      const current = nodes.speakerNote.querySelector(".is-current");
      if (current && nodes.noteDetails.open) scrollIntoPanel(nodes.notesPanel, current);
    }
    setDeckControlAvailability();
    renderClock();
  }

  function scrollIntoPanel(panel, element) {
    const panelBox = panel.getBoundingClientRect();
    const box = element.getBoundingClientRect();
    if (box.top >= panelBox.top && box.bottom <= panelBox.bottom) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    panel.scrollTo({ top: panel.scrollTop + box.top - panelBox.top - 12, behavior: reduce ? "auto" : "smooth" });
  }

  function renderAppendixBanner() {
    const appendix = isAppendixState();
    nodes.appendixBanner.hidden = !appendix;
    const target = state?.appendixReturn;
    const returnLabel = target?.label ? `Return to ${target.label} (Esc)` : "Return from appendix (Esc)";
    setText(nodes.returnControl, returnLabel);
    if (!appendix) return;
    setText(nodes.appendixBannerText, target === null
      ? "opened directly: use Jump to scene to go back to the main path"
      : target?.label ? `Esc or the return button goes back to ${target.label}` : "Esc or the return button goes back to the calling scene");
  }

  // The last background evidence check and any authored value that differs from the sealed
  // record. LIVE / REPLAY is presenter-only: the projector never shows a source label.
  function renderRuntimeBlock() {
    const latest = state.evidence?.recent?.[0];
    const mismatches = state.evidence?.bindingMismatches || [];
    nodes.runtimeBlock.dataset.evidence = mismatches.length || latest?.matchesSealed === false ? "mismatch" : "ok";
    if (mismatches.length) {
      setText(nodes.runtimeStatus, `MISMATCH · ${mismatches.length} projected value${mismatches.length === 1 ? "" : "s"} differ from the sealed record: ${mismatches[0]}`);
      return;
    }
    setText(nodes.runtimeStatus, latest ? latest.text : (state.evidence?.status || state.runtimeStatus || "No runtime detail"));
  }

  // "On screen now" is what the current press shows; "Next press" is what the next arrow press will show.
  function renderStepLines(richNote, step, total) {
    const order = richNote?.revealOrder || [];
    setText(nodes.stepNow, order[step] || "·");
    const aloud = (richNote?.ask || []).filter((item) => item.aloud && item.at === step).map((item) => item.text);
    nodes.stepAskRow.hidden = !aloud.length;
    setText(nodes.stepAsk, aloud.join(" · ") || "·");
    let next;
    if (step < total) next = order[step + 1] || "·";
    else if (state.kind === "main" && state.mainIndex === state.mainTotal - 1) next = "Nothing · the main path ends here. Open Q&A.";
    else if (state.kind === "appendix") next = state.next?.kind === "appendix" ? `Next appendix page · ${state.next.label}` : "Nothing · last appendix page";
    else next = state.next ? `Next scene · ${state.next.label}` : "End of deck";
    setText(nodes.stepNext, next);
    nodes.stepNextRow.dataset.sceneChange = step >= total ? "true" : "false";
  }

  // Notes contract for ask[] items: { at: integer step, text, options?: string[], expected?, aloud? }.
  // The vote card shows the one on-screen room vote whose `at` is the current step; spoken prompts
  // carry aloud: true and stay in the Ask list only. verify-deck and check-scene enforce the shape
  // for v3 scenes (_build/lib/deck-invariants.mjs askViolations).
  function renderVoteCard(richNote, step) {
    const vote = (richNote?.ask || []).find((item) => !item.aloud && Number.isInteger(item.at) && item.at === step);
    nodes.voteCard.hidden = !vote;
    if (!vote) return;
    setText(nodes.votePrompt, vote.text);
    const options = Array.isArray(vote.options) ? vote.options : [];
    nodes.voteOptions.replaceChildren(...options.map((option) => {
      const item = document.createElement("li");
      item.textContent = option;
      return item;
    }));
    nodes.voteOptions.hidden = !options.length;
    setText(nodes.voteExpected, vote.expected ? `Expected: ${vote.expected}` : "Take hands for each option and say the split aloud.");
  }

  function renderLines(root, lines) {
    root.replaceChildren();
    if (!lines.length) {
      root.textContent = "·";
      return;
    }
    lines.forEach((line) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = line;
      root.appendChild(paragraph);
    });
  }

  function sceneLabel(sceneId) {
    return state?.scenes?.find((scene) => scene.sceneId === sceneId)?.label || sceneId.replace(/^appendix-/, "");
  }

  function renderAppendixRoutes(routes) {
    nodes.appendixRoutes.replaceChildren();
    if (!routes.length) {
      nodes.appendixRoutes.textContent = "None for this scene";
      return;
    }
    routes.forEach((sceneId) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "appendix-route";
      button.textContent = sceneLabel(sceneId);
      button.title = sceneId;
      button.disabled = !(directDeck?.authenticated && activeSyncSessionId);
      button.addEventListener("click", (event) => {
        send({ command: "goto", sceneId });
        afterCommand(event);
      });
      nodes.appendixRoutes.appendChild(button);
    });
  }

  // A reloaded deck announces its new session (unsigned, no state). A paired presenter re-runs the
  // window handshake at once and shows PAIRING instead of a CONNECTED that drops every command.
  function acceptDeckStarted(notice) {
    if (notice?.type !== "deck-started"
      || !WINDOW_CHANNEL_PATTERN.test(String(notice.syncSessionId || ""))
      || !Number.isFinite(notice.timestamp)
      || Math.abs(Date.now() - notice.timestamp) > 15000
      || !directDeck?.authenticated
      || notice.syncSessionId === activeSyncSessionId) return;
    restartWindowHandshake();
    renderConnectionHealth();
  }

  async function acceptSharedState(envelope) {
    if (!await verifySharedEnvelope(envelope, "state")) return;
    renderState(envelope.payload, { authenticated: true });
  }

  async function readStoredState() {
    if (!sharedAuthKey || !directDeck?.authenticated) return;
    try {
      const stored = JSON.parse(window.localStorage.getItem(STATE_KEY));
      await acceptSharedState(stored);
    } catch (_error) {
      // An absent or malformed signed state never changes pairing state.
    }
  }

  async function publishSharedMessage(kind, payload) {
    const envelope = await signSharedEnvelope(kind, payload);
    if (!envelope) return;
    channel?.postMessage(envelope);
    if (kind === "command") {
      try { window.localStorage.setItem(COMMAND_KEY, JSON.stringify(envelope)); } catch (_error) { /* direct channel remains */ }
    }
  }

  function queueSharedMessage(kind, payload) {
    sharedPublishChain = sharedPublishChain.then(() => publishSharedMessage(kind, payload)).catch(() => undefined);
  }

  function send(message) {
    if (!directDeck?.authenticated || !activeSyncSessionId) return;
    const payload = {
      type: "command",
      commandId: createChannelId(),
      sequence: ++commandSequence,
      syncSessionId: activeSyncSessionId,
      timestamp: Date.now(),
      ...message,
    };
    postWindowEnvelope("payload", { payload });
    queueSharedMessage("command", payload);
  }

  function requestState() {
    if (!directDeck?.authenticated) {
      beginWindowHandshake();
      return;
    }
    const payload = {
      type: "request-state",
      requestId: createChannelId(),
      timestamp: Date.now(),
      syncSessionId: activeSyncSessionId,
    };
    postWindowEnvelope("payload", { payload });
    if (activeSyncSessionId) queueSharedMessage("request-state", payload);
  }

  function isInput(target) {
    return Boolean(target?.closest?.("select,input,textarea,[contenteditable]"));
  }

  let toastTimer = 0;
  function showToast(text, duration = 2600) {
    nodes.toast.hidden = false;
    nodes.toast.textContent = text;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { nodes.toast.hidden = true; nodes.toast.textContent = ""; }, duration);
  }

  // Two-step confirmations for the two actions that throw away the room's place: the first activation
  // opens an inline confirm row and moves focus to its harmless choice, so a clicker's Space or Enter
  // cannot confirm by accident. The row closes itself after a few seconds.
  const CONFIRM_TIMEOUT_MS = 6000;
  const confirmTimers = new Map();

  function openConfirm(row, trigger) {
    if (!row) return;
    row.hidden = false;
    row.dataset.trigger = trigger?.dataset.deckCommand || trigger?.dataset.timerCommand || "";
    trigger?.setAttribute("aria-expanded", "true");
    row.querySelector("[data-confirm-cancel]")?.focus();
    window.clearTimeout(confirmTimers.get(row));
    confirmTimers.set(row, window.setTimeout(() => cancelConfirm(row), CONFIRM_TIMEOUT_MS));
  }

  function cancelConfirm(row, { restoreFocus = false } = {}) {
    if (!row || row.hidden) return;
    const hadFocus = row.contains(document.activeElement);
    row.hidden = true;
    window.clearTimeout(confirmTimers.get(row));
    const trigger = document.querySelector(`[data-confirm-target="${row.id}"]`);
    trigger?.setAttribute("aria-expanded", "false");
    if (hadFocus && restoreFocus) trigger?.focus();
    else if (hadFocus) focusNextReveal();
  }

  function focusNextReveal() {
    if (nodes.nextReveal && !nodes.nextReveal.disabled) nodes.nextReveal.focus();
    else document.activeElement?.blur?.();
  }

  // After a pointer click the button releases focus, so Space/Enter go back to meaning one press. After a
  // keyboard activation focus moves to Next reveal, so the next Space/Enter from a clicker is the next press.
  function afterCommand(event) {
    const button = event.currentTarget;
    if (event.detail > 0) button.blur();
    else if (button !== nodes.nextReveal) focusNextReveal();
  }

  const RESET_KEY_CONFIRM_MS = 1500;
  let resetKeyArmedAt = 0;

  // Keys mirror the deck: → and PageDown are one press forward, ← and PageUp one press back (a clicker's
  // keys), Space/Shift+Space the same when no button has focus, Esc leaves an appendix, and R twice
  // within 1.5 s sends the deck to the cover, exactly as on the deck. Reset scene stays on its button.
  // A keyboard-focused button keeps its own Space/Enter activation.
  function onKey(event) {
    if (isInput(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
    // A held clicker key (or held Space/Enter on a focused button) auto-repeats; like the deck, the
    // console ignores repeats so one hold is one press, never a run of skipped steps.
    if (event.repeat && ["ArrowRight", "ArrowLeft", "PageDown", "PageUp", " ", "Spacebar", "Enter", "r", "R"].includes(event.key)) {
      event.preventDefault();
      return;
    }
    const activatesButton = event.key === " " || event.key === "Spacebar" || event.key === "Enter";
    if (activatesButton && event.target?.closest?.("button, summary, a")) return;
    const isReset = event.key === "r" || event.key === "R";
    if (event.key === "Escape") {
      const open = [nodes.resetConfirm, nodes.timerConfirm].find((row) => !row.hidden);
      if (open) {
        event.preventDefault();
        cancelConfirm(open, { restoreFocus: true });
        return;
      }
    }
    let command = null;
    if (event.key === "ArrowRight" || event.key === "PageDown") command = "fragment-next";
    else if (event.key === "ArrowLeft" || event.key === "PageUp") command = "fragment-previous";
    else if (event.key === "Escape" && appendixReturnAvailable()) command = "appendix-return";
    else if ((event.key === " " || event.key === "Spacebar") && event.shiftKey) command = "fragment-previous";
    else if (event.key === " " || event.key === "Spacebar" || event.key === "Enter") command = "fragment-next";
    else if (isReset && !event.shiftKey) command = "reset-key";
    if (!command) return;
    event.preventDefault();
    if (event.repeat) return;
    if (!directDeck?.authenticated || !activeSyncSessionId) {
      showToast("Not connected: open the deck and press P first.");
      return;
    }
    if (command === "reset-key") {
      const now = performance.now();
      if (resetKeyArmedAt && now - resetKeyArmedAt <= RESET_KEY_CONFIRM_MS) {
        resetKeyArmedAt = 0;
        send({ command: "full-reset" });
        showToast("Deck sent back to the cover.");
        announce("Deck sent back to the cover.");
      } else {
        resetKeyArmedAt = now;
        showToast("Press R again to send the deck back to the cover.", RESET_KEY_CONFIRM_MS);
      }
      return;
    }
    resetKeyArmedAt = 0;
    send({ command });
  }

  function commitSceneJump() {
    const sceneId = nodes.sceneSelect.value;
    selectDirty = false;
    if (!sceneId || sceneId === state?.sceneId) return;
    send({ command: "goto", sceneId });
  }

  // A standalone console (opened by hand) becomes the named presenter window, then opens the deck.
  // The deck's P reuses this window by name and re-runs the normal pairing handshake.
  function openDeckFromConsole() {
    try { window.name = "esg-presenter"; } catch (_error) { /* the deck's P opens its own console */ }
    const deck = window.open("./slides.html", "_blank");
    setText(nodes.pairingLead, deck
      ? "The deck opened in a new tab. Press P there; this console reloads once and connects."
      : "The browser blocked the new tab. Open slides.html yourself and press P there.");
  }

  function initialize() {
    Object.assign(nodes, {
      runtimeBlock: document.querySelector(".runtime-block"), runtimeMode: byId("runtime-mode"), runtimeStatus: byId("runtime-status"), connectionState: byId("connection-state"),
      timer: byId("timer"), paceState: byId("pace-state"), paceCut: byId("pace-cut"), clockFill: byId("clock-fill"), clockWindow: byId("clock-window"),
      sceneWindow: byId("scene-window"), stateAge: byId("state-age"), currentSection: byId("current-section"), currentLabel: byId("current-label"),
      currentId: byId("current-id"), currentCounter: byId("current-counter"), fragmentState: byId("fragment-state"), pressMeter: byId("press-meter"), noteHook: byId("note-hook"),
      notesPanel: byId("notes-panel"), noteDetails: byId("note-details"), speakerNote: byId("speaker-note"), nextLabel: byId("next-label"), nextId: byId("next-id"),
      nextKind: byId("next-kind"), sceneSelect: byId("scene-select"), sceneGo: byId("scene-go"), announcer: byId("connection-announcer"), toast: byId("console-toast"),
      stepNow: byId("step-now"), stepNext: byId("step-next"), stepNextRow: document.querySelector(".step-next"), stepAsk: byId("step-ask"), stepAskRow: byId("step-ask-row"),
      sayNow: byId("say-now"), mustBlock: byId("must-block"), mustLines: byId("must-lines"), cueColumn: document.querySelector(".cue-column"),
      voteCard: byId("vote-card"), votePrompt: byId("vote-prompt"), voteOptions: byId("vote-options"), voteExpected: byId("vote-expected"),
      audienceAsks: byId("audience-asks"), expectedAudience: byId("expected-audience"), revealCut: byId("reveal-cut"), appendixRoutes: byId("appendix-routes"),
      appendixBanner: byId("appendix-banner"), appendixBannerText: byId("appendix-banner-text"), returnControl: document.querySelector(".return-control"),
      nextReveal: document.querySelector(".next-reveal"), pairingGuide: byId("pairing-guide"), pairingLead: byId("pairing-lead"),
      resetConfirm: byId("reset-confirm"), timerConfirm: byId("timer-confirm"), clockTarget: byId("clock-target"),
    });
    nodes.timerToggle = document.querySelector('[data-timer-command="toggle"]');

    // The full note's open/closed choice is a per-viewer convenience.
    try {
      if (window.localStorage.getItem(NOTE_OPEN_KEY) === "closed") nodes.noteDetails.open = false;
    } catch (_error) { /* default open */ }
    nodes.noteDetails.addEventListener("toggle", () => {
      try { window.localStorage.setItem(NOTE_OPEN_KEY, nodes.noteDetails.open ? "open" : "closed"); } catch (_error) { /* not remembered */ }
    });

    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.addEventListener("message", (event) => {
        if (event.data?.type === "deck-started") acceptDeckStarted(event.data);
        else void acceptSharedState(event.data);
      });
    }
    window.addEventListener("storage", (event) => {
      if (event.key === STATE_KEY && event.newValue) {
        try { void acceptSharedState(JSON.parse(event.newValue)); } catch (_error) { /* ignore malformed signed state */ }
      } else if (event.key === DECK_STARTED_KEY && event.newValue) {
        try { acceptDeckStarted(JSON.parse(event.newValue)); } catch (_error) { /* ignore malformed notices */ }
      } else if (event.key === TIMER_KEY) {
        // Start, pause or reset in another console window keeps every console on one clock.
        timerState = readTimer();
        renderClock();
      }
    });
    window.addEventListener("message", (event) => { void handleWindowMessage(event); });
    window.addEventListener("pagehide", () => {
      if (directDeck?.authenticated) postWindowEnvelope("disconnect");
    });
    window.addEventListener("keydown", onKey);

    document.querySelectorAll("[data-deck-command]").forEach((button) => {
      button.addEventListener("click", (event) => {
        const row = button.dataset.confirmTarget ? byId(button.dataset.confirmTarget) : null;
        if (row) {
          openConfirm(row, button);
          return;
        }
        send({ command: button.dataset.deckCommand });
        afterCommand(event);
      });
    });
    nodes.timerToggle.addEventListener("click", (event) => {
      toggleTimer();
      if (event.detail > 0) event.currentTarget.blur();
    });
    const timerReset = document.querySelector('[data-timer-command="reset"]');
    timerReset.addEventListener("click", () => {
      if (!timerStarted()) return;
      openConfirm(nodes.timerConfirm, timerReset);
    });
    document.querySelectorAll("[data-confirm-cancel]").forEach((button) => {
      button.addEventListener("click", () => cancelConfirm(button.closest(".confirm-row")));
    });
    document.querySelectorAll("[data-confirm-action]").forEach((button) => {
      button.addEventListener("click", (event) => {
        const row = button.closest(".confirm-row");
        if (button.dataset.confirmAction === "reset-timer") resetTimer();
        else if (button.dataset.confirmAction === "full-reset") {
          send({ command: "full-reset" });
          announce("Deck sent back to the cover.");
        }
        cancelConfirm(row);
        if (event.detail > 0 || !row.contains(document.activeElement)) focusNextReveal();
      });
    });

    // The scene list only chooses; Enter or Go commits. Arrow keys on a closed select fire `change`
    // in Chromium, so change never moves the projector.
    nodes.sceneSelect.addEventListener("change", () => { selectDirty = nodes.sceneSelect.value !== state?.sceneId; });
    nodes.sceneSelect.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitSceneJump();
        focusNextReveal();
      } else if (event.key === "Escape" && selectDirty) {
        event.preventDefault();
        selectDirty = false;
        if (state) nodes.sceneSelect.value = state.sceneId;
      }
    });
    nodes.sceneSelect.addEventListener("blur", () => {
      // Leaving the list without committing restores the deck's scene so the list never lies.
      window.setTimeout(() => {
        if (document.activeElement === nodes.sceneGo) return;
        selectDirty = false;
        if (state) nodes.sceneSelect.value = state.sceneId;
      }, 0);
    });
    nodes.sceneGo.addEventListener("click", () => {
      commitSceneJump();
      focusNextReveal();
    });

    byId("open-deck").addEventListener("click", openDeckFromConsole);

    setDeckControlAvailability();
    requestState();
    renderClock();
    renderConnectionHealth();
    window.setInterval(requestState, HEARTBEAT_INTERVAL_MS);
    window.setInterval(() => {
      renderClock();
      renderConnectionHealth();
      setText(nodes.stateAge, state?.timestamp ? `${Math.max(0, Math.round((Date.now() - state.timestamp) / 1000))}s old` : "·");
    }, HEARTBEAT_INTERVAL_MS);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
