import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const alt = "Indo Tuk Tuk: auto rickshaw rides in Khajuraho";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  // The hero art is a webp, so convert via a data URL read from disk.
  const file = await readFile(path.join(process.cwd(), "public/images/khajuraho-hero.webp"));
  const src = `data:image/webp;base64,${file.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#fbf8f1", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 64px", width: 620 }}>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, letterSpacing: 5, color: "#0b5c4a", textTransform: "uppercase" }}>
            Khajuraho
          </div>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 800, color: "#0d1512", lineHeight: 1.02, marginTop: 18 }}>
            Indo Tuk Tuk
          </div>
          <div style={{ display: "flex", fontSize: 32, color: "#4b5a53", marginTop: 22, lineHeight: 1.3 }}>
            Tuk tuk rides, temple tours and day trips. Call Mahi: 98934 13847
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={580} height={630} style={{ objectFit: "cover", width: 580, height: 630 }} alt="" />
      </div>
    ),
    { ...size },
  );
}
