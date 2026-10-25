import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/copy";
import Demo from "./demo";
import { countsAsRequest } from "./net-line";
import { isBulkEdit } from "./own-text";

const setup = (locale: "de" | "en" = "de") => render(<Demo copy={COPY[locale]} />);
const range = () => document.querySelector<HTMLInputElement>('.w05-track input[type="range"]') as HTMLInputElement;
const digit = () => document.querySelector(".w05-digit")?.textContent;
const move = (value: number) => fireEvent.change(range(), { target: { value: String(value) } });

beforeEach(() => {
  // Reduced motion: no intro, quantised hits, instant snap, a stable test.
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("reduce"), media: query, addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {}, dispatchEvent: () => false, onchange: null,
  }));
  Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true });
});
afterEach(cleanup);

describe("hero", () => {
  it("shows the counter at 4, four markers and one labelled handle", () => {
    setup();
    expect(digit()).toBe("4");
    expect(document.querySelectorAll('.w05-hit[data-state="marker"]')).toHaveLength(4);
    expect(screen.getAllByLabelText("Schwärzen")).toHaveLength(1);
    expect(range().getAttribute("aria-valuetext")).toBe("0 von 4 geschwärzt");
  });

  it("keeps the own-text controls in the DOM after the stage, reachable by keyboard", () => {
    setup();
    const stage = document.querySelector(".w05-stage") as HTMLElement;
    const paste = screen.getByRole("button", { name: "Meinen Text einfügen" });
    expect(stage.compareDocumentPosition(paste) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(paste.tabIndex).toBe(0);
  });

  it("has no collapsible UI", () => {
    setup();
    expect(document.querySelector("details, [aria-expanded], [role=tab]")).toBeNull();
  });
});

describe("the counter words", () => {
  const label = () => document.querySelector(".w05-counter-label")?.textContent;

  it("says what goes along in words at 4, 1 and 0, visibly, in German", () => {
    setup();
    expect(label()).toBe("fliegen mit");
    move(1000);
    expect(label()).toBe("Nichts fliegt mit");
    expect(document.querySelector(".w05-counter-label")?.closest(".w05-sr")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /E-Mail: mara\.beispiel@example\.com/ }));
    expect(digit()).toBe("1");
    expect(label()).toBe("fliegt mit");
  });

  it("uses 'goes along' for 1 and a visible 'Nothing goes along' at 0 in English", () => {
    setup("en");
    expect(label()).toBe("go along");
    move(1000);
    expect(label()).toBe("Nothing goes along");
    fireEvent.click(screen.getByRole("button", { name: /e-mail: mara\.beispiel@example\.com/ }));
    expect(digit()).toBe("1");
    expect(label()).toBe("goes along");
  });
});

describe("limits", () => {
  it("asks for a tap, in bold next to the rest scan, when capitalised names slipped past", () => {
    setup();
    fireEvent.change(screen.getByRole("textbox", { name: /Text hier einfügen/ }), { target: { value: "Hans Meier schrieb am Montag" } });
    move(1000);
    const hint = document.querySelector("[data-name-hint]") as HTMLElement;
    expect(hint.textContent).toBe("Namen ohne Anrede? Tippe sie an.");
    expect(hint.previousElementSibling?.className).toContain("w05-rest");
    expect(document.querySelector(".w05-rest")?.textContent).toBe("Rest-Scan: 0 Muster.");
  });

  it("stays quiet when every capitalised pair is covered", () => {
    setup();
    expect(document.querySelector("[data-name-hint]")).toBeNull();
  });

  it("splits no title: 'Frau Dr. Schmidt' is one marked name and one placeholder", () => {
    setup();
    fireEvent.change(screen.getByRole("textbox", { name: /Text hier einfügen/ }), { target: { value: "Frau Dr. Schmidt ruft an" } });
    const people = document.querySelectorAll('.w05-hit[data-kind="person"]');
    expect(people).toHaveLength(1);
    expect(people[0]?.querySelector(".w05-raw")?.textContent).toBe("Dr. Schmidt");
    expect(document.querySelectorAll(".w05-hit")).toHaveLength(1);
  });
});

describe("words stay visible", () => {
  it("renders every plain word after any text change, with no inline opacity or colour", () => {
    setup();
    move(1000);
    move(0);
    fireEvent.click(document.querySelectorAll<HTMLInputElement>('input[name="w05-sample"]')[1] as HTMLInputElement);
    fireEvent.change(screen.getByRole("textbox", { name: /Text hier einfügen/ }), { target: { value: "Frau Dr. Schmidt hat Rechnung über 1.200,00 € nicht bezahlt" } });
    const words = Array.from(document.querySelectorAll<HTMLElement>(".w05-word"));
    expect(words.length).toBeGreaterThan(5);
    for (const word of words) {
      expect(word.style.opacity).toBe("");
      expect(word.style.color).toBe("");
      expect(word.style.visibility).toBe("");
    }
  });
});

