/**
 * The words of the depicted Claude app in workshop 04 (language standard
 * B.9). The app's own chrome keeps Claude's English labels in both editions
 * (the German labels are not documented, claude-desktop-spec 13), the
 * activity rows included; everything that explains keeps the visitor's
 * language and sits outside the window (the dock, the check overlay, the
 * recording note under an answer). Slots in braces are filled from the
 * recordings, the kit or the measurement, never written as literals.
 */

const de = {
  depiction: "Darstellung der Claude-App, Antworten aufgezeichnet am {date}",
  recordedMeta: "Aufgezeichnet am {date} mit {model} in Claude Code {version}. Wartezeiten sind verkürzt, der Text ist unverändert.",
  /** The note under an answer opens to how the recording was made (claude-desktop-spec 7 and 10). */
  surface:
    "Aufgenommen mit Claude Code im Terminal, mit demselben Skill und denselben Dateien wie im Kit. Dabei lagen alle {files} Dateien in einem Ordner, nicht in einem Claude-Projekt, und die Rechnung aus Schritt 5 lag von Anfang an dabei. In der Desktop-App kann die Antwort anders formuliert sein.",
  thinkingNote: "Den Text des Nachdenkens gibt Claude Code nicht heraus. Die Zeile „Thought“ zeigt nur, wann Claude nachgedacht hat.",
  retried: "In der Aufnahme hat Claude {n} Befehle neu versucht, nachdem die Messung sie nicht erlaubt hatte. Diese Versuche sind hier ausgeblendet.",
  retriedOne: "In der Aufnahme hat Claude einen Befehl neu versucht, nachdem die Messung ihn nicht erlaubt hatte. Dieser Versuch ist hier ausgeblendet.",
  /** The app's chrome, as Claude labels it. */
  ui: {
    newChat: "New chat",
    chats: "Chats",
    projects: "Projects",
    artifacts: "Artifacts",
    customize: "Customize",
    settings: "Settings",
    knowledge: "Project knowledge",
    instructions: "Instructions",
    skills: "Skills",
    on: "On",
    reply: "Reply to Claude…",
    start: "How can I help you today?",
    menu: "Menü öffnen",
    closeMenu: "Menü schließen",
    send: "Aufzeichnung abspielen",
    input: "Eingabefeld mit dem Prompt",
    download: "Download",
    copy: "Copy",
    files: "{n} files",
    /** Customize in the depicted sidebar is the one live entry: it opens the skill setup. */
    customizeOpen: "Customize: Anleitung für den eigenen Claude nach dem Workshop",
  },
  account: "Du",
  chatTitles: ["Fragebogen Nordvik", "Werbeaussagen", "Bankformular", "Nachweisregister"],
  /** Claude's activity rows: chrome, so English in both editions. */
  activity: {
    running: "Claude is working",
    done: "{n} steps in {time}",
    thinking: "Thought",
    skill: "Loaded the skill {name}",
    read: "Read {name}",
    search: "Searched for {name}",
    command: "Ran code",
    write: "Wrote {name}",
    failed: "The command ended with an error.",
    showCode: "Show code",
    hideCode: "Hide code",
  },
  cite: "{file} an Zeile {line} öffnen",
  citeFile: "{file} öffnen",
  panel: {
    close: "Panel schließen",
    open: "Öffnen",
    check: "Von Hand prüfen",
    /** The kicker that marks the check as our exercise, not part of Claude. */
    exercise: "Übung, nicht Teil von Claude",
    lines: "Zeilen {from} bis {to}",
    line: "Zeile {n}",
    registerBefore: "Status nach Schritt 4. Wähle eine Antwort, um ihre Datei und Zeilen zu sehen.",
    registerAfter: "Status nach Schritt 5, so wie Claude sie in die Datei geschrieben hat.",
  },
  /** The caption line in the phone dock opens the whole caption and the check as a sheet. */
  sheet: {
    title: "Was passiert, und was du prüfst",
    more: "Mehr",
    check: "Prüfen",
    open: "Ganze Erklärung und die Prüfung von Hand öffnen",
  },
  monthCheck: {
    lead: "Zähl selbst nach, so wie Claude es im Code getan hat: Markiere jede Zeile mit einer Rechnung.",
    count: "Du hast {rows} Zeilen markiert, das sind {months} verschiedene Monate.",
    duplicate: "Zeile {a} und Zeile {b} sind dieselbe Rechnung {invoice}. Sie zählt einmal.",
    missing: "Für {missing} gibt es keine Rechnung. Das ist das Dokument, das Claude anfordert.",
    all: "Alle markieren",
    clear: "Markierung löschen",
    row: "Zeile {n}, {month}, Rechnung {invoice}",
  },
  monthNames: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  /** The kit's prediction before each step (START-HIER.md), as a tap. It is never scored. */
  predict: {
    label: "Deine Vorhersage",
    unset: "offen",
    less: "Weniger",
    more: "Mehr",
    years: "{n} Jahre",
    steps: {
      "schritt-1": {
        question: "Wie viele der 8 Fragen sind belegt?",
        result: "Du hast {guess} vorhergesagt. Laut Claude sind {n} der 8 Antworten belegt.",
      },
      "schritt-2": {
        question: "Wie viele der 7 Aussagen dürfen raus?",
        result: "Du hast {guess} vorhergesagt. Claude lässt {n} der 7 Aussagen raus.",
      },
      "schritt-3": {
        question: "Rechne F4 mit dem Taschenrechner: Nach wie vielen Jahren hat sich die Solaranlage bezahlt?",
        result: "Du hast {guess} gerechnet. Claude kommt im Code auf {n}.",
      },
      "schritt-4": {
        question: "Wie viele der 21 Antworten sind belegt?",
        result: "Du hast {guess} vorhergesagt. Laut Claude sind {n} der 21 Antworten belegt.",
      },
      "schritt-5": {
        question: "Wie viele Status im Register ändern sich?",
        result: "Du hast {guess} vorhergesagt. In Claudes Register ändern sich {n} Status.",
      },
    },
    f4Hint: "Die Formel steht im Bankformular, die Zahlen stehen in {pv} und {strom}.",
  },
  steps: {
    briefing: "Der Importeur braucht acht belegte Antworten vom Weingut. Ich bediene Claude live; ihr sagt vorher, was hält, und prüft danach die Dateien.",
    /** Before step 1: the learning objective, the four checks of glossary C.4. */
    probe:
      "Jede Antwort prüfst du vierfach. Welche Zeile sagt es (Zitat)? Gilt sie für die ganze Zeit (Zeitraum) und für alles, wovon die Antwort spricht (Umfang)? Ist die Quelle freigegeben (Freigabe)?",
    tap: "Der Pfeil spielt die Aufzeichnung ab. Er sendet keine Anfrage an Claude.",
    ready: {
      "schritt-1": [
        "Im Projekt liegen die {knowledge} Dateien des Weinguts und die Projektanweisung, und der Skill esg-nachweise ist eingeschaltet.",
        "Claude bekommt den Fragebogen des Importeurs mit dem Prompt aus dem Kit.",
      ],
      "schritt-2": ["Schritt 2 beginnt einen neuen Chat im selben Projekt.", "Claude prüft die sieben Werbeaussagen des Marketings, zuerst gegen die Verbotsliste."],
      "schritt-3": ["Auch Schritt 3 beginnt einen neuen Chat.", "Claude füllt die sechs Felder der Bank aus und rechnet die Amortisation im Code."],
      "schritt-4": ["In Schritt 4 kommen alle drei Anfragen in einen neuen Chat.", "Claude schreibt dann alle 21 Antworten in eine Excel-Datei, das Nachweisregister."],
      "schritt-5": [
        "Die Buchhaltung hat die fehlende Stromrechnung gefunden, als Foto. Schritt 5 bleibt im Chat von Schritt 4, denn dort liegt das Register.",
        "Claude prüft dann die Rechnung und jede Zeile des Registers, die die Stromdatei zitiert.",
      ],
    },
    running: [
      "Claude lädt den Skill, liest die Dateien und rechnet im Code.",
      "Dieser Schritt hat in der Messung {s} Sekunden gedauert. Hier sind die Wartezeiten verkürzt, die Antwort ist Wort für Wort die Aufzeichnung.",
    ],
    done: {
      "schritt-1": [
        "Laut Claude sind {belegt} der 8 Antworten belegt. Bei Q1, der Stromfrage, nennt Claude das fehlende Dokument: die Stromrechnung für September 2025.",
        "Öffne in der Antwort „{strom}“. Du siehst selbst {rows} Zeilen, aber nur {months} Monate.",
      ],
      "schritt-2": ["Claude lässt {belegt} der 7 Aussagen raus und streicht die anderen {rest}, darunter „{claim}“ für die Regalkarte."],
      "schritt-3": [
        "Bei F2 fragt die Bank nach dem Strom des ganzen Jahres. Claude gibt {mwh11} MWh nur als Summe von {months} Monaten an, also kommt die Lücke aus Schritt 1 zurück.",
        "Zieh von der Zahl zu der Dateizeile, aus der sie stammt, oder wähle erst die Zahl und dann die Zeile.",
      ],
      "schritt-4": [
        "Claude hat {register} erstellt: {belegt} Antworten sind belegt, {schwach} schwach belegt und {luecke} haben eine Lücke.",
        "Unter „Von Hand prüfen“ liegen die 21 Antworten. Wähle eine, dann siehst du ihre Datei und ihre Zeilen.",
        "Achtung bei C6: Hier schreibt Claude, die Aussage dürfe wie formuliert raus. In Schritt 2 hat Claude selbst „nur“ gestrichen, und so steht es auch in den Lösungen. Genau das fängt der Mensch, der jede Antwort prüft.",
      ],
      "schritt-5": [
        "Claude rechnet die Zählerstände nach und aktualisiert das Register: jetzt sind {belegt} Antworten belegt, {schwach} schwach belegt und {luecke} haben eine Lücke.",
      ],
    },
    mismatch:
      "Bei {row} schreibt Claude in diesem Lauf „{claude}“, die Lösungen im Kit sagen „{solution}“. Genau dafür prüft ein Mensch jede Antwort, bevor sie die Firma verlässt.",
    /** Step 5, before the visitor puts the invoice in. */
    invoiceHint: "Zieh unter „Von Hand prüfen“ die Rechnung in die leere Stelle beim September und sieh, welche Antworten sich ändern.",
  },
  /** The dock counts parts of the demo, the captions count the kit's five steps. */
  stepOf: "Teil {n} von {total}",
  next: {
    send: "Aufzeichnung abspielen",
    finish: "Antwort ganz zeigen",
  },
  measured: {
    caption: [
      "Mit Claude und dem Skill haben die fünf Schritte im Median {time} gedauert, gemessen in {runs} Läufen am {date}.",
      "Wie lange dieselbe Arbeit von Hand dauert, haben wir nicht gemessen.",
    ],
    title: "Was wir gemessen haben, und was nicht",
    claude: "Mit Claude und dem Skill",
    claudeLead: "Median aus {runs} Läufen der Schritte 1 bis 5 am {date}, mit {model} in Claude Code {version}. Die Läufe dauerten zwischen {min} und {max}.",
    allRight: "In allen {runs} Läufen hatten die 21 Antworten vor und nach der Nachreichung denselben Status wie die Lösungen im Kit.",
    someRight:
      "In {ok} von {runs} Läufen hatten die 21 Antworten vor und nach der Nachreichung denselben Status wie die Lösungen im Kit. In einem Lauf stand eine Antwort vor der Nachreichung anders da.",
    september: "Den fehlenden Monat hat Claude im Median nach {s} Sekunden benannt.",
    shown: "Der Lauf in diesem Fenster",
    stepBar: "Schritt {n}: {s} Sekunden",
    hand: "Von Hand",
    handValue: "nicht gemessen",
    handLead: "Niemand hat die 21 Antworten mit der Stoppuhr von Hand bearbeitet, deshalb steht hier keine Zeit.",
    efrag:
      "Zum Vergleich, keine Messung von uns: Eine Kunden- oder Bankanfrage zu Nachhaltigkeitsdaten kostete eine kleine Firma in der EU 2023 rund 4.700 Euro. Das meiste davon war Arbeitszeit der eigenen Leute (EFRAG, Kosten-Nutzen-Analyse zum VSME, 2024).",
    notCounted:
      "Nicht gezählt sind das Anlegen des Ordners und das Prüfen jeder Antwort. Das bleibt Arbeit für einen Menschen. Gemessen haben wir auf der Kommandozeile, nicht in claude.ai, mit je zwei Läufen gleichzeitig.",
    minSec: "{min} Min. {s} s",
  },
  install: {
    caption: [
      "Für zu Hause: So richtest du den Skill im eigenen Claude ein. Im Workshop zeige ich die Einrichtung in meinem Account.",
      "Die Beschriftungen stammen aus der Hilfe von Anthropic, Stand 26.10.2026, und können sich ändern.",
    ],
    stepOf: "Einrichtung, Schritt {n} von {total}",
    next: "Weiter: Einrichtung, Schritt {n} von {total}",
    steps: [
      "Öffne die Einstellungen und dann „Capabilities“. Schalte „Code execution and file creation“ ein. Im neuen Layout heißt der Schalter „Create and edit files“. Skills brauchen ihn, weil Claude ihre Dateien in einer eigenen Arbeitsumgebung öffnet.",
      "Öffne in der Seitenleiste „Customize“ und dann „Skills“, oder gehe direkt auf claude.ai/customize/skills.",
      "Wähle „+“, dann „Create skill“ und „Upload a skill“. Wähle die Datei esg-nachweise.zip, die du hier herunterlädst.",
      "Schalte den Skill ein. Stell deine Frage wie gewohnt, oder gib „/“ ein und wähle esg-nachweise aus.",
    ],
    download: "Skill herunterladen (ZIP)",
    capability: "Code execution and file creation",
    capabilityNote: "Claude can execute code and create and edit files.",
    settings: "Settings",
    capabilities: "Capabilities",
    yourSkills: "Your skills",
    discover: "Discover",
    createdByYou: "Created by you",
    add: "Create skill",
    upload: "Upload a skill",
    drop: "Drag and drop or click to upload",
  },
  takehome: {
    caption: [
      "Hier liegen der Skill, die Vorlagen und das Kit mit allen Dateien aus diesem Fenster.",
      "Nach dem Workshop kannst du das Kit mit denselben fünf Prompts im eigenen Claude durchgehen.",
    ],
    prompts: "Die fünf Prompts aus dem Kit",
    promptsLead: "Genau diese Prompts haben wir für die Aufzeichnung gesendet, jeweils mit den angehängten Dateien aus dem Kit.",
    own: "Eigenen Satz prüfen",
    ownLead: "Leg einen eigenen Satz neben seine Datei, im Browser und ohne KI.",
  },
} as const;

