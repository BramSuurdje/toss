#!/usr/bin/env python3
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
FONT_PATH = ASSETS / "LeckerliOne.ttf"
ICON_PATH = ASSETS / "extension-icon.png"
FONT_URL = (
    "https://fonts.gstatic.com/s/leckerlione/v21/"
    "V8mCoQH8VCsNttEnxnGQ-1itLZxcBtItFw.ttf"
)


def squircle_mask(size: int) -> Image.Image:
    """macOS-style squircle (superellipse, n=5)."""
    mask = Image.new("L", (size, size), 0)
    pixels = mask.load()
    center = (size - 1) / 2
    scale = size / 2
    exponent = 5.0
    xs = [abs((x - center) / scale) ** exponent for x in range(size)]

    for y in range(size):
        ny = abs((y - center) / scale) ** exponent
        for x in range(size):
            if xs[x] + ny <= 1.0:
                pixels[x, y] = 255

    return mask


ASSETS.mkdir(parents=True, exist_ok=True)
if not FONT_PATH.exists():
    urllib.request.urlretrieve(FONT_URL, FONT_PATH)

size = 512
img = Image.new("RGBA", (size, size), "#ffffff")
draw = ImageDraw.Draw(img)
font = ImageFont.truetype(str(FONT_PATH), 250)

text = "T"
bbox = draw.textbbox((0, 0), text, font=font)
x = (size - (bbox[2] - bbox[0])) / 2 - bbox[0]
y = (size - (bbox[3] - bbox[1])) / 2 - bbox[1]
draw.text((x, y), text, font=font, fill="#171717")

img.putalpha(squircle_mask(size))
img.save(ICON_PATH, "PNG")
print(ICON_PATH)
