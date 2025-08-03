import os
import sys
import time
import webbrowser
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

directory = Path(__file__).parent
FONT = ImageFont.truetype(f"{directory.absolute()}/opensans.ttf", 75)

types = list(map(lambda p: p.name[:-4], Path(__file__).parent.glob("*.png")))
if len(sys.argv) != 3:
    print(f"expected 2 args: route_number, route_type [{'|'.join(types)}]")
    exit(1)

route_number, route_type = sys.argv[1:]
if route_type not in types:
    print(f"invalid type given (got {route_type}, but expected one of [{'|'.join(types)}])")
    exit(1)
text_colour = "FFFFFF" if route_type != "local-limited" else "6E6E70"
img = Image.open(f"{directory.absolute()}/{route_type}.png")
draw = ImageDraw.Draw(img)

textsize = FONT.getbbox(route_number)
x, y = (img.width - textsize[2]) // 2, 0
draw.text((x, y), route_number, fill="#" + text_colour, font=FONT)

out_file = f"/tmp/{route_number}-{route_type}.png"
img.save(out_file)
webbrowser.open(f"file://{out_file}")
time.sleep(0.2)
os.remove(out_file)
