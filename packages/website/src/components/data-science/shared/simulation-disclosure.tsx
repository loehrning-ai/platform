"use client";

import { useDataScienceLocale } from "@/components/data-science/locale-context";

export function SimulationDisclosure() {
  const { text } = useDataScienceLocale();

  return (
    <p className="simulation-disclosure" role="note">
      <strong>{text("Scope", "Geltungsbereich")}:</strong>{" "}
      {text(
        "Local teaching model on fixed synthetic or seeded pseudorandom data; it does not estimate, validate, or certify a production system.",
        "Lokales Lehrmodell mit festen synthetischen oder initialisierten Pseudozufallsdaten. Es schätzt, validiert oder zertifiziert kein Produktionssystem.",
      )}
    </p>
  );
}
