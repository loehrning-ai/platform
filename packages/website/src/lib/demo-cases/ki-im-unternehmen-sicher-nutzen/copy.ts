import "server-only";

import type { Locale } from "@/lib/i18n/locale";
import { SAMPLES } from "./samples";
import type { AccountId, HitKind, KindLabels, Light, Sample, TodoId, VerdictReason } from "./types";

/**
 * The words of "Was fliegt mit?", both languages. Server only: index.tsx picks
 * one pack and passes it to the client demo as props, so the browser bundle
 * carries a single language (checked by demo-contract.test.ts). A pack is
 * plain data: strings, numbers, arrays and objects, no functions. "{n}"-style
 * holes are filled by the component.
 */
export interface DemoPack {
  readonly locale: Locale;
  readonly samples: readonly Sample[];
  readonly labels: KindLabels;
  readonly stage: {
    readonly counterMany: string;
    readonly counterOne: string;
    readonly counterNone: string;
    /** At 0 with names the detector cannot see: the counter must not claim "nothing". */
    readonly counterCheck: string;
    readonly handle: string;
    readonly line: string;
    readonly caption: string;
    readonly example: string;
    readonly cardLabel: string;
    readonly valueText: string;
    readonly settledLive: string;
    readonly settledNames: string;
    readonly restScan: string;
    readonly limits: string;
    readonly nameHint: string;
    /** Own text, no unflagged pair seen: the tool still cannot know names without a title. */
    readonly nameHintOwn: string;
    /** One line when a company name with a legal form is still in the clean text. {n} = how many. */
    readonly companyHint: string;
    readonly unlock: string;
    readonly lock: string;
    readonly lockOpen: string;
    readonly lockClosed: string;
    readonly wordHint: string;
    readonly undo: string;
    readonly hitReplaced: string;
    readonly hitKept: string;
  };
  readonly send: {
    readonly button: string;
    readonly note: string;
    readonly reset: string;
    readonly strip: string;
    readonly latch: string;
    readonly latchEmpty: string;
    readonly stripEmpty: string;
    readonly more: string;
    readonly sentLive: string;
  };
  readonly own: {
    readonly heading: string;
    readonly badge: string;
    readonly samples: string;
    readonly paste: string;
    readonly pasteReady: string;
    readonly pasteDenied: string;
    readonly pasteEmpty: string;
    /** Announced after a paste or a sample: the stage above has changed. */
    readonly updated: string;
    readonly textarea: string;
    readonly trainer: string;
    readonly offline: string;
    readonly net: string;
    readonly netPaths: string;
    readonly account: string;
    readonly accounts: Readonly<Record<AccountId, string>>;
    /** The same three, short enough for the segmented control on the stage. */
    readonly accountsShort: Readonly<Record<AccountId, string>>;
    /** Announced when a sample chip is chosen: {who} is its name, {n} the new counter. */
    readonly switched: string;
    readonly publicText: string;
  };
  readonly verdict: {
    readonly heading: string;
    readonly words: Readonly<Record<Light, string>>;
    readonly reasons: Readonly<Record<VerdictReason, string>>;
    /** The reason in a few words, for the one-line chip under SENDEN. */
    readonly chip: Readonly<Record<VerdictReason, string>>;
    readonly todos: Readonly<Record<TodoId, string>>;
    readonly enterprise: string;
    readonly enterpriseInfo: string;
    readonly source: string;
    readonly asOf: string;
    readonly slide: string;
    readonly mission: string;
    readonly fact: string;
    readonly notLegal: string;
    readonly open: string;
  };
  readonly take: {
    readonly heading: string;
    readonly promptTitle: string;
    readonly promptCopy: string;
    readonly promptNote: string;
    readonly byHand: string;
    readonly task: string;
    readonly taskPlaceholder: string;
    readonly rules: string;
    readonly fallbackTask: string;
    readonly replayTitle: string;
    readonly replayLabel: string;
    readonly replayOut: string;
    readonly replayHint: string;
    readonly replaySample: string;
    /** Reply for the visitor's own text: {tokens} is the placeholders of the key. */
    readonly answerOwn: string;
    readonly answerOwnEmpty: string;
    readonly replayCopy: string;
    readonly replayCopyNote: string;
    readonly restored: string;
    readonly notFound: string;
    readonly unknown: string;
    readonly ambiguous: string;
    readonly keyTitle: string;
    readonly keyEmpty: string;
    readonly noteTitle: string;
    readonly noteCopy: string;
    readonly copied: string;
    readonly selected: string;
    readonly note: {
      readonly line: string;
      readonly nothing: string;
      readonly account: Readonly<Record<AccountId, string>>;
      readonly nouns: Readonly<Record<HitKind, readonly [string, string]>>;
      readonly dateFormat: "dmy" | "iso";
      readonly datePending: string;
    };
  };
  readonly sources: {
    readonly heading: string;
    readonly intro: string;
    readonly rules: string;
    readonly facts: string;
    readonly factWord: string;
  };
}

