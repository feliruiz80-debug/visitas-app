export type Product = {
  id: string;
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
};

export type CatalogSource = "sheet" | "seed";
