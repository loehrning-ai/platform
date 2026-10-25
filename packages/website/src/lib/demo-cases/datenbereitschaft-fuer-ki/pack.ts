import type { Locale } from "@/lib/i18n/locale";

/**
 * The words of the demo in ONE language: plain strings with {placeholders},
 * handed to the client by index.tsx. Types only here, so client code can
 * import it; the two packs live in copy-de.ts / copy-en.ts behind copy.ts.
 */
export interface DemoPack {
  readonly locale: Locale;
  readonly ui: {
    readonly leverLabel: string;
    readonly start: string;
    readonly stufe: string;
    readonly treppe: string;
    readonly wordChange: string;
    readonly wordLevel: string;
    readonly stampBefore: string;
    readonly stampAfter: string;
    /** The two tones, named once on one bar: the level before, and the step on it. */
    readonly toneGround: string;
    readonly toneStep: string;
    readonly zeroNote: string;
    readonly headGrowth: string;
    readonly headLast: string;
    readonly sentence: string;
    readonly before: string;
    readonly sceneLabelBoth: string;
    readonly tableCaption: string;
    readonly readingChange: string;
    readonly readingLevel: string;
    readonly monthShort: string;
    /** The three month labels of the example (Apr, Mai, Jun / Apr, May, Jun). */
    readonly months: readonly [string, string, string];
    readonly leverCue: string;
    readonly sliderChange: string;
    readonly sliderLevel: string;
    readonly sliderMid: string;
    readonly statusChange: string;
    readonly statusLevel: string;
    readonly statusGrowth: string;
    readonly readingGroup: string;
  };
  readonly ops: {
    readonly group: string;
    readonly sum: string;
    readonly end: string;
    readonly endMinusStart: string;
    readonly right: string;
    readonly wrong: string;
    readonly partial: string;
    readonly recordedTag: string;
    readonly needsStart: string;
    readonly arithGrowth: string;
    readonly arithGrowthN: string;
    readonly arithStaircase: string;
    readonly arithAssumed: string;
    readonly arithFromFirst: string;
    readonly notes: {
      readonly growth: string;
      readonly lastChange: string;
      readonly recordedDiff: string;
      readonly sumLevels: string;
      readonly lastLevel: string;
    };
    readonly treppentest: string;
    readonly pairLast: string;
    readonly pairSum: string;
    readonly tickerSum: string;
    readonly tickerRatio: string;
  };
  readonly own: {
    readonly title: string;
    readonly valuesLabel: string;
    readonly valuesPlaceholder: string;
    readonly startLabel: string;
    readonly nameLabel: string;
    readonly tableLabel: string;
    readonly neverNeg: string;
    readonly likelyChange: string;
    readonly likelyLevel: string;
    readonly unclear: string;
    readonly kindGroup: string;
    readonly parseFail: string;
    readonly exampleStays: string;
    readonly failCount: string;
    readonly failToken: string;
    readonly failStart: string;
    readonly loadExample: string;
    readonly sampleChange: string;
    readonly sampleLevel: string;
    readonly device: string;
    readonly loaded: string;
    readonly assumedStart: string;
    readonly firstIsStart: string;
    /** The link from the status line back up to the picture. */
    readonly toPicture: string;
  };
  readonly take: {
    readonly title: string;
    readonly blockTitles: readonly [string, string, string];
    readonly switchText: string;
    readonly switchYaml: string;
    readonly switchAi: string;
    readonly switchHuman: string;
    readonly copy: string;
    readonly copied: string;
    readonly copyAll: string;
    readonly copyFail: string;
    readonly yamlNote: string;
    readonly origin: string;
    readonly readingNote: string;
    readonly placeholderName: string;
    readonly placeholderTable: string;
    readonly defMetric: string;
    readonly defKindLevel: string;
    readonly defKindChange: string;
    readonly defKindUnclear: string;
    readonly defGrain: string;
    readonly scopeExample: string;
    readonly scopeVisitor: string;
    readonly defTable: string;
    readonly defCheckLevel: string;
    readonly defCheckChange: string;
    readonly defCheckUnclear: string;
    readonly yamlAggLevel: string;
    readonly yamlAggChange: string;
    readonly yamlAggUnclear: string;
    readonly yamlLimit: string;
    readonly askAi: string;
    readonly askHuman: string;
    readonly boardChangeStart: string;
    readonly boardChangeNoStart: string;
    readonly boardLevel: string;
    readonly boardUnclear: string;
    readonly periodQuarter: string;
    readonly periodOther: string;
    readonly and: string;
  };
}
