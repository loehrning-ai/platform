/* w05-field.js: the W05 dot field (canvas 2D), a pure function of press and --p. Seeded, no clock, no listener; idle when
 * inactive or still; reduced motion is p = 1. Data and layouts: field() in deck-src/scene.mjs. */
(function() {
'use strict';
var DPR = 2, TAU = 6.2832;
function mulberry32(seed) {
	var a = seed >>> 0;
	return function() {
		a = (a + 0x6D2B79F5) >>> 0;
		var t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
function projector(ring, w, h, pad) {
	var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, i;
	for (i = 0; i < ring.length; i++) {
		x0 = Math.min(x0, ring[i][0]); x1 = Math.max(x1, ring[i][0]);
		y0 = Math.min(y0, ring[i][1]); y1 = Math.max(y1, ring[i][1]);
	}
	var k = Math.cos(((y0 + y1) / 2) * Math.PI / 180);
	var s = Math.min((w - 2 * pad) / ((x1 - x0) * k), (h - 2 * pad) / (y1 - y0));
	var ox = (w - (x1 - x0) * k * s) / 2, oy = (h - (y1 - y0) * s) / 2;
	return {
		x: function(lon) { return ox + (lon - x0) * k * s; },
		y: function(lat) { return oy + (y1 - lat) * s; },
		s: s,
	};
}
function stipple(poly, n, w, h, seed) {
	var A = 0;
	for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) A += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]);
	var step = Math.sqrt(Math.abs(A / 2) / (n * 0.866));
	for (var tries = 0; tries < 12; tries++) {
		var rnd = mulberry32(seed);
		var dy = step * 0.866, pts = [], ox = rnd() * step, oy = rnd() * dy;
		for (var r = 0, y = oy; y < h; r += 1, y += dy) {
			var xs = [];
			for (i = 0, j = poly.length - 1; i < poly.length; j = i++) {
				var p = poly[i], q = poly[j];
				if ((p[1] > y) !== (q[1] > y)) xs.push(((q[0] - p[0]) * (y - p[1])) / (q[1] - p[1]) + p[0]);
			}
			xs.sort(function(u, v) { return u - v; });
			for (var x = ox + (r % 2 ? step / 2 : 0), c = 0; x < w; x += step) {
				while (c < xs.length && xs[c] < x) c++;
				var jx = x + (rnd() - 0.5) * step * 0.36, jy = y + (rnd() - 0.5) * step * 0.36;
				if (c % 2) pts.push(jx, jy);
			}
		}
		var have = pts.length / 2;
		if (have >= n) {
			while (pts.length / 2 > n) pts.splice(Math.floor(rnd() * (pts.length / 2)) * 2, 2);
			return { pts: pts, spacing: step };
		}
		step *= Math.sqrt(have / n) * 0.997;
	}
	throw new Error('w05-field');
}
function scatter(n, w, h, seed) {
	var rnd = mulberry32(seed ^ 0x51ed), pts = [];
	for (var i = 0; i < n; i++) {
		var a = rnd() * TAU, r = 0.2 + 0.8 * Math.sqrt(rnd());
		pts.push(w / 2 + Math.cos(a) * r * w * 0.5, h / 2 + Math.sin(a) * r * h * 0.5);
	}
	return pts;
}
function shares(counts, n) {
	var total = counts.reduce(function(s, c) { return s + c; }, 0);
	var raw = counts.map(function(c) { return (c * n) / total; });
	var out = raw.map(Math.floor), left = n - out.reduce(function(s, c) { return s + c; }, 0);
	raw.map(function(r, i) { return [r - Math.floor(r), i]; }).sort(function(a, b) { return b[0] - a[0] || a[1] - b[1]; })
		.slice(0, left).forEach(function(x) { out[x[1]]++; });
	return out;
}
function groupsGeometry(counts, n, w, h, opts) {
	var o = opts || {}, pad = o.pad || 24, gap = o.gap || 28, top = o.top || 56;
	var dots = shares(counts, n), max = Math.max.apply(0, dots), g = counts.length;
	var pitch = o.pitch || 8, colsPer, rows;
	for (var i = 0; i < 40; i++) {
		rows = Math.floor((h - pad - top) / pitch);
		colsPer = Math.ceil(max / rows);
		if (g * colsPer * pitch + (g - 1) * gap <= w - 2 * pad) break;
		pitch *= 0.95;
	}
	var bw = colsPer * pitch, x = (w - (g * bw + (g - 1) * gap)) / 2, rects = [];
	for (var k = 0; k < g; k++) {
		var hh = Math.ceil(dots[k] / colsPer) * pitch;
		rects.push({ x: x, y: h - pad - hh, w: bw, h: hh, dots: dots[k], cols: colsPer });
		x += bw + gap;
	}
	return { dots: dots, pitch: pitch, rects: rects };
}
function groups(from, counts, w, h, opts, mark, markGroup) {
	var n = from.length / 2, geo = groupsGeometry(counts, n, w, h, opts), order = [];
	for (var i = 0; i < n; i++) order.push(i);
	order.sort(function(a, b) { return from[a * 2] - from[b * 2] || a - b; });
	if (mark >= 0 && markGroup >= 0) {
		var start = geo.dots.slice(0, markGroup).reduce(function(s, c) { return s + c; }, 0);
		var at = order.indexOf(mark);
		order[at] = order[start];
		order[start] = mark;
	}
	var out = new Array(n * 2), used = 0;
	geo.rects.forEach(function(r) {
		var members = order.slice(used, used + r.dots).sort(function(a, b) { return from[a * 2 + 1] - from[b * 2 + 1] || a - b; });
		members.forEach(function(dot, j) {
			var row = Math.floor(j / r.cols), col = j % r.cols;
			out[dot * 2] = r.x + (col + 0.5) * geo.pitch;
			out[dot * 2 + 1] = r.y + r.h - (row + 0.5) * geo.pitch;
		});
		used += r.dots;
	});
	return out;
}
function nearest(pts, x, y) {
	var best = -1, dist = Infinity;
	for (var i = 0; i < pts.length; i += 2) {
		var d = (pts[i] - x) * (pts[i] - x) + (pts[i + 1] - y) * (pts[i + 1] - y);
		if (d < dist) { dist = d; best = i / 2; }
	}
	return best;
}
function parsePlan(text) {
	return String(text || '').split(';').filter(Boolean).map(function(part) {
		var m = /^(\d+):([\w:]+)(?:>([\w:]+))?$/.exec(part.trim());
		if (!m) throw new Error('w05-field ' + part);
		return { k: Number(m[1]), from: m[2], to: m[3] || m[2] };
	}).sort(function(a, b) { return a.k - b.k; });
}
function stateAt(plan, view, driverP) {
	var cur = null;
	plan.forEach(function(e) { if (e.k <= view) cur = e; });
	if (!cur) return { entry: plan[0], p: 0 };
	return { entry: cur, p: cur.k === view ? driverP : 1 };
}
var ease = function(x) { return 1 - Math.pow(1 - x, 3); };
var clamp = function(x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
function seg(p, a, b) { return ease(clamp((p - a) / (b - a))); }
function lerpDots(a, b, d, curl, p, out, k) {
	k = k === undefined ? 1 : k;
	for (var i = 0; i < a.length; i += 2) {
		var x = clamp((p - d[i / 2] * k) / (1 - 0.4 * k)), v = 2 - 2 * x, e = x < .5 ? 4 * x * x * x : 1 - v * v * v / 2, ax = a[i], ay = a[i + 1], bx = b[i], by = b[i + 1];
		var bow = 4 * e * (1 - e) * curl[i / 2] * k;
		out[i] = ax + (bx - ax) * e - (by - ay) * bow;
		out[i + 1] = ay + (by - ay) * e + (bx - ax) * bow;
	}
}
/* the year (cover): waves shared by inspections, straight fronts crossing a region in WD; a dot deepens in WS steps
 * over WR; a region ends at WO * v / max. Nothing expands. */
var WD = 0.34, WR = 0.1, WS = 3, WO = 0.88;
function waves(vals, passes, seed) {
	var rnd = mulberry32(seed ^ 0x9e37), vmax = Math.max.apply(0, vals);
	return shares(vals, passes).map(function(P, g) {
		for (var w = 0, list = [], m = Math.max(1, P); w < m; w++) list.push({ a: ((w + 0.5 * rnd()) / m) * (0.94 - WD - WR), th: rnd() * TAU });
		return { o: WO * vals[g] / vmax, list: list };
	});
}
/* steps by y of a wave that reached a dot at t; alpha of k of K steps toward o */
function visits(y, t) { return y <= t ? 0 : Math.min(WS, Math.ceil(((y - t) / WR) * WS)); }
function shade(k, K, o) { return 1 - Math.pow(1 - o, k / K); }
var api = {
	mulberry32: mulberry32, projector: projector, stipple: stipple,
	scatter: scatter, shares: shares, groupsGeometry: groupsGeometry, groups: groups, nearest: nearest,
	parsePlan: parsePlan, stateAt: stateAt, lerpDots: lerpDots, seg: seg, waves: waves, visits: visits, shade: shade, WS: WS,
};
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof document === 'undefined') return;
var nums = function(text) { return String(text || '').split(',').filter(Boolean).map(Number); };
var stipples = {};
function mount(canvas) {
	var slide = canvas.closest('section.slide'), host = canvas.closest('[data-step]');
	var ring = window.ESG_GEO && window.ESG_GEO.macedonia && window.ESG_GEO.macedonia[0];
	if (!slide || !host || !ring) return;
	var ds = canvas.dataset, w = canvas.width / DPR, h = canvas.height / DPR, pad = Number(ds.pad || 24);
	var n = Number(ds.n), seed = Number(ds.seed || 1), plan = parsePlan(ds.plan);
	var pr = projector(ring, w, h, pad), poly = ring.map(function(q) { return [pr.x(q[0]), pr.y(q[1])]; });
	// dot radius from the polygon's area
	for (var A = 0, i = 0, j = poly.length - 1; i < poly.length; j = i++) A += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]);
	var r = Math.max(1.3, Math.min(3, Math.sqrt(Math.abs(A / 2) / (n * 0.866)) * 0.27)), ready = false;
	var country, mark = -1, regions, cache = {}, ord, flat, delay, curl, dd, mx, my, near = [], wv, reg, off, tau, kk, ov, lastY = 0;
	var yw = nums(ds.year), markLL = nums(ds.mark);
	// sampling and layouts: on the first moving frame
	function prep() {
	ready = true;
	// one stipple per size and seed (shared)
	var sk = [w, h, n, seed, pad].join(), st = stipples[sk] || (stipples[sk] = stipple(poly, n, w, h, seed));
	country = st.pts.slice();
	if (markLL.length === 2) {
		mark = nearest(country, pr.x(markLL[0]), pr.y(markLL[1]));
		country[mark * 2] = pr.x(markLL[0]);
		country[mark * 2 + 1] = pr.y(markLL[1]);
	}
	regions = String(ds.regions || '').split(';').filter(Boolean).map(function(r) {
		var v = nums(r);
		return { x: pr.x(v[0]), y: pr.y(v[1]), v: v[2] };
	});
	var cx = 0, cy = 0, maxd = 0, rnd = mulberry32(seed ^ 0xbeef);
	ord = new Float32Array(n); flat = new Float32Array(n); delay = new Float32Array(n); curl = new Float32Array(n); dd = new Float32Array(n);
	for (i = 0; i < n; i++) { cx += country[i * 2] / n; cy += country[i * 2 + 1] / n; }
	for (i = 0; i < n; i++) maxd = Math.max(maxd, Math.hypot(country[i * 2] - cx, country[i * 2 + 1] - cy));
	for (i = 0; i < n; i++) {
		delay[i] = 0.4 * (0.65 * (1 - Math.hypot(country[i * 2] - cx, country[i * 2 + 1] - cy) / maxd) + 0.35 * rnd());
		curl[i] = (rnd() - 0.5) * 0.5;
	}
	// data-near: the town around the mark
	mx = country[mark * 2]; my = country[mark * 2 + 1];
	if (mark >= 0 && ds.near) {
		var by = [];
		for (i = 0; i < n; i++) { dd[i] = (country[i * 2] - mx) * (country[i * 2] - mx) + (country[i * 2 + 1] - my) * (country[i * 2 + 1] - my); by.push(i); }
		near = by.sort(function(a, b) { return dd[a] - dd[b] || a - b; }).slice(1, 1 + Number(ds.near));
	}
	// data-year "a,b": dust, year, close
	wv = yw.length === 2 && regions.length ? waves(regions.map(function(g) { return g.v; }), Number(ds.waves || 24), seed) : null;
	plan.forEach(function(e) { layout(e.from); layout(e.to); });
	}
	// the year's arrivals, a frame after prep (a dot: its nearest town)
	function yp() {
		var tw = [], wr = mulberry32(seed ^ 7), v = new Float32Array(n);
		regions.forEach(function(g) { tw.push(g.x, g.y); });
		reg = new Uint8Array(n); off = new Uint32Array(n + 1); kk = new Uint8Array(n);
		for (i = 0; i < n; i++) { reg[i] = nearest(tw, country[i * 2], country[i * 2 + 1]); off[i + 1] = off[i] + wv[reg[i]].list.length; }
		tau = new Float32Array(off[n]);
		wv.forEach(function(G, g) {
			G.list.forEach(function(q, k) {
				var lo = Infinity, hi = -Infinity, c = Math.cos(q.th), sn = Math.sin(q.th);
				for (j = 0; j < n; j++) if (reg[j] === g) { v[j] = country[j * 2] * c + country[j * 2 + 1] * sn; if (v[j] < lo) lo = v[j]; if (v[j] > hi) hi = v[j]; }
				for (j = 0; j < n; j++) if (reg[j] === g) tau[off[j] + k] = q.a + WD * (0.9 * (v[j] - lo) / (hi - lo || 1) + 0.1 * wr());
			});
		});
	}
	function layout(name) {
		if (cache[name]) return cache[name];
		var key = name.split(':')[1];
		var pts = name === 'scatter' ? scatter(n, w, h, seed)
			: key && name.indexOf('groups') === 0 ? groups(country, nums(canvas.getAttribute('data-groups-' + key)), w, h, { pad: pad }, mark, Number(canvas.getAttribute('data-mark-group-' + key) || -1))
				: country;
		cache[name] = pts;
		return pts;
	}
	var ctx = canvas.getContext('2d'), pos = new Float32Array(n * 2), last = '', base = null;
	var col = null, colors = function() { if (col) return; var css = getComputedStyle(canvas); col = {}; ['dot', 'line', 'mark', 'ink', 'near'].forEach(function(k) { col[k] = css.getPropertyValue('--w05-field-' + k).trim(); }); };
	var pen = function(g, c, lw) { g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); };
	// flying dots: squares in one path; at rest: circles
	var sq = false;
	function dots(g, list, c, a) {
		if (a <= 0) return;
		g.globalAlpha = a;
		g.fillStyle = c;
		g.beginPath();
		var q = r, s2 = q * 1.8;
		list(sq ? function(j) { g.rect(pos[j * 2] - q * .9, pos[j * 2 + 1] - q * .9, s2, s2); } : function(j) { var x = pos[j * 2], y = pos[j * 2 + 1]; g.moveTo(x + q, y); g.arc(x, y, q, 0, TAU); });
		g.fill();
		g.globalAlpha = 1;
	}
	var all = function(f) { for (var j = 0; j < n; j++) if (j !== mark) f(j); };
	function outline(g, a) {
		if (ds.outline === undefined || a <= 0) return;
		g.globalAlpha = a;
		pen(g, col.line, 1.5);
		poly.forEach(function(p) { g.lineTo(p[0], p[1]); });
		g.closePath();
		g.stroke();
		g.globalAlpha = 1;
	}
	// flying dots at 1x, dots at rest at 2x
	var dpx = DPR;
	function res(d) {
		if (d !== dpx) { dpx = d; canvas.width = w * d; canvas.height = h * d; }
		ctx.setTransform(d, 0, 0, d, 0, 0);
	}
	// the baked country (2x) up to `baked`
	var baked = 0, layer = function() { var c = document.createElement('canvas'); c.width = w * DPR; c.height = h * DPR; c.getContext('2d').setTransform(DPR, 0, 0, DPR, 0, 0); return c; };
	function bake(upto) {
		if (!base) outline((base = layer()).getContext('2d'), 1);
		var bg = base.getContext('2d'), to = layout('country');
		bg.fillStyle = col.dot;
		bg.beginPath();
		for (; baked < upto; baked++) if (baked !== mark) { bg.moveTo(to[baked * 2] + r, to[baked * 2 + 1]); bg.arc(to[baked * 2], to[baked * 2 + 1], r, 0, TAU); }
		bg.fill();
	}
	// the year (2x): paint the steps gained (alpha composes); back: repaint
	function visit(y) {
		var og = (ov = ov || layer()).getContext('2d'), by = {}, j, k, q, d;
		tau || yp();
		if (y < lastY) { og.clearRect(0, 0, w, h); kk.fill(0); }
		lastY = y;
		for (j = 0; j < n; j++) {
			for (k = 0, q = off[j]; q < off[j + 1]; q++) k += visits(y, tau[q]);
			if ((d = k - kk[j]) > 0 && j !== mark) { kk[j] = k; (by[q = reg[j] * 64 + d] = by[q] || []).push(j); }
		}
		for (q in by) dots(og, by[q].forEach.bind(by[q]), col.near, shade(q & 63, wv[q >> 6].list.length * WS, wv[q >> 6].o));
	}
	var drivers = {}, forced = false, settle = function() {};
	host.querySelectorAll('.w05-drive').forEach(function(el) { drivers[el.dataset.step] = el; });
	function draw() {
		// an inactive slide draws nothing, unless warmed (below)
		if (!slide.hasAttribute('data-deck-active') && !forced) return;
		colors();
		var view = Number(slide.dataset.view || 0), drv = drivers[String(view)];
		var dp = drv ? Number(drv.style.getPropertyValue('--p') || 1) : 1, s = stateAt(plan, view, dp);
		var e0 = s.entry.k === 0 && s.p < 1 && (s.entry.from !== s.entry.to || !!wv), yr = wv && e0;
		var pd = yr ? clamp(s.p / yw[0]) : s.p, pe = yr ? clamp((s.p - yw[1]) / (1 - yw[1])) : s.p;
		var moving = s.entry.from !== s.entry.to && pd < 1;
		// a country rising on press 0: 1x squares, the 2x one baked
		var rise = !!drv && !wv && s.entry.k === 0 && s.entry.from === s.entry.to && /country/.test(s.entry.to) && s.p < 1;
		var key = s.entry.k + ':' + (e0 || moving || rise ? s.p.toFixed(4) : 'still');
		if (key === last) return;
		last = key;
		settle(drv, dp);
		var dust = s.entry.from === 'scatter';
		// the settled country is baked a slice per frame
		if (ready && wv && !tau) yp();
		else if (ready && (wv && moving || rise)) bake(Math.min(n, baked + Math.ceil(n / 16)));
		// a rising country starts as its outline
		if (!ready && rise && s.p < .15) {
			res(1);
			ctx.clearRect(0, 0, w, h);
			outline(ctx, 1);
			return;
		}
		// dust at p 0: the scatter alone, before any sampling
		if (!ready && dust && s.p === 0) {
			pos.set(scatter(n, w, h, seed));
			res(1);
			ctx.clearRect(0, 0, w, h);
			sq = true;
			dots(ctx, function(f) { for (var j = 0; j < n; j++) f(j); }, col.dot, 1);
			return;
		}
		if (!ready) prep();
		var from = layout(s.entry.from), to = layout(s.entry.to);
		sq = moving || rise;
		// a regroup pours left to right, straight
		if (moving && !dust) for (var g = layout(s.entry.to.indexOf('groups') ? s.entry.from : s.entry.to), i = 0; i < n; i++) ord[i] = 0.4 * g[i * 2] / w;
		if (moving) lerpDots(from, to, dust ? delay : ord, dust ? curl : flat, pd, pos, dust ? 1 : 0.875); else pos.set(to);
		res(moving || rise ? 1 : DPR);
		ctx.clearRect(0, 0, w, h);
		var C = /country|floor/, shown = C.test(s.entry.to) ? (moving ? seg(pd, 0.55, 1) : 1) : C.test(s.entry.from) && moving ? 1 - seg(pd, 0, 0.3) : 0;
		if (yr && !moving || baked >= n && shown === 1 && !moving && !rise) {
			// the baked country; faint under the year's visits
			if (yr) bake(n);
			var y = (s.p - yw[0]) / (yw[1] - yw[0]);
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.globalAlpha = yr ? 1 - 0.7 * seg(y, 0, 0.15) * (1 - seg(pe, 0, 0.4)) : 1;
			ctx.drawImage(base, 0, 0);
			if (yr) {
				visit(Math.min(1, y));
				ctx.globalAlpha = 1 - seg(pe, 0, 0.5);
				ctx.drawImage(ov, 0, 0);
			}
			ctx.globalAlpha = 1;
			ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
		} else {
			outline(ctx, shown);
			dots(ctx, all, col.dot, 1);
		}
		var pm = wv ? pe : s.p, nx = fields[fields.indexOf(self) + 1];
		if (nx && !forced && (moving || e0) && s.p > 0.25) nx.pre();
		dots(ctx, function(f) { near.forEach(f); }, col.near, C.test(s.entry.to) ? (e0 ? seg(pm, 0.7, 0.9) : 1) : 0);
		if (mark >= 0) {
			mx = pos[mark * 2]; my = pos[mark * 2 + 1];
			var grow = e0 ? seg(pm, 0.72, 0.95) : 1;
			ctx.fillStyle = grow > 0 ? col.mark : col.dot;
			ctx.beginPath();
			ctx.arc(mx, my, r + (8 - r) * grow, 0, TAU);
			ctx.fill();
			var ringP = e0 ? seg(pm, 0.8, 1) : 1;
			if (ringP > 0) {
				pen(ctx, col.ink, 2);
				ctx.arc(mx, my, 8 + 6 * ringP, 0, TAU * ringP);
				ctx.stroke();
			}
		}
	}
	// warm: the next field paints once when this one rests
	// pre: while the field before moves, sample, then bake
	var self = { warm: function() { if (last) return false; forced = true; draw(); forced = false; return true; },
		pre: function() { colors(); if (!ready) prep(); else if (baked < n) bake(Math.min(n, baked + Math.ceil(n / 16))); else return false; return true; } };
	fields.push(self);
	settle = function(drv, dp) {
		if (forced || !drv || dp < 1) return;
		for (var k = fields.indexOf(self) + 1; k < fields.length; k++) if (fields[k].warm()) return;
	};
	new MutationObserver(draw).observe(slide, { attributes: true, attributeFilter: ['data-view', 'data-deck-active'] });
	draw();
}
var fields = [];
document.querySelectorAll('canvas[data-w05-field]').forEach(mount);
})();
