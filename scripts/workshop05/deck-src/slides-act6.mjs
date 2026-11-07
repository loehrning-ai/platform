/**
 * Act 6, other doors, your own case, questions (S22 taxsheet, S23 isosheet, S24 notmeasured, S25 transfer, S26 close).
 * The days row is driven by lib/w05-days.js (anchor #w05-days-anchor); the vote on S26 is the poll door-end with the
 * grey bars of the first vote (data-poll-show="door").
 */
import { makeParts } from "./slides-parts.mjs";

export default function makeAct6(H) {
  const { s, stagger, ico, ico5, hd, foot, esc } = H;
  const P = makeParts(H);
  const { split } = P;

  /* ── S22 taxsheet ────────────────────────────────────────────────── */
  function taxsheet(d, c) {
    const x = c.s.taxsheet;
    const station = (k, icon, label, extra = "") =>
      `<li class="tx__st tx__st--${k}"><i class="tx__node"${s(k, { fx: "pop", win: "0,.4", out: 5 })}>${ico(icon)}</i><p class="tx__lab"${s(k, { fx: "fade", win: ".2,.8", out: 5 })}>${esc(label)}</p>${extra}</li>`;
    const stop = `<p class="tx__lab tx__lab--sub"${s(4, { fx: "fade", win: ".3,1", out: 5 })}>${esc(x.noStop)}</p>`;
    return `${hd(x.title, { attrs: s(0, { fx: "fade", out: 4 }) })}
<div class="stage tx__stage">
<p class="tx__zin"${s(0, { fx: "fade", win: ".2,.7", out: 3 })}><a href="#a1">${esc(x.zin)}</a></p>
<p class="tx__survey"${s(0, { fx: "fade", win: ".5,1", out: 1 })}>${esc(x.survey)}</p>
<a class="tx__a3" href="#a3" aria-label="${esc(x.sources)}"${s(0, { fx: "fade", win: ".6,1", keep: true })}>${ico("book")}</a>
<ol class="tx__track">
<i class="tx__rail" aria-hidden="true"${s(1, { fx: "line", win: "0,1", out: 5 })}></i>
${station(1, "calendar", x.notice)}
${station(2, "file", x.books)}
${station(3, "scale", x.findings)}
<li class="tx__st tx__st--4"><i class="tx__node"${s(4, { fx: "pop", win: "0,.4", out: 5 })}>${ico("alert")}</i><p class="tx__lab"${s(4, { fx: "fade", win: ".2,.8", out: 5 })}>${esc(x.lawsuit)}</p>${stop}</li>
</ol>
<div class="tx__ledger" aria-hidden="false">
<div class="tx__cells" aria-hidden="true"${s(2, { fx: "fade", win: "0,.5", out: 5 })}><i class="sk"></i><i class="sk tx__new"></i><i class="sk w05-ghost tx__old"${s(2, { fx: "none", win: ".4,1", out: 4 })}></i></div>
<p class="tx__ghostlab"${s(2, { fx: "fade", win: ".4,1", out: 4 })}>${esc(x.ghost)}</p>
<blockquote class="tx__quote"${s(2, { fx: "type", ease: "linear", win: ".3,1", out: 5 })}><p class="qd" lang="mk">${esc(x.quote)}</p><p class="qd-gloss">${esc(x.gloss)}</p></blockquote>
</div>
<p class="tx__big tx__who"${s(5, { fx: "fade", win: "0,.6", out: 6 })}>${ico("people")}<span>${esc(x.who)}</span></p>
<p class="tx__big tx__cost"${s(6, { fx: "fade", win: "0,.6", out: 7 })}>${ico("euro")}<span>${esc(x.cost)}</span></p>
<p class="tx__big tx__ai"${s(7, { fx: "fade", win: "0,.6" })}>${ico("shield")}<span>${esc(x.ai)}</span></p>
</div>
${foot(c, 22)}`;
  }

  /* ── S23 isosheet ────────────────────────────────────────────────── */
  function isosheet(d, c) {
    const x = c.s.isosheet;
    const bands = [25, 45, 65];
    const labels = x.bands;
    const btns = bands
      .map((n, i) => `<button class="w05-days__band" type="button" data-band="${n}" aria-pressed="${i === 0 ? "true" : "false"}"${s(0, { fx: "pop", win: stagger(i, 3, 0.4, 0, 1), out: 2 })}>${esc(labels[i])}</button>`)
      .join("");
    const tiles = Array.from({ length: 5 }, () => `<li class="w05-days__tile" data-day-tile></li>`).join("");
    return `${hd(x.question, { attrs: s(0, { fx: "fade", out: 1 }) })}
<div class="stage is__stage">
<div id="w05-days-anchor" class="w05-days is__days"${s(0, { fx: "none", win: ".1,1" })}>
<p class="w05-days__marker"${s(0, { fx: "pop", win: ".4,1", out: 2 })}>${esc(x.marker)}</p>
<div class="w05-days__bands">${btns}</div>
<ol class="w05-days__tiles">${tiles}</ol>
<b class="w05-days__out fig is__out" data-days-out aria-live="polite">3</b>
<p class="is__eff"${s(0, { fx: "fade", win: ".5,1", out: 2 })}>${esc(x.effective)}</p>
<p class="is__init"${s(0, { fx: "fade", win: ".6,1", out: 2 })}>${esc(x.initial)}</p>
<p class="out is__legend">${esc(x.legend)}</p>
</div>
<div class="is__bars" aria-hidden="true">
<i class="is__bar is__bar--full"${s(1, { fx: "line", win: "0,.5" })}></i>
<i class="is__bar is__bar--third"${s(1, { fx: "line", win: ".3,.7" })}></i>
<i class="is__bar is__bar--two"${s(1, { fx: "line", win: ".5,1" })}></i>
</div>
<p class="is__follow"${s(1, { fx: "fade", win: ".4,1", out: 2 })}>${esc(x.follow)}</p>
<div class="is__col">
<p class="is__t is__jams"${s(2, { fx: "fade", win: "0,.6", out: 3 })}>${esc(x.jams)}</p>
<p class="is__t is__price"${s(3, { fx: "fade", win: ".3,1", out: 4 })}>${esc(x.price)}</p>
<p class="is__t is__fix"${s(2, { fx: "fade", win: ".3,.9", out: 3 })}>${esc(x.fix)}</p>
<p class="is__t is__who"${s(4, { fx: "fade", win: "0,.6" })}>${esc(x.who)}</p>
<p class="is__t is__may"${s(4, { fx: "fade", win: ".3,1", out: 5 })}>${esc(x.aiMay)}</p>
<p class="is__t is__never"${s(5, { fx: "fade", win: "0,.6" })}>${esc(x.aiNever)}</p>
</div>
<div class="is__coins" aria-hidden="true"><i${s(3, { fx: "pop", win: "0,.5", out: 4 })}>${ico5("coin")}</i><i${s(3, { fx: "pop", win: ".3,.8", out: 4 })}>${ico5("coin")}</i></div>
</div>
${foot(c, 23)}`;
  }

  /* ── S24 notmeasured ─────────────────────────────────────────────── */
  function notmeasured(d, c) {
    const x = c.s.notmeasured;
    const boxes = split(x.boxes)
      .map((label, i) => `<span class="nm__box fig"${s(0, { fx: "pop", win: stagger(i, 6, 0.3, 0, 1) })}><i class="nm__q" aria-hidden="true">${ico("search")}</i><span>${esc(label)}</span></span>`)
      .join("");
    return `${hd(x.title, { attrs: s(0, { fx: "fade", out: 1 }) })}
<div class="stage nm__stage">
<a class="nm__boxes" href="#a4" aria-label="${esc(x.more)}">${boxes}</a>
<p class="nm__known"${s(1, { fx: "fade", win: "0,.7" })}>${esc(x.known)}</p>
</div>
${foot(c, 24)}`;
  }

  /* ── S25 transfer ────────────────────────────────────────────────── */
  function transfer(d, c) {
    const x = c.s.transfer;
    const labels = x.labels;
    const ex = x.examples;
    const box = (i) => {
      const k = i + 1;
      return `<li class="tr__box tr__box--${k}"><p class="tr__lab"${s(k, { fx: "type", ease: "linear", win: "0,.7" })}>${esc(labels[i])}</p>${
        i < ex.length ? `<p class="tr__ex"${s(k, { fx: "fade", win: ".5,1", out: k + 1 })}>${esc(ex[i])}</p>` : `<p class="tr__sent"${s(k, { fx: "fade", win: ".4,1" })}>${esc(x.sentence)}</p>`
      }</li>`;
    };
    return `${hd(x.title, { attrs: s(0, { fx: "fade" }) })}
<div class="stage tr__stage">
<div class="tr__sheet w05-unfold"${s(0, { fx: "none", win: "0,.8" })}><ol class="tr__grid">${labels.map((_, i) => box(i)).join("")}</ol></div>
</div>
${foot(c, 25)}`;
  }

  /* ── S26 close ───────────────────────────────────────────────────── */
  function close(d, c) {
    const x = c.s.close;
    const ed = d.lang === "en" ? "-en" : "";
    const bars = [0, 1, 2, 3].map((i) => `<i data-value="${i}"></i>`).join("");
    const btns = x.options
      .map((label, i) => `<button class="poll__opt cl__opt" type="button" data-poll="door-end" data-value="${i}"${s(0, { fx: "pop", win: stagger(i, 4, 0.4, 0, 1), out: 1 })}><span>${esc(label)}</span><span data-poll-n>0</span></button>`)
      .join("");
    const papers = split(x.papers).map((p) => `<span class="cl__paper">${esc(p)}</span>`).join("");
    const codes = ["kit", "demo", "skill"];
    const qrs = codes
      .map((code, i) => `<figure class="qr cl__qr"${s(2, { fx: "pop", win: stagger(i, 3, 0.4, 0, 1) })}><img src="./assets/qr-${code}-g26${ed}.svg" width="260" height="260" alt="${esc(x.codes[i])}"><figcaption>${esc(x.codes[i])}</figcaption></figure>`)
      .join("");
    return `${hd(x.question, { attrs: s(0, { fx: "fade", out: 1 }) })}
<div class="stage cl__stage">
<div class="cl__vote">
<div class="cl__ghost w05-ghost w05-ghost--ink" data-poll-show="door"${s(0, { fx: "none", win: ".1,1", out: 1 })} aria-hidden="true">${bars}</div>
<div class="cl__btns">${btns}</div>
</div>
<p class="cl__hold"${s(0, { fx: "fade", win: ".5,1", out: 1 })}>${esc(x.hold)}</p>
<p class="cl__paperq"${s(1, { fx: "fade", win: "0,.5", out: 2 })}>${esc(x.paper)}</p>
<div class="cl__papers"${s(1, { fx: "fade", win: ".3,1", out: 2 })}>${papers}</div>
<div class="cl__qrs">${qrs}</div>
<p class="cl__questions"${s(3, { fx: "fade", win: ".3,1" })}>${esc(x.questions)}</p>
</div>
${foot(c, 26)}`;
  }

  return { taxsheet, isosheet, notmeasured, transfer, close };
}