const DE = {
  locale: "de",
  samples: SAMPLES.de,
  labels: {
    person: "KUNDE", order: "BESTELLUNG", ref: "NUMMER", address: "ADRESSE", email: "E-MAIL",
    phone: "TELEFON", iban: "IBAN", amount: "BETRAG", secret: "SCHLÜSSEL", manual: "ANGABE",
  },
  stage: {
    counterMany: "fliegen mit",
    counterOne: "fliegt mit",
    counterNone: "Nichts fliegt mit",
    counterCheck: "Muster übrig",
    handle: "Schwärzen",
    line: "Senden",
    caption: "Ab hier ist es raus.",
    example: "Beispiel: {who}",
    cardLabel: "Dein Text mit {n} markierten Angaben",
    valueText: "{done} von {total} geschwärzt",
    settledLive: "Fertig. Rest-Scan: {n} Muster.",
    settledNames: "Fertig. Rest-Scan: {n} Muster. Namen ohne Anrede erkennt das Werkzeug nicht: tippe sie an.",
    restScan: "Rest-Scan: {n} Muster.",
    limits:
      "Muster, kein Beweis. Nicht sichtbar: Namen ohne Anrede, Firmennamen, Zusammenhang. Tippe ein Wort, um es zu schwärzen.",
    nameHint: "Namen ohne Anrede? Tippe sie an.",
    nameHintOwn: "Namen ohne Anrede: tippe sie an. Das Werkzeug sieht sie nicht.",
    companyHint: "Firmenname im Text ({n}x, mit GmbH, AG o. Ä.): er geht mit. Tippe ihn an, wenn er raus soll.",
    unlock: "Weiter: dein eigener Text",
    lock: "Schloss",
    lockOpen: "offen",
    lockClosed: "geschlossen",
    wordHint: "Tippe ein Wort zum Schwärzen",
    undo: "Rückgängig",
    hitReplaced: "{kind}: {value}, wird ersetzt durch {token}. Tippen zum Behalten.",
    hitKept: "{kind}: {value}, bleibt stehen. Tippen zum Ersetzen.",
  },
  send: {
    button: "Senden (Probe)",
    note: "Eine Probe. Es wird nichts gesendet.",
    reset: "Zurücksetzen",
    strip: "Chat · gespeichert in den USA (Anthropic, Stand 15. Jun 2026)",
    latch: "Zurückziehen geht nicht. Aus dem Verlauf: sofort. Aus dem Back-end: innerhalb von 30 Tagen.",
    latchEmpty: "Gesendet ist gesendet. Diesmal waren nur Platzhalter dabei.",
    stripEmpty: "Nur Platzhalter sind raus. Der Schlüssel bleibt hier.",
    more: "+{n} weitere",
    sentLive: "Probe gesendet: {n} Angaben im Chat.",
  },
  own: {
    heading: "Dein Text",
    badge: "bleibt hier",
    samples: "Beispiel",
    paste: "Meinen Text einfügen",
    pasteReady: "Eingefügt aus der Zwischenablage. Es bleibt auf diesem Gerät.",
    pasteDenied: "Dein Browser lässt das Einfügen per Knopf nicht zu. Drücke im Feld lange, dann Einfügen.",
    pasteEmpty: "Die Zwischenablage ist leer.",
    updated: "Dein Text ist übernommen, der Griff steht oben wieder auf null. {n} Muster erkannt.",
    textarea: "Text hier einfügen (Langdruck, dann Einfügen)",
    trainer: "Im Raum nie echte Kundendaten einfügen.",
    offline: "Probier es im Flugmodus.",
    net: "Netzwerk seit deinem Einfügen: {n}",
    netPaths: "Anfragen: {paths}",
    account: "Konto",
    accounts: { personal: "Privat", team: "Firma: Team", enterprise: "Firma: Enterprise" },
    accountsShort: { personal: "Privat", team: "Team", enterprise: "Enterprise" },
    switched: "Beispiel gewechselt: {who}. Zähler {n}, der Griff steht auf null.",
    publicText: "Das steht schon öffentlich",
  },
  verdict: {
    heading: "Die Ampel",
    words: { red: "ROT", amber: "AMBER", green: "GRÜN", open: "OFFEN" },
    reasons: {
      secret: "Ein Schlüssel ist ein Geheimnis. Raus damit, und tausche ihn, falls er schon irgendwo stand.",
      customerOnPersonal: "Kundendaten auf einem Privatkonto.",
      personalClean:
        "Nicht in den Unterlagen: Der Text ist sauber, aber ein Privatkonto hat keinen Firmenvertrag.",
      companyRaw:
        "Firmenkonto, aber Namen und Nummern gehören raus, dann prüft eine Person. Eine Checkliste, keine Erlaubnis.",
      companyClean:
        "Bereinigter Entwurf im Firmenkonto. Offen bleiben: Vertrag prüfen, eine Person liest gegen.",
      publicText: "Öffentlicher Text. Jedes Werkzeug.",
    },
    chip: {
      secret: "Schlüssel im Text",
      customerOnPersonal: "Kundendaten auf Privatkonto",
      personalClean: "Sauber, aber kein Firmenvertrag",
      companyRaw: "Firmenkonto, erst Namen raus",
      companyClean: "Sauberer Entwurf, Vertrag prüfen",
      publicText: "Öffentlicher Text",
    },
    todos: {
      namesOut: "Namen und Nummern raus.",
      contract: "Vertrag prüfen.",
      personReads: "Eine Person liest gegen.",
      changeKey: "Schlüssel tauschen.",
      companyNames: "Firmennamen siehst du besser als ich. Tippe sie an.",
    },
    enterprise: "Enterprise macht Rot nicht grün.",
    enterpriseInfo: "Enterprise ergänzt Audit-Logs, Compliance-API, SCIM und einen Lösch-Timer (mindestens 30 Tage).",
    source: "Quelle:",
    asOf: "Stand 18. Okt 2026",
    slide: "Folie",
    mission: "Mission",
    fact: "Fakt",
    notLegal: "Keine Rechtsberatung.",
    open: "Deine Aussage, nicht meine Prüfung.",
  },
  take: {
    heading: "Mitnehmen",
    promptTitle: "1 Dein Prompt",
    promptCopy: "Prompt kopieren",
    promptNote: "Der Prompt geht nirgendwohin, bis du ihn selbst einfügst.",
    byHand:
      "Von Hand findest du Name und E-Mail. Das Werkzeug findet auch die Adresse in der Signatur, den Schlüssel im Code und die IBAN in der Rechnungsliste.",
    task: "Aufgabe",
    taskPlaceholder: "Was soll Claude tun? z. B. Fasse den Text in drei Sätzen zusammen.",
    rules:
      "Lass die Platzhalter in eckigen Klammern exakt so stehen. Erfinde keine Angaben, Daten oder Beträge. Beende mit einer Frage, die ich vor dem Senden prüfen sollte.",
    fallbackTask: "Bearbeite den Text unten.",
    replayTitle: "2 Antwort einsetzen",
    replayLabel: "Kopiere Claudes Antwort hierher",
    replayOut: "Deine Antwort, mit echten Angaben",
    replayHint: "Die echten Angaben werden hier auf deinem Gerät wieder eingesetzt.",
    replaySample: "Beispielantwort einsetzen",
    answerOwn: "Danke für die Nachricht. Wir melden uns zu {tokens}. Noch offen: [TERMIN].",
    answerOwnEmpty: "Danke für die Nachricht. Noch offen: [TERMIN].",
    replayCopy: "Antwort kopieren",
    replayCopyNote: "Für dein Mailprogramm, nicht für den Chat.",
    restored: "wieder eingesetzt",
    notFound: "Nicht gefunden",
    unknown: "Unbekannte Platzhalter",
    ambiguous: "Mehrdeutig",
    keyTitle: "Schlüssel. Nur auf diesem Gerät, nicht in den Chat.",
    keyEmpty: "Nichts ersetzt, kein Schlüssel.",
    noteTitle: "3 Vermerk",
    noteCopy: "Vermerk kopieren",
    copied: "Kopiert",
    selected: "Text markiert, kopiere mit Strg+C",
    note: {
      line: "Schleuse, {date}. Konto: {account}. Ersetzt: {replaced}. Rest-Scan: {rest} Muster. Mustererkennung ist kein Beweis, gegengelesen von: ______.",
      nothing: "nichts",
      account: { personal: "Privatkonto", team: "Firmenkonto (Team)", enterprise: "Firmenkonto (Enterprise)" },
      nouns: {
        person: ["Name", "Namen"],
        order: ["Bestellnummer", "Bestellnummern"],
        ref: ["Nummer", "Nummern"],
        address: ["Adresse", "Adressen"],
        email: ["E-Mail", "E-Mails"],
        phone: ["Telefonnummer", "Telefonnummern"],
        iban: ["IBAN", "IBANs"],
        amount: ["Betrag", "Beträge"],
        secret: ["Schlüssel", "Schlüssel"],
        manual: ["Angabe von Hand", "Angaben von Hand"],
      },
      dateFormat: "dmy",
      datePending: "TT.MM.JJJJ",
    },
  },
  sources: {
    heading: "Quellen und Grenzen",
    intro:
      "Das ist eine Übung für die Regel aus dem Workshop, kein Schutz vor Fehlern. Du bleibst verantwortlich.",
    rules: "Die Regel",
    facts: "Die Fakten dahinter",
    factWord: "Fakt",
  },
} as const satisfies DemoPack;

