"""Generate synthetic heat-stress meter screens for the meter-photo eval.

Run: python3 scripts/fixtures/meter_photos.py
Writes tests/ai-evals/meter-photos/<name>-<expected F with _ for the decimal>.png
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = Path("tests/ai-evals/meter-photos")
FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def font(size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(FONT, size)
    except OSError:
        return ImageFont.load_default(size)


def screen(rows: list[tuple[str, str, int]], bg: str, fg: str, size=(900, 640)) -> Image.Image:
    img = Image.new("RGB", (size[0] + 120, size[1] + 120), "#3a3a3a")
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([60, 60, 60 + size[0], 60 + size[1]], radius=36, fill=bg)
    y = 100
    for label, value, px in rows:
        d.text((110, y + px // 3), label, font=font(42), fill=fg)
        d.text((60 + size[0] - 60, y), value, font=font(px), fill=fg, anchor="ra")
        y += px + 40
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    # Several readings on one screen; only one is WBGT.
    screen([("TEMP", "94.1 °F", 70), ("RH", "48 %", 70), ("GLOBE", "118.2 °F", 70), ("WBGT", "86.9 °F", 120)], "#c9d4b8", "#111").save(
        OUT / "multi-reading-86_9.png"
    )
    # Celsius display: 31.5 °C is 88.7 °F.
    screen([("WBGT", "31.5 °C", 160), ("TA", "35.2 °C", 60)], "#d8dccb", "#111").save(OUT / "celsius-88_7.png")
    # Dark LCD with heat index shown next to WBGT, photographed slightly tilted and soft.
    img = screen([("HEAT INDEX", "104 °F", 60), ("WBGT", "91.3 °F", 150), ("WIND", "3.2 mph", 50)], "#101820", "#7CFFB2")
    img.rotate(4, expand=True, fillcolor="#3a3a3a").filter(ImageFilter.GaussianBlur(1.6)).save(OUT / "dark-tilted-91_3.png")


if __name__ == "__main__":
    main()
