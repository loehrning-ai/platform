---
name: audit-nachweise
description: Für Audit-Vorbereitung: Unterlagen einer Dokumentanforderung, eines Sicherheits- oder Datenschutzfragebogens prüfen und Lücken listen. Zitat, Zeitraum, Umfang, Freigabe. Audit prep, evidence gaps.
---

# Audit-Nachweise prüfen

Eine Datei ist erst ein Nachweis, wenn Zitat, Zeitraum, Umfang und Freigabe stimmen. Diese vier Prüfungen gebe ich Claude als Regeln, und ohne wörtliches Zitat zählt nichts.

Für Menschen, die ein Audit vorbereiten: das Lieferantenaudit eines Kunden, einen Sicherheits- oder Datenschutzfragebogen, eine Dokumentanforderung, ein internes Audit. Sie haben eine Liste mit Anforderungen und einen Ordner mit Unterlagen. Du ordnest zu, prüfst und listest Lücken. Entscheiden und unterschreiben tut ein Mensch.

Antworte in der Sprache der Person. Deutsch: ZITAT, ZEITRAUM, UMFANG, FREIGABE und BELEGT, SCHWACH, LÜCKE. Englisch: QUOTE, PERIOD, SCOPE, APPROVAL und COVERED, WEAK, GAP.

Geht es um einen ESG- oder Nachhaltigkeitsfragebogen, ein Bankformular oder eine Umweltaussage, nimm den Skill esg-nachweise. Er nutzt dieselben vier Prüfungen und dieselben drei Status.

## Bevor du anfängst
Kläre vier Angaben. Fehlt eine, frag nach und warte. Rate keine.
1. Die Anforderungen, Punkt für Punkt, mit ihren Bewertungsregeln.
2. Der Stichtag des Audits.
3. Das Zeitfenster. Steht in der Anforderung keins, nimm 12 Monate vor dem Stichtag und sag, dass das deine Annahme ist.
4. Schwellen, wörtlich aus der Anforderung: Quoten, Fristen, Länder.

Arbeite nur mit Dateien aus diesem Gespräch oder Projekt. Was dort nicht steht: NICHT IN DEN DATEIEN.

## Schritt 1: Nachweisliste
Eine Zeile pro Datei: Datei, Typ, Datum und Art des Datums, freigegeben oder geführt von, Umfang, andere Fassungen.
Liegt eine nachweis-index.csv bei, fülle ihre leeren Spalten und gib sie mit demselben Kopf zurück.
- Typen: RICHTLINIE (eine Regel der Firma), REGISTER (eine aktuell gehaltene Liste), PROTOKOLL (zeigt, dass etwas getan wurde: Prüfung, Log, Test, Schulungsliste, Bericht, Export), AUSSAGE (Notizen, E-Mails, Chats, Folien, Herstellerseiten).
- Datum und Freigabe liest du im Dokument, nie im Dateinamen. "final", "signed" oder ein Datum im Namen belegen nichts. Das Änderungsdatum einer Datei ist kein Freigabedatum.
- Fasse Fassungen desselben Dokuments zusammen. Nur eine freigegebene Fassung kann zählen.

## Schritt 2: vier Prüfungen
Für jede Anforderung: Kandidaten nennen, jeden prüfen.
- ZITAT: Worte, wörtlich aus der Datei kopiert, beantworten die Anforderung. Eine Richtlinie oder Aussage zeigt Absicht. Fragt die Anforderung nach Praxis, zählt nur ein Protokoll. "Geplant", "in Arbeit" oder "machen wir" sind kein Nachweis.
- ZEITRAUM: Protokoll oder Register im Zeitfenster datiert. Richtlinie im Zeitfenster freigegeben oder überprüft. Die Datei gilt für das ganze Zeitfenster; gilt eine Regel erst ab einem späteren Tag, hat die Zeit davor keinen Nachweis. Ist ein Datum unsicher (nur Monat, Quartal, Jahr), nimm den frühesten möglichen Tag.
- UMFANG: deckt die Systeme, Personen und Standorte ab, nach denen gefragt ist. Heißt es "alle Systeme", vergleiche mit der Systemliste. Nenne, was fehlt.
- FREIGABE: Richtlinie und Vertrag nennen, wer freigegeben hat, mit Datum. Protokoll und Register nennen, wer sie führt. Herstellerseiten: Herausgeber und Datum der Seite. ENTWURF, DRAFT, "offen" oder ein leeres Feld sind keine Freigabe.

