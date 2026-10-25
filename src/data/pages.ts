export type CatalogSheet = {
  id: string;
  label: string;
  shortLabel: string;
  src?: string;
  kind: "cover" | "contact" | "photo";
  pageNumber?: string;
};

/** Hojas de la revista, en el mismo orden que el catálogo físico. */
export const CATALOG_SHEETS: CatalogSheet[] = [
  {
    id: "portada",
    label: "Portada",
    shortLabel: "Portada",
    kind: "cover",
  },
  {
    id: "pedido",
    label: "Hacé tu pedido",
    shortLabel: "Pedido",
    kind: "contact",
    pageNumber: "02",
  },
  {
    id: "papeleria",
    label: "Papelería",
    shortLabel: "Papelería",
    kind: "photo",
    src: "/catalog/pages/03-papeleria.jpg",
    pageNumber: "03",
  },
  {
    id: "blocks",
    label: "Blocks y Papel Glacé",
    shortLabel: "Blocks",
    kind: "photo",
    src: "/catalog/pages/04-blocks-papel-glace.jpg",
    pageNumber: "04",
  },
  {
    id: "adhesivos",
    label: "Adhesivos",
    shortLabel: "Adhesivos",
    kind: "photo",
    src: "/catalog/pages/05-adhesivos.jpg",
    pageNumber: "05",
  },
  {
    id: "temperas",
    label: "Témperas y Acuarelas",
    shortLabel: "Témperas",
    kind: "photo",
    src: "/catalog/pages/07-temperas-acuarelas.jpg",
    pageNumber: "07",
  },
  {
    id: "pinceles",
    label: "Pinceles",
    shortLabel: "Pinceles",
    kind: "photo",
    src: "/catalog/pages/08-pinceles.jpg",
    pageNumber: "08",
  },
  {
    id: "masas",
    label: "Masas y Plastilinas",
    shortLabel: "Masas",
    kind: "photo",
    src: "/catalog/pages/09-masas-plastilinas.jpg",
    pageNumber: "09",
  },
  {
    id: "marcadores-agua",
    label: "Marcadores al agua",
    shortLabel: "Al agua",
    kind: "photo",
    src: "/catalog/pages/10-marcadores-agua.jpg",
    pageNumber: "10",
  },
  {
    id: "marcadores-permanentes",
    label: "Marcadores permanentes",
    shortLabel: "Permanentes",
    kind: "photo",
    src: "/catalog/pages/11-marcadores-permanentes.jpg",
    pageNumber: "11",
  },
];
