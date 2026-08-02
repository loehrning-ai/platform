# Glossar, Checklisten, Ressourcen

## 42 KI-Begriffe: Das vollständige Glossar

Alphabetisch. Jeder Begriff mit einer kurzen Definition und, wo relevant, einem Verweis auf das Kapitel, in dem er ausführlich behandelt wird.

| Begriff | Erklärung |
|---------|-----------|
| **Agent** | KI-System, das eigenständig Aktionen ausführt, nicht nur Text erzeugt. Ruft Tools auf, plant Schritte, führt sie aus. Beispiel: ein KI-Agent, der im Kalender nach einem freien Slot sucht und die Einladung verschickt. |
| **API** | Application Programming Interface, Schnittstelle, über die Software mit einem KI-Modell kommuniziert. Für dich als Nutzer meist unsichtbar; wird relevant, wenn die IT eigene Integrationen baut. |
| **AVV (Auftragsverarbeitungsvertrag)** | Vertrag nach Art. 28 DSGVO, wenn ein Anbieter personenbezogene Daten im Auftrag des Verantwortlichen verarbeitet. Rollen und Produktstufe zuerst prüfen; nicht jeder Anbieter handelt in jedem Kontext als Auftragsverarbeiter. → Kapitel 4, 7, 11 |
| **Bias** | Systematische Verzerrung in KI-Ausgaben durch unausgewogene Trainingsdaten. Führt dazu, dass Modelle Stereotype reproduzieren, etwa männliche Pronomen bei „Chefarzt". → Kapitel 9 |
| **ChatGPT** | Chat-Produkt von OpenAI, basierend auf der GPT-Modellreihe. Free-, Plus-, Team- und Enterprise-Tier mit unterschiedlichen Datenschutz-Regelungen. → Kapitel 2, 3 |
| **Chatbot** | Konversations-KI, die Nutzer-Eingaben in natürlicher Sprache beantwortet. ChatGPT, Claude, Gemini und Copilot sind alle Chatbots. |
| **Claude** | Chat-Produkt von Anthropic. Für Claude for Work und die API dokumentiert Anthropic eine Auftragsverarbeiterrolle und standardmäßig keine Nutzung kommerzieller Kundendaten zum Modelltraining; aktuelle Bedingungen, Ausnahmen, Opt-ins und Drittplattformen separat prüfen. Verbraucherprodukte haben andere Bedingungen. → Kapitel 3, 7 |
| **Confidential (Daten-Stufe)** | Dritte Stufe im 4-Stufen-Modell. Vertrauliche Daten, Preise, Verträge, Personal. Nur nach konkreter Freigabe von Produkt, Vertrag, Konfiguration, Zweck und Datenklasse verwenden. → Kapitel 4, 11 |
| **Copilot** | Microsoft 365 Copilot. KI-Assistent integriert in Word, Excel, Outlook und Teams. Arbeitet innerhalb der Microsoft-365-Dienstgrenze; Datenregion, Berechtigungen und Freigabe hängen von Tenant, Vertrag und Konfiguration ab. → Kapitel 6, 7 |
| **DPA (Data Processing Agreement)** | Englische Bezeichnung für den AVV. Gleicher Inhalt, international gängiger Begriff. Bei US-Anbietern oft als DPA referenziert. |
| **DSGVO** | Datenschutz-Grundverordnung, Verordnung (EU) 2016/679. Basisgesetz für den Umgang mit personenbezogenen Daten in der EU. Gilt für jede KI-Nutzung mit personenbezogenen Daten. |
| **Embedding** | Numerische Repräsentation eines Textes oder Bildes als Vektor. Basis für semantische Suche und RAG. |
| **Enterprise-Tier** | Kommerzielle Produktstufe, deren Vertrags- und Sicherheitsfunktionen je Anbieter variieren. DPA/AVV, Trainingsregeln, SSO, Protokolle, Aufbewahrung und Datenresidenz im aktuellen Vertrag prüfen. Auch ein Enterprise-Tarif erlaubt nicht automatisch jede Datenklasse. → Kapitel 11 |
| **EU-KI-Verordnung (AI Act)** | Verordnung (EU) 2024/1689. In Kraft seit 1. August 2024. Regelt den Einsatz von KI in der EU über einen risikobasierten Ansatz. → Kapitel 5, 11 |
| **Few-Shot-Prompt** | Prompt mit 2-3 Beispielen für das gewünschte Ergebnis. „Hier sind drei E-Mails in meinem Stil, schreib die nächste genauso." → Kapitel 8 |
| **Free-Tier** | Kostenlose Produktstufe. Vertrag, Trainingsnutzung, Aufbewahrung und Datenkontrollen ändern sich je Anbieter. Ohne dokumentierte betriebliche Freigabe keine internen, vertraulichen oder streng vertraulichen Daten verwenden. → Kapitel 4, 11 |
| **GPAI (General-Purpose AI)** | Allzweck-KI-Modell nach EU AI Act. Die GPT-, Claude-, Gemini- und Llama-Reihen sind GPAI-Modelle. Zusätzliche Transparenz-Pflichten für Anbieter. |
| **Halluzination** | Phänomen, bei dem ein KI-System plausibel klingende, aber sachlich falsche Informationen erzeugt. Entsteht durch Token-Vorhersage ohne Faktenprüfung. → Kapitel 9 |
| **Hochrisiko-KI** | KI-System nach Anhang III der EU-KI-Verordnung. Strenge Pflichten: Risikomanagement, Dokumentation, menschliche Aufsicht, Konformitätsbewertung. → Kapitel 5 |
| **Internal (Daten-Stufe)** | Zweite Stufe im 4-Stufen-Modell. Interne, aber nicht öffentlich bestimmte Daten. Nur in einem für diesen Zweck und diese Datenklasse freigegebenen Produkt verwenden. → Kapitel 4, 11 |
| **KI-Beauftragte/r** | Person im Unternehmen, die für KI-Einsatz, Compliance und Richtlinie verantwortlich ist. Keine gesetzliche Pflicht-Rolle, aber praktisch unerlässlich. → Kapitel 11, 12 |
| **KI-Kompetenz (Art. 4)** | Pflicht aus EU-KI-Verordnung Art. 4: Anbieter und Betreiber müssen die Entwicklung der KI-Kompetenz ihres Personals durch kontextgerechte Maßnahmen unterstützen; ein bestimmtes individuelles Niveau ist nicht garantiert. Gilt seit 2. Februar 2025, geändert durch Verordnung (EU) 2026/1744. → Kapitel 5, 11 |
| **Kontext-Fenster** | Maximale Menge an Text, die ein LLM in einer Anfrage verarbeitet. Gemessen in Token. Aktuelle Modelle der GPT-, Claude- und Gemini-Reihen reichen von 200.000 bis über 1 Mio. Token (mehrere hundert bis über tausend Seiten). |
| **KRAFT-Framework** | Prompt-Struktur: **K**ontext, **R**olle, **A**ufgabe, **F**ormat, **T**on. Die Reihenfolge zählt. Macht aus einer vagen Anfrage einen nutzbaren Prompt. → Kapitel 8 |
| **LLM (Large Language Model)** | Großes Sprachmodell, trainiert auf Milliarden von Textdaten. Generiert Text durch statistische Vorhersage des nächsten Tokens. Die GPT-, Claude-, Gemini- und Llama-Reihen. |
| **M365-Tenant** | Administrativer Microsoft-365-Mandant. Microsoft dokumentiert eine Dienstgrenze und mandantenbezogene Berechtigungen; Speicher- und Verarbeitungsorte sowie optionale Transfers hängen unter anderem von Tenant-Geografie, Verträgen, Add-ons und aktivierten Funktionen ab. → Kapitel 7 |
| **Maschinelles Lernen (ML)** | KI-Teilgebiet, in dem Systeme aus Daten lernen statt explizit programmiert zu werden. Drei Arten: Supervised, Unsupervised, Reinforcement Learning. |
| **Prompt** | Deine Eingabe an die KI, Anweisung, Frage, Kontext. Qualität des Prompts bestimmt Qualität des Outputs. → Kapitel 8 |
| **Prompt-Engineering** | Die Disziplin, effektive Prompts zu gestalten. Mischung aus Sprache, Testen, Iterieren. KRAFT ist ein Prompt-Engineering-Framework. → Kapitel 8 |
| **Public (Daten-Stufe)** | Erste Stufe im 4-Stufen-Modell. Öffentlich verfügbare Daten, Marketing-Texte, Webseiten, Presse. Dürfen in jedes Tool. → Kapitel 4, 11 |
| **RAG (Retrieval-Augmented Generation)** | Technik, bei der ein LLM vor der Antwortgenerierung relevante Informationen aus einer Wissensbasis abruft. Reduziert Halluzinationen. |
| **Restricted (Daten-Stufe)** | Vierte Stufe im 4-Stufen-Modell. Streng vertrauliche Daten, Zugangsdaten sowie besonders sensible Fach- oder Personendaten. Standardmäßig nicht in externe KI; Ausnahmen nur nach ausdrücklicher fachlicher, rechtlicher und technischer Freigabe. Zugangsdaten bleiben ausgeschlossen. → Kapitel 4, 11 |
| **Risikostufen (AI Act)** | Vier Stufen der EU-KI-Verordnung: minimales, begrenztes, hohes und unannehmbares Risiko. Je höher die Stufe, desto strenger die Pflichten. → Kapitel 5 |
| **Shadow AI** | Nicht genehmigte KI-Nutzung durch Mitarbeitende ohne Wissen der IT. DSGVO- und Datenleak-Risiko. → Kapitel 11 |
| **System-Prompt** | Voreingestellte Anweisung an das Modell, die über der Nutzer-Eingabe steht. Definiert Rolle und Grenzen, z. B. „Antworte immer in Sie-Form". |
| **Temperature** | Parameter eines LLM, der Kreativität vs. Determinismus steuert. 0 = immer die wahrscheinlichste Antwort, 1 = mehr Variation. Für Fakten: niedrig. Für Brainstorming: höher. |
| **Tenant** | Administrativ abgegrenzter Mandant eines Cloud-Dienstes. Die tatsächliche Isolation, Datenresidenz, Supportzugriffe und optionalen Datenflüsse ergeben sich aus Architektur, Vertrag und Konfiguration. |
| **Token** | Kleinste Verarbeitungseinheit eines LLM. Ein Wort, Wortteil oder Satzzeichen. Modelle generieren Text Token für Token. |
| **Transparency (AI Act Art. 50)** | Transparenzpflichten: Chatbots müssen erkennbar sein, synthetische Inhalte (Deepfakes) gekennzeichnet, KI-generierter Text bei öffentlichem Interesse markiert. |
| **Training** | Prozess, in dem ein ML-Modell aus Daten lernt. Ergebnis ist ein Modell mit festen Parametern (Gewichten). Nach dem Training werden keine neuen Daten gelernt, außer beim Fine-Tuning. |
| **Vector Database** | Datenbank, die Embeddings speichert und semantische Suche ermöglicht. Kernbaustein von RAG-Systemen. Beispiele: Pinecone, Weaviate, Qdrant. |
| **Zero-Shot-Prompt** | Prompt ohne Beispiele. Du beschreibst nur die Aufgabe. Gegenteil von Few-Shot-Prompt. → Kapitel 8 |

