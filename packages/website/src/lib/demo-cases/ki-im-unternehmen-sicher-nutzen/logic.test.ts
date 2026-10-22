import { describe, expect, it } from "vitest";
import {
  ACCOUNT_IDS,
  ACCOUNTS,
  BUCKET_SCENES,
  FRIDAY_KEY,
  FRIDAY_ROWS,
  LIGHTS,
  RANK,
  SCENES,
  cards,
  cleanInput,
  fixLine,
  fixParts,
  fridayJudge,
  goalOf,
  goalReached,
  initialState,
  judge,
  ledgerSummary,
  lightFor,
  routeDiff,
  routeSentence,
  ruleEvidence,
  ruleEvidenceLine,
  sceneById,
  stateLight,
  templateSegments,
  type ContentKind,
  type DialState,
  type Light,
  type Scene,
  type SceneResult,
} from "./index";

const KINDS: readonly ContentKind[] = [
  "public",
  "invented",
  "customer",
  "people",
  "pastedToClean",
  "cleaned",
  "secret",
  "folder",
];

function allStates(scene: Scene): DialState[] {
  return scene.accountDial.flatMap((account) =>
    scene.contentDial.map((option) => ({ account, content: option.id })),
  );
}

describe("lightFor: the kit's Rule 2 plus deck slide 07", () => {
  it("gives the eight scenes the ANSWERS.md mission 3 key in kit order: R G A R A A R R", () => {
    expect(SCENES.map((scene) => scene.id)).toEqual([
      "ana",
      "stefan",
      "elena",
      "marko",
      "jovana",
      "mila",
      "petar",
      "dario",
    ]);
    expect(SCENES.map((scene) => scene.key)).toEqual([
      "red",
      "green",
      "amber",
      "red",
      "amber",
      "amber",
      "red",
      "red",
    ]);
    for (const scene of SCENES) {
      expect(stateLight(scene, initialState(scene)).light, scene.id).toBe(scene.key);
    }
  });

  it("holds the rules for every account and content", () => {
    for (const account of ACCOUNT_IDS) {
      for (const kind of KINDS) {
        const { light } = lightFor(account, kind);
        const type = ACCOUNTS[account].kind;
        if (kind === "secret" || kind === "folder") expect(light).toBe("red");
        else if (kind === "public" || kind === "invented") expect(light).toBe("green");
        else if (type === "personal" || type === "test") expect(light).toBe("red");
        else expect(light).toBe("amber");
      }
    }
  });

  it("never makes Enterprise lighter than Team", () => {
    for (const kind of KINDS) {
      expect(RANK[lightFor("claudeEnterprise", kind).light]).toBeGreaterThanOrEqual(
        RANK[lightFor("claudeTeam", kind).light],
      );
    }
  });

  it("treats pastedToClean exactly like customer on all six accounts", () => {
    for (const account of ACCOUNT_IDS) {
      expect(lightFor(account, "pastedToClean")).toEqual(lightFor(account, "customer"));
    }
    const ana = sceneById("ana");
    for (const account of ana.accountDial) {
      const line = fixLine(ana, { account, content: "pastedToClean" }, "de");
      expect(line).toContain("Wer zum Bereinigen einfügt, hat schon eingefügt.");
      expect(fixLine(ana, { account, content: "pastedToClean" }, "en")).toContain(
        "If you paste it to clean it, you already pasted it.",
      );
    }
  });

  it("keeps cleaned text red on a personal account", () => {
    expect(lightFor("claudePro", "cleaned")).toEqual({ light: "red", rule: "personalNotPublic" });
    expect(lightFor("freeChatbot", "cleaned").light).toBe("red");
  });

  it("matches the spec's example outputs", () => {
    expect(lightFor("claudeEnterprise", "secret")).toEqual({ light: "red", rule: "secret" });
    expect(lightFor("claudePro", "cleaned")).toEqual({ light: "red", rule: "personalNotPublic" });
    expect(lightFor("claudeTeam", "pastedToClean")).toEqual({ light: "amber", rule: "companyTodo" });
    expect(lightFor("apiTest", "invented")).toEqual({ light: "green", rule: "invented" });
  });
});