type Widen<T> = T extends string ? string : T extends readonly (infer U)[] ? readonly Widen<U>[] : { readonly [K in keyof T]: Widen<T[K]> };
export type AppCopy = Widen<typeof de>;

const en: AppCopy = {
  depiction: "A depiction of the Claude app, answers recorded on {date}",
  recordedMeta: "Recorded on {date} with {model} in Claude Code {version}. Waiting is shortened; the text is unchanged.",
  surface:
    "Recorded with Claude Code in the terminal, with the same skill and the same files as in the kit. All {files} files sat in one folder, not in a Claude project, and the invoice from step 5 was there from the start. In the desktop app the answer may be worded differently.",
  thinkingNote: "Claude Code does not hand out the thinking text. The row “Thought” only shows when Claude thought.",
  retried: "In the recording Claude tried {n} commands again after the measurement did not allow them. Those attempts are hidden here.",
  retriedOne: "In the recording Claude tried one command again after the measurement did not allow it. That attempt is hidden here.",
  ui: {
    newChat: "New chat",
    chats: "Chats",
    projects: "Projects",
    artifacts: "Artifacts",
    customize: "Customize",
    settings: "Settings",
    knowledge: "Project knowledge",
    instructions: "Instructions",
    skills: "Skills",
    on: "On",
    reply: "Reply to Claude…",
    start: "How can I help you today?",
    menu: "Open the menu",
    closeMenu: "Close the menu",
    send: "Play the recording",
    input: "Message field with the prompt",
    download: "Download",
    copy: "Copy",
    files: "{n} files",
    customizeOpen: "Customize: setup for your own Claude after the workshop",
  },
  account: "You",
  chatTitles: ["Nordvik questionnaire", "Marketing claims", "Bank form", "Evidence register"],
  activity: {
    running: "Claude is working",
    done: "{n} steps in {time}",
    thinking: "Thought",
    skill: "Loaded the skill {name}",
    read: "Read {name}",
    search: "Searched for {name}",
    command: "Ran code",
    write: "Wrote {name}",
    failed: "The command ended with an error.",
    showCode: "Show code",
    hideCode: "Hide code",
  },
  cite: "Open {file} at line {line}",
  citeFile: "Open {file}",
  panel: {
    close: "Close the panel",
    open: "Open",
    check: "Check by hand",
    exercise: "Exercise, not part of Claude",
    lines: "Lines {from} to {to}",
    line: "Line {n}",
    registerBefore: "Statuses after step 4. Choose an answer to see its file and lines.",
    registerAfter: "Statuses after step 5, as Claude wrote them into the file.",
  },
  sheet: {
    title: "What happens, and what you check",
    more: "More",
    check: "Check",
    open: "Open the whole explanation and the check by hand",
  },
  monthCheck: {
    lead: "Count it yourself, the way Claude did in code: mark every row with a bill.",
    count: "You have marked {rows} rows, which are {months} different months.",
    duplicate: "Line {a} and line {b} are the same bill {invoice}. It counts once.",
    missing: "There is no bill for {missing}. That is the document Claude asks for.",
    all: "Mark all",
    clear: "Clear marks",
    row: "Line {n}, {month}, bill {invoice}",
  },
  monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  predict: {
    label: "Your prediction",
    unset: "open",
    less: "Fewer",
    more: "More",
    years: "{n} years",
    steps: {
      "schritt-1": {
        question: "How many of the 8 questions are covered?",
        result: "You predicted {guess}. According to Claude, {n} of the 8 answers are covered.",
      },
      "schritt-2": {
        question: "How many of the 7 claims can go out?",
        result: "You predicted {guess}. Claude lets {n} of the 7 claims go out.",
      },
      "schritt-3": {
        question: "Work out F4 with a calculator: after how many years has the solar plant paid for itself?",
        result: "You worked out {guess}. Claude gets {n} in code.",
      },
      "schritt-4": {
        question: "How many of the 21 answers are covered?",
        result: "You predicted {guess}. According to Claude, {n} of the 21 answers are covered.",
      },
      "schritt-5": {
        question: "How many statuses in the register change?",
        result: "You predicted {guess}. In Claude's register {n} statuses change.",
      },
    },
    f4Hint: "The formula is in the bank form, the figures are in {pv} and {strom}.",
  },
  steps: {
    briefing: "The importer needs eight answers backed by the winery's files. I run Claude live; you predict what holds and check the files afterwards.",
    probe:
      "You check every answer four ways. Which line says it (quote)? Does it cover the whole time (period) and everything the answer is about (scope)? Is the source approved (approval)?",
    tap: "The arrow plays the recording. It sends no request to Claude.",
    ready: {
      "schritt-1": [
        "The recorded project holds the winery's {knowledge} files, the project instructions and the original bilingual skill. For home practice, download esg-evidence in English.",
        "Claude gets the importer's questionnaire with the prompt from the kit.",
      ],
      "schritt-2": ["Step 2 starts a new chat in the same project.", "Claude checks marketing's seven claims, first against the ban list."],
      "schritt-3": ["Step 3 starts a new chat too.", "Claude fills in the bank's six fields and works out the payback in code."],
      "schritt-4": ["In step 4 all three requests go into a new chat.", "Claude then writes all 21 answers into one Excel file, the evidence register."],
      "schritt-5": [
        "Accounts has found the missing electricity bill, as a photo. Step 5 stays in the chat of step 4, because the register lives there.",
        "Claude then checks the bill and every register row that quotes the electricity file.",
      ],
    },
    running: [
      "Claude loads the skill, reads the files and does the maths in code.",
      "In the measurement this step took {s} seconds. Here the waiting is shortened; the answer is the recording, word for word.",
    ],
    done: {
      "schritt-1": [
        "According to Claude, {belegt} of the 8 answers are covered. For Q1, the electricity question, Claude names the missing document: the September 2025 electricity bill.",
        "Open “{strom}” in the answer. You can see {rows} rows but only {months} months.",
      ],
      "schritt-2": ["Claude lets {belegt} of the 7 claims go out and strikes the other {rest}, among them “{claim}” for the shelf card."],
      "schritt-3": [
        "For F2 the bank asks for the electricity of the whole year. Claude gives {mwh11} MWh only as the total of {months} months, so the gap from step 1 comes back.",
        "Drag from the figure to the file row it comes from, or choose the figure first and then the row.",
      ],
      "schritt-4": [
        "Claude has created {register}: {belegt} answers are covered, {schwach} are weak and {luecke} have a gap.",
        "Under “Check by hand” you find the 21 answers. Choose one to see its file and its lines.",
      ],
      "schritt-5": ["Claude checks the meter readings and updates the register: now {belegt} answers are covered, {schwach} are weak and {luecke} have a gap."],
    },
    mismatch: "For {row}, Claude wrote “{claude}” in this run, while the kit's answers say “{solution}”. That is why a person checks every answer before it leaves the company.",
    invoiceHint: "Under “Check by hand”, drag the bill into the empty September slot and see which answers change.",
  },
  stepOf: "Part {n} of {total}",
  next: {
    send: "Play the recording",
    finish: "Show the whole answer",
  },
  measured: {
    caption: ["With Claude and the skill, the five steps took a median of {time}, measured in {runs} runs on {date}.", "We did not measure how long the same work takes by hand."],
    title: "What we measured, and what we did not",
    claude: "With Claude and the skill",
    claudeLead: "Median of {runs} runs of steps 1 to 5 on {date}, with {model} in Claude Code {version}. The runs took between {min} and {max}.",
    allRight: "In all {runs} runs the 21 answers had the same status as the kit's answers, before and after the late invoice.",
    someRight: "In {ok} of {runs} runs the 21 answers had the same status as the kit's answers, before and after the late invoice. In one run one answer differed before the late invoice.",
    september: "Claude named the missing month after a median of {s} seconds.",
    shown: "The run in this window",
    stepBar: "Step {n}: {s} seconds",
    hand: "By hand",
    handValue: "not measured",
    handLead: "Nobody has worked through the 21 answers by hand with a stopwatch, so there is no time here.",
    efrag:
      "For comparison, not our measurement: one customer or bank request for sustainability data cost a small EU firm about EUR 4,700 in 2023. Most of it was its own staff's time (EFRAG, cost-benefit analysis for the VSME, 2024).",
    notCounted:
      "Building the folder and checking every answer are not counted. That stays a person's job. We measured on the command line, not in claude.ai, with two runs at a time.",
    minSec: "{min} min {s} s",
  },
  install: {
    caption: ["For home: this is how to set up the skill in your own Claude. In the workshop I show the setup in my account.", "The labels come from Anthropic's help pages as of 26 October 2026 and may change."],
    stepOf: "Setup, step {n} of {total}",
    next: "Next: setup, step {n} of {total}",
    steps: [
      "Open Settings, then “Capabilities”. Switch on “Code execution and file creation”. In the new layout the switch is called “Create and edit files”. Skills need it, because Claude opens their files in its own workspace.",
      "Open “Customize” in the sidebar, then “Skills”, or go straight to claude.ai/customize/skills.",
      "Choose “+”, then “Create skill” and “Upload a skill”. Choose the file esg-evidence.zip that you download here.",
      "Switch the skill on. Ask your question as usual, or type “/” and pick esg-evidence.",
    ],
    download: "Download the skill (ZIP)",
    capability: "Code execution and file creation",
    capabilityNote: "Claude can execute code and create and edit files.",
    settings: "Settings",
    capabilities: "Capabilities",
    yourSkills: "Your skills",
    discover: "Discover",
    createdByYou: "Created by you",
    add: "Create skill",
    upload: "Upload a skill",
    drop: "Drag and drop or click to upload",
  },
  takehome: {
    caption: ["Here are the skill, the templates and the kit with every file from this window.", "After the workshop you can work through the kit's five prompts in your own Claude."],
    prompts: "The kit's five prompts",
    promptsLead: "These are exactly the prompts we sent for the recording, each with the attached files from the kit.",
    own: "Check a claim of your own",
    ownLead: "Put a claim of your own next to its file, in your browser and without AI.",
  },
};

export const APP_COPY: { readonly de: AppCopy; readonly en: AppCopy } = { de, en };

export { fill } from "./app-data";
