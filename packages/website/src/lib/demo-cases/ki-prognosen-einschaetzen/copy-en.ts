/**
 * Demo 01 "1.050 Stück, sieben Morgen": every word the demo shows in English.
 * du, real umlauts, no em or en dashes; U+2212 only in signed numbers. Store
 * names are invented; the UI writes "Standort {name}" in sentences so German
 * articles never vary.
 */
import type { Locale } from "@/lib/i18n/locale";
import { withTriplesTogether, type ForecastCopy } from "./copy-types";
import { fmtInt, fmtPct, MINUS } from "./fmt";
import type { SplitMessage } from "./logic";

/* ─── English ─────────────────────────────────────────────────────────── */

const EN_STORES = ["City centre", "Edge of town", "Small town"] as const;
const EN_IN_SENTENCE = ["the city centre site", "the edge-of-town site", "the small-town site"] as const;
const EN_AT_START = ["The city centre site", "The edge-of-town site", "The small-town site"] as const;

function mornings(h: number): string {
  return h === 0 ? "On no morning" : h === 1 ? "On one morning" : `On ${h} mornings`;
}

/** "morning" for one day, "mornings" for more. */
function enMornings(count: number): string {
  return count === 1 ? "morning" : "mornings";
}

function enMessage(m: SplitMessage, locale: Locale): string {
  const n = (value: number) => fmtInt(value, locale);
  const p = (value: number) => fmtPct(value, locale, 1);
  const p0 = (value: number) => fmtPct(value, locale, 0);
  switch (m.kind) {
    case "equal":
      return `Equal shares sound fair, but the small town gets ${p0(m.coverageSmall)} of its median and the city centre ${p0(m.coverageCentre)}: ${n(m.unsold)} units are left over, and the city centre sends ${n(m.shortCentre)} customers home without one.`;
    case "overAsk":
      return `${EN_AT_START[m.store]} gets more than it asked for (${n(m.alloc)} instead of ${n(m.ask)}). At median demand ${n(m.left)} are left over there, while ${EN_IN_SENTENCE[m.shortStore]} sends ${n(m.short)} customers home without a unit.`;
    case "overMedian":
      return `${EN_AT_START[m.store]} is ${n(m.over)} over its median. At median demand those ${n(m.over)} are left over, while ${EN_IN_SENTENCE[m.shortStore]} sends ${n(m.short)} customers home.`;
    case "case":
      return `This is the split from the launch case. It leaves the small town more room below its median (${p(m.headroomSmall)}) than the city centre (${p(m.headroomCentre)}).`;
    case "median":
      return "Every site gets about 89% of its median and so has the same room below it, about 11%. The 320 units asked for but missing stay visible.";
    case "ask":
      return `The small town has only ${p(m.headroomSmall)} room below its median: if it comes in a little weaker, units are left there while the city centre turns customers away. The small town asked for the most over its median (+26%).`;
    case "preorders":
      return `The city centre has only ${p(m.headroomCentre)} room, and the small town turns away ${n(m.shortSmall)} customers. Preorders are the earliest signal, not the whole demand.`;
    case "own":
      return `${EN_AT_START[m.store]} has the least room below its median (${p(m.headroom)}): if demand there comes in weaker, units are left over.`;
  }
}

