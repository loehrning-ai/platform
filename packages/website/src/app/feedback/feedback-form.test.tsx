import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FeedbackForm } from "./feedback-form";

describe("<FeedbackForm>", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
  });

  it("exposes the selected feedback category as a pressed button", () => {
    render(<FeedbackForm />);

    const content = screen.getByRole("button", {
      name: "Inhaltsfehler oder Unklarheit",
    });
    const technical = screen.getByRole("button", {
      name: "Technisches Problem",
    });

    expect(content).toHaveAttribute("aria-pressed", "true");
    expect(technical).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(technical);

    expect(content).toHaveAttribute("aria-pressed", "false");
    expect(technical).toHaveAttribute("aria-pressed", "true");
  });

  it("gives the message field stable form semantics and an example placeholder", () => {
    render(<FeedbackForm />);

    const message = screen.getByRole("textbox", { name: /Nachricht/i });
    expect(message).toHaveAttribute("name", "message");
    expect(message).toHaveAttribute("autocomplete", "off");
    expect(message).toHaveAttribute(
      "placeholder",
      "Zum Beispiel: Eine Quellenangabe ist unklar …",
    );
    expect(message).toHaveAttribute(
      "aria-describedby",
      "feedback-message-requirement feedback-message-count",
    );
  });

  it("submits only a same-origin source pathname, never query or fragment data", async () => {
    window.history.pushState({}, "", "/feedback?token=private#draft");
    vi.spyOn(document, "referrer", "get").mockReturnValue(
      `${window.location.origin}/buecher/ki-landschaft?token=private#chapter`,
    );
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    render(<FeedbackForm />);
    fireEvent.change(screen.getByLabelText(/Nachricht/), {
      target: { value: "Ein ausreichend langer Hinweis." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rückmeldung senden" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const init = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(init?.body))).toMatchObject({
      contextUrl: "/buecher/ki-landschaft",
    });
  });

  it("omits diagnostic context for direct or cross-origin visits", async () => {
    vi.spyOn(document, "referrer", "get").mockReturnValue(
      "https://external.example/private?token=secret",
    );
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    render(<FeedbackForm />);
    fireEvent.change(screen.getByLabelText(/Nachricht/), {
      target: { value: "Ein ausreichend langer Hinweis." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rückmeldung senden" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const init = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(init?.body))).not.toHaveProperty("contextUrl");
  });

  it("keeps submit available, focuses and associates an inline error, then clears it after correction", () => {
    render(<FeedbackForm />);

    const message = screen.getByRole("textbox", { name: /Nachricht/i });
    const submit = screen.getByRole("button", { name: /Rückmeldung senden/i });
    expect(message).toHaveAttribute("minlength", "10");
    expect(message).toHaveAttribute("maxlength", "2000");
    expect(message).toBeRequired();
    expect(submit).toBeEnabled();

    fireEvent.change(message, { target: { value: "          " } });
    fireEvent.click(submit);

    expect(message).toHaveFocus();
    expect(message).toHaveAttribute("aria-invalid", "true");
    expect(message).toHaveAttribute(
      "aria-describedby",
      "feedback-message-requirement feedback-message-error feedback-message-count",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Gib mindestens 10 Zeichen ein.",
    );

    fireEvent.change(message, { target: { value: "x".repeat(42) } });
    expect(submit).toBeEnabled();
    expect(message).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByText("Gib mindestens 10 Zeichen ein.")).toBeNull();
    expect(screen.getByText("42 / 2000")).toBeVisible();
  });

  it("recovers from a failed request without leaving the submit control pending", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));
    render(<FeedbackForm />);

    fireEvent.change(screen.getByRole("textbox", { name: /Nachricht/i }), {
      target: { value: "Ein ausreichend langer Hinweis." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Rückmeldung senden/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Die Rückmeldung konnte nicht gesendet werden.",
    );
    expect(screen.getByRole("button", { name: /Rückmeldung senden/i })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Wird gesendet/i })).not.toBeInTheDocument();
  });

  it("prevents double submission while a request is pending", async () => {
    let finishRequest!: (response: Response) => void;
    const response = new Promise<Response>((resolve) => {
      finishRequest = resolve;
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockReturnValue(response);
    const { container } = render(<FeedbackForm />);

    fireEvent.change(screen.getByRole("textbox", { name: /Nachricht/i }), {
      target: { value: "Ein ausreichend langer Hinweis." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Rückmeldung senden/i }));

    const pending = screen.getByRole("button", { name: /Wird gesendet/i });
    expect(pending).toBeDisabled();
    fireEvent.submit(container.querySelector("form")!);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      finishRequest(new Response(JSON.stringify({ ok: true }), { status: 200 }));
      await response;
    });
    expect(await screen.findByText("Danke für deine Rückmeldung.")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
