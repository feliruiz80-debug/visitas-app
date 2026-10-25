import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";

type FlipBookProps = {
  pageIndex: number;
  pageCount: number;
  onChange: (index: number) => void;
  children: ReactNode[];
};

type Turn = {
  from: number;
  to: number;
  direction: "next" | "prev";
};

const FLIP_MS = 780;

export function FlipBook({ pageIndex, pageCount, onChange, children }: FlipBookProps) {
  const [turn, setTurn] = useState<Turn | null>(null);
  const [displayIndex, setDisplayIndex] = useState(pageIndex);
  const touchStartX = useRef<number | null>(null);
  const busy = turn !== null;

  useEffect(() => {
    if (pageIndex === displayIndex || busy) return;
    const direction = pageIndex > displayIndex ? "next" : "prev";
    setTurn({ from: displayIndex, to: pageIndex, direction });
    const timer = window.setTimeout(() => {
      setDisplayIndex(pageIndex);
      setTurn(null);
    }, FLIP_MS);
    return () => window.clearTimeout(timer);
  }, [pageIndex, displayIndex, busy]);

  function requestPage(next: number) {
    if (busy) return;
    const clamped = Math.min(pageCount - 1, Math.max(0, next));
    if (clamped === pageIndex) return;
    onChange(clamped);
  }

  function onTouchStart(event: ReactTouchEvent) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: ReactTouchEvent) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const end = event.changedTouches[0]?.clientX ?? start;
    const delta = end - start;
    if (Math.abs(delta) < 48) return;
    if (delta < 0) requestPage(pageIndex + 1);
    else requestPage(pageIndex - 1);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (busy) return;
      if (event.key === "ArrowRight") {
        const next = Math.min(pageCount - 1, pageIndex + 1);
        if (next !== pageIndex) onChange(next);
      }
      if (event.key === "ArrowLeft") {
        const next = Math.max(0, pageIndex - 1);
        if (next !== pageIndex) onChange(next);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pageIndex, pageCount, busy, onChange]);

  const outgoing = turn?.from ?? displayIndex;
  const incoming = turn?.to ?? displayIndex;
  const flipping = Boolean(turn);
  const direction = turn?.direction ?? "next";
  // Al avanzar, la hoja que se va es la actual. Al volver, la hoja que entra es la destino.
  const baseIndex = flipping ? (direction === "next" ? incoming : outgoing) : displayIndex;
  const leafIndex = flipping ? (direction === "next" ? outgoing : incoming) : displayIndex;

  return (
    <div
      className={`flipbook ${flipping ? `flipbook--${direction}` : ""} ${flipping ? "is-flipping" : ""}`}
      style={{ "--flip-ms": `${FLIP_MS}ms` } as CSSProperties}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flipbook__stage" aria-live="polite">
        <div className="flipbook__spine" aria-hidden="true" />
        <div className="flipbook__shadow" aria-hidden="true" />

        <div className={`flipbook__sheet flipbook__sheet--base ${flipping ? "is-under" : "is-current"}`}>
          {children[baseIndex]}
        </div>

        {flipping ? (
          <div
            className={`flipbook__sheet flipbook__sheet--leaf is-${direction}`}
            key={`${outgoing}-${incoming}-${direction}`}
          >
            <div className="flipbook__face flipbook__face--front">{children[leafIndex]}</div>
            <div className="flipbook__face flipbook__face--back" aria-hidden="true">
              <div className="flipbook__paper-back" />
            </div>
            <div className="flipbook__curl" aria-hidden="true" />
          </div>
        ) : null}
      </div>

      <div className="flipbook__controls">
        <button type="button" className="flipbook__nav" onClick={() => requestPage(pageIndex - 1)} disabled={pageIndex <= 0 || busy}>
          ← Anterior
        </button>
        <p className="flipbook__counter">
          {pageIndex + 1} <span>/</span> {pageCount}
        </p>
        <button
          type="button"
          className="flipbook__nav"
          onClick={() => requestPage(pageIndex + 1)}
          disabled={pageIndex >= pageCount - 1 || busy}
        >
          Siguiente →
        </button>
      </div>

      <p className="flipbook__hint">Deslizá o usá las flechas para pasar la hoja</p>
    </div>
  );
}