const EN: ForecastCopy = {
  stores: {
    names: EN_STORES,
    inSentence: EN_IN_SENTENCE,
    atStart: EN_AT_START,
    order: "City centre / Edge of town / Small town",
  },
  caseStrip: {
    heading: "The case in three numbers",
    asked: "asked",
    askedNote: "What the three sites want.",
    estimated: "estimated",
    estimatedNote: "What the model expects (median).",
    delivered: "delivered",
    deliveredNote: "There is no more.",
    gap: (missing) => `${missing} units asked for are missing. That stays visible.`,
    figure: "Three bars on the same scale: asked 1,370, estimated 1,180, delivered 1,050.",
  },
  thread: {
    label: "Steps of the exercise",
    steps: ["Split", "Seven mornings", "Result"],
    current: "now",
    done: "done",
    resumed: "Resumed",
    resumedRestart: "Start over",
    resumedMorning: (day, total) => `Morning ${day} of ${total}`,
    restarted: "Week cleared.",
    undo: "Undo",
  },
  split: {
    heading: "Split",
    lead: "Split 1,050 units across three sites. This split is your standing plan: it applies on every morning the check holds.",
    glossary: [
      { term: "Asked", text: "what the site wants" },
      { term: "Preorders", text: "what customers have firmly ordered, the earliest signal" },
      { term: "Median", text: "the demand the model expects: it comes in higher as often as lower" },
    ],
    reference: (ask, preorders, median) => `Asked ${ask} · Preorders ${preorders} · Median ${median}`,
    inputLabel: (store) => `${store}, units`,
    fewer: (store) => `${store} 10 fewer`,
    more: (store) => `${store} 10 more`,
    keys: "Arrow keys: 10 units, with Shift 50.",
    remaining: (n) => `${n} left to split`,
    tooMany: (n) => `${n} too many`,
    allSplit: "All 1,050 split.",
    check: "Check",
    checkHint: "Check works once exactly 1,050 are split.",
    chartHeading: "One delivery, three sites",
    pool: (given) => `Delivery 1,050 · split ${given}`,
    poolPlaced: "Delivery 1,050 · all split",
    poolPlacedAria: "Delivery of 1,050 units: all split across the three sites.",
    poolAria: (given, left) => `Delivery of 1,050 units: ${given} split, ${left} free.`,
    rowBefore: (median) => `Median ${median}`,
    rowAfter: (alloc, median) => `${alloc} of median ${median}`,
    short: (n) => `${n} customers without a unit`,
    left: (n) => `${n} left over`,
    exact: "exactly the median",
    barAria: (store, alloc, median, ask, note) => `${store}: ${alloc} of median ${median}, asked ${ask}, ${note}.`,
    legend: { median: "median", ask: "asked", over: "above the median" },
    feedbackHeading: "What your split does",
    headlineAll: "At median demand your split sells all 1,050.",
    headlineLeft: (n) => `At median demand ${n} units are left over.`,
    customersNone: "130 customers still go home without a unit: 1,180 are expected and 1,050 are there. No split changes that.",
    customersSome: (total, unavoidable, extra) =>
      `${total} customers go home without a unit: ${unavoidable} because only 1,050 are there, and ${extra} because units sit at the wrong site.`,
    message: enMessage,
    headroomLabel: "Room below the median",
    headroomNone: "none",
    headroomDefinition: "How far demand may fall below the median before units are left over.",
    referenceLine:
      "Split by median: 480 / 365 / 205, every site about 11% room. This is the simplest rule; the launch case splits 500 / 370 / 180, and at median demand both sell everything.",
    stale: "Split exactly 1,050 again and the page recalculates.",
    presetsLabel: "Try another rule",
    presets: {
      median: "By median",
      ask: "By asks",
      preorders: "By preorders",
      equal: "In equal shares",
      case: "As in the launch case",
    },
    continueOwn: "Continue with my split",
    continueMedian: "Continue with 480 / 365 / 205",
    record: (plan, pattern) => `Your standing plan: ${plan}, ${pattern}.`,
    patternNames: {
      median: "by median",
      ask: "by asks",
      preorders: "by preorders",
      equal: "in equal shares",
      case: "as in the launch case",
      own: "by your own rule",
    },
  },
  mornings: {
    heading: "Seven mornings",
    preview:
      "Then you run the release for a week: every morning 50 units arrive, and you decide whether the model's plan ships on its own.",
    directEntry: "Go straight to the seven mornings",
    directEntryNote: "The split by median then becomes the standing plan.",
    intro: (plan, delivery) =>
      `Week 2 after the launch. Every morning 50 units arrive, and the model splits them by its new median. If the check passes, that plan ships on its own; otherwise the person on duty decides, and until then your standing plan applies: ${plan}, so ${delivery} for 50 units.`,
    fallback: "Without part 1, the split by median applies.",
    ownerQuestion: "Who decides when a check fails?",
    ownerOptions: {
      plannerOnDuty: "The planner on duty",
      analytics: "The analytics team",
      whoeverFree: "Whoever is free",
      custom: "Own role",
    },
    customLabel: "Your role (up to 40 characters)",
    customUse: "Use",
    ownerAnswers: {
      plannerOnDuty: "A named role that is on duty today and decides about the stock.",
      analytics: "Analytics owns the model, not the stock. It finds causes; it does not approve.",
      whoeverFree: "Then nobody decides. Approval needs a name before the morning starts.",
      custom: "Fits if this role is on duty today and may decide about the stock.",
    },
    ownerRightMark: "Fits",
    ownerWrongMark: "Not like this",
    start: "Start morning 1",
    ownerRecord: (owner) => `When a check fails, this role decides: ${owner}.`,
    morningHeading: (day) => `Morning ${day} of 7`,
    dayLabel: (day) => `Morning ${day}`,
    weekLabel: "The week",
    slotName: (day, state) => `Morning ${day}: ${state}`,
    slotOpen: "still open",
    slotToday: "today",
    tiles: {
      fresh: { name: "Freshness", sub: "Age of the data", limit: "under 2 h" },
      wape: { name: "WAPE", sub: "Error, last close", limit: "under 14%" },
      bias: { name: "Bias", sub: "Direction of the error", limit: `between ${MINUS}5% and +5%` },
      coverage: { name: "Range", sub: "p10 to p90, hit rate over the last 4 weeks", limit: "over 80%" },
    },
    pass: "passes",
    fail: "fails",
    limitPrefix: "Limit:",
    boardLabel: "Today's check",
    storeBias: "Bias by site",
    todayUnits: "50 units arrive today",
    modelPlan: "The model's plan",
    standingPlan: "Your standing plan",
    events: {
      competitorToday: "From sales: a competitor cuts its price from today.",
      stockoutZentrum: "From the city centre site: sold out from noon yesterday.",
    },
    eventLabel: "Note",
    statusGreen: "All four checks pass.",
    statusRed: (checks) => `The check holds the plan: ${checks} failed. You are on duty.`,
    promptGreen: "Does the plan ship on its own?",
    promptRed: "What do you do?",
    options: {
      release: "The plan ships on its own",
      holdUnknown: "Hold: something is happening that the model does not know",
      holdNearLimit: "Hold: a value is close to its limit",
      releaseOthersGreen: "Release: WAPE, bias and range are green",
      waitRefresh: "Wait for fresh data, then check again",
      retrain: "Have the model retrained",
      releaseBestWape: "Release: the WAPE is the best of the week",
      overrideReportBias: "Split today yourself and report the small town's bias as a retraining trigger",
      waitFresh: "Wait for fresh data",
      releaseMedianFine: "Release: the median is on target",
      overrideAskWhy: "Split today yourself and ask the analytics team why the range misses so often",
      lowerLimit: "Lower the limit to 70% for today",
      retrainRaw: "Retrain on yesterday's sales",
      overrideReconstruct: "Split today yourself, rebuild the city centre's demand from sell-through, and only then retrain",
      releaseAnyway: "Release: the light overreacts to a single day",
    },
    stamps: {
      rightRelease: "Rightly released",
      rightHold: "Rightly held",
      rightAction: "Right call",
      missed: "Slipped through",
      needless: "Held for nothing",
      wrongStep: "Wrong step",
    },
    why: [
      "This is what a normal morning looks like, and on it you have nothing to do.",
      "WAPE, bias and range are exactly yesterday's values: without fresh data there is no new close.",
      "The error is small, but almost all the bias comes from the small town, which has run high since morning 1 (+10%, today +27%).",
      "The range promises to hit on 8 days in 10 and hits on 7. The model is surer than it may be: where it misses, it misses by more than the range admits.",
      "The price cut is in no feature, so the model does not know about it.",
      `13.7 is under 14, ${MINUS}4.6 is between ${MINUS}5 and +5, 81 is over 80.`,
      "From noon the city centre could not sell anything. That is why the model looks too high there (+14.2%). Rebuild demand from sell-through first, then retrain.",
    ],
    consequences: [
      {
        holdUnknown: "No note has come in. Holding without a reason teaches everyone to skip the check.",
        holdNearLimit: "81% is over 80%: it passes. Close is not red.",
      },
      {
        releaseOthersGreen: "The plan splits the 50 by yesterday's stock.",
        retrain: "The model is not the problem; the data is old. Retraining on old data changes nothing.",
      },
      {
        releaseBestWape:
          "The plan splits 22 / 16 / 12 instead of 23 / 17 / 10: 2 units go to the small town, which sells less than the model thinks.",
        waitFresh: "The data is 1.1 hours old, so it is fresh. Waiting does not change the bias.",
      },
      {
        releaseMedianFine: "The plan ships as if the uncertainty were as small as the model thinks.",
        lowerLimit:
          "If you lower the limit when it fails, you no longer have a limit. Limits change beforehand and for a reason, not in the morning.",
      },
      {
        release: "The plan splits the 50 as if there were no price cut.",
        holdNearLimit: "Holding is right, but no value is close to its limit (0.9 h, 11.9%, +1.6%, 84%). The reason is the note.",
      },
      {
        holdNearLimit:
          "Holding on green turns the rule into a gut feeling. The limits are set beforehand so nobody renegotiates them in the morning.",
        holdUnknown: "No note has come in.",
      },
      {
        retrainRaw:
          "On capped sales the model learns that the city centre needs less because it had nothing left. From tomorrow the city centre would get fewer units.",
        releaseAnyway: "Today nobody can check whether the model is right. Releasing means splitting blind.",
      },
    ],
    lessons: [
      "All green and no note: the plan ships on its own.",
      "Old data: fresh data first, then the plan.",
      "An error that points one way is a reason to retrain.",
      "A limit that fails is not lowered.",
      "Green looks at yesterday. A note beats the light.",
      "Close is not red.",
      "Sold out means sales do not show demand.",
    ],
    yourPick: "Your pick",
    otherPaths: "The other paths",
    rightPath: "Right",
    deliveryModel: (units) => `Today the model's plan ships: ${units}.`,
    deliveryStanding: (units) => `Today the 50 ship by your standing plan: ${units}.`,
    deliveryMedianNote: (units) => `By median it would be ${units}.`,
    deliveryWaitData: "The 50 wait until the plan runs on fresh data.",
    deliveryWaitStock: "The 50 stay in the warehouse today.",
    deliveryWaitRetrain: "The 50 wait until the model is retrained.",
    next: "Next morning",
    toResult: "See the result",
  },
  result: {
    heading: "Result",
    preview:
      "After morning 7 your week appears here: how many mornings were right and what your standing plan delivered on the mornings that were held.",
    score: (n) => `${n} of 7 mornings right.`,
    missed: (days, count) => `Slipped through: ${enMornings(count)} ${days}.`,
    needless: (days, count) => `Held for nothing: ${enMornings(count)} ${days}.`,
    wrongStep: (days, count) => `Wrong step: ${enMornings(count)} ${days}.`,
    holdMornings: (h) => mornings(h),
    openingOwn: (pattern, split, m) =>
      `At the start you split ${pattern} (${split}). ${m} the delivery shipped by that plan.`,
    openingMedian: (pattern, split, m) =>
      `At the start you split ${pattern} (${split}) and continued with 480 / 365 / 205. ${m} the delivery shipped by that plan.`,
    openingMedianOnly: (m) =>
      `You continued with the split by median (480 / 365 / 205). ${m} the delivery shipped by that plan.`,
    openingFallback: (m) =>
      `Without your own split, the split by median applied (480 / 365 / 205). ${m} the delivery shipped by that plan.`,
    deviation: (store, got, median) => `${store} got ${got} units; by median it would have been ${median}.`,
    roomQuestion: "Would you split the same way now?",
    lessonsHeading: "The week in seven sentences",
    legend: {
      right: "right",
      missed: "slipped through",
      needless: "held for nothing",
      wrongStep: "wrong step",
    },
    toTakeaways: "To your takeaways",
    restart: "Restart the week",
    toWorkshop: "To the workshop",
    toCase: "To the launch case",
    record: (right) => `Week run: ${right} of 7 mornings right.`,
  },
  takeaways: {
    heading: "To take with you",
    intro: "For your own forecast: one rule, one check and five sentences. Everything is here, even without playing the exercise.",
    copy: "Copy",
    copied: "Copied",
    copiedAnnouncement: (title) => `${title} copied.`,
    copyFailed: "Copying did not work. Select the text and copy it by hand.",
    titles: ["The split rule", "The morning check", "Five sentences for your forecast"],
    rule: "Split scarce stock by each site's estimated demand (the median), not by what it asked for. No site gets more than its median while another is below it. Give every site the same share of its median, so each has the same room if demand comes in weaker. What was asked for and is missing stays visible to everyone.",
    checkNote: "The blanks are your limits. In brackets is what the case uses.",
    check: (owner) =>
      [
        "Every morning, before the plan ships:",
        "1. Is the data less than ___ hours old? (in the case: 2)",
        "2. Is the WAPE of the last close under ___%? (in the case: 14%, the baseline is at 21%)",
        `3. Is the bias between ${MINUS}___% and +___%? (in the case: 5%)`,
        "4. Does the p10 to p90 range hit as often as it promises? Measured over ___, at least ___ in 10. (in the case: over 80%)",
        "5. Is nothing happening that the model does not know: a competitor, the weather, a promotion nobody entered, an undated shock?",
        "6. Did no site sell out yesterday?",
        `One no: ${owner} decides before anything ships.`,
        "When a check fails, the limit does not move; first the cause, then the plan.",
      ].join("\n"),
    sentencesNote:
      "Fill the blanks for a forecast from your own work. Empty blanks copy as ___. Your draft stays in this browser only.",
    sentences: [
      [
        "We forecast ",
        { blank: "what", label: "What you forecast" },
        " for ",
        { blank: "which period", label: "For which period" },
        ", so that ",
        { blank: "which decision", label: "For which decision" },
        " can be made.",
      ],
      [
        "The baseline is ",
        { blank: "which current method", label: "Which current method" },
        "; the model must beat it on WAPE over weeks it never saw.",
      ],
      [
        "Too little costs us ",
        { blank: "what", label: "What too little costs" },
        ", too much costs us ",
        { blank: "what", label: "What too much costs" },
        ".",
      ],
      [
        "The plan ships on its own while ",
        { blank: "which checks", label: "Which checks" },
        " pass and nothing happens that the model does not know.",
      ],
      ["On a no, ", { blank: "who", label: "Who decides" }, " decides before anything ships."],
    ],
    examplePrefix: "In the case:",
    examples: [
      "demand per site · the launch weeks · how to split the 1,050 units",
      "last season's value, WAPE 21%",
      "lost launch sales · tied-up capital and costly redeploys",
      "freshness, WAPE, bias and range",
      "the planner on duty",
    ],
    ownerDefault: "the planner on duty",
    blank: "___",
  },
  sources: {
    heading: "Where the figures come from",
    fromCase: "From the workshop's launch case",
    fromCaseItems: [
      "Asked 1,370, estimated 1,180, delivered 1,050; asks, preorders and median per site.",
      "The case's split: 500 / 370 / 180.",
      "The four daily checks and their limits. Morning 1 is the case's own board.",
      "WAPE 12% for the model, 21% for the baseline.",
      "At a stockout, sales are not demand. Competitors and weather stay risks, not features.",
    ],
    invented: "Invented for this exercise",
    inventedItems: [
      "The site names.",
      "The delivery: 700 units in launch week, then 50 on every morning of week 2.",
      "The values of mornings 2 to 7 and the two notes.",
      "The model's plan each morning: the median per site, shifted by its bias.",
      "The window of the range check: hit rate over the last 4 weeks.",
      "Room below the median uses the median only, not the whole range. That is a simplification.",
    ],
    toCase: "To the launch case",
  },
};

export const EN_COPY: ForecastCopy = withTriplesTogether(EN);
