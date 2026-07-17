# Die KI-Nutzungsrichtlinie: Was sie bedeutet und warum sie dich schützt

Samsung, Frühjahr 2023. ChatGPT wird intern eingeführt. Ohne Regeln. Ohne Richtlinie. Ohne Training.

Innerhalb von 20 Tagen: drei Datenlecks. Mitarbeiter geben Quellcode ein, Meeting-Protokolle, Testdaten für Halbleiter. Samsung muss ChatGPT unternehmensweit sperren und eine eigene Lösung bauen. Monate Verzögerung, Reputationsschaden, interne Reorganisation.

Das ist keine Horrorgeschichte. Das ist die Realität in Unternehmen ohne KI-Richtlinie.

## Warum du eine brauchst, auch als Einzelner

Etwa jeder Zehnte nutzt KI ohne Wissen des Arbeitgebers, und rund vier von zehn Unternehmen vermuten private KI-Nutzung im Team (Bitkom 2025). Das sind nicht Rebellen. Das sind Leute wie du, die eine Aufgabe schneller erledigen wollen und dafür ChatGPT öffnen. Verständlich. Aber gefährlich.

Bei Apple war Datenklassifizierung Pflicht, Public/Internal/Confidential/Restricted, ab Tag 1. Vor KI-Hype. Einfach gute Hygiene. Als ich dann bei Red Bull ohne diese Struktur gearbeitet habe, habe ich verstanden, warum Apple das macht. Die Bürokratie der Klassifizierung schützt dich vor der Katastrophe des Lecks.

Dein Unternehmen braucht keine Apple-Level-Security. Es braucht eine Seite Papier.

## Die 6 Bausteine

Eine KI-Nutzungsrichtlinie hat sechs Teile. Nicht mehr.

**1. Geltungsbereich.** Für wen gilt das? Alle. Festangestellte, Freelancer, externe Dienstleister mit Datenzugriff. Keine Ausnahmen.

**2. Genehmigte Tools.** Liste: Toolname, Anbieter, erlaubte Datenstufe, verantwortliche Person. Kostenlose Tools, ChatGPT Free, Gemini Free, Claude Free, sind verboten. Kein AVV, Eingaben können fürs Training verwendet werden. Das ist nicht Paranoia. Das ist DSGVO.

**3. Datenregeln.** Die vier Stufen aus Kapitel 4 werden hier verbindlich. Stufe 1 und 2: genehmigte Tools. Stufe 3: nur Enterprise-KI mit Vertrag. Stufe 4: nie. In keinem Tool.

**4. Prüfpflicht.** Jeder KI-Output durchläuft die 3-Schritt-Prüfung aus Kapitel 10. Sachlich korrekt? Vollständig? Angemessen? Externe Dokumente, alles, was das Unternehmen verlässt, brauchen eine Vier-Augen-Kontrolle.

**5. Eskalationspfad.** Ein KI-Vorfall ist: vertrauliche Daten in nicht genehmigtem Tool, ODER KI-generierte Fehlinformation versandt, ODER personenbezogene Daten ohne Rechtsgrundlage verarbeitet.

Was du tust:

- Sofort: Vorgesetzten informieren
- Innerhalb von 4 Stunden: IT-Leitung + Datenschutzbeauftragte
- Innerhalb von 24 Stunden: Geschäftsführung
- DSGVO Art. 33: Meldung an die Aufsichtsbehörde innerhalb von 72 Stunden

**6. Review-Zyklus.** Quartalsweise Überprüfung. Sofort bei: neuem Tool, Sicherheitsvorfall, Gesetzesänderung. Jede Änderung bekommt eine Versionsnummer.

## EU AI Act: Was dich direkt betrifft

Verordnung (EU) 2024/1689, die EU-KI-Verordnung, ist seit 1. August 2024 in Kraft. Artikel 4 (KI-Kompetenz) gilt seit 2. Februar 2025. Er verlangt, dass jedes Unternehmen, das KI einsetzt, die KI-Kompetenz seiner Mitarbeiter sicherstellt. Unabhängig von Größe, Branche oder Risikoklasse. Die Pflicht trifft Anbieter und Betreiber gleichermaßen, wer ChatGPT oder Copilot nutzt, ist Betreiber.

