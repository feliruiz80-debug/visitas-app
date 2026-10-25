import { useState } from "react";
import type { DigitalProduct } from "../data/digitalCatalog";

type DigitalProductCardProps = {
  product: DigitalProduct;
  featured?: boolean;
};

export function DigitalProductCard({ product, featured = false }: DigitalProductCardProps) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(product.image) && !broken;

  return (
    <article className={`d-card ${featured ? "d-card--featured" : ""} ${product.wide ? "d-card--wide" : ""}`}>
      <div className="d-card__media" aria-hidden="true">
        {showImage ? (
          <img src={product.image} alt="" loading="lazy" onError={() => setBroken(true)} />
        ) : (
          <div className="d-card__fallback">{product.name.charAt(0)}</div>
        )}
      </div>
      <div className="d-card__copy">
        {product.brand ? <p className="d-card__brand">{product.brand}</p> : null}
        <h3>{product.name}</h3>
        <p className="d-card__desc">{product.description}</p>
        {product.tags.length > 0 ? (
          <ul className="d-card__tags">
            {product.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
