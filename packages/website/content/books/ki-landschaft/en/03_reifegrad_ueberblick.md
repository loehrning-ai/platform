# Readiness at a glance: an evidence-based self-assessment

Forget the rank. Readiness says which prerequisites for one concrete use case are evidenced and which are missing.

## Twelve review questions

Answer each question with **unknown**, **partially evidenced**, or **evidenced**. Link the evidence and name an accountable person.

### Purpose and success

1. Is the process documented, including its input, output, and subsequent action?
2. Is there a baseline measurement and a verifiable success criterion?
3. Are error types, error costs, and stop criteria defined?

### Data and rights

4. Are data provenance, data class, legal basis, and permitted use clear?
5. Are access, retention, deletion, and possible transfers documented?
6. Has anyone checked whether the data is sufficient and representative for the purpose?

### Technology and operations

7. Are the system version, provider, integrations, and complete data flow known?
8. Have identity, permissions, secrets, updates, logging, backups, and recovery been tested?
9. Is there an exit and fallback path?

### People and governance

10. Are domain review, human oversight, and escalation staffed by people with real authority?
11. Are users qualified for the task, the system's limits, and its risks?
12. Are the role, risk classification, and applicable legal obligations documented with reasons?

## Turn answers into actions

No formula multiplies these answers into an objective 0-to-100 truth. Prioritize instead:

1. **Blockers:** an unclear legal basis, prohibited data, missing approval, or consequences of errors nobody can control
2. **Control gaps:** missing permissions, oversight, logs, deletion, recovery, or escalation
3. **Effectiveness gaps:** no baseline, unsuitable test cases, or unclear quality criteria
4. **Optimization:** convenience, speed, or cost once the protection and effectiveness gates have passed

## Four working states

| State | Meaning | Next step |
|---|---|---|
| Not inventoried | Systems and data flows are incomplete | Define the inventory and owners |
| Inventoried | Purpose, role, and data flow are known | Review risks and controls |
| Ready for a pilot | Test data, rubric, oversight, and stop criteria are in place | Run a limited pilot |
| Ready for operation | Controls, monitoring, incidents, fallback, and review have been tested | Monitor and reassess when events require it |

The states apply per use case, not per company. Your internal writing assistant can be ready for operation while your automated applicant screening is not even inventoried.

## What does not count as evidence

- a provider logo
- completed general AI training
- one successful demonstration prompt
- a data processing agreement (DPA/AVV) without a review of roles and data flows
- an ISO certification without mapping it to the specific system
- a list of technical website signals

Readiness shows up in current, testable controls on the real process.
