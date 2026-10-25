import { useState } from "react";
import type { Product } from "../data/types";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const initial = product.name.trim().charAt(0).toUpperCase();
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(product.image) && !broken;
  const fileName = (product.image?.split("/").pop() || `${product.id}.jpg`).split("?")[0];

  return (
    <article className="product-card">
      <div className="product-card__media" aria-hidden="true">
        {showImage ? (
          <img src={product.image} alt="" loading="lazy" onError={() => setBroken(true)} />
        ) : (
          <div className="product-card__placeholder">
            <span className="product-card__placeholder-letter">{initial}</span>
            <span className="product-card__placeholder-hint">
              Subí la foto como
              <code>{fileName}</code>
              en <code>public/catalog/</code>
            </span>
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
