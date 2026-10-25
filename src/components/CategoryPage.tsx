import type { CategoryGroup } from "../data/types";
import { PageChrome } from "./PageChrome";
import { ProductCard } from "./ProductCard";

type CategoryPageProps = {
  group: CategoryGroup;
  pageNumber: number;
};

export function CategoryPage({ group, pageNumber }: CategoryPageProps) {
  const bySub = new Map<string, typeof group.products>();
  for (const product of group.products) {
    const key = product.subcategory?.trim() || "__all__";
    if (!bySub.has(key)) bySub.set(key, []);
    bySub.get(key)!.push(product);
  }

  const sections = [...bySub.entries()];
  const hasNamedSubs = sections.some(([key]) => key !== "__all__");

  return (
    <PageChrome pageNumber={pageNumber} className="category-page">
      <header className="category-head">
        <p className="category-head__eyebrow">{group.section}</p>
        <h2>{group.label.toUpperCase()}</h2>
        <div className="category-head__rule" />
      </header>

      {hasNamedSubs ? (
        sections.map(([sub, products]) => (
          <section key={sub} className="category-block">
            {sub !== "__all__" ? (
              <div className="category-block__head">
                <h3>{sub}</h3>
              </div>
            ) : null}
            <div className={`product-grid ${products.length <= 2 ? "product-grid--wide" : ""}`}>
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className={`product-grid ${group.products.length <= 2 ? "product-grid--wide" : ""}`}>
          {group.products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </PageChrome>
  );
}
