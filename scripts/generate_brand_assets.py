from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import json
import math
import random

ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / "site-source" / "pages"
FILES = ROOT / "site-source" / "assets" / "files"
random.seed(26)


def font(size, bold=False):
    name = "arialbd.ttf" if bold else "arial.ttf"
    path = Path("C:/Windows/Fonts") / name
    return ImageFont.truetype(str(path), size) if path.exists() else ImageFont.load_default()


def make_logo():
    size = 512
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((28, 28, 484, 484), radius=96, fill="#17201f")
    draw.rounded_rectangle((54, 54, 458, 458), radius=74, fill="#57d6c2")
    draw.polygon([(142, 132), (378, 132), (378, 203), (246, 309), (378, 309), (378, 380), (134, 380), (134, 309), (266, 203), (142, 203)], fill="#ffffff")
    draw.rounded_rectangle((350, 62, 450, 162), radius=28, fill="#ff7664", outline="#17201f", width=16)
    draw.line((375, 112, 425, 112), fill="#17201f", width=14)
    draw.line((400, 87, 400, 137), fill="#17201f", width=14)
    image.save(PAGES / "logo.png", optimize=True)
    image.save(PAGES / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

    optimized_dir = PAGES / "_next"
    for optimized in optimized_dir.glob("image.*"):
        if optimized.name.endswith(".json"):
            continue
        resized = image.resize((48, 48), Image.Resampling.LANCZOS)
        resized.save(optimized, format="PNG", optimize=True)
        header = optimized.with_name(optimized.name + ".headers.json")
        header.write_text(json.dumps({"contentType": "image/png", "status": 200}, indent=2), encoding="utf-8")

    (PAGES / "logo.png.headers.json").write_text(json.dumps({"contentType": "image/png", "status": 200}, indent=2), encoding="utf-8")
    (PAGES / "favicon.ico.headers.json").write_text(json.dumps({"contentType": "image/x-icon", "status": 200}, indent=2), encoding="utf-8")


def gradient(draw, width, y0, y1, top, bottom):
    for y in range(y0, y1):
        t = (y - y0) / max(1, y1 - y0 - 1)
        color = tuple(round(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        draw.line((0, y, width, y), fill=color)


def make_landscape():
    width, height = 1536, 1024
    image = Image.new("RGB", (width, height), "#d8f6ef")
    draw = ImageDraw.Draw(image)
    gradient(draw, width, 0, 650, (191, 239, 235), (255, 239, 196))
    draw.ellipse((1110, 95, 1320, 305), fill="#ffb35d")

    for x, y, scale in [(220, 160, 1.2), (650, 115, 0.9), (960, 220, 0.72)]:
        fill = "#fffdf7"
        draw.ellipse((x, y, x + 150 * scale, y + 60 * scale), fill=fill)
        draw.ellipse((x + 55 * scale, y - 35 * scale, x + 150 * scale, y + 55 * scale), fill=fill)
        draw.ellipse((x + 115 * scale, y + 3 * scale, x + 245 * scale, y + 62 * scale), fill=fill)

    draw.polygon([(0, 600), (240, 330), (430, 565), (640, 280), (900, 585), (1150, 320), (1536, 575), (1536, 760), (0, 760)], fill="#718f87")
    draw.polygon([(0, 650), (310, 430), (510, 625), (770, 390), (990, 620), (1260, 410), (1536, 645), (1536, 770), (0, 770)], fill="#416d68")
    draw.polygon([(0, 700), (270, 545), (500, 705), (760, 505), (1030, 700), (1260, 555), (1536, 710), (1536, 810), (0, 810)], fill="#24514f")

    gradient(draw, width, 660, height, (94, 190, 180), (32, 100, 105))
    for y in range(700, 1000, 18):
        for _ in range(7):
            x = random.randint(0, width - 170)
            length = random.randint(35, 170)
            draw.line((x, y, x + length, y), fill=random.choice(["#a6ded2", "#f4d996", "#75c7bb"]), width=random.randint(2, 5))

    draw.polygon([(0, 845), (240, 805), (440, 850), (580, 1024), (0, 1024)], fill="#173d3b")
    draw.polygon([(1536, 820), (1310, 790), (1120, 875), (1030, 1024), (1536, 1024)], fill="#173d3b")

    for x in list(range(20, 500, 48)) + list(range(1120, 1530, 52)):
        base = random.randint(790, 940)
        h = random.randint(90, 210)
        draw.rectangle((x - 4, base - h, x + 4, base), fill="#172f2e")
        for offset in range(18, h - 10, 22):
            spread = max(16, int((h - offset) * 0.23))
            draw.polygon([(x, base - h + offset - 28), (x - spread, base - h + offset + 15), (x + spread, base - h + offset + 15)], fill="#24514a")

    balloon_x, balloon_y = 365, 255
    draw.ellipse((balloon_x, balloon_y, balloon_x + 118, balloon_y + 145), fill="#ff7664", outline="#17201f", width=6)
    draw.pieslice((balloon_x + 18, balloon_y, balloon_x + 100, balloon_y + 145), 90, 270, fill="#ffd36b")
    draw.line((balloon_x + 42, balloon_y + 130, balloon_x + 50, balloon_y + 175), fill="#17201f", width=4)
    draw.line((balloon_x + 78, balloon_y + 130, balloon_x + 68, balloon_y + 175), fill="#17201f", width=4)
    draw.rounded_rectangle((balloon_x + 45, balloon_y + 168, balloon_x + 73, balloon_y + 194), radius=4, fill="#784e38")

    van_x, van_y = 690, 685
    draw.rounded_rectangle((van_x, van_y, van_x + 360, van_y + 176), radius=36, fill="#ff7664", outline="#17201f", width=8)
    draw.polygon([(van_x + 245, van_y), (van_x + 325, van_y), (van_x + 360, van_y + 70), (van_x + 245, van_y + 70)], fill="#d9f5ef", outline="#17201f")
    draw.rounded_rectangle((van_x + 35, van_y + 30, van_x + 215, van_y + 112), radius=12, fill="#fff8e8", outline="#17201f", width=6)
    draw.line((van_x + 125, van_y + 32, van_x + 125, van_y + 110), fill="#17201f", width=5)
    for wheel_x in (van_x + 75, van_x + 288):
        draw.ellipse((wheel_x - 35, van_y + 138, wheel_x + 35, van_y + 208), fill="#17201f")
        draw.ellipse((wheel_x - 14, van_y + 159, wheel_x + 14, van_y + 187), fill="#d4e5df")
    draw.rounded_rectangle((van_x + 152, van_y + 126, van_x + 226, van_y + 150), radius=8, fill="#57d6c2")

    title_font = font(34, bold=True)
    draw.text((40, 50), "ZIPIMG / LOCAL IMAGE LAB", fill="#17201f", font=title_font)
    draw.text((42, 94), "COLOR  •  DETAIL  •  CLARITY", fill="#416d68", font=font(18, bold=True))

    noise = Image.new("RGBA", image.size, (0, 0, 0, 0))
    noise_draw = ImageDraw.Draw(noise)
    for _ in range(22000):
        x = random.randrange(width)
        y = random.randrange(height)
        shade = random.choice([(255, 255, 255, 15), (15, 45, 42, 12)])
        noise_draw.point((x, y), fill=shade)
    image = Image.alpha_composite(image.convert("RGBA"), noise).convert("RGB")
    image = image.filter(ImageFilter.UnsharpMask(radius=1.2, percent=105, threshold=3))

    original = FILES / "32b3f474-e6c6-4928-8ea1-d7915bfe604c.png"
    compressed = FILES / "4e41561c-43ae-4c82-b29b-a8d9dc87e710.jpg"
    image.save(original, format="PNG", optimize=True)
    image.save(compressed, format="JPEG", quality=68, optimize=True, progressive=True)


if __name__ == "__main__":
    make_logo()
    make_landscape()
    print("Generated ZipImg logo, favicon, and comparison artwork.")
