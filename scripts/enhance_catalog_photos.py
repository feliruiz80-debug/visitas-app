#!/usr/bin/env python3
"""Mejora las fotos reales de cada hoja del catálogo (sin ilustrar)."""

from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageOps

ROOT = Path("/workspace")
SRC = ROOT / "tmp/src-pages"
OUT = ROOT / "public/catalog/pages"
OUT.mkdir(parents=True, exist_ok=True)

FILES = [
    "03-papeleria.jpg",
    "04-blocks-papel-glace.jpg",
    "05-adhesivos.jpg",
    "07-temperas-acuarelas.jpg",
    "08-pinceles.jpg",
    "09-masas-plastilinas.jpg",
    "10-marcadores-agua.jpg",
    "11-marcadores-permanentes.jpg",
]


def enhance_pil(path: Path) -> Image.Image:
    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")

    # Upscale x2 con LANCZOS para ganar detalle usable en web.
    w, h = im.size
    im = im.resize((w * 2, h * 2), Image.Resampling.LANCZOS)

    # Contraste / color / nitidez suaves (foto real, no ilustración).
    im = ImageEnhance.Contrast(im).enhance(1.12)
    im = ImageEnhance.Color(im).enhance(1.08)
    im = ImageEnhance.Sharpness(im).enhance(1.35)
    im = ImageEnhance.Brightness(im).enhance(1.04)

    # Limpieza de ruido leve.
    arr = np.array(im)
    bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
    den = cv2.bilateralFilter(bgr, d=5, sigmaColor=30, sigmaSpace=30)

    # Empuja papel a blanco más limpio.
    hsv = cv2.cvtColor(den, cv2.COLOR_BGR2HSV).astype(np.float32)
    hch, s, v = cv2.split(hsv)
    paper = (s < 34) & (v > 178)
    v[paper] = np.clip(v[paper] * 1.04 + 12, 0, 255)
    s[paper] *= 0.3
    clean = cv2.cvtColor(cv2.merge([hch, s, v]).astype(np.uint8), cv2.COLOR_HSV2BGR)

    # Unsharp mask liviano.
    blur = cv2.GaussianBlur(clean, (0, 0), 1.0)
    sharp = cv2.addWeighted(clean, 1.35, blur, -0.35, 0)

    # Ancho final ~1400 para revista.
    rgb = cv2.cvtColor(sharp, cv2.COLOR_BGR2RGB)
    out = Image.fromarray(rgb)
    tw = 1400
    if out.size[0] != tw:
        nh = int(round(out.size[1] * (tw / out.size[0])))
        out = out.resize((tw, nh), Image.Resampling.LANCZOS)
    return out


def main() -> None:
    for name in FILES:
        src = SRC / name
        if not src.exists():
            print(f"missing {name}")
            continue
        out = enhance_pil(src)
        dest = OUT / name
        out.save(dest, quality=92, optimize=True)
        print(f"-> {dest.relative_to(ROOT)} {out.size[0]}x{out.size[1]}")

    # Limpiar hojas mal cortadas de spreads si quedaron.
    for stale in ["01-portada.jpg", "02-pedido.jpg", "06-temperas.jpg"]:
        p = OUT / stale
        if p.exists() and stale != "01-portada.jpg":
            # 02 y 06 de spreads mal cortados: borrar
            if stale in {"02-pedido.jpg", "06-temperas.jpg"}:
                p.unlink()
                print(f"removed bad crop {stale}")


if __name__ == "__main__":
    main()
