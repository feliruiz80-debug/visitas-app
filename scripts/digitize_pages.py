#!/usr/bin/env python3
"""Limpia fotos del catálogo y genera páginas digitales nítidas + crops de producto."""

from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

ROOT = Path("/workspace")
SRC_DIR = ROOT / "public/catalog/pages"
OUT_DIR = ROOT / "public/catalog/digital"
PRODUCT_DIR = OUT_DIR / "products"

# Crops relativos (x, y, w, h) en fracción 0–1 sobre cada página limpia.
PRODUCT_CROPS: dict[str, list[tuple[str, tuple[float, float, float, float]]]] = {
    "03-papeleria": [
        ("cartulinas", (0.05, 0.12, 0.42, 0.28)),
        ("papel-afiche", (0.04, 0.48, 0.22, 0.22)),
        ("papel-crepe", (0.28, 0.48, 0.22, 0.22)),
        ("microcorrugado", (0.52, 0.48, 0.22, 0.22)),
        ("papel-barrilete", (0.76, 0.48, 0.20, 0.22)),
        ("goma-eva", (0.04, 0.72, 0.45, 0.18)),
        ("autoadhesivo-contac", (0.52, 0.72, 0.44, 0.18)),
    ],
    "04-blocks-papel-glace": [
        ("block-blanco-color", (0.04, 0.14, 0.44, 0.28)),
        ("block-fantasia", (0.52, 0.14, 0.44, 0.28)),
        ("papel-glace-luma", (0.04, 0.52, 0.45, 0.18)),
        ("papel-glace-tn", (0.52, 0.52, 0.44, 0.18)),
        ("papel-glace-mil28", (0.04, 0.72, 0.45, 0.16)),
        ("rollo-metalizado", (0.52, 0.72, 0.44, 0.16)),
    ],
    "05-adhesivos": [
        ("adhesivos-vinilicos", (0.06, 0.12, 0.88, 0.18)),
        ("adhesivo-barra", (0.04, 0.34, 0.44, 0.18)),
        ("silicona-liquida", (0.52, 0.34, 0.44, 0.18)),
        ("plasticola-color", (0.04, 0.54, 0.28, 0.16)),
        ("plasticola-brillo", (0.36, 0.54, 0.28, 0.16)),
        ("plasticola-fluo", (0.68, 0.54, 0.28, 0.16)),
        ("silicona-barra", (0.04, 0.72, 0.44, 0.16)),
        ("pegamentos", (0.52, 0.72, 0.44, 0.16)),
    ],
    "07-temperas-acuarelas": [
        ("tempera-acuarel", (0.04, 0.14, 0.44, 0.22)),
        ("tempera-pomo", (0.52, 0.14, 0.44, 0.22)),
        ("acuarelas", (0.06, 0.40, 0.88, 0.22)),
        ("lavapinceles", (0.04, 0.68, 0.44, 0.16)),
        ("paleta-mezcladora", (0.52, 0.68, 0.44, 0.16)),
    ],
    "08-pinceles": [
        ("pincel-chato-redondo", (0.05, 0.14, 0.90, 0.34)),
        ("set-pinceles", (0.04, 0.52, 0.28, 0.20)),
        ("taponadores", (0.36, 0.52, 0.28, 0.20)),
        ("rodillos", (0.68, 0.52, 0.28, 0.20)),
        ("herramientas-pintar", (0.08, 0.74, 0.84, 0.14)),
    ],
    "09-masas-plastilinas": [
        ("masa-masilina", (0.05, 0.14, 0.90, 0.24)),
        ("plastilinas", (0.04, 0.42, 0.44, 0.20)),
        ("masa-foamy", (0.52, 0.42, 0.44, 0.20)),
        ("rodillos-plasticos", (0.04, 0.66, 0.28, 0.20)),
        ("estecas-plasticas", (0.36, 0.66, 0.28, 0.20)),
        ("cortantes-plasticos", (0.68, 0.66, 0.28, 0.20)),
    ],
    "10-marcadores-agua": [
        ("filgo-acqua", (0.05, 0.18, 0.28, 0.20)),
        ("filgo-jumbo", (0.36, 0.18, 0.28, 0.20)),
        ("filgo-pinto", (0.68, 0.18, 0.28, 0.20)),
        ("trabi-420", (0.05, 0.42, 0.28, 0.20)),
        ("trabi-surtidos", (0.36, 0.42, 0.28, 0.20)),
        ("giotto-turbo-maxi", (0.05, 0.66, 0.28, 0.20)),
        ("giotto-turbo-color", (0.36, 0.66, 0.28, 0.20)),
    ],
    "11-marcadores-permanentes": [
        ("trabi-410", (0.05, 0.16, 0.28, 0.18)),
        ("trabi-411", (0.36, 0.16, 0.28, 0.18)),
        ("filgo-050", (0.05, 0.38, 0.28, 0.16)),
        ("simball-500", (0.36, 0.38, 0.28, 0.16)),
        ("filgo-whiteboard", (0.05, 0.62, 0.28, 0.18)),
        ("trabi-450", (0.36, 0.62, 0.28, 0.18)),
        ("edding-363", (0.68, 0.62, 0.28, 0.18)),
    ],
}


