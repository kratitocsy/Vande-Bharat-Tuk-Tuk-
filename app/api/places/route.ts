import { NextResponse } from "next/server";
import { KHAJURAHO_CENTER } from "@/lib/places";

// Place suggestions near Khajuraho ("Hotel Chandela" -> a short list). Names only; the browser
// map library turns a chosen suggestion into a point on the map.
export const dynamic = "force-dynamic";

type Suggestion = { name: string; address: string; eLoc: string };

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80);
  if (!q || q.length < 3) return NextResponse.json({ suggestions: [] });

  const key = process.env.MAPPLS_CLOUD_KEY;
  if (!key) return NextResponse.json({ suggestions: [], error: "Search is not set up yet" }, { status: 503 });

  try {
    const url =
      `https://search.mappls.com/search/places/autosuggest/json?query=${encodeURIComponent(q)}` +
      `&location=${KHAJURAHO_CENTER.lat},${KHAJURAHO_CENTER.lng}&region=IND&access_token=${encodeURIComponent(key)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), cache: "no-store" });
    if (!res.ok) return NextResponse.json({ suggestions: [], error: "Search is unavailable right now" }, { status: 502 });
    const data = (await res.json()) as { suggestedLocations?: Record<string, unknown>[] };

    const suggestions: Suggestion[] = (data.suggestedLocations ?? [])
      .filter((s) => typeof s.eLoc === "string" && typeof s.placeName === "string")
      // keep results near Khajuraho (distance is in metres from our centre point)
      .filter((s) => typeof s.distance !== "number" || s.distance <= 60000)
      .slice(0, 6)
      .map((s) => ({
        name: String(s.placeName).slice(0, 80),
        address: String(s.placeAddress ?? "").slice(0, 120),
        eLoc: String(s.eLoc),
      }));
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [], error: "Search is unavailable right now" }, { status: 502 });
  }
}
