/* Workshop 04 demo core. Pure functions, no DOM.
   The build script (build-demo.mjs) evaluates this file in Node to server-render the final state,
   and inlines the same text into demo.html so the page computes every state the same way.
   Totals are never added from stored bar values: every total comes from data.combinations[mask]. */
var W04Core = (function () {
  "use strict";
  var ORDER = ["T1", "T2", "T3", "T4", "T5", "T6", "T7"];
  var MINUS = "−";

  function tenths(v) { return Math.round(v * 10); }

  function group(intStr) { return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

  /* EN display: 1,915.2 with a true minus. dec = decimals. */
  function num(v, dec) {
    if (dec === undefined) dec = 1;
    var neg = v < 0 && Math.abs(v) >= Math.pow(10, -dec) / 2;
    var s = Math.abs(v).toFixed(dec);
    var parts = s.split(".");
    return (neg ? MINUS : "") + group(parts[0]) + (parts[1] ? "." + parts[1] : "");
  }
  function signed(v, dec) {
    if (dec === undefined) dec = 1;
    var s = num(v, dec);
    if (Math.abs(v) < Math.pow(10, -dec) / 2) return num(0, dec);
    return v > 0 ? "+" + s : s;
  }
  function pct(v, dec) { return signed(v, dec === undefined ? 1 : dec) + "%"; }

  /* German CSV decimal ("84,0") to a JS number */
  function deNum(s) {
    if (s === "" || s === undefined || s === null) return null;
    return Number(String(s).replace(/\./g, "").replace(",", "."));
  }

  function maskOf(ids, bits) {
    var m = 0;
    ids.forEach(function (id) { m |= bits[id]; });
    return m;
  }
  function combo(D, mask) { return D.combinations[String(mask)]; }
  function total(D, mask, method) { return combo(D, mask)[method + "_t"]; }

  /* One state: which traps are active, for which method.
     The chart fixes the active traps one at a time in the fixed order T1..T7,
     from this state's total down to the right answer (mask 0). Each bar is the
     difference of two looked-up totals, so the bars always add up to the end total. */
  function state(D, mask, method) {
    var bits = D.trapBits, c = combo(D, mask);
    var start = c[method + "_t"], end = total(D, 0, method);
    var cur = mask, rows = [], sumT = tenths(start);
    ORDER.forEach(function (id) {
      var active = (mask & bits[id]) !== 0;
      if (!active) { rows.push({ id: id, active: false }); return; }
      var next = cur & ~bits[id];
      var from = total(D, cur, method), to = total(D, next, method);
      var eff = (tenths(to) - tenths(from)) / 10;
      sumT += tenths(to) - tenths(from);
      rows.push({ id: id, active: true, from: from, to: to, effect: eff });
      cur = next;
    });
    var dT = c["delta_vs_right_" + method + "_t"], dP = c["delta_vs_right_" + method + "_pct"];
    return {
      mask: mask, method: method, start: start, end: end, rows: rows,
      sumOk: sumT === tenths(end),
      s1: c.s1_t, s2: c[method === "lb" ? "s2lb_t" : "s2mb_t"],
      vs2024: c["vs2024_" + method + "_pct"],
      deltaT: dT, deltaPct: dP,
      side: tenths(dT) === 0 ? "matches" : (dT < 0 ? "below" : "above")
    };
  }

  /* Axis for one method: the lowest and highest total over all 128 combinations,
     so the scale stays still while switches change. */
  var scaleCache = {};
  function scale(D, method) {
    if (scaleCache[method]) return scaleCache[method];
    var lo = Infinity, hi = -Infinity, maxEff = 0, maxDelta = 0, vlo = Infinity, vhi = -Infinity;
    Object.keys(D.combinations).forEach(function (k) {
      var c = D.combinations[k], t = c[method + "_t"], v = c["vs2024_" + method + "_pct"];
      if (t < lo) lo = t; if (t > hi) hi = t;
      if (v < vlo) vlo = v; if (v > vhi) vhi = v;
      var d = Math.abs(c["delta_vs_right_" + method + "_t"]); if (d > maxDelta) maxDelta = d;
      state(D, Number(k), method).rows.forEach(function (r) { if (r.active && Math.abs(r.effect) > maxEff) maxEff = Math.abs(r.effect); });
    });
    scaleCache[method] = { lo: lo, hi: hi, maxEff: maxEff, maxDelta: maxDelta, vlo: vlo, vhi: vhi };
    return scaleCache[method];
  }
  /* Position on the waterfall track in percent. The first 10% hold the cut axis. */
  function pos(sc, v) { return 10 + 88 * (v - sc.lo) / (sc.hi - sc.lo); }

  function announce(D, st) {
    var m = st.method === "lb" ? "Location-based" : "Market-based";
    var tail = st.side === "matches" ? "matches the right answer" :
      num(Math.abs(st.deltaT)) + " t " + st.side + " the right answer";
    return m + ". Total " + num(st.start) + " t, " + tail + ".";
  }

  function r2(v) { return Math.round(v * 100) / 100; }

  /* Bar geometry for one step from a to b: floating waterfall (l, w) on desktop,
     signed bar from a centre line (cl, cw) on phones. Percent of the track. */
  function geom(sc, a, b, eff) {
    var pa = pos(sc, a), pb = pos(sc, b);
    var cw = sc.maxEff ? Math.abs(eff) / sc.maxEff * 48 : 0;
    return { l: r2(Math.min(pa, pb)), w: r2(Math.abs(pb - pa)), cl: r2(eff < 0 ? 50 - cw : 50), cw: r2(cw), neg: eff < 0 };
  }

  /* Everything the switchboard displays for one state, as strings and percentages.
     build-demo.mjs writes this into the HTML for the default state; the page applies it on every change. */
  function view(D, mask, method) {
    var st = state(D, mask, method), sc = scale(D, method);
    var ghost = mask === 0 ? state(D, 127, method) : null;
    var rows = {};
    D.traps.forEach(function (t, i) {
      var r = st.rows[i], iso = t.isolated[method + "_t"];
      var o = {
        pressed: r.active,
        sw: r.active ? "As the AI did it" : "Fixed",
        iso: tenths(iso) === 0 ? "0 t for this number" : t.isolated[method + "_en"] + " t",
        isoZero: tenths(iso) === 0,
        fx: r.active ? signed(r.effect) : "",
        run: r.active ? num(r.to) : "",
        bar: r.active ? geom(sc, r.from, r.to, r.effect) : null,
        ghost: null
      };
      if (ghost) {
        var g = ghost.rows[i];
        if (g.active && tenths(g.effect) !== 0) o.ghost = geom(sc, g.from, g.to, g.effect);
        o.fx = g.active ? signed(g.effect) : "";
        o.run = g.active ? num(g.to) : "";
      }
      rows[t.id] = o;
    });
    var right = total(D, 0, method), raw = total(D, 127, method);
    return {
      mask: mask, method: method, ghost: !!ghost, rows: rows,
      start: { label: mask === 0 ? "This answer: every trap fixed" : (mask === 127 ? "The raw-folder answer (constructed)" : "This answer"),
               t: num(st.start), w: r2(pos(sc, st.start)), gw: ghost ? r2(pos(sc, raw)) : null, gt: ghost ? num(raw) : "" },
      end: { t: num(right), w: r2(pos(sc, right)) },
      meters: {
        total: num(st.start) + " t",
        dist: tenths(st.deltaT) === 0 ? "0.0 t" : num(Math.abs(st.deltaT)) + " t " + st.side,
        distPct: tenths(st.deltaT) === 0 ? "matches the right answer" : num(Math.abs(st.deltaPct)) + "% of the right total",
        distW: sc.maxDelta ? r2(Math.abs(st.deltaT) / sc.maxDelta * 100) : 0,
        vs: pct(st.vs2024),
        vsRight: pct(combo(D, 0)["vs2024_" + method + "_pct"]),
        vsPos: r2((st.vs2024 - sc.vlo) / (sc.vhi - sc.vlo) * 100),
        vsRightPos: r2((combo(D, 0)["vs2024_" + method + "_pct"] - sc.vlo) / (sc.vhi - sc.vlo) * 100),
        s1: num(st.s1) + " t", s2: num(st.s2) + " t"
      },
      caption: ghost
        ? "Every switch is fixed, so this answer is the right answer. The outlined bars show the path from the raw-folder answer, with all traps active, in this order."
        : (mask === 127
          ? "With all traps active, in this order. Each bar fixes one trap, from the raw-folder answer down to the right answer."
          : "Each bar fixes one active trap, in this order, from this answer down to the right answer. Totals come from the " + Object.keys(D.combinations).length + " precomputed states."),
      check: st.sumOk ? "Sum of the bars = chart total ✓" : "Sum of the bars does not match the chart total",
      sumOk: st.sumOk,
      announce: announce(D, st)
    };
  }

  return {
    ORDER: ORDER, num: num, signed: signed, pct: pct, deNum: deNum, tenths: tenths,
    maskOf: maskOf, combo: combo, total: total, state: state, scale: scale, pos: pos, announce: announce, view: view
  };
})();
