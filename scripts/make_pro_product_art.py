#!/usr/bin/env python3
"""Genera imágenes de producto limpias (estilo catálogo digital) para la revista."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path("/workspace/public/catalog/digital/products")
OUT.mkdir(parents=True, exist_ok=True)

PAPER = [
    (227, 27, 35),
    (240, 160, 26),
    (242, 209, 43),
    (126, 198, 63),
    (31, 111, 181),
    (94, 196, 232),
    (107, 63, 160),
    (232, 75, 138),
    (34, 37, 43),
    (192, 196, 204),
]


def blank(w=640, h=480, color=(255, 255, 255)) -> Image.Image:
    return Image.new("RGB", (w, h), color)


def fan_sheets(path: str, colors: list[tuple[int, int, int]] | None = None) -> None:
    img = blank()
    draw = ImageDraw.Draw(img)
    cols = colors or PAPER
    cx, cy = 320, 430
    for i, color in enumerate(cols):
        angle = -36 + i * (72 / max(len(cols) - 1, 1))
        # Approximate rotated rectangles with polygons.
        import math

        rad = math.radians(angle)
        w, h = 92, 280
        pts = [(-w / 2, -h), (w / 2, -h), (w / 2, 0), (-w / 2, 0)]
        rot = []
        for x, y in pts:
            rx = cx + x * math.cos(rad) - y * math.sin(rad)
            ry = cy + x * math.sin(rad) + y * math.cos(rad)
            rot.append((rx, ry))
        draw.polygon(rot, fill=color, outline=(20, 24, 40))
    img.save(OUT / path, quality=92)


def rolls(path: str) -> None:
    img = blank()
    draw = ImageDraw.Draw(img)
    colors = PAPER[:8]
    for i, color in enumerate(colors):
        x = 70 + i * 65
        draw.rounded_rectangle((x, 70, x + 48, 410), radius=18, fill=color, outline=(20, 24, 40), width=2)
        draw.ellipse((x - 2, 55, x + 50, 95), fill=tuple(min(255, c + 35) for c in color), outline=(20, 24, 40))
        draw.ellipse((x - 2, 385, x + 50, 425), fill=tuple(max(0, c - 25) for c in color), outline=(20, 24, 40))
    img.save(OUT / path, quality=92)


def bottles(path: str, n: int = 7) -> None:
    img = blank()
    draw = ImageDraw.Draw(img)
    for i in range(n):
        x = 40 + i * 80
        body = PAPER[i % len(PAPER)]
        draw.rounded_rectangle((x, 140, x + 54, 390), radius=12, fill=(245, 246, 250), outline=(11, 31, 107), width=2)
        draw.rectangle((x + 12, 100, x + 42, 150), fill=body, outline=(11, 31, 107), width=2)
        draw.ellipse((x + 8, 360, x + 46, 400), fill=body)
    img.save(OUT / path, quality=92)


def markers(path: str, n: int = 10) -> None:
    img = blank()
    draw = ImageDraw.Draw(img)
    for i in range(n):
        color = PAPER[i % len(PAPER)]
        x0, y0 = 40 + i * 58, 90
        draw.rounded_rectangle((x0, y0, x0 + 42, y0 + 300), radius=10, fill=color, outline=(20, 24, 40), width=2)
        draw.polygon([(x0 + 8, y0), (x0 + 34, y0), (x0 + 28, y0 - 28), (x0 + 14, y0 - 28)], fill=(250, 250, 250), outline=(20, 24, 40))
    img.save(OUT / path, quality=92)


def boxes(path: str) -> None:
    img = blank()
    draw = ImageDraw.Draw(img)
    packs = [
        ((60, 120, 220, 340), (227, 27, 35)),
        ((250, 100, 420, 340), (31, 111, 181)),
        ((450, 130, 590, 340), (240, 160, 26)),
    ]
    for box, color in packs:
        draw.rounded_rectangle(box, radius=14, fill=color, outline=(20, 24, 40), width=3)
        x0, y0, x1, y1 = box
        draw.rectangle((x0 + 18, y0 + 24, x1 - 18, y0 + 70), fill=(255, 255, 255))
    img.save(OUT / path, quality=92)


def brushes(path: str) -> None:
    img = blank()
    draw = ImageDraw.Draw(img)
    for i in range(8):
        x = 70 + i * 70
        draw.rounded_rectangle((x, 120, x + 18, 360), radius=6, fill=(166, 120, 70), outline=(80, 50, 25), width=2)
        tip = PAPER[i % len(PAPER)]
        draw.ellipse((x - 6, 90, x + 24, 140), fill=tip, outline=(40, 40, 40))
    img.save(OUT / path, quality=92)


def dough(path: str) -> None:
    img = blank()
    draw = ImageDraw.Draw(img)
    for i, color in enumerate(PAPER[:8]):
        x = 50 + (i % 4) * 140
        y = 90 + (i // 4) * 170
        draw.rounded_rectangle((x, y, x + 110, y + 130), radius=18, fill=color, outline=(20, 24, 40), width=2)
    img.save(OUT / path, quality=92)


def main() -> None:
    fan_sheets("cartulinas.jpg")
    rolls("papel-afiche.jpg")
    fan_sheets("papel-crepe.jpg", PAPER[::-1])
    rolls("microcorrugado.jpg")
    fan_sheets("papel-barrilete.jpg", PAPER[::2] + PAPER[1::2])
    fan_sheets("goma-eva.jpg")
    rolls("autoadhesivo-contac.jpg")

    boxes("block-blanco-color.jpg")
    boxes("block-fantasia.jpg")
    fan_sheets("papel-glace-luma.jpg")
    fan_sheets("papel-glace-tn.jpg", PAPER[3:])
    fan_sheets("papel-glace-mil28.jpg", PAPER[::1])
    rolls("rollo-metalizado.jpg")

    bottles("adhesivos-vinilicos.jpg", 8)
    bottles("adhesivo-barra.jpg", 4)
    bottles("silicona-liquida.jpg", 4)
    bottles("plasticola-color.jpg", 6)
    bottles("plasticola-brillo.jpg", 4)
    bottles("plasticola-fluo.jpg", 3)
    rolls("silicona-barra.jpg")
    bottles("pegamentos.jpg", 4)

    bottles("tempera-acuarel.jpg", 5)
    bottles("tempera-pomo.jpg", 6)
    boxes("acuarelas.jpg")
    boxes("lavapinceles.jpg")
    boxes("paleta-mezcladora.jpg")

    brushes("pincel-chato-redondo.jpg")
    brushes("set-pinceles.jpg")
    bottles("taponadores.jpg", 3)
    rolls("rodillos.jpg")
    brushes("herramientas-pintar.jpg")

    dough("masa-masilina.jpg")
    boxes("plastilinas.jpg")
    dough("masa-foamy.jpg")
    rolls("rodillos-plasticos.jpg")
    brushes("estecas-plasticas.jpg")
    boxes("cortantes-plasticos.jpg")

    markers("filgo-acqua.jpg")
    markers("filgo-jumbo.jpg", 8)
    markers("filgo-pinto.jpg", 9)
    markers("trabi-420.jpg")
    markers("trabi-surtidos.jpg", 8)
    markers("giotto-turbo-maxi.jpg")
    markers("giotto-turbo-color.jpg", 8)

    markers("trabi-410.jpg", 4)
    markers("trabi-411.jpg", 4)
    markers("filgo-050.jpg", 6)
    markers("simball-500.jpg", 6)
    markers("filgo-whiteboard.jpg", 4)
    markers("trabi-450.jpg", 10)
    markers("edding-363.jpg", 4)

    print(f"generated {len(list(OUT.glob('*.jpg')))} product arts in {OUT}")


if __name__ == "__main__":
    main()
