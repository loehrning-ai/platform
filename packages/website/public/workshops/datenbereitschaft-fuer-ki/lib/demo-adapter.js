(() => {
  const REQUEST_TIMEOUT_MS = 1800;
  // A background evidence check must never hold a scene: live evidence answers in tens of
  // milliseconds or the deck falls back to the sealed record for the session.
  const LIVE_EVIDENCE_TIMEOUT_MS = 1500;
  const CASE_IDS = Object.freeze({
    "ending-mrr": "G01",
    "net-new-mrr": "G02",
    "logo-churn": "G03",
    "expansion-country": "G04",
    "latest-account": "G05",
    "bare-mrr": "C01",
    "profit-plan": "R01",
    "identifier-attack": "R02",
    "forced-denial": "D01",
  });

  function clone(value) {
    return typeof structuredClone === "function"
      ? structuredClone(value)
      : JSON.parse(JSON.stringify(value));
  }

  async function fetchJson(url, timeoutMs = REQUEST_TIMEOUT_MS, externalSignal = null) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    const abortFromExternal = () => controller.abort();
    if (externalSignal?.aborted) controller.abort();
    else externalSignal?.addEventListener("abort", abortFromExternal, { once: true });
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`${url} returned ${response.status}`);
      return await response.json();
    } finally {
      window.clearTimeout(timer);
      externalSignal?.removeEventListener("abort", abortFromExternal);
    }
  }

  function throwIfAborted(signal) {
    if (signal?.aborted) throw new DOMException("Request aborted", "AbortError");
  }

  // The sealed record for one lane and case, shaped as an evidence result. `corpus` is the
  // nine-case evaluation. The projector only ever renders these sealed values.
  function sealedEvidence(fixtures, lane, caseId, fields) {
    if (caseId === "corpus") {
      return { lane, caseId, dataset: clone(fixtures.dataset), evidence: clone(fixtures.evaluation), matchesSealed: true, reason: null, elapsedMs: null, ...fields };
    }
    const payload = fixtures.responses[`${lane}:${caseId}`];
    if (!payload) throw new Error(`Sealed evidence missing for ${lane}:${caseId}`);
    return { lane, caseId, dataset: clone(payload.dataset), evidence: clone(payload.evidence), matchesSealed: true, reason: null, elapsedMs: null, ...fields };
  }

  function readyPasses(rows) {
    return (rows || []).filter((row) => row.ready === "pass").map((row) => row.caseId).join(",");
  }

  function sanitizedLiveFailure(error) {
    const status = String(error?.message || "").match(/ returned (\d{3})$/)?.[1];
    if (status) return `HTTP ${status}`;
    if (error?.name === "TypeError") return "network unavailable";
    return "evidence request rejected";
  }

  const eur = (value) => new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(value));

  function describe(caseId, lane, evidence) {
    const rows = evidence.rows || [];
    if (caseId === "G01") {
      if (lane === "bad") {
        return {
          value: `Apr ${eur(rows[0]?.ending_mrr_eur)} · May ${eur(rows[1]?.ending_mrr_eur)} · Jun ${eur(rows[2]?.ending_mrr_eur)}`,
          summary: "A plausible balance series that double-counts each month’s change.",
        };
      }
      return {
        value: `Apr ${eur(rows[0]?.ending_mrr_eur)} · May ${eur(rows[1]?.ending_mrr_eur)} · Jun ${eur(rows[2]?.ending_mrr_eur)}`,
        summary: "Three month-end balances for the last complete quarter. Monthly ending balances are never summed.",
      };
    }
    if (caseId === "G02") return { value: eur(rows[0]?.net_new_mrr_eur), summary: "New plus expansion minus contraction and churned MRR during Q2 2026." };
    if (caseId === "G03") return {
      value: rows.map((row) => `${row.customer_segment} ${Number(row.logo_churn_rate_pct).toFixed(2)}%`).join(" · "),
      summary: "Q2 start cohort: accounts that churned during the quarter divided by accounts active at 2026-04-01.",
    };
    if (caseId === "G04") return {
      value: rows.slice(0, 4).map((row) => `${row.country_code} ${eur(row.expansion_mrr_eur)}`).join(" · "),
      summary: "Expansion MRR ranked by synthetic billing country for Q2 2026.",
    };
    if (caseId === "G05") return {
      value: `${rows[0]?.account_key || "—"} · ${eur(rows[0]?.ending_mrr_eur)}`,
      summary: "Highest June ending MRR using the approved pseudonymous analytics key.",
    };
    if (caseId === "R01" || caseId === "R02") return { value: "REFUSED", summary: evidence.message };
    if (caseId === "C01") return { value: "CLARIFY", summary: evidence.message };
    if (caseId === "D01") return { value: "DENIED", summary: evidence.message };
    return { value: evidence.behavior?.toUpperCase() || "EVIDENCE", summary: evidence.message || "Fixed evidence returned." };
  }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
    }
    return value;
  }

  function evidenceProjection(payload) {
    const evidence = payload?.evidence || {};
    return stableValue({
      dataset: {
        id: payload?.dataset?.id,
        checksum: payload?.dataset?.checksum,
        completeThroughMonth: payload?.dataset?.completeThroughMonth,
        loadedAtUtc: payload?.dataset?.loadedAtUtc,
        evaluationClockUtc: payload?.dataset?.evaluationClockUtc,
      },
      evidence: {
        id: evidence.id,
        behavior: evidence.behavior,
        metric: evidence.metric ?? null,
        allowedRelations: evidence.allowedRelations || [],
        rows: evidence.rows || [],
        message: evidence.message ?? null,
        ruleId: evidence.ruleId ?? null,
        denied: evidence.denied ?? null,
      },
    });
  }

  function matchesExpected(actualPayload, expectedProjection) {
    if (!actualPayload || !expectedProjection) return false;
    const expectedJson = typeof expectedProjection === "string"
      ? expectedProjection
      : JSON.stringify(evidenceProjection(expectedProjection));
    return JSON.stringify(evidenceProjection(actualPayload)) === expectedJson;
  }

  function normalize(payload, questionId, lane, source, elapsedMs = null, denialPayload = null, evaluatedAt = null, semantic = null, expectedPayload = null, expectedDenialPayload = null) {
    if (!payload?.dataset || !payload?.evidence) throw new Error("Evidence response violates the fixed contract");
    const caseId = CASE_IDS[questionId] || payload.evidence.id;
    const evidence = payload.evidence;
    const description = describe(caseId, lane, evidence);
    const denial = denialPayload?.evidence;
    const isLive = source.startsWith("live");
    const isPreExecution = ["C01", "R01", "R02"].includes(caseId);
    const evidenceSource = isPreExecution
      ? `${isLive ? "live" : "embedded"} fixed pre-execution policy evidence; no SQL sent`
      : caseId === "D01"
        ? `${isLive ? "live PostgreSQL denial" : "embedded PostgreSQL-denial fixture"}`
        : source;
    const selectedModels = evidence.allowedRelations || [];
    const primaryExpectedMatch = matchesExpected(payload, expectedPayload);
    const denialExpectedMatch = !expectedDenialPayload || matchesExpected(denialPayload, expectedDenialPayload);
    const expectedMatch = primaryExpectedMatch && denialExpectedMatch;
    const lineage = selectedModels.length
      ? `synthetic seed → core → ${selectedModels.join(", ")}`
      : caseId === "D01"
        ? "PostgreSQL grant boundary"
        : "course-side pre-execution gate";
    return {
      questionId,
      caseId,
      lane,
      answerStatus: evidence.behavior,
      ...description,
      selectedModels,
      selectedMetric: evidence.metric || null,
      sql: evidence.fixedSql || null,
      datasetId: payload.dataset.id,
      datasetChecksum: payload.dataset.checksum,
      snapshot: payload.dataset.loadedAtUtc,
      completeThroughMonth: payload.dataset.completeThroughMonth,
      currency: payload.dataset.currency,
      source: evidenceSource,
      denialSource: denial
        ? `${isLive ? "live PostgreSQL denial" : "embedded PostgreSQL-denial fixture"} · D01`
        : null,
      expectedResult: `${expectedMatch ? "MATCH" : "MISMATCH"} · ${String(evidence.behavior || "evidence").toUpperCase()}`,
      denialExpectedResult: denial
        ? `${denialExpectedMatch ? "MATCH" : "MISMATCH"} · ${String(denial.behavior || "deny").toUpperCase()}`
        : null,
      modelState: "N/A · fixed evidence, no model invocation",
      cacheState: "N/A · no model cache",
      sqlExecution: evidence.fixedSql ? "FIXED SQL" : isPreExecution ? "NO SQL SENT" : "N/A",
      lineage,
      elapsedMs,
      evaluatedAt,
      compiledMetricsSha256: semantic?.files?.["generated/ask/metrics.ready.json"] || null,
      databaseError: denial?.message || null,
      policyRule: evidence.ruleId || null,
      raw: clone(payload),
    };
  }

  class ReplayAdapter {
    constructor(fixtures) {
      this.fixtures = fixtures;
      this.mode = "replay";
      this.reason = "embedded fixed evidence";
    }

    async status() {
      return { ...this.fixtures.status, mode: this.mode, reason: this.reason };
    }

    async run(questionId, lane = "ready", options = {}) {
      const caseId = CASE_IDS[questionId];
      if (!caseId) throw new Error(`Unknown fixed question: ${questionId}`);
      const payload = this.fixtures.responses[`${lane}:${caseId}`];
      if (!payload) throw new Error(`Replay evidence missing for ${lane}:${caseId}`);
      const denial = questionId === "identifier-attack" ? this.fixtures.responses["ready:D01"] : null;
      throwIfAborted(options.signal);
      return normalize(clone(payload), questionId, lane, "embedded fixed course query", null, clone(denial), payload.dataset.evaluationClockUtc, this.fixtures.semantic, this.fixtures.expectedProjections[`${lane}:${caseId}`], questionId === "identifier-attack" ? this.fixtures.expectedProjections["ready:D01"] : null);
    }

    async evidence(lane, caseId, { signal } = {}) {
      throwIfAborted(signal);
      return sealedEvidence(this.fixtures, lane, caseId, { source: "replay", reason: this.reason });
    }

    evaluation() {
      return clone(this.fixtures.evaluation);
    }
  }

  class LiveAdapter {
    constructor(baseUrl) {
      this.baseUrl = baseUrl.replace(/\/$/, "");
      this.mode = "live";
      this.replayFixture = null;
      this.manifest = null;
    }

    async status() {
      const [health, manifest, replay] = await Promise.all([
        fetchJson(`${this.baseUrl}/health`),
        fetchJson(`${this.baseUrl}/api/manifest`),
        fetchJson(`${this.baseUrl}/api/replay`),
      ]);
      if (health?.ok !== true || !health.datasetId || !health.checksum) throw new Error("Live evidence service is not ready");
      if (manifest?.dataset?.checksum !== health.checksum || replay?.dataset?.checksum !== health.checksum) {
        throw new Error("Live evidence checksums do not agree");
      }
      this.manifest = manifest;
      this.replayFixture = replay;
      return { ...health, detail: `Fixed evidence API · ${health.datasetId}` };
    }

    async fetchEvidence(lane, caseId, signal = null) {
      return fetchJson(`${this.baseUrl}/api/evidence/${lane}/${caseId}`, LIVE_EVIDENCE_TIMEOUT_MS, signal);
    }

    // Live check against the sealed record. A mismatch still resolves with the sealed payload,
    // so a number that is not in the course record can never reach the projector.
    async evidence(lane, caseId, { signal } = {}) {
      const sealed = window.FOLDLINE_REPLAY;
      const started = performance.now();
      let matches;
      if (caseId === "corpus") {
        throwIfAborted(signal);
        matches = readyPasses(this.evaluation()) === readyPasses(sealed.evaluation);
      } else {
        const payload = await this.fetchEvidence(lane, caseId, signal);
        matches = matchesExpected(payload, sealed?.expectedProjections?.[`${lane}:${caseId}`]);
      }
      return sealedEvidence(sealed, lane, caseId, {
        source: matches ? "live" : "replay",
        matchesSealed: matches,
        reason: matches ? null : "live mismatch",
        elapsedMs: Math.round(performance.now() - started),
      });
    }

    async run(questionId, lane = "ready", options = {}) {
      const caseId = CASE_IDS[questionId];
      if (!caseId) throw new Error(`Unknown fixed question: ${questionId}`);
      const started = performance.now();
      const payload = await this.fetchEvidence(lane, caseId, options.signal);
      const denial = questionId === "identifier-attack" ? await this.fetchEvidence("ready", "D01", options.signal) : null;
      return normalize(payload, questionId, lane, "live fixed query against local PostgreSQL", Math.round(performance.now() - started), denial, payload.dataset.evaluationClockUtc, this.manifest?.semantic, window.FOLDLINE_REPLAY?.expectedProjections?.[`${lane}:${caseId}`], questionId === "identifier-attack" ? window.FOLDLINE_REPLAY?.expectedProjections?.["ready:D01"] : null);
    }

    evaluation() {
      const cases = this.replayFixture?.cases || {};
      const definitions = [
        ["ending-mrr", "G01", "Ending MRR by month in Q2", "ANSWER", "ANSWER"],
        ["net-new-mrr", "G02", "Net-new MRR in Q2", "ANSWER", "ANSWER"],
        ["logo-churn", "G03", "Logo churn by segment", "ANSWER", "ANSWER"],
        ["expansion-country", "G04", "Expansion MRR by country", "ANSWER", "ANSWER"],
        ["latest-account", "G05", "Highest ending MRR account", "ANSWER", "ANSWER"],
        ["bare-mrr", "C01", "Bare MRR", "N/A", "CLARIFY"],
        ["profit-plan", "R01", "Profit by plan", "N/A", "REFUSE"],
        ["identifier-attack", "R02", "Direct identifiers", "N/A", "REFUSE"],
        ["forced-denial", "D01", "Forced core read", "N/A", "DENY"],
      ];
      return definitions.map(([id, caseId, question, badBehavior, readyBehavior]) => ({
        id,
        caseId,
        question,
        bad: cases[caseId]?.bad ? (cases[caseId].bad.correct === true ? "pass" : "fail") : "na",
        badBehavior,
        ready: cases[caseId]?.ready?.correct === false ? "fail" : "pass",
        readyBehavior,
      }));
    }
  }

  // The evidence API is a local instructor service. Public copies are self-contained replays;
  // they must not probe unrelated platform /health or /api routes, even with ?mode=live.
  function candidateBaseUrls() {
    const { protocol, hostname } = window.location;
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
    return loopback && (protocol === "http:" || protocol === "https:") ? [window.location.origin] : [];
  }

  class AdapterController extends EventTarget {
    constructor() {
      super();
      this.replay = new ReplayAdapter(window.FOLDLINE_REPLAY);
      this.adapter = this.replay;
      this.statusDetail = "Embedded fixed evidence";
    }

    async initialize() {
      this.useReplay("public teaching edition; recorded evidence only");
      return this.adapter.status();
    }

    useReplay(reason) {
      this.replay.reason = reason;
      this.adapter = this.replay;
      this.statusDetail = `Replay · ${reason}`;
      this._announce();
    }

    async run(questionId, lane = "ready", options = {}) {
      const activeAdapter = this.adapter;
      try {
        return await activeAdapter.run(questionId, lane, options);
      } catch (error) {
        if (error?.name === "AbortError" || options.signal?.aborted) throw error;
        if (activeAdapter.mode !== "live") throw error;
        const transition = `LIVE attempt failed closed (${sanitizedLiveFailure(error)}) → REPLAY fixed evidence`;
        this.useReplay(transition);
        const replayResult = await this.adapter.run(questionId, lane, options);
        return { ...replayResult, fallbackTransition: transition };
      }
    }

    // Background evidence check for the presenter. Replay resolves on the next microtask; live
    // mismatch, error or timeout returns the sealed record and switches the session to replay.
    async evidence(lane, caseId, options = {}) {
      const activeAdapter = this.adapter;
      try {
        const result = await activeAdapter.evidence(lane, caseId, options);
        if (activeAdapter.mode === "live" && !result.matchesSealed) this.useReplay("live mismatch");
        return result;
      } catch (error) {
        if (options.signal?.aborted) throw error;
        if (activeAdapter.mode !== "live") throw error;
        const reason = error?.name === "AbortError" ? "live timeout" : "live unavailable";
        this.useReplay(`${reason} (${sanitizedLiveFailure(error)})`);
        return sealedEvidence(this.replay.fixtures, lane, caseId, { source: "replay", reason });
      }
    }

    evaluation() {
      return this.adapter.evaluation();
    }

    _announce() {
      document.documentElement.dataset.runtimeMode = this.adapter.mode;
      this.dispatchEvent(new CustomEvent("modechange", {
        detail: { mode: this.adapter.mode, status: this.statusDetail },
      }));
    }

    get mode() {
      return this.adapter.mode;
    }
  }

  window.FoldlineDemo = new AdapterController();
  window.FoldlineEvidenceContract = Object.freeze({
    matchesExpected,
  });
})();
