export const CATEGORIES = [
  { id: "escritura", label: "Escritura" },
  { id: "lapices", label: "Lápices" },
  { id: "marcadores", label: "Marcadores" },
  { id: "cuadernos", label: "Cuadernos" },
  { id: "carpetas", label: "Carpetas" },
  { id: "papel", label: "Papel y sobres" },
  { id: "mochilas", label: "Mochilas" },
  { id: "cartucheras", label: "Cartucheras" },
  { id: "agendas", label: "Agendas" },
  { id: "pintura", label: "Pintura y arte" },
  { id: "manualidades", label: "Manualidades" },
  { id: "adhesivos", label: "Adhesivos" },
  { id: "gomas", label: "Gomas" },
  { id: "geometria", label: "Corte y geometría" },
  { id: "oficina", label: "Oficina" },
  { id: "bolsas", label: "Bolsas" },
  { id: "libros", label: "Libros" },
  { id: "pizarras", label: "Pizarras" },
  { id: "impresion", label: "Impresión" },
  { id: "tecnologia", label: "Tecnología" },
  { id: "juegos", label: "Juegos" },
  { id: "fiesta", label: "Fiesta" },
  { id: "otros", label: "Otros" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export type Product = {
  id: number;
  code: string;
  name: string;
  /** Precio con impuestos, en centavos. 0 = sin precio en la lista. */
  price: number;
  category: CategoryId;
  norm: string;
  codeNorm: string;
};

export type Catalog = {
  fecha: string;
  lista: string;
  origen: string;
  products: Product[];
  counts: Record<string, number>;
};

type RawFile = {
  fecha: string;
  lista: string;
  origen: string;
  items: [string, string, number, string][];
};

const CATEGORY_IDS = new Set<string>(CATEGORIES.map((category) => category.id));

const SMALL_WORDS = new Set([
  "de",
  "del",
  "la",
  "las",
  "el",
  "los",
  "y",
  "e",
  "o",
  "u",
  "para",
  "por",
  "con",
  "en",
  "a",
  "al",
  "x",
  "un",
  "una",
]);

export function fold(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function searchText(value: string): string {
  return fold(value)
    .replace(/[º°]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function displayName(name: string): string {
  let seenWord = false;
  return name.toLowerCase().replace(/[^\s]+/g, (word) => {
    const isFirst = !seenWord;
    seenWord = true;
    if (!isFirst && SMALL_WORDS.has(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
}

export function formatMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const whole = Math.floor(abs / 100).toLocaleString("es-AR");
  const frac = String(abs % 100).padStart(2, "0");
  return `${sign}$ ${whole},${frac}`;
}

export function formatPrice(cents: number): string {
  return cents === 0 ? "Sin precio" : formatMoney(cents);
}

export function formatFecha(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Buenos_Aires",
  }).format(new Date(Date.UTC(year, month - 1, day, 15)));
}

export function categoryLabel(id: string): string {
  return CATEGORIES.find((category) => category.id === id)?.label ?? "Otros";
}

export type SortKey = "nombre" | "precio-asc" | "precio-desc";

export type SearchResult = {
  items: Product[];
  counts: Record<string, number>;
  total: number;
};

function tokensOf(query: string): string[] {
  const tokens = searchText(query).split(" ").filter(Boolean);
  if (tokens.length <= 1) return tokens;
  return tokens.filter((token) => token.length > 1 || /\d/.test(token));
}

export function runSearch(
  products: Product[],
  query: string,
  category: string,
  sort: SortKey,
): SearchResult {
  const tokens = tokensOf(query);
  const compact = searchText(query).replace(/ /g, "");
  const counts: Record<string, number> = {};
  const matched: Product[] = [];

  for (const product of products) {
    if (tokens.length > 0) {
      const hit = tokens.every(
        (token) => product.norm.includes(token) || product.codeNorm.includes(token),
      );
      if (!hit) continue;
    }
    counts[product.category] = (counts[product.category] ?? 0) + 1;
    if (category !== "todas" && product.category !== category) continue;
    matched.push(product);
  }

  let items = matched;
  if (sort === "precio-asc" || sort === "precio-desc") {
    const direction = sort === "precio-asc" ? 1 : -1;
    items = matched.slice().sort((a, b) => {
      if (a.price === 0 && b.price === 0) return a.name.localeCompare(b.name, "es");
      if (a.price === 0) return 1;
      if (b.price === 0) return -1;
      return (a.price - b.price) * direction || a.name.localeCompare(b.name, "es");
    });
  } else if (compact.length >= 2) {
    const exact: Product[] = [];
    const prefix: Product[] = [];
    const rest: Product[] = [];
    for (const product of matched) {
      if (product.codeNorm === compact) exact.push(product);
      else if (product.codeNorm.startsWith(compact)) prefix.push(product);
      else rest.push(product);
    }
    items = [...exact, ...prefix, ...rest];
  }

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return { items, counts, total };
}

export async function loadCatalog(): Promise<Catalog> {
  const response = await fetch("/lista.json");
  if (!response.ok) throw new Error("No se pudo leer la lista.");
  const raw = (await response.json()) as RawFile;
  const counts: Record<string, number> = {};
  const products: Product[] = raw.items.map(([code, name, price, category], index) => {
    const cat = (CATEGORY_IDS.has(category) ? category : "otros") as CategoryId;
    counts[cat] = (counts[cat] ?? 0) + 1;
    return {
      id: index,
      code,
      name,
      price,
      category: cat,
      norm: searchText(`${name} ${code}`),
      codeNorm: searchText(code).replace(/ /g, ""),
    };
  });
  products.sort((a, b) => a.name.localeCompare(b.name, "es") || a.code.localeCompare(b.code, "es"));
  return {
    fecha: raw.fecha,
    lista: raw.lista,
    origen: raw.origen,
    products,
    counts,
  };
}
