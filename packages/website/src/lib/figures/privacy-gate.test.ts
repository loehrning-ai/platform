/**
 * Privacy gate for frozen figure files (mirror of the private analysis gate).
 *
 * Runs on every figure JSON that is copied into the repo later, and on a
 * frozen-manifest.json next to them. It checks the schema allowlist, k = 5,
 * enumerated ids and labels, and the content denylist. It cannot do the hash
 * check against the private databases; that check runs before a file leaves
 * the private analysis folder.
 *
 * Where it looks: content/books/ki-landschaft/figures, content/books/ki-landschaft/frozen,
 * src/lib/figures/frozen, and the folder in BOOK_FROZEN_DIR. A folder that does
 * not exist is skipped, so the test passes before the first file arrives.
 *
 * The block between the GATE_CONFIG markers is written by the private gate
 * (privacy_gate.py --write-ts) and compared by --check-ts. Do not edit it by hand.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { findPrivacyFindings, parseFigureSpec } from "./validate.ts";

/* GATE_CONFIG_BEGIN */
export const GATE_CONFIG = {
  "countKeys": [
    "n",
    "hits",
    "count",
    "dots_of_firms",
    "postings",
    "employers"
  ],
  "deny": [
    [
      [
        "[\\w.+-]+@[\\w-]+\\.[\\w.-]+"
      ],
      "e-mail address"
    ],
    [
      [
        "https?://"
      ],
      "URL"
    ],
    [
      [
        "\\bwww\\."
      ],
      "web address"
    ],
    [
      [
        "(?:\\+|\\b00)\\d[\\d\\s/()-]{7,}"
      ],
      "phone number"
    ],
    [
      [
        "\\b0\\d{2,5}[\\s/-]\\d{4,}"
      ],
      "German phone number"
    ],
    [
      [
        "\\b\\d{9,}\\b"
      ],
      "long digit string"
    ],
    [
      [
        "\\b[a-z0-9][a-z0-9-]*\\.(?:de|com|org|net|io|ai|eu|info|biz|at|ch|co|app|dev)\\b"
      ],
      "domain name"
    ],
    [
      [
        "/Us",
        "ers/|/priv",
        "ate/|/t",
        "mp/|/v",
        "ar/"
      ],
      "file system path"
    ],
    [
      [
        "maven",
        "gence|obsi",
        "dian|\\.cla",
        "ude|CLAUDE",
        "\\.md|\\bplans/"
      ],
      "internal path or tooling"
    ],
    [
      [
        "digi",
        "fyde"
      ],
      "retired brand"
    ],
    [
      [
        "[\\u20ac$]\\s?\\d|\\d\\s?(?:\\u20ac|EUR\\b|Euro\\b)"
      ],
      "price"
    ],
    [
      [
        "\\bcompliant\\b|\\bcertified\\b|\\bzertifiziert\\b"
      ],
      "forbidden claim word"
    ],
    [
      [
        "[\\u2014\\u2013]"
      ],
      "em or en dash"
    ]
  ],
  "domainExemptKeys": [
    "source"
  ],
  "figureIdPatterns": {
    "c1": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "c10": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "c10-bars": "^b\\d{1,2}$",
    "c11": "^(bb|be|bw|by|hb|he|hh|mv|ni|nw|rp|sh|sl|sn|st|th)$",
    "c12": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "c13": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "c14": "^[a-z_]+__[a-z_]+$",
    "c2": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "c3": "^(narrow|broad|says)$",
    "c3-evidence": "^(tool|ml)$",
    "c4": "^(raw|shared|own|weighted|weighted_total|scan1|scan2|scan2_total)$",
    "c5": "^q[1-5]$",
    "c6": "^wz\\d\\d$",
    "c7": "^(BB|BE|BW|BY|HB|HE|HH|MV|NI|NW|RP|SH|SL|SN|ST|TH)$",
    "c8": "^k\\d{3}$",
    "c9": "^(text|tech|industry|size|state|legal|all)$",
    "h01-bars": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h01-dose": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h01-field": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h01-friends": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h01-net": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h02-blocks": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h02-gap": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h02-gap-portal": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h02-ladder": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h03-drift": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h03-strip": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h04-dumbbell": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h04-field": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h04-forest": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h05-dots": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h05-ladder": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h05-waterfall": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h06-region": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h06-slope": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h07-curve": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h07-field": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h08-auc": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h08-field": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h08-php": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h09-field": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h10-or": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h10-tiles": "^(BB|BE|BW|BY|HB|HE|HH|MV|NI|NW|RP|SH|SL|SN|ST|TH|ost4)$",
    "h11-field": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "h12-null": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "rand-kap2": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "rand-kap3": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "rand-kap4": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "rand-kap5": "^[a-z0-9][a-z0-9_-]{0,40}$",
    "rand-kap7": "^[a-z0-9][a-z0-9_-]{0,40}$"
  },
  "fmtKeys": [
    "style",
    "digits",
    "unit"
  ],
  "genericId": "^[a-z0-9][a-z0-9_-]{0,40}$",
  "genericLabel": "^[A-Za-zÄÖÜäöüß0-9][A-Za-zÄÖÜäöüß0-9 ,.()/&+:%-]{0,100}$",
  "kindKeys": {
    "bars": {
      "data": [
        "orientation",
        "items",
        "fmt",
        "max",
        "baseline",
        "baselineLabel",
        "sort"
      ],
      "items": [
        "id",
        "label",
        "value",
        "lo",
        "hi",
        "n"
      ]
    },
    "blocks": {
      "data": [
        "claim",
        "total",
        "blocks",
        "unit",
        "bins",
        "finding",
        "variants",
        "defaultVariant"
      ]
    },
    "curve": {
      "data": [
        "claim",
        "points",
        "fmt",
        "min",
        "max",
        "defaultVariant",
        "frozenLabel",
        "panel"
      ],
      "points": [
        "id",
        "label",
        "value",
        "lo",
        "hi",
        "n",
        "hits",
        "frozen"
      ]
    },
    "dotplot": {
      "data": [
        "items",
        "fmt",
        "min",
        "max",
        "reference",
        "sort"
      ],
      "items": [
        "id",
        "label",
        "value",
        "lo",
        "hi",
        "n",
        "hits"
      ]
    },
    "dumbbell": {
      "data": [
        "rows",
        "aLabel",
        "bLabel",
        "fmt",
        "scale",
        "reference",
        "sort",
        "variants"
      ],
      "rows": [
        "id",
        "label",
        "a",
        "b"
      ]
    },
    "field": {
      "data": [
        "classes",
        "scenes"
      ]
    },
    "funnel": {
      "data": [
        "points",
        "overall",
        "fmt",
        "limits",
        "xLabel",
        "yLabel"
      ],
      "points": [
        "id",
        "label",
        "n",
        "value"
      ]
    },
    "iceberg": {
      "data": [
        "visible",
        "total",
        "fmt",
        "waterlineLabel",
        "hiddenLabel"
      ],
      "total": [
        "value",
        "label"
      ],
      "visible": [
        "value",
        "label"
      ]
    },
    "ladder": {
      "data": [
        "rungs",
        "fmt",
        "axisMax",
        "groundLabel",
        "ours"
      ],
      "ours": [
        "id",
        "label",
        "value",
        "lo",
        "hi",
        "axisMax",
        "note",
        "fmt"
      ],
      "rungs": [
        "id",
        "label",
        "value",
        "from",
        "lo",
        "hi",
        "n",
        "definition",
        "year"
      ]
    },
    "lorenz": {
      "data": [
        "points",
        "xLabel",
        "yLabel",
        "marks",
        "gini"
      ],
      "marks": [
        "x",
        "label"
      ]
    },
    "network": {
      "data": [
        "claim",
        "nodes",
        "modules",
        "variants",
        "defaultVariant",
        "baseline",
        "neighbours",
        "edgeWord"
      ]
    },
    "nulldist": {
      "data": [
        "claim",
        "fmt",
        "draws",
        "observed",
        "variants",
        "defaultVariant",
        "words",
        "focusWord"
      ]
    },
    "slope": {
      "data": [
        "claim",
        "items",
        "top",
        "splits",
        "defaultVariant",
        "pooled",
        "chance",
        "aLabel",
        "bLabel",
        "fmt"
      ]
    },
    "strip": {
      "data": [
        "claim",
        "rows",
        "layers",
        "fmt",
        "scale",
        "min",
        "max",
        "reference",
        "variants",
        "defaultVariant",
        "finding"
      ],
      "rows": [
        "id",
        "label",
        "marks"
      ]
    },
    "tilemap": {
      "data": [
        "tiles",
        "fmt",
        "emphasis",
        "max",
        "groups"
      ],
      "groups": [
        "id",
        "label",
        "tiles",
        "value",
        "lo",
        "hi",
        "n",
        "core"
      ],
      "tiles": [
        "id",
        "value",
        "lo",
        "hi",
        "n",
        "core"
      ]
    },
    "timeline": {
      "data": [
        "events"
      ],
      "events": [
        "id",
        "date",
        "label",
        "detail",
        "tag",
        "status"
      ]
    },
    "waffle": {
      "data": [
        "total",
        "columns",
        "groups",
        "restLabel",
        "headline"
      ],
      "groups": [
        "id",
        "label",
        "dots",
        "tone"
      ]
    },
    "waterfall": {
      "data": [
        "items",
        "fmt",
        "orientation"
      ],
      "items": [
        "id",
        "label",
        "kind",
        "value",
        "n",
        "gapBefore"
      ]
    }
  },
  "labelSets": {
    "c11": [
      "Baden-Württemberg",
      "Bayern",
      "Berlin",
      "Brandenburg",
      "Bremen",
      "Hamburg",
      "Hessen",
      "Mecklenburg-Vorpommern",
      "Niedersachsen",
      "Nordrhein-Westfalen",
      "Rheinland-Pfalz",
      "Saarland",
      "Sachsen",
      "Sachsen-Anhalt",
      "Schleswig-Holstein",
      "Thüringen"
    ],
    "c14": [
      "Alle Branchen, Nord",
      "Alle Branchen, Ost",
      "Alle Branchen, Süd",
      "Alle Branchen, West",
      "Alle Branchen, alle Regionen",
      "Bau, Nord",
      "Bau, Ost",
      "Bau, Süd",
      "Bau, West",
      "Bau, alle Regionen",
      "Beratung und Marketing, Nord",
      "Beratung und Marketing, Ost",
      "Beratung und Marketing, Süd",
      "Beratung und Marketing, West",
      "Beratung und Marketing, alle Regionen",
      "Finanzen und Immobilien, Nord",
      "Finanzen und Immobilien, Ost",
      "Finanzen und Immobilien, Süd",
      "Finanzen und Immobilien, West",
      "Finanzen und Immobilien, alle Regionen",
      "Handel, Nord",
      "Handel, Ost",
      "Handel, Süd",
      "Handel, West",
      "Handel, alle Regionen",
      "IT und Medien, Nord",
      "IT und Medien, Ost",
      "IT und Medien, Süd",
      "IT und Medien, West",
      "IT und Medien, alle Regionen",
      "Industrie und Herstellung, Nord",
      "Industrie und Herstellung, Ost",
      "Industrie und Herstellung, Süd",
      "Industrie und Herstellung, West",
      "Industrie und Herstellung, alle Regionen",
      "Ingenieure und Forschung, Nord",
      "Ingenieure und Forschung, Ost",
      "Ingenieure und Forschung, Süd",
      "Ingenieure und Forschung, West",
      "Ingenieure und Forschung, alle Regionen",
      "Übrige Dienste, Verkehr, Gastgewerbe, Gesundheit, Bildung, Nord",
      "Übrige Dienste, Verkehr, Gastgewerbe, Gesundheit, Bildung, Ost",
      "Übrige Dienste, Verkehr, Gastgewerbe, Gesundheit, Bildung, Süd",
      "Übrige Dienste, Verkehr, Gastgewerbe, Gesundheit, Bildung, West",
      "Übrige Dienste, Verkehr, Gastgewerbe, Gesundheit, Bildung, alle Regionen"
    ],
    "c6": [
      "Abfallwirtschaft",
      "Arbeitskräftevermittlung",
      "Architektur und Ingenieurbüros",
      "Banken und Finanzen",
      "Bauinstallation",
      "Beherbergung",
      "Bekleidung",
      "Büro- und Veranstaltungsdienste",
      "Chemie",
      "Druck und Vervielfältigung",
      "Einzelhandel",
      "Elektrische Ausrüstung",
      "Elektronik und Optik",
      "Energieversorgung",
      "Erziehung und Unterricht",
      "Fahrzeugbau",
      "Film und Musik",
      "Fondsmanagement und Hilfstätigkeiten",
      "Forschung und Entwicklung",
      "Gastronomie",
      "Gebäudebetreuung",
      "Gesundheitswesen",
      "Getränkeherstellung",
      "Glas, Keramik, Steine",
      "Großhandel",
      "Gummi und Kunststoff",
      "Heime",
      "Hochbau",
      "Holz und Holzwaren",
      "IT-Dienstleistungen",
      "Immobilien",
      "Informationsdienste",
      "Kfz-Handel",
      "Kunst und Kultur",
      "Lagerei und Verkehrsdienste",
      "Landverkehr",
      "Landwirtschaft",
      "Maschinenbau",
      "Metallerzeugnisse",
      "Metallerzeugung",
      "Möbel",
      "Nahrungsmittel",
      "Pharma",
      "Post und Kurier",
      "Rechts- und Steuerberatung",
      "Reisebüros",
      "Reparatur von Gebrauchsgütern",
      "Reparatur von Maschinen",
      "Rundfunk",
      "Sonstige Dienstleistungen",
      "Sonstige Waren",
      "Sonstige freiberufliche Tätigkeiten",
      "Sozialwesen",
      "Sport und Freizeit",
      "Telekommunikation",
      "Tiefbau",
      "Unternehmensberatung und PR",
      "Verlagswesen",
      "Vermietung beweglicher Sachen",
      "Versicherungen",
      "Wach- und Sicherheitsdienste",
      "Werbung und Marktforschung"
    ]
  },
  "manifestFigureKeys": [
    "id",
    "file",
    "kind",
    "n",
    "asOf",
    "sha256"
  ],
  "manifestKeys": [
    "schema",
    "methodVersion",
    "asOf",
    "createdOn",
    "samplingNote",
    "weights",
    "inputs",
    "figures",
    "kRule",
    "retires"
  ],
  "metaKeys": [
    "methodVersion",
    "frozenOn",
    "values",
    "aliases",
    "n",
    "base",
    "window",
    "source",
    "hero",
    "attribution",
    "rescan",
    "rescanNote"
  ],
  "metaValueKeys": [
    "value",
    "ref",
    "lo",
    "hi",
    "n",
    "fmt"
  ],
  "pointLabelPatterns": {
    "c8": "^[A-ZÄÖÜ][A-Za-zÄÖÜäöüß .()-]{1,40}$"
  },
  "schema": {
    "blocks": {
      "bins": [
        {
          "id": "id",
          "label": "lab"
        }
      ],
      "blocks": "num",
      "claim": {
        "$words": 12
      },
      "defaultVariant": "id",
      "finding": "id",
      "total": "cnt",
      "unit": "unit",
      "variants": [
        {
          "counts": {
            "$map": "cnt"
          },
          "id": "id",
          "label": "lab"
        }
      ]
    },
    "curve": {
      "claim": {
        "$words": 12
      },
      "defaultVariant": "id",
      "fmt": {
        "digits": "num",
        "style": "str",
        "unit": "str"
      },
      "frozenLabel": "str",
      "max": "num",
      "min": "num",
      "panel": {
        "fmt": {
          "digits": "num",
          "style": "str",
          "unit": "str"
        },
        "rows": [
          {
            "id": "id",
            "label": "lab",
            "value": "num"
          }
        ],
        "title": "str"
      },
      "points": [
        {
          "frozen": "bool",
          "hi": "num",
          "hits": "cntnull",
          "id": "id",
          "label": "lab",
          "lo": "num",
          "n": "num",
          "value": "numnull"
        }
      ]
    },
    "dumbbell": {
      "aLabel": "str",
      "bLabel": "str",
      "fmt": {
        "digits": "num",
        "style": "str",
        "unit": "str"
      },
      "reference": {
        "label": "str",
        "value": "num"
      },
      "rows": [
        {
          "a": "numnull",
          "b": "numnull",
          "id": "id",
          "label": "lab"
        }
      ],
      "scale": "str",
      "sort": "str",
      "variants": [
        {
          "id": "id",
          "label": "lab",
          "rows": [
            {
              "a": "numnull",
              "b": "numnull",
              "id": "id"
            }
          ]
        }
      ]
    },
    "field": {
      "classes": [
        {
          "id": "id",
          "label": "lab",
          "tone": "str"
        }
      ],
      "scenes": [
        {
          "adjacent": "bool",
          "base": "cnt",
          "bins": [
            {
              "cell": [
                "num"
              ],
              "id": "id",
              "label": "lab",
              "segments": [
                {
                  "cls": "id",
                  "count": "cnt",
                  "partial": "bool"
                }
              ]
            }
          ],
          "claim": {
            "$words": 12
          },
          "cols": "num",
          "enter": "str",
          "id": "id",
          "joint": "bool",
          "labelClasses": [
            "id"
          ],
          "layout": "str",
          "numeral": {
            "fmt": {
              "digits": "num",
              "style": "str",
              "unit": "str"
            },
            "suffix": "str",
            "value": "num"
          },
          "perRow": "num",
          "population": "str",
          "squares": "num",
          "unit": "unit",
          "variantLabel": "str",
          "variantOf": "id",
          "weight": "num"
        }
      ]
    },
    "ladder": {
      "axisMax": "num",
      "fmt": {
        "digits": "num",
        "style": "str",
        "unit": "str"
      },
      "groundLabel": "str",
      "ours": {
        "axisMax": "num",
        "fmt": {
          "digits": "num",
          "style": "str",
          "unit": "str"
        },
        "hi": "num",
        "id": "id",
        "label": "lab",
        "lo": "num",
        "note": "str",
        "value": "num"
      },
      "rungs": [
        {
          "definition": "str",
          "from": "num",
          "hi": "num",
          "id": "id",
          "label": "lab",
          "lo": "num",
          "n": "num",
          "value": "num",
          "year": "str"
        }
      ]
    },
    "network": {
      "baseline": "id",
      "claim": {
        "$words": 12
      },
      "defaultVariant": "id",
      "edgeWord": "str",
      "modules": [
        {
          "id": "id",
          "label": "lab"
        }
      ],
      "neighbours": [
        {
          "hi": "num",
          "lo": "num",
          "node": "id",
          "odds": "num"
        }
      ],
      "nodes": [
        {
          "id": "id",
          "ki": "bool",
          "label": "lab",
          "module": "id",
          "x": "num",
          "y": "num"
        }
      ],
      "variants": [
        {
          "edges": [
            [
              "num"
            ]
          ],
          "id": "id",
          "label": "lab",
          "modularity": "num",
          "share": "num"
        }
      ]
    },
    "nulldist": {
      "claim": {
        "$words": 12
      },
      "defaultVariant": "id",
      "draws": "num",
      "fmt": {
        "digits": "num",
        "style": "str",
        "unit": "str"
      },
      "focusWord": "id",
      "observed": {
        "hi": "num",
        "label": "str",
        "lo": "num",
        "value": "num"
      },
      "variants": [
        {
          "band": {
            "hi": "num",
            "lo": "num"
          },
          "bins": [
            {
              "draws": "num",
              "hi": "num",
              "lo": "num"
            }
          ],
          "id": "id",
          "label": "lab",
          "n": "num"
        }
      ],
      "words": [
        {
          "hi": "num",
          "id": "id",
          "label": "lab",
          "lo": "num",
          "ratio": "num"
        }
      ]
    },
    "slope": {
      "aLabel": "str",
      "bLabel": "str",
      "chance": {
        "hi": "num",
        "lo": "num",
        "mean": "num"
      },
      "claim": {
        "$words": 12
      },
      "defaultVariant": "id",
      "fmt": {
        "digits": "num",
        "style": "str",
        "unit": "str"
      },
      "items": "num",
      "pooled": {
        "a": "num",
        "b": "num",
        "hi": "num",
        "lo": "num"
      },
      "splits": [
        {
          "id": "id",
          "label": "lab",
          "rankB": [
            "num"
          ],
          "top": {
            "a": "num",
            "b": "num",
            "hi": "num",
            "lo": "num"
          }
        }
      ],
      "top": "num"
    },
    "strip": {
      "claim": {
        "$words": 12
      },
      "defaultVariant": "id",
      "finding": "id",
      "fmt": {
        "digits": "num",
        "style": "str",
        "unit": "str"
      },
      "layers": [
        {
          "id": "id",
          "label": "lab",
          "shape": "str",
          "tone": "str"
        }
      ],
      "max": "num",
      "min": "num",
      "reference": {
        "label": "str",
        "value": "num"
      },
      "rows": [
        {
          "id": "id",
          "label": "lab",
          "marks": [
            {
              "by": {
                "$map": {
                  "hi": "num",
                  "hits": "cntnull",
                  "lo": "num",
                  "n": "num",
                  "value": "numnull"
                }
              },
              "hi": "num",
              "hits": "cntnull",
              "layer": "id",
              "lo": "num",
              "n": "num",
              "value": "numnull"
            }
          ]
        }
      ],
      "scale": "str",
      "variants": [
        {
          "id": "id",
          "label": "lab"
        }
      ]
    },
    "tilemap": {
      "emphasis": "str",
      "fmt": {
        "digits": "num",
        "style": "str",
        "unit": "str"
      },
      "groups": [
        {
          "core": {
            "hi": "num",
            "lo": "num",
            "n": "num",
            "value": "numnull"
          },
          "hi": "num",
          "id": "id",
          "label": "lab",
          "lo": "num",
          "n": "num",
          "tiles": [
            "iso"
          ],
          "value": "numnull"
        }
      ],
      "max": "num",
      "tiles": [
        {
          "core": {
            "hi": "num",
            "lo": "num",
            "n": "num",
            "value": "numnull"
          },
          "hi": "num",
          "id": "iso",
          "lo": "num",
          "n": "num",
          "value": "numnull"
        }
      ]
    }
  },
  "stepKeys": [
    "id",
    "label",
    "reveal",
    "focus"
  ],
  "topKeys": [
    "id",
    "kind",
    "title",
    "alt",
    "caption",
    "n",
    "nNote",
    "source",
    "asOf",
    "limitation",
    "sourceLine",
    "steps",
    "data",
    "seed",
    "meta",
    "annotation"
  ],
  "vendorAllow": [
    "ChatGPT",
    "GPT",
    "OpenAI",
    "Copilot",
    "Claude",
    "Anthropic",
    "Gemini",
    "Microsoft",
    "Azure",
    "AWS",
    "Amazon",
    "Google",
    "Cloudflare",
    "WordPress",
    "Apache",
    "nginx",
    "TYPO3",
    "WooCommerce",
    "Matomo",
    "YouTube",
    "Facebook",
    "Instagram",
    "LinkedIn",
    "Xing",
    "TikTok",
    "Pinterest",
    "Kununu",
    "Twitter",
    "X",
    "Borlabs",
    "Complianz",
    "Cookiebot",
    "Usercentrics",
    "reCAPTCHA",
    "Tag Manager",
    "Maps",
    "Wix",
    "Shopify",
    "Strato",
    "IONOS",
    "Let's Encrypt",
    "Sectigo",
    "DigiCert",
    "GoDaddy",
    "Telekom",
    "Databricks",
    "Snowflake",
    "SAP",
    "Power BI",
    "Mistral",
    "DeepL",
    "Aleph Alpha",
    "STACKIT",
    "OVH",
    "Hetzner",
    "Scaleway",
    "Perplexity",
    "Llama",
    "Meta",
    "Hugging Face",
    "LangChain",
    "Cursor",
    "Vercel",
    "Netlify",
    "Webflow",
    "Joomla",
    "Drupal",
    "Contao",
    "Shopware",
    "OXID",
    "React",
    "Angular",
    "HubSpot",
    "Calendly",
    "PayPal",
    "Segment",
    "Magento",
    "OneTrust",
    "Vimeo",
    "Turnstile",
    "CloudFront",
    "Indeed",
    "Glassdoor",
    "Canonical",
    "Impressum",
    "Datenschutz",
    "Karriere",
    "Newsletter",
    "Konfigurator",
    "Generative KI",
    "KI",
    "LLM",
    "RAG",
    "LangChain",
    "Künstliche Intelligenz",
    "Machine Learning",
    "Data Scientist",
    "Agenten",
    "Prompting",
    "Souveränität",
    "Sachsen",
    "Hellenic",
    "Asseco",
    "SwissSign",
    "Actalis",
    "D-Trust",
    "EUNETIC",
    "Apache",
    "Plesk",
    "LiteSpeed",
    "IIS",
    "PHP",
    "HSTS",
    "DMARC",
    "SPF",
    "NIS2",
    "DSGVO",
    "ESG",
    "LkSG"
  ]
} as const;
/* GATE_CONFIG_END */