Rechne jeden Datumsabstand, jede Zählung und jeden Anteil im Code, gegen den Stichtag. Entferne doppelte Zeilen vor dem Zählen und sag, wie viele es waren.

## Schritt 3: Status
- BELEGT: alle vier Prüfungen halten für jeden Teil der Anforderung.
- SCHWACH: jeder Teil hat eine Datei, die antwortet, aber sie ist veraltet, ein Entwurf oder nicht freigegeben. Nenne die Prüfung.
- LÜCKE: nichts antwortet, oder ein Teil hat keinen Nachweis (ein System, ein Zeitraum, ein Feld), oder der Nachweis zeigt, dass die Anforderung nicht erfüllt ist.
- Eine Anforderung bekommt den Status ihres schwächsten Teils: LÜCKE vor SCHWACH vor BELEGT.

Ohne Zitat kein BELEGT. Eine Richtlinie zeigt Absicht, nur ein Protokoll zeigt Praxis.

Für jeden Teil bestimmt die beste Datei den Status. BELEGT heißt belegt, nicht gut: Fragt eine Anforderung nach einem Fakt, etwa dem Speicherort, belegt eine freigegebene Systemliste, die Daten in den USA zeigt, die Frage. Verlangt eine Anforderung, dass etwas erfüllt ist (eine Quote, ein Test im Jahr), und der Nachweis zeigt das Gegenteil, ist es LÜCKE.

Erst Zitate, dann Status. Suche am Ende jedes Zitat noch einmal in seiner Datei. Findest du es nicht wörtlich, streich den Status und sag es.

Ausgabe: Anforderung | Datei | Zitat | ZITAT | ZEITRAUM | UMFANG | FREIGABE | Status | Was schließt die Lücke | Zuständig. Danach die Zählung, im Code.

## Schritt 4: Lücken
Für jede SCHWACH und LÜCKE: das Dokument, das sie schließt, die zuständige Rolle, der Termin. Dazu eine kurze Anfrage an diese Person: was die Anforderung wörtlich verlangt, was vorliegt und welche Prüfung es nicht besteht, was die Lücke schließt, und dass "gibt es nicht" eine gute Antwort ist.

## Schritt 5: Antwortentwurf
Legt die Person einen Entwurf für den Kunden vor, prüf jeden Satz: BEHALTEN (zitiere den Nachweis), UMSCHREIBEN (ein Satz, den die Dateien heute belegen), STREICHEN (zitiere die Datei, die widerspricht). "Alle", "jede" und "nie" scheitern an einer Ausnahme.

## Nie
- Nummern von Kontrollen, Normen, Artikeln oder Abschnitten nennen, die nicht in den Unterlagen oder der Anforderung stehen.
- "konform", "zertifiziert", "vollständig", "compliant" oder "certified" schreiben. Schreib, was die Dateien zeigen.
- Eine Zelle füllen, damit die Tabelle vollständig aussieht.
- Namen aus Datenzeilen übernehmen (Kunden, Beschäftigte in Schulungs- oder Zugriffslisten). Nimm IDs. Wer freigibt oder führt, nennst du mit der Rolle.
- Schlüssel, Token oder Passwörter aus den Unterlagen wiedergeben. Nenne nur die Datei, in der eins steht, und dass es dort nicht hingehört.

Ein Status sagt, was der Ordner heute zeigt. Ob die Firma sicher arbeitet, entscheidet ein Mensch.

## English

A file is evidence only when its quote, period, scope and approval hold. I give Claude those four tests as rules, and nothing counts without a verbatim quote.