## Prompt-Bibliothek: 8 Vorlagen für deinen Arbeitsalltag

Das ganze Buch sagt dir: Bau dir eine Prompt-Bibliothek. Hier ist sie. Acht getestete Vorlagen, sortiert nach Aufgabe, nicht nach Tool. Du suchst nicht nach der Technik. Du suchst nach dem Problem, das du gerade hast.

Jede Vorlage folgt dem KRAFT-Schema aus Kapitel 8. Die angegebene **Datenstufe** ist eine konservative Orientierung, keine automatische Toolfreigabe. Maßgeblich bleiben deine Unternehmensrichtlinie sowie der konkrete Zweck, Vertrag und Datenfluss.

Kopiere. Passe an. Speichere in deinem eigenen Dokument. Nach einem Monat hast du deine persönliche Sammlung.

**1. E-Mail höflich absagen** (Profil A · Büro)

> **Prompt-Vorlage:** Rolle: Erfahrene Assistenz mit Gespür für Diplomatie. Kontext: Ich muss eine Anfrage ablehnen, will die Beziehung aber halten. Aufgabe: Formuliere eine höfliche Absage. Nenne einen Grund, ohne mich zu rechtfertigen, und biete wenn möglich eine Alternative an. Format: Maximal 120 Wörter, mit Anrede und Grußformel. Ton: Freundlich, klar, nicht unterwürfig.

