/**
 * Class recipes of the take-home block. Square, 44px targets, ink outline;
 * hover and press swap to the anti colour (ink fill, paper text), never a tint.
 */
export const TAKEHOME_BUTTON =
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border-2 border-foreground bg-background px-4 text-[0.9375rem] font-semibold text-foreground [-webkit-tap-highlight-color:transparent] active:bg-foreground active:text-background focus-visible:outline-offset-2 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:text-background";

/** The file chip: the same look on the stage and in the block. */
export const FILE_CHIP =
  "inline-flex min-h-7 max-w-full items-center border border-foreground bg-background px-2 font-mono text-[0.8125rem] leading-tight text-foreground [overflow-wrap:anywhere]";
