"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { loadMappls, safe, type Mappls } from "@/lib/mappls";
import { KHAJURAHO_CENTER, PIN_NAME, PIN_SLUG, PLACES, inRegion, placePoint, type Point } from "@/lib/places";
import { useToast } from "./Providers";

export type LatLng = { lat: number; lng: number };
export type MapApi = { ready: boolean; locate: (eLoc: string, label: string) => Promise<LatLng | null> };
type Target = "pickup" | "dropoff";

type Props = {
  active: boolean; // the map loads the first time this becomes true
  layout: "background" | "inline";
  pickup: Point | null;
  dropoff: Point | null;
  needsDropoff: boolean;
  target: Target; // which field a tap on the map fills
  onPick: (target: Target, point: Point) => void;
  routeCoords?: [number, number][] | null; // [lat, lng] pairs
  apiRef: MutableRefObject<MapApi | null>;
  onStatus: (s: "loading" | "ready" | "failed") => void;
};

let counter = 0;

function removeLayer(mappls: Mappls, map: Mappls, layer: Mappls) {
  if (!layer) return;
  safe(() => {
    if (typeof layer.remove === "function") layer.remove();
    else mappls.remove?.({ map, layer });
  });
}

function eventPoint(e: Mappls): LatLng | null {
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

export function RideMap({ active, layout, pickup, dropoff, needsDropoff, target, onPick, routeCoords, apiRef, onStatus }: Props) {
  const { show } = useToast();
  const [id] = useState(() => `mappls-ride-${++counter}`);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "failed">("idle");

  const mapRef = useRef<Mappls>(null);
  const sdkRef = useRef<Mappls>(null);
  const pickupMarker = useRef<Mappls>(null);
  const dropMarker = useRef<Mappls>(null);
  const line = useRef<Mappls>(null);
  const targetRef = useRef(target);
  const onPickRef = useRef(onPick);
  const lastMarkerClick = useRef(0);

  useEffect(() => {
    targetRef.current = target;
    onPickRef.current = onPick;
  }, [target, onPick]);

  const setBoth = (s: "idle" | "loading" | "ready" | "failed") => {
    setStatus(s);
    if (s !== "idle") onStatus(s);
  };

  // Load and create the map the first time it is needed.
  useEffect(() => {
    if (!active || status !== "idle") return;
    let cancelled = false;
    setBoth("loading");
    loadMappls()
      .then((mappls) => {
        if (cancelled) return;
        sdkRef.current = mappls;
        // On wide screens the form covers the left half, so start with the town a little to the right.
        const shift = layout === "background" && window.innerWidth >= 1024 ? -0.02 : 0;
        const map = new mappls.Map(id, {
          center: [KHAJURAHO_CENTER.lat, KHAJURAHO_CENTER.lng + shift],
          zoom: 14,
          zoomControl: true,
          location: false,
        });
        mapRef.current = map;

        const ready = () => {
          if (cancelled || !sdkRef.current) return;
          setBoth("ready");
          if (apiRef.current) apiRef.current.ready = true;
        };
        listen(map, "load", ready);
        window.setTimeout(ready, 2500);

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
              if (point) onPickRef.current(targetRef.current, point);
            });
          });
        });

        listen(map, "click", (e) => {
          if (Date.now() - lastMarkerClick.current < 400) return;
          const pt = eventPoint(e);
          if (!pt) return;
          if (!inRegion(pt.lat, pt.lng)) {
            show("Please pick a spot in the Khajuraho area");
            return;
          }
          onPickRef.current(targetRef.current, { slug: PIN_SLUG, name: PIN_NAME, lat: pt.lat, lng: pt.lng, pinned: true });
        });

        apiRef.current = {
          ready: false,
          locate: (eLoc, label) =>
            new Promise((resolve) => {
              if (typeof mappls.pinMarker !== "function") return resolve(null);
              const timer = window.setTimeout(() => resolve(null), 5000);
              safe(() =>
                mappls.pinMarker({ map, pin: eLoc, fitbounds: false, popupHtml: label }, (res: Mappls) => {
                  window.clearTimeout(timer);
                  const marker = Array.isArray(res) ? res[0] : res;
                  let point: LatLng | null = null;
                  safe(() => {
                    const pos = marker?.getPosition?.() ?? marker?.position ?? marker?._lngLat;
                    const lat = Number(pos?.lat ?? pos?.latitude ?? pos?.[1]);
                    const lng = Number(pos?.lng ?? pos?.lon ?? pos?.longitude ?? pos?.[0]);
                    if (Number.isFinite(lat) && Number.isFinite(lng) && inRegion(lat, lng)) point = { lat, lng };
                  });
                  removeLayer(mappls, map, marker);
                  resolve(point);
                }),
              );
            }),
        };
      })
      .catch(() => {
        if (!cancelled) setBoth("failed");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Keep the pickup and drop-off pins and the route line in step with the form.
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
    const wide = layout === "background" && window.innerWidth >= 1024;
    const padding = wide ? { top: 90, bottom: 90, left: Math.round(window.innerWidth * 0.52), right: 60 } : { top: 70, bottom: 70, left: 50, right: 50 };

    if (pickup && dropoff && needsDropoff) {
      const path = (routeCoords && routeCoords.length > 1 ? routeCoords : [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]).map(([lat, lng]) => ({ lat, lng }));
      safe(() => {
        line.current = new mappls.Polyline({ map, path, strokeColor: "#0b5c4a", strokeOpacity: 1, strokeWidth: 5, fitbounds: false });
      });
      safe(() => {
        const lats = [pickup.lat, dropoff.lat];
        const lngs = [pickup.lng, dropoff.lng];
        map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding, maxZoom: 16 });
      });
    } else {
      const focus = pickup ?? dropoff;
      if (focus) {
        safe(() => {
          if (typeof map.flyTo === "function") map.flyTo({ center: [focus.lng - (wide ? 0.012 : 0), focus.lat], zoom: 15 });
          else map.setCenter({ lat: focus.lat, lng: focus.lng });
        });
      }
    }
  }, [pickup, dropoff, needsDropoff, routeCoords, status, layout]);

  if (status === "idle" && layout === "inline") return null;

  return (
    <div className={layout === "background" ? "absolute inset-0" : "relative mt-2.5 overflow-hidden rounded-2xl border border-line bg-[#e9efe6]"}>
      <div id={id} className={layout === "background" ? "h-full w-full" : "h-[300px] w-full"} />
      {status === "loading" && <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-ink-soft">Loading map…</div>}
    </div>
  );
}
