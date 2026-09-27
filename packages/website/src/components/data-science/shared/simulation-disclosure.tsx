"use client";

import { useDataScienceLocale } from "@/components/data-science/locale-context";

export function SimulationDisclosure() {
  const { text } = useDataScienceLocale();

  return (
    <p className="simulation-disclosure" role="note">
      <strong>{text("Scope", "Geltungsbereich")}:</strong>{" "}
      {text(
        "Local teaching model on fixed or seeded data; the same settings give the same output. It does not estimate, validate, or certify a production system.",
        "Lokales Lehrmodell mit festen oder per Seed erzeugten Daten; gleiche Einstellungen liefern dieselbe Ausgabe. Es schätzt, validiert oder zertifiziert kein Produktionssystem.",
      )}
    </p>
  );
}
