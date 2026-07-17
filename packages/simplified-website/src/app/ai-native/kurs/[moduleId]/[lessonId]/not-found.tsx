import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LektionNotFound() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
          404
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
          Diese Lektion gibt es nicht
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Der Link ist veraltet oder die Lektion wurde verschoben. In der
          Kursübersicht finden Sie alle aktuellen Lektionen.
        </p>
        <Link
          href="/ai-native/kurs"
          className="mt-6 inline-flex items-center gap-2 text-sm text-brand-orange transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Zur Kursübersicht
        </Link>
      </div>
    </div>
  );
}
