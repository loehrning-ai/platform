# Company profile: Termin Health DOOEL
Fictional training data. Every company, person and document is invented.

- Software company in Skopje, North Macedonia. 31 employees on average in 2026: 12 developers, 6 support, 5 operations and security, 8 sales, finance and management.
- Product: Termin, a web portal where private clinics book appointments and send lab-result PDFs to patients. 46 clinics use it: 29 in North Macedonia, 9 in Serbia, 8 in Germany.
- Largest customer: Rheinland Praxisverbund AG (Cologne, Germany), a group of 8 clinics. It is the controller of its patients' data; Termin Health is its processor.
- Data in the portal: patient name, date of birth, phone, email, reason for the visit and lab-result PDFs. This is health data.
- Cloud: one Google Cloud project, termin-prod. The production database and the lab-PDF bucket are in europe-west3 (Frankfurt). We keep all production data in the EU.
- Support: tickets are handled in the Deskwise helpdesk. Six agents use a Claude Team workspace to draft replies and summarise tickets.
- AI triage: a self-hosted open-weights model sorts incoming tickets into urgent, normal and billing (see ai_hosting_note.txt). It runs on a rented GPU server.
- Security lead: the Head of Operations, who also owns the data inventory.
- ISO/IEC 27001:2022: we plan to certify. Stage 1 is booked for February 2027. We have no certificate yet.
- Leavers in 2026: 2 engineers (admin accounts, see access_review_2026.csv).
