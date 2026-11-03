# Contact sheet of look.mjs screenshots, so a whole page can be judged in one image.
# usage: python3 scripts/sheet.py <shots dir> <prefix e.g. home-desktop-light> <out.jpg> [cols] [scale]
import sys, glob
from PIL import Image

d, pre, out = sys.argv[1:4]
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 2
scale = float(sys.argv[5]) if len(sys.argv) > 5 else 0.5
fs = sorted(glob.glob(f"{d}/{pre}-[0-9][0-9].jpg"))
ims = [Image.open(f) for f in fs]
w, h = int(ims[0].width * scale), int(ims[0].height * scale)
rows = (len(ims) + cols - 1) // cols
c = Image.new("RGB", (cols * w + (cols - 1) * 8, rows * h + (rows - 1) * 8), "#888")
for i, im in enumerate(ims):
    c.paste(im.resize((w, h)), ((i % cols) * (w + 8), (i // cols) * (h + 8)))
c.save(out, quality=72)
print(out, len(ims), "frames")
