# Quick start: prepare a safe learning pilot

The first step is not a rollout for everyone. It is a limited pilot with approved data, one domain expert who checks the output, and a measurement taken beforehand.

## 1. Select one process

Take a recurring information task whose result a person checks before use. Drafts, classification, structured extraction. Unsuitable for a start are decisions with heavy impact on people, safety functions, and anything you cannot reliably check.

Document.

- the input and expected result
- the accountable domain expert
- today's processing time and error types
- the data class and permitted test data
- the subsequent action after the output

## 2. Approve the environment and data

Check the specific product variant, not just the brand:

- the contract, roles, and DPA/AVV where applicable
- use for training and retention
- data residency, transfers, and subprocessors
- identities, access, logs, and deletion
- integrations, extensions, and exports

Start with synthetic data. Real data follows only once purpose, legal basis, confidentiality, and technical approval are settled.

## 3. Define a rubric before testing

Example for a draft summary.

- all required points are included
- no invented statements
- figures and names match the source
- uncertainties are marked
- the format is usable
- the correction time of the domain expert can be measured

Set the stop criteria before you know the result.

## 4. Use representative test cases

Test normal, difficult, and deliberately broken inputs. Record the model or system version, the settings, and the prompt. One successful case is no effectiveness test.

## 5. Treat output only as a draft

The domain expert checks source against output. Correcting, rejecting, and escalating must be allowed. A "human in the loop" works only with time, competence, information, and authority.

## 6. Calculate with your own figures

Measure at least:

- processing and review time before and after
- error rate per defined error type
- share of rejected outputs
- actual variable and fixed costs
- incidents and complaints

Economic benefit comes out of your measurements, not out of static license prices, invented hours saved, or a general ROI figure.

## 7. Decide

- **Stop:** a protection or quality gate was not passed.
- **Revise:** a controllable gap, retested.
- **Continue within limits:** gates passed, scope stays defined.
- **Expand:** only after another check on risk, capacity, and controls.

## Five robust prompt patterns

### Source-bound draft

> Use only the approved source text. Mark missing information as `UNCLEAR`. Invent nothing. Cite the relevant source passage after each point.

### Structured extraction

> Extract only the defined fields as valid JSON. Use `null` when a value is not clearly supported. Add no other keys.

### Cross-check

> Compare the draft with the source. List contradictions, unsupported statements, omitted required points, and uncertain figures. Do not decide on approval yourself.

### Process documentation

> Turn the approved notes into a sequence of steps. Separate prerequisite, action, result, exception, and escalation. Mark assumptions.

### Test cases

> Generate only synthetic test cases for the specified error classes. Use no real people, companies, addresses, or credentials.

The quick start ends with an evidenced pilot decision, not with a tool purchase.
