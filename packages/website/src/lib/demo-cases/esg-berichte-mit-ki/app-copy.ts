/**
 * The words of the depicted Claude app in workshop 04 (language standard
 * B.9). The app's own chrome keeps Claude's English labels in both editions
 * (the German labels are not documented, claude-desktop-spec 13); everything
 * that explains keeps the visitor's language. Slots in braces are filled
 * from the recordings, the kit or the measurement, never written as literals.
 */

const de = {
  depiction: "Darstellung der Claude-App, Antworten aufgezeichnet am {date}",
  recordedMeta: "Aufgezeichnet am {date} mit {model} in Claude Code {version}. Wartezeiten sind verkürzt, der Text ist unverändert.",
  surface:
    "Aufgenommen mit Claude Code im Terminal, mit demselben Skill und denselben Dateien wie im Kit. In der Desktop-App kann die Antwort anders formuliert sein.",
  /** The app's chrome, as Claude labels it. */
  ui: {
    newChat: "New chat",
    chats: "Chats",
    projects: "Projects",
    artifacts: "Artifacts",
    customize: "Customize",
    knowledge: "Project knowledge",
    instructions: "Instructions",
    skills: "Skills",
    on: "On",
    reply: "Reply to Claude…",
    start: "How can I help you today?",
    menu: "Menü öffnen",
    closeMenu: "Menü schließen",
    send: "Nachricht senden",
    input: "Eingabefeld mit dem Prompt",
    download: "Download",
    copy: "Copy",
    files: "{n} files",
  },
  account: "Du",
  chatTitles: ["Fragebogen Nordvik", "Werbeaussagen", "Bankformular", "Nachweisregister"],
  activity: {
    running: "Claude arbeitet",
    done: "{n} Schritte in {time}",
    thinking: "Nachgedacht",
    thinkingNote: "Den Text des Nachdenkens gibt Claude Code nicht heraus. Diese Zeile zeigt nur, wann Claude nachgedacht hat.",
    skill: "Skill geladen: {name}",
    read: "Gelesen: {name}",
    search: "Gesucht: {name}",
    command: "Code ausgeführt",
    write: "Datei geschrieben: {name}",
    denied: "Die Freigaberegel der Messung hat diesen Befehl abgelehnt, Claude hat es danach anders versucht.",
    failed: "Der Befehl ist mit einem Fehler beendet worden.",
    showCode: "Code zeigen",
    hideCode: "Code ausblenden",
  },
  cite: "{file} an Zeile {line} öffnen",
  citeFile: "{file} öffnen",
  panel: {
    close: "Panel schließen",
    open: "Öffnen",
    check: "Von Hand prüfen",
    file: "Datei",
    produced: "Von Claude erstellt",
    attached: "Angehängt",
    knowledge: "Aus dem Projektwissen",
    lines: "Zeilen {from} bis {to}",
    line: "Zeile {n}",
    registerBefore: "Status nach Schritt 4. Tippe auf eine Antwort, um ihre Datei und Zeilen zu sehen.",
    registerAfter: "Status nach Schritt 5, so wie Claude sie in die Datei geschrieben hat.",
  },
  sheetTitle: "Neben dem Chat",
  /** One card per step in the phone chat: the artifact opens as a sheet. */
  openCheck: "Von Hand prüfen",
  monthCheck: {
    lead: "Zähl selbst nach, so wie Claude es im Code getan hat. Tippe jede Zeile mit einer Rechnung an.",
    count: "Du hast {rows} Zeilen markiert, das sind {months} verschiedene Monate.",
    duplicate: "Zeile {a} und Zeile {b} sind dieselbe Rechnung {invoice}. Sie zählt einmal.",
    missing: "Für {missing} gibt es keine Rechnung. Das ist das Dokument, das Claude anfordert.",
    all: "Alle markieren",
    clear: "Markierung löschen",
    row: "Zeile {n}, {month}, Rechnung {invoice}",
  },
  monthNames: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  steps: {
    ready: {
      "schritt-1": [
        "Im Projekt liegen die 13 Dateien des Weinguts und die Projektanweisung, und der Skill esg-nachweise ist eingeschaltet.",
        "Schick den Prompt mit dem Pfeil im Eingabefeld ab. Claude bekommt dann den Fragebogen des Importeurs mit dem Prompt aus dem Kit.",
      ],
      "schritt-2": [
        "Schritt 2 beginnt einen neuen Chat im selben Projekt.",
        "Schick den Prompt ab. Claude prüft die sieben Werbeaussagen des Marketings, zuerst gegen die Verbotsliste.",
      ],
      "schritt-3": [
        "Auch Schritt 3 beginnt einen neuen Chat.",
        "Schick den Prompt ab. Claude füllt die sechs Felder der Bank aus und rechnet die Amortisation im Code.",
      ],
      "schritt-4": [
        "Schritt 4 hängt alle drei Anfragen an einen neuen Chat.",
        "Schick den Prompt ab. Claude schreibt dann alle 21 Antworten in eine Excel-Datei, das Nachweisregister.",
      ],
      "schritt-5": [
        "Die Buchhaltung hat die fehlende Stromrechnung gefunden, als Foto. Schritt 5 bleibt im Chat von Schritt 4, denn dort liegt das Register.",
        "Schick den Prompt ab. Claude prüft dann die Rechnung und jede Zeile des Registers, die die Stromdatei zitiert.",
      ],
    },
    running: [
      "Claude lädt den Skill, liest die Dateien und rechnet im Code.",
      "Dieser Schritt hat in der Messung {s} Sekunden gedauert. Hier sind die Wartezeiten verkürzt, die Antwort ist Wort für Wort die Aufzeichnung.",
    ],
    done: {
      "schritt-1": [
        "Claude belegt {belegt} der 8 Fragen und nennt bei Q1, der Stromfrage, das fehlende Dokument: die Stromrechnung für September 2025.",
        "Tippe in der Antwort auf „{strom}“. Die Datei öffnet sich, und du siehst selbst 12 Zeilen, aber nur {months} Monate.",
      ],
      "schritt-2": ["Claude gibt {belegt} der 7 Aussagen frei und streicht die anderen {rest}, darunter „{claim}“ für die Regalkarte."],
      "schritt-3": ["Bei F2, dem Stromverbrauch des ganzen Jahres, kommt die Lücke aus Schritt 1 zurück: Claude nennt {mwh11} MWh nur als Summe von {months} Monaten."],
      "schritt-4": [
        "Claude hat {register} erstellt: {belegt} Antworten sind belegt, {schwach} schwach belegt und {luecke} haben eine Lücke.",
        "Unter „Von Hand prüfen“ liegen die 21 Antworten. Tippe auf eine, dann siehst du ihre Datei und ihre Zeilen.",
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
  next: {
    send: "Prompt senden",
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
      "So richtest du den Skill in deinem eigenen Claude ein. Er ist dort derselbe wie in diesem Fenster.",
      "Die Beschriftungen stammen aus der Hilfe von Anthropic, Stand 26.10.2026, und können sich ändern.",
    ],
    stepOf: "Schritt {n} von {total}",
    next: "Weiter: Schritt {n} von {total}",
    steps: [
      "Öffne die Einstellungen und dann „Capabilities“. Schalte „Code execution and file creation“ ein, im neuen Layout heißt der Schalter „Create and edit files“. Skills brauchen ihn, weil Claude ihre Dateien in einer eigenen Arbeitsumgebung öffnet.",
      "Öffne in der Seitenleiste „Customize“ und dann „Skills“, oder gehe direkt auf claude.ai/customize/skills.",
      "Tippe auf „+“, dann auf „Create skill“ und „Upload a skill“. Wähle die Datei esg-nachweise.zip, die du hier herunterlädst.",
      "Schalte den Skill ein. Stell deine Frage wie gewohnt, oder tippe „/“ und wähle esg-nachweise aus.",
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
    team: "Auf Team und Enterprise kann dein Admin eigene Skills abschalten.",
    code: "In Claude Code entpackst du die ZIP-Datei nach ~/.claude/skills/. Mit demselben Login lädt Claude Code deine Skills aus claude.ai selbst.",
  },
  takehome: {
    caption: [
      "Hier liegen der Skill, die Vorlagen und das Kit mit allen Dateien aus diesem Fenster.",
      "Lade das Kit herunter und schick dieselben fünf Prompts an dein eigenes Claude.",
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
  surface: "Recorded with Claude Code in the terminal, with the same skill and the same files as in the kit. In the desktop app the answer may be worded differently.",
  ui: {
    newChat: "New chat",
    chats: "Chats",
    projects: "Projects",
    artifacts: "Artifacts",
    customize: "Customize",
    knowledge: "Project knowledge",
    instructions: "Instructions",
    skills: "Skills",
    on: "On",
    reply: "Reply to Claude…",
    start: "How can I help you today?",
    menu: "Open the menu",
    closeMenu: "Close the menu",
    send: "Send message",
    input: "Message field with the prompt",
    download: "Download",
    copy: "Copy",
    files: "{n} files",
  },
  account: "You",
  chatTitles: ["Nordvik questionnaire", "Marketing claims", "Bank form", "Evidence register"],
  activity: {
    running: "Claude is working",
    done: "{n} steps in {time}",
    thinking: "Thought",
    thinkingNote: "Claude Code does not hand out the thinking text. This row only shows when Claude thought.",
    skill: "Loaded the skill {name}",
    read: "Read {name}",
    search: "Searched for {name}",
    command: "Ran code",
    write: "Wrote {name}",
    denied: "The measurement's permission rule refused this command, so Claude tried another way.",
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
    file: "File",
    produced: "Created by Claude",
    attached: "Attached",
    knowledge: "From the project knowledge",
    lines: "Lines {from} to {to}",
    line: "Line {n}",
    registerBefore: "Statuses after step 4. Tap an answer to see its file and lines.",
    registerAfter: "Statuses after step 5, as Claude wrote them into the file.",
  },
  sheetTitle: "Beside the chat",
  openCheck: "Check by hand",
  monthCheck: {
    lead: "Count it yourself, the way Claude did in code. Tap every row with a bill.",
    count: "You have marked {rows} rows, which are {months} different months.",
    duplicate: "Line {a} and line {b} are the same bill {invoice}. It counts once.",
    missing: "There is no bill for {missing}. That is the document Claude asks for.",
    all: "Mark all",
    clear: "Clear marks",
    row: "Line {n}, {month}, bill {invoice}",
  },
  monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  steps: {
    ready: {
      "schritt-1": [
        "The project holds the winery's 13 files and the project instructions, and the skill esg-nachweise is switched on.",
        "Send the prompt with the arrow in the message box. Claude then gets the importer's questionnaire with the prompt from the kit.",
      ],
      "schritt-2": ["Step 2 starts a new chat in the same project.", "Send the prompt. Claude checks marketing's seven claims, first against the ban list."],
      "schritt-3": ["Step 3 starts a new chat too.", "Send the prompt. Claude fills in the bank's six fields and works out the payback in code."],
      "schritt-4": ["Step 4 attaches all three requests to a new chat.", "Send the prompt. Claude then writes all 21 answers into one Excel file, the evidence register."],
      "schritt-5": [
        "Accounts has found the missing electricity bill, as a photo. Step 5 stays in the chat of step 4, because the register lives there.",
        "Send the prompt. Claude then checks the bill and every register row that quotes the electricity file.",
      ],
    },
    running: [
      "Claude loads the skill, reads the files and does the maths in code.",
      "In the measurement this step took {s} seconds. Here the waiting is shortened; the answer is the recording, word for word.",
    ],
    done: {
      "schritt-1": [
        "Claude covers {belegt} of the 8 questions and names the missing document for Q1, the electricity question: the September 2025 power bill.",
        "Tap “{strom}” in the answer. The file opens, and you can see 12 rows but only {months} months.",
      ],
      "schritt-2": ["Claude lets {belegt} of the 7 claims go out and strikes the other {rest}, among them “{claim}” for the shelf card."],
      "schritt-3": ["For F2, the electricity use of the whole year, the gap from step 1 comes back. Claude gives {mwh11} MWh only as the total of {months} months."],
      "schritt-4": [
        "Claude has created {register}: {belegt} answers are covered, {schwach} are weak and {luecke} have a gap.",
        "Under “Check by hand” you find the 21 answers. Tap one to see its file and its lines.",
      ],
      "schritt-5": ["Claude checks the meter readings and updates the register: now {belegt} answers are covered, {schwach} are weak and {luecke} have a gap."],
    },
    mismatch: "For {row}, Claude wrote “{claude}” in this run, while the kit's answers say “{solution}”. That is why a person checks every answer before it leaves the company.",
    invoiceHint: "Under “Check by hand”, drag the bill into the empty September slot and see which answers change.",
  },
  next: {
    send: "Send the prompt",
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
    caption: ["This is how you set up the skill in your own Claude. It is the same skill as in this window.", "The labels come from Anthropic's help pages as of 26 October 2026 and may change."],
    stepOf: "Step {n} of {total}",
    next: "Next: step {n} of {total}",
    steps: [
      "Open Settings, then “Capabilities”. Switch on “Code execution and file creation”; in the new layout the switch is called “Create and edit files”. Skills need it, because Claude opens their files in its own workspace.",
      "Open “Customize” in the sidebar, then “Skills”, or go straight to claude.ai/customize/skills.",
      "Tap “+”, then “Create skill” and “Upload a skill”. Choose the file esg-nachweise.zip that you download here.",
      "Switch the skill on. Ask your question as usual, or type “/” and pick esg-nachweise.",
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
    team: "On Team and Enterprise plans your admin can switch off custom skills.",
    code: "In Claude Code you unzip the file into ~/.claude/skills/. With the same login, Claude Code loads your claude.ai skills by itself.",
  },
  takehome: {
    caption: ["Here are the skill, the templates and the kit with every file from this window.", "Download the kit and send the same five prompts to your own Claude."],
    prompts: "The kit's five prompts",
    promptsLead: "These are exactly the prompts we sent for the recording, each with the attached files from the kit.",
    own: "Check a claim of your own",
    ownLead: "Put a claim of your own next to its file, in your browser and without AI.",
  },
};

export const APP_COPY: { readonly de: AppCopy; readonly en: AppCopy } = { de, en };

export { fill } from "./app-data";
