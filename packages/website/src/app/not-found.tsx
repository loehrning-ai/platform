import { BrandButton } from "@/components/ui/brand-button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 font-mono text-6xl font-bold text-brand-orange">404</span>
      <h1 className="text-3xl font-bold tracking-[-0.04em] text-foreground">
        Seite nicht gefunden.
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>
      <div className="mt-8">
        <BrandButton href="/" variant="primary" surface="light">
          Zur Startseite
        </BrandButton>
      </div>
    </div>
  );
}
