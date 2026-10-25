import type { CategoryGroup } from "../data/types";
import { PageChrome } from "./PageChrome";
import { ProductCard } from "./ProductCard";

type CategoryPageProps = {
  group: CategoryGroup;
  pageNumber: number;
};

export function CategoryPage({ group, pageNumber }: CategoryPageProps) {
  const continued = (group.part ?? 1) > 1;
  const multi = (group.parts ?? 1) > 1;

  return (
    <PageChrome pageNumber={pageNumber} className="category-page">
      <header className="category-head">
        <p className="category-head__eyebrow">ESCOLAR</p>
        <div className="category-head__row">
          <h2>{group.label.toUpperCase()}</h2>
          {multi ? (
            <span className="category-head__part">
              {group.part}/{group.parts}
            </span>
          ) : null}
        </div>
        {continued ? <p className="category-head__cont">continuación</p> : null}
        <div className="category-head__rule" />
      </header>

      <div className="product-grid">
        {group.products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </PageChrome>
  );
}