type Json = Record<string, unknown>;
export interface GateFinding {
  readonly path: string;
  readonly reason: string;
}

const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

const CFG = GATE_CONFIG as unknown as {
  topKeys: string[];
  stepKeys: string[];
  fmtKeys: string[];
  kindKeys: Record<string, Record<string, string[]>>;
  metaKeys: string[];
  metaValueKeys: string[];
  manifestKeys: string[];
  manifestFigureKeys: string[];
  figureIdPatterns: Record<string, string>;
  labelSets: Record<string, string[]>;
  pointLabelPatterns: Record<string, string>;
  genericId: string;
  genericLabel: string;
  countKeys: string[];
  deny: [string[], string][];
  domainExemptKeys: string[];
};

const DENY = CFG.deny.map(([pieces, reason]) => [new RegExp(pieces.join(""), "i"), reason] as const);
const REQUIRED_TOP = ["id", "kind", "title", "alt", "caption", "n", "source", "asOf", "limitation", "data"];
const LIST_FIELDS = ["groups", "items", "tiles", "points", "rows", "marks", "rungs", "events"];

function* leaves(value: unknown, path = "", key = ""): Generator<[string, string, unknown]> {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) yield* leaves(value[i], `${path}[${i}]`, key);
  } else if (isObject(value)) {
    for (const [k, v] of Object.entries(value)) yield* leaves(v, path ? `${path}.${k}` : k, k);
  } else {
    yield [path, key, value];
  }
}

