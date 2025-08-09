#!/bin/python3

import sys
import re

FPS = 60
EXPR = re.compile(r"(?P<w1>\d+)(?:\.(?P<d1>\d+))?\s*(?P<op>[\+\-\*/])\s*(?P<w2>\d+)(?:\.(?P<d2>\d+))?")

m = EXPR.match("".join(sys.argv[1:])).groupdict()
eqn = f"{float(m['w1']) + float(m['d1'])/FPS}{m['op']}{float(m['w2']) + float(m['d2'])/FPS}"
print(round(eval(eqn), 10))


# s * f/s
# f / (f/s)
