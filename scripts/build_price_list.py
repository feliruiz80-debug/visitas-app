#!/usr/bin/env python3
"""Arma public/lista.json a partir del PDF de Lista de Precios (Crystal Reports).

Uso:
  python3 scripts/build_price_list.py lista.pdf
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "lista.json"

# Primera coincidencia gana. Cada clave es una palabra (o frase) y acepta
# plural o género: PINCEL → PINCELES, ADHESIV → ADHESIVA.
RULES: list[tuple[str, list[str]]] = [
    ("tecnologia", ["MOUSE", "TECLADO", "AURICULAR", "WEBCAM", "PARLANTE", "PENDRIVE", "PEN DRIVE", "MEMORIA USB"]),
    ("impresion", ["TONER", "CARTUCHO"]),
    ("mochilas", ["MOCHILA", "LUNCHERA", "MALETIN", "VALIJA"]),
    ("cartucheras", ["CANOPLA", "CARTUCHERA"]),
    ("libros", ["LIBRO", "DICCIONARIO", "ENCICLOPEDIA"]),
    ("agendas", ["AGENDA", "CALENDARIO"]),
    ("cuadernos", ["CUADERNO", "LIBRETA", "ANOTADOR", "PLANNER"]),
    (
        "carpetas",
        ["CARPETA", "ARCHIVADOR", "REGISTRADOR", "CLASIFICADOR", "FOLIO", "SEPARADOR", "BIBLIORATO", "BIBLIO", "PORTAFOLIO", "INDICE", "ARO", "CAJA ARCHIVO"],
    ),
    (
        "pintura",
        [
            "TEMPERA",
            "ACUAREL",
            "ACRILIC",
            "ACRYLIC",
            "OLEO",
            "PINCEL",
            "PINCELETA",
            "BASTIDOR",
            "LIENZO",
            "PINTURA",
            "CARBONILLA",
            "BARNIZ",
            "ACRILEX",
            "SET DE ARTE",
            "ART SET",
            "MAQUILLAJE",
            "TIZA",
            "AGUARRAS",
            "TREMENTINA",
            "PALETA",
            "ACEITE",
            "DILUYENTE",
            "BETUN",
            "CRAQUELADOR",
            "DECORALBA",
            "DIMENSIONADOR",
        ],
    ),
    ("marcadores", ["MARCADOR", "RESALTADOR", "FIBRON", "LETROGRAFO", "SENALADOR", "ROTULADOR"]),
    ("escritura", ["BOLIGRAFO", "BOLIG", "MICROFIBRA", "LAPICERA", "ROLLER", "PLUMA", "BIROME"]),
    ("lapices", ["LAPICES", "LAPIZ", "LAPICERO", "LANZAMINA", "PORTAMINAS", "MINAS", "MINA", "PINTURITA", "CRAYON", "CERA"]),
    (
        "manualidades",
        [
            "GOMA EVA",
            "PLASTILINA",
            "MASILINA",
            "MASA",
            "BRILLANTINA",
            "GLITTER",
            "LENTEJUELA",
            "SLIME",
            "TELGOPOR",
            "PORCELANA",
            "ARCILLA",
            "SUPERMOLDE",
            "MANUALIDAD",
            "ESTECA",
            "HILO",
            "STENCIL",
            "PLANTILLA",
        ],
    ),
    ("adhesivos", ["ADHESIV", "PEGAMENT", "PLASTICOLA", "VOLIG", "SILICONA", "CINTA", "STICKER", "CALCOMANIA"]),
    ("gomas", ["GOMA", "SACAPUNTA", "BORRADOR", "CORRECTOR"]),
    (
        "geometria",
        ["TIJERA", "TRINCHETA", "CUTTER", "REGLA", "ESCUADRA", "COMPAS", "TRANSPORTADOR", "ESCALIMETRO", "CINTA METRICA", "CIZALLA", "GUILLOTINA"],
    ),
    (
        "oficina",
        [
            "ABROCHADORA",
            "PERFORADORA",
            "PERFORADOR",
            "BROCHE",
            "GRAPA",
            "CLIP",
            "CALCULADORA",
            "ETIQUETA",
            "ROTULO",
            "ORGANIZADOR",
            "BANDEJA",
            "PAPELERA",
            "PAPELERO",
            "FICHERO",
            "FICHA",
            "SACABOCADO",
            "SACABROCHE",
            "CHINCHE",
            "ALFILER",
            "SELLO",
            "ALMOHADILLA",
            "BANDERITA",
            "BANDERA",
            "TINTA",
            "EXPOSITOR",
            "PORTA REVISTA",
            "BANDA ELASTICA",
            "PLASTIFIC",
        ],
    ),
    (
        "papel",
        ["RESMA", "BLOCK", "SOBRE", "PAPEL", "CARTULINA", "CARTON", "MICROCORRUGADO", "CARBONICO", "TALONARIO", "TALON", "MEMO", "MAPA"],
    ),
    ("pizarras", ["PIZARRA", "PIZARRON", "ROTAFOLIO"]),
    ("juegos", ["JUEGO", "PUZZLE", "ROMPECABEZA", "DIDACTICO"]),
    ("fiesta", ["GLOBO", "VELA", "COTILLON", "ESCARAPELA", "GUIRNALDA", "CONFETI", "SOUVENIR", "LLAVERO"]),
]

_ACCENTS = str.maketrans("ÁÉÍÓÚÜÑ", "AEIOUUN")
_ENDINGS = ("ES", "AS", "OS", "S", "A", "O")


def fold(text: str) -> str:
    return text.upper().translate(_ACCENTS)


def tokens_of(text: str) -> list[str]:
    return re.findall(r"[A-Z0-9]+", fold(text))


def word_hit(token: str, stem: str) -> bool:
    if token == stem:
        return True
    if not token.startswith(stem):
        return False
    return token[len(stem) :] in _ENDINGS


def phrase_hit(tokens: list[str], phrase: str) -> bool:
    parts = phrase.split()
    width = len(parts)
    if width == 0 or len(tokens) < width:
        return False
    for index in range(len(tokens) - width + 1):
        if all(word_hit(tokens[index + offset], parts[offset]) for offset in range(width)):
            return True
    return False


def classify(name: str) -> str:
    tokens = tokens_of(name)
    folded = " ".join(tokens)
    if phrase_hit(tokens, "CINTA METRICA"):
        return "geometria"
    if "REPUESTO" in tokens and any(word in folded for word in ("HOJA", "CUADERNO", "RAYAD", "CUADRICUL", "REFILL")):
        return "cuadernos"
    # "x 25u BOLSA" es el empaque, no el artículo.
    if tokens and tokens[0] in ("BOLSA", "BOLSAS"):
        return "bolsas"
    for cat, keys in RULES:
        if any(phrase_hit(tokens, fold(key)) for key in keys):
            if cat == "oficina" and "TINTA" in tokens and any(
                word in folded for word in ("ACRIL", "OLEO", "CHINA", "TELA", "DIBUJO", "ARTIST", "ALBA", "ACUAREL")
            ):
                return "pintura"
            return cat
    return "otros"


def money_to_cents(raw: str) -> int:
    whole, frac = raw.split(",")
    return int(whole.replace(".", "")) * 100 + int(frac)


def parse_row(words: list[tuple]) -> tuple[str, str, str] | None:
    price_words = sorted(
        [w for w in words if w[0] >= 490 and w[4] != "$"],
        key=lambda w: w[0],
    )
    body = [w for w in words if w[0] < 490 and w[4] != "$"]
    anchors = [w for w in body if abs(w[0] - 106.3) < 0.25]
    codes0 = [w for w in body if abs(w[0] - 52.35) < 0.45]
    if len(anchors) != 1 or len(codes0) != 1 or len(price_words) != 1:
        return None
    art0 = anchors[0]
    code0 = codes0[0]
    rest = [w for w in body if w is not art0 and w is not code0]
    code = [code0]
    art = [art0]
    code_end = code0[2]
    art_end = art0[2]
    for w in sorted(rest, key=lambda item: (item[0], item[2])):
        gap_c = w[0] - code_end
        gap_a = w[0] - art_end

        def ok(gap: float) -> bool:
            return -0.8 <= gap <= 6

        if ok(gap_c) and (not ok(gap_a) or gap_c <= gap_a):
            code.append(w)
            code_end = w[2]
        elif ok(gap_a):
            art.append(w)
            art_end = w[2]
        elif w[0] < 106.3:
            code.append(w)
            code_end = max(code_end, w[2])
        else:
            art.append(w)
            art_end = max(art_end, w[2])
    return (
        " ".join(w[4] for w in code),
        " ".join(w[4] for w in art),
        price_words[0][4],
    )


def extract(pdf_path: Path) -> list[tuple[str, str, str]]:
    doc = pymupdf.open(pdf_path)
    rows: list[tuple[str, str, str]] = []
    for page in doc:
        words = page.get_text("words", flags=0)
        grouped: dict[int, list] = defaultdict(list)
        for w in words:
            if 120 <= w[1] <= 770:
                grouped[round(w[1])].append(w)
        for ws in grouped.values():
            parsed = parse_row(ws)
            if parsed is None:
                raise SystemExit(f"No pude leer una fila en la página {page.number + 1}")
            rows.append(parsed)
    return rows


def main() -> None:
    pdf = Path(sys.argv[1] if len(sys.argv) > 1 else "")
    if not pdf.is_file():
        raise SystemExit("Pasá la ruta del PDF de la lista de precios.")
    rows = extract(pdf)
    items = []
    counts: Counter[str] = Counter()
    for code, name, price in rows:
        cat = classify(name)
        counts[cat] += 1
        items.append([code, name, money_to_cents(price), cat])

    # Controles de las filas donde el código se mete en la columna del artículo.
    by_code = {(code, name): price for code, name, price, _cat in items}
    expected = {
        ("SKREBBA ABR 12/24", "ABROCHADORA SKREBBA SKRE-BLOCK 12/24 BRAZO LARGO"): 11343750,
        ("SKREBBA ABRO 24/6", "ABROCHADORA SKREBBA SKRE-WAL 24/6 + 24/8 + 26/6 + 26/8"): 3970312,
        ("MH-2330 - 2320 - 2310", "MOCHILA UTIL UNO POLIESTER MH-2330 - 2320 - 2310"): None,
    }
    for key, cents in expected.items():
        if key not in by_code:
            raise SystemExit(f"Falta la fila de control {key}")
        if cents is not None and by_code[key] != cents:
            raise SystemExit(f"Precio inesperado en {key}: {by_code[key]}")

    payload = {
        "fecha": "2026-10-06",
        "lista": "Lista 1 Mayorista (Vigentes)",
        "moneda": "ARS",
        "impuestos": True,
        "origen": "Librería Mayorista Sofía",
        "items": items,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(items)} artículos → {OUT} ({OUT.stat().st_size / 1024:.0f} KB)")
    for cat, n in counts.most_common():
        print(f"{n:5} {cat}")
    print("--- otros (muestra) ---")
    shown = 0
    for code, name, _price, cat in items:
        if cat != "otros":
            continue
        print(f"{code} | {name[:110]}")
        shown += 1
        if shown >= 40:
            break


if __name__ == "__main__":
    main()
