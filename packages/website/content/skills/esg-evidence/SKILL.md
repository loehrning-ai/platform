---
name: esg-evidence
description: Answer sustainability or ESG questionnaires, VSME disclosures, bank forms and environmental marketing claims from company evidence. Cite the file and line or identify the missing document.
---

# ESG answers with evidence

Prepare answers from the company's files. Every answer carries an approved source, with file and line,
that covers its period and scope, or names the evidence still needed. A person reviews and approves
answers before they leave the company.

This skill supplies a checking method. Company files supply company knowledge; project instructions
supply the company context, reporting year and reference date; requests specify the task. The skill
contains no company's facts and does not automatically update laws or standards.

Use for customer sustainability questionnaires, ESG fields in bank forms, VSME Basic Module B1 to B11,
environmental claims for labels, shelf cards, websites and advertising, and updates after new evidence.
Answer in English unless the user requests another language.
English: QUOTE, PERIOD, SCOPE, APPROVAL and COVERED, WEAK, GAP.

## Before answering
1. Read the reference date and reporting year from project instructions or the request. Ask if either
   is missing. Check expiry dates and deadlines against the reference date, including in fictional
   exercises; do not replace it with today's date.
2. Only company files in the project or chat prove company facts. A questionnaire, form or draft
   claim states a request, not evidence. Model memory and the internet do not prove company facts.
3. Break each question into its parts. Electricity in MWh and its renewable share are separate parts.
4. Read the supplied rules and standards for this task. Distinguish customer requirements, marketing
   restrictions and bank assumptions. Identify missing or outdated rules rather than inventing them.

## Four evidence checks
1. QUOTE: which file and line supports the answer? Count every line as a text editor does, including
   blank lines. No supporting citation means no COVERED status.
2. PERIOD: does the evidence cover the whole reporting period and remain valid on the reference date?
3. SCOPE: does it cover every product, site or area the answer refers to? Evidence for part does not
   support a statement about the whole.
4. APPROVAL: is it a final, accountable record: measured, signed or approved? Drafts, unsigned offers,
   estimates and blank approval fields require qualification. An audit is not a certificate.

## Status
- COVERED: all four checks hold for every part. A proven fact remains COVERED even when it is bad news;
  state the business action separately. A recorded heavy bottle can be proven while failing a limit.
- WEAK: evidence exists for every part, but is expired, estimated, a draft, unapproved or contradicted.
  Name the failed check in one sentence.
- GAP: no evidence supports the answer, or evidence is missing for part of it: a month, site or area.
  Name the document to request precisely. A contradiction does not remove the gap; describe both.
- Give each complete question its weakest status: GAP before WEAK before COVERED. Count it once.
- Distinguish a question asking for a fact from one asking whether a requirement is met. A proven fact
  can be COVERED; a requirement demonstrably not met is GAP under this method. Explain the distinction.

## Read project files before treating evidence as missing
Project CSVs may initially expose only headers and row counts. Retrieve the original through the
available project-file access. If a blob returns a `local_file` path, read that exact path with suitable
tooling. Project knowledge need not be in the current chat's upload folder. A failed read is not missing
evidence: try project-file access first. If access still fails, report the technical limit and leave
those answers unresolved. Never substitute an unchecked summary for inaccessible source data.

## Calculate and count
- Run calculations in code, with units and cited inputs.
- For monthly electricity, fuel or water records, count distinct months and invoice numbers before
  calculating a full-year total. A repeated invoice with the same value counts once; disclose it.
  Different invoices for one month without a replacement note require reconciliation (WEAK).
- Name missing months. A full-year total based on fewer than 12 months is GAP, even if a draft calls it
  a full year. Do not fill it with an average, the previous year or annualisation.
- Calculate any requested coverage percentage and compare it with the stated threshold.
- Evidence valid at the reporting year-end can support that year while being expired for a current claim.
- Check numeric conventions. For example, 1.000 kWh in a German-format invoice means 1,000 kWh.
  On an invoice image, verify current minus previous meter reading against billed kWh, and kWh times
  tariff against the amount. Cite the invoice number, billing period and image fields; do not invent
  text-editor line numbers for an image.
- Offsets are neither the company's own emissions nor emissions reductions. Location-based Scope 2
  needs full-year kWh and a published grid-average emissions factor. A missing factor is GAP.
- Mark every estimate. Calculate a requested solar-payback estimate from the form's formula and the
  cited offer and tariff. Explain its assumptions; an unsigned offer or estimated yield stays WEAK.

## Environmental marketing claims
Start with the supplied ban list, then apply the four checks. In the workshop's rules file the checks
include sustainability seals without a certification scheme or public authority (2a), unsupported
generic environmental claims (4a), whole-product or whole-company claims true only for part (4b),
product climate-neutrality claims based on offsets (4c), and legal duties presented as distinctive
features (10a). Future-performance claims require the documented plan described in the supplied rules.

State the relevant rule and source. A claim can be approved for publication only if it passes the rule
check and is COVERED for everything it refers to. Otherwise say Drop, or offer narrower wording only
when the files support every part. A renewed certificate does not expand its certified area or process.
Give checking guidance, not a guarantee of legal compliance. A person approves publication.

## Customer reporting questionnaires
If the supplied rules distinguish a reporting customer's sustainability report from procurement,
banking or due-diligence requests, preserve that distinction and the applicable reporting year. Cite
the rule, date and scope. Flag questions beyond the applicable datapoint limit; a person decides how
the company responds. Do not assume all ESG questions are mandatory or governed by the same rule.

## A new document arrives
Read and check the new document first. Recheck every answer relying on the same evidence, including
answers whose status remains unchanged. Use: Where | Before (value, status) | Now (value, status) | Why.
Update the requested workbook, its VSME datapoints and consolidated missing-document list. Preserve
unaffected entries and leave human review fields empty. Distinguish the new evidence from old drafts.

## Output
One table, one row per question, claim or field, using the requested columns. Default:
No | Question or claim | Answer | File and line | Status | Reason | Missing document | Action.
Then give counts and a deduplicated list of missing documents, with all affected rows, sorted by count.
For a workbook, include every requested sheet, consolidate missing evidence across Register and VSME,
and read counts from the saved, recalculated file before reporting them. Leave Checked by and Date
empty for human review. Datapoint groupings may differ from a teaching sample if clearly explained;
calculations must reconcile with the source data.

## Boundaries
Use personal data only as totals: no names or individual records. Never reproduce credentials, keys,
tokens or connection details from files. Never invent a number or citation, net offsets from emissions,
call an audit a certificate, turn an estimate into COVERED, or label an answer ready to send. A person
checks and signs every response.
