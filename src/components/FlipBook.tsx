import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

type FlipBookProps = {
  pageIndex: number;
  pageCount: number;
  onChange: (index: number) => void;
  children: ReactNode[];
};

/**
 * Navegación de revista estable: sin máquina de estados que se trabe.
 * Transición CSS corta + botones / teclado / swipe.
 */
export function FlipBook({ pageIndex, pageCount, onChange, children }: FlipBookProps) {
  const [animClass, setAnimClass] = useState("is-enter");
  const touchStartX = useRef<number | null>(null);
  const lastIndex = useRef(pageIndex);

  useEffect(() => {
    if (lastIndex.current === pageIndex) return;
    const goingNext = pageIndex > lastIndex.current;
    lastIndex.current = pageIndex;
    setAnimClass(goingNext ? "is-enter-next" : "is-enter-prev");
  }, [pageIndex]);

  function go(delta: number) {
    const next = Math.min(pageCount - 1, Math.max(0, pageIndex + delta));
    if (next !== pageIndex) onChange(next);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, label")) return;
    touchStartX.current = event.clientX;
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const delta = event.clientX - start;
    if (Math.abs(delta) < 56) return;
    go(delta < 0 ? 1 : -1);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const current = children[pageIndex] ?? null;

  return (
    <div className="flipbook">
      <div
        className="flipbook__stage"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          touchStartX.current = null;
        }}
      >
        <div className="flipbook__spine" aria-hidden="true" />
        <div key={pageIndex} className={`flipbook__page ${animClass}`}>
          {current}
        </div>
      </div>

      <div className="flipbook__controls">
        <button type="button" className="flipbook__nav" onClick={() => go(-1)} disabled={pageIndex <= 0}>
          ← Anterior
        </button>
        <p className="flipbook__counter">
          <span className="flipbook__counter-now">{pageIndex + 1}</span>
          <span> / </span>
          {pageCount}
        </p>
        <button
          type="button"
          className="flipbook__nav"
          onClick={() => go(1)}
          disabled={pageIndex >= pageCount - 1}
        >
          Siguiente →
        </button>
      </div>

      <p className="flipbook__hint">Deslizá o usá Siguiente / Anterior</p>
    </div>
  );
}
