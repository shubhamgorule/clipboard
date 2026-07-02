#!/usr/bin/env python3
"""Generate simple placeholder PNG icons until final store assets are added."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "store" / "icons"
BG = (26, 26, 26)
FG = (255, 255, 255)


def png_chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)


def write_png(path: Path, size: int) -> None:
    pixels = bytearray()
    pad = max(2, size // 16)
    inner = size - pad * 2
    for y in range(size):
        pixels.append(0)
        for x in range(size):
            in_clip = pad <= x < size - pad and pad <= y < size - pad
            in_clip_top = in_clip and y < pad + inner // 4
            in_body = in_clip and not in_clip_top
            if in_clip_top or in_body:
                pixels.extend(FG)
            else:
                pixels.extend(BG)
    raw = zlib.compress(bytes(pixels), 9)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n"
    png += png_chunk(b"IHDR", ihdr)
    png += png_chunk(b"IDAT", raw)
    png += png_chunk(b"IEND", b"")
    path.write_bytes(png)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for size in (16, 48, 128):
        write_png(OUT / f"icon{size}.png", size)
    print(f"Wrote placeholder icons to {OUT}")


if __name__ == "__main__":
    main()
