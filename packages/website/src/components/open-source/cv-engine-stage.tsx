import type { CSSProperties, ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { CV_ENGINE_SPECIMEN_COPY } from "@/lib/open-source/display-copy";
import { CvEngineDriver } from "./cv-engine-driver";
import {
  CHAPTER_P,
  CV_ENGINE_BARS,
  CV_ENGINE_DURATION_S,
  CV_ENGINE_REST_FRAME,
  EXTRA_ROW,
  HEIGHT,
  INK_COLOUR,
  PAGE,
  ROW_STEP,
  ROW_TOP,
  TRAY_X,
  YAML_ROWS,
  type Look,
} from "./cv-engine-frame";

/**
 * CV Engine's drawn specimen, rendered on the server at rest (p = 1). Only
 * the driver at its end ships to the browser; it moves the `data-k` nodes.
 * The motion itself is `cvEngineFrame` in ./cv-engine-frame.
 */
export function cvEngineChapters(locale: Locale) {
  return CHAPTER_P.map((p, index) => ({
    atS: Math.round(p * CV_ENGINE_DURATION_S * 100) / 100,
    label: CV_ENGINE_SPECIMEN_COPY[locale].chapters[index],
  }));
}

const css = (look: Look | undefined): CSSProperties => ({ ...look });
const sheetBox = (x: number): CSSProperties => ({
  left: `${x}cqw`,
  top: `${PAGE.y}cqw`,
  width: `${PAGE.w}cqw`,
  height: `${PAGE.h}cqw`,
});

export function CvEngineStage({
  id,
  locale,
}: {
  readonly id: string;
  readonly locale: Locale;
}) {
  const copy = CV_ENGINE_SPECIMEN_COPY[locale];
  const rest = CV_ENGINE_REST_FRAME;
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#121212] font-mono text-[#f7f1e7] [container-type:inline-size]">
      <span className="absolute left-[4cqw] top-[2.6cqw] text-[3.2cqw] leading-none text-[#d4cec5]">
        cv.yaml
      </span>
      {/* The new station's band: a diff line under its row, ending before
          the pulled-back sheet (x = 31 cqw) so the paper never covers it. */}
      <span
        data-k="band"
        className="absolute left-0 w-[29cqw] origin-left bg-[#b73a15]"
        style={{
          top: `${ROW_TOP(EXTRA_ROW) - (ROW_STEP - 2.6) / 2 + 0.3}cqw`,
          height: `${ROW_STEP - 0.6}cqw`,
          ...css(rest.band),
        }}
      >
        <span className="absolute left-[0.9cqw] top-1/2 -translate-y-1/2 text-[3.4cqw] font-bold leading-none text-[#f7f1e7]">
          +
        </span>
      </span>
      {YAML_ROWS.map(([key, value], i) => (
        <span
          key={i}
          data-k={`row${i}`}
          className="absolute left-[4cqw] flex h-[2.6cqw] gap-[1.4cqw]"
          style={{ top: `${ROW_TOP(i)}cqw`, ...css(rest[`row${i}`]) }}
        >
          <span className="h-full bg-[#f7f1e7]" style={{ width: `${key}cqw` }} />
          <span className="relative h-full bg-[#827970]" style={{ width: `${value}cqw` }}>
            {i === EXTRA_ROW ? (
              <span
                data-k="hotValue"
                className="absolute inset-0 bg-[#f7f1e7]"
                style={css(rest.hotValue)}
              />
            ) : null}
          </span>
        </span>
      ))}

      {/* The paper: both sheets and their ink move as one when the view
          pulls back to show page two. */}
      <span
        data-k="paper"
        className="absolute inset-0 origin-top-left"
        style={css(rest.paper)}
      >
        <span
          data-k="tray"
          className="absolute border border-dashed border-[#827970]"
          style={{ ...sheetBox(TRAY_X), ...css(rest.tray) }}
        />
        <span
          data-k="sheet2"
          className="absolute bg-[#f7f1e7]"
          style={{ ...sheetBox(TRAY_X), ...css(rest.sheet2) }}
        />
        <span className="absolute bg-[#f7f1e7]" style={sheetBox(PAGE.x)} />
        {CV_ENGINE_BARS.map((bar, j) => (
          <span
            key={j}
            data-k={`bar${j}`}
            className={`absolute origin-left ${INK_COLOUR[bar.role]}`}
            style={{
              left: `${PAGE.x + PAGE.w * 0.08}cqw`,
              top: `${PAGE.y + (bar.role === "new" ? bar.pushed : bar.full) * PAGE.h}cqw`,
              width: `${bar.width * 0.84 * PAGE.w}cqw`,
              height: `${HEIGHT[bar.role] * PAGE.h}cqw`,
              ...css(rest[`bar${j}`]),
            }}
          />
        ))}
      </span>

      <span
        data-k="badge1"
        className="absolute right-[2.5cqw] top-[1.6cqw] border border-[#f7f1e7] bg-[#121212] px-[1.6cqw] py-[0.8cqw] text-[3.2cqw] font-bold leading-none"
        style={css(rest.badge1)}
      >
        {copy.onePageBadge}
      </span>
      <span
        data-k="badge2"
        className="absolute right-[2.5cqw] top-[1.6cqw] border border-[#b73a15] bg-[#b73a15] px-[1.6cqw] py-[0.8cqw] text-[3.2cqw] font-bold leading-none"
        style={css(rest.badge2)}
      >
        {copy.twoPagesBadge}
      </span>

      <span className="absolute inset-x-0 bottom-0 top-[80cqw] border-t border-[#827970] bg-[#121212] text-[3.3cqw] leading-none">
        <TerminalLine top="2.6cqw" k="cmd1" look={rest.cmd1}>
          <span className="text-[#d4cec5]">$ </span>engine/build.py
        </TerminalLine>
        <TerminalLine top="2.6cqw" k="cmd2" look={rest.cmd2}>
          <span className="text-[#d4cec5]">$ </span>engine/build.py --density tight
        </TerminalLine>
        <TerminalLine top="8.4cqw" k="exit1" look={rest.exit1}>
          <span className="bg-[#b73a15] px-[1cqw] py-[0.5cqw] font-bold">exit 1</span>
        </TerminalLine>
        <TerminalLine top="8.4cqw" k="exit0" look={rest.exit0}>
          exit 0 · output/cv.pdf
        </TerminalLine>
        <TerminalLine top="14.2cqw" k="msg" look={rest.msg}>
          First section on the overflow page: &apos;Projects&apos;
        </TerminalLine>
      </span>
      <CvEngineDriver id={id} />
    </div>
  );
}

function TerminalLine({
  top,
  k,
  look,
  children,
}: {
  readonly top: string;
  readonly k: string;
  readonly look: Look | undefined;
  readonly children: ReactNode;
}) {
  return (
    <span
      data-k={k}
      className="absolute left-[4cqw] whitespace-nowrap"
      style={{ top, ...css(look) }}
    >
      {children}
    </span>
  );
}
