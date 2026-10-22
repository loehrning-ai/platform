import { ACCOUNT_KIND } from "./core";
import type {
  Account,
  AccountId,
  ContentOption,
  Device,
  L10n,
  RouteRow,
  RuleId,
  Scene,
  SceneId,
} from "./types";

/*
 * The case data: six accounts and the eight pastes of scenes.md in kit order,
 * keyed by ANSWERS.md mission 3. Accounts and lines follow facts.md
 * (F1 to F13, checked 18 Oct 2026) and deck slide 05; nothing else.
 */

/** "Gespeichert" is the same for every Claude account: that sameness is the lesson. */
const STORED: RouteRow = {
  key: "stored",
  value: { de: "USA · Anthropic, 15.06.2026", en: "US · Anthropic, 15 Jun 2026" },
  cite: 7,
};

/** The line under "Gespeichert" for every Claude account (F7, "Processing may run"). */
export const STORED_LINE: L10n = {
  de: "Verarbeitung kann auch in Europa, Asien und Australien laufen. Die Seite bietet keine reine EU-Option an.",
  en: "Processing may also run in Europe, Asia and Australia. The page offers no EU-only option.",
};

const CONSUMER: RouteRow = {
  key: "contract",
  value: { de: "Verbraucherbedingungen", en: "Consumer Terms" },
  cite: 1,
};
const COMMERCIAL: RouteRow = {
  key: "contract",
  value: { de: "Geschäftsbedingungen", en: "Commercial Terms" },
  cite: 1,
};
const NO_TRAINING: RouteRow = {
  key: "training",
  value: { de: "Nein, außer Daumen-Feedback", en: "No, except thumbs feedback" },
  cite: 3,
};
const TEAM_COMPANY: RouteRow = {
  key: "company",
  value: { de: "Inhaber verwalten Einstellungen", en: "Owners manage settings" },
  cite: "deck05",
};

const TEAM_ROUTE: readonly RouteRow[] = [COMMERCIAL, NO_TRAINING, TEAM_COMPANY, STORED];

export const ACCOUNTS: Readonly<Record<AccountId, Account>> = {
  freeChatbot: {
    id: "freeChatbot",
    kind: ACCOUNT_KIND.freeChatbot,
    label: { de: "Privat: kostenloser Chatbot", en: "Personal: free chatbot" },
    dialLabel: { de: "Privat: Chatbot", en: "Personal: chatbot" },
    route: null,
    unknownLine: {
      de: "Für diesen Chatbot hat Vardar keine Fakten. Alle vier Zeilen: nicht in den Dateien.",
      en: "Vardar has no facts for this chatbot. All four rows: not in the files.",
    },
    gaps: null,
  },
  claudePro: {
    id: "claudePro",
    kind: ACCOUNT_KIND.claudePro,
    label: { de: "Privat: Claude Pro", en: "Personal: Claude Pro" },
    dialLabel: { de: "Privat: Pro", en: "Personal: Pro" },
    route: [
      CONSUMER,
      { key: "training", value: { de: "Deine Einstellung", en: "Your setting" }, cite: 2 },
      {
        key: "company",
        value: { de: "Keine Firmen-Admin-Werkzeuge", en: "No company admin tools" },
        cite: 10,
      },
      STORED,
    ],
    gaps: { de: "Standard des Schalters", en: "Default of the switch" },
  },
  claudeTeam: {
    id: "claudeTeam",
    kind: ACCOUNT_KIND.claudeTeam,
    label: { de: "Firma: Claude Team", en: "Company: Claude Team" },
    dialLabel: { de: "Firma: Team", en: "Company: Team" },
    route: TEAM_ROUTE,
    gaps: {
      de: "Aufbewahrung, Auftragsverarbeitung, EU-Speicher",
      en: "Retention, data processing agreement, EU storage",
    },
  },
  claudeTeamDesktop: {
    id: "claudeTeamDesktop",
    kind: ACCOUNT_KIND.claudeTeamDesktop,
    label: {
      de: "Firma: Claude Team, Desktop-App mit Cowork",
      en: "Company: Claude Team, Desktop app with Cowork",
    },
    dialLabel: { de: "Firma: Team, Desktop", en: "Company: Team, Desktop" },
    route: TEAM_ROUTE,
    gaps: {
      de: "Aufbewahrung, Auftragsverarbeitung, EU-Speicher, was Desktop sendet",
      en: "Retention, data processing agreement, EU storage, what Desktop sends",
    },
    note: {
      text: {
        de: "Verbundener Ordner: In Cloud-Sitzungen verarbeitet Anthropic die Dateien, die Claude öffnet. Unsere Lesart, Anbieterseite prüfen.",
        en: "Connected folder: in cloud sessions, Anthropic processes the files Claude opens. Our reading: check the vendor page.",
      },
      cite: 9,
    },
  },
  claudeEnterprise: {
    id: "claudeEnterprise",
    kind: ACCOUNT_KIND.claudeEnterprise,
    label: { de: "Firma: Claude Enterprise", en: "Company: Claude Enterprise" },
    dialLabel: { de: "Firma: Enterprise", en: "Company: Enterprise" },
    route: [
      COMMERCIAL,
      NO_TRAINING,
      {
        key: "company",
        value: { de: "Wie Team, plus Audit-Logs", en: "As Team, plus audit logs" },
        cite: 6,
      },
      STORED,
    ],
    gaps: { de: "EU-Speicher", en: "EU storage" },
  },
  apiTest: {
    id: "apiTest",
    kind: ACCOUNT_KIND.apiTest,
    label: { de: "Test-Konto für die API", en: "Test account for the API" },
    dialLabel: { de: "Test-Konto der API", en: "API test account" },
    route: null,
    unknownLine: {
      de: "Für das Test-Konto der API nennen die Dateien nichts.",
      en: "The files say nothing about the API test account.",
    },
    gaps: null,
  },
};