> **Datenstufe:** Internal. Kein Tool ohne AVV. Anlass und Namen anonymisieren, wenn es eine externe Person betrifft.

**2. Meeting-Notizen zu To-dos** (Profil A · Büro)

> **Prompt-Vorlage:** Rolle: Protokollführer, der präzise arbeitet. Kontext: Unten stehen meine Roh-Notizen aus einem Meeting. Aufgabe: Extrahiere ausschließlich konkrete To-dos. Pro Aufgabe: Was, wer, bis wann. Wenn Verantwortlicher oder Frist fehlen, markiere mit „offen". Format: Tabelle mit drei Spalten. Ton: Sachlich, keine Interpretationen.

> **Datenstufe:** Internal in Enterprise-Tools mit AVV. Stehen Kundennamen oder echte Zahlen im Transkript, ist das Confidential: dann nur mit Freigabe, oder vorher durch „Kunde A" und Platzhalter ersetzen.

**3. Excel-Formel erklären** (Profil A · Büro)

> **Prompt-Vorlage:** Rolle: Geduldiger Excel-Trainer. Kontext: Ich verstehe eine Formel nicht und will sie nicht nur kopieren, sondern begreifen. Aufgabe: Erkläre die folgende Formel Schritt für Schritt. Was macht jeder Teil, in welcher Reihenfolge wird gerechnet, und in welchem Fall bricht sie. Format: Nummerierte Schritte, danach ein Satz „Vorsicht bei". Ton: Einfach, ohne Fachjargon.

