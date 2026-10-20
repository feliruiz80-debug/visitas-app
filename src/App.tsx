import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  avatarColor,
  checkoutVisit,
  createVisit,
  deleteVisit,
  formatClock,
  formatDay,
  formatDuration,
  initials,
  isSameLocalDay,
  loadVisits,
  matchesQuery,
  saveVisits,
  type NewVisit,
  type Visit,
} from "./model";

type Tab = "inside" | "today" | "all";

type Toast = {
  id: number;
  text: string;
  undo?: () => void;
};

const EMPTY_FORM: NewVisit = {
  visitorName: "",
  documentId: "",
  company: "",
  hostName: "",
  reason: "",
};

export function App() {
  const [visits, setVisits] = useState<Visit[]>(() => loadVisits());
  const [tab, setTab] = useState<Tab>("inside");
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [toast, setToast] = useState<Toast | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    saveVisits(visits);
  }, [visits]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const insideCount = visits.filter((visit) => visit.leftAt === null).length;
  const todayCount = visits.filter((visit) => isSameLocalDay(visit.enteredAt, now)).length;

  const visibleVisits = useMemo(() => {
    return visits
      .filter((visit) => {
        if (tab === "inside") return visit.leftAt === null;
        if (tab === "today") return isSameLocalDay(visit.enteredAt, now);
        return true;
      })
      .filter((visit) => matchesQuery(visit, query))
      .sort((a, b) => {
        if ((a.leftAt === null) !== (b.leftAt === null)) return a.leftAt === null ? -1 : 1;
        const aTime = a.leftAt ?? a.enteredAt;
        const bTime = b.leftAt ?? b.enteredAt;
        return bTime.localeCompare(aTime);
      });
  }, [visits, tab, query, now]);

  function showToast(text: string, undo?: () => void) {
    setToast({ id: Date.now(), text, undo });
  }

  function handleCreate(input: NewVisit) {
    setVisits((current) => createVisit(current, input));
    setTab("inside");
    setQuery("");
    setSheetOpen(false);
    showToast(`Entrada de ${input.visitorName.trim()} registrada.`);
  }

  function handleCheckout(visit: Visit) {
    const previous = visits;
    setVisits((current) => checkoutVisit(current, visit.id));
    setPendingDelete(null);
    showToast(`Salida de ${visit.visitorName} registrada.`, () => setVisits(previous));
  }

  function handleDelete(visit: Visit) {
    if (pendingDelete !== visit.id) {
      setPendingDelete(visit.id);
      return;
    }
    const previous = visits;
    setVisits((current) => deleteVisit(current, visit.id));
    setPendingDelete(null);
    showToast(`Se eliminó la visita de ${visit.visitorName}.`, () => setVisits(previous));
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="brand">Visitas</p>
          <p className="date">{formatDay(now)}</p>
        </div>
        <button type="button" className="primary" onClick={() => setSheetOpen(true)}>
          Registrar entrada
        </button>
      </header>

      <section className="stats" aria-label="Resumen">
        <button type="button" className={tab === "inside" ? "stat active" : "stat"} onClick={() => setTab("inside")}>
          <span className="stat-value">{insideCount}</span>
          <span className="stat-label">Dentro ahora</span>
        </button>
        <button type="button" className={tab === "today" ? "stat active" : "stat"} onClick={() => setTab("today")}>
          <span className="stat-value">{todayCount}</span>
          <span className="stat-label">Entradas de hoy</span>
        </button>
        <button type="button" className={tab === "all" ? "stat active" : "stat"} onClick={() => setTab("all")}>
          <span className="stat-value">{visits.length}</span>
          <span className="stat-label">En el libro</span>
        </button>
      </section>

      <div className="toolbar">
        <label className="search">
          <span className="sr-only">Buscar visitas</span>
          <input
            type="search"
            value={query}
            placeholder="Buscar por nombre, empresa o motivo"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="tabs" role="tablist" aria-label="Filtrar visitas">
          <TabButton id="inside" current={tab} onSelect={setTab}>
            Dentro
          </TabButton>
          <TabButton id="today" current={tab} onSelect={setTab}>
            Hoy
          </TabButton>
          <TabButton id="all" current={tab} onSelect={setTab}>
            Todas
          </TabButton>
        </div>
      </div>

      <main>
        {visibleVisits.length === 0 ? (
          <EmptyState tab={tab} hasQuery={query.trim().length > 0} onCreate={() => setSheetOpen(true)} />
        ) : (
          <ul className="visit-list">
            {visibleVisits.map((visit) => (
              <li key={visit.id}>
                <article className={visit.leftAt ? "visit left" : "visit"}>
                  <div className="avatar" style={{ background: avatarColor(visit.visitorName) }} aria-hidden="true">
                    {initials(visit.visitorName)}
                  </div>
                  <div className="visit-body">
                    <div className="visit-title">
                      <h2>{visit.visitorName}</h2>
                      <span className={visit.leftAt ? "badge out" : "badge in"}>
                        {visit.leftAt ? "Salió" : "Dentro"}
                      </span>
                    </div>
                    <p className="meta">
                      {[visit.company, visit.documentId].filter(Boolean).join(" · ") || "Sin empresa"}
                    </p>
                    <p>
                      Visita a <strong>{visit.hostName}</strong>
                    </p>
                    <p className="reason">{visit.reason}</p>
                    <p className="times">
                      Entró {formatClock(visit.enteredAt)}
                      {visit.leftAt
                        ? ` · Salió ${formatClock(visit.leftAt)} · ${formatDuration(visit.enteredAt, new Date(visit.leftAt))}`
                        : ` · ${formatDuration(visit.enteredAt, now)}`}
                    </p>
                  </div>
                  <div className="visit-actions">
                    {visit.leftAt === null ? (
                      <button type="button" className="secondary" onClick={() => handleCheckout(visit)}>
                        Registrar salida
                      </button>
                    ) : null}
                    <button type="button" className="text danger" onClick={() => handleDelete(visit)}>
                      {pendingDelete === visit.id ? "Confirmar" : "Eliminar"}
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </main>

      <p className="footnote">Los datos se guardan en este navegador.</p>

      {sheetOpen ? <EntrySheet onClose={() => setSheetOpen(false)} onCreate={handleCreate} /> : null}

      {toast ? (
        <div className="toast" role="status">
          <span>{toast.text}</span>
          {toast.undo ? (
            <button
              type="button"
              className="text"
              onClick={() => {
                toast.undo?.();
                setToast(null);
              }}
            >
              Deshacer
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TabButton({
  id,
  current,
  onSelect,
  children,
}: {
  id: Tab;
  current: Tab;
  onSelect: (tab: Tab) => void;
  children: string;
}) {
  const selected = current === id;
  return (
    <button type="button" role="tab" aria-selected={selected} className={selected ? "tab active" : "tab"} onClick={() => onSelect(id)}>
      {children}
    </button>
  );
}

function EmptyState({ tab, hasQuery, onCreate }: { tab: Tab; hasQuery: boolean; onCreate: () => void }) {
  const message = hasQuery
    ? "Ninguna visita coincide con la búsqueda."
    : tab === "inside"
      ? "Nadie está dentro ahora."
      : tab === "today"
        ? "Todavía no hay entradas de hoy."
        : "El libro está vacío.";

  return (
    <div className="empty">
      <p>{message}</p>
      {hasQuery ? null : (
        <button type="button" className="primary" onClick={onCreate}>
          Registrar entrada
        </button>
      )}
    </div>
  );
}

function EntrySheet({ onClose, onCreate }: { onClose: () => void; onCreate: (input: NewVisit) => void }) {
  const [form, setForm] = useState<NewVisit>(EMPTY_FORM);
  const [error, setError] = useState("");
  const firstField = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    firstField.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  function update(field: keyof NewVisit, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.visitorName.trim() || !form.hostName.trim() || !form.reason.trim()) {
      setError("Completa el nombre, a quién visita y el motivo.");
      return;
    }
    onCreate(form);
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-head">
          <h2 id="sheet-title">Nueva entrada</h2>
          <button type="button" className="text" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            Nombre del visitante
            <input
              ref={firstField}
              value={form.visitorName}
              onChange={(event) => update("visitorName", event.target.value)}
              autoComplete="name"
              required
            />
          </label>
          <div className="split">
            <label>
              Documento
              <input
                value={form.documentId}
                onChange={(event) => update("documentId", event.target.value)}
                autoComplete="off"
                placeholder="Opcional"
              />
            </label>
            <label>
              Empresa
              <input
                value={form.company}
                onChange={(event) => update("company", event.target.value)}
                autoComplete="organization"
                placeholder="Opcional"
              />
            </label>
          </div>
          <label>
            ¿A quién visita?
            <input
              value={form.hostName}
              onChange={(event) => update("hostName", event.target.value)}
              autoComplete="off"
              required
            />
          </label>
          <label>
            Motivo
            <input
              value={form.reason}
              onChange={(event) => update("reason", event.target.value)}
              autoComplete="off"
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="primary wide">
            Registrar entrada
          </button>
        </form>
      </section>
    </div>
  );
}
