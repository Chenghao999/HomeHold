#!/usr/bin/env python3
"""Generate HomeHold's extension icons.

Pure standard library (zlib + struct), so the icons can be regenerated without
installing Pillow. Shapes are rasterised with 4x supersampling to keep the
edges smooth at small sizes.

Usage:
    python3 tools/make-icons.py
"""

import struct
import zlib
from pathlib import Path

BACKGROUND = (0x4F, 0x46, 0xE5)  # indigo
FOREGROUND = (0xFF, 0xFF, 0xFF)  # house glyph
SUPERSAMPLE = 4
SIZES = (48, 96)
OUT_DIR = Path(__file__).resolve().parent.parent / "icons"


def in_rounded_square(x, y, radius=0.22):
    """Point-in-rounded-square test over the unit square."""
    cx = min(max(x, radius), 1 - radius)
    cy = min(max(y, radius), 1 - radius)
    dx, dy = x - cx, y - cy
    return dx * dx + dy * dy <= radius * radius


def _edge(px, py, ax, ay, bx, by):
    return (px - bx) * (ay - by) - (ax - bx) * (py - by)


def in_triangle(point, a, b, c):
    d1 = _edge(point[0], point[1], a[0], a[1], b[0], b[1])
    d2 = _edge(point[0], point[1], b[0], b[1], c[0], c[1])
    d3 = _edge(point[0], point[1], c[0], c[1], a[0], a[1])
    has_negative = d1 < 0 or d2 < 0 or d3 < 0
    has_positive = d1 > 0 or d2 > 0 or d3 > 0
    return not (has_negative and has_positive)


def in_house(x, y):
    """A house with a doorway cut out of it."""
    roof = in_triangle((x, y), (0.50, 0.18), (0.08, 0.53), (0.92, 0.53))
    body = 0.22 <= x <= 0.78 and 0.53 <= y <= 0.84
    doorway = 0.43 <= x <= 0.57 and 0.63 <= y <= 0.84
    return roof or (body and not doorway)


def render(size):
    """Return straight-alpha RGBA bytes for one icon."""
    samples = SUPERSAMPLE * SUPERSAMPLE
    pixels = bytearray()

    for py in range(size):
        for px in range(size):
            covered = 0
            glyph = 0
            for sy in range(SUPERSAMPLE):
                for sx in range(SUPERSAMPLE):
                    x = (px + (sx + 0.5) / SUPERSAMPLE) / size
                    y = (py + (sy + 0.5) / SUPERSAMPLE) / size
                    if not in_rounded_square(x, y):
                        continue
                    covered += 1
                    if in_house(x, y):
                        glyph += 1

            if covered == 0:
                pixels += bytes((0, 0, 0, 0))
                continue

            # Both layers are opaque, so straight alpha is just the coverage
            # and the colour is the glyph/background mix over the covered area.
            mix = glyph / covered
            pixels += bytes(
                round(BACKGROUND[i] * (1 - mix) + FOREGROUND[i] * mix) for i in range(3)
            ) + bytes((round(255 * covered / samples),))

    return bytes(pixels)


def write_png(path, size, pixels):
    def chunk(tag, data):
        checksum = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", checksum)

    stride = size * 4
    raw = bytearray()
    for row in range(size):
        raw.append(0)  # filter type: none
        raw += pixels[row * stride : (row + 1) * stride]

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")

    path.write_bytes(png)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        path = OUT_DIR / f"icon-{size}.png"
        write_png(path, size, render(size))
        print(f"wrote {path.relative_to(OUT_DIR.parent)} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
