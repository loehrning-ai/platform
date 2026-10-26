import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { missingText, type ExportWords } from "@/lib/demo-cases/esg-berichte-mit-ki/export";
import { EMPTY_INPUT, probeOwn, type CheckState, type OwnResult, type OwnRow } from "@/lib/demo-cases/esg-berichte-mit-ki/own";
import { CheckChips, StatusTag, type Mark } from "./parts";

/** The stage example: the bank form sentence with eleven of twelve monthly bills, September missing. */
const EXAMPLE_MONTHS: readonly boolean[] = Array.from({ length: 12 }, (_, month) => month !== 8);

export function exampleResult(pack: Pack): { readonly sentence: string; readonly result: OwnResult } {
  const sentence = pack.own.exampleSentence;
  return { sentence, result: probeOwn({ ...EMPTY_INPUT, sentence, destination: "bank", evidence: "bills", months: EXAMPLE_MONTHS }) };
}

const MARK: Record<CheckState, Mark> = { ok: "ok", fail: "fail", open: "skip" };

/** ZITAT holds when a document is named at all; the other three come from the probe. */
export function ownMarks(evidence: string, result: OwnResult): readonly Mark[] {
  return [evidence === "nothing" ? "fail" : "ok", MARK[result.checks.zeitraum], MARK[result.checks.umfang], MARK[result.checks.stand]];
}

const ALL_SHOWN = [1, 1, 1, 1] as const;

/**
 * The stage of the own beat: the visitor's last checked sentence with its four
 * checks, or, before the first one, a worked example of the same probe. The
 * form itself stays below the demo.
 */
export function OwnPreview({ pack, words, latest }: { readonly pack: Pack; readonly words: ExportWords; readonly latest: OwnRow | undefined }) {
  const shown = latest ? { sentence: latest.sentence, result: latest.result, evidence: latest.evidence } : { ...exampleResult(pack), evidence: "bills" };
  return (
    <div className="nw-stage nw-own-stage" data-scene="eigene" data-own-preview={latest ? "latest" : "example"}>
      <p className="nw-kicker">{latest ? pack.own.stageLatest : pack.own.stageExample}</p>
      <p className="nw-sentence nw-sentence-mid">{shown.sentence}</p>
      <CheckChips pack={pack} marks={ownMarks(shown.evidence, shown.result)} shown={ALL_SHOWN} />
      <p className="nw-own-verdict">
        <StatusTag status={shown.result.status} pack={pack} />
        <span>{pack.own.decisions[shown.result.decision]}</span>
      </p>
      {shown.result.missing.length > 0 ? (
        <p className="nw-own-missing">
          <strong>{pack.own.missingLabel}: </strong>
          {shown.result.missing.map((doc) => missingText(doc, words)).join("; ")}
        </p>
      ) : null}
      <p className="nw-hint">{pack.own.stageEmpty}</p>
    </div>
  );
}
