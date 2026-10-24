import { NextResponse } from "next/server";

// TEMPORARY: checks which Mappls address styles accept our keys. Reports status codes only,
// with every key removed from the text. Deleted once the right style is found.
export const dynamic = "force-dynamic";

export async function GET() {
  const cloud = process.env.MAPPLS_CLOUD_KEY ?? "";
  const web = process.env.NEXT_PUBLIC_MAPPLS_MAP_KEY ?? "";
  const redact = (s: string) => s.replaceAll(cloud || "\u0000", "***").replaceAll(web || "\u0000", "***").slice(0, 140);

  const addr = encodeURIComponent("Western Group of Temples, Khajuraho");
  const tests: { name: string; url: string; headers?: Record<string, string> }[] = [
    { name: "atlas geocode ?access_token (cloud)", url: `https://atlas.mappls.com/api/places/geocode?address=${addr}&access_token=${cloud}` },
    { name: "search geocode ?access_token (cloud)", url: `https://search.mappls.com/search/address/geocode?address=${addr}&access_token=${cloud}` },
    { name: "search geocode bearer (cloud)", url: `https://search.mappls.com/search/address/geocode?address=${addr}`, headers: { Authorization: `Bearer ${cloud}` } },
    { name: "atlas geocode bearer (cloud)", url: `https://atlas.mappls.com/api/places/geocode?address=${addr}`, headers: { Authorization: `Bearer ${cloud}` } },
    { name: "atlas autosuggest bearer (cloud)", url: `https://atlas.mappls.com/api/places/search/json?query=${addr}&location=24.85,79.93`, headers: { Authorization: `Bearer ${cloud}` } },
    { name: "route ?access_token (cloud)", url: `https://route.mappls.com/route/direction/route_adv/driving/79.929,24.853;79.9186,24.8172?access_token=${cloud}&geometries=geojson&overview=full` },
    { name: "route bearer (cloud)", url: `https://route.mappls.com/route/direction/route_adv/driving/79.929,24.853;79.9186,24.8172?geometries=geojson&overview=full`, headers: { Authorization: `Bearer ${cloud}` } },
    { name: "new sdk script (web)", url: `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${web}` },
    { name: "legacy sdk script (web)", url: `https://apis.mappls.com/advancedmaps/api/${web}/map_sdk?layer=vector&v=3.0` },
    { name: "new sdk script (cloud key)", url: `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${cloud}` },
  ];

  const results = await Promise.all(
    tests.map(async (t) => {
      try {
        const res = await fetch(t.url, { headers: t.headers, signal: AbortSignal.timeout(7000), cache: "no-store" });
        const text = await res.text();
        return { name: t.name, status: res.status, type: res.headers.get("content-type")?.slice(0, 40), body: redact(text) };
      } catch (error) {
        return { name: t.name, status: 0, body: redact(error instanceof Error ? error.message : "error") };
      }
    }),
  );
  return NextResponse.json({ hasCloud: Boolean(cloud), hasWeb: Boolean(web), results });
}