> **Datenstufe:** Public. Eine Formel enthält keine Geschäftsgeheimnisse, nur Logik. Hier darf sogar die Free-Version ran. Aber: keine echten Zellwerte mit Umsätzen mitschicken.

**4. Kundenbeschwerde beantworten** (Profil D · Service)

> **Prompt-Vorlage:** Rolle: Erfahrener Kundenservice-Texter. Kontext: Ein Bestandskunde beschwert sich über eine verspätete Lieferung. Aufgabe: Antworte verständnisvoll. Entschuldige dich, ohne Schuld zuzuweisen, biete eine Lösung an. Format: Maximal 150 Wörter. Ton: Verständnisvoll, sachlich, nicht unterwürfig. Mache keine Zusagen zu Rabatten oder Gutschriften ohne Rücksprache mit dem Vertrieb.

> **Datenstufe:** Confidential. Kundenname, Bestellnummer und Reklamationsdetails nur in einer ausdrücklich dafür freigegebenen Konfiguration verwenden. Pseudonymisierung senkt Risiken, macht personenbezogene Daten aber nicht automatisch anonym oder intern.

**5. Reklamation deeskalieren am Telefon** (Profil D · Service)

> **Prompt-Vorlage:** Rolle: Coach für schwierige Kundengespräche. Kontext: Ein aufgebrachter Kunde ruft gleich an, Thema unten. Aufgabe: Gib mir drei Sätze für den Gesprächseinstieg, die deeskalieren, plus drei Formulierungen, die ich vermeiden soll. Format: Zwei kurze Listen, „Sag das" und „Sag das nicht". Ton: Ruhig, professionell, lösungsorientiert.

> **Datenstufe:** Internal. Beschreibe das Problem generisch („verspätete Lieferung", „falsche Rechnung"). Keine echten Namen, keine Vertragsnummern.

**6. Social-Media-Post entwerfen** (Profil B · Kreativ)

