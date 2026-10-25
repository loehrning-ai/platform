# Release rule: [series, e.g. lentil soup 500 ml, all shops]

Forecast from: [system]. It is made [on Sunday, after the week before is closed].
Baseline: [same as last week]. That is what we would do without the tool.

## Every week before planning: four lamps

Checked on the last 13 valid weeks (actual and forecast present, not sold out).

| Lamp | Green when | Status [week] |
|---|---|---|
| Data | Last week's actual and this week's forecast are present | [ ] |
| Baseline | the forecast's mean error is smaller than the baseline's | [ ] |
| Bias | sum (forecast − actual) at most 5 % of sum actual | [ ] |
| Range | actual inside the 80 % range at least 9 times | [ ] |

All four green: the planning number holds without sign-off.
One red: [name, role] decides, deputy [name, role].
Even an honest range falls below 9 by chance in 9.9 % of 13-week windows.
A single red is a reason to look, not a proof.

## Planning number

Missing unit: [€1.50] (lost contribution margin).
Leftover unit: [€0.40] (cost to make minus salvage value).
Share = shortage ÷ (shortage + leftover) = [0.79].
Planning number = forecast + the value of the last 26 errors (actual − forecast) at
this share. No fixed markup in the tool: a markup is a cost decision without the
arithmetic.

## Always a person, even with four green lamps

- A customer joins or leaves.
- The price changes by more than [10 %].
- We cannot supply what the forecast asks for.
- A new product or a new pack size without its own history.

These events are in no error list. The tool learns them only from the errors that
follow. [For the lentil soup the rule then stayed red for 14 weeks.]

## Adjusting

Only with a reason the tool cannot know, and a number. Every adjustment goes into the
log. After 13 weeks, check the adjustments like the forecast: were they better than
the forecast without them?

## Log

| Week | Forecast | Lamps | Planning number | Adjustment | Reason | Who |
|---|---|---|---|---|---|---|
| [2025-12-29] | [729] | [4 green] | [748] | | | |