export const ACCOUNT_IDS = Object.keys(ACCOUNTS) as readonly AccountId[];

export const DEVICE_WORD: Readonly<Record<Device, L10n | null>> = {
  phone: { de: "Handy", en: "Phone" },
  browser: { de: "Browser", en: "Browser" },
  desktopFolder: { de: "Ordner verbunden", en: "Folder connected" },
  server: null,
};

const TODO = {
  namesNumbers: { de: "Namen und Nummern raus", en: "names and numbers out" },
  person: { de: "eine benannte Person prüft", en: "a named person checks" },
  contract: { de: "Vertrag prüfen", en: "check the contract" },
} as const satisfies Record<string, L10n>;

const CUSTOMER_TODO = [TODO.namesNumbers, TODO.person] as const;

function option(
  id: ContentOption["id"],
  kind: ContentOption["kind"],
  label: L10n,
  todo?: readonly L10n[],
): ContentOption {
  return todo ? { id, kind, label, todo } : { id, kind, label };
}

export const SCENES: readonly Scene[] = [
  {
    id: "ana",
    order: 1,
    person: "Ana",
    role: { de: "Support", en: "Support" },
    verb: { de: "Fügt ein:", en: "Pastes:" },
    what: { de: "eine Beschwerde-Mail eines Kunden", en: "a customer's complaint email" },
    parts: [
      { de: "[Name]", en: "[name]" },
      { de: "[Bestellnummer]", en: "[order number]" },
      { de: "[Adresse]", en: "[address]" },
    ],
    short: { de: "Handy", en: "Phone" },
    devices: { freeChatbot: "phone", claudeTeam: "browser" },
    accountDial: ["freeChatbot", "claudeTeam"],
    contentDial: [
      option("asIs", "customer", { de: "So wie sie ist", en: "As it is" }, CUSTOMER_TODO),
      option(
        "pastedToClean",
        "pastedToClean",
        { de: "Ganz einfügen, Claude bereinigt", en: "Paste it whole, Claude cleans it" },
        CUSTOMER_TODO,
      ),
      option(
        "cleaned",
        "cleaned",
        {
          de: "Von Hand: [KUNDE] [BESTELLUNG] [ADRESSE] [E-MAIL]",
          en: "By hand: [CUSTOMER] [ORDER] [ADDRESS] [EMAIL]",
        },
        [TODO.person],
      ),
    ],
    key: "red",
    reason: { de: "Kundendaten auf einem privaten Konto.", en: "Customer data on a personal account." },
    misconception: {
      green: {
        de: "Das Handy ist privat, der Inhalt nicht. Kundendaten machen es rot.",
        en: "The phone is personal, the content is not. Customer data makes it red.",
      },
      amber: {
        de: "Gelb gibt es nur im Firmenwerkzeug. Auf dem privaten Handy bleibt es rot.",
        en: "Amber exists only on the company tool. On a personal phone it stays red.",
      },
    },
    afterNote: {
      de: "Im Kit war die Mail erfunden, deshalb durfte sie in jedes Konto.",
      en: "In the kit the mail was invented, which is why it could go into any account.",
    },
  },
  {
    id: "stefan",
    order: 2,
    person: "Stefan",
    role: { de: "Marketing", en: "Marketing" },
    verb: { de: "Fügt ein:", en: "Pastes:" },
    what: {
      de: "den öffentlichen Text der Firmen-Website, um ihn für LinkedIn zu kürzen",
      en: "the public text of the company website, to shorten it for LinkedIn",
    },
    parts: [{ de: "[Website-Text]", en: "[website text]" }],
    short: { de: "Chatbot", en: "Chatbot" },
    devices: { freeChatbot: "browser", claudeTeam: "browser" },
    accountDial: ["freeChatbot", "claudeTeam"],
    contentDial: [
      option("asIs", "public", { de: "Öffentlicher Website-Text", en: "Public website text" }),
      option(
        "alt",
        "customer",
        { de: "Eine Kunden-Mail mit Name und Adresse", en: "A customer email with name and address" },
        CUSTOMER_TODO,
      ),
    ],
    key: "green",
    reason: { de: "Öffentlicher Text. Jedes Werkzeug.", en: "Public text. Any tool." },
    misconception: {
      amber: {
        de: "Öffentlicher Text braucht keine To-do-Liste.",
        en: "Public text needs no to-do list.",
      },
      red: {
        de: "Das Konto ist privat, aber der Text ist öffentlich.",
        en: "The account is personal, but the text is public.",
      },
    },
  },
  {
    id: "elena",
    order: 3,
    person: "Elena",
    role: { de: "Projektleitung", en: "Project lead" },
    verb: { de: "Fügt ein:", en: "Pastes:" },
    what: { de: "das Protokoll eines Kundengesprächs", en: "a customer call transcript" },
    parts: [
      { de: "[Namen]", en: "[names]" },
      { de: "[Preis]", en: "[price]" },
      { de: "[Verzug]", en: "[delay]" },
    ],
    short: { de: "Team", en: "Team" },
    devices: { claudeTeam: "browser", claudePro: "browser" },
    accountDial: ["claudeTeam", "claudePro"],
    contentDial: [
      option(
        "asIs",
        "customer",
        { de: "Mit Namen, Preis, Verzug", en: "With names, price, delay" },
        [{ de: "Namen und Preis raus", en: "names and price out" }, TODO.contract],
      ),
      option(
        "cleaned",
        "cleaned",
        { de: "Von Hand: [KUNDE] [PREIS] [DATUM]", en: "By hand: [CUSTOMER] [PRICE] [DATE]" },
        [TODO.contract],
      ),
    ],
    key: "amber",
    reason: {
      de: "Firmenwerkzeug. Erst Namen raus, dann den Vertrag prüfen.",
      en: "Company tool. Names out first, then check the contract.",
    },
    misconception: {
      green: {
        de: "Das Firmenwerkzeug ist nötig, aber nicht genug. Erst Namen raus.",
        en: "The company tool is needed, but not enough. Names out first.",
      },
      red: {
        de: "Im Firmenwerkzeug ist das Gelb, mit To-do-Liste.",
        en: "On the company tool this is amber, with a to-do list.",
      },
    },
  },
  {
    id: "marko",
    order: 4,
    person: "Marko",
    role: { de: "Entwicklung", en: "Development" },
    verb: { de: "Fügt ein:", en: "Pastes:" },
    what: {
      de: "den Code eines Kunden, um einen Fehler zu finden",
      en: "a customer's code, to find a bug",
    },
    parts: [{ de: "[API-Schlüssel im Code]", en: "[API key in the code]" }],
    short: { de: "Pro", en: "Pro" },
    devices: { claudePro: "browser", claudeTeam: "browser", claudeEnterprise: "browser" },
    accountDial: ["claudePro", "claudeTeam", "claudeEnterprise"],
    contentDial: [
      option("asIs", "secret", { de: "Mit Schlüssel im Code", en: "With the key in the code" }),
      option(
        "cleaned",
        "cleaned",
        { de: "Schlüssel durch [API_KEY] ersetzt", en: "Key replaced by [API_KEY]" },
        [{ de: "Vertrag mit dem Kunden prüfen", en: "check the contract with the customer" }, TODO.person],
      ),
    ],
    key: "red",
    reason: {
      de: "Ein Schlüssel ist ein Geheimnis. Er muss geändert werden.",
      en: "A key is a secret. It must be changed.",
    },
    misconception: {
      green: {
        de: "Ein Schlüssel ist auf jedem Konto rot, auch im Firmenwerkzeug.",
        en: "A key is red on every account, even on the company tool.",
      },
      amber: {
        de: "Ein Schlüssel ist auf jedem Konto rot, auch im Firmenwerkzeug.",
        en: "A key is red on every account, even on the company tool.",
      },
    },
  },
  {
    id: "jovana",
    order: 5,
    person: "Jovana",
    role: { de: "HR", en: "HR" },
    verb: { de: "Fügt ein und fragt:", en: "Pastes and asks:" },
    what: {
      de: "drei Lebensläufe, „Wer ist am besten?“",
      en: "three CVs, “Who is best?”",
    },
    parts: [
      { de: "[Namen]", en: "[names]" },
      { de: "[Gehaltswünsche]", en: "[salary asks]" },
    ],
    short: { de: "Team", en: "Team" },
    devices: { claudeTeam: "browser", claudePro: "browser" },
    accountDial: ["claudeTeam", "claudePro"],
    contentDial: [
      option("asIs", "people", { de: "Mit Namen", en: "With names" }, [
        { de: "Namen raus", en: "names out" },
        { de: "HR fragen", en: "ask HR" },
      ]),
      option("cleaned", "cleaned", { de: "Namen raus", en: "Names out" }, [
        { de: "HR fragen", en: "ask HR" },
      ]),
    ],
    key: "amber",
    reason: { de: "Namen raus, HR fragen.", en: "Names out, ask HR." },
    misconception: {
      green: {
        de: "Lebensläufe sind Personendaten, und Bewerbungen ranken ist ab 2. Dez. 2027 hochriskant.",
        en: "CVs are personal data, and ranking applicants is high-risk from 2 Dec 2027.",
      },
      red: {
        de: "Firmenkonto: erst Namen raus, dann HR fragen.",
        en: "Company account: names out first, then ask HR.",
      },
    },
    flag: {
      text: {
        de: "Bewerbungen ranken ist hochriskant ab 2. Dez. 2027 (EU AI Act).",
        en: "Ranking applicants is high-risk from 2 Dec 2027 (EU AI Act).",
      },
      cite: 13,
    },
  },
  {
    id: "mila",
    order: 6,
    person: "Mila",
    role: { de: "Finanzen", en: "Finance" },
    verb: { de: "Lädt hoch:", en: "Uploads:" },
    what: {
      de: "eine Tabelle mit Kundenrechnungen, um Fehler zu finden",
      en: "a sheet of customer invoices, to find mistakes",
    },
    parts: [
      { de: "[Firmennamen]", en: "[company names]" },
      { de: "[Beträge]", en: "[amounts]" },
      { de: "[IBANs]", en: "[IBANs]" },
    ],
    short: { de: "Enterprise", en: "Enterprise" },
    devices: { claudeEnterprise: "browser", claudeTeam: "browser", claudePro: "browser" },
    accountDial: ["claudeEnterprise", "claudeTeam", "claudePro"],
    contentDial: [
      option(
        "asIs",
        "customer",
        { de: "Mit IBANs und Firmennamen", en: "With IBANs and company names" },
        [{ de: "IBANs und Firmennamen raus", en: "IBANs and company names out" }, TODO.contract],
      ),
      option(
        "cleaned",
        "cleaned",
        { de: "IBANs und Firmennamen raus", en: "IBANs and company names out" },
        [TODO.contract],
      ),
    ],
    key: "amber",
    reason: {
      de: "Firmenkonto. Erst IBANs und Firmennamen raus, dann Vertrag prüfen.",
      en: "Company account. IBANs and company names out first, then check the contract.",
    },
    misconception: {
      green: {
        de: "Enterprise macht aus Rot kein Grün, und aus Gelb auch nicht.",
        en: "Enterprise does not turn red into green, and not amber either.",
      },
      red: {
        de: "Enterprise ist ein Firmenkonto. Erst IBANs und Firmennamen raus.",
        en: "Enterprise is a company account. IBANs and company names out first.",
      },
    },
  },
  {
    id: "petar",
    order: 7,
    person: "Petar",
    role: { de: "Teamleitung", en: "Team lead" },
    verb: { de: "Verbindet:", en: "Connects:" },
    what: {
      de: "seinen ganzen Ordner Dokumente, darin Kundenverträge unter NDA",
      en: "his whole Documents folder, which holds customer contracts under NDA",
    },
    parts: [
      { de: "[Kundenverträge]", en: "[customer contracts]" },
      { de: "[NDA]", en: "[NDA]" },
    ],
    short: { de: "Desktop", en: "Desktop" },
    devices: { claudeTeamDesktop: "desktopFolder" },
    accountDial: ["claudeTeamDesktop"],
    contentDial: [
      option("asIs", "folder", { de: "Ganzer Ordner Dokumente", en: "Whole Documents folder" }),
      option(
        "cleaned",
        "cleaned",
        {
          de: "Ein bereinigter Ordner, nur für diese Aufgabe",
          en: "A cleaned folder, only for this task",
        },
        [TODO.person],
      ),
    ],
    key: "red",
    reason: { de: "Der ganze Ordner, so wie beschrieben.", en: "The whole folder, as written." },
    misconception: {
      green: {
        de: "Ein bereinigter Ordner könnte Gelb werden. Der ganze Ordner ist rot.",
        en: "A cleaned folder could become amber. The whole folder is red.",
      },
      amber: {
        de: "Ein bereinigter Ordner könnte Gelb werden. Der ganze Ordner ist rot.",
        en: "A cleaned folder could become amber. The whole folder is red.",
      },
    },
  },
  {
    id: "dario",
    order: 8,
    person: "Dario",
    role: { de: "Entwicklung", en: "Development" },
    verb: { de: "Fügt ein:", en: "Pastes:" },
    what: {
      de: "20 echte Zeilen aus der Produktionsdatenbank, um einen Prompt zu testen",
      en: "20 real rows from the production database, to try a prompt",
    },
    parts: [{ de: "[echte Kundenzeilen]", en: "[real customer rows]" }],
    short: { de: "API-Test", en: "API test" },
    devices: { apiTest: "server" },
    accountDial: ["apiTest"],
    contentDial: [
      option("asIs", "customer", { de: "20 echte Zeilen", en: "20 real rows" }),
      option("alt", "invented", { de: "20 erfundene Zeilen", en: "20 made-up rows" }),
    ],
    key: "red",
    reason: {
      de: "Echte Kundenzeilen brauchen ein schriftliches Okay.",
      en: "Real customer rows need a written okay.",
    },
    misconception: {
      green: {
        de: "Der Prompt ist ein Test, die Zeilen sind echt.",
        en: "The prompt is a test, the rows are real.",
      },
      amber: {
        de: "Ein Test-Konto ist kein Freibrief. Echte Zeilen brauchen ein schriftliches Okay.",
        en: "A test account is no free pass. Real rows need a written okay.",
      },
    },
  },
];

