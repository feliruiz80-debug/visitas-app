import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  CATEGORIES,
  categoryLabel,
  displayName,
  formatFecha,
  formatMoney,
  formatPrice,
  loadCatalog,
  runSearch,
  searchText,
  type Catalog,
  type CategoryId,
  type Product,
  type SortKey,
} from "./data/catalog";

const STORAGE_KEY = "sofia-lista-pedido-v1";
const FAVORITES_KEY = "sofia-favoritos-v1";
const EXAMPLES = ["témpera alba", "mochila", "abrochadora", "cuaderno", "marcador", "E0260"];
const WHATSAPP = "5493517865153";

type Line = {
  code: string;
  name: string;
  price: number;
  qty: number;
};

type Favorite = {
  code: string;
  name: string;
  price: number;
  category: CategoryId;
};

type Screen = "inicio" | "favoritos";

function lineKey(line: { code: string; name: string }): string {
  return `${line.code}\u0000${line.name}`;
}

function loadFavorites(): Favorite[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const fav = item as Partial<Favorite>;
      if (typeof fav.code !== "string" || typeof fav.name !== "string") return [];
      const price = Number(fav.price);
      if (!Number.isFinite(price) || price < 0) return [];
      const category = CATEGORIES.find((entry) => entry.id === fav.category)?.id ?? "otros";
      return [{ code: fav.code, name: fav.name, price: Math.round(price), category }];
    });
  } catch {
    return [];
  }
}

function loadLines(): Line[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const line = item as Partial<Line>;
      if (typeof line.code !== "string" || typeof line.name !== "string") return [];
      const qty = Number(line.qty);
      const price = Number(line.price);
      if (!Number.isFinite(qty) || qty <= 0) return [];
      if (!Number.isFinite(price) || price < 0) return [];
      return [{ code: line.code, name: line.name, price: Math.round(price), qty: Math.min(9999, Math.round(qty)) }];
    });
  } catch {
    return [];
  }
}

function useRowHeight(): number {
  const [height, setHeight] = useState(96);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 720px)");
    const apply = () => setHeight(query.matches ? 104 : 80);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return height;
}

