import { useEffect, useMemo, useState } from "react";
import { CategoryPage } from "./components/CategoryPage";
import { ContactPage } from "./components/ContactPage";
import { CoverPage } from "./components/CoverPage";
import { FlipBook } from "./components/FlipBook";
import { IndexPage } from "./components/IndexPage";
import { Logo } from "./components/Logo";
import { groupByCategory, loadCatalog, paginateCategories } from "./data/sheet";
import type { CatalogSource, CategoryGroup, Product } from "./data/types";

type MagPage =
  | { kind: "cover" }
  | { kind: "contact"; pageNumber: number }
  | { kind: "index"; pageNumber: number }
  | { kind: "category"; pageNumber: number; group: CategoryGroup };

export function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [source, setSource] = useState<CatalogSource>("seed");
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    loadCatalog().then((result) => {
      if (!alive) return;
      setProducts(result.products);
      setSource(result.source);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const groups = useMemo(() => groupByCategory(products), [products]);
  const categoryPages = useMemo(() => paginateCategories(groups), [groups]);

  const pages = useMemo<MagPage[]>(() => {
    const list: MagPage[] = [{ kind: "cover" }, { kind: "contact", pageNumber: 2 }];
    if (groups.length > 0) {
      list.push({ kind: "index", pageNumber: 3 });
      categoryPages.forEach((group, index) => {
        list.push({ kind: "category", pageNumber: 4 + index, group });
      });
    }
    return list;
  }, [groups, categoryPages]);

  useEffect(() => {
    setPageIndex((current) => Math.min(current, Math.max(0, pages.length - 1)));
  }, [pages.length]);

  const page = pages[pageIndex] ?? pages[0];
  const isCover = page?.kind === "cover";

  function jumpToCategory(categoryKey: string) {
    const base = categoryKey.split("--p")[0];
    const index = pages.findIndex(
      (item) => item.kind === "category" && item.group.key.startsWith(base) && (item.group.part ?? 1) === 1,
    );
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
        <header className="logo-bar">
          <button type="button" className="logo-bar__btn" onClick={() => setPageIndex(0)} aria-label="Ir a la portada">
            <Logo size={48} />
          </button>
          <span className="logo-bar__live" title={source === "sheet" ? "Planilla en vivo" : source === "local" ? "Copia local" : "Respaldo"}>
            {loading ? "…" : source === "sheet" ? "●" : "○"}
          </span>
        </header>
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
        <nav className="cats-rail" aria-label="Categorías">
          <button type="button" className={page?.kind === "contact" ? "is-active" : ""} onClick={() => setPageIndex(1)}>
            Pedido
          </button>
          <button type="button" className={page?.kind === "index" ? "is-active" : ""} onClick={() => setPageIndex(2)}>
            Índice
          </button>
          {groups.map((group) => {
            const active =
              page?.kind === "category" && page.group.key.split("--p")[0] === group.key;
            return (
              <button key={group.key} type="button" className={active ? "is-active" : ""} onClick={() => jumpToCategory(group.key)}>
                {group.label}
              </button>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
