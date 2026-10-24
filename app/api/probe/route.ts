import { NextResponse } from "next/server";

// TEMPORARY: lists the field names Mappls place search returns (names only, no values or keys).
export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.MAPPLS_CLOUD_KEY ?? "";
  const q = encodeURIComponent("Hotel Chandela Khajuraho");
  const loc = "24.853,79.929";
  const urls: Record<string, string> = {
    autosuggest: `https://search.mappls.com/search/places/autosuggest/json?query=${q}&location=${loc}&access_token=${key}`,
    textsearch: `https://search.mappls.com/search/places/textsearch/json?query=${q}&location=${loc}&access_token=${key}`,
    nearby: `https://search.mappls.com/search/places/nearby/json?keywords=hotel&refLocation=${loc}&radius=3000&access_token=${key}`,
  };
  const out: Record<string, unknown> = {};
  for (const [name, url] of Object.entries(urls)) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(7000), cache: "no-store" });
      const data = await res.json();
      const first = data?.suggestedLocations?.[0];
      out[name] = { status: res.status, count: data?.suggestedLocations?.length ?? 0, fields: first ? Object.keys(first) : [], sample: first ? { placeName: first.placeName, latitude: first.latitude, longitude: first.longitude, lat: first.lat, lng: first.lng } : null };
    } catch (error) {
      out[name] = { error: error instanceof Error ? error.message : "error" };
    }
  }
  return NextResponse.json(out);
}