export function gateFigure(fileName: string, spec: unknown): GateFinding[] {
  const out: GateFinding[] = [];
  const bad = (path: string, reason: string): void => {
    out.push({ path: path || "spec", reason });
  };
  if (!isObject(spec)) return [{ path: "spec", reason: "not an object" }];
  for (const k of Object.keys(spec)) if (!CFG.topKeys.includes(k)) bad(k, "key not in the FigureSpec allowlist");
  for (const k of REQUIRED_TOP) if (!(k in spec)) bad(k, "required key missing");
  const meta = spec["meta"];
  if (meta !== undefined) {
    if (!isObject(meta)) bad("meta", "meta must be an object");
    else {
      for (const k of Object.keys(meta)) if (!CFG.metaKeys.includes(k)) bad(`meta.${k}`, "key not in the meta allowlist");
      const values = meta["values"] ?? {};
      if (!isObject(values)) bad("meta.values", "values must be an object");
      else {
        for (const [name, entry] of Object.entries(values)) {
          if (!new RegExp(CFG.genericId).test(name.toLowerCase())) bad(`meta.values.${name}`, "token name not in the allowed pattern");
          if (!isObject(entry)) {
            bad(`meta.values.${name}`, "entry must be an object");
            continue;
          }
          for (const k of Object.keys(entry)) if (!CFG.metaValueKeys.includes(k)) bad(`meta.values.${name}.${k}`, "key not in the allowlist");
          const entryFmt = entry["fmt"];
          if (isObject(entryFmt)) for (const k of Object.keys(entryFmt)) if (!CFG.fmtKeys.includes(k)) bad(`meta.values.${name}.fmt.${k}`, "key not in the allowlist");
        }
      }
      const aliases = meta["aliases"] ?? {};
      if (!isObject(aliases)) bad("meta.aliases", "aliases must be an object");
      else {
        for (const [alias, target] of Object.entries(aliases)) {
          const re = new RegExp(CFG.genericId);
          if (!re.test(alias.toLowerCase()) || typeof target !== "string" || !re.test(target.toLowerCase())) bad(`meta.aliases.${alias}`, "alias or target not in the allowed pattern");
        }
      }
    }
  }
  const id = String(spec["id"] ?? "");
  const kind = String(spec["kind"] ?? "");
  if (!(id in CFG.figureIdPatterns)) bad("id", "figure id not in the allowlist");
  if (id && fileName !== `${id}.json`) bad("id", "file name differs from figure id");
  const kk = CFG.kindKeys[kind];
  if (!kk) {
    bad("kind", "unknown kind");
    return out;
  }
  const data = spec["data"];
  if (!isObject(data)) {
    bad("data", "data must be an object");
    return out;
  }
  for (const k of Object.keys(data)) if (!(kk["data"] ?? []).includes(k)) bad(`data.${k}`, "key not in the allowlist for this kind");
  const fmt = data["fmt"];
  if (isObject(fmt)) for (const k of Object.keys(fmt)) if (!CFG.fmtKeys.includes(k)) bad(`data.fmt.${k}`, "key not in the allowlist");

  const idRe = new RegExp(CFG.figureIdPatterns[id] ?? CFG.genericId);
  const labelSet = new Set(CFG.labelSets[id] ?? []);
  const labelRe = new RegExp(CFG.genericLabel);
  const pointRe = CFG.pointLabelPatterns[id] ? new RegExp(CFG.pointLabelPatterns[id] as string) : null;
  const itemIds = new Set<string>();
  for (const field of LIST_FIELDS) {
    const rows = data[field];
    if (!Array.isArray(rows) || (field === "points" && kind === "lorenz")) continue;
    const allowed = kk[field] ?? [];
    rows.forEach((row, i) => {
      const p = `data.${field}[${i}]`;
      if (!isObject(row)) {
        bad(p, "list entries must be objects");
        return;
      }
      for (const k of Object.keys(row)) if (!allowed.includes(k)) bad(`${p}.${k}`, "key not in the allowlist for this list");
      if (typeof row["id"] === "string") {
        itemIds.add(row["id"]);
        if (!idRe.test(row["id"])) bad(`${p}.id`, "id not in the enumerated pattern");
      }
      const label = row["label"];
      if (typeof label === "string") {
        if (labelSet.size > 0 && ["items", "rows", "tiles"].includes(field)) {
          if (!labelSet.has(label)) bad(`${p}.label`, "label not in the enumerated set");
        } else if (pointRe && field === "points") {
          if (!pointRe.test(label)) bad(`${p}.label`, "label not in the allowed pattern");
        } else if (field !== "marks" && !labelRe.test(label)) {
          bad(`${p}.label`, "label not in the allowed pattern");
        }
      }
      if (row["value"] === null && ["lo", "hi", "hits"].some((k) => row[k] !== undefined && row[k] !== null)) {
        bad(p, "a suppressed value must carry no interval and no hits");
      }
      const n = row["n"];
      const v = row["value"];
      if (isObject(fmt) && fmt["style"] === "percent" && isNum(n) && n >= 5 && isNum(v)) {
        const khat = (v * n) / 100;
        if (Math.round(khat) >= 1 && Math.round(khat) <= 4 && Math.abs(khat - Math.round(khat)) <= 0.3) {
          bad(`${p}.value`, "rate implies 1 to 4 hits (k = 5); use null");
        }
      }
    });
  }
  if (kind === "lorenz") {
    const pts = data["points"];
    const ok = Array.isArray(pts) && pts.length >= 3 && pts.every((q) => Array.isArray(q) && q.length === 2 && q.every(isNum));
    if (!ok) bad("data.points", "points must be [x, y] pairs");
    else {
      const list = pts as number[][];
      const first = list[0] as number[];
      const last = list[list.length - 1] as number[];
      const prev = list[list.length - 2] as number[];
      if (first[0] !== 0 || first[1] !== 0) bad("data.points[0]", "curve must start at 0, 0");
      if (last[0] !== 100 || last[1] !== 100) bad("data.points[-1]", "curve must end at 100, 100");
      if ((prev[0] as number) > 99) bad("data.points", "a point past 99 percent could isolate fewer than 5 employers");
      for (let i = 0; i < list.length - 1; i += 1) {
        if ((list[i] as number[])[0]! >= (list[i + 1] as number[])[0]!) bad("data.points", "x must increase");
      }
    }
  }
  if (kind === "funnel" && Array.isArray(data["points"])) {
    (data["points"] as Json[]).forEach((q, i) => {
      if (!(isNum(q["n"]) && q["n"] >= 5)) bad(`data.points[${i}].n`, "funnel point needs n of at least 5");
    });
  }
  const steps = spec["steps"];
  if (Array.isArray(steps)) {
    steps.forEach((st, i) => {
      if (!isObject(st)) return;
      for (const k of Object.keys(st)) if (!CFG.stepKeys.includes(k)) bad(`steps[${i}].${k}`, "key not in the allowlist");
      if (!new RegExp(CFG.genericId).test(String(st["id"] ?? ""))) bad(`steps[${i}].id`, "step id not in the allowed pattern");
      const refs = [...((st["reveal"] as string[] | undefined) ?? []), ...((st["focus"] as string[] | undefined) ?? [])];
      for (const ref of refs) if (!itemIds.has(ref)) bad(`steps[${i}]`, "step refers to an element id that does not exist");
    });
  }
  for (const [path, key, value] of leaves(spec)) {
    if (typeof value === "number") {
      if (!Number.isFinite(value)) bad(path, "non-finite number");
      else if (CFG.countKeys.includes(key) && Number.isInteger(value) && value >= 1 && value <= 4) {
        bad(path, "count between 1 and 4 (k = 5); use null");
      }
    } else if (typeof value === "string") {
      for (const [pattern, reason] of DENY) {
        if (reason === "domain name" && CFG.domainExemptKeys.includes(key)) continue;
        if (pattern.test(value)) bad(path, `denylist: ${reason}`);
      }
    }
  }
  return out;
}

