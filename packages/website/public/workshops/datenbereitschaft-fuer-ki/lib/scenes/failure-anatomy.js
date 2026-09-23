// failure-anatomy (spec C.7): lays the Truth Chart out with the shared Story.chart.bars() geometry, from the
// sealed record, so resolution can reuse identical geometry. The markup already carries the same numbers
// (authored final state); render only re-applies them, so it is synchronous and idempotent.
(() => {
  const ID = "failure-anatomy";
  const CHART = Object.freeze({ width: 960, height: 272, groupGap: 96, barGap: 16 });
  const LABEL_ABOVE = 12;
  const LABEL_BELOW = 34;
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
      });
      const zero = ctx.q(`#${ID}-zero`);
      if (zero) {
        zero.setAttribute("y1", round(chart.zeroY));
        zero.setAttribute("y2", round(chart.zeroY));
      }
    },
  });
})();