describe("fixLine", () => {
  it("matches the spec's examples", () => {
    expect(fixLine(sceneById("ana"), { account: "claudeTeam", content: "asIs" }, "de")).toBe(
      "Gefunden. Firmenwerkzeug: Gelb. Gelb ist eine To-do-Liste, keine Erlaubnis. Vorher: nichts in den Dateien. Jetzt belegt: gespeichert in den USA. To-do: Namen und Nummern raus, eine benannte Person prüft.",
    );
    expect(fixLine(sceneById("dario"), { account: "apiTest", content: "alt" }, "de")).toBe(
      "Gefunden. Erfunden: keine Kundendaten. Grün.",
    );
    expect(fixLine(sceneById("dario"), { account: "apiTest", content: "alt" }, "en")).toBe(
      "Found. Invented: no customer data. Green.",
    );
  });

  it("uses the overrides and the route sentence", () => {
    const marko = sceneById("marko");
    expect(fixLine(marko, { account: "claudeEnterprise", content: "asIs" }, "de")).toBe(
      "Noch rot. Enterprise macht aus Rot kein Grün. Geändert: Vertrag, Training, Firma sieht. Gleich: gespeichert in den USA.",
    );
    expect(fixLine(marko, { account: "claudeTeam", content: "cleaned" }, "de")).toBe(
      "Gefunden. Gelb: Schlüssel raus und Firmenkonto, beides war nötig. Geändert: Vertrag, Training, Firma sieht. Gleich: gespeichert in den USA. To-do: Vertrag mit dem Kunden prüfen, eine benannte Person prüft.",
    );
    const mila = sceneById("mila");
    expect(fixLine(mila, { account: "claudeTeam", content: "asIs" }, "de")).toBe(
      "Noch Gelb. Team statt Enterprise ändert die Zeile „Firma sieht“, nicht die Ampel. Geändert: Firma sieht. Gleich: Vertrag, Training, gespeichert in den USA. To-do: IBANs und Firmennamen raus, Vertrag prüfen.",
    );
    expect(fixLine(sceneById("stefan"), { account: "freeChatbot", content: "alt" }, "de")).toBe(
      "Gefunden. Rot. Gleicher Chatbot, anderer Inhalt. Bei Grün entscheidet der Inhalt.",
    );
  });

  it("leaves out the route sentence when the account did not change", () => {
    const parts = fixParts(sceneById("elena"), { account: "claudeTeam", content: "cleaned" }, "de");
    expect(parts.route).toBe("");
    expect(parts.found).toBe(true);
    expect(parts.todo).toEqual(["Vertrag prüfen"]);
  });

  it("shows a to-do list on every amber state and never on another light", () => {
    for (const scene of SCENES) {
      for (const state of allStates(scene)) {
        const { light, todo } = stateLight(scene, state);
        if (light === "amber") expect(todo.length, `${scene.id} ${state.account} ${state.content}`).toBeGreaterThan(0);
        else expect(todo).toEqual([]);
        expect(fixLine(scene, state, "de")).not.toMatch(/\{|\}|undefined/);
        expect(fixLine(scene, state, "en")).not.toMatch(/\{|\}|undefined/);
      }
    }
  });
});

