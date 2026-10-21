import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { MapPanel, type MapFocus } from "./MapPanel";
import {
  MAX_RADIUS_METERS,
  MIN_RADIUS_METERS,
  directionsUrl,
  fetchShops,
  formatRadius,
  loadVisits,
  saveVisits,
  searchZones,
  toVisit,
  websiteHref,
  type CircleZone,
  type Place,
  type SavedVisit,
  type ZoneSearchHit,
} from "./model";

type Screen = "mapa" | "visitas";

export function App() {
  const [screen, setScreen] = useState<Screen>("mapa");
  const [visits, setVisits] = useState<SavedVisit[]>(() => loadVisits());
  const [places, setPlaces] = useState<Place[]>([]);
  const [discardedIds, setDiscardedIds] = useState<string[]>([]);
  const [zone, setZone] = useState<CircleZone | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ZoneSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const requestRef = useRef(0);

  useEffect(() => {
    saveVisits(visits);
  }, [visits]);

  useEffect(() => {
    if (!selectedId) return;
    document.getElementById(`place-${selectedId}`)?.scrollIntoView({ block: "nearest" });
  }, [selectedId, screen]);

  const visitIds = useMemo(() => new Set(visits.map((visit) => visit.id)), [visits]);
  const candidates = places.filter((place) => !visitIds.has(place.id) && !discardedIds.includes(place.id));
  const pendingCount = visits.filter((visit) => !visit.visited).length;
  const visitedCount = visits.length - pendingCount;
  const orderedVisits = [...visits].sort((a, b) => {
    if (a.visited !== b.visited) return a.visited ? 1 : -1;
    return b.addedAt.localeCompare(a.addedAt);
  });

  async function loadPlaces(next: CircleZone, capped: boolean) {
    const requestId = ++requestRef.current;
    setLoading(true);
    setPlaces([]);
    setDiscardedIds([]);
    setSelectedId(null);
    setNotice("");
    try {
      const result = await fetchShops(next);
      if (requestId !== requestRef.current) return;
      setPlaces(result.places);
      const notes: string[] = [];
      if (capped) notes.push("Limité la zona a 2,5 km para poder listar los comercios.");
      if (result.places.length === 0) {
        notes.push("No encontré comercios con nombre dentro del círculo. Prueba una zona más grande.");
      } else if (result.limited) {
        notes.push("Mostré los primeros 100 comercios. Achica el círculo para ver una zona más precisa.");
      }
      setNotice(notes.join(" "));
    } catch {
      if (requestId !== requestRef.current) return;
      setNotice("No pude traer los comercios. Espera un momento y vuelve a dibujar la zona.");
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }

  function handleDraw(next: CircleZone) {
    setDrawing(false);
    if (next.radius < MIN_RADIUS_METERS) {
      setNotice("El círculo quedó muy chico. Arrastra un poco más para marcar la zona.");
      return;
    }
    const capped = next.radius > MAX_RADIUS_METERS;
    const zoneToSearch = { ...next, radius: Math.min(next.radius, MAX_RADIUS_METERS) };
    setZone(zoneToSearch);
    void loadPlaces(zoneToSearch, capped);
  }

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    const text = query.trim();
    if (!text) return;
    setSearching(true);
    setNotice("");
    try {
      const results = await searchZones(text);
      setHits(results);
      if (results.length === 0) setNotice("No encontré esa zona. Prueba con ciudad y barrio.");
    } catch {
      setHits([]);
      setNotice("No pude buscar la zona. Inténtalo de nuevo.");
    } finally {
      setSearching(false);
    }
  }

  function goToHit(hit: ZoneSearchHit) {
    setFocus({ lat: hit.lat, lng: hit.lng, zoom: 15 });
    setHits([]);
    setQuery(hit.label);
    setScreen("mapa");
  }

  function locate() {
    if (!navigator.geolocation) {
      setNotice("Este navegador no entrega la ubicación. Busca la ciudad a mano.");
      return;
    }
    setNotice("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFocus({ lat: position.coords.latitude, lng: position.coords.longitude, zoom: 16 });
        setScreen("mapa");
      },
      () => setNotice("No pude usar tu ubicación. Busca la ciudad a mano."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function chooseVisit(place: Place) {
    setVisits((current) => (current.some((visit) => visit.id === place.id) ? current : [toVisit(place), ...current]));
    setNotice(`${place.name} pasó a Por visitar.`);
  }

  function discardPlace(place: Place) {
    setDiscardedIds((current) => (current.includes(place.id) ? current : [...current, place.id]));
    setNotice(`Descartaste ${place.name}.`);
  }

  function toggleVisited(id: string) {
    setVisits((current) =>
      current.map((visit) => (visit.id === id ? { ...visit, visited: !visit.visited } : visit)),
    );
  }

  function removeVisit(id: string) {
    setVisits((current) => current.filter((visit) => visit.id !== id));
  }

  function showOnMap(place: Place) {
    setSelectedId(place.id);
    setFocus({ lat: place.lat, lng: place.lng, zoom: 17 });
    setScreen("mapa");
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="brand">Visitas</p>
          <p className="date">Salidas para vender productos de librería</p>
        </div>
        <nav className="tabs" aria-label="Secciones">
          <button type="button" className={screen === "mapa" ? "tab active" : "tab"} onClick={() => setScreen("mapa")}>
            Mapa
          </button>
          <button
            type="button"
            className={screen === "visitas" ? "tab active" : "tab"}
            onClick={() => setScreen("visitas")}
          >
            Por visitar ({visits.length})
          </button>
        </nav>
      </header>

      <div className={screen === "mapa" ? "screen" : "screen hidden"}>
        <form className="search-form" onSubmit={handleSearch}>
          <label className="search">
            <span className="sr-only">Buscar ciudad o barrio</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar ciudad o barrio"
            />
          </label>
          <button type="submit" className="secondary" disabled={searching}>
            {searching ? "Buscando..." : "Buscar"}
          </button>
          <button type="button" className="secondary" onClick={locate}>
            Mi ubicación
          </button>
          <button type="button" className={drawing ? "primary" : "secondary"} onClick={() => setDrawing((value) => !value)}>
            {drawing ? "Cancelar dibujo" : "Dibujar zona"}
          </button>
        </form>

        {hits.length > 0 ? (
          <ul className="hits">
            {hits.map((hit) => (
              <li key={hit.id}>
                <button type="button" onClick={() => goToHit(hit)}>
                  {hit.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="legend" aria-hidden="true">
          <span>
            <i className="dot candidate" /> En la zona
          </span>
          <span>
            <i className="dot pending" /> Por visitar
          </span>
          <span>
            <i className="dot visited" /> Visitado
          </span>
        </div>

        <MapPanel
          active={screen === "mapa"}
          drawing={drawing}
          focus={focus}
          zone={zone}
          places={candidates}
          visits={visits}
          selectedId={selectedId}
          onDraw={handleDraw}
          onSelect={setSelectedId}
        />

        {zone ? <p className="zone-label">Zona marcada: {formatRadius(zone.radius)}</p> : null}
        {notice ? <p className="notice">{notice}</p> : null}

        <section className="panel" aria-live="polite">
          <h2>Comercios en la zona</h2>
          {loading ? <p className="muted">Buscando comercios dentro del círculo...</p> : null}
          {!loading && !zone ? (
            <p className="muted">
              Busca tu ciudad, dibuja un círculo y elige qué comercios vas a visitar para ofrecer productos de librería.
            </p>
          ) : null}
          {!loading && zone && candidates.length === 0 && places.length > 0 ? (
            <p className="muted">Ya clasificaste los comercios de esta zona.</p>
          ) : null}
          <ul className="cards">
            {candidates.map((place) => (
              <li key={place.id} id={`place-${place.id}`}>
                <article className={place.id === selectedId ? "card selected" : "card"}>
                  <div className="card-title">
                    <h3>{place.name}</h3>
                    <span className="badge">{place.shopLabel}</span>
                  </div>
                  <PlaceFacts place={place} showDistance showType={false} />
                  <div className="actions">
                    <button type="button" className="primary" onClick={() => chooseVisit(place)}>
                      Visitar
                    </button>
                    <button type="button" className="text danger" onClick={() => discardPlace(place)}>
                      Descartar
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className={screen === "visitas" ? "screen" : "screen hidden"}>
        <section className="panel">
          <h2>Por visitar</h2>
          <p className="muted">
            {visits.length === 0
              ? "Cuando marques Visitar en un comercio, queda acá con sus datos."
              : `${pendingCount} pendientes · ${visitedCount} visitados`}
          </p>
          {screen === "visitas" && notice ? <p className="notice">{notice}</p> : null}
          <ul className="cards">
            {orderedVisits.map((visit) => (
              <li key={visit.id} id={`place-${visit.id}`}>
                <article className={visit.visited ? "card done" : "card"}>
                  <div className="card-title">
                    <h3>{visit.name}</h3>
                    <span className={visit.visited ? "badge visited" : "badge pending"}>
                      {visit.visited ? "Visitado" : "Pendiente"}
                    </span>
                  </div>
                  <PlaceFacts place={visit} />
                  <div className="actions">
                    <button type="button" className="primary" onClick={() => toggleVisited(visit.id)}>
                      {visit.visited ? "Marcar no visitado" : "Marcar visitado"}
                    </button>
                    <a className="secondary link" href={directionsUrl(visit.lat, visit.lng)} target="_blank" rel="noreferrer">
                      Cómo llegar
                    </a>
                    <button type="button" className="secondary" onClick={() => showOnMap(visit)}>
                      Ver en el mapa
                    </button>
                    <button type="button" className="text danger" onClick={() => removeVisit(visit.id)}>
                      Quitar
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className="footnote">La lista de comercios por visitar se guarda en este navegador.</p>
    </div>
  );
}

function PlaceFacts({
  place,
  showDistance = false,
  showType = true,
}: {
  place: Place;
  showDistance?: boolean;
  showType?: boolean;
}) {
  return (
    <div className="facts">
      {showType ? <p>{place.shopLabel}</p> : null}
      <p>{place.address || "Sin dirección cargada en el mapa"}</p>
      {place.phone ? (
        <p>
          <a href={`tel:${place.phone.replace(/\s+/g, "")}`}>{place.phone}</a>
        </p>
      ) : (
        <p className="muted">Sin teléfono</p>
      )}
      {place.openingHours ? <p>Horario: {place.openingHours}</p> : <p className="muted">Sin horario</p>}
      {place.website ? (
        <p>
          <a href={websiteHref(place.website)} target="_blank" rel="noreferrer">
            {place.website}
          </a>
        </p>
      ) : null}
      {showDistance ? <p className="muted">A {formatRadius(place.distance)} del centro de la zona</p> : null}
    </div>
  );
}
