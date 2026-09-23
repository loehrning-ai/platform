// resolution (spec C.18): lays the Truth Chart out with the shared Story.chart.bars() geometry, the same
// parameters failure-anatomy uses, now with three series (export tables run, approved views run, database
// check). The markup already carries the final geometry and numbers; render only re-applies them from the
// sealed record, so it is synchronous and idempotent.
(() => {
  const ID = "resolution";
  const CHART = Object.freeze({ width: 960, height: 272, groupGap: 96, barGap: 16 });
  const LABEL_ABOVE = 12;
  const LABEL_BELOW = 34;
  const EQ_SIZE = 40;
  const EQ_DROP = 24;
  const MONTHS = [0, 1, 2];
  const round = (value) => String(Math.round(value * 100) / 100);

  function sealedSeries() {
    const exportRun = MONTHS.map((row) => Number(Story.sealed.capture("bad", "G01")?.rows?.[row]?.ending_mrr));
    const approvedRun = MONTHS.map((row) => Number(Story.sealed.capture("ready", "G01")?.rows?.[row]?.ending_mrr_eur));
    const check = MONTHS.map((row) => Number(Story.sealed.truth("G01")?.rows?.[row]?.ending_mrr_eur));
    return [...exportRun, ...approvedRun, ...check].every(Number.isFinite) ? [exportRun, approvedRun, check] : null;
  }

  function setAll(element, attributes) {
    if (!element) return;
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, round(value)));
  }

  Story.register(ID, {
    render(ctx) {
      const series = sealedSeries();
      if (!series) return;
      const chart = Story.chart.bars({ series, ...CHART });
      const at = (seriesIndex, group) => chart.bars.find((bar) => bar.series === seriesIndex && bar.group === group);
      chart.bars.forEach((bar) => {
        setAll(ctx.q(`#${ID}-bar-${bar.series}-${bar.group}`), { x: bar.x, y: bar.y, width: bar.width, height: bar.height });
      });
      MONTHS.forEach((group) => {
        const exportBar = at(0, group);
        const approved = at(1, group);
        const check = at(2, group);
        const exportLabel = ctx.q(`#${ID}-label-0-${group}`);
        if (exportBar.negative) setAll(exportLabel, { x: exportBar.x, y: exportBar.y + exportBar.height + LABEL_BELOW });
        else setAll(exportLabel, { x: exportBar.x + exportBar.width, y: exportBar.y - LABEL_ABOVE });
        const pairTop = Math.min(approved.y, check.y);
        setAll(ctx.q(`#${ID}-label-1-${group}`), { x: approved.x + (check.x + check.width - approved.x) / 2, y: pairTop - LABEL_ABOVE });
        const gapCentre = approved.x + approved.width + (check.x - approved.x - approved.width) / 2;
        ctx.q(`#${ID}-eq-${group}`)?.setAttribute("transform", `translate(${round(gapCentre - EQ_SIZE / 2)} ${round(pairTop + EQ_DROP)})`);
      });
      const zero = ctx.q(`#${ID}-zero`);
      setAll(zero, { y1: chart.zeroY, y2: chart.zeroY });
    },
  });
})();
