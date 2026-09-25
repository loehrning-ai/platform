// failure-anatomy (spec C.7): lays the Truth Chart out with the shared Story.chart.bars() geometry, from the
// sealed record, so resolution can reuse identical geometry. The markup already carries the same numbers
// (authored final state); render only re-applies them, so it is synchronous and idempotent.
(() => {
  const ID = "failure-anatomy";
  const CHART = Object.freeze({ width: 960, height: 272, groupGap: 96, barGap: 16 });
  const LABEL_ABOVE = 12;
  const LABEL_BELOW = 34;
  // Until the database check arrives (steps 0–3) the recorded-run bars are drawn ZOOM× taller on the same zero
  // line, so a 6 px May bar is readable from the back row; the chart says so, and step 4 animates them back to
  // the shared scale as the database bars grow. The shared geometry stays the authored (honest) end state.
  const ZOOM = 3;
  const MONTHS = [0, 1, 2];
  const round = (value) => String(Math.round(value * 100) / 100);

  function sealedSeries() {
    const run = MONTHS.map((row) => Number(Story.sealed.capture("bad", "G01")?.rows?.[row]?.ending_mrr));
    const check = MONTHS.map((row) => Number(Story.sealed.truth("G01")?.rows?.[row]?.ending_mrr_eur));
    return [...run, ...check].every(Number.isFinite) ? [run, check] : null;
  }

  Story.register(ID, {
    render(ctx) {
      const series = sealedSeries();
      if (!series) return;
      const chart = Story.chart.bars({ series, ...CHART });
      chart.bars.forEach((bar) => {
        const rect = ctx.q(`#${ID}-bar-${bar.series}-${bar.group}`);
        const label = ctx.q(`#${ID}-label-${bar.series}-${bar.group}`);
        if (rect) {
          rect.setAttribute("x", round(bar.x));
          rect.setAttribute("y", round(bar.y));
          rect.setAttribute("width", round(bar.width));
          rect.setAttribute("height", round(bar.height));
        }
        if (label) {
          label.setAttribute("x", round(bar.x + bar.width / 2));
          label.setAttribute("y", round(bar.negative ? bar.y + bar.height + LABEL_BELOW : bar.y - LABEL_ABOVE));
        }
        if (bar.series === 0) {
          const zoomed = bar.height * ZOOM;
          rect?.style.setProperty("--fa-zoom-y", `${round(bar.negative ? bar.y : chart.zeroY - zoomed)}px`);
          rect?.style.setProperty("--fa-zoom-h", `${round(zoomed)}px`);
          label?.style.setProperty("--fa-zoom-dy", `${round((bar.negative ? 1 : -1) * (zoomed - bar.height) - (bar.negative ? 4 : 0))}px`);
          const month = ctx.qa(".fa-month")[bar.group];
          if (month) month.style.setProperty("--fa-month-dx", `${round(bar.x + bar.width / 2 - Number(month.getAttribute("x")))}px`);
        }
      });
      ctx.q(`#${ID}-chart`)?.setAttribute("data-zoom", String(ZOOM));
      const zero = ctx.q(`#${ID}-zero`);
      if (zero) {
        zero.setAttribute("y1", round(chart.zeroY));
        zero.setAttribute("y2", round(chart.zeroY));
      }
    },
  });
})();
