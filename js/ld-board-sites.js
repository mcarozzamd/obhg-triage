/* Site configs and example snapshots for the L&D board. No patient data. */
self.LD_BOARD_SITES = {
  "unit": {
    "siteName": "My unit",
    "rooms": [
      212,
      214,
      216,
      218,
      220,
      222,
      224,
      226,
      234,
      236,
      238,
      240,
      244,
      246,
      248,
      250
    ],
    "antepartumRooms": [],
    "checklist": {
      "labor": [
        {
          "id": "exam",
          "label": "Cervical exam",
          "type": "text",
          "enabled": true
        },
        {
          "id": "oxytocin",
          "label": "Oxytocin rate",
          "type": "text",
          "enabled": true
        },
        {
          "id": "misoprostol",
          "label": "Misoprostol dose #",
          "type": "text",
          "enabled": true
        },
        {
          "id": "cook",
          "label": "Cook",
          "type": "chip",
          "options": [
            "in",
            "out"
          ],
          "enabled": true
        },
        {
          "id": "epidural",
          "label": "Epidural",
          "type": "chip",
          "options": [
            "yes",
            "no",
            "requested"
          ],
          "enabled": true
        },
        {
          "id": "epidural_time",
          "label": "Epidural time",
          "type": "time",
          "enabled": true
        },
        {
          "id": "gbs",
          "label": "GBS",
          "type": "chip",
          "options": [
            "pos",
            "neg",
            "unknown"
          ],
          "enabled": true
        },
        {
          "id": "abx",
          "label": "Antibiotics",
          "type": "text",
          "enabled": true
        },
        {
          "id": "delivery_route",
          "label": "Delivery route",
          "type": "chip",
          "options": [
            "SVD",
            "VBAC",
            "vac",
            "CS"
          ],
          "enabled": true
        },
        {
          "id": "delivery_time",
          "label": "Delivery time",
          "type": "time",
          "enabled": true
        },
        {
          "id": "who_delivered",
          "label": "Who delivered",
          "type": "chip",
          "options": [
            "hospitalist",
            "CNM",
            "private"
          ],
          "enabled": true
        }
      ],
      "postpartum": [
        {
          "id": "delivery_route",
          "label": "Delivery route",
          "type": "chip",
          "options": [
            "SVD",
            "VBAC",
            "vac",
            "CS"
          ],
          "enabled": true
        },
        {
          "id": "delivery_time",
          "label": "Delivery time",
          "type": "time",
          "enabled": true
        },
        {
          "id": "who_delivered",
          "label": "Who delivered",
          "type": "chip",
          "options": [
            "hospitalist",
            "CNM",
            "private"
          ],
          "enabled": true
        },
        {
          "id": "ebl",
          "label": "EBL",
          "type": "text",
          "enabled": true
        },
        {
          "id": "pph",
          "label": "PPH",
          "type": "yn",
          "enabled": true
        },
        {
          "id": "rh",
          "label": "Rh",
          "type": "chip",
          "options": [
            "pos",
            "neg"
          ],
          "enabled": true
        },
        {
          "id": "rhig",
          "label": "RhIG",
          "type": "yn",
          "enabled": true
        },
        {
          "id": "rubella",
          "label": "Rubella",
          "type": "chip",
          "options": [
            "immune",
            "nonimmune"
          ],
          "enabled": true
        },
        {
          "id": "bp_plan",
          "label": "BP plan",
          "type": "text",
          "enabled": true
        },
        {
          "id": "vte",
          "label": "VTE prophylaxis",
          "type": "text",
          "enabled": true
        },
        {
          "id": "infant",
          "label": "Infant items (e.g. HBIG)",
          "type": "text",
          "enabled": true
        },
        {
          "id": "discharge_plan",
          "label": "Planned discharge",
          "type": "text",
          "enabled": true
        },
        {
          "id": "gbs",
          "label": "GBS",
          "type": "chip",
          "options": [
            "pos",
            "neg",
            "unknown"
          ],
          "enabled": true
        },
        {
          "id": "abx",
          "label": "Antibiotics",
          "type": "text",
          "enabled": true
        }
      ],
      "antepartum": [
        {
          "id": "magnesium",
          "label": "Magnesium",
          "type": "yn",
          "enabled": true
        },
        {
          "id": "steroids",
          "label": "Antenatal steroids",
          "type": "text",
          "enabled": true
        },
        {
          "id": "bp_plan",
          "label": "BP plan",
          "type": "text",
          "enabled": true
        },
        {
          "id": "surveillance",
          "label": "Fetal surveillance",
          "type": "text",
          "enabled": true
        }
      ]
    }
  },
  "demo": {
    "siteName": "Demo Regional",
    "rooms": [
      101,
      102,
      103,
      104,
      105,
      106,
      107,
      108,
      109,
      110
    ],
    "antepartumRooms": [
      109,
      110
    ],
    "checklist": {
      "labor": [
        {
          "id": "exam",
          "label": "Cervical exam",
          "type": "text",
          "enabled": true
        },
        {
          "id": "oxytocin",
          "label": "Oxytocin rate",
          "type": "text",
          "enabled": true
        },
        {
          "id": "misoprostol",
          "label": "Misoprostol dose #",
          "type": "text",
          "enabled": true
        },
        {
          "id": "cook",
          "label": "Cook",
          "type": "chip",
          "options": [
            "in",
            "out"
          ],
          "enabled": true
        },
        {
          "id": "epidural",
          "label": "Epidural",
          "type": "chip",
          "options": [
            "yes",
            "no",
            "requested"
          ],
          "enabled": true
        },
        {
          "id": "epidural_time",
          "label": "Epidural time",
          "type": "time",
          "enabled": true
        },
        {
          "id": "gbs",
          "label": "GBS",
          "type": "chip",
          "options": [
            "pos",
            "neg",
            "unknown"
          ],
          "enabled": true
        },
        {
          "id": "abx",
          "label": "Antibiotics",
          "type": "text",
          "enabled": true
        },
        {
          "id": "delivery_route",
          "label": "Delivery route",
          "type": "chip",
          "options": [
            "SVD",
            "VBAC",
            "vac",
            "CS"
          ],
          "enabled": true
        },
        {
          "id": "delivery_time",
          "label": "Delivery time",
          "type": "time",
          "enabled": true
        },
        {
          "id": "who_delivered",
          "label": "Who delivered",
          "type": "chip",
          "options": [
            "hospitalist",
            "CNM",
            "private"
          ],
          "enabled": true
        },
        {
          "id": "nitrous",
          "label": "Nitrous",
          "type": "yn",
          "enabled": true,
          "custom": true
        }
      ],
      "postpartum": [
        {
          "id": "delivery_route",
          "label": "Delivery route",
          "type": "chip",
          "options": [
            "SVD",
            "VBAC",
            "vac",
            "CS"
          ],
          "enabled": true
        },
        {
          "id": "delivery_time",
          "label": "Delivery time",
          "type": "time",
          "enabled": true
        },
        {
          "id": "who_delivered",
          "label": "Who delivered",
          "type": "chip",
          "options": [
            "hospitalist",
            "CNM",
            "private"
          ],
          "enabled": true
        },
        {
          "id": "ebl",
          "label": "EBL",
          "type": "text",
          "enabled": true
        },
        {
          "id": "pph",
          "label": "PPH",
          "type": "yn",
          "enabled": true
        },
        {
          "id": "rh",
          "label": "Rh",
          "type": "chip",
          "options": [
            "pos",
            "neg"
          ],
          "enabled": true
        },
        {
          "id": "rhig",
          "label": "RhIG",
          "type": "yn",
          "enabled": true
        },
        {
          "id": "rubella",
          "label": "Rubella",
          "type": "chip",
          "options": [
            "immune",
            "nonimmune"
          ],
          "enabled": false
        },
        {
          "id": "bp_plan",
          "label": "BP plan",
          "type": "text",
          "enabled": true
        },
        {
          "id": "vte",
          "label": "VTE prophylaxis",
          "type": "text",
          "enabled": true
        },
        {
          "id": "infant",
          "label": "Infant items (e.g. HBIG)",
          "type": "text",
          "enabled": true
        },
        {
          "id": "discharge_plan",
          "label": "Planned discharge",
          "type": "text",
          "enabled": true
        },
        {
          "id": "gbs",
          "label": "GBS",
          "type": "chip",
          "options": [
            "pos",
            "neg",
            "unknown"
          ],
          "enabled": true
        },
        {
          "id": "abx",
          "label": "Antibiotics",
          "type": "text",
          "enabled": true
        }
      ],
      "antepartum": [
        {
          "id": "magnesium",
          "label": "Magnesium",
          "type": "yn",
          "enabled": true
        },
        {
          "id": "steroids",
          "label": "Antenatal steroids",
          "type": "text",
          "enabled": true
        },
        {
          "id": "bp_plan",
          "label": "BP plan",
          "type": "text",
          "enabled": true
        },
        {
          "id": "surveillance",
          "label": "Fetal surveillance",
          "type": "text",
          "enabled": true
        }
      ]
    }
  }
};
self.LD_BOARD_EXAMPLES = {
  "unit": {
    "example": true,
    "label": "EXAMPLE DATA",
    "site": "unit",
    "as_of": "2026-11-18T01:30:00-06:00",
    "title": "EXAMPLE DATA — 2 AM checkout snapshot",
    "notes": "Layout review only. Fictional example census. Unknown fields left blank. Local-only: data stays on this device; clear at checkout.",
    "unassigned": [
      {
        "initials": "AG",
        "gp": "4/4",
        "ga": "37w",
        "provider": "hospitalist",
        "clinic": "Clinic A",
        "indication": "TOLAC (1 prior C/S, 2 prior VBACs)",
        "mode": "postpartum",
        "next_step": "Routine PP care; watch bleeding",
        "next_due": null,
        "status": "VBAC; 2nd-degree lac repaired; EBL 500, no PPH",
        "updated": "2026-11-17T21:27:00-06:00",
        "fields": {
          "delivery_route": {
            "value": "VBAC",
            "updated": "2026-11-17T09:24:00-06:00"
          },
          "who_delivered": {
            "value": "hospitalist",
            "updated": "2026-11-17T09:24:00-06:00"
          },
          "ebl": {
            "value": "500 mL",
            "updated": "2026-11-17T21:27:00-06:00"
          },
          "pph": {
            "value": "no",
            "updated": "2026-11-17T21:27:00-06:00"
          }
        }
      }
    ],
    "patients": {
      "224": {
        "initials": "JB2",
        "gp": "5/4",
        "ga": "39w3d",
        "provider": "hospitalist",
        "clinic": "Clinic B",
        "indication": "PROM; prior C/S x1, SVD x3; chronic hep B; BMI 40",
        "mode": "postpartum",
        "next_step": "Repeat lactate due ~00:00; AM echo + CBC; enoxaparin if stable; confirm infant HBIG + HBV vaccine",
        "next_due": "2026-11-18T01:40:00-06:00",
        "due_items": [
          {
            "label": "Infant HBIG + HBV vaccine (12 h window)",
            "due": "2026-11-18T01:40:00-06:00"
          },
          {
            "label": "Repeat lactate",
            "due": "2026-11-18T00:00:00-06:00"
          }
        ],
        "status": "Repeat C/S + salpingectomy, uncomplicated. Evening workup: post-op hypotension 80s/40s, asymptomatic; lactate 2.5, BNP 136, hs-TnI 4; ECG NSR. Echo pending.",
        "updated": "2026-11-17T22:12:00-06:00",
        "fields": {
          "gbs": {
            "value": "unknown",
            "updated": "2026-11-17T13:40:00-06:00"
          },
          "abx": {
            "value": "cefazolin + azithromycin at C/S",
            "updated": "2026-11-17T13:40:00-06:00"
          },
          "delivery_route": {
            "value": "CS",
            "updated": "2026-11-17T13:40:00-06:00"
          },
          "delivery_time": {
            "value": "13:40",
            "updated": "2026-11-17T13:40:00-06:00"
          },
          "who_delivered": {
            "value": "hospitalist",
            "updated": "2026-11-17T13:40:00-06:00"
          },
          "pph": {
            "value": "no",
            "updated": "2026-11-17T13:40:00-06:00"
          },
          "vte": {
            "value": "enoxaparin (BMI 40)",
            "updated": "2026-11-17T13:40:00-06:00"
          },
          "infant": {
            "value": "HBIG + HBV vaccine due by 01:40 (confirm given)",
            "updated": "2026-11-17T13:40:00-06:00"
          }
        }
      },
      "236": {
        "initials": "MW",
        "gp": "2/0",
        "ga": "39w0d",
        "provider": "private",
        "clinic": "CTC",
        "indication": "IOL: cHTN on labetalol; suspected LGA 96th %ile",
        "mode": "labor",
        "next_step": "Labor curve; no epidural when last seen",
        "next_due": null,
        "status": "IOL; 6 cm on oxytocin; Cook out; no epidural",
        "updated": "2026-11-18T01:10:00-06:00",
        "fields": {
          "exam": {
            "value": "6 cm",
            "updated": "2026-11-18T01:10:00-06:00"
          },
          "oxytocin": {
            "value": "on",
            "updated": "2026-11-18T01:10:00-06:00"
          },
          "cook": {
            "value": "out",
            "updated": "2026-11-18T01:10:00-06:00"
          },
          "epidural": {
            "value": "no",
            "updated": "2026-11-18T01:10:00-06:00"
          },
          "gbs": {
            "value": "neg",
            "updated": "2026-11-17T09:39:00-06:00"
          },
          "abx": {
            "value": "none (GBS neg)",
            "updated": "2026-11-17T09:39:00-06:00"
          }
        }
      },
      "240": {
        "initials": "NT",
        "gp": "1/0",
        "ga": "30w3d",
        "provider": "private",
        "clinic": "Scales",
        "indication": "Preeclampsia with severe features (severe-range BP)",
        "mode": "antepartum",
        "next_step": "Betamethasone dose 2 due 10:00; continue magnesium and BP control; MFM: low threshold for delivery after steroids",
        "next_due": "2026-11-18T10:00:00-06:00",
        "due_items": [
          {
            "label": "Betamethasone dose 2",
            "due": "2026-11-18T10:00:00-06:00"
          }
        ],
        "status": "Admitted: BP control, magnesium; PEC labs normal",
        "updated": "2026-11-17T21:27:00-06:00",
        "fields": {
          "magnesium": {
            "value": "yes",
            "updated": "2026-11-17T21:27:00-06:00"
          },
          "steroids": {
            "value": "dose 2 due 10:00",
            "updated": "2026-11-17T21:27:00-06:00"
          },
          "bp_plan": {
            "value": "treat severe-range; continue PO agents",
            "updated": "2026-11-17T21:27:00-06:00"
          },
          "surveillance": {
            "value": "continuous while on magnesium",
            "updated": "2026-11-17T21:27:00-06:00"
          }
        }
      },
      "246": {
        "initials": "JB1",
        "gp": "1/0",
        "ga": "36w6d",
        "provider": "hospitalist",
        "clinic": "Clinic A",
        "indication": "PROM at 01:00 (preterm, <37w); h/o chlamydia (azithromycin on admission)",
        "mode": "postpartum",
        "next_step": "Routine PP care",
        "next_due": null,
        "status": "SVD, uncomplicated",
        "updated": "2026-11-17T21:27:00-06:00",
        "fields": {
          "gbs": {
            "value": "unknown",
            "updated": "2026-11-17T21:27:00-06:00"
          },
          "abx": {
            "value": "PCN started",
            "updated": "2026-11-17T21:27:00-06:00"
          },
          "delivery_route": {
            "value": "SVD",
            "updated": "2026-11-17T21:27:00-06:00"
          },
          "who_delivered": {
            "value": "hospitalist",
            "updated": "2026-11-17T21:27:00-06:00"
          },
          "pph": {
            "value": "no",
            "updated": "2026-11-17T21:27:00-06:00"
          }
        }
      },
      "250": {
        "initials": "MB",
        "gp": "3/2",
        "ga": "38w2d",
        "provider": "private",
        "clinic": "Scales",
        "indication": "Active labor; GBS+",
        "mode": "postpartum",
        "next_step": "Routine PP care",
        "next_due": null,
        "status": "SVD, uncomplicated",
        "updated": "2026-11-17T21:27:00-06:00",
        "fields": {
          "epidural": {
            "value": "yes",
            "updated": "2026-11-17T09:41:00-06:00"
          },
          "gbs": {
            "value": "pos",
            "updated": "2026-11-17T21:27:00-06:00"
          },
          "abx": {
            "value": "PCN x2 doses",
            "updated": "2026-11-17T21:27:00-06:00"
          },
          "delivery_route": {
            "value": "SVD",
            "updated": "2026-11-17T21:27:00-06:00"
          },
          "who_delivered": {
            "value": "hospitalist",
            "updated": "2026-11-17T21:27:00-06:00"
          },
          "pph": {
            "value": "no",
            "updated": "2026-11-17T21:27:00-06:00"
          }
        }
      }
    }
  },
  "demo": {
    "example": true,
    "label": "EXAMPLE DATA",
    "site": "demo",
    "as_of": "2026-11-18T01:30:00-06:00",
    "title": "EXAMPLE DATA — Demo Regional snapshot",
    "notes": "Fictional demo census to show a second site config (rooms 101-110, antepartum 109-110, rubella disabled, custom Nitrous item). Local-only: data stays on this device; clear at checkout.",
    "unassigned": [],
    "patients": {
      "103": {
        "initials": "KL",
        "gp": "2/1",
        "ga": "39w2d",
        "provider": "private",
        "clinic": "",
        "indication": "IOL: GDMA2",
        "mode": "labor",
        "next_step": "Recheck exam; epidural requested",
        "next_due": null,
        "status": "IOL, 4 cm, oxytocin on",
        "updated": "2026-11-18T01:05:00-06:00",
        "fields": {
          "exam": {
            "value": "4/50/-2",
            "updated": "2026-11-18T01:05:00-06:00"
          },
          "oxytocin": {
            "value": "6",
            "updated": "2026-11-18T01:05:00-06:00"
          },
          "epidural": {
            "value": "requested",
            "updated": "2026-11-18T01:05:00-06:00"
          },
          "gbs": {
            "value": "pos",
            "updated": "2026-11-17T20:00:00-06:00"
          },
          "abx": {
            "value": "PCN running",
            "updated": "2026-11-17T20:00:00-06:00"
          },
          "nitrous": {
            "value": "no",
            "updated": "2026-11-18T01:05:00-06:00"
          }
        }
      },
      "107": {
        "initials": "RS",
        "gp": "3/2",
        "ga": "38w0d",
        "provider": "hospitalist",
        "clinic": "",
        "indication": "Spontaneous labor",
        "mode": "postpartum",
        "next_step": "Routine PP care",
        "next_due": null,
        "status": "SVD, uncomplicated",
        "updated": "2026-11-17T21:00:00-06:00",
        "fields": {
          "delivery_route": {
            "value": "SVD",
            "updated": "2026-11-17T21:00:00-06:00"
          },
          "delivery_time": {
            "value": "20:40",
            "updated": "2026-11-17T21:00:00-06:00"
          },
          "who_delivered": {
            "value": "hospitalist",
            "updated": "2026-11-17T21:00:00-06:00"
          },
          "ebl": {
            "value": "400 mL",
            "updated": "2026-11-17T21:00:00-06:00"
          },
          "pph": {
            "value": "no",
            "updated": "2026-11-17T21:00:00-06:00"
          },
          "vte": {
            "value": "SCDs",
            "updated": "2026-11-17T21:00:00-06:00"
          },
          "gbs": {
            "value": "neg",
            "updated": "2026-11-17T21:00:00-06:00"
          }
        }
      },
      "109": {
        "initials": "PW",
        "gp": "1/0",
        "ga": "31w4d",
        "provider": "hospitalist",
        "clinic": "",
        "indication": "PPROM",
        "mode": "antepartum",
        "next_step": "Latency antibiotics; steroids complete; watch for labor",
        "next_due": null,
        "status": "Admitted for PPROM; stable",
        "updated": "2026-11-17T21:15:00-06:00",
        "fields": {
          "magnesium": {
            "value": "no",
            "updated": "2026-11-17T21:15:00-06:00"
          },
          "steroids": {
            "value": "course complete",
            "updated": "2026-11-17T21:15:00-06:00"
          },
          "surveillance": {
            "value": "NST q shift",
            "updated": "2026-11-17T21:15:00-06:00"
          }
        }
      }
    }
  }
};