describe("reachability without counting", () => {
  it("lets every red scene leave red", () => {
    for (const scene of SCENES.filter((entry) => entry.key === "red")) {
      expect(allStates(scene).some((state) => stateLight(scene, state).light !== "red"), scene.id).toBe(
        true,
      );
    }
  });

  it("makes Marko need both changes", () => {
    const marko = sceneById("marko");
    const start = initialState(marko);
    const single = [
      ...marko.accountDial.map((account) => ({ ...start, account })),
      ...marko.contentDial.map((option) => ({ ...start, content: option.id })),
    ];
    for (const state of single) expect(stateLight(marko, state).light).toBe("red");
    for (const account of ["claudeTeam", "claudeEnterprise"] as const) {
      expect(stateLight(marko, { account, content: "cleaned" }).light).toBe("amber");
      expect(goalReached(marko, { account, content: "cleaned" })).toBe(true);
    }
  });

  it("does not count Team for Mila as reaching the goal", () => {
    expect(goalReached(sceneById("mila"), { account: "claudeTeam", content: "asIs" })).toBe(false);
    expect(goalReached(sceneById("mila"), { account: "claudeTeam", content: "cleaned" })).toBe(true);
  });

  it("lets every scene reach its goal, Stefan included", () => {
    for (const scene of SCENES) {
      expect(allStates(scene).some((state) => goalReached(scene, state)), scene.id).toBe(true);
      expect(goalReached(scene, initialState(scene)), scene.id).toBe(false);
    }
    expect(goalOf(sceneById("stefan"))).toBe("findRed");
    expect(goalReached(sceneById("stefan"), { account: "freeChatbot", content: "alt" })).toBe(true);
  });
});

describe("judge", () => {
  it("gives the right direction for all 24 scene and light pairs", () => {
    for (const scene of SCENES) {
      for (const picked of LIGHTS) {
        const { direction, line } = judge(scene, picked);
        const delta = RANK[picked] - RANK[scene.key];
        expect(direction).toBe(delta === 0 ? "exact" : delta > 0 ? "stricter" : "looser");
        if (direction === "exact") expect(line).toBeUndefined();
        else expect(line?.de, `${scene.id} ${picked}`).toBeTruthy();
      }
    }
  });

  it("never reuses a stricter line as a looser line", () => {
    for (const scene of SCENES.filter((entry) => entry.key === "amber")) {
      expect(judge(scene, "green").line?.de).not.toBe(judge(scene, "red").line?.de);
    }
  });

  it("matches the spec's examples", () => {
    expect(judge(sceneById("marko"), "amber")).toEqual({
      direction: "looser",
      line: {
        de: "Ein Schlüssel ist auf jedem Konto rot, auch im Firmenwerkzeug.",
        en: "A key is red on every account, even on the company tool.",
      },
    });
    const mila = judge(sceneById("mila"), "red");
    expect(mila.direction).toBe("stricter");
    expect(mila.line?.de).toBe("Enterprise ist ein Firmenkonto. Erst IBANs und Firmennamen raus.");
  });
});

describe("routeDiff and routeSentence", () => {
  it("changes contract, training and company from Pro to Team, never the storage", () => {
    expect(routeDiff("claudePro", "claudeTeam")).toEqual({
      changed: ["contract", "training", "company"],
      same: ["stored"],
    });
    expect(routeSentence("claudePro", "claudeTeam", "de")).toBe(
      "Geändert: Vertrag, Training, Firma sieht. Gleich: gespeichert in den USA.",
    );
    expect(routeSentence("claudePro", "claudeTeam", "en")).toBe(
      "Changed: contract, training, company sees. Same: stored in the US.",
    );
  });

  it("changes only the company row from Enterprise to Team", () => {
    expect(routeDiff("claudeEnterprise", "claudeTeam")).toEqual({
      changed: ["company"],
      same: ["contract", "training", "stored"],
    });
    expect(routeSentence("claudeEnterprise", "claudeTeam", "de")).toBe(
      "Geändert: Firma sieht. Gleich: Vertrag, Training, gespeichert in den USA.",
    );
  });

  it("reports unknown when a side has nothing in the files", () => {
    expect(routeDiff("freeChatbot", "claudeTeam")).toBe("unknown");
    expect(routeDiff("claudeTeam", "apiTest")).toBe("unknown");
    expect(routeSentence("freeChatbot", "claudeTeam", "de")).toBe(
      "Vorher: nichts in den Dateien. Jetzt belegt: gespeichert in den USA.",
    );
    expect(routeSentence("claudeTeam", "freeChatbot", "de")).toBe(
      "Vorher belegt: gespeichert in den USA. Jetzt: nichts in den Dateien.",
    );
    expect(routeSentence("claudeTeam", "claudeTeam", "de")).toBe("");
  });

  it("keeps the storage row identical for every Claude account", () => {
    const stored = ACCOUNT_IDS.flatMap((id) => {
      const row = ACCOUNTS[id].route?.find((entry) => entry.key === "stored");
      return row ? [JSON.stringify(row)] : [];
    });
    expect(stored).toHaveLength(4);
    expect(new Set(stored).size).toBe(1);
    expect(ACCOUNTS.freeChatbot.route).toBeNull();
    expect(ACCOUNTS.apiTest.route).toBeNull();
  });
});