> **Prompt-Vorlage:** Rolle: Content-Creator mit Gefühl für die Plattform. Kontext: Wir wollen unser neues Produkt vorstellen, Zielgruppe und Kernbotschaft stehen unten. Aufgabe: Schreibe drei Varianten eines Posts für LinkedIn. Jede mit anderem Aufhänger: Frage, Zahl, Geschichte. Format: Pro Variante maximal 80 Wörter plus drei Hashtags. Ton: Nahbar, kein Werbe-Sprech, keine Floskeln.

> **Datenstufe:** Public. Marketing-Inhalte sind zur Veröffentlichung gedacht. Free-Version okay. Solange keine unveröffentlichten Preise oder Launch-Termine im Prompt stehen.

**7. Arbeitsanweisung verständlich umschreiben** (Profil C · Produktion)

> **Prompt-Vorlage:** Rolle: Technischer Redakteur, der für die Werkstatt schreibt. Kontext: Unten steht eine umständlich formulierte Arbeitsanweisung. Aufgabe: Schreibe sie um in klare, nummerierte Handlungsschritte, die jeder am Band sofort versteht. Markiere Sicherheitshinweise mit „Achtung". Format: Nummerierte Schritte, kurze Sätze, ein Verb pro Schritt. Ton: Direkt, knapp, eindeutig.

> **Datenstufe:** Internal. Arbeitsanweisungen sind firmenintern. Nur in Tools mit AVV. Stehen Maschinen-Seriennummern oder Lieferantennamen drin, anonymisieren.

**8. Konzept brainstormen** (alle Profile)

> **Prompt-Vorlage:** Rolle: Kreativer Sparringspartner, der auch unbequeme Ideen nennt. Kontext: Ich stehe vor einer Aufgabe und brauche erst mal Breite, nicht Tiefe. Thema unten. Aufgabe: Gib mir zehn Ansätze, von naheliegend bis ungewöhnlich. Bei jedem ein Satz: Warum könnte das funktionieren. Format: Nummerierte Liste, ein Stichwort plus ein Satz. Ton: Locker, mutig, keine Selbstzensur.

> **Datenstufe:** Internal. Brainstorming bleibt oft vage, das ist gut. Sobald echte Strategiedetails, Zahlen oder Kundennamen ins Spiel kommen: Confidential, also Enterprise-Tool mit AVV.

> **Jetzt bist du dran:** Nimm die Vorlage, die du diese Woche am dringendsten brauchst. Kopiere sie. Nutze sie einmal echt. Wenn das Ergebnis nicht passt, ändere einen einzigen Teil: meist die Rolle oder den Ton. Notiere die Version, die funktioniert hat. Das ist der erste Eintrag in deiner eigenen Bibliothek.

## Checklisten

**Vor der KI-Nutzung (jedes Mal)**
- [ ] Daten klassifiziert? (Öffentlich / Intern / Vertraulich / Streng vertraulich)
- [ ] Kundennamen, Preise, Vertrauliches entfernt?
- [ ] Tool genehmigt durch IT / Compliance?
- [ ] Kein Shadow AI?

**Nach dem KI-Output (60 Sekunden)**
- [ ] Schritt 1: Sachlich korrekt? (Zahlen, Quellen, Personen verifiziert?)
- [ ] Schritt 2: Vollständig? (Fehlende Perspektiven, Nuancen?)
- [ ] Schritt 3: Angemessen? (Ton, Diskriminierung, Bias?)

**Neues KI-Tool evaluieren**
- [ ] Welche Daten verlassen das Unternehmen?
- [ ] Rollen und Rechtsgrundlage geklärt; DPA/AVV, Datenflüsse, Transfers, Aufbewahrung und Löschung geprüft?
- [ ] IT-Freigabe eingeholt?
- [ ] Kosten vs. Zeitersparnis kalkuliert?

## Deine zwei Arbeitsblätter zum Ausfüllen

Kapitel 12 sagt, du hast am Ende fünf Dokumente. Zwei davon füllst du hier aus. Mach es jetzt, mit Bleistift, oder kopier die Tabellen in ein eigenes Dokument. Eine ausgefüllte Karte schützt dich mehr als zehn gelesene Kapitel.

### Datenklassifizierungs-Karte

