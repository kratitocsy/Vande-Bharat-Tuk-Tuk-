import { NextResponse } from "next/server";
import { inRegion } from "@/lib/places";

// Turns a typed address ("Hotel Chandela") into a point on the map.
export const dynamic = "force-dynamic";

type Hit = { lat: number; lng: number; label: string };

function pick(data: unknown): Hit | null {
  // The geocoder answers with either one result or a list; read both shapes carefully.
  const d = data as { copResults?: unknown; results?: unknown };
  const list = [d?.copResults, ...(Array.isArray(d?.results) ? (d.results as unknown[]) : [d?.results])].flat();
  for (const item of list) {
    const r = item as Record<string, unknown> | undefined;
    if (!r) continue;
    const lat = Number(r.latitude ?? r.lat);
    const lng = Number(r.longitude ?? r.lng ?? r.lon);
    if (Number.isFinite(lat) && Number.isFinite(lng) && inRegion(lat, lng)) {
      const label = String(r.formattedAddress ?? r.placeName ?? r.address ?? "Pinned location").slice(0, 120);
      return { lat, lng, label };
    }
  }
  return null;
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 120);
  if (!q || q.length < 3) return NextResponse.json({ error: "Type at least 3 letters" }, { status: 400 });

  const key = process.env.MAPPLS_CLOUD_KEY;
  if (!key) return NextResponse.json({ error: "Search is not set up yet" }, { status: 503 });

  try {
    const query = /khajuraho/i.test(q) ? q : `${q}, Khajuraho, Madhya Pradesh`;
    const url = `https://apis.mappls.com/advancedmaps/v1/${encodeURIComponent(key)}/geo_code?addr=${encodeURIComponent(query)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), cache: "no-store" });
    if (!res.ok) return NextResponse.json({ error: "Search is unavailable right now" }, { status: 502 });
    const hit = pick(await res.json());
    if (!hit) return NextResponse.json({ error: "We could not find that place near Khajuraho" }, { status: 404 });
    return NextResponse.json(hit);
  } catch {
    return NextResponse.json({ error: "Search is unavailable right now" }, { status: 502 });
  }
}
