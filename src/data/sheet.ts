import { SEED_PRODUCTS } from "./seed";
import type { CatalogSource, CategoryGroup, Product } from "./types";

export const SHEET_ID = "177FpyOQyCiRpEtUrTJfFzhsajNO-Tiza3ZRSD60KELw";

const CSV_URLS = [
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`,
];

const NAME_KEYS = ["producto", "product", "nombre", "articulo", "artículo", "item", "name"];
const CATEGORY_KEYS = ["categoria", "categoría", "category", "rubro", "seccion", "sección", "linea", "línea"];
const SUB_KEYS = ["subcategoria", "subcategoría", "subcategory", "tipo", "grupo", "familia"];
const QTY_KEYS = [
  "cantidades",
  "cantidad",
  "presentacion",
  "presentación",
  "pack",
  "unidad",
  "unidades",
  "qty",
  "quantity",
];
const DESC_KEYS = ["descripcion", "descripción", "description", "detalle", "obs", "observaciones"];
const BRAND_KEYS = ["marca", "brand", "marcas"];
const TAG_KEYS = ["tags", "tag", "variantes", "variante", "colores", "color", "etiquetas"];
const IMAGE_KEYS = ["imagen", "image", "foto", "url", "foto_url", "image_url"];

function norm(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function pick(row: Record<string, string>, keys: string[]) {
  const entries = Object.entries(row);
  for (const key of keys) {
    const hit = entries.find(([header]) => norm(header) === key || norm(header).includes(key));
    if (hit?.[1]?.trim()) return hit[1].trim();
  }
  return "";
}

function splitTags(raw: string) {
  if (!raw) return [];
  return raw
    .split(/[,;/|]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.toUpperCase());
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

function rowsToProducts(rows: string[][]): Product[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => header.trim());
  const products: Product[] = [];

  for (let i = 1; i < rows.length; i += 1) {
    const values = rows[i];
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header || `col_${index}`] = (values[index] ?? "").trim();
    });

    const name = pick(record, NAME_KEYS);
    if (!name) continue;

    const quantities = pick(record, QTY_KEYS);
    const descriptionRaw = pick(record, DESC_KEYS);
    const description = buildDescription(descriptionRaw, quantities);

    products.push({
      id: `sheet-${i}-${norm(name).replace(/\s+/g, "-")}`,
      name,
      category: pick(record, CATEGORY_KEYS) || "Escolar",
      subcategory: pick(record, SUB_KEYS) || undefined,
      quantities: quantities || description,
      description,
      brand: pick(record, BRAND_KEYS) || undefined,
      tags: splitTags(pick(record, TAG_KEYS)),
      image: pick(record, IMAGE_KEYS) || undefined,
    });
  }

  return groupByProduct(products);
}

function buildDescription(description: string, quantities: string) {
  if (quantities && description) {
    if (norm(description).includes(norm(quantities))) return description;
    return `${description} · ${quantities}`;
  }
  if (quantities) {
    if (/presentaci/i.test(quantities)) return quantities;
    return `Presentación: ${quantities}`;
  }
  return description || "Consultar presentación";
}

/** Une filas del mismo producto y combina cantidades en la descripción. */
export function groupByProduct(products: Product[]): Product[] {
  const map = new Map<string, Product>();

  for (const product of products) {
    const key = `${norm(product.category)}::${norm(product.name)}::${norm(product.subcategory ?? "")}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...product, tags: [...product.tags] });
      continue;
    }

    const qtyParts = new Set(
      [existing.quantities, product.quantities]
        .flatMap((value) => value.split(/[·|,;/]+/))
        .map((part) => part.replace(/^presentaci[oó]n:?\s*/i, "").trim())
        .filter(Boolean),
    );
    const quantities = [...qtyParts].join(" · ");
    const tags = [...new Set([...existing.tags, ...product.tags])];
    const brands = [...new Set([existing.brand, product.brand].filter(Boolean) as string[])];

    map.set(key, {
      ...existing,
      quantities,
      description: buildDescription(existing.description.replace(/ · .*$/, ""), quantities),
      tags,
      brand: brands.join(" · ") || existing.brand,
      image: existing.image || product.image,
    });
  }

  return [...map.values()];
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

async function fetchCsv(url: string) {
  const response = await fetch(url, { redirect: "follow" });
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
      const products = rowsToProducts(parseCsv(text));
      if (products.length === 0) {
        return {
          products: groupByProduct(SEED_PRODUCTS),
          source: "seed",
          notice: "La planilla respondió vacía. Mostramos el catálogo de respaldo.",
        };
      }
      return { products, source: "sheet" };
    } catch {
      // try next url
    }
  }

  return {
    products: groupByProduct(SEED_PRODUCTS),
    source: "seed",
    notice:
      "No pude leer la planilla (está privada). Compartila como «Cualquier persona con el enlace» → Lector y se actualiza sola. Mientras tanto ves el catálogo de respaldo.",
  };
}
