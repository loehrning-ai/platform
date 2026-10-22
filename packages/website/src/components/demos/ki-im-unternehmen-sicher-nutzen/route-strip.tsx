import { ROUTE_KEYS, fmt } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/core";
import { PACKET_X1 } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/motion";
import type { W05Text } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/pack";
import type { AccountId, Device, RouteKey } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/types";
import { DEVICE_PATHS } from "./glyphs";

interface Props {
  readonly text: W05Text;
  readonly account: AccountId;
  readonly device: Device;
  readonly headingId: string;
  /** Packet x in viewBox units (motion.ts). */
  readonly packetX: number;
  /** Rows fade in during the reveal. */
  readonly rows: { readonly opacity: number; readonly y: number };
  /** Underline progress per changed row, after a dial change. */
  readonly underline: Partial<Record<RouteKey, number>>;
  readonly t: number;
}

/**
 * "Wohin geht es?": the device, the packet, one box marked USA or "?", then
 * the four short rows (or one merged line when the files say nothing).
 */
export function RouteStrip({ text, account, device, headingId, packetX, rows, underline, t }: Props) {
  const copy = text.ui;
  const info = text.accounts[account];
  const known = info.route !== null;
  const deviceWord = text.deviceWord[device] ?? info.label;
  const box = known ? copy.usBox : "?";

  return (
    <section aria-labelledby={headingId} className="border-t border-[rgb(31_74_56/0.35)] pt-3">
      <h4 id={headingId} className="text-[1.0625rem] font-bold">
        {copy.routeHeading}
      </h4>
      <svg
        viewBox="0 0 320 56"
        className="w05-route-svg mt-2 text-[#1f4a38]"
        role="img"
        aria-label={fmt(copy.routeFigure, { from: deviceWord, to: known ? copy.usBox : copy.unknownBox })}
        data-t={t.toFixed(2)}
      >
        <svg
          x="2"
          y="8"
          width="40"
          height="40"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth={5}
          strokeLinecap="square"
          strokeLinejoin="miter"
          data-device={device}
        >
          {DEVICE_PATHS[device]}
        </svg>
        <path d="M48 28H242" stroke="currentColor" strokeWidth={2} strokeDasharray="2 6" />
        <rect
          x="244"
          y="6"
          width="72"
          height="44"
          fill="var(--color-paper)"
          stroke="currentColor"
          strokeWidth={2}
          strokeDasharray={known ? undefined : "6 4"}
        />
        <text
          x="290"
          y="34"
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fill="currentColor"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {box}
        </text>
        <rect
          x={0}
          y={22}
          width={12}
          height={12}
          fill="var(--color-bernstein)"
          stroke="currentColor"
          strokeWidth={1.5}
          transform={`translate(${packetX.toFixed(2)} 0)`}
          data-packet=""
          data-at-rest={packetX >= PACKET_X1 ? "" : undefined}
        />
      </svg>

      <div style={{ opacity: rows.opacity, transform: `translateY(${rows.y}px)` }} className="mt-2">
        {info.route ? (
          <dl className="w05-rows" data-route-rows="">
            {ROUTE_KEYS.map((key) => {
              const row = info.route?.find((entry) => entry.key === key);
              if (!row) return null;
              const u = underline[key];
              return (
                <div key={key} data-route-row={key}>
                  <dt>{copy.routeKeys[key]}</dt>
                  <dd>
                    <span>{row.value}</span>
                    {u !== undefined ? (
                      <span
                        className="w05-underline"
                        aria-hidden="true"
                        style={{ transform: `scaleX(${u})` }}
                        data-changed=""
                      />
                    ) : null}
                  </dd>
                  {key === "stored" ? (
                    // Full width under the row: the note reads in two lines, not five.
                    <dd className="w05-rows__note" data-stored-note="">
                      {text.storedLine}
                    </dd>
                  ) : null}
                </div>
              );
            })}
            {info.gaps ? (
              <div className="w05-rows__wide" data-route-gaps="">
                <dt>{copy.missing}</dt> <dd>{info.gaps}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="text-[0.9375rem] font-semibold leading-snug" data-route-unknown="">
            {info.unknownLine}
          </p>
        )}
        {info.note ? (
          <p className="mt-2 border-l-[3px] border-[var(--color-bernstein)] pl-3 text-[0.9375rem] leading-snug">
            {info.note.text}
          </p>
        ) : null}
      </div>
    </section>
  );
}