function results(picks: readonly Light[]): SceneResult[] {
  return SCENES.map((scene, index) => ({ id: scene.id, picked: picks[index] ?? "red", tried: false }));
}

describe("ledgerSummary", () => {
  it("reads 8 of 8 when every light matches", () => {
    expect(ledgerSummary(results(SCENES.map((scene) => scene.key)), "de").line).toBe(
      "8 von 8 wie die Lösung.",
    );
  });

  it("reads 6 of 8 with Marko too loose", () => {
    const picks = SCENES.map((scene) => scene.key);
    picks[3] = "amber"; // Marko looser
    picks[1] = "amber"; // Stefan stricter
    const summary = ledgerSummary(results(picks), "de");
    expect(summary.matched).toBe(6);
    expect(summary.looser).toEqual(["marko"]);
    expect(summary.line).toBe(
      "6 von 8 wie die Lösung. Ab sechs von acht ist gut. Zu locker bei Marko: Das ist der Fehler, der passiert.",
    );
    expect(ledgerSummary(results(picks), "en").line).toBe(
      "6 of 8 match the answer. Six or more of eight is good. Too loose on Marko: that is the mistake that happens.",
    );
  });

  it("reads 4 of 8 and asks to reread the other four", () => {
    // Stricter on four: everything red.
    const summary = ledgerSummary(results(SCENES.map(() => "red")), "de");
    expect(summary.matched).toBe(4);
    expect(summary.line).toBe("4 von 8 wie die Lösung. Lies die Gründe der anderen vier noch einmal.");
  });

  it("reads 7 of 8 without counting the matches twice", () => {
    const picks = SCENES.map((scene) => scene.key);
    picks[1] = "amber"; // Stefan stricter
    expect(ledgerSummary(results(picks), "de").line).toBe(
      "7 von 8 wie die Lösung. Ab sechs von acht ist gut.",
    );
  });

  it("reads 0 of 8 and asks to reread all eight, not 'the others'", () => {
    const picks = SCENES.map((scene) => (scene.key === "green" ? "red" : "green"));
    const de = ledgerSummary(results(picks), "de");
    expect(de.matched).toBe(0);
    expect(de.line).toMatch(/^0 von 8 wie die Lösung\. Lies alle acht Gründe noch einmal\./);
    expect(de.line).not.toContain("anderen");
    const en = ledgerSummary(results(picks), "en");
    expect(en.line).toMatch(/^0 of 8 match the answer\. Read all eight reasons again\./);
    expect(en.line).not.toContain("other");
  });

  it("names the open scenes instead of judging a half run", () => {
    const summary = ledgerSummary([{ id: "ana", picked: "red", tried: true }], "de");
    expect(summary.open).toHaveLength(7);
    expect(summary.line).toBe(
      "1 von 8 wie die Lösung. Noch offen: Stefan, Elena, Marko, Jovana, Mila, Petar und Dario.",
    );
  });
});

