import type { DigitalPage } from "../data/digitalCatalog";
import { DigitalProductCard } from "./DigitalProductCard";
import { PageChrome } from "./PageChrome";

type DigitalCatalogPageProps = {
  page: DigitalPage;
};

export function DigitalCatalogPage({ page }: DigitalCatalogPageProps) {
  const cols = page.columns ?? 3;

  return (
    <PageChrome pageNumber={Number(page.pageNumber)} className="digital-page">
      <header className="category-head">
        <p className="category-head__eyebrow">{page.eyebrow ?? "ESCOLAR"}</p>
        <h2>{page.title}</h2>
        <div className="category-head__rule" />
      </header>

      {page.hero ? (
        <section className="d-hero">
          <div className="d-hero__visual" aria-hidden="true">
            <img src={page.hero.image} alt="" />
          </div>
          <div className="d-hero__copy">
            {page.hero.brand ? <p className="d-hero__brand">{page.hero.brand}</p> : null}
            <h3>{page.hero.name}</h3>
            <p>{page.hero.description}</p>
            {page.swatches && page.swatches.length > 0 ? (
              <div className="d-swatches" aria-hidden="true">
                {page.swatches.map((color) => (
                  <span key={color} style={{ background: color }} />
                ))}
              </div>
            ) : null}
            {page.hero.tags.length > 0 ? (
              <ul className="d-card__tags">
                {page.hero.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      {page.sectionTitle ? (
        <div className="d-section">
          <h3>{page.sectionTitle}</h3>
          {page.sectionNote ? <p>{page.sectionNote}</p> : null}
        </div>
      ) : null}

      <div className={`d-grid d-grid--${cols}`}>
        {page.products.map((product) => (
          <DigitalProductCard key={product.id} product={product} />
        ))}
      </div>
    </PageChrome>
  );
}
