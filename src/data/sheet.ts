import { SEED_PRODUCTS } from "./seed";
import type { CatalogSource, CategoryGroup, Product } from "./types";

export const SHEET_ID = "177FpyOQyCiRpEtUrTJfFzhsajNO-Tiza3ZRSD60KELw";
export const SHEET_GID = "2093740033";

/** Cuántos productos por hoja para que no se corte el contenido. */
export const PRODUCTS_PER_PAGE = 6;

const CSV_URLS = [
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`,
  "/catalog/productos.csv",
];

function norm(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((parts) => parts.some((part) => part.trim()));
}

function titleCaseCategory(label: string) {
  const upper = label.trim().toUpperCase();
  const known: Record<string, string> = {
    PAPELERIA: "Papelería",
    "ADHESIVOS ESCOLARES": "Adhesivos Escolares",
    "TEMPERAS ESCOLARES": "Témperas Escolares",
    "PINCELES ESCOLARES": "Pinceles Escolares",
    "MASAS Y PLASTILINAS": "Masas y Plastilinas",
    MARCADORES: "Marcadores",
  };
  return known[upper] ?? label.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Saca presentaciones tipo "x 24hjs", "x 30grs", "50 x 70cm" del nombre. */
export function extractPresentation(name: string): { title: string; quantities: string } {
  const packs = name.match(/\bx\s*[\d.,]+\s*[a-zA-Záéíóúñ°º.]*\b/gi) ?? [];
  const sizes = name.match(/\b\d+\s*x\s*\d+\s*(?:cm|mts?|m)?\b/gi) ?? [];
  const kilos = name.match(/\bx\s*\d+\s*kilos?\b/gi) ?? [];
  const parts = [...new Set([...packs, ...sizes, ...kilos].map((p) => p.trim()))];

  let title = name.trim();
  for (const part of parts) {
    title = title.replace(part, " ").replace(/\s{2,}/g, " ").trim();
  }
  title = title.replace(/[,\-–—]\s*$/, "").trim() || name.trim();

  const quantities = parts.length ? `Presentación: ${parts.join(" · ")}` : "";

  return { title, quantities };
}

function isHeaderRow(cells: string[]) {
  const joined = cells.map(norm).join("|");
  return joined.includes("codigo") && joined.includes("producto");
}

function isCategoryRow(codigo: string, producto: string, precio: string) {
  return !codigo && Boolean(producto) && !precio;
}

/**
 * Planilla Sofia: filas de categoría (solo nombre en Producto)
 * y filas de ítem (Código, Cantidad, Producto, Precio, Total, Imagen).
 */
export function parseCategorizedSheet(rows: string[][]): Product[] {
  const products: Product[] = [];
  let category = "Escolar";
  let started = false;

  for (let i = 0; i < rows.length; i += 1) {
    const raw = rows[i];
    const cells = [0, 1, 2, 3, 4, 5].map((index) => (raw[index] ?? "").trim());
    const [codigo, , producto, precio, , imagen] = cells;

    if (!producto && !codigo) continue;
    if (isHeaderRow(cells)) {
      started = true;
      continue;
    }

    // Antes del header, ignorar filas vacías de título
    if (!started && !codigo && producto && !precio) {
      // Puede ser categoría antes del header; aceptar igual
    }

    if (isCategoryRow(codigo, producto, precio)) {
      category = titleCaseCategory(producto);
      started = true;
      continue;
    }

    if (!producto) continue;
    // Sin código pero con precio raro: saltar
    if (!codigo && !precio) continue;

    const { title, quantities } = extractPresentation(producto);
    const slug = norm(`${category}-${codigo || i}-${title}`).replace(/[^a-z0-9]+/g, "-");

    products.push({
      id: `sheet-${slug}`,
      code: codigo || undefined,
      name: title,
      category,
      quantities,
      description: quantities,
      tags: [],
      image: imagen || undefined,
    });
  }

  return products;
}

export function groupByCategory(products: Product[]): CategoryGroup[] {
  const order: string[] = [];
  const buckets = new Map<string, Product[]>();

  for (const product of products) {
    const label = product.category.trim() || "Escolar";
    if (!buckets.has(label)) {
      buckets.set(label, []);
      order.push(label);
    }
    buckets.get(label)!.push(product);
  }

  return order.map((label) => ({
    key: norm(label).replace(/\s+/g, "-"),
    label,
    section: "ESCOLAR",
    products: buckets.get(label) ?? [],
  }));
}

/** Parte cada categoría en hojas de N productos. */
export function paginateCategories(
  groups: CategoryGroup[],
  perPage = PRODUCTS_PER_PAGE,
): CategoryGroup[] {
  const pages: CategoryGroup[] = [];

  for (const group of groups) {
    const chunks: Product[][] = [];
    for (let i = 0; i < group.products.length; i += perPage) {
      chunks.push(group.products.slice(i, i + perPage));
    }
    const parts = Math.max(1, chunks.length);
    chunks.forEach((products, index) => {
      pages.push({
        ...group,
        key: `${group.key}--p${index + 1}`,
        products,
        part: index + 1,
        parts,
      });
    });
  }

  return pages;
}

function withLocalImage(product: Product): Product {
  if (product.image) return product;
  const slug = norm(product.name).replace(/[^a-z0-9]+/g, "-");
  return { ...product, image: `/catalog/${slug}.jpg` };
}

async function fetchCsv(url: string) {
  const response = await fetch(url, { redirect: "follow", cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  if (text.includes("<!DOCTYPE html") || text.includes("<html")) {
    throw new Error("La planilla requiere acceso (no pública).");
  }
  return text;
}

export async function loadCatalog(): Promise<{
  products: Product[];
  source: CatalogSource;
  notice?: string;
}> {
  for (const url of CSV_URLS) {
    try {
      const text = await fetchCsv(url);
      const rows = parseCsv(text);
      const products = parseCategorizedSheet(rows).map(withLocalImage);
      if (products.length === 0) continue;
      const source: CatalogSource = url.startsWith("/") ? "local" : "sheet";
      return { products, source };
    } catch {
      // try next
    }
  }

  return {
    products: SEED_PRODUCTS.map(withLocalImage),
    source: "seed",
    notice: "No pude leer la planilla. Mostramos el catálogo de respaldo.",
  };
}
