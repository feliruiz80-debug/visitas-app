import { useEffect, useRef, type RefObject } from "react";
import L from "leaflet";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { formatRadius, type CircleZone, type Place, type SavedVisit } from "./model";

export type MapFocus = {
  lat: number;
  lng: number;
  zoom: number;
};

type MapPanelProps = {
  active: boolean;
  drawing: boolean;
  focus: MapFocus | null;
  zone: CircleZone | null;
  places: Place[];
  visits: SavedVisit[];
  selectedId: string | null;
  onDraw: (zone: CircleZone) => void;
  onSelect: (id: string) => void;
};

const zoneStyle = {
  color: "#0f6e56",
  weight: 2,
  fillColor: "#0f6e56",
  fillOpacity: 0.12,
};

export function MapPanel({
  active,
  drawing,
  focus,
  zone,
  places,
  visits,
  selectedId,
  onDraw,
  onSelect,
}: MapPanelProps) {
  const hintRef = useRef<HTMLParagraphElement>(null);
  const visitIds = new Set(visits.map((visit) => visit.id));

  return (
    <div className={drawing ? "map-wrap drawing" : "map-wrap"}>
      <MapContainer center={[-20, -63]} zoom={4} scrollWheelZoom className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyTo focus={focus} />
        <ResizeMap active={active} />
        <DrawLayer drawing={drawing} hintRef={hintRef} onDraw={onDraw} />
        {zone ? <Circle center={[zone.lat, zone.lng]} radius={zone.radius} pathOptions={zoneStyle} /> : null}
        {places
          .filter((place) => !visitIds.has(place.id))
          .map((place) => (
            <PlaceMarker
              key={place.id}
              place={place}
              selected={place.id === selectedId}
              color="#0f6e56"
              onSelect={onSelect}
            />
          ))}
        {visits.map((visit) => (
          <PlaceMarker
            key={visit.id}
            place={visit}
            selected={visit.id === selectedId}
            color={visit.visited ? "#3f5c45" : "#a3521e"}
            onSelect={onSelect}
          />
        ))}
      </MapContainer>
      {drawing ? (
        <p ref={hintRef} className="map-hint">
          Arrastra sobre el mapa para dibujar el círculo.
        </p>
      ) : null}
    </div>
  );
}

function PlaceMarker({
  place,
  selected,
  color,
  onSelect,
}: {
  place: Place;
  selected: boolean;
  color: string;
  onSelect: (id: string) => void;
}) {
  return (
    <CircleMarker
      center={[place.lat, place.lng]}
      radius={selected ? 10 : 7}
      pathOptions={{ color, fillColor: color, fillOpacity: 0.95, weight: 2 }}
      eventHandlers={{ click: () => onSelect(place.id) }}
    >
      <Popup>
        <strong>{place.name}</strong>
        <br />
        {place.shopLabel}
      </Popup>
    </CircleMarker>
  );
}

function FlyTo({ focus }: { focus: MapFocus | null }) {
  const map = useMap();
  const lastKey = useRef("");

  useEffect(() => {
    if (!focus) return;
    const key = `${focus.lat},${focus.lng},${focus.zoom}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) map.setView([focus.lat, focus.lng], focus.zoom);
    else map.flyTo([focus.lat, focus.lng], focus.zoom);
  }, [focus, map]);

  return null;
}

function ResizeMap({ active }: { active: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => map.invalidateSize(), 60);
    return () => window.clearTimeout(timer);
  }, [active, map]);

  return null;
}

function DrawLayer({
  drawing,
  hintRef,
  onDraw,
}: {
  drawing: boolean;
  hintRef: RefObject<HTMLParagraphElement | null>;
  onDraw: (zone: CircleZone) => void;
}) {
  const map = useMap();
  const onDrawRef = useRef(onDraw);
  onDrawRef.current = onDraw;

  useEffect(() => {
    const container = map.getContainer();
    if (!drawing) {
      map.dragging.enable();
      return;
    }

    map.dragging.disable();
    let start: L.LatLng | null = null;
    let preview: L.Circle | null = null;

    const movePreview = (event: PointerEvent) => {
      if (!start) return;
      const current = map.mouseEventToLatLng(event);
      const radius = map.distance(start, current);
      if (!preview) {
        preview = L.circle(start, {
          radius,
          color: "#a3521e",
          weight: 2,
          dashArray: "6 6",
          fillColor: "#a3521e",
          fillOpacity: 0.08,
        }).addTo(map);
      } else {
        preview.setRadius(radius);
      }
      if (hintRef.current) hintRef.current.textContent = `Zona de ${formatRadius(radius)}`;
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      container.setPointerCapture(event.pointerId);
      start = map.mouseEventToLatLng(event);
      movePreview(event);
    };

    const onMove = (event: PointerEvent) => {
      if (!start) return;
      movePreview(event);
    };

    const onUp = (event: PointerEvent) => {
      if (!start) return;
      const current = map.mouseEventToLatLng(event);
      const zone = { lat: start.lat, lng: start.lng, radius: map.distance(start, current) };
      start = null;
      preview?.remove();
      preview = null;
      onDrawRef.current(zone);
    };

    container.addEventListener("pointerdown", onDown, true);
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerup", onUp);
    container.addEventListener("pointercancel", onUp);

    return () => {
      map.dragging.enable();
      preview?.remove();
      container.removeEventListener("pointerdown", onDown, true);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerup", onUp);
      container.removeEventListener("pointercancel", onUp);
    };
  }, [drawing, hintRef, map]);

  return null;
}
