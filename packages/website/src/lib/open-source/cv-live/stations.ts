/**
 * Earlier jobs of the invented Mira Kessler, oldest last. "Noch eine Station"
 * appends them, one per tap, to the end of `experience:` in her cv.yaml, so
 * the page fills up exactly the way a real career does.
 *
 * The lengths are chosen, not accidental: in every template and both
 * languages the page overflows at normal density at some tap, and at that
 * same tap tight density brings it back to one page (live-data.test.ts
 * asserts it against the real engine runs).
 *
 * Every firm, place and number here is made up, like the person. The blocks
 * are YAML text, inserted verbatim: the file the engine rendered and the
 * cv.yaml a visitor downloads are the same bytes (live-data.test.ts).
 */
export type CvLiveLanguage = "de" | "en";

export const CV_LIVE_STATIONS: Record<CvLiveLanguage, readonly string[]> = {
  de: [
    `  - role: Werkstudentin Einkauf
    company: Musterwerk Maschinenbau GmbH
    location: Leipzig
    start: 10/2021
    end: 09/2022
    bullets:
      - Lieferzeiten aus 18 Monaten Bestellhistorie ausgewertet und drei Teile mit mehr als zwölf Wochen Vorlauf als Risiko gemeldet; für zwei davon gibt es seitdem einen zweiten Lieferanten.
      - Preisanfragen an 60 Lieferanten aus einer offenen Excel-Liste in ein Formular mit Pflichtfeldern überführt, damit jedes Angebot dieselben Angaben zu Menge, Frist und Fracht enthält.
      - Einkaufsvolumen je Warengruppe monatlich aufbereitet, mit Abweichung zum Vorjahr und einem Satz Begründung je Ausreißer.
      - Rahmenverträge nach Laufzeitende sortiert; vier wären sonst automatisch zu alten Preisen verlängert worden.
    stack: Excel, SAP MM, SQL
`,
    `  - role: Praktikum und Bachelorarbeit Lagerlogistik
    company: Muster Handel GmbH
    location: Halle (Saale)
    start: 03/2021
    end: 08/2021
    bullets:
      - Kommissionierwege für 2.400 Artikel aus Scannerdaten nachgezeichnet und die 120 Artikel mit den meisten Zugriffen näher an den Versand gelegt.
      - Laufweg je Auftrag im Testbereich um 18 % verkürzt, gemessen über vier Wochen vor und vier Wochen nach dem Umbau, bei gleicher Zahl von Aufträgen.
      - Ergebnis als Bachelorarbeit geschrieben und dem Lagerteam mit Grundriss und Zahlen je Gang vorgestellt.
      - Die Auswertung als Skript übergeben, das die Lagerleitung jedes Quartal mit neuen Scannerdaten selbst wiederholt.
    stack: Python, pandas, Excel
`,
    `  - role: Tutorin Statistik
    company: Hochschule Musterstadt
    location: Musterstadt
    start: 10/2019
    end: 02/2021
    bullets:
      - Wöchentliche Übung für 30 Studierende im ersten Semester gehalten, ab dem Sommersemester 2020 online und mit Aufzeichnung für alle, die nicht live dabei sein konnten.
      - Aufgabenblätter mit Lösungsweg in R neu geschrieben; die Rückfragen im Forum halbierten sich je Blatt etwa.
      - Klausuraufgaben vorab gegengerechnet und zwei Fehler in den Musterlösungen gefunden, bevor sie in die Bewertung eingingen.
      - Sprechstunde für Wiederholer eingeführt; von zwölf Teilnehmenden bestanden neun im zweiten Versuch.
    stack: R, LaTeX
`,
    `  - role: Werkstudentin Vertriebsinnendienst
    company: Muster Handel GmbH
    location: Halle (Saale)
    start: 04/2018
    end: 09/2019
    bullets:
      - Auftragseingang aus E-Mail und Fax ins ERP übertragen, im Schnitt 40 Aufträge pro Tag.
      - Liefertermine bei Rückfragen von Kunden aus dem Lagerbestand beantwortet.
`,
    `  - role: Sachbearbeiterin Einkauf, befristet
    company: Musterbau Werkzeuge GmbH
    location: Musterstadt
    start: 07/2017
    end: 09/2017
    bullets:
      - Nach der Ausbildung drei Monate übernommen, bis zum Beginn des Studiums.
      - Bestellungen für Normteile ausgelöst und Lieferscheine gegen Rechnungen geprüft; elf Abweichungen in drei Monaten an die Buchhaltung gemeldet.
    stack: Excel, DATEV
`,
    `  - role: Ausbildung Industriekauffrau
    company: Musterbau Werkzeuge GmbH
    location: Musterstadt
    start: 08/2014
    end: 06/2017
    bullets:
      - Einkauf, Lager, Vertrieb, Buchhaltung und Personal durchlaufen, mit eigenem Projekt in jeder Abteilung.
      - Im Lager die monatliche Inventur von Papierlisten auf Handscanner umgestellt; die Zählung dauert seitdem einen Tag statt zwei.
      - Im Vertrieb Angebote für Bestandskunden aus der Preisliste erstellt und die Rabattstaffeln in einer Tabelle für das ganze Team zusammengeführt.
      - Abschluss vor der IHK mit der Note 1,7; danach das Studium der Betriebswirtschaftslehre begonnen.
    stack: Excel, DATEV
`,
    `  - role: Ferienjob Montage
    company: Musterbau Werkzeuge GmbH
    location: Musterstadt
    start: 07/2013
    end: 08/2013
    bullets:
      - Sechs Wochen an der Endmontage von Spannwerkzeugen gearbeitet, im Zweischichtbetrieb, nach Arbeitsplan und mit Einweisung an jeder der vier Stationen der Linie.
      - Für jedes fertige Werkzeug das Prüfprotokoll ausgefüllt und fehlende oder falsch gelieferte Teile dem Meister gemeldet, bevor die Linie stand.
      - Danach die Bewerbung für die Ausbildung im selben Haus geschrieben, mit dem Meister als Ansprechpartner für die Rückfrage aus der Personalabteilung.
`,
  ],
  en: [
    `  - role: Working Student, Purchasing
    company: Musterwerk Maschinenbau GmbH
    location: Leipzig
    start: 10/2021
    end: 09/2022
    bullets:
      - Analysed 18 months of order history for lead times and flagged three parts with more than twelve weeks of lead time as a risk; two of them now have a second supplier.
      - Moved quote requests to 60 suppliers from an open Excel list into a form with required fields, so every quote states the same quantity, deadline and freight terms.
      - Prepared monthly purchasing volume per commodity group for the head of department, with the change on the prior year and one line of explanation per outlier.
      - Collected framework contracts by end date in one list; four would have renewed automatically at old prices without a reminder.
    stack: Excel, SAP MM, SQL
`,
    `  - role: Internship and Bachelor Thesis, Warehouse Logistics
    company: Muster Handel GmbH
    location: Halle (Saale)
    start: 03/2021
    end: 08/2021
    bullets:
      - Traced picking routes for 2,400 items from scanner data and moved the 120 most frequently picked items closer to dispatch.
      - Cut the walking distance per order in the test zone by 18%, measured over four weeks before and four weeks after the change, with the same number of orders.
      - Wrote the result up as the bachelor thesis and presented it to the warehouse team in one hour, with a floor plan and the numbers for every aisle.
      - Handed the analysis over as a script the warehouse manager reruns every quarter with fresh scanner data.
    stack: Python, pandas, Excel
`,
    `  - role: Statistics Tutor
    company: Hochschule Musterstadt
    location: Musterstadt
    start: 10/2019
    end: 02/2021
    bullets:
      - Ran a weekly exercise class for 30 first-semester students, online from the summer term 2020 and recorded for everyone who could not attend live.
      - Rewrote the exercise sheets with complete worked solutions in R; forum questions per sheet dropped to about half.
      - Checked the exam questions before the exam date and found two errors in the model answers that would otherwise have gone into the marking.
      - Started office hours for students retaking the exam; nine of twelve participants passed on their second attempt.
    stack: R, LaTeX
`,
    `  - role: Working Student, Sales Support
    company: Muster Handel GmbH
    location: Halle (Saale)
    start: 04/2018
    end: 09/2019
    bullets:
      - Entered incoming orders from email and fax into the ERP, about 40 orders a day.
      - Answered customer questions on delivery dates from the warehouse stock.
`,
    `  - role: Purchasing Clerk, Fixed Term
    company: Musterbau Werkzeuge GmbH
    location: Musterstadt
    start: 07/2017
    end: 09/2017
    bullets:
      - Kept on for three months after the apprenticeship, until the degree began.
      - Placed orders for standard parts and checked delivery notes against invoices; reported eleven mismatches to accounting in three months.
    stack: Excel, DATEV
`,
    `  - role: Apprenticeship, Industrial Clerk
    company: Musterbau Werkzeuge GmbH
    location: Musterstadt
    start: 08/2014
    end: 06/2017
    bullets:
      - Worked through purchasing, warehouse, sales, accounting and HR, three to six months each, with an own project in every department.
      - Moved the monthly warehouse stocktake from paper lists to handheld scanners; counting now takes one day instead of two.
      - In sales, wrote quotes for existing customers from the price list and merged the discount tiers into one table for the whole team.
      - Passed the chamber of commerce exam with grade 1.7, then started a degree in business administration.
    stack: Excel, DATEV
`,
    `  - role: Summer Job, Assembly
    company: Musterbau Werkzeuge GmbH
    location: Musterstadt
    start: 07/2013
    end: 08/2013
    bullets:
      - Worked six weeks on the final assembly of clamping tools, in two shifts, to the work plan and with a briefing at each of the four stations on the line.
      - Filled in the test record for every finished tool and reported missing or wrongly delivered parts to the foreman before the line stopped.
      - Then wrote the application for the apprenticeship at the same firm, with the foreman as the contact for the question from human resources.
`,
  ],
};
