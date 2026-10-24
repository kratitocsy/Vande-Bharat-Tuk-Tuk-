"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadMappls, safe, type Mappls } from "@/lib/mappls";
import { KHAJURAHO_CENTER, PIN_NAME, PIN_SLUG, PLACES, inRegion, placePoint, type Point } from "@/lib/places";
import { useToast } from "./Providers";

type Mode = "pickup" | "dropoff";

type Props = {
  pickup: Point | null;
  dropoff: Point | null;
  needsDropoff: boolean;
  mode: Mode;
  onMode: (m: Mode) => void;
  onPick: (mode: Mode, point: Point) => void;
  routeCoords?: [number, number][] | null; // [lat, lng] pairs
};

let counter = 0;

// SDK differences are hidden behind these small helpers, so a missing method never breaks the page.
function removeLayer(mappls: Mappls, map: Mappls, layer: Mappls) {
  if (!layer) return;
  safe(() => {
    if (typeof layer.remove === "function") layer.remove();
    else mappls.remove?.({ map, layer });
  });
}

function eventPoint(e: Mappls): { lat: number; lng: number } | null {
  const ll = e?.lngLat ?? e?.latlng ?? e?.latLng ?? e?.lnglat;
  if (!ll) return null;
  const lat = Number(ll.lat ?? ll[1]);
  const lng = Number(ll.lng ?? ll.lon ?? ll[0]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function listen(target: Mappls, event: string, cb: (e: Mappls) => void) {
  safe(() => {
    if (typeof target.addListener === "function") target.addListener(event, cb);
    else if (typeof target.on === "function") target.on(event, cb);
  });
}

export function MapPicker({ pickup, dropoff, needsDropoff, mode, onMode, onPick, routeCoords }: Props) {
  const { show } = useToast();
  const [id] = useState(() => `mappls-map-${++counter}`);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);

  const mapRef = useRef<Mappls>(null);
  const sdkRef = useRef<Mappls>(null);
  const placeMarkers = useRef<Mappls[]>([]);
  const pickupMarker = useRef<Mappls>(null);
  const dropMarker = useRef<Mappls>(null);
  const line = useRef<Mappls>(null);
  const modeRef = useRef(mode);
  const onPickRef = useRef(onPick);
  const lastMarkerClick = useRef(0);

  useEffect(() => {
    modeRef.current = mode;
    onPickRef.current = onPick;
  }, [mode, onPick]);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    loadMappls()
      .then((mappls) => {
        if (cancelled) return;
        sdkRef.current = mappls;
        const map = new mappls.Map(id, {
          center: [KHAJURAHO_CENTER.lat, KHAJURAHO_CENTER.lng],
          zoom: 14,
          zoomControl: true,
          location: false,
        });
        mapRef.current = map;

        const ready = () => {
          if (cancelled || sdkRef.current === null) return;
          setStatus("ready");
        };
        listen(map, "load", ready);
        window.setTimeout(ready, 2500); // some SDK versions fire "load" before we listen

        // Known places as small yellow dots.
        PLACES.forEach((p) => {
          safe(() => {
            const marker = new mappls.Marker({
              map,
              position: { lat: p.lat, lng: p.lng },
              icon_url: "/images/pin-place.svg",
              width: 18,
              height: 18,
              fitbounds: false,
              popupHtml: p.name,
            });
            listen(marker, "click", () => {
              lastMarkerClick.current = Date.now();
              const point = placePoint(p.slug);
              if (point) onPickRef.current(modeRef.current, point);
            });
            placeMarkers.current.push(marker);
          });
        });

        // Tap anywhere else to drop a pin.
        listen(map, "click", (e) => {
          if (Date.now() - lastMarkerClick.current < 400) return;
          const pt = eventPoint(e);
          if (!pt) return;
          if (!inRegion(pt.lat, pt.lng)) {
            show("Please pick a spot in the Khajuraho area");
            return;
          }
          onPickRef.current(modeRef.current, { slug: PIN_SLUG, name: PIN_NAME, lat: pt.lat, lng: pt.lng, pinned: true });
        });
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });
    return () => {
      cancelled = true;
      sdkRef.current = null;
    };
  }, [id, show]);

  // Keep the pickup and drop-off pins in step with the form.
  useEffect(() => {
    const mappls = sdkRef.current;
    const map = mapRef.current;
    if (!mappls || !map || status !== "ready") return;

    const draw = (point: Point | null, ref: { current: Mappls }, icon: string, label: string) => {
      removeLayer(mappls, map, ref.current);
      ref.current = null;
      if (!point) return;
      safe(() => {
        ref.current = new mappls.Marker({
          map,
          position: { lat: point.lat, lng: point.lng },
          icon_url: icon,
          width: 32,
          height: 42,
          fitbounds: false,
          popupHtml: `${label}: ${point.name}`,
        });
      });
    };
    draw(pickup, pickupMarker, "/images/pin-pickup.svg", "Pickup");
    draw(needsDropoff ? dropoff : null, dropMarker, "/images/pin-drop.svg", "Drop-off");

    removeLayer(mappls, map, line.current);
    line.current = null;
    const both = pickup && dropoff && needsDropoff;
    if (both) {
      const path = (routeCoords && routeCoords.length > 1 ? routeCoords : [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]).map(
        ([lat, lng]) => ({ lat, lng }),
      );
      safe(() => {
        line.current = new mappls.Polyline({ map, path, strokeColor: "#0b5c4a", strokeOpacity: 1, strokeWidth: 5, fitbounds: false });
      });
      safe(() => {
        const lats = [pickup.lat, dropoff.lat];
        const lngs = [pickup.lng, dropoff.lng];
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: 70, maxZoom: 16 },
        );
      });
    } else {
      const focus = pickup ?? dropoff;
      if (focus) {
        safe(() => {
          if (typeof map.flyTo === "function") map.flyTo({ center: [focus.lng, focus.lat], zoom: 15 });
          else map.setCenter({ lat: focus.lat, lng: focus.lng });
        });
      }
    }
  }, [pickup, dropoff, needsDropoff, routeCoords, status]);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) return show("Your browser can't share your location");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (!inRegion(lat, lng)) {
          show("You seem to be outside Khajuraho. Tap the map to choose a spot.");
          return;
        }
        onPick("pickup", { slug: PIN_SLUG, name: "My location", lat, lng, pinned: true });
        onMode("pickup");
      },
      () => show("We could not get your location. You can tap the map instead."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, [onMode, onPick, show]);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (q.length < 3) return show("Type at least 3 letters to search");
    setSearching(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Search failed");
      onPick(modeRef.current, { slug: PIN_SLUG, name: data.label || q, lat: data.lat, lng: data.lng, pinned: true });
    } catch (error) {
      show(error instanceof Error ? error.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  if (status === "failed") {
    return (
      <div className="mt-2.5 rounded-2xl border border-line bg-cream p-4 text-[0.86rem] leading-relaxed text-ink-soft">
        The map could not load right now. You can still choose places from the lists above.
      </div>
    );
  }

  const chip = (m: Mode, label: string) => (
    <button
      key={m}
      type="button"
      onClick={() => onMode(m)}
      aria-pressed={mode === m}
      className={`rounded-full border px-3.5 py-2 text-[0.8rem] font-semibold transition ${
        mode === m ? "border-ink bg-ink text-cream" : "border-line bg-paper text-ink-soft hover:border-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mt-2.5 rounded-2xl border border-line bg-cream p-2.5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="label mr-1">Setting</span>
        {chip("pickup", "Pickup")}
        {needsDropoff && chip("dropoff", "Drop-off")}
        <button type="button" onClick={useMyLocation} className="ml-auto rounded-full border border-line bg-paper px-3.5 py-2 text-[0.8rem] font-semibold text-green transition hover:border-green">
          Use my location
        </button>
      </div>
      <form onSubmit={runSearch} className="mb-2 flex gap-2">
        <label htmlFor={`${id}-search`} className="sr-only">
          Search a place in Khajuraho
        </label>
        <input
          id={`${id}-search`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a hotel or place"
          className="input"
          autoComplete="off"
        />
        <button type="submit" disabled={searching} className="btn btn-dark btn-sm shrink-0">
          {searching ? "…" : "Search"}
        </button>
      </form>
      <div className="relative overflow-hidden rounded-xl bg-[#e9efe6]">
        <div id={id} className="h-[300px] w-full" />
        {status === "loading" && <div className="absolute inset-0 grid place-items-center text-sm text-ink-soft">Loading map…</div>}
      </div>
      <p className="mt-2 text-[0.74rem] leading-relaxed text-muted">
        Tap a yellow dot for a known place, or tap anywhere to drop a pin. Selecting {mode === "pickup" ? "pickup" : "drop-off"} now.
      </p>
    </div>
  );
}
