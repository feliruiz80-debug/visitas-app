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
  const style = {
    ["--i" as string]: index,
    ["--d" as string]: `${Math.min(index, 8) * 45}ms`,
  } as CSSProperties;

  return (
    <article className="product-card reveal-card" style={style}>
      <div className="product-card__media" aria-hidden="true">
        {showImage ? (
          <img src={product.image} alt="" loading="lazy" onError={() => setBroken(true)} />
        ) : (
          <div className="product-card__placeholder">
            <span className="product-card__placeholder-letter">{initial}</span>
          </div>
        )}
      </div>

      <div className="product-card__copy">
        <h3>{product.name}</h3>
        {product.description ? <p className="product-card__desc">{product.description}</p> : null}
      </div>
    </article>
  );
}