export function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("todas");
  const [sort, setSort] = useState<SortKey>("nombre");
  const [lines, setLines] = useState<Line[]>(loadLines);
  const [favorites, setFavorites] = useState<Favorite[]>(loadFavorites);
  const [screen, setScreen] = useState<Screen>("inicio");
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(640);
  const rowHeight = useRowHeight();

  useEffect(() => {
    let cancelled = false;
    loadCatalog()
      .then((next) => {
        if (!cancelled) setCatalog(next);
      })
      .catch(() => {
        if (!cancelled) setError("No pude cargar la lista. Reintentá en un momento.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 1600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!confirmClear) return;
    const timer = window.setTimeout(() => setConfirmClear(false), 2500);
    return () => window.clearTimeout(timer);
  }, [confirmClear]);

  const result = useMemo(() => {
    if (!catalog) return null;
    return runSearch(catalog.products, query, category, sort);
  }, [catalog, query, category, sort]);

  const browsing = query.trim().length > 0 || category !== "todas";
  const tooShort = query.trim().length === 1 && category === "todas";
  const items = tooShort ? [] : (result?.items ?? []);

  useEffect(() => {
    setActive(0);
    setScrollTop(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [query, category, sort]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setViewport(element.clientHeight || 640));
    observer.observe(element);
    setViewport(element.clientHeight || 640);
    return () => observer.disconnect();
  }, [browsing, tooShort, catalog]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (event.key === "Escape") {
        if (drawer) setDrawer(false);
        else if (screen === "favoritos") setScreen("inicio");
        else if (query) setQuery("");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer, query, screen]);

  const qtyByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of lines) map.set(lineKey(line), line.qty);
    return map;
  }, [lines]);

  const favoriteKeys = useMemo(() => new Set(favorites.map((item) => lineKey(item))), [favorites]);

  const productByKey = useMemo(() => {
    const map = new Map<string, Product>();
    if (!catalog) return map;
    for (const product of catalog.products) map.set(lineKey(product), product);
    return map;
  }, [catalog]);

  const favoriteProducts = useMemo(
    () =>
      favorites.map(
        (item) =>
          productByKey.get(lineKey(item)) ?? {
            id: 0,
            code: item.code,
            name: item.name,
            price: item.price,
            category: item.category,
            norm: "",
            codeNorm: "",
          },
      ),
    [favorites, productByKey],
  );

  const orderCount = lines.reduce((sum, line) => sum + line.qty, 0);
  const orderTotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const unpriced = lines.filter((line) => line.price === 0).length;

  function notify(message: string) {
    setToast(message);
  }

  function goHome() {
    setScreen("inicio");
    setQuery("");
    setCategory("todas");
    setDrawer(false);
  }

  function toggleFavorite(product: Product) {
    const key = lineKey(product);
    const exists = favoriteKeys.has(key);
    setFavorites((current) =>
      exists
        ? current.filter((item) => lineKey(item) !== key)
        : [...current, { code: product.code, name: product.name, price: product.price, category: product.category }],
    );
    notify(exists ? "Sacado de favoritos" : "Guardado en favoritos");
  }

  function add(product: Product) {
    setLines((current) => {
      const index = current.findIndex((line) => line.code === product.code && line.name === product.name);
      if (index === -1) {
        return [...current, { code: product.code, name: product.name, price: product.price, qty: 1 }];
      }
      const next = current.slice();
      next[index] = {
        ...next[index],
        price: product.price,
        qty: Math.min(9999, next[index].qty + 1),
      };
      return next;
    });
    notify("Sumado al pedido");
  }

  function setQty(product: { code: string; name: string }, qty: number) {
    setLines((current) => {
      if (qty <= 0) {
        return current.filter((line) => !(line.code === product.code && line.name === product.name));
      }
      return current.map((line) =>
        line.code === product.code && line.name === product.name
          ? { ...line, qty: Math.min(9999, qty) }
          : line,
      );
    });
  }

  function moveActive(delta: number) {
    if (items.length === 0) return;
    const next = Math.max(0, Math.min(items.length - 1, active + delta));
    setActive(next);
    const element = scrollRef.current;
    if (!element) return;
    const top = next * rowHeight;
    const bottom = top + rowHeight;
    if (top < element.scrollTop) element.scrollTop = top;
    else if (bottom > element.scrollTop + element.clientHeight) {
      element.scrollTop = bottom - element.clientHeight;
    }
  }

  async function copyCode(code: string) {
    const ok = await copyText(code);
    notify(ok ? "Código copiado" : "No pude copiar el código");
  }

  function sendOrder() {
    if (!catalog || lines.length === 0) return;
    const fecha = formatFecha(catalog.fecha);
    const body = lines.map((line) => {
      const total = line.price === 0 ? "sin precio" : formatMoney(line.price * line.qty);
      return `${line.qty} × ${line.code} — ${displayName(line.name)} — ${total}`;
    });
    const text = [
      "Pedido · Librería Mayorista Sofía",
      `Lista del ${fecha} · precios con impuestos`,
      "",
      ...body,
      "",
      `Total: ${formatMoney(orderTotal)}`,
      unpriced > 0 ? `${unpriced} ${unpriced === 1 ? "artículo sin precio" : "artículos sin precio"}, fuera del total.` : "",
    ]
      .filter((line, index, all) => line !== "" || index !== all.length - 1)
      .join("\n");
    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) window.location.href = url;
  }

  const fecha = catalog ? formatFecha(catalog.fecha) : "";
  const counts = browsing && result ? result.counts : (catalog?.counts ?? {});
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 6);
  const end = Math.min(items.length, start + Math.ceil(viewport / rowHeight) + 14);

  return (
    <div className="app">
      <header className="top">
        <div className="top-inner">
          <div className="brand">
            <button type="button" className="logo-button" aria-label="Volver al inicio" onClick={goHome}>
              <img src="/logo-sofia.png" alt="" className="logo" />
            </button>
            <h1 className="wordmark">
              <span className="wordmark-kicker">Librería mayorista</span>
              <span className="wordmark-name">Sofia</span>
            </h1>
          </div>
          <div className="top-actions">
            <button type="button" className="order-launch" onClick={() => setDrawer(true)}>
              <span className="bubble bubble-navy" aria-hidden="true">
                <CartIcon />
              </span>
              <span className="order-copy">
                <span>Pedido</span>
                {orderCount > 0 ? <em>{formatMoney(orderTotal)}</em> : null}
              </span>
              {orderCount > 0 ? <strong>{orderCount}</strong> : null}
            </button>
          </div>
        </div>
      </header>

      <div className="shell">
      <div className="finder">
        <form
          className="search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            if (screen === "inicio" && items[active]) add(items[active]);
          }}
        >
          <label className="sr-only" htmlFor="q">
            Buscar por nombre o código
          </label>
          <input
            id="q"
            ref={searchRef}
            value={query}
            placeholder="Buscá por nombre o código"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            onChange={(event) => {
              setQuery(event.target.value);
              setScreen("inicio");
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                moveActive(1);
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                moveActive(-1);
              }
            }}
          />
          {query ? (
            <button
              type="button"
              className="clear"
              onClick={() => {
                setQuery("");
                setScreen("inicio");
              }}
            >
              Borrar
            </button>
          ) : null}
        </form>
        <p className="lede">
          {catalog
            ? `${catalog.products.length.toLocaleString("es-AR")} artículos · ${catalog.lista} · ${fecha} · precios con impuestos`
            : "Cargando la lista de precios…"}
        </p>
        {screen === "inicio" ? (
        <div className="chips" role="tablist" aria-label="Rubros">
          <button
            type="button"
            className="chip"
            aria-pressed={category === "todas"}
            onClick={() => {
              setScreen("inicio");
              setCategory("todas");
            }}
          >
            Todas
            {browsing && result ? <span>{result.total.toLocaleString("es-AR")}</span> : null}
          </button>
          {CATEGORIES.map((item) => {
            const count = counts[item.id] ?? 0;
            if (count === 0 && category !== item.id) return null;
            return (
              <button
                key={item.id}
                type="button"
                className="chip"
                aria-pressed={category === item.id}
                onClick={() => {
                  setScreen("inicio");
                  setCategory(item.id);
                }}
              >
                {item.label}
                <span>{count.toLocaleString("es-AR")}</span>
              </button>
            );
          })}
        </div>
        ) : null}
      </div>

      <main className="stage">
        {error ? (
          <div className="panel empty">
            <h2>La lista no cargó</h2>
            <p>{error}</p>
            <button type="button" className="add" onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
        ) : !catalog || !result ? (
          <div className="panel empty">
            <h2>Abriendo la lista…</h2>
            <p>Son más de dieciséis mil artículos. En un instante está lista para buscar.</p>
          </div>
        ) : screen === "favoritos" ? (
          <section className="results">
            <SectionHead title="Favoritos" />
            {favoriteProducts.length === 0 ? (
              <div className="panel empty">
                <h2>Todavía no hay favoritos.</h2>
                <p>En cada artículo tocá la estrella y queda guardado en este celular.</p>
                <button type="button" className="add" onClick={goHome}>
                  Ir al inicio
                </button>
              </div>
            ) : (
              <>
                <div className="results-bar">
                  <p>
                    {favoriteProducts.length.toLocaleString("es-AR")}{" "}
                    {favoriteProducts.length === 1 ? "artículo" : "artículos"}
                  </p>
                </div>
                <div className="scroller scroller-flow">
                  {favoriteProducts.map((product) => (
                    <ProductRow
                      key={lineKey(product)}
                      product={product}
                      query=""
                      qty={qtyByKey.get(lineKey(product)) ?? 0}
                      saved
                      onCopy={copyCode}
                      onAdd={add}
                      onSetQty={setQty}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        ) : !browsing ? (
          <section className="home">
            <SectionHead title="Lista de precios" />
            <p className="home-lead">
              Librería escolar mayorista de Córdoba. Buscá por nombre, marca o código y armá el pedido.
            </p>
            <ul className="promises">
              <li>
                <span className="bubble bubble-navy" aria-hidden="true">
                  <CartIcon />
                </span>
                Variedad de marcas
              </li>
              <li>
                <span className="bubble bubble-orange" aria-hidden="true">
                  <TruckIcon />
                </span>
                Envíos a todo el país
              </li>
              <li>
                <span className="bubble bubble-white" aria-hidden="true">
                  <PeopleIcon />
                </span>
                Atención personalizada
              </li>
            </ul>
            <div className="examples">
              {EXAMPLES.map((example) => (
                <button key={example} type="button" onClick={() => setQuery(example)}>
                  {example}
                </button>
              ))}
            </div>
            <div className="cat-grid">
              {CATEGORIES.map((item) => {
                const count = catalog.counts[item.id] ?? 0;
                if (count === 0) return null;
                return (
                  <button key={item.id} type="button" className="cat-card" onClick={() => setCategory(item.id)}>
                    <strong>{item.label}</strong>
                    <span>{count.toLocaleString("es-AR")} artículos</span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : tooShort ? (
          <div className="panel empty">
            <h2>Una letra más.</h2>
            <p>Con dos letras, o un rubro, la lista se achica y se puede recorrer.</p>
          </div>
        ) : items.length === 0 && result.total > 0 ? (
          <div className="panel empty">
            <h2>Nada en {categoryLabel(category)}.</h2>
            <p>
              Hay {result.total.toLocaleString("es-AR")}{" "}
              {result.total === 1 ? "artículo" : "artículos"} en el resto de la lista
              {query.trim() ? ` para “${query.trim()}”` : ""}.
            </p>
            <button type="button" className="add" onClick={() => setCategory("todas")}>
              Ver en toda la lista
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="panel empty">
            <h2>No hay artículos con “{query.trim() || categoryLabel(category)}”.</h2>
            <p>Probá con otras palabras o con el código del artículo.</p>
            <button
              type="button"
              className="add"
              onClick={() => {
                setQuery("");
                setCategory("todas");
              }}
            >
              Ver todo
            </button>
          </div>
        ) : (
          <section className="results">
            <SectionHead title={category === "todas" ? "Resultados" : categoryLabel(category)} />
            <div className="results-bar">
              <p>
                {items.length.toLocaleString("es-AR")}{" "}
                {items.length === 1 ? "artículo" : "artículos"}
                {category !== "todas" ? ` en ${categoryLabel(category)}` : ""}
              </p>
              <label className="sort">
                <span>Orden</span>
                <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
                  <option value="nombre">Nombre</option>
                  <option value="precio-asc">Menor precio</option>
                  <option value="precio-desc">Mayor precio</option>
                </select>
              </label>
            </div>
            <p className="hint">Enter suma el resaltado · flechas para recorrerlo · tocá el código para copiarlo</p>
            <div
              className="scroller"
              ref={scrollRef}
              onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
            >
              <div style={{ height: items.length * rowHeight, position: "relative" }}>
                {items.slice(start, end).map((product, offset) => {
                  const index = start + offset;
                  const qty = qtyByKey.get(lineKey(product)) ?? 0;
                  const selected = index === active;
                  return (
                    <ProductRow
                      key={product.id}
                      product={product}
                      query={query}
                      qty={qty}
                      saved={favoriteKeys.has(lineKey(product))}
                      selected={selected}
                      style={{ position: "absolute", top: index * rowHeight, height: rowHeight, left: 0, right: 0 }}
                      onHover={() => setActive(index)}
                      onCopy={copyCode}
                      onAdd={add}
                      onSetQty={setQty}
                      onToggleFavorite={toggleFavorite}
                    />
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="foot">
        <span>Librería Mayorista Sofía · Córdoba</span>
      </footer>
      </div>

      <nav className="dock" aria-label="Principal">
        <button
          type="button"
          className={screen === "inicio" && !drawer ? "dock-tab is-on" : "dock-tab"}
          aria-current={screen === "inicio" && !drawer ? "page" : undefined}
          onClick={goHome}
        >
          <HomeIcon />
          <span>Inicio</span>
        </button>
        <button
          type="button"
          className={screen === "favoritos" && !drawer ? "dock-tab is-on" : "dock-tab"}
          aria-current={screen === "favoritos" && !drawer ? "page" : undefined}
          onClick={() => {
            setScreen("favoritos");
            setQuery("");
            setDrawer(false);
          }}
        >
          <StarIcon filled={screen === "favoritos" && !drawer} />
          <span>Favoritos</span>
          {favorites.length > 0 ? <em>{favorites.length > 99 ? "99+" : favorites.length}</em> : null}
        </button>
        <button
          type="button"
          className={drawer ? "dock-tab is-on" : "dock-tab"}
          aria-current={drawer ? "page" : undefined}
          onClick={() => setDrawer((open) => !open)}
        >
          <CartIcon />
          <span>Carrito</span>
          {orderCount > 0 ? <em>{orderCount > 99 ? "99+" : orderCount}</em> : null}
        </button>
      </nav>

      {drawer ? (
        <div className="drawer-root">
          <button type="button" className="backdrop" aria-label="Cerrar pedido" onClick={() => setDrawer(false)} />
          <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="pedido-title">
            <header>
              <div>
                <p className="eyebrow">Escolar</p>
                <h2 id="pedido-title">Carrito</h2>
              </div>
              <button type="button" className="clear" onClick={() => setDrawer(false)}>
                Cerrar
              </button>
            </header>
            {lines.length === 0 ? (
              <p className="drawer-empty">Todavía no hay nada. Buscá un artículo y tocá Sumar.</p>
            ) : (
              <ul className="lines">
                {lines.map((line) => (
                  <li key={lineKey(line)}>
                    <div>
                      <strong>{displayName(line.name)}</strong>
                      <span>
                        {line.code}
                        {" · "}
                        {line.price === 0 ? "sin precio" : `${formatMoney(line.price)} c/u`}
                      </span>
                    </div>
                    <div className="line-side">
                      <div className="stepper">
                        <button type="button" aria-label="Quitar uno" onClick={() => setQty(line, line.qty - 1)}>
                          −
                        </button>
                        <span>{line.qty}</span>
                        <button type="button" aria-label="Sumar uno" onClick={() => setQty(line, line.qty + 1)}>
                          +
                        </button>
                      </div>
                      <em>{line.price === 0 ? "—" : formatMoney(line.price * line.qty)}</em>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <footer>
              <div className="grand">
                <span>Total con impuestos</span>
                <strong>{formatMoney(orderTotal)}</strong>
              </div>
              {unpriced > 0 ? (
                <p className="fine">
                  {unpriced === 1 ? "Hay 1 artículo sin precio" : `Hay ${unpriced} artículos sin precio`}. No entra en
                  el total.
                </p>
              ) : null}
              <div className="drawer-actions">
                <button type="button" className="add add-wide" onClick={sendOrder} disabled={lines.length === 0}>
                  Enviar pedido
                </button>
                <button
                  type="button"
                  className="ghost"
                  disabled={lines.length === 0}
                  onClick={() => {
                    if (!confirmClear) {
                      setConfirmClear(true);
                      return;
                    }
                    setLines([]);
                    setConfirmClear(false);
                    notify("Pedido vacío");
                  }}
                >
                  {confirmClear ? "Confirmar" : "Vaciar"}
                </button>
              </div>
            </footer>
          </aside>
        </div>
      ) : null}

      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function ProductRow({
  product,
  query,
  qty,
  saved,
  selected,
  style,
  onHover,
  onCopy,
  onAdd,
  onSetQty,
  onToggleFavorite,
}: {
  product: Product;
  query: string;
  qty: number;
  saved: boolean;
  selected?: boolean;
  style?: CSSProperties;
  onHover?: () => void;
  onCopy: (code: string) => void;
  onAdd: (product: Product) => void;
  onSetQty: (product: Product, qty: number) => void;
  onToggleFavorite: (product: Product) => void;
}) {
  const name = displayName(product.name);
  return (
    <article className={selected ? "row is-active" : "row"} style={style} onMouseEnter={onHover}>
      <div className="row-main">
        <h3>
          <Highlight text={name} query={query} />
        </h3>
        <p>
          <button type="button" className="code" onClick={() => onCopy(product.code)}>
            {product.code}
          </button>
          <span>{categoryLabel(product.category)}</span>
        </p>
      </div>
      <p className={product.price === 0 ? "price is-missing" : "price"}>{formatPrice(product.price)}</p>
      <div className="row-action">
        <button
          type="button"
          className={saved ? "star is-on" : "star"}
          aria-pressed={saved}
          aria-label={saved ? `Sacar ${name} de favoritos` : `Guardar ${name} en favoritos`}
          onClick={() => onToggleFavorite(product)}
        >
          <StarIcon filled={saved} />
        </button>
        {qty > 0 ? (
          <div className="stepper">
            <button type="button" aria-label={`Quitar uno de ${name}`} onClick={() => onSetQty(product, qty - 1)}>
              −
            </button>
            <span>{qty}</span>
            <button type="button" aria-label={`Sumar otro de ${name}`} onClick={() => onSetQty(product, qty + 1)}>
              +
            </button>
          </div>
        ) : (
          <button type="button" className="add" onClick={() => onAdd(product)}>
            Sumar
          </button>
        )}
      </div>
    </article>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <div className="section-head">
      <p>Escolar</p>
      <h2>{title}</h2>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m12 3.2 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.6 7.2 18.1l.9-5.4L4.2 8.9l5.4-.8L12 3.2Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 6h15l-1.6 8.2a2 2 0 0 1-2 1.6H8.2a2 2 0 0 1-2-1.6L5 6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M5 6 4.2 3.5H2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="9" cy="19.5" r="1.3" fill="currentColor" />
      <circle cx="17" cy="19.5" r="1.3" fill="currentColor" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 7.5h11v8H3v-8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M14 10.5h4.2L21 13.5V15.5h-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="17.5" r="1.5" fill="currentColor" />
      <circle cx="17.5" cy="17.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="8.5" r="1.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.8 17.5c.6-2.4 2.4-3.6 4.2-3.6s3.6 1.2 4.2 3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M13.2 14.2c1.2-.5 2.4-.5 3.4.1 1.2.8 1.8 2 2.1 3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const tokens = searchText(query)
    .split(" ")
    .filter((token) => token.length > 1 || /\d/.test(token));
  if (tokens.length === 0) return <>{text}</>;
  const pattern = tokens
    .map((token) => token.split("").map(accentPattern).join(""))
    .sort((a, b) => b.length - a.length)
    .join("|");
  const parts = text.split(new RegExp(`(${pattern})`, "ig"));
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? <mark key={`${part}-${index}`}>{part}</mark> : <span key={`${part}-${index}`}>{part}</span>,
      )}
    </>
  );
}

function accentPattern(char: string): string {
  const map: Record<string, string> = {
    a: "[aáàäâ]",
    e: "[eéèëê]",
    i: "[iíìïî]",
    o: "[oóòöô]",
    u: "[uúùüû]",
    n: "[nñ]",
  };
  return map[char] ?? char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
