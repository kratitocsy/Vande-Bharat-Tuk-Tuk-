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
    const url = `https://search.mappls.com/search/address/geocode?address=${encodeURIComponent(query)}&access_token=${encodeURIComponent(key)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), cache: "no-store" });
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 160);
      console.warn("[geocode] upstream", res.status, detail.replaceAll(key, "***"));
      return NextResponse.json({ error: "Search is unavailable right now" }, { status: 502 });
    }
    const raw = await res.json();
    if (new URL(request.url).searchParams.get("debug") === "1") return NextResponse.json({ shape: JSON.stringify(raw).slice(0, 900) });
    const hit = pick(raw);
    if (!hit) console.warn("[geocode] no usable result", JSON.stringify(raw).slice(0, 300));
    if (!hit) return NextResponse.json({ error: "We could not find that place near Khajuraho" }, { status: 404 });
    return NextResponse.json(hit);
  } catch (error) {
    console.warn("[geocode] failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Search is unavailable right now" }, { status: 502 });
  }
}
