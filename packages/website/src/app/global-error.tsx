"use client";

// Catches errors thrown in the ROOT layout itself (fonts, providers, JsonLd) —
// where the regular error.tsx (which only wraps `children`) cannot help. It must
// render its own <html>/<body> and use inline styles, since the app shell and
// Tailwind/font pipeline may be exactly what failed. Keep it minimal + branded.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  reportClientBoundaryError,
  validatedNextDigest,
} from "@/lib/observability/client-boundary-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const english = pathname === "/en" || pathname.startsWith("/en/");
  const copy = english
    ? {
        title: "The application could not be loaded.",
        body: "An unexpected error occurred. Reload the application.",
        errorId: "Error ID",
        retry: "Retry",
      }
    : {
        title: "Die Anwendung konnte nicht geladen werden.",
        body: "Ein unerwarteter Fehler ist aufgetreten. Lade die Anwendung erneut.",
        errorId: "Fehler-ID",
        retry: "Erneut laden",
      };
  const digest = validatedNextDigest(error);

  useEffect(() => {
    reportClientBoundaryError("app-global", error);
  }, [error]);

  return (
    <html lang={english ? "en" : "de"}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          padding: "1.5rem",
          textAlign: "center",
          backgroundColor: "#0d0b09",
          color: "#f5f0e8",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <span
          style={{
            display: "block",
            height: "2px",
            width: "2.5rem",
            backgroundColor: "#f97316",
          }}
        />
        <h1
          style={{
            margin: 0,
            fontSize: "2rem",
            fontWeight: 700,
            letterSpacing: "-0.04em",
          }}
        >
          {copy.title}
        </h1>
        <p style={{ margin: 0, maxWidth: "28rem", color: "#a89070" }}>
          {copy.body}
        </p>
        {digest && (
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#a89070" }}>
            {copy.errorId}: {digest}
          </p>
        )}
        <button
          type="button"
          onClick={() => reset()}
          style={{
            border: "1px solid #f97316",
            borderRadius: "0.625rem",
            backgroundColor: "transparent",
            color: "#f5f0e8",
            padding: "0.75rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)",
          }}
        >
          {copy.retry}
        </button>
      </body>
    </html>
  );
}
