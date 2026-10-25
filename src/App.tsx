import { useEffect, useMemo, useState } from "react";
import { CategoryPage } from "./components/CategoryPage";
import { ContactPage } from "./components/ContactPage";
import { CoverPage } from "./components/CoverPage";
import { FlipBook } from "./components/FlipBook";
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

  function jumpToCategory(categoryKey: string) {
    const index = pages.findIndex((item) => item.kind === "category" && item.group.key === categoryKey);
    if (index >= 0) setPageIndex(index);
  }

  const sheetNodes = pages.map((item) => {
    if (item.kind === "cover") {
      return <CoverPage key="cover" productCount={products.length} onOpen={() => setPageIndex(1)} />;
    }
    if (item.kind === "contact") {
      return <ContactPage key="contact" pageNumber={item.pageNumber} />;
    }
    if (item.kind === "index") {
      return <IndexPage key="index" groups={groups} pageNumber={item.pageNumber} onJump={jumpToCategory} />;
    }
    return <CategoryPage key={item.group.key} group={item.group} pageNumber={item.pageNumber} />;
  });

  return (
    <div className={`app ${isCover ? "app--cover" : ""}`}>
      {!isCover ? (
        <header className="topbar">
          <button type="button" className="topbar__brand" onClick={() => setPageIndex(0)}>
            <span className="topbar__mark">S</span>
            <span>
              <strong>Mayorista Sofia</strong>
              <small>Revista digital</small>
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
        ) : pages.length === 0 ? (
          <div className="loading">No hay productos para mostrar.</div>
        ) : (
          <FlipBook pageIndex={pageIndex} pageCount={pages.length} onChange={setPageIndex}>
            {sheetNodes}
          </FlipBook>
        )}
      </main>

      {!isCover && !loading ? (
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