export const SCENE_IDS = SCENES.map((scene) => scene.id) as readonly SceneId[];

export function sceneById(id: SceneId): Scene {
  const scene = SCENES.find((entry) => entry.id === id);
  if (!scene) throw new Error(`Unknown scene ${id}`);
  return scene;
}

/** The reason line per rule (spec 5.2). */
export const RULE_LINES: Readonly<Record<RuleId, L10n>> = {
  secret: {
    de: "Ein Geheimnis ist auf jedem Konto rot.",
    en: "A secret is red on every account.",
  },
  folder: {
    de: "Der ganze Ordner geht weiter als die Aufgabe. Rot.",
    en: "The whole folder goes wider than the task. Red.",
  },
  public: { de: "Öffentlich: jedes Werkzeug. Grün.", en: "Public: any tool. Green." },
  invented: {
    de: "Erfunden: keine Kundendaten. Grün.",
    en: "Invented: no customer data. Green.",
  },
  personalNotPublic: {
    de: "Nicht öffentlich auf einem privaten Konto: rot. Kein Firmenvertrag, keine Firmen-Admin-Werkzeuge.",
    en: "Not public on a personal account: red. No company contract, no company admin tools.",
  },
  testRealRows: {
    de: "Echte Zeilen brauchen ein schriftliches Okay.",
    en: "Real rows need a written okay.",
  },
  companyTodo: {
    de: "Firmenwerkzeug: Gelb. Gelb ist eine To-do-Liste, keine Erlaubnis.",
    en: "Company tool: amber. Amber is a to-do list, not a permission.",
  },
};

