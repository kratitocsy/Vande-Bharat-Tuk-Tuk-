import { NextResponse } from "next/server";

// TEMPORARY: finds which Mappls place-search styles accept our key. Status and short redacted text only.
export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.MAPPLS_CLOUD_KEY ?? "";
  const redact = (s: string) => s.replaceAll(key || "\u0000", "***").slice(0, 420);
  const q = encodeURIComponent("Western Group of Temples");
  const loc = "24.853,79.929";
  const tests = [
    `https://search.mappls.com/search/places/autosuggest/json?query=${q}&location=${loc}&access_token=${key}`,
    `https://search.mappls.com/search/places/textsearch/json?query=${q}&location=${loc}&access_token=${key}`,
    `https://search.mappls.com/search/places/nearby/json?keywords=temple&refLocation=${loc}&radius=3000&access_token=${key}`,
    `https://explore.mappls.com/apis/O2O/entity/9Q2QMP?access_token=${key}`,
    `https://search.mappls.com/search/address/rev-geocode?lat=24.8520&lng=79.9218&access_token=${key}`,
  ];
  const results = await Promise.all(
    tests.map(async (url) => {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(7000), cache: "no-store" });
        return { path: redact(new URL(url).pathname), status: res.status, body: redact(await res.text()) };
      } catch (error) {
        return { path: redact(new URL(url).pathname), status: 0, body: redact(error instanceof Error ? error.message : "error") };
      }
    }),
  );
  return NextResponse.json({ results });
}
