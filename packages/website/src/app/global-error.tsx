"use client";

// Catches errors thrown in the ROOT layout itself (fonts, providers, JsonLd) —
// where the regular error.tsx (which only wraps `children`) cannot help. It must
// render its own <html>/<body> and use inline styles, since the app shell and
// Tailwind/font pipeline may be exactly what failed. Keep it minimal + branded.

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    if (process.env.NODE_ENV === "development")
      console.error("Global error:", error.message);
  }, [error]);

  return (
    <html lang="de">
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
          Etwas ist schiefgelaufen.
        </h1>
        <p style={{ margin: 0, maxWidth: "28rem", color: "#a89070" }}>
          Ein unerwarteter Fehler ist aufgetreten. Bitte lade die Seite neu.
        </p>
        {error.digest && (
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b5b49" }}>
            Fehler-ID: {error.digest}
          </p>
        )}
        <button
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
          Erneut versuchen
        </button>
      </body>
    </html>
  );
}
