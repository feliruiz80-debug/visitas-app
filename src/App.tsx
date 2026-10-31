import { useEffect, useMemo, useRef, useState } from "react";
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
  type Product,
  type SortKey,
} from "./data/catalog";

const STORAGE_KEY = "sofia-lista-pedido-v1";
const EXAMPLES = ["témpera alba", "mochila", "abrochadora", "cuaderno", "marcador", "E0260"];

type Line = {
  code: string;
  name: string;
  price: number;
  qty: number;
};

function lineKey(line: { code: string; name: string }): string {
  return `${line.code}\u0000${line.name}`;
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
  const [height, setHeight] = useState(84);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 720px)");
    const apply = () => setHeight(query.matches ? 104 : 84);
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
        else if (query) setQuery("");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer, query]);

  const qtyByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of lines) map.set(lineKey(line), line.qty);
    return map;
  }, [lines]);

  const orderCount = lines.reduce((sum, line) => sum + line.qty, 0);
  const orderTotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const unpriced = lines.filter((line) => line.price === 0).length;

  function notify(message: string) {
    setToast(message);
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

  async function copyOrder() {
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
    const ok = await copyText(text);
    notify(ok ? "Pedido copiado" : "No pude copiar el pedido");
  }

  const fecha = catalog ? formatFecha(catalog.fecha) : "";
  const counts = browsing && result ? result.counts : (catalog?.counts ?? {});
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 6);
  const end = Math.min(items.length, start + Math.ceil(viewport / rowHeight) + 14);

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="mark" aria-hidden="true">
            S
          </span>
          <div>
            <p className="eyebrow">Librería mayorista</p>
            <h1>Sofía</h1>
          </div>
        </div>
        <button type="button" className="order-launch" onClick={() => setDrawer(true)}>
          <span>Pedido</span>
          {orderCount > 0 ? <strong>{orderCount}</strong> : null}
          {orderCount > 0 ? <em className="order-total">{formatMoney(orderTotal)}</em> : null}
        </button>
      </header>

      <div className="finder">
        <form
          className="search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            if (items[active]) add(items[active]);
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
            onChange={(event) => setQuery(event.target.value)}
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
            <button type="button" className="clear" onClick={() => setQuery("")}>
              Borrar
            </button>
          ) : null}
        </form>
        <p className="lede">
          {catalog
            ? `${catalog.products.length.toLocaleString("es-AR")} artículos · ${catalog.lista} · ${fecha} · precios con impuestos`
            : "Cargando la lista de precios…"}
        </p>
        <div className="chips" role="tablist" aria-label="Rubros">
          <button
            type="button"
            className="chip"
            aria-pressed={category === "todas"}
            onClick={() => setCategory("todas")}
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
                onClick={() => setCategory(item.id)}
              >
                {item.label}
                <span>{count.toLocaleString("es-AR")}</span>
              </button>
            );
          })}
        </div>
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
        ) : !browsing ? (
          <section className="home">
            <div className="home-copy">
              <h2>Buscá en la lista del mostrador.</h2>
              <p>
                Escribí un nombre, una marca o un código. Después podés armar el pedido y copiarlo.
                Las fotos las sumamos más adelante.
              </p>
            </div>
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
                    <article
                      key={product.id}
                      className={selected ? "row is-active" : "row"}
                      style={{ position: "absolute", top: index * rowHeight, height: rowHeight, left: 0, right: 0 }}
                      onMouseEnter={() => setActive(index)}
                    >
                      <div className="row-main">
                        <h3>
                          <Highlight text={displayName(product.name)} query={query} />
                        </h3>
                        <p>
                          <button type="button" className="code" onClick={() => copyCode(product.code)}>
                            {product.code}
                          </button>
                          <span>{categoryLabel(product.category)}</span>
                        </p>
                      </div>
                      <p className={product.price === 0 ? "price is-missing" : "price"}>{formatPrice(product.price)}</p>
                      <div className="row-action">
                        {qty > 0 ? (
                          <div className="stepper">
                            <button
                              type="button"
                              aria-label={`Quitar uno de ${displayName(product.name)}`}
                              onClick={() => setQty(product, qty - 1)}
                            >
                              −
                            </button>
                            <span>{qty}</span>
                            <button
                              type="button"
                              aria-label={`Sumar otro de ${displayName(product.name)}`}
                              onClick={() => setQty(product, qty + 1)}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button type="button" className="add" onClick={() => add(product)}>
                            Sumar
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="colophon">
        Librería Mayorista Sofía · Buenos Aires 346 · lista en pesos
      </footer>

      {drawer ? (
        <div className="drawer-root">
          <button type="button" className="backdrop" aria-label="Cerrar pedido" onClick={() => setDrawer(false)} />
          <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="pedido-title">
            <header>
              <div>
                <p className="eyebrow">Mostrador</p>
                <h2 id="pedido-title">Tu pedido</h2>
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
                <button type="button" className="add add-wide" onClick={copyOrder} disabled={lines.length === 0}>
                  Copiar pedido
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
