"use client";

import { useEffect, useRef, useState } from "react";
import { loadMappls, safe, type Mappls } from "@/lib/mappls";
import { KHAJURAHO_CENTER } from "@/lib/places";

type LL = { lat: number; lng: number } | null;
type Props = { pickup: LL; dropoff: LL; rider: LL };

let counter = 0;

export function LiveMap({ pickup, dropoff, rider }: Props) {
  const [id] = useState(() => `mappls-live-${++counter}`);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const sdk = useRef<Mappls>(null);
  const map = useRef<Mappls>(null);
  const layers = useRef<Mappls[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadMappls()
      .then((mappls) => {
        if (cancelled) return;
        sdk.current = mappls;
        map.current = new mappls.Map(id, { center: [KHAJURAHO_CENTER.lat, KHAJURAHO_CENTER.lng], zoom: 14, zoomControl: true, location: false });
        const ready = () => !cancelled && setStatus("ready");
        safe(() => (map.current.addListener ? map.current.addListener("load", ready) : map.current.on("load", ready)));
        window.setTimeout(ready, 2500);
      })
      .catch(() => !cancelled && setStatus("failed"));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const mappls = sdk.current;
    const m = map.current;
    if (!mappls || !m || status !== "ready") return;

    layers.current.forEach((layer) =>
      safe(() => {
        if (typeof layer.remove === "function") layer.remove();
        else mappls.remove?.({ map: m, layer });
      }),
    );
    layers.current = [];

    const add = (point: LL, icon: string, label: string) => {
      if (!point) return;
      safe(() => {
        layers.current.push(
          new mappls.Marker({ map: m, position: { lat: point.lat, lng: point.lng }, icon_url: icon, width: 32, height: 42, fitbounds: false, popupHtml: label }),
        );
      });
    };
    add(pickup, "/images/pin-pickup.svg", "Pickup");
    add(dropoff, "/images/pin-drop.svg", "Drop-off");
    add(rider, "/images/pin-rider.svg", "Your rider");

    const pts = [pickup, dropoff, rider].filter((p): p is { lat: number; lng: number } => Boolean(p));
    safe(() => {
      if (pts.length > 1) {
        const lats = pts.map((p) => p.lat);
        const lngs = pts.map((p) => p.lng);
        m.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 70, maxZoom: 16 });
      } else if (pts[0]) {
        if (typeof m.flyTo === "function") m.flyTo({ center: [pts[0].lng, pts[0].lat], zoom: 15 });
      }
    });
  }, [pickup, dropoff, rider, status]);

  if (status === "failed") {
    return <div className="rounded-2xl border border-line bg-cream p-4 text-sm text-ink-soft">The map could not load right now. The details above still update.</div>;
  }
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-[#e9efe6]">
      <div id={id} className="h-[340px] w-full" />
      {status === "loading" && <div className="absolute inset-0 grid place-items-center text-sm text-ink-soft">Loading map…</div>}
    </div>
  );
}
