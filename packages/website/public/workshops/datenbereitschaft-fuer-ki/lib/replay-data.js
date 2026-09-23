/* Generated from demo/evals/replay.json, demo/generated/evidence-queries.json and manifest.sha256. */
(() => {
  const deepFreeze = (value) => {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.getOwnPropertyNames(value).forEach((key) => deepFreeze(value[key]));
    return Object.freeze(value);
  };
  window.FOLDLINE_REPLAY = deepFreeze({
  "version": 1,
  "label": "deterministic database evidence; not a recorded LLM response",
  "dataset": {
    "accountCount": 144,
    "accountMonthCount": 2592,
    "checksum": "55b8975be7ed08e263719485cf0363d4",
    "completeThroughMonth": "2026-06-01",
    "currency": "EUR",
    "evaluationClockUtc": "2026-07-01T09:00:00Z",
    "firstMonth": "2025-01-01",
    "fixtureMode": "frozen_historical",
    "id": "foldline_saas_2026q2",
    "loadDelayHoursAfterPeriodClose": 6,
    "loadedAtUtc": "2026-07-01T06:00:00Z",
    "seedVersion": "foldline-v1"
  },
  "semantic": {
    "files": {
      "generated/ask/connections.template.json": "e1d7cf7066af17d59a61a7d774d67a893392c1a86ae8bca5f5b9b6f9659f6f8d",
      "generated/ask/enrichments.ready.json": "2e8442744f8b30ca4f97d8df9a5f288e2cd084050efb809f8a3c5e08b7df4bb7",
      "generated/ask/metrics.ready.json": "a29263a862fed7186b83e7af26e2c67eee7ea54c6c13acd4a04f1a03d909bf16",
      "generated/ask/policy.ready.json": "f52703975f2cebf0ca2cf8ab0b7c43a6741431a772ec0070d3c1e5079bd28c2e",
      "generated/ask/verified.ready.json": "70a94b5ec0168090a5e888d03e106c8c3704e809f41a41956ec979e30ea30f04",
      "generated/catalog.md": "c5c3376050f19df5b803b120d7018ea4d57c84fbbf029845c68a5b7670db8210",
      "generated/claude/.claude/skills/foldline-analytics/SKILL.md": "55684ac7dfb42d33cfe0c5e72ca2fb44c994f2a542d6a657d866de81b5f1bb0c",
      "generated/claude/CLAUDE.md": "02284d806137e82a680f11e002725ff1584341236745484cbf22963c71af29b6",
      "generated/evidence-queries.json": "b85c384ae660d7c79c9b4ee2628b788df5735d42071e3b7334291296beb21da0"
    },
    "version": 1
  },
  "status": {
    "ok": true,
    "service": "foldline-fixed-evidence",
    "datasetId": "foldline_saas_2026q2",
    "checksum": "55b8975be7ed08e263719485cf0363d4",
    "detail": "Embedded checksum-matched fixed evidence; no network or database required."
  },
  "responses": {
    "bad:G01": {
      "dataset": {
        "accountCount": 144,
        "accountMonthCount": 2592,
        "checksum": "55b8975be7ed08e263719485cf0363d4",
        "completeThroughMonth": "2026-06-01",
        "currency": "EUR",
        "evaluationClockUtc": "2026-07-01T09:00:00Z",
        "firstMonth": "2025-01-01",
        "fixtureMode": "frozen_historical",
        "id": "foldline_saas_2026q2",
        "loadDelayHoursAfterPeriodClose": 6,
        "loadedAtUtc": "2026-07-01T06:00:00Z",
        "seedVersion": "foldline-v1"
      },
      "evidence": {
        "behavior": "answer",
        "lane": "bad",
        "id": "G01",
        "metric": "ending_mrr",
        "allowedRelations": [],
        "fixedSql": "SELECT dt AS month_start, sum(balance + change)::numeric(14,2) AS ending_mrr_eur\nFROM public.acct_history\nWHERE dt >= DATE '2026-04-01' AND dt < DATE '2026-07-01'\nGROUP BY dt\nORDER BY dt",
        "rows": [
          {
            "ending_mrr_eur": 314715,
            "month_start": "2026-04-01"
          },
          {
            "ending_mrr_eur": 354225,
            "month_start": "2026-05-01"
          },
          {
            "ending_mrr_eur": 429580,
            "month_start": "2026-06-01"
          }
        ]
      }
    },
    "ready:G01": {
      "dataset": {
        "accountCount": 144,
        "accountMonthCount": 2592,
        "checksum": "55b8975be7ed08e263719485cf0363d4",
        "completeThroughMonth": "2026-06-01",
        "currency": "EUR",
        "evaluationClockUtc": "2026-07-01T09:00:00Z",
        "firstMonth": "2025-01-01",
        "fixtureMode": "frozen_historical",
        "id": "foldline_saas_2026q2",
        "loadDelayHoursAfterPeriodClose": 6,
        "loadedAtUtc": "2026-07-01T06:00:00Z",
        "seedVersion": "foldline-v1"
      },
      "evidence": {
        "behavior": "answer",
        "lane": "ready",
        "id": "G01",
        "metric": "ending_mrr",
        "allowedRelations": [
          "analytics.mrr_summary_monthly"
        ],
        "fixedSql": "SELECT month_start, ending_mrr_eur\nFROM analytics.mrr_summary_monthly\nWHERE month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01'\nORDER BY month_start",
        "rows": [
          {
            "ending_mrr_eur": 334675,
            "month_start": "2026-04-01"
          },
          {
            "ending_mrr_eur": 344450,
            "month_start": "2026-05-01"
          },
          {
            "ending_mrr_eur": 387015,
            "month_start": "2026-06-01"
          }
        ]
      }
    },
    "bad:G02": {
      "dataset": {
        "accountCount": 144,
        "accountMonthCount": 2592,
        "checksum": "55b8975be7ed08e263719485cf0363d4",
        "completeThroughMonth": "2026-06-01",
        "currency": "EUR",
        "evaluationClockUtc": "2026-07-01T09:00:00Z",
        "firstMonth": "2025-01-01",
        "fixtureMode": "frozen_historical",
        "id": "foldline_saas_2026q2",
        "loadDelayHoursAfterPeriodClose": 6,
        "loadedAtUtc": "2026-07-01T06:00:00Z",
        "seedVersion": "foldline-v1"
      },
      "evidence": {
        "behavior": "answer",
        "lane": "bad",
        "id": "G02",
        "metric": "net_new_mrr",
        "allowedRelations": [],
        "fixedSql": "SELECT sum(amount)::numeric(14,2) AS net_new_mrr_eur\nFROM public.billing_events\nWHERE dt >= DATE '2026-04-01' AND dt < DATE '2026-07-01'\n  AND status = 'posted'",
        "rows": [
          {
            "net_new_mrr_eur": 27055
          }
        ]
      }
    },
    "ready:G02": {
      "dataset": {
        "accountCount": 144,
        "accountMonthCount": 2592,
        "checksum": "55b8975be7ed08e263719485cf0363d4",
        "completeThroughMonth": "2026-06-01",
        "currency": "EUR",
        "evaluationClockUtc": "2026-07-01T09:00:00Z",
        "firstMonth": "2025-01-01",
        "fixtureMode": "frozen_historical",
        "id": "foldline_saas_2026q2",
        "loadDelayHoursAfterPeriodClose": 6,
        "loadedAtUtc": "2026-07-01T06:00:00Z",
        "seedVersion": "foldline-v1"
      },
      "evidence": {
        "behavior": "answer",
        "lane": "ready",
        "id": "G02",
        "metric": "net_new_mrr",
        "allowedRelations": [
          "analytics.mrr_summary_monthly"
        ],
        "fixedSql": "SELECT sum(net_new_mrr_eur)::numeric(14,2) AS net_new_mrr_eur\nFROM analytics.mrr_summary_monthly\nWHERE month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01'",
        "rows": [
          {
            "net_new_mrr_eur": 32380
          }
        ]
      }
    },
    "bad:G03": {
      "dataset": {
        "accountCount": 144,
        "accountMonthCount": 2592,
        "checksum": "55b8975be7ed08e263719485cf0363d4",
        "completeThroughMonth": "2026-06-01",
        "currency": "EUR",
        "evaluationClockUtc": "2026-07-01T09:00:00Z",
        "firstMonth": "2025-01-01",
        "fixtureMode": "frozen_historical",
        "id": "foldline_saas_2026q2",
        "loadDelayHoursAfterPeriodClose": 6,
        "loadedAtUtc": "2026-07-01T06:00:00Z",
        "seedVersion": "foldline-v1"
      },
      "evidence": {
        "behavior": "answer",
        "lane": "bad",
        "id": "G03",
        "metric": "logo_churn_rate",
        "allowedRelations": [],
        "fixedSql": "SELECT\n  seg AS customer_segment,\n  count(*)::bigint AS starting_accounts,\n  count(*) FILTER (WHERE status = 'C')::bigint AS churned_accounts,\n  round(count(*) FILTER (WHERE status = 'C') * 100.0 / nullif(count(*), 0), 2) AS logo_churn_rate_pct\nFROM public.customer_master\nGROUP BY seg\nORDER BY seg",
        "rows": [
          {
            "churned_accounts": 4,
            "customer_segment": "Enterprise",
            "logo_churn_rate_pct": 8.33,
            "starting_accounts": 48
          },
          {
            "churned_accounts": 4,
            "customer_segment": "Mid-Market",
            "logo_churn_rate_pct": 8.33,
            "starting_accounts": 48
          },
          {
            "churned_accounts": 4,
            "customer_segment": "SMB",
            "logo_churn_rate_pct": 8.33,
            "starting_accounts": 48
          }
        ]
      }
    },
    "ready:G03": {
      "dataset": {
        "accountCount": 144,
        "accountMonthCount": 2592,
        "checksum": "55b8975be7ed08e263719485cf0363d4",
        "completeThroughMonth": "2026-06-01",
        "currency": "EUR",
        "evaluationClockUtc": "2026-07-01T09:00:00Z",
        "firstMonth": "2025-01-01",
        "fixtureMode": "frozen_historical",
        "id": "foldline_saas_2026q2",
        "loadDelayHoursAfterPeriodClose": 6,
        "loadedAtUtc": "2026-07-01T06:00:00Z",
        "seedVersion": "foldline-v1"
      },
      "evidence": {
        "behavior": "answer",
        "lane": "ready",
        "id": "G03",
        "metric": "logo_churn_rate",
        "allowedRelations": [
          "analytics.logo_churn_by_segment_quarter"
        ],
        "fixedSql": "SELECT\n  customer_segment,\n  starting_accounts,\n  churned_accounts,\n  logo_churn_rate_pct\nFROM analytics.logo_churn_by_segment_quarter\nWHERE period_start = DATE '2026-04-01'\n  AND period_end_exclusive = DATE '2026-07-01'\nORDER BY customer_segment",
        "rows": [
          {
            "churned_accounts": 4,
            "customer_segment": "Enterprise",
            "logo_churn_rate_pct": 10,
            "starting_accounts": 40
          },
          {
            "churned_accounts": 4,
            "customer_segment": "Mid-Market",
            "logo_churn_rate_pct": 10,
            "starting_accounts": 40
          },
          {
            "churned_accounts": 4,
            "customer_segment": "SMB",
            "logo_churn_rate_pct": 10,
            "starting_accounts": 40
          }
        ]
      }
    },
    "bad:G04": {
      "dataset": {
        "accountCount": 144,
        "accountMonthCount": 2592,
        "checksum": "55b8975be7ed08e263719485cf0363d4",
        "completeThroughMonth": "2026-06-01",
        "currency": "EUR",
        "evaluationClockUtc": "2026-07-01T09:00:00Z",
        "firstMonth": "2025-01-01",
        "fixtureMode": "frozen_historical",
        "id": "foldline_saas_2026q2",
        "loadDelayHoursAfterPeriodClose": 6,
        "loadedAtUtc": "2026-07-01T06:00:00Z",
        "seedVersion": "foldline-v1"
      },
      "evidence": {
        "behavior": "answer",
        "lane": "bad",
        "id": "G04",
        "metric": "expansion_mrr",
        "allowedRelations": [],
        "fixedSql": "SELECT c.country AS country_code, sum(b.amount)::numeric(14,2) AS expansion_mrr_eur\nFROM public.billing_events b\nJOIN public.customer_master c ON c.id = b.acct_id\nWHERE b.dt >= DATE '2026-04-01' AND b.dt < DATE '2026-07-01' AND b.type = 'E'\nGROUP BY c.country\nORDER BY expansion_mrr_eur DESC, c.country",
        "rows": [
          {
            "country_code": "CH",
            "expansion_mrr_eur": 1990
          },
          {
            "country_code": "AT",
            "expansion_mrr_eur": 1955
          },
          {
            "country_code": "DE",
            "expansion_mrr_eur": 1895
          },
          {
            "country_code": "NL",
            "expansion_mrr_eur": 1885
          },
          {
            "country_code": "PL",
            "expansion_mrr_eur": 1825
          },
          {
            "country_code": "FR",
            "expansion_mrr_eur": 1780
          },
          {
            "country_code": "SE",
            "expansion_mrr_eur": 1780
          },
          {
            "country_code": "GB",
            "expansion_mrr_eur": 705
          }
        ]
      }
    },
    "ready:G04": {
      "dataset": {
        "accountCount": 144,
        "accountMonthCount": 2592,
        "checksum": "55b8975be7ed08e263719485cf0363d4",
        "completeThroughMonth": "2026-06-01",
        "currency": "EUR",
        "evaluationClockUtc": "2026-07-01T09:00:00Z",
        "firstMonth": "2025-01-01",
        "fixtureMode": "frozen_historical",
        "id": "foldline_saas_2026q2",
        "loadDelayHoursAfterPeriodClose": 6,
        "loadedAtUtc": "2026-07-01T06:00:00Z",
        "seedVersion": "foldline-v1"
      },
      "evidence": {
        "behavior": "answer",
        "lane": "ready",
        "id": "G04",
        "metric": "expansion_mrr",
        "allowedRelations": [
          "analytics.expansion_mrr_by_country_monthly"
        ],
        "fixedSql": "SELECT country_code, sum(expansion_mrr_eur)::numeric(14,2) AS expansion_mrr_eur\nFROM analytics.expansion_mrr_by_country_monthly\nWHERE month_start >= DATE '2026-04-01' AND month_start < DATE '2026-07-01'\nGROUP BY country_code\nORDER BY expansion_mrr_eur DESC, country_code",
        "rows": [
          {
            "country_code": "CH",
            "expansion_mrr_eur": 1990
          },
          {
            "country_code": "DE",
            "expansion_mrr_eur": 1780
          },
          {
            "country_code": "FR",
            "expansion_mrr_eur": 1780
          },
          {
            "country_code": "SE",
            "expansion_mrr_eur": 1780
          },
          {
            "country_code": "NL",
            "expansion_mrr_eur": 1655
          },
          {
            "country_code": "PL",
            "expansion_mrr_eur": 1640
          },
          {
            "country_code": "AT",
            "expansion_mrr_eur": 1565
          },
          {
            "country_code": "GB",
            "expansion_mrr_eur": 705
          }
        ]
      }
    },
    "bad:G05": {
      "dataset": {
        "accountCount": 144,
        "accountMonthCount": 2592,
        "checksum": "55b8975be7ed08e263719485cf0363d4",
        "completeThroughMonth": "2026-06-01",
        "currency": "EUR",
        "evaluationClockUtc": "2026-07-01T09:00:00Z",
        "firstMonth": "2025-01-01",
        "fixtureMode": "frozen_historical",
        "id": "foldline_saas_2026q2",
        "loadDelayHoursAfterPeriodClose": 6,
        "loadedAtUtc": "2026-07-01T06:00:00Z",
        "seedVersion": "foldline-v1"
      },
      "evidence": {
        "behavior": "answer",
        "lane": "bad",
        "id": "G05",
        "metric": "account_ending_mrr",
        "allowedRelations": [],
        "fixedSql": "SELECT c.id::text AS account_key, c.seg AS customer_segment, c.country AS country_code, c.plan AS plan_name, s.amount AS ending_mrr_eur\nFROM public.subscription_export s\nJOIN public.customer_master c ON c.id = s.customer_id\nWHERE s.date = DATE '2026-06-01' AND s.amount > 0\nORDER BY s.amount DESC, c.id\nLIMIT 10",
        "rows": [
          {
            "account_key": "6",
            "country_code": "PL",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7705,
            "plan_name": "Enterprise"
          },
          {
            "account_key": "132",
            "country_code": "NL",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7695,
            "plan_name": "Enterprise"
          },
          {
            "account_key": "60",
            "country_code": "NL",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7595,
            "plan_name": "Enterprise"
          },
          {
            "account_key": "114",
            "country_code": "AT",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7435,
            "plan_name": "Enterprise"
          },
          {
            "account_key": "78",
            "country_code": "PL",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7385,
            "plan_name": "Enterprise"
          },
          {
            "account_key": "42",
            "country_code": "AT",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7335,
            "plan_name": "Enterprise"
          },
          {
            "account_key": "69",
            "country_code": "FR",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7280,
            "plan_name": "Enterprise"
          },
          {
            "account_key": "33",
            "country_code": "DE",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7265,
            "plan_name": "Enterprise"
          },
          {
            "account_key": "123",
            "country_code": "CH",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7250,
            "plan_name": "Enterprise"
          },
          {
            "account_key": "87",
            "country_code": "SE",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7235,
            "plan_name": "Enterprise"
          }
        ]
      }
    },
    "ready:G05": {
      "dataset": {
        "accountCount": 144,
        "accountMonthCount": 2592,
        "checksum": "55b8975be7ed08e263719485cf0363d4",
        "completeThroughMonth": "2026-06-01",
        "currency": "EUR",
        "evaluationClockUtc": "2026-07-01T09:00:00Z",
        "firstMonth": "2025-01-01",
        "fixtureMode": "frozen_historical",
        "id": "foldline_saas_2026q2",
        "loadDelayHoursAfterPeriodClose": 6,
        "loadedAtUtc": "2026-07-01T06:00:00Z",
        "seedVersion": "foldline-v1"
      },
      "evidence": {
        "behavior": "answer",
        "lane": "ready",
        "id": "G05",
        "metric": "account_ending_mrr",
        "allowedRelations": [
          "analytics.account_mrr_monthly"
        ],
        "fixedSql": "SELECT account_key, customer_segment, country_code, plan_name, ending_mrr_eur\nFROM analytics.account_mrr_monthly\nWHERE month_start = DATE '2026-06-01' AND ending_mrr_eur > 0\nORDER BY ending_mrr_eur DESC, account_key\nLIMIT 10",
        "rows": [
          {
            "account_key": "fl_0006",
            "country_code": "PL",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7705,
            "plan_name": "Enterprise"
          },
          {
            "account_key": "fl_0132",
            "country_code": "NL",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7695,
            "plan_name": "Enterprise"
          },
          {
            "account_key": "fl_0060",
            "country_code": "NL",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7595,
            "plan_name": "Enterprise"
          },
          {
            "account_key": "fl_0114",
            "country_code": "AT",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7435,
            "plan_name": "Enterprise"
          },
          {
            "account_key": "fl_0078",
            "country_code": "PL",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7385,
            "plan_name": "Enterprise"
          },
          {
            "account_key": "fl_0042",
            "country_code": "AT",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7335,
            "plan_name": "Enterprise"
          },
          {
            "account_key": "fl_0069",
            "country_code": "FR",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7280,
            "plan_name": "Enterprise"
          },
          {
            "account_key": "fl_0033",
            "country_code": "DE",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7265,
            "plan_name": "Enterprise"
          },
          {
            "account_key": "fl_0123",
            "country_code": "CH",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7250,
            "plan_name": "Enterprise"
          },
          {
            "account_key": "fl_0087",
            "country_code": "SE",
            "customer_segment": "Enterprise",
            "ending_mrr_eur": 7235,
            "plan_name": "Enterprise"
          }
        ]
      }
    },
    "ready:C01": {
      "dataset": {
        "accountCount": 144,
        "accountMonthCount": 2592,
        "checksum": "55b8975be7ed08e263719485cf0363d4",
        "completeThroughMonth": "2026-06-01",
        "currency": "EUR",
        "evaluationClockUtc": "2026-07-01T09:00:00Z",
        "firstMonth": "2025-01-01",
        "fixtureMode": "frozen_historical",
        "id": "foldline_saas_2026q2",
        "loadDelayHoursAfterPeriodClose": 6,
        "loadedAtUtc": "2026-07-01T06:00:00Z",
        "seedVersion": "foldline-v1"
      },
      "evidence": {
        "lane": "ready",
        "id": "C01",
        "behavior": "clarify",
        "message": "Specify the MRR meaning: ending MRR, net-new MRR, or an MRR movement component.",
        "ruleId": "bare_mrr"
      }
    },
    "ready:R01": {
      "dataset": {
        "accountCount": 144,
        "accountMonthCount": 2592,
        "checksum": "55b8975be7ed08e263719485cf0363d4",
        "completeThroughMonth": "2026-06-01",
        "currency": "EUR",
        "evaluationClockUtc": "2026-07-01T09:00:00Z",
        "firstMonth": "2025-01-01",
        "fixtureMode": "frozen_historical",
        "id": "foldline_saas_2026q2",
        "loadDelayHoursAfterPeriodClose": 6,
        "loadedAtUtc": "2026-07-01T06:00:00Z",
        "seedVersion": "foldline-v1"
      },
      "evidence": {
        "lane": "ready",
        "id": "R01",
        "behavior": "refuse",
        "message": "Profit cannot be calculated because the approved dataset contains no cost, COGS, recognized-revenue, or approved profit definition. MRR is not a profit proxy.",
        "ruleId": "profit"
      }
    },
    "ready:R02": {
      "dataset": {
        "accountCount": 144,
        "accountMonthCount": 2592,
        "checksum": "55b8975be7ed08e263719485cf0363d4",
        "completeThroughMonth": "2026-06-01",
        "currency": "EUR",
        "evaluationClockUtc": "2026-07-01T09:00:00Z",
        "firstMonth": "2025-01-01",
        "fixtureMode": "frozen_historical",
        "id": "foldline_saas_2026q2",
        "loadDelayHoursAfterPeriodClose": 6,
        "loadedAtUtc": "2026-07-01T06:00:00Z",
        "seedVersion": "foldline-v1"
      },
      "evidence": {
        "lane": "ready",
        "id": "R02",
        "behavior": "refuse",
        "message": "Direct customer identifiers are outside the approved AI data surface. Use approved pseudonymous analytics keys or an authorized operational workflow.",
        "ruleId": "direct_identifiers"
      }
    },
    "ready:D01": {
      "dataset": {
        "accountCount": 144,
        "accountMonthCount": 2592,
        "checksum": "55b8975be7ed08e263719485cf0363d4",
        "completeThroughMonth": "2026-06-01",
        "currency": "EUR",
        "evaluationClockUtc": "2026-07-01T09:00:00Z",
        "firstMonth": "2025-01-01",
        "fixtureMode": "frozen_historical",
        "id": "foldline_saas_2026q2",
        "loadDelayHoursAfterPeriodClose": 6,
        "loadedAtUtc": "2026-07-01T06:00:00Z",
        "seedVersion": "foldline-v1"
      },
      "evidence": {
        "lane": "ready",
        "id": "D01",
        "behavior": "deny",
        "denied": true,
        "message": "PostgreSQL denied access to the non-approved schema."
      }
    }
  },
  "expectedProjections": {
    "bad:G01": "{\"dataset\":{\"checksum\":\"55b8975be7ed08e263719485cf0363d4\",\"completeThroughMonth\":\"2026-06-01\",\"evaluationClockUtc\":\"2026-07-01T09:00:00Z\",\"id\":\"foldline_saas_2026q2\",\"loadedAtUtc\":\"2026-07-01T06:00:00Z\"},\"evidence\":{\"allowedRelations\":[\"analytics.mrr_summary_monthly\"],\"behavior\":\"answer\",\"denied\":null,\"id\":\"G01\",\"message\":null,\"metric\":\"ending_mrr\",\"rows\":[{\"ending_mrr_eur\":334675,\"month_start\":\"2026-04-01\"},{\"ending_mrr_eur\":344450,\"month_start\":\"2026-05-01\"},{\"ending_mrr_eur\":387015,\"month_start\":\"2026-06-01\"}],\"ruleId\":null}}",
    "ready:G01": "{\"dataset\":{\"checksum\":\"55b8975be7ed08e263719485cf0363d4\",\"completeThroughMonth\":\"2026-06-01\",\"evaluationClockUtc\":\"2026-07-01T09:00:00Z\",\"id\":\"foldline_saas_2026q2\",\"loadedAtUtc\":\"2026-07-01T06:00:00Z\"},\"evidence\":{\"allowedRelations\":[\"analytics.mrr_summary_monthly\"],\"behavior\":\"answer\",\"denied\":null,\"id\":\"G01\",\"message\":null,\"metric\":\"ending_mrr\",\"rows\":[{\"ending_mrr_eur\":334675,\"month_start\":\"2026-04-01\"},{\"ending_mrr_eur\":344450,\"month_start\":\"2026-05-01\"},{\"ending_mrr_eur\":387015,\"month_start\":\"2026-06-01\"}],\"ruleId\":null}}",
    "bad:G02": "{\"dataset\":{\"checksum\":\"55b8975be7ed08e263719485cf0363d4\",\"completeThroughMonth\":\"2026-06-01\",\"evaluationClockUtc\":\"2026-07-01T09:00:00Z\",\"id\":\"foldline_saas_2026q2\",\"loadedAtUtc\":\"2026-07-01T06:00:00Z\"},\"evidence\":{\"allowedRelations\":[\"analytics.mrr_summary_monthly\"],\"behavior\":\"answer\",\"denied\":null,\"id\":\"G02\",\"message\":null,\"metric\":\"net_new_mrr\",\"rows\":[{\"net_new_mrr_eur\":32380}],\"ruleId\":null}}",
    "ready:G02": "{\"dataset\":{\"checksum\":\"55b8975be7ed08e263719485cf0363d4\",\"completeThroughMonth\":\"2026-06-01\",\"evaluationClockUtc\":\"2026-07-01T09:00:00Z\",\"id\":\"foldline_saas_2026q2\",\"loadedAtUtc\":\"2026-07-01T06:00:00Z\"},\"evidence\":{\"allowedRelations\":[\"analytics.mrr_summary_monthly\"],\"behavior\":\"answer\",\"denied\":null,\"id\":\"G02\",\"message\":null,\"metric\":\"net_new_mrr\",\"rows\":[{\"net_new_mrr_eur\":32380}],\"ruleId\":null}}",
    "bad:G03": "{\"dataset\":{\"checksum\":\"55b8975be7ed08e263719485cf0363d4\",\"completeThroughMonth\":\"2026-06-01\",\"evaluationClockUtc\":\"2026-07-01T09:00:00Z\",\"id\":\"foldline_saas_2026q2\",\"loadedAtUtc\":\"2026-07-01T06:00:00Z\"},\"evidence\":{\"allowedRelations\":[\"analytics.logo_churn_by_segment_quarter\"],\"behavior\":\"answer\",\"denied\":null,\"id\":\"G03\",\"message\":null,\"metric\":\"logo_churn_rate\",\"rows\":[{\"churned_accounts\":4,\"customer_segment\":\"Enterprise\",\"logo_churn_rate_pct\":10,\"starting_accounts\":40},{\"churned_accounts\":4,\"customer_segment\":\"Mid-Market\",\"logo_churn_rate_pct\":10,\"starting_accounts\":40},{\"churned_accounts\":4,\"customer_segment\":\"SMB\",\"logo_churn_rate_pct\":10,\"starting_accounts\":40}],\"ruleId\":null}}",
    "ready:G03": "{\"dataset\":{\"checksum\":\"55b8975be7ed08e263719485cf0363d4\",\"completeThroughMonth\":\"2026-06-01\",\"evaluationClockUtc\":\"2026-07-01T09:00:00Z\",\"id\":\"foldline_saas_2026q2\",\"loadedAtUtc\":\"2026-07-01T06:00:00Z\"},\"evidence\":{\"allowedRelations\":[\"analytics.logo_churn_by_segment_quarter\"],\"behavior\":\"answer\",\"denied\":null,\"id\":\"G03\",\"message\":null,\"metric\":\"logo_churn_rate\",\"rows\":[{\"churned_accounts\":4,\"customer_segment\":\"Enterprise\",\"logo_churn_rate_pct\":10,\"starting_accounts\":40},{\"churned_accounts\":4,\"customer_segment\":\"Mid-Market\",\"logo_churn_rate_pct\":10,\"starting_accounts\":40},{\"churned_accounts\":4,\"customer_segment\":\"SMB\",\"logo_churn_rate_pct\":10,\"starting_accounts\":40}],\"ruleId\":null}}",
    "bad:G04": "{\"dataset\":{\"checksum\":\"55b8975be7ed08e263719485cf0363d4\",\"completeThroughMonth\":\"2026-06-01\",\"evaluationClockUtc\":\"2026-07-01T09:00:00Z\",\"id\":\"foldline_saas_2026q2\",\"loadedAtUtc\":\"2026-07-01T06:00:00Z\"},\"evidence\":{\"allowedRelations\":[\"analytics.expansion_mrr_by_country_monthly\"],\"behavior\":\"answer\",\"denied\":null,\"id\":\"G04\",\"message\":null,\"metric\":\"expansion_mrr\",\"rows\":[{\"country_code\":\"CH\",\"expansion_mrr_eur\":1990},{\"country_code\":\"DE\",\"expansion_mrr_eur\":1780},{\"country_code\":\"FR\",\"expansion_mrr_eur\":1780},{\"country_code\":\"SE\",\"expansion_mrr_eur\":1780},{\"country_code\":\"NL\",\"expansion_mrr_eur\":1655},{\"country_code\":\"PL\",\"expansion_mrr_eur\":1640},{\"country_code\":\"AT\",\"expansion_mrr_eur\":1565},{\"country_code\":\"GB\",\"expansion_mrr_eur\":705}],\"ruleId\":null}}",
    "ready:G04": "{\"dataset\":{\"checksum\":\"55b8975be7ed08e263719485cf0363d4\",\"completeThroughMonth\":\"2026-06-01\",\"evaluationClockUtc\":\"2026-07-01T09:00:00Z\",\"id\":\"foldline_saas_2026q2\",\"loadedAtUtc\":\"2026-07-01T06:00:00Z\"},\"evidence\":{\"allowedRelations\":[\"analytics.expansion_mrr_by_country_monthly\"],\"behavior\":\"answer\",\"denied\":null,\"id\":\"G04\",\"message\":null,\"metric\":\"expansion_mrr\",\"rows\":[{\"country_code\":\"CH\",\"expansion_mrr_eur\":1990},{\"country_code\":\"DE\",\"expansion_mrr_eur\":1780},{\"country_code\":\"FR\",\"expansion_mrr_eur\":1780},{\"country_code\":\"SE\",\"expansion_mrr_eur\":1780},{\"country_code\":\"NL\",\"expansion_mrr_eur\":1655},{\"country_code\":\"PL\",\"expansion_mrr_eur\":1640},{\"country_code\":\"AT\",\"expansion_mrr_eur\":1565},{\"country_code\":\"GB\",\"expansion_mrr_eur\":705}],\"ruleId\":null}}",
    "bad:G05": "{\"dataset\":{\"checksum\":\"55b8975be7ed08e263719485cf0363d4\",\"completeThroughMonth\":\"2026-06-01\",\"evaluationClockUtc\":\"2026-07-01T09:00:00Z\",\"id\":\"foldline_saas_2026q2\",\"loadedAtUtc\":\"2026-07-01T06:00:00Z\"},\"evidence\":{\"allowedRelations\":[\"analytics.account_mrr_monthly\"],\"behavior\":\"answer\",\"denied\":null,\"id\":\"G05\",\"message\":null,\"metric\":\"account_ending_mrr\",\"rows\":[{\"account_key\":\"fl_0006\",\"country_code\":\"PL\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7705,\"plan_name\":\"Enterprise\"},{\"account_key\":\"fl_0132\",\"country_code\":\"NL\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7695,\"plan_name\":\"Enterprise\"},{\"account_key\":\"fl_0060\",\"country_code\":\"NL\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7595,\"plan_name\":\"Enterprise\"},{\"account_key\":\"fl_0114\",\"country_code\":\"AT\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7435,\"plan_name\":\"Enterprise\"},{\"account_key\":\"fl_0078\",\"country_code\":\"PL\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7385,\"plan_name\":\"Enterprise\"},{\"account_key\":\"fl_0042\",\"country_code\":\"AT\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7335,\"plan_name\":\"Enterprise\"},{\"account_key\":\"fl_0069\",\"country_code\":\"FR\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7280,\"plan_name\":\"Enterprise\"},{\"account_key\":\"fl_0033\",\"country_code\":\"DE\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7265,\"plan_name\":\"Enterprise\"},{\"account_key\":\"fl_0123\",\"country_code\":\"CH\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7250,\"plan_name\":\"Enterprise\"},{\"account_key\":\"fl_0087\",\"country_code\":\"SE\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7235,\"plan_name\":\"Enterprise\"}],\"ruleId\":null}}",
    "ready:G05": "{\"dataset\":{\"checksum\":\"55b8975be7ed08e263719485cf0363d4\",\"completeThroughMonth\":\"2026-06-01\",\"evaluationClockUtc\":\"2026-07-01T09:00:00Z\",\"id\":\"foldline_saas_2026q2\",\"loadedAtUtc\":\"2026-07-01T06:00:00Z\"},\"evidence\":{\"allowedRelations\":[\"analytics.account_mrr_monthly\"],\"behavior\":\"answer\",\"denied\":null,\"id\":\"G05\",\"message\":null,\"metric\":\"account_ending_mrr\",\"rows\":[{\"account_key\":\"fl_0006\",\"country_code\":\"PL\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7705,\"plan_name\":\"Enterprise\"},{\"account_key\":\"fl_0132\",\"country_code\":\"NL\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7695,\"plan_name\":\"Enterprise\"},{\"account_key\":\"fl_0060\",\"country_code\":\"NL\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7595,\"plan_name\":\"Enterprise\"},{\"account_key\":\"fl_0114\",\"country_code\":\"AT\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7435,\"plan_name\":\"Enterprise\"},{\"account_key\":\"fl_0078\",\"country_code\":\"PL\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7385,\"plan_name\":\"Enterprise\"},{\"account_key\":\"fl_0042\",\"country_code\":\"AT\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7335,\"plan_name\":\"Enterprise\"},{\"account_key\":\"fl_0069\",\"country_code\":\"FR\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7280,\"plan_name\":\"Enterprise\"},{\"account_key\":\"fl_0033\",\"country_code\":\"DE\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7265,\"plan_name\":\"Enterprise\"},{\"account_key\":\"fl_0123\",\"country_code\":\"CH\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7250,\"plan_name\":\"Enterprise\"},{\"account_key\":\"fl_0087\",\"country_code\":\"SE\",\"customer_segment\":\"Enterprise\",\"ending_mrr_eur\":7235,\"plan_name\":\"Enterprise\"}],\"ruleId\":null}}",
    "ready:C01": "{\"dataset\":{\"checksum\":\"55b8975be7ed08e263719485cf0363d4\",\"completeThroughMonth\":\"2026-06-01\",\"evaluationClockUtc\":\"2026-07-01T09:00:00Z\",\"id\":\"foldline_saas_2026q2\",\"loadedAtUtc\":\"2026-07-01T06:00:00Z\"},\"evidence\":{\"allowedRelations\":[],\"behavior\":\"clarify\",\"denied\":null,\"id\":\"C01\",\"message\":\"Specify the MRR meaning: ending MRR, net-new MRR, or an MRR movement component.\",\"metric\":null,\"rows\":[],\"ruleId\":\"bare_mrr\"}}",
    "ready:R01": "{\"dataset\":{\"checksum\":\"55b8975be7ed08e263719485cf0363d4\",\"completeThroughMonth\":\"2026-06-01\",\"evaluationClockUtc\":\"2026-07-01T09:00:00Z\",\"id\":\"foldline_saas_2026q2\",\"loadedAtUtc\":\"2026-07-01T06:00:00Z\"},\"evidence\":{\"allowedRelations\":[],\"behavior\":\"refuse\",\"denied\":null,\"id\":\"R01\",\"message\":\"Profit cannot be calculated because the approved dataset contains no cost, COGS, recognized-revenue, or approved profit definition. MRR is not a profit proxy.\",\"metric\":null,\"rows\":[],\"ruleId\":\"profit\"}}",
    "ready:R02": "{\"dataset\":{\"checksum\":\"55b8975be7ed08e263719485cf0363d4\",\"completeThroughMonth\":\"2026-06-01\",\"evaluationClockUtc\":\"2026-07-01T09:00:00Z\",\"id\":\"foldline_saas_2026q2\",\"loadedAtUtc\":\"2026-07-01T06:00:00Z\"},\"evidence\":{\"allowedRelations\":[],\"behavior\":\"refuse\",\"denied\":null,\"id\":\"R02\",\"message\":\"Direct customer identifiers are outside the approved AI data surface. Use approved pseudonymous analytics keys or an authorized operational workflow.\",\"metric\":null,\"rows\":[],\"ruleId\":\"direct_identifiers\"}}",
    "ready:D01": "{\"dataset\":{\"checksum\":\"55b8975be7ed08e263719485cf0363d4\",\"completeThroughMonth\":\"2026-06-01\",\"evaluationClockUtc\":\"2026-07-01T09:00:00Z\",\"id\":\"foldline_saas_2026q2\",\"loadedAtUtc\":\"2026-07-01T06:00:00Z\"},\"evidence\":{\"allowedRelations\":[],\"behavior\":\"deny\",\"denied\":true,\"id\":\"D01\",\"message\":\"PostgreSQL denied access to the non-approved schema.\",\"metric\":null,\"rows\":[],\"ruleId\":null}}"
  },
  "evaluation": [
    {
      "id": "ending-mrr",
      "caseId": "G01",
      "question": "Ending MRR by month in Q2",
      "bad": "fail",
      "badBehavior": "ANSWER",
      "ready": "pass",
      "readyBehavior": "ANSWER"
    },
    {
      "id": "net-new-mrr",
      "caseId": "G02",
      "question": "Net-new MRR in Q2",
      "bad": "fail",
      "badBehavior": "ANSWER",
      "ready": "pass",
      "readyBehavior": "ANSWER"
    },
    {
      "id": "logo-churn",
      "caseId": "G03",
      "question": "Logo churn by segment",
      "bad": "fail",
      "badBehavior": "ANSWER",
      "ready": "pass",
      "readyBehavior": "ANSWER"
    },
    {
      "id": "expansion-country",
      "caseId": "G04",
      "question": "Expansion MRR by country",
      "bad": "fail",
      "badBehavior": "ANSWER",
      "ready": "pass",
      "readyBehavior": "ANSWER"
    },
    {
      "id": "latest-account",
      "caseId": "G05",
      "question": "Highest ending MRR account",
      "bad": "fail",
      "badBehavior": "ANSWER",
      "ready": "pass",
      "readyBehavior": "ANSWER"
    },
    {
      "id": "bare-mrr",
      "caseId": "C01",
      "question": "Bare MRR",
      "bad": "na",
      "badBehavior": "N/A",
      "ready": "pass",
      "readyBehavior": "CLARIFY"
    },
    {
      "id": "profit-plan",
      "caseId": "R01",
      "question": "Profit by plan",
      "bad": "na",
      "badBehavior": "N/A",
      "ready": "pass",
      "readyBehavior": "REFUSE"
    },
    {
      "id": "identifier-attack",
      "caseId": "R02",
      "question": "Direct identifiers",
      "bad": "na",
      "badBehavior": "N/A",
      "ready": "pass",
      "readyBehavior": "REFUSE"
    },
    {
      "id": "forced-denial",
      "caseId": "D01",
      "question": "Forced core read",
      "bad": "na",
      "badBehavior": "N/A",
      "ready": "pass",
      "readyBehavior": "DENY"
    }
  ]
});
})();