Trag die Datenarten ein, mit denen du wirklich arbeitest, und ordne sie den vier Stufen aus Kapitel 3 und 4 zu. Die erste Zeile ist als Beispiel ausgefüllt. Die Spalte „KI erlaubt?" beantwortest du mit: Free / nur Enterprise mit AVV / nie.

| Datenart | Stufe (öffentlich/intern/vertraulich/streng vertraulich) | KI erlaubt? |
|----------|----------------------------------------------------------|-------------|
| Pressetexte, Website-Inhalte | öffentlich | Free okay |
| | | |
| | | |
| | | |
| | | |

Faustregel beim Ausfüllen: Im Zweifel eine Stufe höher einordnen, nicht tiefer. Eine zu vorsichtige Einordnung kostet dich nichts, eine zu lockere kostet dich den Datenschutzvorfall.

### KI-Inventar

Liste die KI-Tools, die du dienstlich nutzt oder nutzen willst, aus deiner Inventur in Kapitel 1. Die erste Zeile zeigt, wie gemeint. „Freigegeben?" heißt: hat IT oder Compliance das Tool für diese Datenklasse erlaubt?

| Tool | Zweck | Höchste Datenklasse | Freigegeben? | Verantwortliche/r |
|------|-------|---------------------|--------------|-------------------|
| Microsoft 365 Copilot | E-Mails, Excel, Protokolle | vertraulich (mit AVV) | ja | IT-Leitung |
| | | | | |
| | | | | |
| | | | | |
| | | | | |

Ein leeres Feld bei „Freigegeben?" ist ein To-do, kein Schönheitsfehler. Genau die Zeilen ohne Häkchen sind dein Shadow-AI-Risiko. Klär sie, bevor du das Tool an echten Daten benutzt.

## Weiterführende Ressourcen

**Dein Kurs:** /ki-fuehrerschein, alle 5 Blöcke und Quiz. Ein plattformeigener Abschlussnachweis ist kein behördliches Zertifikat und ersetzt keinen organisationsbezogenen Kompetenznachweis.

**Diese Buchreihe:**
- *KI im deutschen Mittelstand*, evidenzbasierte Selbstprüfung ohne private Firmendaten oder proprietäre Rankings.
- *KI-Tools für Selbstständige*, KRAFT-Methode, Workflows, Prompt-Bibliothek für Freelancer

**Rechtliches:**
- EU-KI-Verordnung: eur-lex.europa.eu/eli/reg/2024/1689/oj
- DSGVO: eur-lex.europa.eu/eli/reg/2016/679/oj
- Deutsches Recht: gesetze-im-internet.de

## Quellen und Referenzen

**Regulatorik**
- Verordnung (EU) 2024/1689 des Europäischen Parlaments und des Rates vom 13. Juni 2024 zur Festlegung harmonisierter Vorschriften für künstliche Intelligenz (KI-Verordnung). Amtsblatt der Europäischen Union L vom 12. Juli 2024.
- Verordnung (EU) 2016/679 des Europäischen Parlaments und des Rates vom 27. April 2016 (Datenschutz-Grundverordnung, DSGVO).

**Marktdaten Deutschland**
- Bitkom Research. Aktuelle Veröffentlichungen zur KI-Nutzung in der Wirtschaft vor Verwendung von Prozentwerten direkt beim Herausgeber prüfen.
- KfW Research (2025). *KfW-Mittelstandspanel 2025*. kfw.de.
- Bitkom (2025). *Der Arbeitsmarkt für IT-Fachkräfte 2025*. bitkom.org.

**Produktivität und KI**
- Brynjolfsson, E., Li, D., Raymond, L. R. (2023). *Generative AI at Work*. NBER Working Paper No. 31161. National Bureau of Economic Research.

**Halluzinations-Benchmarks**
- Vectara (laufend). *Hallucination Leaderboard*. github.com/vectara/hallucination-leaderboard. Öffentlich zugänglich, regelmäßig aktualisiert.

---

Feedback zu diesen Lernmaterialien kannst du auf dieser Plattform hinterlassen.

---
*Verfasst von [Tim Löhr](/ueber-mich).*
