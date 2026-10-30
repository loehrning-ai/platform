/** Repo-owned release corrections. Recorded input files and prompt text stay unchanged; the guide clarifies the supplier rule. */
const GUIDE = {
  de: {
    marker: "## Mit Codex oder Claude Code",
    context: "Warum dieser Fall: Die drei Anfragen folgen zwei echten Regeln und einer echten Kreditlinie. Seit dem 27.09.2026\nverbietet deutsches Recht produktbezogene Aussagen wie „klimaneutral“, die auf Kompensation beruhen\n(Richtlinie (EU) 2024/825, in Deutschland über das UWG). Seit dem 01.01.2026 verlangt Vinmonopolet\nvon Lieferanten für Stillwein unter 250 NOK Flaschen von höchstens 420 g je 0,75 l. Im Dezember 2025\ngab die EBRD der Sparkasse Bank Skopje einen Kredit über bis zu 8 Mio. Euro für grüne KMU-Kredite.\nWeingut, Importeur und Bank des Übungsfalls sind erfunden.",
    time: "- Etwa 90 Minuten zu Hause. Im Workshop bedient Tim seinen Claude live; der Raum schätzt, rechnet und prüft die Quellen. Du brauchst dafür keinen eigenen Claude. Nach jedem Schritt kannst du aufhören.",
    extra: `## Mit Codex oder Claude Code
Diese Anleitung ist eine Alternative für zu Hause. Die aufgezeichneten Antworten stammen aus Claude Code; ein Codex-Lauf wurde nicht gemessen.

1. Kit entpacken. Einen neuen Arbeitsordner anlegen. Nur \`ordner/\`, \`anfragen/\` und \`projektanweisungen.md\` hineinkopieren. \`loesungen/\` und \`nachreichung/\` bleiben außerhalb dieses Arbeitsordners.
2. Diesen Arbeitsordner als lokales Projekt öffnen. Im Terminal: in den Arbeitsordner wechseln und \`codex\` oder \`claude\` starten. Ein vorhandener Zugang zum jeweiligen Werkzeug ist nötig.
3. Jede neue Unterhaltung mit diesem Auftrag beginnen:
\`Lies projektanweisungen.md und halte dich daran. Als Nachweise gelten nur die 13 Dateien in ordner/. Nutze kein Internet. Verändere keine Eingabedatei. Schreibe Ergebnisse ausschließlich in ergebnisse/. Stoppe nach dem verlangten Schritt.\`
4. Die Prompts 1 bis 4 aus dieser Datei einzeln senden, jeweils in einer neuen Unterhaltung mit dem Auftrag aus Punkt 3. Statt „angehängt“ den Pfad der jeweiligen Datei aus \`anfragen/\` nennen; in Schritt 4 alle drei. Datei- und Zeilenangaben selbst prüfen. Erst dann die Lösung außerhalb des Arbeitsordners öffnen.
5. Für Schritt 5 erst jetzt die Septemberrechnung aus \`nachreichung/\` in den Arbeitsordner kopieren. Im Chat von Schritt 4 ausdrücklich senden: \`Für Schritt 5 zählt zusätzlich rechnung-EL-25-09.png als erlaubter Nachweis. Lies das Bild.\` Dann den Bildpfad und Prompt 5 senden. Kann das Werkzeug das Bild nicht lesen oder keine Excel-Datei schreiben, diese Grenze benennen und den Schritt in Claude mit Dateierstellung ausführen. Die Demo zeigt den aufgezeichneten Verlauf.

Unterschiedliche Modelle können anders einstufen. Vergleiche Begründung, Datei, Zeile und Rechnung; erzwinge keine Musterantwort. Das Übungsdatum bleibt 16.10.2026. Nur bei eigenen Fällen den Stichtag ändern.

Überarbeitet am 29.10.2026: B1 und die VSME-Summe im Lösungsschlüssel korrigiert, die Lieferantenregel von Vinmonopolet in dieser Anleitung präzisiert und den lokalen Ablauf ergänzt. Die Demo zeigt die ursprünglichen Claude-Code-Läufe vom 26.10.2026; ihre Eingabedateien und Prompts bleiben unverändert.
`,
  },
  en: {
    marker: "## With Codex or Claude Code",
    context: "Why this case: the three requests follow two real rules and one real credit line. Since 27.09.2026\nGerman law bans product claims such as “climate neutral” that rest on offsetting\n(Directive (EU) 2024/825, in Germany through the UWG). Since 01.01.2026 Vinmonopolet\nrequires suppliers of still wine under NOK 250 to use bottles of at most 420 g per 0.75 l. In December 2025\nthe EBRD provided a loan of up to EUR 8 million to Sparkasse Bank Skopje for green SME loans.\nThe winery, importer and bank in the exercise are invented.",
    time: "- About 90 minutes at home. In the workshop Tim operates his Claude live; the room predicts, calculates and checks the sources. You do not need your own Claude for the session. You can stop after any step.",
    extra: `## With Codex or Claude Code
This is an alternative route for home practice. The recorded answers came from Claude Code; a Codex run was not measured.

1. Unzip the kit. Create a new working folder. Copy only \`files/\`, \`requests/\` and \`project-instructions.md\` into it. Keep \`answers/\` and \`late-document/\` outside this working folder.
2. Open that working folder as a local project. In a terminal, change into the working folder and start \`codex\` or \`claude\`. You need an existing account for the tool you use.
3. Begin each new conversation with this instruction:
\`Read project-instructions.md and follow it. Only the 13 files in files/ count as evidence. Do not use the internet. Do not change any input file. Write outputs only into outputs/. Stop after the requested step.\`
4. Send prompts 1 to 4 from this file one at a time, each in a new conversation with the instruction in item 3. Replace “attached” with the path of the relevant file from \`requests/\`; use all three in step 4. Check file and line citations yourself. Only then open the answers outside the working folder.
5. For step 5, only now copy the September invoice from \`late-document/\` into the working folder. In the conversation from step 4, explicitly send: \`For step 5, invoice-EL-25-09.png is now also allowed as evidence. Read the image.\` Then send the image path and prompt 5. If the tool cannot read the image or write an Excel file, name that limit and run the step in Claude with file creation. The demo shows the recorded sequence.

Different models may classify differently. Compare the reason, file, line and calculation; do not force a sample answer. The exercise date stays 16.10.2026. Change the reference date only for your own cases.

Revised on 29.10.2026: corrected B1 and the VSME tally in the answer key, clarified Vinmonopolet's supplier rule in this guide and added the local workflow. The demo shows the original Claude Code runs from 26.10.2026; their input files and prompts stay unchanged.
`,
  },
};

