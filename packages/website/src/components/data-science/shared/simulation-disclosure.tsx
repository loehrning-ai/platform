"use client";

import { useDataScienceLocale } from "@/components/data-science/locale-context";

export function SimulationDisclosure() {
  const { text } = useDataScienceLocale();

  return (
    <p className="simulation-disclosure" role="note">
      <strong>{text("Scope", "Geltungsbereich")}:</strong>{" "}
      {text(
        "This local teaching model uses fixed synthetic inputs or a pseudorandom sequence generated in this browser. Seeded models reproduce the same sequence for the same settings. Its output illustrates the named concept; it does not estimate, validate, or certify a production system.",
        "Dieses lokale Lehrmodell verwendet feste synthetische Eingaben oder eine in diesem Browser erzeugte Pseudozufallsfolge. Initialisierte Modelle wiederholen bei gleichen Einstellungen dieselbe Folge. Die Ausgabe veranschaulicht das genannte Konzept; sie schätzt, validiert oder zertifiziert kein Produktionssystem.",
      )}
    </p>
  );
}
