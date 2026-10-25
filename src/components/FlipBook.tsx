import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
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

const FLIP_MS = 920;
const DRAG_THRESHOLD = 0.22;

export function FlipBook({ pageIndex, pageCount, onChange, children }: FlipBookProps) {
  const [turn, setTurn] = useState<Turn | null>(null);
  const [displayIndex, setDisplayIndex] = useState(pageIndex);
  const [dragProgress, setDragProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [contentKey, setContentKey] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    width: number;
    direction: "next" | "prev" | null;
  } | null>(null);
  const busy = turn !== null;

  useEffect(() => {
    if (pageIndex === displayIndex || busy || dragging) return;
    const direction = pageIndex > displayIndex ? "next" : "prev";
    setTurn({ from: displayIndex, to: pageIndex, direction });
    const timer = window.setTimeout(() => {
      setDisplayIndex(pageIndex);
      setTurn(null);
      setContentKey((value) => value + 1);
    }, FLIP_MS);
    return () => window.clearTimeout(timer);
  }, [pageIndex, displayIndex, busy, dragging]);

  function requestPage(next: number) {
    if (busy || dragging) return;
    const clamped = Math.min(pageCount - 1, Math.max(0, next));
    if (clamped === pageIndex) return;
    onChange(clamped);
  }

  function beginDrag(clientX: number) {
    if (busy) return;
    const width = stageRef.current?.clientWidth || 1;
    dragRef.current = { startX: clientX, width, direction: null };
    setDragging(true);
    setDragProgress(0);
  }

  function moveDrag(clientX: number) {
    const drag = dragRef.current;
    if (!drag) return;
    const raw = (clientX - drag.startX) / drag.width;
    let direction = drag.direction;
    if (!direction) {
      if (Math.abs(raw) < 0.02) {
        setDragProgress(0);
        return;
      }
      direction = raw < 0 ? "next" : "prev";
      if (direction === "next" && pageIndex >= pageCount - 1) {
        setDragProgress(0);
        return;
      }
      if (direction === "prev" && pageIndex <= 0) {
        setDragProgress(0);
        return;
      }
      drag.direction = direction;
    }

    const signed = direction === "next" ? -raw : raw;
    setDragProgress(Math.min(1, Math.max(0, signed * 1.15)));
  }

  function endDrag() {
    const drag = dragRef.current;
    const progress = dragProgress;
    const direction = drag?.direction;
    dragRef.current = null;
    setDragging(false);

    if (!direction || progress < DRAG_THRESHOLD) {
      setDragProgress(0);
      return;
    }

    setDragProgress(0);
    requestPage(direction === "next" ? pageIndex + 1 : pageIndex - 1);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, label")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    beginDrag(event.clientX);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    moveDrag(event.clientX);
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    endDrag();
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (busy || dragging) return;
      if (event.key === "ArrowRight") requestPage(pageIndex + 1);
      if (event.key === "ArrowLeft") requestPage(pageIndex - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const outgoing = turn?.from ?? displayIndex;
  const incoming = turn?.to ?? displayIndex;
  const flipping = Boolean(turn);
  const direction = turn?.direction ?? dragRef.current?.direction ?? "next";
  const interactive = dragging && dragProgress > 0.001;
  const baseIndex = flipping
    ? direction === "next"
      ? incoming
      : outgoing
    : interactive
      ? direction === "next"
        ? Math.min(pageCount - 1, displayIndex + 1)
        : displayIndex
      : displayIndex;
  const leafIndex = flipping
    ? direction === "next"
      ? outgoing
      : incoming
    : interactive
      ? direction === "next"
        ? displayIndex
        : Math.max(0, displayIndex - 1)
      : displayIndex;

  const dragAngle = direction === "next" ? -180 * dragProgress : -180 + 180 * dragProgress;
  const showLeaf = flipping || interactive;

  return (
    <div
      className={[
        "flipbook",
        flipping ? `flipbook--${direction}` : "",
        flipping ? "is-flipping" : "",
        dragging ? "is-dragging" : "",
        interactive ? `flipbook--drag-${direction}` : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          "--flip-ms": `${FLIP_MS}ms`,
          "--drag-progress": dragProgress,
          "--drag-angle": `${dragAngle}deg`,
        } as CSSProperties
      }
    >
      <div
        ref={stageRef}
        className="flipbook__stage"
        aria-live="polite"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="flipbook__glow" aria-hidden="true" />
        <div className="flipbook__spine" aria-hidden="true" />
        <div className="flipbook__shadow" aria-hidden="true" />
        <div className="flipbook__floor" aria-hidden="true" />

        <div
          className={`flipbook__sheet flipbook__sheet--base ${flipping || interactive ? "is-under" : "is-current"}`}
          key={`page-${baseIndex}-${contentKey}`}
        >
          {children[baseIndex]}
        </div>

        {showLeaf ? (
          <div
            className={[
              "flipbook__sheet",
              "flipbook__sheet--leaf",
              flipping ? `is-${direction}` : "is-drag",
              interactive ? "is-interactive" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={flipping ? `${outgoing}-${incoming}-${direction}` : "drag-leaf"}
          >
            <div className="flipbook__face flipbook__face--front">{children[leafIndex]}</div>
            <div className="flipbook__face flipbook__face--back" aria-hidden="true">
              <div className="flipbook__paper-back" />
            </div>
            <div className="flipbook__curl" aria-hidden="true" />
            <div className="flipbook__sheen" aria-hidden="true" />
          </div>
        ) : null}
      </div>

      <div className="flipbook__controls">
        <button type="button" className="flipbook__nav" onClick={() => requestPage(pageIndex - 1)} disabled={pageIndex <= 0 || busy}>
          ← Anterior
        </button>
        <p className="flipbook__counter">
          <span className="flipbook__counter-now">{pageIndex + 1}</span>
          <span>/</span>
          {pageCount}
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

      <p className="flipbook__hint">Arrastrá la hoja · deslizá · flechas del teclado</p>
    </div>
  );
}
