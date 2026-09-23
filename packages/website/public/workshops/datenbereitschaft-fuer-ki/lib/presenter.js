(() => {
  const CHANNEL_NAME = "foldline-deck:v1";
  const STATE_KEY = "foldline-deck:presenter-state:v1";
  const COMMAND_KEY = "foldline-deck:presenter-command:v1";
  const DECK_STARTED_KEY = "foldline-deck:deck-started:v1";
  const TIMER_KEY = "foldline-deck:timer:v1";
  const WINDOW_PROTOCOL = "foldline-deck:window:v1";
  const SHARED_PROTOCOL = "foldline-deck:shared-auth:v1";
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

  function toggleTimer() {
    if (timerState.running) {
      timerState.accumulatedMs = elapsedMs();
      timerState.startedAt = null;
      timerState.running = false;
    } else {
      timerState.startedAt = Date.now();
      timerState.running = true;
    }
    writeTimer();
    renderClock();
  }

  function resetTimer() {
    timerState = { accumulatedMs: 0, startedAt: null, running: false };
    writeTimer();
    renderClock();
  }

  function renderClock() {
    const elapsed = elapsedMs();
    const started = timerState.running || timerState.accumulatedMs > 0;
    nodes.timer.dataset.state = started ? timerState.running ? "running" : "paused" : "not-started";
    nodes.timer.textContent = started ? formatTime(elapsed) : "NOT STARTED";
    nodes.timerToggle.textContent = timerState.running ? "Pause" : started ? "Resume" : "Start";
    if (!started) {
      nodes.paceState.textContent = "NOT STARTED";
      return;
    }
    if (!state || state.kind !== "main") {
      nodes.paceState.textContent = state?.kind === "appendix" ? "Appendix · off clock" : "No scene state";
      return;
    }
    // Ahead or behind the locked clock for this scene: early before its start, behind after its end.
    const elapsedSeconds = elapsed / 1000;
    const start = Number(state.startBudgetSeconds) || 0;
    const end = Number(state.endBudgetSeconds) || 0;
    if (elapsedSeconds < start - 30) nodes.paceState.textContent = `${formatBudget(start - elapsedSeconds)} early · scene starts ${formatBudget(start)}`;
    else if (elapsedSeconds > end + 30) nodes.paceState.textContent = `${formatBudget(elapsedSeconds - end)} behind · scene ended ${formatBudget(end)}`;
    else nodes.paceState.textContent = `On time · ${formatBudget(Math.max(0, end - elapsedSeconds))} left in scene`;
  }

  function populateSceneSelect(scenes) {
    const signature = JSON.stringify((scenes || []).map((scene) => [scene.sceneId, scene.label, scene.kind]));
    if (!scenes?.length || signature === manifestSignature) return;
    manifestSignature = signature;
    nodes.sceneSelect.replaceChildren();
    let mainNumber = 0;
    let appendixNumber = 0;
    scenes.forEach((scene) => {
      const option = document.createElement("option");
      option.value = scene.sceneId;
      const sceneNumber = scene.kind === "appendix"
        ? `A${++appendixNumber}`
        : String(++mainNumber).padStart(2, "0");
      option.textContent = `${sceneNumber} · ${scene.sceneId} · ${scene.label}`;
      nodes.sceneSelect.appendChild(option);
    });
    nodes.sceneSelect.disabled = !directDeck?.authenticated;
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

  function noteEntries(lines) {
    return (lines || []).flatMap((entry) => {
      const kept = spokenLines([entry]);
      if (!kept.length) return [];
      if (kept.length > 1) return [{ kind: "block", head: kept[0].trim(), body: kept.slice(1).join("\n") }];
      const text = kept[0].trim();
      const kind = NOTE_MUST.test(text) ? "must" : NOTE_CUE.test(text) ? "cue" : NOTE_DETAIL.test(text) ? "detail" : "say";
      return [{ kind, text }];
    });
  }

  function renderSpeakerNote(richNote) {
    const root = nodes.speakerNote;
    root.replaceChildren();
    const entries = noteEntries(richNote?.say);
    if (!entries.length) {
      root.textContent = state.note || "—";
      return;
    }
    const rank = (entry) => (entry.kind === "must" ? 0 : entry.kind === "detail" || entry.kind === "block" ? 2 : 1);
    [...entries].sort((a, b) => rank(a) - rank(b)).forEach((entry) => {
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
      const paragraph = document.createElement("p");
      paragraph.className = `note-line note-line--${entry.kind}`;
      paragraph.textContent = entry.text;
      root.appendChild(paragraph);
    });
  }

  function setDeckControlAvailability() {
    const paired = Boolean(directDeck?.authenticated && activeSyncSessionId);
    document.documentElement.dataset.pairingState = paired ? "paired" : directDeck ? "pairing" : "unpaired";
    document.querySelectorAll("[data-deck-command]").forEach((control) => { control.disabled = !paired; });
    if (nodes.sceneSelect) nodes.sceneSelect.disabled = !paired || !state;
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

  function renderConnectionHealth() {
    if (!directDeck?.authenticated) {
      const connection = directDeck ? "pairing" : "unpaired";
      nodes.connectionState.dataset.state = connection;
      nodes.runtimeBlock.dataset.connection = connection;
      nodes.connectionState.textContent = connection === "pairing" ? "PAIRING" : "UNPAIRED · READ ONLY";
      nodes.runtimeStatus.textContent = connection === "pairing" ? "Authenticating deck opener" : "Open from slides.html with P";
      if (connection !== connectionStatus) {
        connectionStatus = connection;
        nodes.announcer.textContent = connection === "pairing"
          ? "Presenter is authenticating the deck opener. Controls remain disabled."
          : "Presenter is unpaired and read only. Open it from the deck with P.";
      }
      setDeckControlAvailability();
      return;
    }
    const ageMs = lastLiveStateAt ? Date.now() - lastLiveStateAt : Number.POSITIVE_INFINITY;
    if (ageMs > HEARTBEAT_TIMEOUT_MS && openerCanReauthenticate()) {
      restartWindowHandshake();
      renderConnectionHealth();
      return;
    }
    const connection = !lastLiveStateAt ? "disconnected" : ageMs > HEARTBEAT_TIMEOUT_MS ? "stale" : "connected";
    nodes.connectionState.dataset.state = connection;
    nodes.runtimeBlock.dataset.connection = connection;
    nodes.connectionState.textContent = connection === "connected"
      ? "CONNECTED"
      : connection === "stale"
        ? `STALE · ${Math.round(ageMs / 1000)}s`
        : "DISCONNECTED";
    if (connection !== connectionStatus) {
      connectionStatus = connection;
      nodes.announcer.textContent = connection === "connected"
        ? "Presenter connected to deck."
        : connection === "stale"
          ? "Presenter connection stale. Displayed deck state is cached."
          : "Presenter disconnected from deck.";
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
    const stateSignature = `${nextState.sceneId}:${nextState.fragmentIndex}:${nextState.runtimeMode}:${nextState.runtimeStatus}:${JSON.stringify(nextState.interactionProgress || null)}:${JSON.stringify(nextState.evidence || null)}`;
    const sceneChanged = state?.sceneId !== nextState.sceneId;
    state = nextState;
    renderConnectionHealth();
    if (stateSignature === lastStateSignature) return;
    lastStateSignature = stateSignature;
    nodes.runtimeMode.dataset.mode = state.runtimeMode;
    nodes.runtimeMode.textContent = `${String(state.runtimeMode || "replay").toUpperCase()} PATH`;
    renderRuntimeBlock();
    nodes.currentSection.textContent = state.section || "Data Readiness for AI";
    nodes.currentLabel.textContent = state.label || state.sceneId;
    nodes.currentId.textContent = state.sceneId;
    nodes.currentCounter.textContent = state.kind === "main"
      ? `${state.mainIndex + 1} / ${state.mainTotal}`
      : `appendix ${state.index - state.mainTotal + 1}`;
    const progress = state.interactionProgress;
    nodes.fragmentState.textContent = progress
      ? `${progress.label} · ${progress.done} / ${progress.total}`
      : `reveal ${state.fragmentIndex} / ${state.fragmentTotal}`;
    nodes.sceneWindow.textContent = state.kind === "main" ? `${formatBudget(state.startBudgetSeconds)}–${formatBudget(state.endBudgetSeconds)}` : "off clock";
    nodes.noteHook.textContent = `note:${state.noteKey}`;
    nodes.notesPanel.dataset.noteKey = state.noteKey;
    const richNote = window.FOLDLINE_PRESENTER_NOTES?.[state.noteKey];
    renderSpeakerNote(richNote);
    renderStepLines(richNote);
    renderVoteCard(richNote);
    renderLines(nodes.audienceAsks, richNote?.ask?.map((item) => `${item.at} · ${item.text}`) || []);
    renderLines(nodes.expectedAudience, richNote?.expectedAudience || []);
    renderLines(nodes.revealCut, richNote ? [`Reveal: ${richNote.revealOrder.join(" → ")}`, `Cut: ${richNote.cut}`] : []);
    renderAppendixRoutes(richNote?.appendixRoutes || []);
    const endOfMain = state.kind === "main" && state.mainIndex === state.mainTotal - 1;
    nodes.nextLabel.textContent = endOfMain ? "End of main path · Q&A via appendix routes" : state.next?.label || "End of deck";
    nodes.nextId.textContent = endOfMain ? "—" : state.next?.sceneId || "—";
    nodes.nextKind.textContent = endOfMain ? "end" : state.next?.kind || "end";
    document.documentElement.dataset.deckKind = state.kind || "main";
    // A new scene starts every scrolling column at its top, so the new note is never hidden above the fold.
    if (sceneChanged) [nodes.notesPanel, nodes.currentPanel, nodes.controlPanel].forEach((panel) => { if (panel) panel.scrollTop = 0; });
    populateSceneSelect(state.scenes);
    nodes.sceneSelect.value = state.sceneId;
    nodes.announcer.textContent = `Presenter synchronized to ${state.sceneId}.`;
    setDeckControlAvailability();
    renderClock();
  }

  // The last background evidence check and any authored value that differs from the sealed
  // record. LIVE / REPLAY is presenter-only: the projector never shows a source label.
  function renderRuntimeBlock() {
    const latest = state.evidence?.recent?.[0];
    const mismatches = state.evidence?.bindingMismatches || [];
    nodes.runtimeBlock.dataset.evidence = mismatches.length || latest?.matchesSealed === false ? "mismatch" : "ok";
    if (mismatches.length) {
      nodes.runtimeStatus.textContent = `MISMATCH · ${mismatches.length} projected value${mismatches.length === 1 ? "" : "s"} differ from the sealed record: ${mismatches[0]}`;
      return;
    }
    nodes.runtimeStatus.textContent = latest ? latest.text : (state.evidence?.status || state.runtimeStatus || "No runtime detail");
  }

  // "Now" is what the current press shows; "Next press" is what the next arrow press will show.
  function renderStepLines(richNote) {
    const order = richNote?.revealOrder || [];
    const step = Number.isInteger(state.fragmentIndex) ? state.fragmentIndex : 0;
    const total = Number.isInteger(state.fragmentTotal) ? state.fragmentTotal : 0;
    nodes.stepNow.textContent = order[step] || "—";
    const aloud = (richNote?.ask || []).filter((item) => item.aloud && item.at === step).map((item) => item.text);
    nodes.stepAskRow.hidden = !aloud.length;
    nodes.stepAsk.textContent = aloud.join(" · ") || "—";
    if (step < total) nodes.stepNext.textContent = order[step + 1] || "—";
    else if (state.kind === "main" && state.mainIndex === state.mainTotal - 1) nodes.stepNext.textContent = "Nothing · the main path ends here";
    else nodes.stepNext.textContent = state.next ? `Next scene · ${state.next.label}` : "End of deck";
  }

  // Notes contract for ask[] items: { at: integer step, text, options?: string[], expected?, aloud? }.
  // The vote card shows the one on-screen room vote whose `at` is the current step; spoken prompts
  // carry aloud: true and stay in the Ask list only. verify-deck and check-scene enforce the shape
  // for v3 scenes (_build/lib/deck-invariants.mjs askViolations).
  function renderVoteCard(richNote) {
    const vote = (richNote?.ask || []).find((item) => !item.aloud && Number.isInteger(item.at) && item.at === state.fragmentIndex);
    nodes.voteCard.hidden = !vote;
    if (!vote) return;
    const options = Array.isArray(vote.options) && vote.options.length ? ` · ${vote.options.join(" / ")}` : "";
    nodes.votePrompt.textContent = `${vote.text}${options}`;
    nodes.voteExpected.textContent = vote.expected ? `Expected: ${vote.expected}` : "Expected resolution in the speaker note";
  }

  function renderLines(root, lines) {
    root.replaceChildren();
    if (!lines.length) {
      root.textContent = "—";
      return;
    }
    lines.forEach((line) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = line;
      root.appendChild(paragraph);
    });
  }

  function renderAppendixRoutes(routes) {
    nodes.appendixRoutes.replaceChildren();
    if (!routes.length) {
      nodes.appendixRoutes.textContent = "None";
      return;
    }
    routes.forEach((sceneId) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "appendix-route";
      button.textContent = sceneId.replace(/^appendix-/, "");
      button.title = sceneId;
      button.addEventListener("click", () => {
        send({ command: "goto", sceneId });
        button.blur();
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

  // Keys mirror the deck (spec B.9): → and PageDown are one press forward, ← and PageUp one press
  // back, Esc returns from an appendix. Scene jumps stay on the buttons and the scene select. A
  // keyboard-focused button keeps its own Space/Enter activation, so those keys never send a second
  // command; a mouse click releases focus, so Space and Enter go back to meaning one press.
  function onKey(event) {
    if (isInput(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
    const activatesButton = event.key === " " || event.key === "Spacebar" || event.key === "Enter";
    if (activatesButton && event.target?.closest?.("button")) return;
    let command = null;
    if (event.key === "ArrowRight" || event.key === "PageDown") command = "fragment-next";
    else if (event.key === "ArrowLeft" || event.key === "PageUp") command = "fragment-previous";
    else if (event.key === "Escape") command = "appendix-return";
    else if ((event.key === " " || event.key === "Spacebar") && event.shiftKey) command = "fragment-previous";
    else if (event.key === " " || event.key === "Spacebar" || event.key === "Enter") command = "fragment-next";
    else if ((event.key === "r" || event.key === "R") && event.shiftKey) command = "full-reset";
    else if (event.key === "r" || event.key === "R") command = "reset-current";
    if (!command) return;
    event.preventDefault();
    send({ command });
  }

  function initialize() {
    Object.assign(nodes, {
      runtimeBlock: document.querySelector(".runtime-block"), runtimeMode: byId("runtime-mode"), runtimeStatus: byId("runtime-status"), connectionState: byId("connection-state"), timer: byId("timer"), paceState: byId("pace-state"),
      sceneWindow: byId("scene-window"), stateAge: byId("state-age"), currentSection: byId("current-section"), currentLabel: byId("current-label"),
      currentId: byId("current-id"), currentCounter: byId("current-counter"), fragmentState: byId("fragment-state"), noteHook: byId("note-hook"),
      notesPanel: document.querySelector(".notes-panel"), speakerNote: byId("speaker-note"), nextLabel: byId("next-label"), nextId: byId("next-id"),
      nextKind: byId("next-kind"), sceneSelect: byId("scene-select"), announcer: byId("connection-announcer"),
      stepNow: byId("step-now"), stepNext: byId("step-next"), stepAsk: byId("step-ask"), stepAskRow: byId("step-ask-row"),
      currentPanel: document.querySelector(".current-panel"), controlPanel: document.querySelector(".control-panel"), voteCard: byId("vote-card"), votePrompt: byId("vote-prompt"), voteExpected: byId("vote-expected"),
      audienceAsks: byId("audience-asks"), expectedAudience: byId("expected-audience"), revealCut: byId("reveal-cut"), appendixRoutes: byId("appendix-routes"),
    });
    nodes.timerToggle = document.querySelector('[data-timer-command="toggle"]');

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
      }
    });
    window.addEventListener("message", (event) => { void handleWindowMessage(event); });
    window.addEventListener("pagehide", () => {
      if (directDeck?.authenticated) postWindowEnvelope("disconnect");
    });
    window.addEventListener("keydown", onKey);

    // A pointer click (event.detail > 0) releases focus so Space/Enter never repeat the clicked control.
    const releaseAfterClick = (event) => { if (event.detail > 0) event.currentTarget.blur(); };
    document.querySelectorAll("[data-deck-command]").forEach((button) => {
      button.addEventListener("click", (event) => {
        send({ command: button.dataset.deckCommand });
        releaseAfterClick(event);
      });
    });
    document.querySelector('[data-timer-command="toggle"]').addEventListener("click", (event) => { toggleTimer(); releaseAfterClick(event); });
    document.querySelector('[data-timer-command="reset"]').addEventListener("click", (event) => { resetTimer(); releaseAfterClick(event); });
    nodes.sceneSelect.addEventListener("change", () => {
      send({ command: "goto", sceneId: nodes.sceneSelect.value });
      nodes.sceneSelect.blur();
    });

    if (!directDeck) nodes.speakerNote.textContent = "UNPAIRED · read only. Open this console from slides.html with P.";
    setDeckControlAvailability();
    requestState();
    renderClock();
    renderConnectionHealth();
    window.setInterval(requestState, HEARTBEAT_INTERVAL_MS);
    window.setInterval(() => {
      renderClock();
      renderConnectionHealth();
      nodes.stateAge.textContent = state?.timestamp ? `${Math.max(0, Math.round((Date.now() - state.timestamp) / 1000))}s` : "—";
    }, HEARTBEAT_INTERVAL_MS);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
