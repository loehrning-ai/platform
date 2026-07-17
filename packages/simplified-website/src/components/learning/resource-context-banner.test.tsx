import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the learning-graph module
vi.mock("@/lib/learning-graph", () => ({
  LEARNING_NODES: [
    {
      id: "template:ki-inventarliste",
      type: "template",
      title: "KI-Inventarliste",
      route: "/vorlagen/ki-inventarliste",
      access: "gated-learning-app",
      language: "de",
      audience: ["verantwortliche"],
      level: "intermediate",
      stage: "dokumentieren",
      evidenceMode: "source_backed",
      sourceOwner: "editorial:governance",
      courseSlug: "eu-ai-act-kurs",
    },
    {
      id: "course:eu-ai-act-kurs",
      type: "course",
      title: "EU AI Act Kurs",
      route: "/eu-ai-act-kurs",
      access: "public-preview",
      language: "de",
      audience: ["verantwortliche"],
      level: "intermediate",
      stage: "regeln",
      evidenceMode: "source_backed",
      sourceOwner: "editorial:courses",
    },
    {
      id: "demo:ki-check",
      type: "demo",
      title: "KI-Check Demo",
      route: "/demos/ki-check",
      access: "gated-learning-app",
      language: "de",
      audience: ["praktiker"],
      level: "entry",
      stage: "anwenden",
      evidenceMode: "self_attested",
      sourceOwner: "editorial:demos",
    },
  ],
  LEARNING_EDGES: [
    { from: "template:ki-inventarliste", to: "course:eu-ai-act-kurs", type: "governance_artifact_for" },
    { from: "demo:ki-check", to: "course:eu-ai-act-kurs", type: "practice_for" },
  ],
  PATHWAY_STAGE_DISPLAY: {
    pruefen: { displayLabel: "Prüfen", subtitle: "Wo stehe ich?", description: "", icon: "MapPin" },
    grundlagen: { displayLabel: "Verstehen", subtitle: "", description: "", icon: "" },
    regeln: { displayLabel: "Einordnen", subtitle: "", description: "", icon: "" },
    anwenden: { displayLabel: "Umsetzen", subtitle: "", description: "", icon: "" },
    dokumentieren: { displayLabel: "Belegen", subtitle: "", description: "", icon: "" },
    vertiefen: { displayLabel: "Vertiefen", subtitle: "", description: "", icon: "" },
  },
}));

import { ResourceContextBanner } from "./resource-context-banner";

describe("ResourceContextBanner", () => {
  it("renders for a known template nodeId with stage info", () => {
    render(<ResourceContextBanner nodeId="template:ki-inventarliste" />);
    expect(screen.getByRole("note")).toBeInTheDocument();
    expect(screen.getAllByText(/Stufe 5: Belegen/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Arbeitsvorlage/).length).toBeGreaterThan(0);
  });

  it("shows related course context", () => {
    render(<ResourceContextBanner nodeId="template:ki-inventarliste" />);
    expect(screen.getByText(/EU AI Act Kurs/)).toBeInTheDocument();
  });

  it("renders null for unknown nodeId (graceful degradation)", () => {
    const { container } = render(<ResourceContextBanner nodeId="unknown:node" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders for a demo nodeId with correct label", () => {
    render(<ResourceContextBanner nodeId="demo:ki-check" />);
    expect(screen.getAllByText(/Praxisbeispiel/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Stufe 4: Umsetzen/).length).toBeGreaterThan(0);
  });
});
