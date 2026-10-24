"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowIcon, CheckIcon, ClockIcon, PhoneIcon, PinIcon, SwapIcon, WhatsAppIcon } from "./Icons";
import { useBooking, useToast } from "./Providers";
import { PIN_SLUG, PLACES, PLACE_GROUPS, TRIP_NAMES, placeName, placePoint, type Point } from "@/lib/places";
import { MapPicker } from "./MapPicker";
import { PHONE_DISPLAY, PHONE_E164, PHONE_HREF, formatPhone, whatsappLink } from "@/lib/config";
import { friendlyError, getSupabase } from "@/lib/supabase";

type Rider = { name: string; phone: string; vehicle_number: string | null };
type RouteInfo = { source: "road" | "estimate"; distanceKm: number; durationMin: number; coordinates?: [number, number][] };
type Done = { code: string; phone: string; route: string; name: string; budget: number | null; riders: Rider[] };

const FALLBACK_RIDER: Rider = { name: "Mahi", phone: PHONE_E164, vehicle_number: null };

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function localInputValue(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Props = { initialTrip?: string; initialDropoff?: string; showQuickPicks?: boolean; idPrefix?: string };

export function BookingForm({ initialTrip = "city-ride", initialDropoff, showQuickPicks = false, idPrefix = "" }: Props) {
  const { show } = useToast();
  const { intent } = useBooking();

  const [trip, setTrip] = useState(initialTrip);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState(initialDropoff ?? "");
  const [later, setLater] = useState(false);
  const [time, setTime] = useState("");
  const [step, setStep] = useState<"form" | "details" | "done">("form");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [pickupPin, setPickupPin] = useState<Point | null>(null);
  const [dropPin, setDropPin] = useState<Point | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapMode, setMapMode] = useState<"pickup" | "dropoff">("pickup");
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [riders, setRiders] = useState("2");
  const [budget, setBudget] = useState("");
  const [note, setNote] = useState("");

  const needsDropoff = trip === "city-ride";
  const pickupPoint: Point | null = pickup === PIN_SLUG ? pickupPin : pickup ? placePoint(pickup) : null;
  const dropPoint: Point | null = dropoff === PIN_SLUG ? dropPin : dropoff ? placePoint(dropoff) : null;
  const lastNonce = useRef<number | null>(null);
  const pickupRef = useRef<HTMLSelectElement>(null);
  const dropoffRef = useRef<HTMLSelectElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const budgetRef = useRef<HTMLInputElement>(null);

  // Ride cards and chips fill the form through the shared booking intent.
  useEffect(() => {
    if (!intent || lastNonce.current === intent.nonce) return;
    lastNonce.current = intent.nonce;
    setTrip(intent.trip);
    setStep("form");
    if (intent.dropoff) {
      setPickup("khajuraho-town");
      setDropoff(intent.dropoff);
    } else if (intent.trip === "city-ride") {
      setDropoff("");
    }
    if (intent.trip !== "city-ride" || !intent.dropoff) {
      window.setTimeout(() => pickupRef.current?.focus({ preventScroll: true }), 450);
    }
  }, [intent]);

  const dropoffOptions = useMemo(() => PLACES.filter((p) => p.slug !== pickup), [pickup]);
  useEffect(() => {
    if (dropoff && dropoff === pickup && dropoff !== PIN_SLUG) setDropoff("");
  }, [pickup, dropoff]);

  // Road distance and time once both ends are known.
  const fromKey = pickupPoint ? `${pickupPoint.lat},${pickupPoint.lng}` : "";
  const toKey = dropPoint ? `${dropPoint.lat},${dropPoint.lng}` : "";
  useEffect(() => {
    setRouteInfo(null);
    if (!needsDropoff || !fromKey || !toKey || fromKey === toKey) return;
    const controller = new AbortController();
    fetch(`/api/route?from=${fromKey}&to=${toKey}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setRouteInfo(data as RouteInfo))
      .catch(() => {});
    return () => controller.abort();
  }, [needsDropoff, fromKey, toKey]);

  function pickFromMap(mode: "pickup" | "dropoff", point: Point) {
    const other = mode === "pickup" ? dropPoint : pickupPoint;
    if (needsDropoff && other && !point.pinned && other.slug === point.slug) {
      show("Pickup and drop-off can't be the same place");
      return;
    }
    if (mode === "pickup") {
      setPickup(point.slug);
      setPickupPin(point.pinned ? point : null);
      if (needsDropoff && !dropPoint) setMapMode("dropoff");
    } else {
      setDropoff(point.slug);
      setDropPin(point.pinned ? point : null);
    }
    resetSteps();
  }

  const nameOf = (point: Point | null, slug: string) => (slug === PIN_SLUG ? point?.name || "Pinned location" : placeName(slug));
  const route = needsDropoff
    ? `${nameOf(pickupPoint, pickup)} → ${nameOf(dropPoint, dropoff)}`
    : `${TRIP_NAMES[trip] ?? "Tour"} from ${nameOf(pickupPoint, pickup)}`;

  const scheduledAt = later && time ? `${time}:00+05:30` : null; // Khajuraho is on India time

  function resetSteps() {
    setStep("form");
  }

  function toggleLater() {
    const next = !later;
    setLater(next);
    if (next && !time) setTime(localInputValue(new Date(Date.now() + 15 * 60000)));
    if (!next) setTime("");
    resetSteps();
    if (next) window.setTimeout(() => timeRef.current?.focus(), 50);
  }

  function swap() {
    const a = pickup;
    const b = dropoff;
    const pa = pickupPin;
    const pb = dropPin;
    setPickup(b);
    setDropoff(a);
    setPickupPin(pb);
    setDropPin(pa);
    resetSteps();
  }

  function findRiders(e: React.FormEvent) {
    e.preventDefault();
    if (!pickup) {
      show("Choose where we should pick you up");
      pickupRef.current?.focus();
      return;
    }
    if (needsDropoff && !dropoff) {
      show("Choose where you are going");
      dropoffRef.current?.focus();
      return;
    }
    if (later && !time) {
      show("Pick a pickup time, or switch back to Now");
      timeRef.current?.focus();
      return;
    }
    setStep("details");
    window.setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 50);
  }

  async function sendRequest() {
    if (name.trim().length < 2) {
      show("Add your name");
      nameRef.current?.focus();
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      show("Add a phone number a rider can call or WhatsApp");
      phoneRef.current?.focus();
      return;
    }
    const budgetValue = budget.trim() ? Number(budget) : null;
    if (budgetValue !== null && (!(budgetValue >= 10) || budgetValue > 20000)) {
      show("Budget should be between ₹10 and ₹20,000, or leave it empty");
      budgetRef.current?.focus();
      return;
    }

    setBusy(true);
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("request_ride_v2", {
      p_trip: trip,
      p_pickup: pickup,
      p_dropoff: needsDropoff ? dropoff : null,
      p_pickup_lat: pickup === PIN_SLUG ? pickupPin?.lat : null,
      p_pickup_lng: pickup === PIN_SLUG ? pickupPin?.lng : null,
      p_dropoff_lat: needsDropoff && dropoff === PIN_SLUG ? dropPin?.lat : null,
      p_dropoff_lng: needsDropoff && dropoff === PIN_SLUG ? dropPin?.lng : null,
      p_rider_name: name,
      p_rider_phone: phone,
      p_passengers: Number(riders),
      p_scheduled_at: scheduledAt,
      p_pickup_note: note || null,
      p_budget: budgetValue,
    });
    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row) {
      setBusy(false);
      show(friendlyError(error));
      return;
    }
    const list = await supabase.rpc("get_available_riders");
    const available: Rider[] = !list.error && Array.isArray(list.data) && list.data.length ? list.data : [FALLBACK_RIDER];
    try {
      window.sessionStorage.setItem("indo-ride-phone", row.rider_phone);
    } catch {
      // private mode: tracking just asks for the phone number again
    }
    setDone({ code: row.booking_code, phone: row.rider_phone, route, name: name.trim(), budget: budgetValue, riders: available });
    setStep("done");
    setBusy(false);
    window.setTimeout(() => document.getElementById(`${idPrefix}booking-done`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60);
  }

  const id = (s: string) => `${idPrefix}${s}`;
  const quickPicks = [
    { label: "Western\nGroup of Temples", drop: "western-temples", img: "/images/place-western-temples.webp" },
    { label: "Eastern\nGroup of Temples", drop: "eastern-temples", img: "/images/place-eastern-temples.webp" },
    { label: "Javari\nTemple", drop: "javari-temple", img: "/images/place-javari-temple.webp" },
    { label: "Raneh\nFalls", trip: "raneh-falls", img: "/images/place-raneh-falls.webp" },
    { label: "Khajuraho\nAirport", drop: "airport" },
  ];

  function pickQuick(q: (typeof quickPicks)[number]) {
    if (q.trip) {
      setTrip(q.trip);
      setStep("form");
      show(`${TRIP_NAMES[q.trip]}: choose your pickup, then tap Find riders`);
      pickupRef.current?.focus();
      return;
    }
    setTrip("city-ride");
    setStep("form");
    const from = !pickup || pickup === q.drop ? "khajuraho-town" : pickup;
    setPickup(from);
    setDropoff(q.drop!);
  }

  return (
    <div>
      <form
        id={id("ride-form")}
        onSubmit={findRiders}
        noValidate
        className="w-full max-w-[540px] rounded-3xl border border-line bg-paper p-2 shadow-card"
      >
        {!needsDropoff && (
          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-2xl bg-sun-soft px-3.5 py-2.5 text-sm">
            <span>
              Booking <strong>{TRIP_NAMES[trip] ?? "Tour"}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setTrip("city-ride");
                resetSteps();
              }}
              className="text-[0.8rem] font-semibold text-green underline underline-offset-4"
            >
              Switch to a city ride
            </button>
          </div>
        )}

        <div className="overflow-hidden rounded-[17px] border border-line bg-[#fffefa]">
          <div className="relative flex min-h-16 items-center gap-3.5 px-4 pb-2.5 pt-3 pr-14 focus-within:bg-[#fffbea]">
            <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full border-[3px] border-ink" />
            <div className="min-w-0 flex-1">
              <label htmlFor={id("pickup")} className="label block">
                Pickup
              </label>
              <select
                id={id("pickup")}
                ref={pickupRef}
                value={pickup}
                onChange={(e) => {
                  setPickup(e.target.value);
                  if (e.target.value !== PIN_SLUG) setPickupPin(null);
                  resetSteps();
                }}
                className={`mt-0.5 w-full truncate bg-transparent text-[0.97rem] font-medium outline-none ${pickup ? "" : "text-[#8f9993] font-normal"}`}
              >
                <option value="" disabled>
                  Where should we pick you up?
                </option>
                {pickupPin && <option value={PIN_SLUG}>{pickupPin.name === "My location" ? "My location (pin)" : `Pin: ${pickupPin.name}`}</option>}
                {PLACE_GROUPS.map((g) => (
                  <optgroup key={g} label={g}>
                    {PLACES.filter((p) => p.group === g).map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {needsDropoff && (
              <button
                type="button"
                onClick={swap}
                aria-label="Swap pickup and drop-off"
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-cream transition hover:rotate-180 hover:bg-sun"
              >
                <SwapIcon className="h-[17px] w-[17px]" />
              </button>
            )}
          </div>

          {needsDropoff && (
            <div className="relative flex min-h-16 items-center gap-3.5 border-t border-line px-4 pb-2.5 pt-3 pr-14 focus-within:bg-[#fffbea]">
              <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-[2px] border-[3px] border-sun" />
              <div className="min-w-0 flex-1">
                <label htmlFor={id("dropoff")} className="label block">
                  Drop-off
                </label>
                <select
                  id={id("dropoff")}
                  ref={dropoffRef}
                  value={dropoff}
                  onChange={(e) => {
                    setDropoff(e.target.value);
                    if (e.target.value !== PIN_SLUG) setDropPin(null);
                    resetSteps();
                  }}
                  className={`mt-0.5 w-full truncate bg-transparent text-[0.97rem] font-medium outline-none ${dropoff ? "" : "text-[#8f9993] font-normal"}`}
                >
                  <option value="" disabled>
                    Where to?
                  </option>
                  {dropPin && <option value={PIN_SLUG}>{`Pin: ${dropPin.name}`}</option>}
                  {PLACE_GROUPS.map((g) => (
                    <optgroup key={g} label={g}>
                      {dropoffOptions
                        .filter((p) => p.group === g)
                        .map((p) => (
                          <option key={p.slug} value={p.slug}>
                            {p.name}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          )}

          {later && (
            <div className="grid gap-1.5 border-t border-dashed border-line px-4 pb-3 pt-3.5">
              <label htmlFor={id("ride-time")} className="label">
                When should we pick you up? (India time)
              </label>
              <input
                id={id("ride-time")}
                ref={timeRef}
                type="datetime-local"
                value={time}
                min={localInputValue(new Date(Date.now() + 10 * 60000))}
                onChange={(e) => {
                  setTime(e.target.value);
                  resetSteps();
                }}
                className="input"
              />
            </div>
          )}
        </div>

        <div className="px-1.5 pt-2.5">
          <button
            type="button"
            onClick={() => setMapOpen((v) => !v)}
            aria-expanded={mapOpen}
            className="inline-flex items-center gap-2 text-[0.84rem] font-semibold text-green underline decoration-green/40 underline-offset-4"
          >
            <PinIcon className="h-4 w-4" /> {mapOpen ? "Hide map" : "Choose on map"}
          </button>
          {mapOpen && (
            <MapPicker
              pickup={pickupPoint}
              dropoff={dropPoint}
              needsDropoff={needsDropoff}
              mode={needsDropoff ? mapMode : "pickup"}
              onMode={setMapMode}
              onPick={pickFromMap}
              routeCoords={routeInfo?.coordinates ?? null}
            />
          )}
          {routeInfo && needsDropoff && (
            <p className="mt-2 text-[0.8rem] text-ink-soft">
              {routeInfo.source === "road" ? "By road: " : "About "}
              <strong className="text-ink">{routeInfo.distanceKm} km</strong> · about {routeInfo.durationMin} min
              {routeInfo.source === "estimate" ? " (estimate)" : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 px-1.5 pb-0.5 pt-2.5">
          <button
            type="button"
            onClick={toggleLater}
            aria-expanded={later}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-cream px-4 py-3 text-sm font-semibold transition hover:border-[#ecd9a4] hover:bg-sun-soft"
          >
            <ClockIcon className="h-[18px] w-[18px]" />
            <span>{later ? "Later" : "Now"}</span>
          </button>
          {step === "form" && (
            <button type="submit" className="btn btn-dark flex-1 py-3.5">
              Find riders <ArrowIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {step === "details" && (
          <div className="mt-2.5 border-t border-dashed border-line px-3 pb-2 pt-4">
            <div className="mb-3.5 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <span className="label block">Your ride</span>
                <strong className="font-display text-[1.05rem] leading-snug tracking-tight">{route}</strong>
              </div>
              <span className="shrink-0 text-[0.82rem] text-ink-soft">{scheduledAt ? "Later" : "As soon as possible"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[1fr_1fr_auto]">
              <div className="grid min-w-0 gap-1">
                <label htmlFor={id("rider-name")} className="label">Your name</label>
                <input id={id("rider-name")} ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} type="text" autoComplete="name" maxLength={80} className="input" />
              </div>
              <div className="grid min-w-0 gap-1">
                <label htmlFor={id("rider-phone")} className="label">Phone / WhatsApp</label>
                <input id={id("rider-phone")} ref={phoneRef} value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" autoComplete="tel" inputMode="tel" placeholder="98765 43210" maxLength={20} className="input" />
              </div>
              <div className="col-span-2 grid min-w-0 gap-1 sm:col-span-1">
                <label htmlFor={id("passengers")} className="label">People</label>
                <select id={id("passengers")} value={riders} onChange={(e) => setRiders(e.target.value)} className="input sm:min-w-[72px]">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>
              <div className="col-span-2 grid min-w-0 gap-1 sm:col-span-3">
                <label htmlFor={id("budget")} className="label">Your budget in ₹ (optional)</label>
                <input id={id("budget")} ref={budgetRef} value={budget} onChange={(e) => setBudget(e.target.value)} type="number" inputMode="numeric" min={10} max={20000} step={10} placeholder="e.g. 150" className="input" />
              </div>
              <div className="col-span-2 grid min-w-0 gap-1 sm:col-span-3">
                <label htmlFor={id("pickup-note")} className="label">Hotel name or pickup details (optional)</label>
                <input id={id("pickup-note")} value={note} onChange={(e) => setNote(e.target.value)} type="text" maxLength={200} placeholder="e.g. Hotel name, room, flight or train number" className="input" />
              </div>
            </div>
            <button type="button" onClick={sendRequest} disabled={busy} aria-busy={busy} className="btn btn-dark btn-block mt-3.5 py-3.5">
              {busy ? "Sending…" : "Show available riders"}
            </button>
            <p className="mt-2.5 text-center text-[0.76rem] leading-relaxed text-muted">
              A rider will call you to agree the price. Pay cash or UPI to the rider at the end.
            </p>
          </div>
        )}

        {step === "done" && done && (
          <div id={id("booking-done")} role="status" className="mt-2.5 flex items-start gap-3.5 border-t border-dashed border-line px-3 pb-2 pt-4">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-green text-paper">
              <CheckIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <strong className="block">
                Request sent. Your code is <span className="font-display text-green">{done.code}</span>
              </strong>
              <p className="mb-3 mt-1 text-[0.86rem] leading-relaxed text-ink-soft">
                These riders are available. Call or WhatsApp one now, or wait and a rider will call {formatPhone(done.phone)} to agree the price.
              </p>
              <ul className="mb-3 grid gap-2">
                {done.riders.map((r) => {
                  const msg = `Hi, I'm ${done.name}. Request ${done.code}: ${done.route}${done.budget ? `. My budget is ₹${done.budget}` : ""}. Please call me on ${done.phone} to agree the price.`;
                  return (
                    <li key={r.phone} className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-line bg-cream px-3.5 py-3">
                      <div className="min-w-0">
                        <strong className="block text-[0.92rem]">{r.name}</strong>
                        <span className="font-display text-[1.05rem] font-bold tracking-tight">
                          {formatPhone(r.phone)}
                          {r.vehicle_number ? ` · ${r.vehicle_number}` : ""}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <a href={`tel:+${r.phone.replace(/\D/g, "")}`} className="btn btn-dark btn-sm">
                          <PhoneIcon className="h-4 w-4" /> Call
                        </a>
                        <a href={whatsappLink(r.phone, msg)} target="_blank" rel="noopener" className="btn btn-outline btn-sm">
                          <WhatsAppIcon className="h-4 w-4 text-[#1a9e55]" /> WhatsApp
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Link href={`/track?code=${encodeURIComponent(done.code)}`} className="btn btn-sun btn-sm">
                  <PinIcon className="h-4 w-4" /> Track your rider
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setDone(null);
                  }}
                  className="btn btn-outline btn-sm"
                >
                  Request another ride
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {showQuickPicks && (
        <div className="-mx-[18px] mt-4 flex gap-2 overflow-x-auto px-[18px] pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" aria-label="Popular places">
          {quickPicks.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => pickQuick(q)}
              className="flex shrink-0 items-center gap-2 rounded-[14px] border border-line bg-paper py-1.5 pl-1.5 pr-3 text-left text-xs font-semibold leading-tight shadow-[0_10px_24px_-20px_rgb(80_50_0/0.7)] transition hover:-translate-y-0.5 hover:border-green/40 hover:bg-green-soft"
            >
              {q.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={q.img} alt="" width={40} height={40} loading="lazy" className="h-10 w-10 rounded-[10px] object-cover ring-1 ring-black/10" />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#f3efe5]">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-5 w-5">
                    <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z" />
                  </svg>
                </span>
              )}
              <span className="whitespace-pre-line">{q.label}</span>
            </button>
          ))}
        </div>
      )}

      {showQuickPicks && (
        <p className="mt-5 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
          <span className="flex">
            {["RK", "SP", "MY"].map((t, i) => (
              <span
                key={t}
                aria-hidden
                className={`grid h-[30px] w-[30px] place-items-center rounded-full border-2 border-cream text-[0.62rem] font-bold ${i ? "-ml-2" : ""} ${
                  ["bg-[#d9ecdf] text-[#14563f]", "bg-[#ffe4bd] text-[#8a5100]", "bg-[#ffd9d0] text-[#8d2f19]"][i]
                }`}
              >
                {t}
              </span>
            ))}
          </span>
          <span>
            <strong className="text-ink">Book directly:</strong> call Mahi on{" "}
            <a href={PHONE_HREF} className="font-bold text-green underline decoration-green/40 underline-offset-4">
              {PHONE_DISPLAY}
            </a>
          </span>
        </p>
      )}
    </div>
  );
}
