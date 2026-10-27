# Exercise: check the lentil soup

Data: data/lentil-soup-weekly.csv. The check runs from 30.12.2024 to 22.12.2025.
The week to plan starts 29.12.2025. The forecast is made on Sunday, once the week
before is closed. Compute with the demo, the Claude skill or pruefen.py.

## 1. Baseline (10 minutes)

Without the tool, Feldmark plans "same as last week".

a) Which weeks in the check window must stay out of the comparison, and why?
   Which row appears twice?
b) Mean absolute error and bias of the forecast and of "same as last week", on
   exactly the same weeks. (Excel: column error = actual − forecast, then
   AVERAGE(ABS(...)).)
c) tool-export.txt states 94.2 % accuracy. Apply the same formula to "same as last
   week". By how many percent are the tool's errors smaller?
d) What does the note say on 12.05.2025, and what does the tool know there that the
   rule does not?

## 2. Range (10 minutes)

For each week, take the errors (actual − forecast) of the 26 valid weeks before it.
Their 10 % and 90 % values, added to the forecast, give the week's 80 % range.

a) Guess first: in how many of the 50 weeks did the actual land inside the range?
b) One week by hand, the week of 07.04.2025. Take the errors of the 26 valid weeks
   before it (16.09.2024 to 31.03.2025, without 04.11., 03.02. and 10.03.).
   =PERCENTILE.INC(errors,0.1) and =PERCENTILE.INC(errors,0.9), both added to the
   forecast 607. Did the actual 484 land inside the range?
c) Count all 50 weeks (demo, skill or pruefen.py). Then separately before and from
   07.04.2025.
d) What does the note say on 07.04.2025, and how does it explain c)?

## 3. Order quantity (5 minutes)

a) Read costs.md. Which share of weeks do you want to cover?
   shortage ÷ (shortage + leftover).
b) Forecast for 29.12.2025: 729. Which quantity do you plan? (Excel: PERCENTILE.INC
   over the last 26 errors, at the share from a.)
c) The canteen stops collecting. What changes?

## 4. Rule (5 minutes)

Read release-rule.md and test it against 2025.

a) One check light by hand: the bias for the week of 21.04.2025, over the 13 valid weeks
   before it (06.01. to 14.04.2025, without 03.02. and 10.03.).
   =(SUM(forecast) − SUM(actual)) ÷ SUM(actual). Green or red?
b) In which weeks would the rule have stopped the forecast, and which check light was red?
c) How many weeks after the delisting does it react?
d) Who would have decided in those weeks, and with which number and which reason?

## Then: your own series

At least 33 weeks of actuals and the forecast that was in the system at the time, in
template/my-data.csv. Run it through the demo, the skill or pruefen.py. Fill in
release-rule.md for your series. If your tool does not beat the baseline, that is the
result, not a calculation error.