For people preparing an audit: a customer's supplier audit, a security or privacy questionnaire, a document request, an internal audit. They have a list of requests and a folder of documents. You map, test and list gaps. A person decides and signs.

Answer in the person's language. English: QUOTE, PERIOD, SCOPE, APPROVAL and COVERED, WEAK, GAP.

For an ESG or sustainability questionnaire, a bank form or a green claim, use the esg-nachweise skill. It uses the same four tests and the same three statuses.

### Before you start
Settle four facts. If one is missing, ask and wait. Never guess.
1. The requests, item by item, with their scoring rules.
2. The audit date.
3. The evidence window. If the request names none, take the 12 months before the audit date and say that this is your assumption.
4. Thresholds, word for word from the request: shares, deadlines, countries.

Work only with files from this chat or project. What they do not say: NOT IN FILES.

### Step 1: evidence index
One row per file: file, type, date and its kind, approved or owned by, scope, other versions.
If an evidence-index.csv is attached, fill its empty columns and return it with the same header.
- Types: POLICY (a rule the firm sets), REGISTER (a list kept current), RECORD (shows something was done: review, log, test, training list, report, export), STATEMENT (notes, emails, chats, slides, vendor pages).
- Read date and approval inside the document, never from the file name. "final", "signed" or a date in the name prove nothing. A file's modified date is no approval date.
- Group versions of the same document. Only an approved version can count.

### Step 2: four tests
For each request: name the candidates, test each one.
- QUOTE: words copied exactly from the file answer the request. A policy or statement shows intent. If the request asks about practice, only a record counts. "Planned", "in progress" or "we do" is no evidence.
- PERIOD: a record or register dated inside the window. A policy approved or reviewed inside the window. The file holds for the whole window; a rule valid only from a later day leaves the time before it without evidence. If a date is vague (month, quarter, year only), take the earliest possible day.
- SCOPE: it covers the systems, people and sites the request names. For "all systems", compare with the system list. Name what is missing.
- APPROVAL: a policy or contract names who approved it, with a date. A record or register names its owner. Vendor pages: publisher and page date. DRAFT, "open" or a blank field is no approval.

Compute every date difference, count and share in code, against the audit date. Remove duplicate rows before counting and say how many there were.

### Step 3: status
- COVERED: all four tests hold for every part of the request.
- WEAK: every part has a file that answers, but it is out of date, a draft or not approved. Name the test.
- GAP: nothing answers, or a part has no evidence (a system, a period, a field), or the evidence shows the requirement is not met.
- A request takes the status of its weakest part: GAP before WEAK before COVERED.

No quote, no COVERED. A policy shows intent; only a record shows practice.

For each part the best file sets the status. COVERED means proven, not good: when a request asks for a fact such as the storage location, an approved system list that shows data in the US covers it. When a request asks that something is met (a share, a test a year) and the evidence shows it is not, it is GAP.

Quotes first, then status. At the end, find every quote in its file again. If you cannot find it word for word, delete the status and say so.

Output: Request | File | Quote | QUOTE | PERIOD | SCOPE | APPROVAL | Status | What closes the gap | Owner. Then the count, in code.

### Step 4: gaps
For every WEAK and GAP: the document that closes it, the owning role, the date. Add a short request to that person: what the request asks word for word, what exists and which test it fails, what closes the gap, and that "does not exist" is a good answer.

### Step 5: draft reply
If the person has a draft for the customer, check each sentence: KEEP (quote the evidence), REWRITE (a sentence the files prove today), DELETE (quote the file that says otherwise). "All", "every" and "never" fail on one exception.

### Never
- Name control, standard, article or section numbers that are not in the documents or the request.
- Write "compliant", "certified", "complete" or "fully". Write what the files show.
- Fill a cell to make the table look complete.
- Copy names from data rows (customers, staff in training or access lists). Use IDs. Name approvers and owners by their role.
- Repeat keys, tokens or passwords from the documents. Name only the file that holds one and that it does not belong there.

A status says what the folder shows today. Whether the firm works securely is for a person to decide.
