# Die KI-Nutzungsrichtlinie: Was sie bedeutet und warum sie dich schützt

Im Frühjahr 2023 führte Samsung ChatGPT intern ein, ohne Regeln, Richtlinie oder Training. Innerhalb von 20 Tagen gab es drei Datenlecks, weil Mitarbeiter Quellcode, Meeting-Protokolle und Testdaten für Halbleiter eingaben. Samsung musste ChatGPT unternehmensweit sperren und eine eigene Lösung bauen, mit Monaten Verzögerung, Reputationsschaden und interner Reorganisation.

## Warum du eine brauchst, auch als Einzelner

Etwa jeder Zehnte nutzt KI ohne Wissen des Arbeitgebers, und rund vier von zehn Unternehmen vermuten private KI-Nutzung im Team (Bitkom 2025). Meist wollen diese Leute eine Aufgabe schneller erledigen und öffnen dafür ChatGPT, verständlich, aber gefährlich.

Bei Apple war Datenklassifizierung (Public/Internal/Confidential/Restricted) ab Tag 1 Pflicht. Erst bei Red Bull, wo diese Struktur fehlte, habe ich verstanden, dass die Klassifizierung vor Lecks schützt. Dein Unternehmen braucht dafür keine Apple-Security, eine Seite Papier reicht.

## Die 6 Bausteine

Eine KI-Nutzungsrichtlinie hat sechs Teile.

**1. Geltungsbereich.** Sie gilt ohne Ausnahme für Festangestellte, Freelancer und externe Dienstleister mit Datenzugriff.

**2. Genehmigte Tools.** Die Liste nennt Toolname, Anbieter, erlaubte Datenstufe und verantwortliche Person. Kostenlose Tools wie ChatGPT Free, Gemini Free und Claude Free sind verboten, weil ohne AVV Eingaben fürs Training verwendet werden können.

**3. Datenregeln.** Die vier Stufen aus Kapitel 4 werden verbindlich: Stufe 1 und 2 in genehmigten Tools, Stufe 3 nur in Enterprise-KI mit Vertrag, Stufe 4 in keinem Tool.

**4. Prüfpflicht.** Jeder KI-Output durchläuft die 3-Schritt-Prüfung aus Kapitel 10. Alles, was das Unternehmen verlässt, braucht eine Vier-Augen-Kontrolle.

**5. Eskalationspfad.** Ein KI-Vorfall liegt vor, wenn vertrauliche Daten in ein nicht genehmigtes Tool gelangt sind, KI-generierte Fehlinformation versandt wurde oder personenbezogene Daten ohne Rechtsgrundlage verarbeitet wurden. Dann gilt:

- Sofort: Vorgesetzten informieren
- Innerhalb von 4 Stunden: IT-Leitung + Datenschutzbeauftragte
- Innerhalb von 24 Stunden: Geschäftsführung
- DSGVO Art. 33: Meldung an die Aufsichtsbehörde innerhalb von 72 Stunden

**6. Review-Zyklus.** Die Richtlinie wird quartalsweise überprüft und sofort bei neuem Tool, Sicherheitsvorfall oder Gesetzesänderung. Jede Änderung bekommt eine Versionsnummer.

## EU AI Act: Was dich direkt betrifft

Verordnung (EU) 2024/1689, die EU-KI-Verordnung, ist seit 1. August 2024 in Kraft. Artikel 4 (KI-Kompetenz) gilt seit 2. Februar 2025. In der seit 27. Juli 2026 geltenden Fassung müssen Anbieter und Betreiber Maßnahmen ergreifen, die die Entwicklung der KI-Kompetenz ihres Personals und anderer in ihrem Auftrag handelnder Personen unterstützen. Vorwissen, Erfahrung, Ausbildung, Einsatzkontext und betroffene Personen sind zu berücksichtigen; ein bestimmtes individuelles Kompetenzniveau muss nicht garantiert werden.

Seit 2. August 2025 ist der Sanktionsrahmen des Art. 99 grundsätzlich anwendbar. Ob eine Sanktion in Betracht kommt, hängt davon ab, ob die jeweilige Pflicht bereits gilt und wer zuständig ist. Art. 4 und große Teile des Art. 5 gelten seit Februar 2025, die GPAI-Anbieterpflichten seit August 2025 und Art. 50 ab 2. August 2026. Die Verordnung (EU) 2026/1744 ist am 27. Juli 2026 in Kraft getreten. Sie verschiebt die Hochrisiko-Regeln für eigenständige Anhang-III-Systeme auf den 2. Dezember 2027 und für produktintegrierte Anhang-I-Systeme auf den 2. August 2028.

Dieses Buch oder eine Teilnahmebestätigung kann eine Kompetenzmaßnahme dokumentieren, erfüllt Art. 4 aber nicht automatisch. Die Organisation muss Bedarf, Rolle, Einsatzkontext, Maßnahme und Wirksamkeitsprüfung nachvollziehbar dokumentieren. Eine Richtlinie ist ein Baustein davon.

