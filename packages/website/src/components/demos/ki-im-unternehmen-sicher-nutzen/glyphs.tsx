import type { ReactNode } from "react";
import { Pictogram, cx } from "@/components/werk";
import type { UiCopy } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/copy";
import type { Device, Light } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/types";

const LIGHT_PICTOGRAM = { green: "pass", amber: "gap", red: "fail" } as const satisfies Record<
  Light,
  "pass" | "gap" | "fail"
>;

export function lightClass(light: Light): string {
  return `w05-light-${light}`;
}

/** The light's pictogram (pass, gap, fail) in its risk colour; decorative. */
export function LightGlyph({ light, className }: { readonly light: Light; readonly className?: string }) {
  return (
    <span className={cx("w05-glyph", lightClass(light), className)} aria-hidden="true">
      <Pictogram name={LIGHT_PICTOGRAM[light]} className="size-full" strokeWidth={2} />
    </span>
  );
}

/** Glyph plus word: colour is never the only signal. */
export function LightLabel({
  light,
  copy,
  className,
  glyphClassName = "size-4",
}: {
  readonly light: Light;
  /** The page's copy (one language). */
  readonly copy: UiCopy;
  readonly className?: string;
  readonly glyphClassName?: string;
}) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 font-bold", lightClass(light), className)}>
      <LightGlyph light={light} className={glyphClassName} />
      <span>{copy.lights[light].word}</span>
    </span>
  );
}

const FILL = (children: ReactNode) => (
  <g fill="currentColor" stroke="none">
    {children}
  </g>
);

/** Device pictograms in the deck grammar: 100-unit box, square caps, filled details. */
export const DEVICE_PATHS: Readonly<Record<Device, ReactNode>> = {
  phone: (
    <>
      <rect x="28" y="6" width="44" height="88" />
      <path d="M28 20h44M28 76h44" />
      {FILL(<rect x="44" y="82" width="12" height="6" />)}
    </>
  ),
  browser: (
    <>
      <rect x="6" y="14" width="88" height="72" />
      <path d="M6 32h88M20 50h40M20 64h56" />
      {FILL(<rect x="12" y="20" width="8" height="6" />)}
    </>
  ),
  desktopFolder: (
    <>
      <rect x="12" y="12" width="76" height="52" />
      <path d="M4 76h92M24 64l-8 12M76 64l8 12" />
      {FILL(<path d="M28 26h16l4 6h24v22H28z" />)}
    </>
  ),
  server: (
    <>
      <rect x="14" y="10" width="72" height="34" />
      <rect x="14" y="56" width="72" height="34" />
      {FILL(
        <>
          <rect x="24" y="23" width="8" height="8" />
          <rect x="24" y="69" width="8" height="8" />
        </>,
      )}
    </>
  ),
};

export function DeviceGlyph({ device, className }: { readonly device: Device; readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={cx("size-5 shrink-0 [&_*]:[vector-effect:non-scaling-stroke]", className)}
      aria-hidden="true"
      focusable="false"
      data-device={device}
    >
      {DEVICE_PATHS[device]}
    </svg>
  );
}
