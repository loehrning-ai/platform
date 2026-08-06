/* ==========================================================================
   loehrning.ai — Deck data-viz (Das Ö)  ·  classic script, file://-safe
   Builds the animated data visuals for the CRAFT spine. Data is inlined
   (no fetch), values reconciled to the sealed September CSVs.
   Exposes window.DeckViz = { play(slide, {reduce}), reset(slide) }.
   ========================================================================== */
(function(){
  // revenue €M + September NCR count per line (0 = no NCRs recorded, shown "—")
  var LINES = [
    { n:'AURA',  rev:7.96, ncr:18 },
    { n:'CRAFT', rev:4.12, ncr:23, hot:true },
    { n:'ECHO',  rev:3.16, ncr:0  },
    { n:'NEST',  rev:2.21, ncr:19 },
    { n:'BREW',  rev:2.07, ncr:0  },
    { n:'PULSE', rev:1.91, ncr:11 },
    { n:'BEAM',  rev:0.25, ncr:0  }
  ];
  var MAXREV = 7.96;

  function el(tag, cls, txt){ var e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }
  function each(list, fn){ Array.prototype.forEach.call(list, fn); }

  // ── revenue-by-line + defect flag (slide 03) ──────────────────────────
  function buildTension(slot){
    if (slot.dataset.built) return;
    slot.dataset.built = '1';
    var wrap = el('div','viz-rank');
    LINES.forEach(function(L){
      var row = el('div','vr-row'+(L.hot?' hot':''));
      row.appendChild(el('span','vr-name', L.n));
      var track = el('span','vr-track');
      var fill = el('span','vr-fill'); fill.dataset.w = (L.rev/MAXREV*100).toFixed(1)+'%';
      track.appendChild(fill); row.appendChild(track);
      var val = el('span','vr-val');
      val.appendChild(document.createTextNode('€'+L.rev.toFixed(2)+'M'));
      var chip = el('span', null, (L.ncr>0 ? L.ncr+' NCR' : '— NCR'));
      chip.style.cssText = 'margin-left:16px;font-weight:'+(L.ncr>0?'700':'400')+
        ';color:'+(L.hot?'var(--mennige)':(L.ncr>0?'var(--ink)':'var(--muted)'))+
        (L.ncr>0?'':';opacity:.45');
      val.appendChild(chip);
      row.appendChild(val);
      wrap.appendChild(row);
    });
    var cap = el('div', null, 'Revenue by line, September · CRAFT — #2 revenue, #6 volume, most defects');
    cap.style.cssText = 'font-family:var(--mono);font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-top:20px';
    slot.appendChild(wrap); slot.appendChild(cap);
  }

  // ── two-months-running NCR motif (slide 11, on dark) ──────────────────
  function buildNcr(slot){
    if (slot.dataset.built) return;
    slot.dataset.built = '1';
    var GROUPS = [ { cap:'Aug', craft:24, field:12 }, { cap:'Sep', craft:23, field:19 } ];
    var MAXN = 24;
    var wrap = el('div','viz-ncr');
    GROUPS.forEach(function(G){
      var c1 = el('div','nc-col');
      c1.appendChild(el('span','nc-val', String(G.craft)));
      var b1 = el('span','nc-bar'); b1.dataset.h = (G.craft/MAXN*150).toFixed(0)+'px';
      c1.appendChild(b1);
      c1.appendChild(el('span','nc-cap','CRAFT '+G.cap));
      wrap.appendChild(c1);

      var c2 = el('div','nc-col');
      var v2 = el('span','nc-val', String(G.field)); v2.style.opacity='.5';
      c2.appendChild(v2);
      var b2 = el('span','nc-bar ghost'); b2.dataset.h = (G.field/MAXN*150).toFixed(0)+'px';
      c2.appendChild(b2);
      var cp = el('span','nc-cap','NEST — next worst'); cp.style.opacity='.5';
      c2.appendChild(cp);
      wrap.appendChild(c2);
    });
    slot.appendChild(wrap);
  }

  function animate(slot, reduce){
    each(slot.querySelectorAll('.vr-fill'), function(f,i){
      if (reduce){ f.style.width = f.dataset.w; return; }
      f.style.width = '0';
      setTimeout(function(){ f.style.width = f.dataset.w; }, 120 + i*90);
    });
    each(slot.querySelectorAll('.nc-bar'), function(b,i){
      if (reduce){ b.style.height = b.dataset.h; return; }
      b.style.height = '0';
      setTimeout(function(){ b.style.height = b.dataset.h; }, 160 + i*120);
    });
  }

  function resetSlot(slot){
    each(slot.querySelectorAll('.vr-fill'), function(f){ f.style.width = '0'; });
    each(slot.querySelectorAll('.nc-bar'), function(b){ b.style.height = '0'; });
  }

  window.DeckViz = {
    play: function(s, opts){
      opts = opts || {};
      each(s.querySelectorAll('[data-viz="tension"]'), function(slot){ buildTension(slot); animate(slot, opts.reduce); });
      each(s.querySelectorAll('[data-viz="ncr"]'),     function(slot){ buildNcr(slot);     animate(slot, opts.reduce); });
    },
    reset: function(s){
      if (!s) return;
      each(s.querySelectorAll('[data-viz="tension"],[data-viz="ncr"]'), resetSlot);
    }
  };
})();
