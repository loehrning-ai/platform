# Release rule: lentil soup 500 ml (item 2210)

Checked every Sunday after the ERP forecast run (18:00), on the last 13 valid weeks
(sold-out weeks and weeks without a stored forecast do not count).

The order quantity goes into planning without sign-off when all four check lights are green:

1. **Data:** last week's actual and this week's forecast are both available.
2. **Baseline:** the forecast's mean error is smaller than that of "same as last week".
3. **Bias:** sum (forecast − actual) is at most 5 % of sum actual, too high or too low.
4. **Range:** the actual landed inside the 80 % range at least 9 times out of 13.

Order quantity = forecast + the 48th percentile of the last 26 errors (actual − forecast).
Share 0.48 = shortage €1.50 ÷ (shortage €1.50 + leftover €1.60). The leftover cost is the
full €1.60 because the staff canteen no longer collects leftovers (since 28.12.2025).
If a buyer for leftovers is found again, recompute the share.

Otherwise **[name: who decides]** decides, and writes the quantity and the reason in the log.

Always a person, whatever the lights say: new product, a customer joins or leaves
(e.g. the organic chain delisting, April 2025), price change of more than 10 %,
supply shortage, promotion not yet in the ERP promotion calendar.