def enhance(bgr: np.ndarray) -> np.ndarray:
    """Blanco más limpio, contraste y nitidez tipo escaneo."""
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8))
    l2 = clahe.apply(l)
    lab2 = cv2.merge([l2, a, b])
    vivid = cv2.cvtColor(lab2, cv2.COLOR_LAB2BGR)

    # Empuja fondos claros hacia blanco puro.
    hsv = cv2.cvtColor(vivid, cv2.COLOR_BGR2HSV).astype(np.float32)
    h, s, v = cv2.split(hsv)
    mask = (s < 42) & (v > 185)
    v[mask] = np.minimum(255, v[mask] * 1.08 + 12)
    s[mask] = s[mask] * 0.35
    hsv2 = cv2.merge([h, s, v]).astype(np.uint8)
    clean = cv2.cvtColor(hsv2, cv2.COLOR_HSV2BGR)

    denoised = cv2.bilateralFilter(clean, d=5, sigmaColor=40, sigmaSpace=40)
    blur = cv2.GaussianBlur(denoised, (0, 0), 1.1)
    sharp = cv2.addWeighted(denoised, 1.35, blur, -0.35, 0)
    return sharp


def upscale(bgr: np.ndarray, target_w: int = 1400) -> np.ndarray:
    h, w = bgr.shape[:2]
    if w >= target_w:
        return bgr
    scale = target_w / w
    return cv2.resize(bgr, (target_w, int(round(h * scale))), interpolation=cv2.INTER_CUBIC)


def crop_frac(img: np.ndarray, box: tuple[float, float, float, float]) -> np.ndarray:
    h, w = img.shape[:2]
    x, y, bw, bh = box
    x0 = max(0, int(x * w))
    y0 = max(0, int(y * h))
    x1 = min(w, int((x + bw) * w))
    y1 = min(h, int((y + bh) * h))
    return img[y0:y1, x0:x1]


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PRODUCT_DIR.mkdir(parents=True, exist_ok=True)

    pages = sorted(SRC_DIR.glob("*.jpg"))
    for path in pages:
        if path.name.startswith("01-"):
            continue
        key = path.stem
        raw = cv2.imread(str(path))
        if raw is None:
            print(f"skip {path}")
            continue
        digital = enhance(upscale(raw))
        out = OUT_DIR / f"{key}.jpg"
        cv2.imwrite(str(out), digital, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
        print(f"page -> {out.relative_to(ROOT)} ({digital.shape[1]}x{digital.shape[0]})")

        for product_id, box in PRODUCT_CROPS.get(key, []):
            crop = crop_frac(digital, box)
            if crop.size == 0:
                continue
            # Pad a ratio 4:3 con blanco para tarjetas.
            ch, cw = crop.shape[:2]
            target_ratio = 4 / 3
            current = cw / max(ch, 1)
            if current > target_ratio:
                new_h = int(cw / target_ratio)
                pad = max(0, new_h - ch)
                top, bottom = pad // 2, pad - pad // 2
                crop = cv2.copyMakeBorder(crop, top, bottom, 0, 0, cv2.BORDER_CONSTANT, value=(255, 255, 255))
            else:
                new_w = int(ch * target_ratio)
                pad = max(0, new_w - cw)
                left, right = pad // 2, pad - pad // 2
                crop = cv2.copyMakeBorder(crop, 0, 0, left, right, cv2.BORDER_CONSTANT, value=(255, 255, 255))
            crop = cv2.resize(crop, (640, 480), interpolation=cv2.INTER_AREA)
            pout = PRODUCT_DIR / f"{product_id}.jpg"
            cv2.imwrite(str(pout), crop, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
            print(f"  product -> {pout.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
