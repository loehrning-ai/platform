import type { Locale } from "@/lib/i18n/locale";

/** A setup guide, not a simulated Claude session. No case answers are shown. */
export function ClaudeKitSetup({ locale }: { readonly locale: Locale }) {
  const de = locale === "de";
  const start = de ? "START-HIER.md" : "START-HERE.md";
  const instructions = de ? "projektanweisungen.md" : "project-instructions.md";
  const files = de ? "ordner/" : "files/";
  const request = de ? "anfragen/1-fragebogen-nordvik.md" : "requests/1-nordvik-questionnaire.md";
  const steps = [
    {
      title: de ? "Entpacken und öffnen" : "Unzip and open",
      text: de ? `ZIP entpacken. ${start} im Texteditor öffnen. Dort stehen die fünf Prompts.` : `Unzip the download. Open ${start} in a text editor. It contains the five prompts.`,
      picture: <div className="space-y-2 font-mono text-sm"><p className="font-bold">{start}</p><p>{instructions}</p><p>{files} <span className="text-muted-foreground">13 {de ? "Nachweisdateien" : "evidence files"}</span></p><p>{de ? "anfragen/" : "requests/"}</p></div>,
    },
    {
      title: de ? "Claude Desktop vorbereiten" : "Prepare Claude Desktop",
      text: de ? "Dateierstellung unter Settings → Capabilities einschalten. Den Skill einmal als ZIP unter Customize → Skills hochladen und einschalten. Im Modellmenü Haiku wählen." : "Enable file creation in Settings → Capabilities. Upload the skill ZIP once in Customize → Skills and enable it. Select Haiku in the model menu.",
      picture: <div className="space-y-3 text-sm"><p className="flex items-center justify-between gap-3 border-b border-hairline pb-2"><b>Claude Desktop</b><span className="border border-foreground px-2 py-1 font-mono text-xs">Haiku</span></p><p>Customize → Skills</p><p className="font-mono text-xs">+ Create skill → Upload a skill</p><a href="/skills/esg-nachweise.zip" download className="inline-flex min-h-11 items-center font-bold underline decoration-mennige underline-offset-4">{de ? "Skill-ZIP herunterladen" : "Download the skill ZIP"}</a></div>,
    },
    {
      title: de ? "Ein Projekt einrichten" : "Set up one project",
      text: de ? `Projects → + New Project. Text aus ${instructions} unter Set project instructions einfügen und speichern. Über + die 13 Dateien aus ${files} als Projektwissen hinzufügen.` : `Projects → + New Project. Paste the text from ${instructions} into Set project instructions and save. Use + to add the 13 files from ${files} to project knowledge.`,
      picture: <div className="space-y-3 text-sm"><p className="font-bold">{de ? "Crvena Zemja Nachweise" : "Crvena Zemja Evidence"}</p><div className="grid grid-cols-2 gap-2"><div className="min-w-0 border border-hairline p-3"><p className="font-bold">Instructions</p><p className="mt-2 break-all font-mono text-xs">{instructions}</p></div><div className="min-w-0 border border-hairline p-3"><p className="font-bold">Project knowledge</p><p className="mt-2 font-mono text-xs">{files} · 13 {de ? "Dateien" : "files"}</p></div></div></div>,
    },
    {
      title: de ? "Den ersten Chat starten" : "Start the first chat",
      text: de ? `Im Projekt einen neuen Chat öffnen. Über + → Add files or photos nur ${request} anhängen. Prompt 1 aus ${start} kopieren und senden. Die Antwort an den Quelldateien prüfen.` : `Open a new chat inside the project. Use + → Add files or photos to attach only ${request}. Copy and send prompt 1 from ${start}. Check the answer against the source files.`,
      picture: <div className="space-y-3 text-sm"><p className="flex justify-between gap-3"><b>{de ? "Neuer Chat im Projekt" : "New chat in the project"}</b><span className="font-mono text-xs">Haiku</span></p><p className="break-all border border-hairline bg-background px-3 py-2 font-mono text-xs">{request}</p><p className="border-t border-hairline pt-3">{de ? "Prompt 1 aus" : "Prompt 1 from"} <code className="break-all text-xs">{start}</code></p></div>,
    },
  ];
  return <section aria-labelledby="kit-setup-heading" data-kit-setup className="pt-8 sm:pt-12">
    <div className="mx-auto max-w-[75rem] px-4 sm:px-6">
      <h2 id="kit-setup-heading" className="text-fluid-h3 font-bold">{de ? "Vom ZIP zum ersten Chat" : "From ZIP to your first chat"}</h2>
      <p className="mt-2 max-w-[64ch] text-body text-muted-foreground">{de ? "Im Workshop zeigt Tim den Ablauf. Zu Hause machst du dieselben Schritte selbst. Verwende nur die erfundenen Dateien dieses Kits." : "Tim demonstrates the workflow in the lecture. At home, follow the same steps yourself. Use only the fictional files in this kit."}</p>
      <ol className="mt-6 divide-y divide-hairline border-y border-hairline">
        {steps.map((step, index) => <li key={step.title} data-kit-setup-step className="grid gap-5 py-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
          <div className="flex min-w-0 gap-4"><span aria-hidden="true" className="font-mono text-3xl font-bold text-kupfer-dark">0{index + 1}</span><div className="min-w-0"><h3 className="text-xl font-bold">{step.title}</h3><p className="mt-2 max-w-[50ch] text-base leading-relaxed [overflow-wrap:anywhere]">{step.text}</p></div></div>
          <div className="min-w-0 border border-hairline bg-card p-4 sm:p-5" data-kit-setup-picture>{step.picture}</div>
        </li>)}
      </ol>
      <p className="mt-4 border-l-2 border-mennige pl-4 text-sm leading-relaxed">{de ? "Nicht ins Projektwissen: anfragen/, loesungen/ und nachreichung/. Anfragen kommen in den jeweiligen Chat; die Rechnung erst in Schritt 5. Prompts 1 bis 4 starten jeweils einen neuen Chat, Prompt 5 bleibt im Chat von Prompt 4." : "Keep requests/, answers/ and late-document/ out of project knowledge. Attach each request to its chat; add the invoice only in step 5. Prompts 1 to 4 each start a new chat; prompt 5 stays in the chat from prompt 4."}</p>
      <p className="mt-3 text-sm text-muted-foreground">{de ? "Danach: Antworten mit Datei, Zeile und Status sowie ein Excel-Nachweisregister. Die Vorlagen in mitnehmen/ sind für eigene Fälle." : "Take away: answers with file, line and status, plus an Excel evidence register. The templates in take-home/ are for your own cases."}</p>
    </div>
  </section>;
}