describe("the promise", () => {
  it("is printed under the stage when the page hands it over", () => {
    render(<Demo copy={COPY.de} promise="Füge deinen Text ein." note="Alles erfunden." />);
    const stage = document.querySelector(".w05-stage") as HTMLElement;
    const promise = document.querySelector("[data-w05-promise]") as HTMLElement;
    expect(promise.textContent).toBe("Füge deinen Text ein.");
    expect(stage.compareDocumentPosition(promise) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.querySelector("[data-w05-note]")?.textContent).toBe("Alles erfunden.");
  });
});

describe("the handle", () => {
  it("counts down, updates aria-valuetext and settles with the rest scan", () => {
    setup();
    move(600);
    expect(digit()).toBe("2");
    expect(range().getAttribute("aria-valuetext")).toBe("2 von 4 geschwärzt");
    move(1000);
    expect(digit()).toBe("0");
    expect(document.querySelector(".w05-rest")?.textContent).toBe("Rest-Scan: 0 Muster.");
    expect(document.querySelector(".w05-sr")?.textContent).toBe("Fertig. Rest-Scan: 0 Muster.");
  });

  it("snaps to 1 on release at 0.95 (instant without motion)", () => {
    setup();
    move(950);
    fireEvent.pointerUp(range());
    expect(range().value).toBe("1000");
  });

  it("moves by keyboard: under reduced motion every arrow press reaches the next stop, all the way to 1", () => {
    setup();
    const seen: string[] = [];
    for (let press = 0; press < 5; press += 1) {
      fireEvent.keyDown(range(), { key: "ArrowRight" });
      seen.push(range().value);
    }
    expect(seen).toEqual(["346", "500", "654", "808", "1000"]);
    const back: string[] = [];
    for (let press = 0; press < 5; press += 1) {
      fireEvent.keyDown(range(), { key: "ArrowLeft" });
      back.push(range().value);
    }
    expect(back).toEqual(["808", "654", "500", "346", "0"]);
    fireEvent.keyDown(range(), { key: "PageUp" });
    expect(range().value).toBe("346");
    fireEvent.keyDown(range(), { key: "End" });
    expect(range().value).toBe("1000");
    fireEvent.keyDown(range(), { key: "Home" });
    expect(range().value).toBe("0");
  });

  it("flips counter, value text and pill in the same render, at every value", () => {
    setup();
    for (let v = 0; v <= 1000; v += 7) {
      move(v);
      const done = document.querySelectorAll('.w05-hit[data-state="done"]').length;
      expect(digit()).toBe(String(4 - done));
      expect(range().getAttribute("aria-valuetext")).toBe(`${done} von 4 geschwärzt`);
    }
  });

  it("scrubs back: the same gesture un-blacks the text", () => {
    setup();
    move(1000);
    move(0);
    expect(digit()).toBe("4");
    expect(document.querySelectorAll('.w05-hit[data-state="marker"]')).toHaveLength(4);
  });
});

