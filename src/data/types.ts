export type Product = {
  id: string;
  code?: string;
  name: string;
  category: string;
  subcategory?: string;
  quantities: string;
  description: string;
  brand?: string;
  tags: string[];
  image?: string;
};

export type CategoryGroup = {
  key: string;
  label: string;
  section: string;
  products: Product[];
  /** Parte de una categoría partida en varias páginas (1-based). */
  part?: number;
  parts?: number;
};

export type CatalogSource = "sheet" | "seed" | "local";
