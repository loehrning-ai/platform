"use client";

import Link from "next/link";
import { useRef, useState, type MouseEventHandler, type PointerEvent, type ReactNode, type Ref } from "react";
import { cx } from "@/components/werk/cx";
import { GLAS_PRIORITY } from "./budget";
import { useLiveSlot } from "./glas-root";
import { GlasIcon, type GlasIconName } from "./icons";

export type GlasButtonVariant = "prominent" | "glass" | "plain" | "fill" | "icon";
export type GlasButtonSize = "large" | "regular" | "compact";

export interface GlasButtonProps {
  readonly variant?: GlasButtonVariant;
  readonly size?: GlasButtonSize;
  /** Full width (the intro and the phone dock). */
  readonly block?: boolean;
  readonly icon?: GlasIconName;
  /** Icon after the label (a "Weiter" arrow). */
  readonly trailingIcon?: GlasIconName;
  /** Required for variant="icon": the accessible name (also shown as the tooltip). */
  readonly label?: string;
  readonly children?: ReactNode;
  readonly onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  /** A link instead of a button. */
  readonly href?: string;
  /** With href: a download (the file name, or true). */
  readonly download?: string | boolean;
  readonly type?: "button" | "submit";
  readonly disabled?: boolean;
  readonly className?: string;
  readonly id?: string;
  readonly buttonRef?: Ref<HTMLButtonElement>;
  readonly "aria-keyshortcuts"?: string;
  readonly "aria-expanded"?: boolean;
  readonly "aria-controls"?: string;
  readonly "aria-describedby"?: string;
  readonly "aria-pressed"?: boolean;
  readonly [data: `data-${string}`]: string | undefined;
}

/**
 * Button (glass-spec 4.2). prominent: the one Mennige action per screen.
 * glass: a regular-glass capsule standing alone on the field. plain: a
 * secondary action inside glass. fill: a quiet filled capsule inside glass.
 * icon: a 44px circle with a name for screen readers. Press lights up from
 * the touch point and scales to 0.96.
 */
export function GlasButton({
  variant = "plain",
  size = "regular",
  block,
  icon,
  trailingIcon,
  label,
  children,
  onClick,
  href,
  download,
  type = "button",
  disabled,
  className,
  buttonRef,
  ...rest
}: GlasButtonProps) {
  const [pressed, setPressed] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const isLive = useLiveSlot(ref, variant === "glass" ? GLAS_PRIORITY.chip : false);
  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--px", `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty("--py", `${event.clientY - box.top}px`);
    setPressed(true);
  };
  const release = () => setPressed(false);
  const glass = variant === "glass";
  const common = {
    className: cx("glas-btn", glass && "glas", className),
    "data-variant": glass ? "glass" : variant,
    "data-size": size === "regular" ? undefined : size,
    "data-block": block ? "" : undefined,
    "data-pressed": pressed ? "" : undefined,
    "data-material": glass ? "regular" : undefined,
    "data-shape": glass ? "capsule" : undefined,
    "data-live": glass ? (isLive ? "on" : "off") : undefined,
    "aria-label": variant === "icon" ? label : undefined,
    title: variant === "icon" ? label : undefined,
    onPointerDown,
    onPointerUp: release,
    onPointerLeave: release,
    onPointerCancel: release,
    ...rest,
  };
  const body = (
    <>
      <span className="glas-btn-glow" aria-hidden="true" />
      {icon ? <GlasIcon name={icon} /> : null}
      {variant === "icon" ? null : children}
      {trailingIcon ? <GlasIcon name={trailingIcon} /> : null}
    </>
  );
  if (href) {
    const external = /^https?:/.test(href) || download !== undefined;
    if (external) {
      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          href={href}
          download={download === true ? "" : download || undefined}
          onClick={onClick as MouseEventHandler<HTMLAnchorElement>}
          {...common}
        >
          {body}
        </a>
      );
    }
    return (
      <Link ref={ref as Ref<HTMLAnchorElement>} href={href} prefetch={false} onClick={onClick as MouseEventHandler<HTMLAnchorElement>} {...common}>
        {body}
      </Link>
    );
  }
  return (
    <button
      ref={(node) => {
        ref.current = node;
        if (typeof buttonRef === "function") buttonRef(node);
        else if (buttonRef && typeof buttonRef === "object") (buttonRef as { current: HTMLButtonElement | null }).current = node;
      }}
      type={type}
      disabled={disabled}
      onClick={onClick as MouseEventHandler<HTMLButtonElement>}
      {...common}
    >
      {body}
    </button>
  );
}
