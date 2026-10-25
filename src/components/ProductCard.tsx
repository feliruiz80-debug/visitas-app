import type { Product } from "../data/types";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const initial = product.name.trim().charAt(0).toUpperCase();

  return (
    <article className="product-card">
      <div className="product-card__media" aria-hidden="true">
        {product.image ? (
          <img src={product.image} alt="" loading="lazy" />
        ) : (
          <div className="product-card__placeholder">
            <span>{initial}</span>
          </div>
        )}
      </div>

      <div className="product-card__copy">
        {product.brand ? <p className="product-card__brand">{product.brand}</p> : null}
        <h3>{product.name}</h3>
        <p className="product-card__desc">{product.description}</p>
        {product.tags.length > 0 ? (
          <ul className="product-card__tags">
            {product.tags.slice(0, 5).map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
