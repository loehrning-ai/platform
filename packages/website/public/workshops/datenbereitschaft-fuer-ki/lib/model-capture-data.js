/* Generated from demo/evals/ask-claude-trials.json and demo/generated/ask/connections.template.json. */
(() => {
  const deepFreeze = (value) => {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.getOwnPropertyNames(value).forEach((key) => deepFreeze(value[key]));
    return Object.freeze(value);
  };
  window.FOLDLINE_MODEL_CAPTURES = deepFreeze({
  "version": 2,
  "label": "MODEL CAPTURE",
  "evidenceClass": "one_run_model_observation",
  "sourceSha256": "b03b0b671b986b8fe2ee9537131af782cf6c1a522edf64e7159b21d8c5afcf8c",
  "capturedAtUtc": "2026-08-23T11:49:52.374Z",
  "declaredCodeAnchor": "feat/gdra-absorption@4a9fcedf5b0d392f98b4f99fecdc7185ebd66f05",
  "protocol": {
    "abortedDefaultProbe": {
      "cacheOrResultLookupReached": false,
      "caseId": "G01",
      "lane": "bad",
      "note": "The initial default-behavior probe stopped at Ask's ambiguity pre-pass. No response text is retained or reconstructed.",
      "outcome": "ambiguity_prepass_stopped_before_sql",
      "responseTextRecorded": false,
      "resultReturned": false,
      "settings": {
        "execute": true,
        "highAccuracy": false,
        "history": [],
        "skipClarify": false
      },
      "sqlGenerated": false
    },
    "askDefaultBehavior": false,
    "mode": "forced_direct_answer_comparison",
    "settings": {
      "execute": true,
      "highAccuracy": false,
      "history": [],
      "skipClarify": true
    }
  },
  "route": {
    "ask": "Ask 3210",
    "bridge": "bridge 8789",
    "model": "claude-cli",
    "postgres": "PG 55432",
    "label": "Ask 3210 → bridge 8789 → claude-cli → PG 55432"
  },
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
  "summary": {
    "bad": {
      "metricCitationPasses": null,
      "readyEvidencePasses": null,
      "relationCorrectnessPasses": null,
      "trials": 3,
      "uncachedRealClaude": 3,
      "valueCorrectnessPasses": 0,
      "verifiedQueryEvidencePasses": null
    },
    "ready": {
      "metricCitationPasses": 0,
      "readyEvidencePasses": 0,
      "relationCorrectnessPasses": 3,
      "trials": 3,
      "uncachedRealClaude": 3,
      "valueCorrectnessPasses": 3,
      "verifiedQueryEvidencePasses": 3
    },
    "totalTrials": 6,
    "uncachedRealClaude": 6
  },
  "captures": {
    "bad:G01": {
      "key": "bad:G01",
      "caseId": "G01",
      "lane": "bad",
      "label": "MODEL CAPTURE",
      "question": "Show ending MRR by month for the last complete quarter.",
      "capturedAtUtc": "2026-08-23T11:49:52.374Z",
      "protocol": {
        "mode": "forced_direct_answer_comparison",
        "skipClarify": true,
        "askDefaultBehavior": false,
        "label": "FORCED DIRECT ANSWER · skipClarify=true · NOT ASK DEFAULT"
      },
      "route": {
        "ask": "Ask 3210",
        "bridge": "bridge 8789",
        "model": "claude-cli",
        "postgres": "PG 55432",
        "label": "Ask 3210 → bridge 8789 → claude-cli → PG 55432"
      },
      "connection": {
        "name": "Data Readiness - Bad",
        "database": "saas_bad",
        "searchPath": [
          "public"
        ]
      },
      "provider": "openai-compatible",
      "model": "claude-cli",
      "cached": false,
      "relation": [
        "public.monthly_revenue"
      ],
      "relationResolution": {
        "canonicalRelations": [
          "public.monthly_revenue"
        ],
        "method": "qualified_sql_plus_ask_lineage_search_path",
        "searchPath": [
          "public"
        ],
        "sqlQualifiedRelations": [],
        "unqualifiedLineageTables": [
          "monthly_revenue"
        ]
      },
      "displayValue": "Apr −€19,960 · May €9,775 · Jun €42,565",
      "columns": [
        "revenue_month",
        "ending_mrr"
      ],
      "rows": [
        {
          "ending_mrr": "-19960.00",
          "revenue_month": "2026-03-31T22:00:00.000Z"
        },
        {
          "ending_mrr": "9775.00",
          "revenue_month": "2026-04-30T22:00:00.000Z"
        },
        {
          "ending_mrr": "42565.00",
          "revenue_month": "2026-05-31T22:00:00.000Z"
        }
      ],
      "sql": "WITH monthly_totals AS (\n    SELECT\n        DATE_TRUNC('month', mr.dt)::date AS revenue_month,\n        SUM(mr.amount) AS mrr\n    FROM monthly_revenue AS mr\n    WHERE mr.dt >= DATE '2026-04-01'\n      AND mr.dt < DATE '2026-07-01'\n    GROUP BY DATE_TRUNC('month', mr.dt)\n)\nSELECT\n    mt.revenue_month,\n    mt.mrr AS ending_mrr\nFROM monthly_totals AS mt\nORDER BY mt.revenue_month",
      "latency": {
        "executeMs": 5,
        "generateMs": 16545,
        "planMs": 14,
        "totalMs": 16633,
        "validateMs": 11
      },
      "verified": {
        "certified": false,
        "matchScore": null,
        "usedQueryId": null
      },
      "metrics": {
        "citations": [],
        "expectedSlug": "ending_mrr"
      },
      "grade": {
        "behaviorMatchesExpected": true,
        "captureRequirementsPass": true,
        "columnsMatchExpected": false,
        "correctnessPass": false,
        "expectedBehavior": "answer",
        "governedEvidencePass": null,
        "metricCitationMatchesExpected": null,
        "metricCitationPresent": null,
        "readyEvidencePass": null,
        "relationCorrectnessPass": null,
        "relationsMatchExpected": null,
        "rowOrderMatchesExpected": false,
        "rowsMatchExpected": false,
        "valueCorrectnessPass": false,
        "verifiedQueryEvidencePresent": null
      },
      "datasetChecksum": "55b8975be7ed08e263719485cf0363d4"
    },
    "ready:G01": {
      "key": "ready:G01",
      "caseId": "G01",
      "lane": "ready",
      "label": "MODEL CAPTURE",
      "question": "Show ending MRR by month for the last complete quarter.",
      "capturedAtUtc": "2026-08-23T11:49:52.374Z",
      "protocol": {
        "mode": "forced_direct_answer_comparison",
        "skipClarify": true,
        "askDefaultBehavior": false,
        "label": "FORCED DIRECT ANSWER · skipClarify=true · NOT ASK DEFAULT"
      },
      "route": {
        "ask": "Ask 3210",
        "bridge": "bridge 8789",
        "model": "claude-cli",
        "postgres": "PG 55432",
        "label": "Ask 3210 → bridge 8789 → claude-cli → PG 55432"
      },
      "connection": {
        "name": "Data Readiness - Ready",
        "database": "saas_ready",
        "searchPath": [
          "analytics",
          "public"
        ]
      },
      "provider": "openai-compatible",
      "model": "claude-cli",
      "cached": false,
      "relation": [
        "analytics.mrr_summary_monthly"
      ],
      "relationResolution": {
        "canonicalRelations": [
          "analytics.mrr_summary_monthly"
        ],
        "method": "qualified_sql_plus_ask_lineage_search_path",
        "searchPath": [
          "analytics",
          "public"
        ],
        "sqlQualifiedRelations": [],
        "unqualifiedLineageTables": [
          "mrr_summary_monthly"
        ]
      },
      "displayValue": "Apr €334,675 · May €344,450 · Jun €387,015",
      "columns": [
        "month_start",
        "ending_mrr_eur"
      ],
      "rows": [
        {
          "ending_mrr_eur": "334675.00",
          "month_start": "2026-03-31T22:00:00.000Z"
        },
        {
          "ending_mrr_eur": "344450.00",
          "month_start": "2026-04-30T22:00:00.000Z"
        },
        {
          "ending_mrr_eur": "387015.00",
          "month_start": "2026-05-31T22:00:00.000Z"
        }
      ],
      "sql": "SELECT\n    mrr_summary_monthly.month_start,\n    mrr_summary_monthly.ending_mrr_eur\nFROM mrr_summary_monthly AS mrr_summary_monthly\nWHERE mrr_summary_monthly.month_start >= DATE '2026-04-01'\n  AND mrr_summary_monthly.month_start < DATE '2026-07-01'\nORDER BY mrr_summary_monthly.month_start",
      "latency": {
        "executeMs": 6,
        "generateMs": 12767,
        "planMs": 9,
        "totalMs": 12827,
        "validateMs": 5
      },
      "verified": {
        "certified": true,
        "matchScore": 1.0000000000000002,
        "usedQueryId": 1
      },
      "metrics": {
        "citations": [],
        "expectedSlug": "ending_mrr"
      },
      "grade": {
        "behaviorMatchesExpected": true,
        "captureRequirementsPass": true,
        "columnsMatchExpected": true,
        "correctnessPass": true,
        "expectedBehavior": "answer",
        "governedEvidencePass": false,
        "metricCitationMatchesExpected": false,
        "metricCitationPresent": false,
        "readyEvidencePass": false,
        "relationCorrectnessPass": true,
        "relationsMatchExpected": true,
        "rowOrderMatchesExpected": true,
        "rowsMatchExpected": true,
        "valueCorrectnessPass": true,
        "verifiedQueryEvidencePresent": true
      },
      "datasetChecksum": "55b8975be7ed08e263719485cf0363d4"
    },
    "bad:G02": {
      "key": "bad:G02",
      "caseId": "G02",
      "lane": "bad",
      "label": "MODEL CAPTURE",
      "question": "What was net new MRR in the last complete quarter?",
      "capturedAtUtc": "2026-08-23T11:49:52.374Z",
      "protocol": {
        "mode": "forced_direct_answer_comparison",
        "skipClarify": true,
        "askDefaultBehavior": false,
        "label": "FORCED DIRECT ANSWER · skipClarify=true · NOT ASK DEFAULT"
      },
      "route": {
        "ask": "Ask 3210",
        "bridge": "bridge 8789",
        "model": "claude-cli",
        "postgres": "PG 55432",
        "label": "Ask 3210 → bridge 8789 → claude-cli → PG 55432"
      },
      "connection": {
        "name": "Data Readiness - Bad",
        "database": "saas_bad",
        "searchPath": [
          "public"
        ]
      },
      "provider": "openai-compatible",
      "model": "claude-cli",
      "cached": false,
      "relation": [
        "public.monthly_revenue"
      ],
      "relationResolution": {
        "canonicalRelations": [
          "public.monthly_revenue"
        ],
        "method": "qualified_sql_plus_ask_lineage_search_path",
        "searchPath": [
          "public"
        ],
        "sqlQualifiedRelations": [],
        "unqualifiedLineageTables": [
          "monthly_revenue"
        ]
      },
      "displayValue": "−€17,595",
      "columns": [
        "end_of_last_quarter_mrr",
        "end_of_prior_quarter_mrr",
        "net_new_mrr"
      ],
      "rows": [
        {
          "end_of_last_quarter_mrr": "42565.00",
          "end_of_prior_quarter_mrr": "60160.00",
          "net_new_mrr": "-17595.00"
        }
      ],
      "sql": "WITH end_of_last_quarter AS (\n    SELECT\n        COALESCE(SUM(monthly_revenue.amount), 0) AS mrr\n    FROM monthly_revenue\n    WHERE monthly_revenue.dt >= DATE '2026-06-01'\n      AND monthly_revenue.dt < DATE '2026-07-01'\n),\nend_of_prior_quarter AS (\n    SELECT\n        COALESCE(SUM(monthly_revenue.amount), 0) AS mrr\n    FROM monthly_revenue\n    WHERE monthly_revenue.dt >= DATE '2026-03-01'\n      AND monthly_revenue.dt < DATE '2026-04-01'\n)\nSELECT\n    end_of_last_quarter.mrr AS end_of_last_quarter_mrr,\n    end_of_prior_quarter.mrr AS end_of_prior_quarter_mrr,\n    end_of_last_quarter.mrr - end_of_prior_quarter.mrr AS net_new_mrr\nFROM end_of_last_quarter\nCROSS JOIN end_of_prior_quarter",
      "latency": {
        "executeMs": 4,
        "generateMs": 26955,
        "planMs": 9,
        "totalMs": 27016,
        "validateMs": 7
      },
      "verified": {
        "certified": false,
        "matchScore": null,
        "usedQueryId": null
      },
      "metrics": {
        "citations": [],
        "expectedSlug": "net_new_mrr"
      },
      "grade": {
        "behaviorMatchesExpected": true,
        "captureRequirementsPass": true,
        "columnsMatchExpected": false,
        "correctnessPass": false,
        "expectedBehavior": "answer",
        "governedEvidencePass": null,
        "metricCitationMatchesExpected": null,
        "metricCitationPresent": null,
        "readyEvidencePass": null,
        "relationCorrectnessPass": null,
        "relationsMatchExpected": null,
        "rowOrderMatchesExpected": false,
        "rowsMatchExpected": false,
        "valueCorrectnessPass": false,
        "verifiedQueryEvidencePresent": null
      },
      "datasetChecksum": "55b8975be7ed08e263719485cf0363d4"
    },
    "ready:G02": {
      "key": "ready:G02",
      "caseId": "G02",
      "lane": "ready",
      "label": "MODEL CAPTURE",
      "question": "What was net new MRR in the last complete quarter?",
      "capturedAtUtc": "2026-08-23T11:49:52.374Z",
      "protocol": {
        "mode": "forced_direct_answer_comparison",
        "skipClarify": true,
        "askDefaultBehavior": false,
        "label": "FORCED DIRECT ANSWER · skipClarify=true · NOT ASK DEFAULT"
      },
      "route": {
        "ask": "Ask 3210",
        "bridge": "bridge 8789",
        "model": "claude-cli",
        "postgres": "PG 55432",
        "label": "Ask 3210 → bridge 8789 → claude-cli → PG 55432"
      },
      "connection": {
        "name": "Data Readiness - Ready",
        "database": "saas_ready",
        "searchPath": [
          "analytics",
          "public"
        ]
      },
      "provider": "openai-compatible",
      "model": "claude-cli",
      "cached": false,
      "relation": [
        "analytics.mrr_summary_monthly"
      ],
      "relationResolution": {
        "canonicalRelations": [
          "analytics.mrr_summary_monthly"
        ],
        "method": "qualified_sql_plus_ask_lineage_search_path",
        "searchPath": [
          "analytics",
          "public"
        ],
        "sqlQualifiedRelations": [
          "analytics.mrr_summary_monthly"
        ],
        "unqualifiedLineageTables": [
          "mrr_summary_monthly"
        ]
      },
      "displayValue": "€32,380",
      "columns": [
        "net_new_mrr_eur"
      ],
      "rows": [
        {
          "net_new_mrr_eur": "32380.00"
        }
      ],
      "sql": "SELECT SUM(mrr_summary_monthly.net_new_mrr_eur)::numeric(14,2) AS net_new_mrr_eur\nFROM analytics.mrr_summary_monthly AS mrr_summary_monthly\nWHERE mrr_summary_monthly.month_start >= DATE '2026-04-01'\n  AND mrr_summary_monthly.month_start < DATE '2026-07-01'",
      "latency": {
        "executeMs": 6,
        "generateMs": 11159,
        "planMs": 11,
        "totalMs": 11246,
        "validateMs": 4
      },
      "verified": {
        "certified": true,
        "matchScore": 1.0000000000000002,
        "usedQueryId": 2
      },
      "metrics": {
        "citations": [],
        "expectedSlug": "net_new_mrr"
      },
      "grade": {
        "behaviorMatchesExpected": true,
        "captureRequirementsPass": true,
        "columnsMatchExpected": true,
        "correctnessPass": true,
        "expectedBehavior": "answer",
        "governedEvidencePass": false,
        "metricCitationMatchesExpected": false,
        "metricCitationPresent": false,
        "readyEvidencePass": false,
        "relationCorrectnessPass": true,
        "relationsMatchExpected": true,
        "rowOrderMatchesExpected": true,
        "rowsMatchExpected": true,
        "valueCorrectnessPass": true,
        "verifiedQueryEvidencePresent": true
      },
      "datasetChecksum": "55b8975be7ed08e263719485cf0363d4"
    },
    "bad:G03": {
      "key": "bad:G03",
      "caseId": "G03",
      "lane": "bad",
      "label": "MODEL CAPTURE",
      "question": "What was logo churn rate by customer segment in the last complete quarter?",
      "capturedAtUtc": "2026-08-23T11:49:52.374Z",
      "protocol": {
        "mode": "forced_direct_answer_comparison",
        "skipClarify": true,
        "askDefaultBehavior": false,
        "label": "FORCED DIRECT ANSWER · skipClarify=true · NOT ASK DEFAULT"
      },
      "route": {
        "ask": "Ask 3210",
        "bridge": "bridge 8789",
        "model": "claude-cli",
        "postgres": "PG 55432",
        "label": "Ask 3210 → bridge 8789 → claude-cli → PG 55432"
      },
      "connection": {
        "name": "Data Readiness - Bad",
        "database": "saas_bad",
        "searchPath": [
          "public"
        ]
      },
      "provider": "openai-compatible",
      "model": "claude-cli",
      "cached": false,
      "relation": [
        "public.acct_history",
        "public.customer_master"
      ],
      "relationResolution": {
        "canonicalRelations": [
          "public.acct_history",
          "public.customer_master"
        ],
        "method": "qualified_sql_plus_ask_lineage_search_path",
        "searchPath": [
          "public"
        ],
        "sqlQualifiedRelations": [],
        "unqualifiedLineageTables": [
          "acct_history",
          "customer_master"
        ]
      },
      "displayValue": "Enterprise 0/0 → — · Mid-Market 0/0 → — · SMB 0/0 → —",
      "columns": [
        "segment",
        "active_start_count",
        "churned_count",
        "logo_churn_rate"
      ],
      "rows": [
        {
          "active_start_count": "0",
          "churned_count": "0",
          "logo_churn_rate": null,
          "segment": "Enterprise"
        },
        {
          "active_start_count": "0",
          "churned_count": "0",
          "logo_churn_rate": null,
          "segment": "Mid-Market"
        },
        {
          "active_start_count": "0",
          "churned_count": "0",
          "logo_churn_rate": null,
          "segment": "SMB"
        }
      ],
      "sql": "WITH start_state AS (\n    SELECT DISTINCT ON (ah.id)\n        ah.id,\n        ah.state AS state_start\n    FROM acct_history AS ah\n    WHERE ah.dt <= DATE '2026-03-31'\n    ORDER BY ah.id, ah.dt DESC\n),\nend_state AS (\n    SELECT DISTINCT ON (ah.id)\n        ah.id,\n        ah.state AS state_end\n    FROM acct_history AS ah\n    WHERE ah.dt <= DATE '2026-06-30'\n    ORDER BY ah.id, ah.dt DESC\n),\ncustomer_states AS (\n    SELECT\n        ss.id,\n        ss.state_start,\n        es.state_end\n    FROM start_state AS ss\n    LEFT JOIN end_state AS es\n        ON es.id = ss.id\n),\nchurn_calc AS (\n    SELECT\n        cm.seg AS segment,\n        COUNT(DISTINCT CASE WHEN cs.state_start = 'active' THEN cs.id END) AS active_start_count,\n        COUNT(DISTINCT CASE\n            WHEN cs.state_start = 'active' AND cs.state_end IS DISTINCT FROM 'active'\n            THEN cs.id\n        END) AS churned_count\n    FROM customer_states AS cs\n    INNER JOIN customer_master AS cm\n        ON cm.id = cs.id\n    GROUP BY cm.seg\n)\nSELECT\n    churn_calc.segment,\n    churn_calc.active_start_count,\n    churn_calc.churned_count,\n    ROUND(churn_calc.churned_count * 1.0 / NULLIF(churn_calc.active_start_count, 0), 4) AS logo_churn_rate\nFROM churn_calc\nORDER BY churn_calc.segment",
      "latency": {
        "executeMs": 11,
        "generateMs": 56979,
        "planMs": 9,
        "totalMs": 57131,
        "validateMs": 43
      },
      "verified": {
        "certified": false,
        "matchScore": null,
        "usedQueryId": null
      },
      "metrics": {
        "citations": [],
        "expectedSlug": "logo_churn_rate"
      },
      "grade": {
        "behaviorMatchesExpected": true,
        "captureRequirementsPass": true,
        "columnsMatchExpected": false,
        "correctnessPass": false,
        "expectedBehavior": "answer",
        "governedEvidencePass": null,
        "metricCitationMatchesExpected": null,
        "metricCitationPresent": null,
        "readyEvidencePass": null,
        "relationCorrectnessPass": null,
        "relationsMatchExpected": null,
        "rowOrderMatchesExpected": false,
        "rowsMatchExpected": false,
        "valueCorrectnessPass": false,
        "verifiedQueryEvidencePresent": null
      },
      "datasetChecksum": "55b8975be7ed08e263719485cf0363d4"
    },
    "ready:G03": {
      "key": "ready:G03",
      "caseId": "G03",
      "lane": "ready",
      "label": "MODEL CAPTURE",
      "question": "What was logo churn rate by customer segment in the last complete quarter?",
      "capturedAtUtc": "2026-08-23T11:49:52.374Z",
      "protocol": {
        "mode": "forced_direct_answer_comparison",
        "skipClarify": true,
        "askDefaultBehavior": false,
        "label": "FORCED DIRECT ANSWER · skipClarify=true · NOT ASK DEFAULT"
      },
      "route": {
        "ask": "Ask 3210",
        "bridge": "bridge 8789",
        "model": "claude-cli",
        "postgres": "PG 55432",
        "label": "Ask 3210 → bridge 8789 → claude-cli → PG 55432"
      },
      "connection": {
        "name": "Data Readiness - Ready",
        "database": "saas_ready",
        "searchPath": [
          "analytics",
          "public"
        ]
      },
      "provider": "openai-compatible",
      "model": "claude-cli",
      "cached": false,
      "relation": [
        "analytics.logo_churn_by_segment_quarter"
      ],
      "relationResolution": {
        "canonicalRelations": [
          "analytics.logo_churn_by_segment_quarter"
        ],
        "method": "qualified_sql_plus_ask_lineage_search_path",
        "searchPath": [
          "analytics",
          "public"
        ],
        "sqlQualifiedRelations": [
          "analytics.logo_churn_by_segment_quarter"
        ],
        "unqualifiedLineageTables": [
          "logo_churn_by_segment_quarter"
        ]
      },
      "displayValue": "Enterprise 4/40 → 10.00% · Mid-Market 4/40 → 10.00% · SMB 4/40 → 10.00%",
      "columns": [
        "customer_segment",
        "starting_accounts",
        "churned_accounts",
        "logo_churn_rate_pct"
      ],
      "rows": [
        {
          "churned_accounts": "4",
          "customer_segment": "Enterprise",
          "logo_churn_rate_pct": "10.00",
          "starting_accounts": "40"
        },
        {
          "churned_accounts": "4",
          "customer_segment": "Mid-Market",
          "logo_churn_rate_pct": "10.00",
          "starting_accounts": "40"
        },
        {
          "churned_accounts": "4",
          "customer_segment": "SMB",
          "logo_churn_rate_pct": "10.00",
          "starting_accounts": "40"
        }
      ],
      "sql": "SELECT\n  lcsq.customer_segment,\n  lcsq.starting_accounts,\n  lcsq.churned_accounts,\n  lcsq.logo_churn_rate_pct\nFROM analytics.logo_churn_by_segment_quarter AS lcsq\nWHERE lcsq.period_start = DATE '2026-04-01'\n  AND lcsq.period_end_exclusive = DATE '2026-07-01'\nORDER BY lcsq.customer_segment",
      "latency": {
        "executeMs": 9,
        "generateMs": 12095,
        "planMs": 14,
        "totalMs": 12195,
        "validateMs": 4
      },
      "verified": {
        "certified": true,
        "matchScore": 0.9999999999999999,
        "usedQueryId": 3
      },
      "metrics": {
        "citations": [],
        "expectedSlug": "logo_churn_rate"
      },
      "grade": {
        "behaviorMatchesExpected": true,
        "captureRequirementsPass": true,
        "columnsMatchExpected": true,
        "correctnessPass": true,
        "expectedBehavior": "answer",
        "governedEvidencePass": false,
        "metricCitationMatchesExpected": false,
        "metricCitationPresent": false,
        "readyEvidencePass": false,
        "relationCorrectnessPass": true,
        "relationsMatchExpected": true,
        "rowOrderMatchesExpected": true,
        "rowsMatchExpected": true,
        "valueCorrectnessPass": true,
        "verifiedQueryEvidencePresent": true
      },
      "datasetChecksum": "55b8975be7ed08e263719485cf0363d4"
    }
  }
});
})();