const EN = {
  locale: "en",
  samples: SAMPLES.en,
  labels: {
    person: "CUSTOMER", order: "ORDER", ref: "NUMBER", address: "ADDRESS", email: "EMAIL",
    phone: "PHONE", iban: "IBAN", amount: "AMOUNT", secret: "KEY", manual: "ITEM",
  },
  stage: {
    counterMany: "go along",
    counterOne: "goes along",
    counterNone: "Nothing goes along",
    counterCheck: "patterns left",
    handle: "Black out",
    line: "Send",
    caption: "From here it is out.",
    example: "Example: {who}",
    cardLabel: "Your text with {n} marked details",
    valueText: "{done} of {total} blacked out",
    settledLive: "Done. Rest scan: {n} patterns.",
    settledNames: "Done. Rest scan: {n} patterns. The tool cannot see names without a title: tap them.",
    restScan: "Rest scan: {n} patterns.",
    limits:
      "Patterns, not proof. Not visible: names without a title, company names, context. Tap a word to black it out.",
    nameHint: "Names without a title? Tap them.",
    nameHintOwn: "Names without a title: tap them. The tool cannot see them.",
    companyHint: "Company name in the text ({n}x, with GmbH, AG or similar): it goes along. Tap it if it should go.",
    unlock: "Next: your own text",
    lock: "Lock",
    lockOpen: "open",
    lockClosed: "closed",
    wordHint: "Tap a word to black it out",
    undo: "Undo",
    hitReplaced: "{kind}: {value}, will be replaced by {token}. Tap to keep.",
    hitKept: "{kind}: {value}, stays. Tap to replace.",
  },
  send: {
    button: "Send (practice)",
    note: "A practice run. Nothing is sent.",
    reset: "Reset",
    strip: "Chat · stored in the US (Anthropic, as of 15 Jun 2026)",
    latch: "You cannot pull it back. From your history: at once. From the back end: within 30 days.",
    latchEmpty: "Sent is sent. This time only placeholders went along.",
    stripEmpty: "Only placeholders are out. The key stays here.",
    more: "+{n} more",
    sentLive: "Practice sent: {n} details in the chat.",
  },
  own: {
    heading: "Your text",
    badge: "stays here",
    samples: "Example",
    paste: "Paste my text",
    pasteReady: "Pasted from the clipboard. It stays on this device.",
    pasteDenied: "Your browser does not allow paste by button. Long-press in the field, then Paste.",
    pasteEmpty: "The clipboard is empty.",
    updated: "Your text is in and the handle is back at zero. {n} patterns found.",
    textarea: "Paste text here (long-press, then Paste)",
    trainer: "In the room, never paste real customer data.",
    offline: "Try it in airplane mode.",
    net: "Network since you pasted: {n}",
    netPaths: "Requests: {paths}",
    account: "Account",
    accounts: { personal: "Personal", team: "Company: Team", enterprise: "Company: Enterprise" },
    accountsShort: { personal: "Personal", team: "Team", enterprise: "Enterprise" },
    switched: "Example changed: {who}. Counter {n}, the handle is back at zero.",
    publicText: "This is already public",
  },
  verdict: {
    heading: "Traffic light",
    words: { red: "RED", amber: "AMBER", green: "GREEN", open: "OPEN" },
    reasons: {
      secret: "A key is a secret. Take it out, and change it if it was ever pasted anywhere.",
      customerOnPersonal: "Customer data on a personal account.",
      personalClean: "Not in the material: the text is clean, but a personal plan has no company contract.",
      companyRaw:
        "Company account, but names and numbers come out first, then a person checks. A to-do list, not a permission.",
      companyClean:
        "Cleaned draft on a company account. Still open: check the contract, a person reads it back.",
      publicText: "Public text. Any tool.",
    },
    chip: {
      secret: "Key in the text",
      customerOnPersonal: "Customer data, personal account",
      personalClean: "Clean, but no company contract",
      companyRaw: "Company tool, names out first",
      companyClean: "Clean draft, check contract",
      publicText: "Public text",
    },
    todos: {
      namesOut: "Names and numbers out.",
      contract: "Check the contract.",
      personReads: "A person reads it back.",
      changeKey: "Change the key.",
      companyNames: "You see company names better than I do. Tap them.",
    },
    enterprise: "Enterprise does not turn red into green.",
    enterpriseInfo: "Enterprise adds audit logs, a Compliance API, SCIM and a delete timer (minimum 30 days).",
    source: "Source:",
    asOf: "as of 18 Oct 2026",
    slide: "slide",
    mission: "mission",
    fact: "fact",
    notLegal: "Not legal advice.",
    open: "Your statement, not my check.",
  },
  take: {
    heading: "Take away",
    promptTitle: "1 Your prompt",
    promptCopy: "Copy prompt",
    promptNote: "The prompt goes nowhere until you paste it yourself.",
    byHand:
      "By hand you find the name and the e-mail. The tool also finds the address in the signature, the key in the code and the IBAN in the invoice list.",
    task: "Task",
    taskPlaceholder: "What should Claude do? e.g. Summarise the text in three sentences.",
    rules:
      "Keep the placeholders in square brackets exactly as they are. Do not invent details, dates or amounts. End with one question I should check before I send it.",
    fallbackTask: "Work on the text below.",
    replayTitle: "2 Put the answer back",
    replayLabel: "Paste Claude's answer here",
    replayOut: "Your answer, with the real details",
    replayHint: "The real details are put back here, on your device.",
    replaySample: "Insert sample answer",
    answerOwn: "Thanks for your message. We will get back to you about {tokens}. Still open: [DATE].",
    answerOwnEmpty: "Thanks for your message. Still open: [DATE].",
    replayCopy: "Copy answer",
    replayCopyNote: "For your mail tool, not for the chat.",
    restored: "put back",
    notFound: "Not found",
    unknown: "Unknown placeholders",
    ambiguous: "Ambiguous",
    keyTitle: "Key. Only on this device, not in the chat.",
    keyEmpty: "Nothing replaced, no key.",
    noteTitle: "3 Record",
    noteCopy: "Copy record",
    copied: "Copied",
    selected: "Text selected, copy with Ctrl+C",
    note: {
      line: "Airlock, {date}. Account: {account}. Replaced: {replaced}. Rest scan: {rest} patterns. Pattern matching is not proof, read back by: ______.",
      nothing: "nothing",
      account: { personal: "personal", team: "company (Team)", enterprise: "company (Enterprise)" },
      nouns: {
        person: ["name", "names"],
        order: ["order number", "order numbers"],
        ref: ["number", "numbers"],
        address: ["address", "addresses"],
        email: ["e-mail", "e-mails"],
        phone: ["phone number", "phone numbers"],
        iban: ["IBAN", "IBANs"],
        amount: ["amount", "amounts"],
        secret: ["key", "keys"],
        manual: ["item by hand", "items by hand"],
      },
      dateFormat: "iso",
      datePending: "YYYY-MM-DD",
    },
  },
  sources: {
    heading: "Sources and limits",
    intro: "This practises the workshop's rule. It is not protection against mistakes. You stay responsible.",
    rules: "The rule",
    facts: "The facts behind it",
    factWord: "Fact",
  },
} as const satisfies DemoPack;

export const COPY = { de: DE, en: EN } as const satisfies Record<Locale, DemoPack>;
