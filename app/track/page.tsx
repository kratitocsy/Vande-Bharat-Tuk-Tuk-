"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LiveMap } from "@/components/LiveMap";
import { PhoneIcon, WhatsAppIcon } from "@/components/Icons";
import { useToast } from "@/components/Providers";
import { PHONE_DISPLAY, PHONE_HREF, formatPhone, whatsappLink } from "@/lib/config";
import { friendlyError, getSupabase } from "@/lib/supabase";

type Track = {
  status: "new" | "confirmed" | "driver_assigned" | "completed" | "cancelled";
  rider_name: string | null;
  rider_phone: string | null;
  lat: number | null;
  lng: number | null;
  updated_at: string | null;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
};

const POLL_MS = 10000;

function ago(iso: string, now: number) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s} seconds ago`;
  const m = Math.round(s / 60);
  return `${m} minute${m === 1 ? "" : "s"} ago`;
}

export default function TrackPage() {
  const { show } = useToast();
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [data, setData] = useState<Track | null>(null);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(
    async (c: string, p: string, quiet = false) => {
      if (!quiet) setBusy(true);
      const { data: rows, error } = await getSupabase().rpc("track_ride", { p_code: c, p_phone: p });
      setBusy(false);
      setNow(Date.now());
      if (error) {
        if (!quiet) show(friendlyError(error));
        return false;
      }
      const row = Array.isArray(rows) ? (rows[0] as Track | undefined) : undefined;
      if (!row) {
        if (!quiet) show("We could not find that request. Check the code and phone number.");
        setData(null);
        return false;
      }
      setData(row);
      return true;
    },
    [show],
  );

  // Read ?code= and the phone saved when the request was sent.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = (params.get("code") ?? "").toUpperCase();
    let p = "";
    try {
      p = window.sessionStorage.getItem("indo-ride-phone") ?? "";
    } catch {
      // ignore
    }
    setCode(c);
    setPhone(p);
    if (c && p) {
      load(c, p).then((ok) => ok && setActive(true));
    }
  }, [load]);

  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (!active) return;
    timer.current = setInterval(() => load(code, phone, true), POLL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [active, code, phone, load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length < 4) return show("Enter your request code, like KJ-AB12CD");
    if (phone.replace(/\D/g, "").length < 10) return show("Enter the phone number you used");
    const ok = await load(code.trim(), phone);
    setActive(ok);
  }

  const sharing = data && data.lat !== null && data.lng !== null;
  const statusText =
    data?.status === "new"
      ? "Waiting for a rider to accept"
      : data?.status === "driver_assigned"
        ? sharing
          ? "Your rider is on the way"
          : "A rider accepted your request"
        : data?.status === "completed"
          ? "Ride completed"
          : data?.status === "cancelled"
            ? "Request cancelled"
            : "Request received";

  return (
    <>
      <Header />
      <main id="main" className="min-h-[70vh] py-10 sm:py-14">
        <div className="container-x max-w-[760px]">
          <p className="eyebrow">Track your rider</p>
          <h1 className="mb-6 mt-3 text-3xl font-bold sm:text-4xl">Where is my rider?</h1>

          <form onSubmit={submit} noValidate className="card mb-6 grid gap-3.5 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="grid gap-1">
              <label htmlFor="code" className="label">Request code</label>
              <input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="KJ-AB12CD" className="input" autoComplete="off" />
            </div>
            <div className="grid gap-1">
              <label htmlFor="phone" className="label">Your phone number</label>
              <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" placeholder="98765 43210" className="input" />
            </div>
            <button type="submit" disabled={busy} className="btn btn-dark py-3">{busy ? "Checking…" : "Track"}</button>
          </form>

          {data && (
            <div className="grid gap-4">
              <div className="card p-5 sm:p-6">
                <span className="label">Status</span>
                <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">{statusText}</h2>

                {data.status === "driver_assigned" && data.rider_name && data.rider_phone && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-cream px-4 py-3">
                    <div>
                      <strong className="block">{data.rider_name}</strong>
                      <span className="font-display text-lg font-bold tracking-tight">{formatPhone(data.rider_phone)}</span>
                    </div>
                    <div className="flex gap-2">
                      <a href={`tel:${data.rider_phone}`} className="btn btn-dark btn-sm"><PhoneIcon className="h-4 w-4" /> Call</a>
                      <a
                        href={whatsappLink(data.rider_phone, `Hi ${data.rider_name}, I'm waiting for my ride (request ${code}). Where are you now?`)}
                        target="_blank"
                        rel="noopener"
                        className="btn btn-outline btn-sm"
                      >
                        <WhatsAppIcon className="h-4 w-4 text-[#1a9e55]" /> WhatsApp
                      </a>
                    </div>
                  </div>
                )}

                {data.status === "driver_assigned" && (
                  <p className="mt-3 text-[0.9rem] text-ink-soft">
                    {sharing && data.updated_at
                      ? `Rider location updated ${ago(data.updated_at, now)}.`
                      : "Your rider has not shared a live location yet. Call them to ask where they are."}
                  </p>
                )}
                {data.status === "new" && (
                  <p className="mt-3 text-[0.9rem] text-ink-soft">
                    Keep this page open. When a rider accepts, they will appear here. You can also call Mahi on{" "}
                    <a href={PHONE_HREF} className="font-semibold text-green">{PHONE_DISPLAY}</a>.
                  </p>
                )}
                {sharing && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lng}`}
                    target="_blank"
                    rel="noopener"
                    className="mt-3 inline-block text-sm font-semibold text-green underline underline-offset-4"
                  >
                    Open rider location in Google Maps
                  </a>
                )}
              </div>

              <LiveMap
                pickup={{ lat: data.pickup_lat, lng: data.pickup_lng }}
                dropoff={data.dropoff_lat !== null && data.dropoff_lng !== null ? { lat: data.dropoff_lat, lng: data.dropoff_lng } : null}
                rider={sharing ? { lat: data.lat as number, lng: data.lng as number } : null}
              />
            </div>
          )}

          <p className="mt-8 text-center text-sm text-muted">
            <Link href="/" className="underline underline-offset-4">Back to the website</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
