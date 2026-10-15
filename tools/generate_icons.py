"""Renders the app icons into public/. Run: python3 tools/generate_icons.py [#rrggbb]

The accent colour should match --color-accent in src/styles.scss.
Content stays inside the central 80 % so Android's circular masks never cut it off.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ACCENT = sys.argv[1] if len(sys.argv) > 1 else '#e8743b'
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
SOURCE_SIZE = 1024
PUBLIC = Path(__file__).resolve().parent.parent / 'public'


def lighten(hex_color: str, amount: float) -> tuple[int, int, int]:
    red, green, blue = (int(hex_color[i : i + 2], 16) for i in (1, 3, 5))
    return tuple(round(channel + (255 - channel) * amount) for channel in (red, green, blue))


def render_source() -> Image.Image:
    size = SOURCE_SIZE
    image = Image.new('RGB', (size, size), ACCENT)
    draw = ImageDraw.Draw(image)

    # Soft vertical gradient: lighter at the top.
    top, bottom = lighten(ACCENT, 0.18), tuple(int(ACCENT[i : i + 2], 16) for i in (1, 3, 5))
    for y in range(size):
        mix = y / (size - 1)
        colour = tuple(round(t + (b - t) * mix) for t, b in zip(top, bottom))
        draw.line([(0, y), (size, y)], fill=colour)

    # White card holding the question mark.
    card = (size * 0.22, size * 0.22, size * 0.78, size * 0.78)
    draw.rounded_rectangle(card, radius=size * 0.12, fill='white')

    font = ImageFont.truetype(FONT, int(size * 0.5))
    draw.text((size / 2, size * 0.5), '?', font=font, fill=ACCENT, anchor='mm')

    # Small operators on the corners of the card hint at the maths.
    small = ImageFont.truetype(FONT, int(size * 0.15))
    draw.text((size * 0.335, size * 0.335), '+', font=small, fill=ACCENT, anchor='mm')
    draw.text((size * 0.665, size * 0.665), '=', font=small, fill=ACCENT, anchor='mm')
    return image


def main() -> None:
    source = render_source()
    icons = PUBLIC / 'icons'
    for edge in (72, 96, 128, 144, 152, 180, 192, 384, 512):
        source.resize((edge, edge), Image.LANCZOS).save(icons / f'icon-{edge}x{edge}.png')
    source.resize((32, 32), Image.LANCZOS).save(PUBLIC / 'favicon.png')
    source.save(PUBLIC / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    print(f'Icons written with accent {ACCENT}')


if __name__ == '__main__':
    main()
