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

{{install-de}}

## English

The same three files in English: `PROJECT-INSTRUCTIONS-TEMPLATE.txt` (into a Claude Project) and
`TEST-LIST-TEMPLATE.md` (stays with you, never in Claude). The skill `kennzahl-fragekarte` is bilingual:
German body, one line mapping the English words. Steer it by name if it does not fire: "Use kennzahl-fragekarte."

{{install-en}}