/** Idempotent so source builds and refreshes of the published archives use exactly one guide. */
export function prepareStartGuide(locale, source) {
  const g = GUIDE[locale];
  let text = source.split(`\n${g.marker}`)[0].trimEnd();
  text = text.replace(/(?:Warum dieser Fall:|Why this case:)[\s\S]*?(?=\n\n\|)/, g.context);
  text = text.replace(/^- (?:Etwa 90 Minuten|About 90 minutes)[^\n]*/m, g.time);
  text = text.replace("| `mitnehmen/` | Skill, Vorlagen und Checkliste für deine eigene Firma |", "| `mitnehmen/` | Vorlagen und Checkliste für deine eigene Firma |");
  text = text.replace("| `take-home/` | skill, templates and checklist for your own company |", "| `take-home/` | templates and checklist for your own company |");
  text = text.replace(/(?:The files contain 8 defects\. One file looks odd and is fine\.|Die Dateien enthalten 8 Mängel\. Eine Datei sieht auffällig aus und ist sauber\.)/,
    locale === "de" ? "Prüfe 8 Punkte: Datenfehler, Beleglücken und Geschäftsprobleme. Eine auffällige Datei ist vollständig." : "Check 8 issues: data errors, evidence gaps and business problems. One unusual file is complete.");
  if (locale === "en") text = text.replaceAll("esg-nachweise", "esg-evidence").replace("one skill for German and English", "the fully English skill for this kit");
  else text = text.replace("ein Skill für Deutsch und Englisch", "der deutschsprachige Skill für dieses Kit");
  text = text.replace("Prüfe 8 Punkte:", "Prüfe 8 Prüfpunkte:");
  const role = locale === "de"
    ? "Rolle: Wir sind das Büro des Weinguts. Der Importeur schickt 8 Fragen, unser Marketing bittet um Prüfung von 7 Werbeentwürfen, die Bank braucht 6 Kreditfelder. Das sind 21 Prüfpunkte. Unsere Dateien liefern die Fakten, der Skill liefert die Prüfmethode. Wir prüfen die vorhandenen Dateien zuerst selbst und dann mit Claude; eine belegte schlechte Nachricht ist kein Datenfehler."
    : "Role: we are the winery's office. The importer sends 8 questions, our marketing team asks us to check 7 draft claims, and the bank needs 6 loan fields. That is 21 items to check. Our files supply the facts; the skill supplies the checking method. We review the existing files ourselves, then with Claude; a proven bad result is not a data error.";
  text = text.replace(/\nRole: we are the winery's office\.[^\n]*\n|\nRolle: Wir sind das Büro des Weinguts\.[^\n]*\n/g, "\n");
  text = text.replace(/(## (?:Der Fall|The case))\n+/, `$1\n${role}\n\n`);
  text = text.replace("The files contain 8 defects. One file looks odd and is fine.", "Find 8 issues affecting our answers: data errors, evidence gaps and business problems. One unusual file is complete.");
  text = text.replace("In den Dateien stecken 8 Mängel. Eine Datei sieht auffällig aus und ist in Ordnung.", "Prüfe 8 Punkte: Datenfehler, Beleglücken und Geschäftsprobleme. Eine auffällige Datei ist vollständig.");
  text = text.replace("Schreib zu jedem Mangel: Datei, Zeile, was nicht stimmt, und welche Prüfung scheitert", "Schreib zu jedem Prüfpunkt: Datei, Zeile, welche Antwort betroffen ist, und welche Prüfung scheitert");
  text = text.replace("For each defect, write: file, line, what is wrong, and which check fails", "For each issue, write: file, line, which answer is affected, and which check fails");
  text = text.replace("Schreib die saubere Datei dazu.", "Schreib die vollständige Datei dazu.").replace("Write down the clean file too.", "Write down the complete file too.");
  // Keep the shared legacy-layout instructions; name the Desktop labels verified on 30 Oct.
  const desktop = locale === "de"
    ? "Desktop-Layout, geprüft am 30.10.2026: Settings → Capabilities → Run code in the cloud muss eingeschaltet sein. Customize → Skills → Add skill → Upload skill, ZIP wählen, Upload; der Skill muss eingeschaltet sein. Im Projekt: Instructions → Edit, den Inhalt der Projektanweisungen einfügen und Save instructions. Context → Add → Upload from device → Files lädt nur die 13 Nachweisdateien. Anfragen im Chat über + → Upload or add files → Upload from computer anhängen. Haiku wählen. Falls CSV-Dateien als nicht lesbar gemeldet werden: stoppen; keine Werte aus Entwürfen übernehmen. Dieser Desktop-Test zeigte CSV-Zugriffsfehler; der Ablauf ist noch nicht zuverlässig bestätigt."
    : "Desktop layout, checked on 30.10.2026: Settings → Capabilities → Run code in the cloud must be on. Customize → Skills → Add skill → Upload skill, choose the ZIP, then Upload; the skill must be on. In the project: Instructions → Edit, paste the contents of the project instructions, then Save instructions. Context → Add → Upload from device → Files adds only the 13 evidence files. Attach requests in the chat through + → Upload or add files → Upload from computer. Select Haiku. If CSV files are reported unreadable, stop; do not substitute draft figures. This Desktop test exposed CSV access failures; reliable completion is not yet established.";
  const heading = locale === "de" ? "## Claude einrichten" : "## Set up Claude";
  text = text.replace(/\n+(?:Desktop-Layout, geprüft am|Desktop layout, checked on) 30\.10\.2026:[^\n]*\n+/g, "\n\n");
  text = text.replace(heading, `${heading}\n\n${desktop}`);
  return `${text}\n\n${g.extra}`;
}

/** The key must apply B1's required module and report-type fields, as the demo ledger does. */
export function prepareCaseGuide(locale, name, source) {
  if (locale === "de" && name === "loesungen/LOESUNGEN.md") {
    return source
      .replace("| B1 | BELEGT | 8 von 8 | |", "| B1 | LÜCKE | 8 von 10 | Entscheidung zu Modul und Einzel- oder Konzernbericht; keine Datei hält beides fest |")
      .replace("Summe: 5 BELEGT, 6 LÜCKE.", "Summe: 4 BELEGT, 7 LÜCKE.");
  }
  if (locale === "en" && name === "answers/ANSWERS.md") {
    return source
      .replace("| B1 | COVERED | 8 of 8 | |", "| B1 | GAP | 8 of 10 | Choice of module and standalone or consolidated report; no file records either |")
      .replace("Total: 5 COVERED, 6 GAP.", "Total: 4 COVERED, 7 GAP.");
  }
  return source;
}