describe("ruleEvidence", () => {
  it("maps scenes by id into the three rule buckets", () => {
    expect(BUCKET_SCENES).toEqual({
      allowed: ["stefan", "dario"],
      askFirst: ["elena", "jovana", "mila", "petar"],
      never: ["ana", "marko"],
    });
    const evidence = ruleEvidence(results(SCENES.map((scene) => scene.key)));
    expect(evidence.never.scenes).toEqual(["ana", "marko"]);
    expect(evidence.never.looser).toEqual([]);
    expect(ruleEvidenceLine(results(SCENES.map((scene) => scene.key)), "de")).toBe(
      "Erlaubt ← Stefan, Dario mit erfundenen Zeilen · Erst fragen ← Elena, Jovana, Mila, Petar · Nie ← Ana, Marko",
    );
  });

  it("marks a looser rating and lists only committed scenes", () => {
    const line = ruleEvidenceLine([{ id: "marko", picked: "green", tried: false }], "de");
    expect(line).toBe("Nie ← Marko (du: zu locker)");
    // The scene note and the learner's verdict never share a bracket.
    expect(ruleEvidenceLine([{ id: "dario", picked: "red", tried: false }], "de")).toBe(
      "Erlaubt ← Dario mit erfundenen Zeilen",
    );
    expect(ruleEvidenceLine([{ id: "stefan", picked: "green", tried: false }, { id: "ana", picked: "amber", tried: false }], "en")).toBe(
      "Allowed ← Stefan · Never ← Ana (you: too loose)",
    );
    expect(ruleEvidenceLine([], "de")).toBe("");
  });
});

describe("Freitag", () => {
  it("follows the deck slide 12 verdicts", () => {
    expect(FRIDAY_KEY).toEqual({ 1: "false", 2: "false", 3: "half" });
    expect(fridayJudge(1, "false").right).toBe(true);
    expect(fridayJudge(3, "false").right).toBe(false);
    expect(fridayJudge(3, "half").right).toBe(true);
  });

  it("names Petar's Desktop folder as evidence for sentence 1", () => {
    const first = FRIDAY_ROWS.find((row) => row.n === 1);
    expect(first?.evidence.some((line) => line.de.startsWith("Petar"))).toBe(true);
  });
});

describe("cards", () => {
  it("leaves slots in square brackets when the fields are empty", () => {
    const de = cards({ tool: "", owner: "" }, "de");
    for (const text of [de.reply, de.rules, de.mail]) {
      expect(text).toContain("[FIRMENWERKZEUG]");
      expect(text).not.toContain("{");
    }
    expect(de.rules).toContain("[NAME]");
    expect(de.mailEn).toContain("[COMPANY TOOL]");
    const en = cards({ tool: "", owner: "" }, "en");
    expect(en.reply).toContain("[COMPANY TOOL]");
    expect(en.mail).toBe(en.mailEn);
  });

  it("fills both fields everywhere", () => {
    const de = cards({ tool: "Claude Team", owner: "IT-Leitung" }, "de");
    for (const text of [de.reply, de.rules, de.mail, de.mailEn]) {
      expect(text).toContain("Claude Team");
      expect(text).not.toContain("[FIRMENWERKZEUG]");
      expect(text).not.toContain("[COMPANY TOOL]");
    }
    expect(de.rules).toContain("Erst fragen bei IT-Leitung:");
    expect(de.reply.split("\n")[0]).toBe(
      "1. Wir nutzen Claude Team für die Arbeit. Kundendaten gehen nur dorthin.",
    );
    expect(de.mail.split("\n")[0]).toBe("Betreff: Drei Fragen zu unseren Daten in Claude Team");
  });

  it("keeps every card at nine lines or fewer", () => {
    for (const locale of ["de", "en"] as const) {
      for (const text of Object.values(cards({ tool: "", owner: "" }, locale))) {
        expect(text.split("\n").length).toBeLessThanOrEqual(9);
      }
    }
  });

  it("builds the copied text from exactly the shown segments", () => {
    const input = { tool: "  Claude   Team ", owner: "Mia" };
    const segments = templateSegments("Wir nutzen {TOOL}. Frag {NAME}. [DATUM]", input, "de");
    expect(segments).toEqual([
      { kind: "text", text: "Wir nutzen " },
      { kind: "filled", text: "Claude Team" },
      { kind: "text", text: ". Frag " },
      { kind: "filled", text: "Mia" },
      { kind: "text", text: ". " },
      { kind: "slot", text: "[DATUM]" },
    ]);
  });

  it("cleans the input", () => {
    expect(cleanInput("  Claude\n{Team} <b>[x]  ")).toBe("Claude Team bx");
    expect(cleanInput("a".repeat(60))).toHaveLength(40);
    expect(cleanInput("   ")).toBe("");
  });
});
