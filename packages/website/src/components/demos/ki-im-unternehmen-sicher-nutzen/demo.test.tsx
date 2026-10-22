import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CARD_TEMPLATES, SCENES, UI, cards } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen";
import AiAtWorkDemo from "./index";
import { createDemoReducer, initialDemoState, resultsOf } from "./store";

const demoReducer = createDemoReducer(SCENES);

function mockReducedMotion(reduce: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: reduce && query.includes("reduce"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }),
  });
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  window.location.hash = "";
  mockReducedMotion(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function lamp(light: "green" | "amber" | "red") {
  const button = document.querySelector<HTMLButtonElement>(`[data-lamp="${light}"]`);
  if (!button) throw new Error(`no ${light} lamp`);
  return button;
}

describe("server render", () => {
  it.each(["de", "en"] as const)("renders every region, the question and the full templates in %s", (locale) => {
    const html = renderToString(<AiAtWorkDemo locale={locale} />);
    for (const id of ["einfuegungen", "ana", "freitag", "mitnehmen", "quellen"]) {
      expect(html).toContain(`id="${id}"`);
    }
    const copy = UI[locale];
    expect(html).toContain(copy.ask);
    expect(html).toContain(copy.cardReply);
    expect(html).toContain(copy.cardRules);
    expect(html).toContain(copy.cardMail);
    // Let the DOM parser read the markup instead of stripping tags and entities by hand.
    const holder = document.createElement("div");
    holder.innerHTML = html;
    const text = holder.textContent ?? "";
    const empty = cards({ tool: "", owner: "" }, locale);
    for (const card of [empty.reply, empty.rules, empty.mail]) {
      for (const line of card.split("\n").filter(Boolean)) expect(text).toContain(line);
    }
    expect(html).not.toMatch(/<details|<summary|aria-expanded/);
  });

  it("shows the English vendor mail on the German page only", () => {
    const de = renderToString(<AiAtWorkDemo locale="de" />);
    const en = renderToString(<AiAtWorkDemo locale="en" />);
    expect(de).toContain('data-copy-text="mail-en"');
    expect(en).not.toContain('data-copy-text="mail-en"');
    expect(en).toContain("Subject: Three questions about our data in ");
  });
});

describe("the loop", () => {
  it("commits a light, moves focus to the verdict and never collapses", () => {
    render(<AiAtWorkDemo locale="de" />);
    expect(document.querySelector("details, summary, [aria-expanded]")).toBeNull();
    fireEvent.click(lamp("red"));
    const verdict = document.getElementById("w05-ana-verdict");
    expect(verdict).toHaveFocus();
    expect(verdict).toHaveTextContent("Du:Rot");
    expect(screen.getByText("Stimmt.")).toBeInTheDocument();
    expect(lamp("red")).toHaveAttribute("aria-pressed", "true");
    expect(lamp("green")).toHaveAttribute("aria-disabled", "true");
    // A locked lamp does not change the answer.
    fireEvent.click(lamp("green"));
    expect(lamp("red")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(SCENES[0]?.afterNote?.de ?? "")).toBeInTheDocument();
    expect(document.querySelector("details, summary, [aria-expanded]")).toBeNull();
  });

  it("turns the dials with the keyboard and announces the new light", () => {
    render(<AiAtWorkDemo locale="de" />);
    fireEvent.click(lamp("amber"));
    expect(screen.getByText("Zu locker.")).toBeInTheDocument();
    const account = within(document.querySelector('[data-dial="w05-ana-account"]') as HTMLElement);
    const checked = account.getByRole("radio", { checked: true });
    expect(checked).toHaveTextContent("Privat: Chatbot");
    fireEvent.keyDown(checked, { key: "ArrowRight" });
    const team = account.getByRole("radio", { name: "Firma: Team" });
    expect(team).toHaveAttribute("aria-checked", "true");
    expect(team).toHaveFocus();
    const result = document.querySelector("[data-now-light]");
    expect(result).toHaveAttribute("data-now-light", "amber");
    expect(result).toHaveAttribute("data-found", "");
    const live = document.querySelector("[data-live]");
    expect(live).toHaveTextContent(
      "Jetzt Gelb. Gefunden. Firmenwerkzeug: Gelb. Gelb ist eine To-do-Liste, keine Erlaubnis. Vorher: nichts in den Dateien. Jetzt belegt: gespeichert in den USA. To-do: Namen und Nummern raus, eine benannte Person prüft.",
    );
    fireEvent.keyDown(team, { key: "Home" });
    expect(account.getByRole("radio", { name: "Privat: Chatbot" })).toHaveAttribute("aria-checked", "true");
  });

  it("keeps Marko red on Enterprise with the key still in", () => {
    window.location.hash = "#marko";
    render(<AiAtWorkDemo locale="de" />);
    expect(document.querySelector("[data-scene]")).toHaveAttribute("data-scene", "marko");
    fireEvent.click(lamp("amber"));
    fireEvent.click(screen.getByRole("radio", { name: "Firma: Enterprise" }));
    expect(document.querySelector("[data-now-light]")).toHaveAttribute("data-now-light", "red");
    expect(document.querySelector("[data-fix-line]")).toHaveTextContent("Noch rot. Enterprise macht aus Rot kein Grün.");
    fireEvent.click(screen.getByRole("radio", { name: "Schlüssel durch [API_KEY] ersetzt" }));
    expect(document.querySelector("[data-now-light]")).toHaveAttribute("data-now-light", "amber");
    expect(document.querySelector("[data-todo]")).toHaveTextContent("Vertrag mit dem Kunden prüfen");
  });

  it("goes to the next scene and focuses its heading", () => {
    render(<AiAtWorkDemo locale="de" />);
    fireEvent.click(lamp("red"));
    fireEvent.click(screen.getByRole("button", { name: /Nächste Szene/ }));
    expect(document.getElementById("w05-stefan-heading")).toHaveFocus();
  });

  it("shows every animated element at its end state under reduced motion", () => {
    render(<AiAtWorkDemo locale="de" />);
    fireEvent.click(lamp("green"));
    fireEvent.click(screen.getByRole("radio", { name: "Firma: Team" }));
    const animated = [...document.querySelectorAll<HTMLElement | SVGElement>("[data-t]")];
    expect(animated.length).toBeGreaterThan(0);
    for (const element of animated) expect(element.getAttribute("data-t")).toBe("1.00");
  });
});

describe("Freitag", () => {
  it("locks a vote, stamps it and shows the evidence and the true sentence", () => {
    render(<AiAtWorkDemo locale="de" />);
    const first = document.querySelector('[data-sentence="1"]') as HTMLElement;
    expect(first.querySelector("[data-friday-result]")).toBeNull();
    fireEvent.click(within(first).getByRole("button", { name: "Stimmt" }));
    expect(document.getElementById("w05-friday-1-result")).toHaveFocus();
    expect(first).toHaveTextContent("Die Lösung: Stimmt nicht.");
    expect(first).toHaveTextContent("Petar: Claude Desktop");
    expect(first).toHaveTextContent("zuständig: IT-Leitung");
    fireEvent.click(within(first).getByRole("button", { name: "Stimmt nicht" }));
    expect(within(first).getByRole("button", { name: "Stimmt" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("Zum Mitnehmen", () => {
  it("fills all three templates from the two fields", () => {
    render(<AiAtWorkDemo locale="de" />);
    fireEvent.change(screen.getByLabelText("Name eures Firmenwerkzeugs"), { target: { value: "Claude Team" } });
    fireEvent.change(screen.getByLabelText("Wen fragst du vorher?"), { target: { value: "IT-Leitung" } });
    const filled = cards({ tool: "Claude Team", owner: "IT-Leitung" }, "de");
    expect(document.querySelector('[data-copy-text="reply"]')?.textContent).toBe(filled.reply);
    expect(document.querySelector('[data-copy-text="rules"]')?.textContent).toBe(filled.rules);
    expect(document.querySelector('[data-copy-text="mail"]')?.textContent).toBe(filled.mail);
    expect(document.querySelector('[data-copy-text="mail-en"]')?.textContent).toBe(filled.mailEn);
    expect(document.querySelector("[data-reply-note]")).toHaveTextContent("Vor dem Senden prüft IT-Leitung jeden Satz.");
  });

  it("copies exactly the shown text and confirms it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<AiAtWorkDemo locale="de" />);
    fireEvent.change(screen.getByLabelText("Name eures Firmenwerkzeugs"), { target: { value: "Claude Team" } });
    await act(async () => {
      fireEvent.click(document.querySelector('[data-copy-button="rules"]') as HTMLElement);
    });
    expect(writeText).toHaveBeenCalledWith(document.querySelector('[data-copy-text="rules"]')?.textContent);
    expect(document.querySelector('[data-copy-status="rules"]')).toHaveTextContent("Kopiert");
  });

  it("selects the text when the clipboard is refused", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<AiAtWorkDemo locale="en" />);
    await act(async () => {
      fireEvent.click(document.querySelector('[data-copy-button="mail"]') as HTMLElement);
    });
    expect(document.querySelector('[data-copy-status="mail"]')).toHaveTextContent("Selected: copy with Ctrl+C");
    expect(window.getSelection()?.toString()).toBe(CARD_TEMPLATES.en.mail.replace(/\{TOOL\}/g, "[COMPANY TOOL]"));
  });

  it("shows the learner's scenes inside the rules card after a commit, and Von vorn keeps the fields", () => {
    render(<AiAtWorkDemo locale="de" />);
    expect(document.querySelector("[data-your-scenes]")).toBeNull();
    fireEvent.change(screen.getByLabelText("Name eures Firmenwerkzeugs"), { target: { value: "Claude Team" } });
    fireEvent.click(lamp("green"));
    expect(document.querySelector("[data-your-scenes]")).toHaveTextContent("Nie ← Ana (du: zu locker)");
    fireEvent.click(screen.getByRole("button", { name: "Von vorn" }));
    expect(document.querySelector("[data-your-scenes]")).toBeNull();
    expect(lamp("green")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText("Name eures Firmenwerkzeugs")).toHaveValue("Claude Team");
  });
});

describe("round 2 fixes", () => {
  it("never calls the boss's draft true: the close line waits for all three votes", () => {
    render(<AiAtWorkDemo locale="de" />);
    const close = () => document.querySelector("[data-friday-close]");
    expect(close()).toHaveAttribute("data-friday-close", "pending");
    expect(close()).toHaveTextContent("Stimm bei jedem Satz ab, dann siehst du, was wahr wäre.");
    expect(close()).not.toHaveTextContent("wahr für Vardar Works");
    for (const n of [1, 2]) {
      fireEvent.click(document.querySelector(`[data-sentence="${n}"] [data-vote="false"]`) as HTMLElement);
    }
    expect(close()).toHaveAttribute("data-friday-close", "pending");
    fireEvent.click(document.querySelector('[data-sentence="3"] [data-vote="half"]') as HTMLElement);
    expect(close()).toHaveTextContent("Die Sätze unter „Wahr wäre“ sind wahr für Vardar Works.");
    expect(close()?.querySelector('a[href="#mitnehmen"]')).toBeInTheDocument();
  });

  it("names the phone slots by their first letters, never by number", () => {
    render(<AiAtWorkDemo locale="de" />);
    const initials = [...document.querySelectorAll("[data-slot-initials]")].map((el) => el.textContent);
    expect(initials).toEqual(SCENES.map((scene) => scene.person.slice(0, 2)));
    expect(document.querySelector('[data-slot="marko"]')).toHaveAttribute("aria-label", "Marko, offen");
  });

  it("has no start button: the kit line and the templates link sit under the heading", () => {
    render(<AiAtWorkDemo locale="de" />);
    expect(document.querySelector("[data-start]")).toBeNull();
    const intro = document.querySelector("#einfuegungen [data-w05-intro]");
    expect(intro).toHaveTextContent("Mit dem Kit? Erst auf Papier, dann hier.");
    expect(intro?.querySelector('a[href="#mitnehmen"]')).toHaveTextContent("Zu den Vorlagen");
  });

  it("moves focus to the section heading after an in-page jump", async () => {
    render(<AiAtWorkDemo locale="de" />);
    const settle = () =>
      act(async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 5));
      });
    fireEvent.click(document.querySelector("[data-to-templates]") as HTMLElement);
    await settle();
    expect(document.getElementById("mitnehmen-heading")).toHaveFocus();
    // A link outside the demo (the page band, for example) gets the same focus move.
    const outside = document.createElement("a");
    outside.href = "#einfuegungen";
    outside.textContent = "outside";
    document.body.append(outside);
    fireEvent.click(outside);
    await settle();
    expect(document.getElementById("einfuegungen-heading")).toHaveFocus();
    outside.remove();
  });

  it("keeps the learner's verdict apart from the scene note in the rules evidence", () => {
    render(<AiAtWorkDemo locale="en" />);
    window.location.hash = "#dario";
    act(() => {
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    fireEvent.click(lamp("green"));
    // Dario's key is red; green is the learner's too-loose call, in its own bracket.
    expect(document.querySelector("[data-your-scenes]")).toHaveTextContent(
      "Allowed ← Dario with made-up rows (you: too loose)",
    );
  });
});

describe("store", () => {
  it("ignores a second commit and dials before a commit", () => {
    let state = initialDemoState(SCENES);
    state = demoReducer(state, { type: "dial", id: "ana", dial: { account: "claudeTeam", content: "asIs" } });
    expect(state.runs.ana.dial.account).toBe("freeChatbot");
    state = demoReducer(state, { type: "commit", id: "ana", light: "red" });
    state = demoReducer(state, { type: "commit", id: "ana", light: "green" });
    expect(state.runs.ana.picked).toBe("red");
    state = demoReducer(state, { type: "dial", id: "ana", dial: { account: "claudeTeam", content: "asIs" } });
    expect(state.runs.ana.tried).toBe(true);
    state = demoReducer(state, { type: "dial", id: "ana", dial: { account: "freeChatbot", content: "asIs" } });
    expect(state.runs.ana.tried).toBe(true);
    expect(resultsOf(state, SCENES)).toEqual([{ id: "ana", picked: "red", tried: true }]);
  });

  it("shows the table and summary in Freitag once Dario is committed", () => {
    render(<AiAtWorkDemo locale="de" />);
    expect(document.querySelector("[data-friday-ledger]")).toBeNull();
    window.location.hash = "#dario";
    act(() => {
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    fireEvent.click(lamp("red"));
    expect(document.querySelector("[data-friday-ledger]")).toBeInTheDocument();
    expect(document.querySelector("[data-summary]")).toHaveTextContent("1 von 8 wie die Lösung.");
    expect(document.querySelector("[data-to-friday]")).toHaveAttribute("href", "#freitag");
  });

  it("never breaks a placeholder token or a source date at its hyphen", () => {
    render(<AiAtWorkDemo locale="de" />);
    fireEvent.click(lamp("amber"));
    const token = [...document.querySelectorAll("[data-token]")].find((el) => el.textContent === "[E-MAIL]");
    expect(token).toHaveClass("whitespace-nowrap");
    const dates = [...document.querySelectorAll("[data-fact-date]")];
    expect(dates.length).toBeGreaterThan(0);
    for (const date of dates) expect(date).toHaveClass("whitespace-nowrap");
    expect(document.querySelector('[data-fact="1"]')).toHaveTextContent("2026-03-16, 2026-08-18");
  });
});