const MARKO_BOTH: L10n = {
  de: "Gelb: Schlüssel raus und Firmenkonto, beides war nötig.",
  en: "Amber: key out and company account, both were needed.",
};

/** fixLine overrides keyed `scene:account:content` (spec 5.3, plus Ana on Team). */
export const FIX_OVERRIDES: Readonly<Record<string, L10n>> = {
  "marko:claudeTeam:asIs": {
    de: "Noch rot. Ein Schlüssel ist auch im Firmenwerkzeug rot.",
    en: "Still red. A key is red on the company tool too.",
  },
  "marko:claudeEnterprise:asIs": {
    de: "Noch rot. Enterprise macht aus Rot kein Grün.",
    en: "Still red. Enterprise does not turn red into green.",
  },
  "marko:claudePro:cleaned": {
    de: "Noch rot. Der Schlüssel ist raus, aber der Kundencode liegt auf einem privaten Konto.",
    en: "Still red. The key is out, but the customer's code sits on a personal account.",
  },
  "marko:claudeTeam:cleaned": MARKO_BOTH,
  "marko:claudeEnterprise:cleaned": MARKO_BOTH,
  "ana:freeChatbot:pastedToClean": {
    de: "Noch rot. Wer zum Bereinigen einfügt, hat schon eingefügt.",
    en: "Still red. If you paste it to clean it, you already pasted it.",
  },
  "ana:claudeTeam:pastedToClean": {
    de: "Gelb, genau wie die Mail so wie sie ist. Wer zum Bereinigen einfügt, hat schon eingefügt.",
    en: "Amber, exactly like the mail as it is. If you paste it to clean it, you already pasted it.",
  },
  "ana:freeChatbot:cleaned": {
    de: "Noch rot. Bereinigt ist besser, aber das Handy-Konto bleibt privat.",
    en: "Still red. Cleaned is better, but the phone account stays personal.",
  },
  "mila:claudeTeam:asIs": {
    de: "Noch Gelb. Team statt Enterprise ändert die Zeile „Firma sieht“, nicht die Ampel.",
    en: "Still amber. Team instead of Enterprise changes the row “Company sees”, not the light.",
  },
  "elena:claudeTeam:cleaned": {
    de: "Bleibt: Vertrag prüfen. Gelb wird von allein nie Grün.",
    en: "Stays: check the contract. Amber never turns green by itself.",
  },
  "stefan:freeChatbot:alt": {
    de: "Rot. Gleicher Chatbot, anderer Inhalt. Bei Grün entscheidet der Inhalt.",
    en: "Red. Same chatbot, different content. For green, the content decides.",
  },
};
