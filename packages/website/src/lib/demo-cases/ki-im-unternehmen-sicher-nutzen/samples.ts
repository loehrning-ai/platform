import "server-only";

import type { Sample } from "./types";

/**
 * The three examples, one tap away. Ana, Marko and Mila are the kit's scenes
 * 1, 4 and 6 (invented). Ana's text is the kit's own complaint e-mail; the
 * IBAN is the well-known public test IBAN. Server only: the page hands the
 * client one language.
 */
export const SAMPLES = {
  de: [
    {
      id: "ana",
      account: "personal",
      chip: "Kundenmail",
      who: "Kundenmail",
      task: "Du bist Support-Mitarbeiter:in bei einem Dienstleister. Schreibe eine ruhige Antwort mit höchstens 90 Wörtern auf die E-Mail unten.",
      text: "Hallo, meine Bestellung TH-1042 ist nie angekommen. Mein Name ist Mara Beispiel, ich wohne Beispielweg 7, 99999 Musterstadt. Bitte schreiben Sie an mara.beispiel@example.com. Das ist das zweite Mal.",
      answer: "Guten Tag [KUNDE],\n\nes tut mir leid, dass Ihre Bestellung [BESTELLUNG] nicht angekommen ist. Wir senden das Paket noch einmal an [ADRESSE] und bestätigen den Versand per Mail an [E-MAIL]. Die neue Sendungsnummer lautet [SENDUNGSNUMMER].\n\nFreundliche Grüße\nIhr Support-Team",
    },
    {
      id: "marko",
      account: "personal",
      chip: "Code",
      who: "Code",
      task: "Finde den Fehler im Code unten.",
      text: '// Zahlung schlägt manchmal fehl\nconst client = new PayClient({ apiKey: "sk_live_DEMO-4711-FAKE-KEY" });\n// Kunde: Hr. Beispiel, Kundennr. KD-20417, Betrag 249,00 EUR',
      answer: "Der Schlüssel [SCHLÜSSEL] steht im Quelltext. Das ist der Fehler: Wer den Code sieht, sieht den Schlüssel. Tausche ihn und lies ihn aus einer Umgebungsvariable. Prüfe danach die Zahlung [NUMMER] über [BETRAG] für [KUNDE], sie lief über [ZAHLUNGSANBIETER].",
    },
    {
      id: "mila",
      account: "enterprise",
      chip: "Rechnungen",
      who: "Rechnungen",
      task: "Welche Rechnungen passen nicht zum Vertrag? Prüfe die Beträge.",
      text: "Rechnung 2026-117, Tannwald Haustechnik GmbH, 4.820,00 EUR, IBAN DE89 3704 0044 0532 0130 00\nRechnung 2026-118, Tannwald Haustechnik GmbH, 1.310,50 EUR, IBAN DE89 3704 0044 0532 0130 00",
      answer: "Rechnung 2026-117 über [BETRAG_1] passt zum Vertrag. Rechnung 2026-118 über [BETRAG_2] weicht ab, prüfe den Preis in [VERTRAGSNUMMER]. Beide Rechnungen nennen dieselbe Bankverbindung [IBAN].",
    },
  ],
  en: [
    {
      id: "ana",
      account: "personal",
      chip: "Customer e-mail",
      who: "Customer e-mail",
      task: "You are a support agent at a service company. Write a calm reply of at most 90 words to the e-mail below.",
      text: "Hello, my order TH-1042 never arrived. My name is Mara Beispiel, I live at Beispielweg 7, 99999 Musterstadt. Please write to mara.beispiel@example.com. This is the second time.",
      answer: "Hello [CUSTOMER],\n\nI am sorry that your order [ORDER] never arrived. We will send the parcel again to [ADDRESS] and confirm the dispatch by e-mail to [EMAIL]. The new tracking number is [TRACKING_NUMBER].\n\nKind regards\nYour support team",
    },
    {
      id: "marko",
      account: "personal",
      chip: "Code",
      who: "Code",
      task: "Find the bug in the code below.",
      text: '// Payment sometimes fails\nconst client = new PayClient({ apiKey: "sk_live_DEMO-4711-FAKE-KEY" });\n// Customer: Mr. Beispiel, customer no. KD-20417, amount EUR 249.00',
      answer: "The key [KEY] sits in the source code. That is the bug: anyone who sees the code sees the key. Replace it and read it from an environment variable. Then check payment [NUMBER] for [AMOUNT] from [CUSTOMER], it ran through [PAYMENT_PROVIDER].",
    },
    {
      id: "mila",
      account: "enterprise",
      chip: "Invoices",
      who: "Invoices",
      task: "Which invoices do not match the contract? Check the amounts.",
      text: "Invoice 2026-117, Tannwald Haustechnik GmbH, EUR 4,820.00, IBAN DE89 3704 0044 0532 0130 00\nInvoice 2026-118, Tannwald Haustechnik GmbH, EUR 1,310.50, IBAN DE89 3704 0044 0532 0130 00",
      answer: "Invoice 2026-117 for [AMOUNT_1] matches the contract. Invoice 2026-118 for [AMOUNT_2] does not, check the price in [CONTRACT_NUMBER]. Both invoices name the same bank account [IBAN].",
    },
  ],
} as const satisfies Record<"de" | "en", readonly Sample[]>;