describe("taps", () => {
  it("blacks out a word by hand, counts it in the record and undoes it", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Hallo" }));
    expect(document.querySelector('.w05-hit[data-kind="manual"]')).not.toBeNull();
    expect(screen.getAllByText(/1 Angabe von Hand/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Rückgängig" }));
    expect(document.querySelector('.w05-hit[data-kind="manual"]')).toBeNull();
  });

  it("keeps a hit raw on tap, which the counter still counts as going along", () => {
    setup();
    move(1000);
    const email = screen.getByRole("button", { name: /E-Mail: mara\.beispiel@example\.com/ });
    fireEvent.click(email);
    expect(digit()).toBe("1");
    expect(email.getAttribute("aria-label")).toContain("bleibt stehen");
    expect(document.querySelector(".w05-pre")?.textContent).toContain("mara.beispiel@example.com");
  });

  it("walks the words with arrow keys (roving tabindex)", () => {
    setup();
    const nav = Array.from(document.querySelectorAll<HTMLElement>("[data-nav]"));
    expect(nav.filter((el) => el.tabIndex === 0)).toHaveLength(1);
    nav[0]!.focus();
    fireEvent.keyDown(nav[0]!, { key: "ArrowRight" });
    expect(document.activeElement).toBe(nav[1]);
  });
});

describe("account and verdict", () => {
  it("is red for Ana on a personal account and amber on Team, with the source line", () => {
    setup();
    const chip = () => document.querySelector(".w05-verdict") as HTMLElement;
    expect(chip().textContent).toContain("ROT.");
    expect(chip().textContent).toContain("Quelle: Folie 7 · Fakt 10 · Stand 18. Okt 2026");
    fireEvent.click(screen.getByLabelText("Team"));
    expect(chip().textContent).toContain("AMBER.");
    expect(chip().textContent).not.toContain("Enterprise macht Rot nicht grün");
    fireEvent.click(screen.getByLabelText("Enterprise"));
    expect(chip().textContent).toContain("Enterprise macht Rot nicht grün.");
  });

  it("shows OFFEN for clean text on a personal account and GRÜN only on the visitor's statement", () => {
    setup();
    move(1000);
    expect(document.querySelector(".w05-verdict")?.textContent).toContain("OFFEN.");
    fireEvent.click(screen.getByLabelText("Das steht schon öffentlich"));
    expect(document.querySelector(".w05-verdict")?.textContent).toContain("GRÜN.");
  });

  it("follows the handle: Mila on Enterprise is amber, a key is red anywhere", () => {
    setup();
    fireEvent.click(screen.getByLabelText("Code"));
    fireEvent.click(screen.getByLabelText("Enterprise"));
    expect(document.querySelector(".w05-verdict")?.textContent).toContain("ROT.");
  });
});

describe("verdict chip on the stage", () => {
  it("shows the light next to the handle and follows the account switch", () => {
    setup();
    const chip = () => document.querySelector("[data-verdict-chip]") as HTMLElement;
    expect(document.querySelector(".w05-stage")?.contains(chip())).toBe(true);
    expect(chip().textContent).toBe("ROT Kundendaten auf Privatkonto");
    fireEvent.click(screen.getByLabelText("Team"));
    expect(chip().textContent).toContain("AMBER");
    expect(chip().textContent).toContain("Firmenkonto, erst Namen raus");
    expect(chip().dataset.light).toBe("amber");
  });

  it("has exactly one account radio group (the stage's), not a second one below", () => {
    setup();
    expect(document.querySelectorAll('input[name="w05-account"]')).toHaveLength(3);
  });
});

describe("send (practice)", () => {
  it("flies one chip per live hit, latches, disables the handle until reset", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Senden (Probe)" }));
    expect(document.querySelectorAll(".w05-send-chip")).toHaveLength(4);
    expect(document.querySelector(".w05-latch")?.textContent).toContain("Zurückziehen geht nicht");
    expect(range().disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Zurücksetzen" }));
    expect(range().disabled).toBe(false);
  });

  it("sends only placeholders after the handle, with the empty latch text", () => {
    setup();
    move(1000);
    fireEvent.click(screen.getByRole("button", { name: "Senden (Probe)" }));
    expect(document.querySelectorAll(".w05-send-chip")).toHaveLength(0);
    expect(document.querySelector(".w05-latch")?.textContent).toContain("Diesmal waren nur Platzhalter dabei");
  });
});

describe("takeaways", () => {
  it("copies exactly the visible prompt and confirms", async () => {
    setup();
    const block = document.querySelector("#w05-take .w05-copy") as HTMLElement;
    const shown = block.querySelector("pre")?.textContent as string;
    expect(shown).toContain("[BESTELLUNG]");
    expect(shown).not.toContain("TH-1042");
    await act(async () => {
      fireEvent.click(within(block).getByRole("button", { name: "Prompt kopieren" }));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(shown);
    expect(within(block).getByRole("status").textContent).toBe("Kopiert");
  });

  it("selects the text and says so when the clipboard is refused", async () => {
    (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("no"));
    setup();
    const block = document.querySelector("#w05-take .w05-copy") as HTMLElement;
    await act(async () => {
      fireEvent.click(within(block).getByRole("button", { name: "Prompt kopieren" }));
    });
    expect(within(block).getByRole("status").textContent).toBe("Text markiert, kopiere mit Strg+C");
  });

  it("puts the real details back into an answer and lists what is missing", () => {
    setup();
    fireEvent.change(screen.getByLabelText("Kopiere Claudes Antwort hierher"), {
      target: { value: "Guten Tag [Kunde], wir melden uns unter [e mail]. [IBAN]" },
    });
    const marks = Array.from(document.querySelectorAll("pre mark.w05-restored")).map((m) => m.textContent);
    expect(marks).toEqual(["Mara Beispiel", "mara.beispiel@example.com"]);
    // the legend shows the same outlined span, with its label, not an empty swatch
    expect(document.querySelector(".w05-legend-line mark.w05-restored")?.textContent).toBe("wieder eingesetzt: 2");
    expect(document.querySelector(".w05-legend-line")?.textContent).toBe("wieder eingesetzt: 2");
    expect(document.querySelector(".w05-honest")?.textContent).toContain("[BESTELLUNG]");
    expect(document.body.textContent).toContain("Unbekannte Platzhalter: [IBAN]");
  });

  it("renders the key as a read-only table without a copy button", () => {
    setup();
    const rows = document.querySelectorAll(".w05-key tr");
    expect(rows).toHaveLength(4);
    expect(screen.queryByRole("button", { name: /Schlüssel kopieren|Key/ })).toBeNull();
  });

  it("edits the prompt live from the task field", () => {
    setup();
    fireEvent.change(screen.getByLabelText("Aufgabe"), { target: { value: "Fasse zusammen." } });
    expect(document.querySelector("#w05-take pre")?.textContent?.startsWith("Fasse zusammen.\nLass die Platzhalter")).toBe(true);
  });

  it("new text resets the handle and re-scans every keystroke", () => {
    setup();
    move(1000);
    fireEvent.change(screen.getByLabelText(/Text hier einfügen/), { target: { value: "Mail an a@b.de und c@d.de" } });
    expect(range().value).toBe("0");
    expect(digit()).toBe("2");
  });
});

describe("english", () => {
  it("uses the English words and the kit's placeholders", () => {
    setup("en");
    expect(screen.getByLabelText("Black out")).toBeTruthy();
    expect(document.querySelector("#w05-take pre")?.textContent).toContain("[CUSTOMER]");
    expect(document.querySelector(".w05-sr")).not.toBeNull();
  });
});

describe("the network line", () => {
  it("counts every request but the framework's own route-data GETs", () => {
    expect(countsAsRequest("https://example.org/api/collect")).toBe(true);
    expect(countsAsRequest("/demos?_rsc=abc12")).toBe(false);
    expect(countsAsRequest("/en/demos/x?_rsc=1&foo=2")).toBe(false);
    expect(countsAsRequest("https://example.org/track?text=hello")).toBe(true);
  });
});

describe("first view, paste and names", () => {
  const textbox = () => screen.getByRole("textbox", { name: /Text hier einfügen/ });
  const limits = () => document.getElementById("w05-limits") as HTMLElement;

  it("holds the limits line back until the handle moves or something is touched", () => {
    setup();
    expect(limits().hasAttribute("data-on")).toBe(false);
    move(300);
    expect(limits().hasAttribute("data-on")).toBe(true);
  });

  it("reads the counter synchronously after a paste: the live hit count, never a replayed intro", () => {
    setup();
    fireEvent.change(textbox(), {
      target: { value: "Hi, ich bin Jonas Weber aus Köln, tel +49 171 2345678, mail jonas@example.com, Rechnung RE-20417, Passwort: hunter2hunter2" },
    });
    expect(digit()).toBe("5");
    expect(document.querySelectorAll('.w05-hit[data-state="marker"]')).toHaveLength(5);
  });

  it("asks for taps on names next to the rest scan in the visitor's own text, even when no pair was seen", () => {
    setup();
    fireEvent.change(textbox(), { target: { value: "Hallo Jonas, mail jonas@example.com" } });
    move(1000);
    expect(document.querySelector("[data-name-hint]")?.textContent).toBe("Namen ohne Anrede: tippe sie an. Das Werkzeug sieht sie nicht.");
  });

  it("flags a company name with a legal form next to the rest scan, and clears it when the name is tapped away", () => {
    setup();
    fireEvent.change(textbox(), { target: { value: "Bitte an Weber Metallbau GmbH, mail info@example.com" } });
    move(1000);
    expect(document.querySelector("[data-company-hint]")?.textContent).toContain("Firmenname im Text (1x");
    fireEvent.click(screen.getByRole("button", { name: "GmbH" }));
    expect(document.querySelector("[data-company-hint]")).toBeNull();
  });

  it("pastes from the clipboard on a tap and answers like a paste", async () => {
    const readText = vi.fn().mockResolvedValue("Hallo Anna Schmidt, ruf 030 1234567 an");
    Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn(), readText }, configurable: true });
    setup();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Meinen Text einfügen" }));
    });
    expect(readText).toHaveBeenCalledTimes(1);
    expect((textbox() as HTMLTextAreaElement).value).toContain("Anna Schmidt");
    expect(digit()).toBe("2");
  });

  it("falls back to a readied field and a hint when the browser refuses the read", async () => {
    Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn(), readText: vi.fn().mockRejectedValue(new Error("denied")) }, configurable: true });
    setup();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Meinen Text einfügen" }));
    });
    expect(screen.getByText(/lässt das Einfügen per Knopf nicht zu/)).toBeTruthy();
  });
});

describe("isBulkEdit", () => {
  it("tells a paste or a fill from typing and deleting, even when the new text is shorter", () => {
    expect(isBulkEdit("abc", "abcd")).toBe(false);
    expect(isBulkEdit("abc", "ab")).toBe(false);
    expect(isBulkEdit("abc", "")).toBe(false);
    expect(isBulkEdit("", "Hallo Welt")).toBe(true);
    expect(isBulkEdit("a long sample text with many words", "short paste")).toBe(true);
    expect(isBulkEdit("abc def", "abc xyz def")).toBe(true);
  });
});
