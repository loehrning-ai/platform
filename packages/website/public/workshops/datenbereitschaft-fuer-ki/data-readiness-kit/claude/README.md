# Drei Dateien für dein Claude · Three files for your Claude

| Datei | Wohin | Was sie tut | Was sie nicht tut |
| --- | --- | --- | --- |
| `kennzahl-fragekarte/` | Als Skill installieren, Schritte unten. Die fertige ZIP gibt es unter loehrning.ai/skills/kennzahl-fragekarte.zip; du kannst den Ordner auch selbst als ZIP packen, der Ordner liegt in der ZIP ganz oben. | Claude legt vor jeder Kennzahl Art, Quelle und Zählregel fest, fragt bei Lücken nach und nennt die Herkunft. | Sperrt nichts. Ersetzt keinen Test. |
| `PROJEKT-ANWEISUNG-VORLAGE.txt` | In die Anweisungen eines Claude-Projekts, deine freigegebenen Dateien ins Projektwissen. Ohne Projekt: als erste Nachricht in einen neuen Chat. | Legt fest, welche Dateien gelten und wie geantwortet wird. | Sperrt nichts. Gesperrt ist, was du nicht hochlädst. |
| `PRUEFLISTE-VORLAGE.md` | Bei dir. Nie in Claude. | Deine Tests mit erwarteten Werten und Quellen. | |

`kennzahl-fragekarte/references/kennzahlen.md` ist die FOLDLINE-Definition. Ersetze sie durch deine eigene;
unter „Deine Karte“ in der Demo entsteht sie in deinem Browser.

Ob ein Skill greift, entscheidet seine Beschreibung. Greift er nicht, nenn ihn im Chat: „Nutze kennzahl-fragekarte.“
Änderst du die Beschreibung: Auf claude.ai sind höchstens 200 Zeichen erlaubt.

## Installieren

### claude.ai und Desktop-App

1. Unter „Settings“, „Capabilities“ den Schalter „Code execution and file creation“ einschalten (im neuen Layout „Create and edit files“).
2. claude.ai/customize/skills öffnen.
3. „+“, dann „Create skill“, dann „Upload a skill“ und die ZIP-Datei wählen.
4. Den Skill einschalten.

Auf Team und Enterprise kann dein Admin eigene Skills abschalten.

### Claude Code

Für alle Projekte: `unzip kennzahl-fragekarte.zip -d ~/.claude/skills/`

Nur für dieses Repository: `unzip kennzahl-fragekarte.zip -d .claude/skills/`

Danach liegt die Datei unter ~/.claude/skills/kennzahl-fragekarte/SKILL.md. Tipp /kennzahl-fragekarte oder frag einfach.

Skills werden nicht zwischen claude.ai und Claude Code synchronisiert: einmal pro Ort installieren.

### Projektanweisungen

1. claude.ai/projects öffnen, „New Project“ wählen.
2. Rechts „Set project instructions“ öffnen, den Text einfügen, „Save instructions“.
3. Die Kit-Dateien über „+“ ins Projektwissen laden.

Projekte gibt es auf jedem Plan, auf Free bis zu fünf.

## English

The same three files in English: `PROJECT-INSTRUCTIONS-TEMPLATE.txt` (into a Claude Project) and
`TEST-LIST-TEMPLATE.md` (stays with you, never in Claude). The skill `kennzahl-fragekarte` is bilingual:
German body, one line mapping the English words. Steer it by name if it does not fire: "Use kennzahl-fragekarte."

### claude.ai and the desktop app

1. In “Settings”, “Capabilities”, turn on “Code execution and file creation” (“Create and edit files” in the new layout).
2. Open claude.ai/customize/skills.
3. Choose “+”, then “Create skill”, then “Upload a skill”, and pick the zip file.
4. Turn the skill on.

On Team and Enterprise an admin can turn user skills off.

### Claude Code

For all projects: `unzip kennzahl-fragekarte.zip -d ~/.claude/skills/`

For this repository only: `unzip kennzahl-fragekarte.zip -d .claude/skills/`

The file then sits at ~/.claude/skills/kennzahl-fragekarte/SKILL.md. Type /kennzahl-fragekarte or just ask.

Skills don't sync between claude.ai and Claude Code: install once per place.

### Project instructions

1. Open claude.ai/projects and choose “New Project”.
2. On the right, open “Set project instructions”, paste the text, choose “Save instructions”.
3. Add the kit files to the project knowledge with “+”.

Projects work on every plan, up to five on Free.
