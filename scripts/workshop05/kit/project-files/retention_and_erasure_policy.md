# Retention and erasure policy, version 2.0
Fictional training data. Every company, person and document is invented.

Owner: Head of Operations. Approved: 2026-01-12. Next review: 2027-01-12.

1. We process patient data for our clinic customers. A clinic (the controller) tells us when a patient asks for erasure.
2. We delete the patient's data within 30 days of the clinic's request.
3. Deletion covers: the production database, the lab-PDF bucket and the helpdesk (Deskwise).
4. Backups are encrypted and expire after 35 days. A deletion reaches the backups when they expire.
5. After deleting, we confirm in writing to the clinic.
