import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Workflow } from "./workflow";

describe("Workflow section", () => {
  it("renders the section headline both lines", () => {
    render(<Workflow />);
    expect(screen.getByText(/Ein Lernpfad\./)).toBeInTheDocument();
    expect(screen.getByText(/Kurs, Übung, Ressource\./)).toBeInTheDocument();
  });

  it("renders all three station headers", () => {
    render(<Workflow />);
    expect(screen.getByText(/Kurs wählen/)).toBeInTheDocument();
    expect(screen.getByText(/Fortschritt speichern/)).toBeInTheDocument();
    expect(screen.getByText(/Material anwenden/)).toBeInTheDocument();
  });

  it("connects the workflow to the public blog methodology", () => {
    render(<Workflow />);
    expect(screen.getByText(/Im Blog: Der EU AI Act/)).toBeInTheDocument();
    expect(screen.getByText(/Primärquellen/)).toBeInTheDocument();
    expect(screen.getByText(/deine Rechte/)).toBeInTheDocument();
  });
});