## Die Vorlage

Passe diese Rohfassung von ein bis zwei Seiten an und gib sie der Geschäftsführung oder IT-Leitung:

```
KI-NUTZUNGSRICHTLINIE, [Firma]
Version 1.0 · Gültig ab [Datum]

1. Zweck
   Diese Richtlinie regelt den Einsatz von KI-Systemen am Arbeitsplatz
   und unterstützt die KI-Kompetenzmaßnahmen nach Art. 4 der EU-KI-Verordnung
   (Verordnung (EU) 2024/1689).

2. Geltungsbereich
   Für alle Mitarbeitenden, die KI-Systeme dienstlich einsetzen.
   Festangestellte, Freelancer, externe Dienstleister mit Datenzugriff.
   Keine Ausnahmen.

3. Erlaubte Tools (mit AVV)
   - Microsoft 365 Copilot (Unternehmens-Lizenz)
   - ChatGPT Enterprise [falls lizenziert]
   - Claude Team / Enterprise [falls lizenziert]
   - [Weitere nach IT-Freigabe]

4. Verbotene Tools
   - Free-Versionen (ChatGPT Free, Claude Free, Gemini Free)
     für Confidential oder Restricted Data
   - Nicht-geprüfte Drittanbieter-Browser-Plugins
   - Jedes Tool ohne AVV nach DSGVO Art. 28

5. Daten-Klassifizierung
   - Public:       beliebig
   - Internal:     nur Tenant-Tools (Copilot mit M365-Tenant)
   - Confidential: nur Enterprise-Tools mit AVV
   - Restricted:   nicht in externe KI, nie

6. Verifikation
   Jeder KI-Output, der an Dritte geht, durchläuft die 3-Schritt-
   Prüfung (sachlich korrekt / vollständig / angemessen).
   Externe Dokumente brauchen eine Vier-Augen-Kontrolle.

7. Verantwortung
   [Name, Rolle] ist KI-Beauftragte/r.
   Bei Zweifel: fragen, nicht machen.

8. Schulung
   Alle Mitarbeitenden absolvieren den KI-Führerschein
   (/ki-fuehrerschein) oder ein vergleichbares
   Training zum Nachweis der Art.-4-Kompetenz.

9. Incident-Management
   Datenleaks oder Halluzinations-Fehler, die nach außen wirkten,
   sofort melden an [Kontakt].
   Eskalationspfad: Vorgesetzte/r (sofort) → IT-Leitung und DSB
   (4 Stunden) → Geschäftsführung (24 Stunden) → Aufsichtsbehörde
   nach DSGVO Art. 33 (72 Stunden).

10. Review
    Quartalsweise Überprüfung durch KI-Beauftragte/n.
    Sofort bei: neuem Tool, Sicherheitsvorfall, Gesetzesänderung.
    Jede Änderung bekommt eine Versionsnummer.

Unterschriften:
Geschäftsführung · IT-Leitung · Datenschutzbeauftragte/r ·
Betriebsrat (falls vorhanden) · Mitarbeitende/r
```

Die Vorlage ist keine juristische Beratung, passt aber als Struktur für die meisten Unternehmen. Euer Datenschutzbeauftragter passt die Klauseln an eure Situation an.

> **So bekommst du die Richtlinie in einem 25-Personen-Betrieb verabschiedet:**
> 1. Schick die Rohfassung an Geschäftsführung und IT-Verantwortliche mit einem Satz: „Art. 4 EU-KI-Verordnung gilt seit Februar 2025, hier ist die Seite, die uns absichert."
> 2. Plan keinen Workshop, sondern fünfzehn Minuten am Ende eines bestehenden Termins (Jour fixe, Teamrunde). Geh die sechs Punkte durch, halte Einwände direkt fest.
> 3. Trag Datum und Version ein, lass im selben Termin unterschreiben, häng eine Kopie an den gemeinsamen Drucker. In kleinen Betrieben sterben Richtlinien an der Vertagung, nicht am Widerspruch.

Damit hat dein Betrieb einen dokumentierten Baustein für Art. 4, und du stehst als KI-Verantwortliche/r darauf, was bei einer Beförderung zählen kann.

## Das unterschreibst du

Geschäftsführung, IT-Leitung, Datenschutzbeauftragte, Betriebsrat (falls vorhanden) und du unterschreiben. Die Unterschrift schützt dich: Hast du dich an die Richtlinie gehalten und etwas geht schief, stehst du nicht allein da.

Bei Meta unterschreibe ich regelmäßig Policy-Updates in zwei Minuten, und danach ist klar, was erlaubt ist.

---

> **Jetzt bist du dran:** Frag deine IT-Abteilung, ob es eine KI-Nutzungsrichtlinie gibt. Wenn ja, lies sie, wenn nein, zeig ihnen die sechs Bausteine aus diesem Kapitel.
