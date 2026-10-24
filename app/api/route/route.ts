import { NextResponse } from "next/server";
import { inRegion } from "@/lib/places";

// Road distance and time between two points. Uses Mappls when its key is set,
// and falls back to a straight-line estimate so the form never breaks.
export const dynamic = "force-dynamic";

function parsePoint(value: string | null) {
  if (!value) return null;
  const [lat, lng] = value.split(",").map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inRegion(lat, lng)) return null;
  return { lat, lng };
}

function straightLineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = parsePoint(searchParams.get("from"));
  const to = parsePoint(searchParams.get("to"));
  if (!from || !to) return NextResponse.json({ error: "Choose points inside the Khajuraho area" }, { status: 400 });

  const key = process.env.MAPPLS_CLOUD_KEY;
  let upstream = key ? "unusable response" : "no key";
  if (key) {
    try {
      const url =
        `https://route.mappls.com/route/direction/route_adv/driving/${from.lng},${from.lat};${to.lng},${to.lat}` +
        `?access_token=${encodeURIComponent(key)}&geometries=geojson&overview=full&steps=false&alternatives=false`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000), cache: "no-store" });
      if (!res.ok) {
        upstream = `${res.status} ${(await res.text().catch(() => "")).slice(0, 160).replaceAll(key, "***")}`;
        console.warn("[route] upstream", upstream);
      }
      if (res.ok) {
        const data = await res.json();
        const route = data?.routes?.[0];
        if (route && Number.isFinite(route.distance) && Number.isFinite(route.duration)) {
          const coords: [number, number][] | undefined = Array.isArray(route.geometry?.coordinates)
            ? route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng])
            : undefined;
          return NextResponse.json({
            source: "road",
            distanceKm: Math.round(route.distance / 100) / 10,
            durationMin: Math.max(1, Math.round(route.duration / 60)),
            coordinates: coords,
          });
        }
      }
    } catch (error) {
      upstream = error instanceof Error ? error.message : "error";
      console.warn("[route] failed", upstream);
    }
  }

  const km = Math.round(straightLineKm(from, to) * 1.3 * 10) / 10;
  return NextResponse.json({
    source: "estimate",
    distanceKm: km,
    durationMin: Math.max(1, Math.round((km / 20) * 60)), // about 20 km/h in town
  });
}