Seit 2. August 2025 ist der Sanktionsrahmen des Art. 99 grundsätzlich anwendbar. Ob eine Sanktion in Betracht kommt, hängt davon ab, ob die jeweilige Pflicht bereits gilt und wer zuständig ist. Art. 4 und Art. 5 gelten seit Februar 2025, die GPAI-Anbieterpflichten seit August 2025 und Art. 50 ab 2. August 2026. Die Kommission kann GPAI-Pflichten ab diesem Datum mit Bußgeldern durchsetzen. Parlament und Rat beschlossen für eigenständige Anhang-III-Hochrisiko-Systeme den 2. Dezember 2027 und für produktintegrierte Systeme den 2. August 2028; am 14. Juli 2026 war diese Änderungsverordnung noch nicht im Amtsblatt veröffentlicht.

Dieses Buch oder ein Kurszertifikat kann eine Kompetenzmaßnahme dokumentieren, erfüllt Art. 4 aber nicht automatisch. Die Organisation muss Bedarf, Rolle, Einsatzkontext, Maßnahme und Wirksamkeitsprüfung nachvollziehbar dokumentieren. Eine Richtlinie ist ein Baustein davon.

## Die Vorlage

Hier ist die Rohfassung. Eine bis zwei Seiten. Kopiere, passe an, gib sie deiner Geschäftsführung oder IT-Leitung:

```
KI-NUTZUNGSRICHTLINIE, [Firma]
Version 1.0 · Gültig ab [Datum]

1. Zweck
   Diese Richtlinie regelt den Einsatz von KI-Systemen am Arbeitsplatz
   und erfüllt die KI-Kompetenz-Pflicht nach Art. 4 der EU-KI-Verordnung
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

Das ist keine juristische Beratung, aber eine Struktur, mit der du in den meisten Unternehmen anschlussfähig bist. Der Datenschutzbeauftragte deines Unternehmens wird die Klauseln auf eure Situation anpassen.

> **So bekommst du die Richtlinie in einem 25-Personen-Betrieb verabschiedet:**
> 1. Schick die Rohfassung an Geschäftsführung und IT-Verantwortliche mit einem Satz: „Art. 4 EU-KI-Verordnung gilt seit Februar 2025, hier ist die Seite, die uns absichert."
> 2. Plan keinen Workshop, sondern fünfzehn Minuten am Ende eines bestehenden Termins (Jour fixe, Teamrunde). Geh die sechs Punkte durch, halt Einwände direkt fest.
> 3. Trag Datum und Version ein, lass im selben Termin unterschreiben, häng eine Kopie an den gemeinsamen Drucker. In kleinen Betrieben sterben Richtlinien an der Vertagung, nicht am Widerspruch.

Das bringt dir zwei Dinge: Rechtssicherheit gegenüber Art. 4. Und eine Karte, auf der du als KI-Verantwortliche/r stehen kannst, falls es mal Richtung Beförderung geht.

## Das unterschreibst du

Die Richtlinie wird unterschrieben von: Geschäftsführung, IT-Leitung, Datenschutzbeauftragte, Betriebsrat (falls vorhanden). Und von dir. Nicht als Kontrolle, als Schutz. Wenn etwas schiefgeht und du dich an die Richtlinie gehalten hast, stehst du nicht allein da.

Bei Meta unterschreibe ich regelmäßig Policy-Updates. Das dauert zwei Minuten. Und es gibt mir Sicherheit, weil klar ist, was erlaubt ist und was nicht.

---

> **Jetzt bist du dran:** Frag deine IT-Abteilung, ob es eine KI-Nutzungsrichtlinie gibt. Wenn ja: lies sie. Wenn nein: zeig ihnen die sechs Bausteine aus diesem Kapitel. Das ist ein konkreter Beitrag, den du heute leisten kannst.
