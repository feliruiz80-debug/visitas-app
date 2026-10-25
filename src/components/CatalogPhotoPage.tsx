type CatalogPhotoPageProps = {
  src: string;
  label: string;
  pageNumber?: string;
};

export function CatalogPhotoPage({ src, label, pageNumber }: CatalogPhotoPageProps) {
  return (
    <article className="photo-page">
      <img src={src} alt={label} decoding="async" />
      <span className="sr-only">
        {label}
        {pageNumber ? `, página ${pageNumber}` : ""}
      </span>
    </article>
  );
}