export function gateManifest(manifest: unknown): GateFinding[] {
  const out: GateFinding[] = [];
  if (!isObject(manifest)) return [{ path: "manifest", reason: "not an object" }];
  for (const k of Object.keys(manifest)) if (!CFG.manifestKeys.includes(k)) out.push({ path: k, reason: "key not in the manifest allowlist" });
  if (!/^v\d/.test(String(manifest["methodVersion"] ?? ""))) out.push({ path: "methodVersion", reason: "missing method version" });
  const figures = manifest["figures"];
  if (Array.isArray(figures)) {
    figures.forEach((f, i) => {
      if (!isObject(f)) return;
      for (const k of Object.keys(f)) if (!CFG.manifestFigureKeys.includes(k)) out.push({ path: `figures[${i}].${k}`, reason: "key not in the allowlist" });
      if (!/^[0-9a-f]{64}$/.test(String(f["sha256"] ?? ""))) out.push({ path: `figures[${i}].sha256`, reason: "not a sha256" });
    });
  }
  for (const [path, key, value] of leaves(manifest)) {
    if (typeof value !== "string") continue;
    for (const [pattern, reason] of DENY) {
      if (reason === "domain name" && key === "source") continue;
      if (pattern.test(value)) out.push({ path, reason: `denylist: ${reason}` });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ files */

const ROOT = resolve(__dirname, "..", "..", "..");
const FOLDERS = [
  join(ROOT, "content", "books", "ki-landschaft", "figures"),
  join(ROOT, "content", "books", "ki-landschaft", "frozen"),
  join(ROOT, "src", "lib", "figures", "frozen"),
  ...(process.env["BOOK_FROZEN_DIR"] ? [resolve(process.env["BOOK_FROZEN_DIR"])] : []),
];

const frozenFiles = FOLDERS.filter((d) => existsSync(d)).flatMap((d) =>
  readdirSync(d).filter((f) => f.endsWith(".json")).map((f) => ({ dir: d, name: f })),
);

const isManifest = (name: string, obj: unknown): boolean =>
  name === "manifest.json" || name === "frozen-manifest.json" || (isObject(obj) && String(obj["schema"] ?? "").startsWith("frozen-manifest"));

describe("privacy gate on frozen figure files", () => {
  it("lists what it scans", () => {
    expect(Array.isArray(frozenFiles)).toBe(true);
  });

  it.each(frozenFiles.map((f) => [`${f.dir.slice(ROOT.length + 1)}/${f.name}`, f] as const))("%s passes the gate", (_label, file) => {
    const obj: unknown = JSON.parse(readFileSync(join(file.dir, file.name), "utf8"));
    if (isManifest(file.name, obj)) {
      expect(gateManifest(obj)).toEqual([]);
      return;
    }
    expect(gateFigure(file.name, obj)).toEqual([]);
    expect(findPrivacyFindings(obj)).toEqual([]);
    expect(() => parseFigureSpec(obj)).not.toThrow();
  });
});

/* ------------------------------------------------------------------ the gate gates itself */

const part = (...pieces: string[]): string => pieces.join("");

const CLEAN: Json = {
  id: "c5",
  kind: "bars",
  title: "Test",
  alt: "Test",
  caption: "Test",
  n: 1000,
  source: "Test",
  asOf: "2026-10-18",
  limitation: "Test",
  data: {
    fmt: { style: "percent", digits: 1 },
    items: [{ id: "q1", label: "kürzestes Fünftel", value: 2, lo: 1, hi: 3, n: 400 }],
  },
};

const clone = (v: Json): Json => JSON.parse(JSON.stringify(v)) as Json;
const mutate = (fn: (d: Json) => void): Json => {
  const d = clone(CLEAN);
  fn(d);
  return d;
};
const firstItem = (d: Json): Json => ((d["data"] as Json)["items"] as Json[])[0] as Json;

const SEEDED: [string, Json][] = [
  ["e-mail", mutate((d) => (d["caption"] = part("max.muster", "@example", ".org")))],
  ["URL", mutate((d) => (d["alt"] = part("siehe https", "://example", ".org/x")))],
  ["domain", mutate((d) => (d["title"] = part("firma", "-beispiel", ".de")))],
  ["phone", mutate((d) => (d["caption"] = part("Telefon +49 30 1234", "5678")))],
  ["German phone", mutate((d) => (d["caption"] = part("Rufnummer 0911 ", "123456")))],
  ["path", mutate((d) => (d["limitation"] = part("/Us", "ers/x/data")))],
  ["internal tooling", mutate((d) => (d["limitation"] = part("maven", "gence_obs", "idian")))],
  ["retired brand", mutate((d) => (d["caption"] = part("digi", "fyde")))],
  ["em dash", mutate((d) => (d["caption"] = `a ${String.fromCharCode(0x2014)} b`))],
  ["price", mutate((d) => (d["caption"] = `ab 5.000 ${String.fromCharCode(0x20ac)}`))],
  ["claim word", mutate((d) => (d["caption"] = "certified result"))],
  ["count of 3 in n", mutate((d) => (firstItem(d)["n"] = 3))],
  ["top-level n of 2", mutate((d) => (d["n"] = 2))],
  ["unknown key", mutate((d) => (firstItem(d)["company"] = "x"))],
  ["unknown figure id", mutate((d) => (d["id"] = "c99"))],
  ["label outside the pattern", mutate((d) => (firstItem(d)["label"] = "a@b"))],
  ["suppressed value with interval", mutate((d) => Object.assign(firstItem(d), { value: null, lo: 0.5 }))],
  ["rate implying 3 hits", mutate((d) => Object.assign(firstItem(d), { value: 0.75, n: 400 }))],
  ["id outside the pattern", mutate((d) => (firstItem(d)["id"] = "Firma 1"))],
  [
    "lorenz point that isolates employers",
    {
      id: "c10", kind: "lorenz", title: "T", alt: "A", caption: "C", n: 100, source: "S", asOf: "2026-10-18", limitation: "L",
      data: { xLabel: "x", yLabel: "y", points: [[0, 0], [50, 20], [99.9, 90], [100, 100]] },
    },
  ],
];

describe("the gate catches seeded violations", () => {
  it("accepts a clean sample", () => {
    expect(gateFigure("c5.json", CLEAN)).toEqual([]);
  });

  it.each(SEEDED.map(([name, spec]) => [name, spec] as const))("flags: %s", (_name, spec) => {
    const fileName = `${String(spec["id"])}.json`;
    expect(gateFigure(fileName, spec).length).toBeGreaterThan(0);
  });

  it("flags a manifest with a path and an unknown key", () => {
    const bad = {
      schema: "frozen-manifest/1", methodVersion: "v0-pre-rescan", asOf: "2026-10-18", samplingNote: part("/Us", "ers/x"),
      figures: [{ id: "c5", file: "c5.json", kind: "bars", n: 1, asOf: "2026-10-18", sha256: "zz" }], extra: 1,
    };
    const found = gateManifest(bad).map((f) => f.reason);
    expect(found.some((r) => r.includes("allowlist"))).toBe(true);
    expect(found.some((r) => r.includes("denylist"))).toBe(true);
    expect(found.some((r) => r.includes("sha256"))).toBe(true);
  });
});
