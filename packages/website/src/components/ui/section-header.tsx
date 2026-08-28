import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  readonly eyebrow?: string;
  readonly eyebrowColor?: string;
  readonly heading: string;
  readonly description?: string;
  readonly centered?: boolean;
}

export function SectionHeader({
  eyebrow,
  eyebrowColor = "text-brand-orange",
  heading,
  description,
  centered = true,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-8 sm:mb-12", centered && "text-center")}>
      {eyebrow && (
        <p
          className={cn(
            "text-sm font-bold tracking-[-0.01em]",
            eyebrowColor,
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-balance text-[clamp(1.75rem,1.2rem+2.4vw,2.5rem)] font-bold tracking-[-0.04em]">
        {heading}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-3 max-w-[68ch] text-base leading-7 text-muted-foreground",
            centered && "mx-auto",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
