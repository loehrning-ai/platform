"use client";

import { m } from "framer-motion";
import { DEMO } from "@/lib/demo-tokens";
import { nodeAppear } from "@/lib/animations";

interface NodeBoxProps {
  readonly x: number;
  readonly y: number;
  readonly w?: number;
  readonly h?: number;
  readonly label: string;
  readonly sublabel?: string;
  readonly delay?: number;
  readonly immediate?: boolean;
  readonly variant?: "source" | "output" | "processing";
  readonly active?: boolean;
  readonly glow?: boolean;
  readonly onInteract?: (active: boolean) => void;
}

const VARIANT_STYLES = {
  source: {
    fill: DEMO.fill.node,
    stroke: DEMO.stroke.active,
    textFill: DEMO.text.primary,
  },
  output: {
    fill: DEMO.fill.accent,
    stroke: "rgba(249,115,22,0.3)",
    textFill: DEMO.text.accent,
  },
  processing: {
    fill: "rgba(168,144,112,0.06)",
    stroke: "rgba(168,144,112,0.25)",
    textFill: DEMO.text.accentSoft,
  },
} as const;

export function NodeBox({
  x,
  y,
  w = 100,
  h = 44,
  label,
  sublabel,
  delay = 0,
  immediate = false,
  variant = "source",
  active = false,
  glow = false,
  onInteract,
}: NodeBoxProps) {
  const style = VARIANT_STYLES[variant];
  const activeStroke = active ? "rgba(249,115,22,0.6)" : style.stroke;
  const glowFilter = (active || glow)
    ? "drop-shadow(0 0 6px rgba(249,115,22,0.35))"
    : undefined;

  const content = (
    <g
      role={onInteract ? "button" : undefined}
      tabIndex={onInteract ? 0 : undefined}
      aria-label={onInteract ? label : undefined}
      aria-pressed={onInteract ? active : undefined}
      onMouseEnter={onInteract ? () => onInteract(true) : undefined}
      onMouseLeave={onInteract ? () => onInteract(false) : undefined}
      onFocus={onInteract ? () => onInteract(true) : undefined}
      onBlur={onInteract ? () => onInteract(false) : undefined}
      onClick={onInteract ? () => onInteract(!active) : undefined}
      onKeyDown={onInteract ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onInteract(!active);
        }
      } : undefined}
      style={{ cursor: onInteract ? "pointer" : undefined, outline: "none" }}
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={active ? DEMO.fill.accentStrong : style.fill}
        stroke={activeStroke}
        strokeWidth={active ? 1.5 : 1}
        rx={0}
        style={{ filter: glowFilter }}
      />
      <text
        x={x + w / 2}
        y={sublabel ? y + h / 2 - 5 : y + h / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={active ? DEMO.text.accent : style.textFill}
        fontSize={DEMO.font.label}
        fontWeight={500}
        fontFamily={DEMO.font.sans}
      >
        {label}
      </text>
      {sublabel && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 9}
          textAnchor="middle"
          dominantBaseline="central"
          fill={DEMO.text.secondary}
          fontSize={DEMO.font.sublabel}
          fontFamily={DEMO.font.mono}
        >
          {sublabel}
        </text>
      )}
    </g>
  );

  if (immediate) return content;

  return (
    <m.g
      variants={nodeAppear}
      initial="hidden"
      animate="visible"
      custom={delay / 0.12}
      style={{ transformOrigin: `${x + w / 2}px ${y + h / 2}px` }}
    >
      {content}
    </m.g>
  );
}
