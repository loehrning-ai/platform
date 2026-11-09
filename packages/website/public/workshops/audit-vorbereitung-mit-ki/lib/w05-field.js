/* w05-field.js: the W05 dot field (canvas 2D), a pure function of press and --p (scenes.js). Seeded, no clock, no listener;
 * idle when inactive or still; reduced motion is p = 1. Canvas data and layouts: see field() in deck-src/scene.mjs. */
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
		var x = clamp((p - d[i / 2] * k) / (1 - 0.4 * k)), e = x < .5 ? 4 * x * x * x : 1 - Math.pow(2 - 2 * x, 3) / 2, ax = a[i], ay = a[i + 1], bx = b[i], by = b[i + 1];
		var bow = Math.sin(Math.PI * e) * curl[i / 2] * k;
		out[i] = ax + (bx - ax) * e - (by - ay) * bow;
		out[i + 1] = ay + (by - ay) * e + (bx - ax) * bow;
	}
}
var api = {
	mulberry32: mulberry32, projector: projector, stipple: stipple,
	scatter: scatter, shares: shares, groupsGeometry: groupsGeometry, groups: groups, nearest: nearest,
	parsePlan: parsePlan, stateAt: stateAt, lerpDots: lerpDots, seg: seg,
};
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof document === 'undefined') return;
var nums = function(text) { return String(text || '').split(',').filter(Boolean).map(Number); };
function mount(canvas) {
	var slide = canvas.closest('section.slide'), host = canvas.closest('[data-step]');
	var ring = window.ESG_GEO && window.ESG_GEO.macedonia && window.ESG_GEO.macedonia[0];
	if (!slide || !host || !ring) return;
	var ds = canvas.dataset, w = canvas.width / DPR, h = canvas.height / DPR, pad = Number(ds.pad || 24);
	var n = Number(ds.n), seed = Number(ds.seed || 1), plan = parsePlan(ds.plan);
	var pr = projector(ring, w, h, pad), poly = ring.map(function(q) { return [pr.x(q[0]), pr.y(q[1])]; });
	var st = stipple(poly, n, w, h, seed), country = st.pts;
	var markLL = nums(ds.mark), mark = -1;
	if (markLL.length === 2) {
		mark = nearest(country, pr.x(markLL[0]), pr.y(markLL[1]));
		country[mark * 2] = pr.x(markLL[0]);
		country[mark * 2 + 1] = pr.y(markLL[1]);
	}
	var regions = String(ds.regions || '').split(';').filter(Boolean).map(function(r) {
		var v = nums(r);
		return { x: pr.x(v[0]), y: pr.y(v[1]), v: v[2] };
	});
	var cache = {};
	function layout(name) {
		if (cache[name]) return cache[name];
		var key = name.split(':')[1];
		var pts = name === 'scatter' ? scatter(n, w, h, seed)
			: key && name.indexOf('groups') === 0 ? groups(country, nums(canvas.getAttribute('data-groups-' + key)), w, h, { pad: pad }, mark, Number(canvas.getAttribute('data-mark-group-' + key) || -1))
				: country;
		cache[name] = pts;
		return pts;
	}
	var cx = 0, cy = 0, maxd = 0, i, ord = new Float32Array(n), flat = new Float32Array(n);
	var rnd = mulberry32(seed ^ 0xbeef), delay = new Float32Array(n), curl = new Float32Array(n);
	var hyp = function(j, x, y) { return Math.hypot(country[j * 2] - x, country[j * 2 + 1] - y); };
	for (i = 0; i < n; i++) { cx += country[i * 2] / n; cy += country[i * 2 + 1] / n; }
	for (i = 0; i < n; i++) maxd = Math.max(maxd, hyp(i, cx, cy));
	for (i = 0; i < n; i++) {
		delay[i] = 0.4 * (0.65 * (1 - hyp(i, cx, cy) / maxd) + 0.35 * rnd());
		curl[i] = (rnd() - 0.5) * 0.5;
	}
	// data-near: the town around the mark
	var mx = country[mark * 2], my = country[mark * 2 + 1], near = mark < 0 ? [] : country.slice(0, n).map(function(_, j) { return j; })
		.sort(function(a, b) { return hyp(a, mx, my) - hyp(b, mx, my) || a - b; }).slice(1, 1 + Number(ds.near || 0));
	var ctx = canvas.getContext('2d'), pos = new Float32Array(n * 2), last = '';
	var css = getComputedStyle(canvas), col = {}, r = Math.max(1.3, Math.min(3, st.spacing * 0.27));
	['dot', 'line', 'ring', 'mark', 'ink', 'near'].forEach(function(k) { col[k] = css.getPropertyValue('--w05-field-' + k).trim(); });
	// dot sprites: no snap
	var zs = Math.ceil(2 * r) + 1, spr = [col.dot, col.near || col.dot].map(function(c) {
		var o = document.createElement('canvas'), g = o.getContext('2d');
		o.width = o.height = zs * DPR;
		g.fillStyle = c;
		g.arc(zs, zs, r * DPR, 0, TAU);
		g.fill();
		return o;
	});
	var pen = function(c, lw) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); };
	var drivers = {};
	host.querySelectorAll('.w05-drive').forEach(function(el) { drivers[el.dataset.step] = el; });
	function draw() {
		if (!slide.hasAttribute('data-deck-active') && last !== '') return;
		var view = Number(slide.dataset.view || 0), drv = drivers[String(view)];
		var dp = drv ? Number(drv.style.getPropertyValue('--p') || 1) : 1, s = stateAt(plan, view, dp);
		var moving = s.entry.from !== s.entry.to && s.p < 1, e0 = s.entry.k === 0 && moving;
		var key = s.entry.k + ':' + (moving ? s.p.toFixed(4) : 'still');
		if (key === last) return;
		last = key;
		var from = layout(s.entry.from), to = layout(s.entry.to), dust = s.entry.from === 'scatter';
		// a regroup pours left to right, straight
		if (moving && !dust) for (var g = layout(s.entry.to.indexOf('groups') ? s.entry.from : s.entry.to), i = 0; i < n; i++) ord[i] = 0.4 * g[i * 2] / w;
		if (moving) lerpDots(from, to, dust ? delay : ord, dust ? curl : flat, s.p, pos, dust ? 1 : 0.875); else pos.set(to);
		ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
		ctx.clearRect(0, 0, w, h);
		var C = /country|regions|floor/, shown = C.test(s.entry.to) ? (moving ? seg(s.p, 0.55, 1) : 1) : C.test(s.entry.from) && moving ? 1 - seg(s.p, 0, 0.3) : 0;
		if (ds.outline !== undefined && shown > 0) {
			ctx.globalAlpha = shown;
			pen(col.line, 1.5);
			poly.forEach(function(p) { ctx.lineTo(p[0], p[1]); });
			ctx.closePath();
			ctx.stroke();
		}
		ctx.globalAlpha = 1;
		var dot = function(j, c) { ctx.drawImage(spr[c], pos[j * 2] - zs / 2, pos[j * 2 + 1] - zs / 2, zs, zs); };
		for (i = 0; i < n; i++) if (i !== mark) dot(i, 0);
		ctx.globalAlpha = C.test(s.entry.to) ? (e0 ? seg(s.p, 0.7, 0.9) : 1) : 0;
		near.forEach(function(j) { dot(j, 1); });
		ctx.globalAlpha = 1;
		if (regions.length && /regions/.test(s.entry.to)) {
			var vmax = Math.max.apply(0, regions.map(function(g) { return g.v; }));
			regions.forEach(function(g, j) {
				var q = /regions/.test(s.entry.from) ? 1 : seg(s.p, j * 0.06, 0.55 + j * 0.06);
				if (q <= 0) return;
				pen(col.ring, 2);
				ctx.arc(g.x, g.y, q * 64 * Math.sqrt(g.v / vmax), 0, TAU);
				ctx.stroke();
			});
		}
		if (mark >= 0) {
			mx = pos[mark * 2]; my = pos[mark * 2 + 1];
			var grow = e0 ? seg(s.p, 0.72, 0.95) : 1;
			ctx.fillStyle = grow > 0 ? col.mark : col.dot;
			ctx.beginPath();
			ctx.arc(mx, my, r + (8 - r) * grow, 0, TAU);
			ctx.fill();
			var ringP = e0 ? seg(s.p, 0.8, 1) : 1;
			if (ringP > 0) {
				pen(col.ink, 2);
				ctx.arc(mx, my, 8 + 6 * ringP, 0, TAU * ringP);
				ctx.stroke();
			}
		}
	}
	new MutationObserver(draw).observe(slide, { attributes: true, attributeFilter: ['data-view', 'data-deck-active'] });
	draw();
}
document.querySelectorAll('canvas[data-w05-field]').forEach(mount);
})();
