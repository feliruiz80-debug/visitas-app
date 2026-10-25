import { useEffect, useMemo, useState } from "react";
import { CategoryPage } from "./components/CategoryPage";
import { ContactPage } from "./components/ContactPage";
import { CoverPage } from "./components/CoverPage";
import { IndexPage } from "./components/IndexPage";
import { groupByCategory, loadCatalog } from "./data/sheet";
import type { CatalogSource, CategoryGroup, Product } from "./data/types";

type MagPage =
  | { kind: "cover" }
  | { kind: "contact"; pageNumber: number }
  | { kind: "index"; pageNumber: number }
  | { kind: "category"; pageNumber: number; group: CategoryGroup };

export function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [source, setSource] = useState<CatalogSource>("seed");
  const [notice, setNotice] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    loadCatalog().then((result) => {
      if (!alive) return;
      setProducts(result.products);
      setSource(result.source);
      setNotice(result.notice);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => {
      const hay = [product.name, product.category, product.subcategory, product.description, product.brand, ...product.tags]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [products, query]);

  const groups = useMemo(() => groupByCategory(filtered), [filtered]);

  const pages = useMemo<MagPage[]>(() => {
    const list: MagPage[] = [{ kind: "cover" }, { kind: "contact", pageNumber: 2 }];
    if (groups.length > 0) {
      list.push({ kind: "index", pageNumber: 3 });
      groups.forEach((group, index) => {
        list.push({ kind: "category", pageNumber: 4 + index, group });
      });
    }
    return list;
  }, [groups]);

  useEffect(() => {
    setPageIndex((current) => Math.min(current, Math.max(0, pages.length - 1)));
  }, [pages.length]);

  const page = pages[pageIndex] ?? pages[0];
  const isCover = page?.kind === "cover";

  function go(delta: number) {
    setPageIndex((current) => Math.min(pages.length - 1, Math.max(0, current + delta)));
  }

  function jumpToCategory(categoryKey: string) {
    const index = pages.findIndex((item) => item.kind === "category" && item.group.key === categoryKey);
    if (index >= 0) setPageIndex(index);
  }

  return (
    <div className={`app ${isCover ? "app--cover" : ""}`}>
      {!isCover ? (
        <header className="topbar">
          <button type="button" className="topbar__brand" onClick={() => setPageIndex(0)}>
            <span className="topbar__mark">S</span>
            <span>
              <strong>Mayorista Sofia</strong>
              <small>Catálogo escolar</small>
            </span>
          </button>

          <label className="topbar__search">
            <span className="sr-only">Buscar producto</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar producto…"
            />
          </label>

          <div className="topbar__meta">
            <span className={`pill ${source === "sheet" ? "pill--ok" : "pill--warn"}`}>
              {loading ? "Cargando…" : source === "sheet" ? "Planilla en vivo" : "Catálogo local"}
            </span>
          </div>
        </header>
      ) : null}

      {notice && !isCover ? (
        <div className="banner" role="status">
          <p>{notice}</p>
          <a
            href={`https://docs.google.com/spreadsheets/d/177FpyOQyCiRpEtUrTJfFzhsajNO-Tiza3ZRSD60KELw/edit`}
            target="_blank"
            rel="noreferrer"
          >
            Abrir Excel
          </a>
        </div>
      ) : null}

      <main className="stage">
        {loading ? (
          <div className="loading">Armando la revista…</div>
        ) : page?.kind === "cover" ? (
          <CoverPage productCount={products.length} onOpen={() => setPageIndex(1)} />
        ) : page?.kind === "contact" ? (
          <ContactPage pageNumber={page.pageNumber} />
        ) : page?.kind === "index" ? (
          <IndexPage groups={groups} pageNumber={page.pageNumber} onJump={jumpToCategory} />
        ) : page?.kind === "category" ? (
          <CategoryPage group={page.group} pageNumber={page.pageNumber} />
        ) : (
          <div className="loading">No hay productos para mostrar.</div>
        )}
      </main>

      {!isCover && !loading ? (
        <nav className="pager" aria-label="Navegación de la revista">
          <button type="button" onClick={() => go(-1)} disabled={pageIndex <= 0}>
            Anterior
          </button>
          <div className="pager__dots" aria-hidden="true">
            {pages.map((item, index) => (
              <button
                key={`${item.kind}-${index}`}
                type="button"
                className={index === pageIndex ? "is-active" : ""}
                onClick={() => setPageIndex(index)}
                aria-label={`Ir a página ${index + 1}`}
              />
            ))}
          </div>
          <p className="pager__label">
            {pageIndex + 1} / {pages.length}
          </p>
          <button type="button" onClick={() => go(1)} disabled={pageIndex >= pages.length - 1}>
            Siguiente
          </button>
        </nav>
      ) : null}

      {!isCover ? (
        <div className="cats-rail" aria-label="Categorías">
          <button type="button" className={page?.kind === "contact" ? "is-active" : ""} onClick={() => setPageIndex(1)}>
            Pedido
          </button>
          <button type="button" className={page?.kind === "index" ? "is-active" : ""} onClick={() => setPageIndex(2)}>
            Índice
          </button>
          {groups.map((group) => (
            <button
              key={group.key}
              type="button"
              className={page?.kind === "category" && page.group.key === group.key ? "is-active" : ""}
              onClick={() => jumpToCategory(group.key)}
            >
              {group.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
