# Quick start: prepare a safe learning pilot

The first step is not a broad rollout. It is a limited pilot with approved data, clear professional review, and a baseline measurement.

## 1. Select one process

Choose a recurring information task in which a person reviews the result before it is used. Suitable examples include drafting, classification, or structured extraction. As a starting point, avoid decisions that have a major impact on people, safety functions, and tasks without a reliable means of review.

Document:

- the input and expected result
- the accountable domain expert
- current processing time and error types
- the data class and permitted test data
- the subsequent action after the output

## 2. Approve the environment and data

Assess the specific product variant, not just the brand:

- the contract, roles, and DPA/AVV where applicable
- use for training and retention
- data residency, transfers, and subprocessors
- identities, access, logs, and deletion
- integrations, extensions, and exports

Start with synthetic data. Real data should follow only once purpose, legal basis, confidentiality, and technical approval have been established.

## 3. Define a rubric before testing

Example for a draft summary:

- all required points are included
- no fabricated statements
- figures and names agree with the source
- uncertainties are marked
- the format is usable
- professional correction time can be measured

Set stop criteria before the result is known.

## 4. Use representative test cases

Test normal, difficult, and deliberately faulty inputs. Record the model or system version, settings, and prompt. One successful case is not an effectiveness test.

## 5. Treat output only as a draft

The domain expert checks the source against the output. That person must be able to correct, reject, and escalate. A "human in the loop" is effective only if adequate time, competence, information, and authority are available.

## 6. Calculate with your own figures

Measure at least:

- processing and review time before and after
- error rate for each defined error type
- share of rejected outputs
- actual variable and fixed costs
- incidents and complaints

Economic benefit follows from your measurements, not from static license prices, invented time savings, or a general ROI figure.

## 7. Decide

- **Stop:** A protection or quality gate was not passed.
- **Revise:** A controllable gap requires a new test.
- **Continue within limits:** Gates were passed and scope remains defined.
- **Expand:** Only after another review of risk, capacity, and controls.

## Five robust prompt patterns

### Source-bound draft

> Use only the approved source text. Mark missing information as `UNKLAR`. Do not invent anything. Cite the relevant source passage after each point.

### Structured extraction

> Extract only the defined fields as valid JSON. Use `null` when a value is not clearly supported. Do not add any other keys.

### Cross-check

> Compare the draft with the source. List contradictions, unsupported statements, omitted required points, and uncertain figures. Do not make the approval decision yourself.

### Process documentation

> Turn the approved notes into a sequence of steps. Separate prerequisite, action, result, exception, and escalation. Mark assumptions.

### Test cases

> Generate only synthetic test cases for the specified error classes. Do not use real people, companies, addresses, or credentials.

The quick start ends with an evidence-based pilot decision, not with a tool purchase.
