#!/usr/bin/env python

import json

IN  = "./data/vulnerable.txt"
OUT = "./data/vulnerable.json"

with open(IN) as in_fp:
    domains = [ line.strip() for line in in_fp.readlines() ]

with open(OUT, "w") as out_fp:
    out_fp.write(json.dumps(domains))
