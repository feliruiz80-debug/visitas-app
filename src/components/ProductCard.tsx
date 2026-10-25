import { useState, type CSSProperties } from "react";
import type { Product } from "../data/types";

type ProductCardProps = {
  product: Product;
  index?: number;
};

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const initial = product.name.trim().charAt(0).toUpperCase();
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(product.image) && !broken;
  const fileName = (product.image?.split("/").pop() || `${product.id}.jpg`).split("?")[0];
  const style = {
    ["--i" as string]: index,
    ["--d" as string]: `${Math.min(index, 8) * 55}ms`,
  } as CSSProperties;

  return (
    <article className="product-card reveal-card" style={style}>
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
