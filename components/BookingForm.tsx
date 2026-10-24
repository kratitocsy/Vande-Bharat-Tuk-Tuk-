"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowIcon, CheckIcon, ClockIcon, PhoneIcon, PinIcon, SwapIcon, WhatsAppIcon } from "./Icons";
import { useBooking, useToast } from "./Providers";
import { useHero } from "./HeroShell";
import { PlaceInput, type Choice, type PlaceInputHandle } from "./PlaceInput";
import { RideMap, type MapApi } from "./RideMap";
import { PIN_SLUG, TRIP_NAMES, inRegion, placePoint, type Point } from "@/lib/places";
import { PHONE_DISPLAY, PHONE_E164, PHONE_HREF, formatPhone, whatsappLink } from "@/lib/config";
import { friendlyError, getSupabase } from "@/lib/supabase";

type Rider = { name: string; phone: string; vehicle_number: string | null };
type RouteInfo = { source: "road" | "estimate"; distanceKm: number; durationMin: number; coordinates?: [number, number][] };
type Done = { code: string; phone: string; route: string; name: string; budget: number | null; riders: Rider[] };
type Target = "pickup" | "dropoff";

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
  const hero = useHero();
  const inHero = Boolean(hero.slot);

  const [trip, setTrip] = useState(initialTrip);
  const [pickup, setPickup] = useState<Point | null>(null);
  const [dropoff, setDropoff] = useState<Point | null>(() => (initialDropoff ? placePoint(initialDropoff) : null));
  const [target, setTarget] = useState<Target>("pickup");
  const [later, setLater] = useState(false);
  const [time, setTime] = useState("");
  const [step, setStep] = useState<"form" | "details" | "done">("form");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [mapWanted, setMapWanted] = useState(false); // used when the page has no hero to hold the map
  const [mapFailed, setMapFailed] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [riders, setRiders] = useState("2");
  const [budget, setBudget] = useState("");
  const [note, setNote] = useState("");

  const needsDropoff = trip === "city-ride";
  const mapActive = inHero ? hero.active && !mapFailed : mapWanted && !mapFailed;

  const lastNonce = useRef<number | null>(null);
  const pickupInput = useRef<PlaceInputHandle>(null);
  const dropoffInput = useRef<PlaceInputHandle>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const budgetRef = useRef<HTMLInputElement>(null);
  const mapApi = useRef<MapApi | null>(null);

  const wakeMap = useCallback(() => {
    if (mapFailed) return;
    if (inHero) hero.setActive(true);
    else setMapWanted(true);
  }, [hero, inHero, mapFailed]);

  const resetSteps = () => setStep("form");

  function onMapStatus(s: "loading" | "ready" | "failed") {
    if (s === "failed") {
      setMapFailed(true);
      if (inHero) hero.setActive(false); // bring the picture back
    }
  }

  // Ride cards and chips fill the form through the shared booking intent.
  useEffect(() => {
    if (!intent || lastNonce.current === intent.nonce) return;
    lastNonce.current = intent.nonce;
    setTrip(intent.trip);
    setStep("form");
    if (intent.dropoff) {
      setPickup(placePoint("khajuraho-town"));
      setDropoff(placePoint(intent.dropoff));
    } else if (intent.trip === "city-ride") {
      setDropoff(null);
    }
    if (intent.trip !== "city-ride" || !intent.dropoff) {
      window.setTimeout(() => pickupInput.current?.focus(), 450);
    }
  }, [intent]);

  // Road distance and time once both ends are known.
  const fromKey = pickup ? `${pickup.lat},${pickup.lng}` : "";
  const toKey = dropoff ? `${dropoff.lat},${dropoff.lng}` : "";
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

  function setPoint(which: Target, point: Point | null) {
    if (which === "pickup") setPickup(point);
    else setDropoff(point);
    resetSteps();
  }

  function sameAsOther(which: Target, point: Point) {
    const other = which === "pickup" ? dropoff : pickup;
    return Boolean(needsDropoff && other && !point.pinned && !other.pinned && other.slug === point.slug);
  }

  // A tap on the map, or a place chosen from the list.
  function pickPoint(which: Target, point: Point) {
    if (sameAsOther(which, point)) {
      show("Pickup and drop-off can't be the same place");
      return;
    }
    setPoint(which, point);
    if (which === "pickup" && needsDropoff && !dropoff) {
      setTarget("dropoff");
      window.setTimeout(() => dropoffInput.current?.focus(), 150);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return show("This browser can't share your location");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (!inRegion(lat, lng)) return show("You seem to be outside Khajuraho. Type a place or tap the map.");
        pickPoint("pickup", { slug: PIN_SLUG, name: "My location", lat, lng, pinned: true });
      },
      () => show("We could not get your location. Type a place or tap the map."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }

  async function choose(which: Target, choice: Choice) {
    if (choice.type === "place") return pickPoint(which, choice.point);
    if (choice.type === "myloc") return useMyLocation();

    // A suggestion from the map search: ask the map where it is.
    wakeMap();
    const label = choice.address ? `${choice.name}, ${choice.address}` : choice.name;
    let position: { lat: number; lng: number } | null = null;
    for (let i = 0; i < 40 && !mapApi.current?.ready; i++) {
      if (mapFailed) break;
      await new Promise((r) => window.setTimeout(r, 150)); // the map may still be loading
    }
    if (mapApi.current?.ready) position = await mapApi.current.locate(choice.eLoc, choice.name);

    if (position) {
      pickPoint(which, { slug: PIN_SLUG, name: choice.name, lat: position.lat, lng: position.lng, pinned: true });
    } else if (which === "pickup") {
      // Still useful: the rider reads the place in the pickup details.
      setPoint("pickup", placePoint("khajuraho-town"));
      setNote((prev) => (prev.trim() ? prev : label.slice(0, 200)));
      show("We added that to your pickup details. A rider will confirm where to meet you.");
    } else {
      show("We could not place that on the map. Tap the map to drop a pin for the drop-off.");
      setTarget("dropoff");
    }
  }

  const routeText = needsDropoff
    ? `${pickup?.name ?? ""} → ${dropoff?.name ?? ""}`
    : `${TRIP_NAMES[trip] ?? "Tour"} from ${pickup?.name ?? ""}`;

  const scheduledAt = later && time ? `${time}:00+05:30` : null; // Khajuraho is on India time

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
    setPickup(dropoff);
    setDropoff(a);
    resetSteps();
  }

  function findRiders(e: React.FormEvent) {
    e.preventDefault();
    if (!pickup) {
      show("Choose where we should pick you up");
      pickupInput.current?.focus();
      return;
    }
    if (needsDropoff && !dropoff) {
      show("Choose where you are going");
      dropoffInput.current?.focus();
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
    if (!pickup || (needsDropoff && !dropoff)) return resetSteps();
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
    const drop = needsDropoff ? dropoff : null;
    const { data, error } = await supabase.rpc("request_ride_v2", {
      p_trip: trip,
      p_pickup: pickup.slug,
      p_dropoff: drop?.slug ?? null,
      p_pickup_lat: pickup.pinned ? pickup.lat : null,
      p_pickup_lng: pickup.pinned ? pickup.lng : null,
      p_dropoff_lat: drop?.pinned ? drop.lat : null,
      p_dropoff_lng: drop?.pinned ? drop.lng : null,
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
    setDone({ code: row.booking_code, phone: row.rider_phone, route: routeText, name: name.trim(), budget: budgetValue, riders: available });
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
      pickupInput.current?.focus();
      return;
    }
    setTrip("city-ride");
    setStep("form");
    const from = !pickup || pickup.slug === q.drop ? placePoint("khajuraho-town") : pickup;
    setPickup(from);
    setDropoff(placePoint(q.drop!));
    wakeMap();
  }

  const mapNode = (
    <RideMap
      active={mapActive}
      layout={inHero ? "background" : "inline"}
      pickup={pickup}
      dropoff={dropoff}
      needsDropoff={needsDropoff}
      target={needsDropoff ? target : "pickup"}
      onPick={pickPoint}
      routeCoords={routeInfo?.coordinates ?? null}
      apiRef={mapApi}
      onStatus={onMapStatus}
    />
  );

  return (
    <div>
      {inHero && hero.slot ? createPortal(mapNode, hero.slot) : null}

      <form
        id={id("ride-form")}
        onSubmit={findRiders}
        noValidate
        className="w-full max-w-[470px]"
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

        <button
          type="button"
          onClick={toggleLater}
          aria-expanded={later}
          className="mb-4 inline-flex h-12 items-center gap-2.5 rounded-full bg-[#f3f3f3] px-5 text-base font-semibold transition hover:bg-[#e8e8e8]"
        >
          <ClockIcon className="h-5 w-5" />
          <span>{later ? "Pickup later" : "Pickup now"}</span>
        </button>

        <div className={`relative grid gap-2.5 ${needsDropoff ? "before:pointer-events-none before:absolute before:z-[2] before:bottom-7 before:left-[20px] before:top-7 before:w-0.5 before:bg-ink" : ""}`}>
          <PlaceInput
            id={id("pickup")}
            ref={pickupInput}
            label="Pickup"
            marker="pickup"
            placeholder="Where should we pick you up?"
            point={pickup}
            excludeSlug={needsDropoff && dropoff && !dropoff.pinned ? dropoff.slug : undefined}
            allowMyLocation
            onFocusField={() => {
              setTarget("pickup");
              wakeMap();
            }}
            onClear={() => setPoint("pickup", null)}
            onChoose={(c) => choose("pickup", c)}
            trailing={
              needsDropoff ? (
                <button
                  type="button"
                  onClick={swap}
                  aria-label="Swap pickup and drop-off"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-cream transition hover:rotate-180 hover:bg-sun"
                >
                  <SwapIcon className="h-[17px] w-[17px]" />
                </button>
              ) : undefined
            }
          />
          {needsDropoff && (
            <PlaceInput
              id={id("dropoff")}
              ref={dropoffInput}
              label="Drop-off"
              marker="dropoff"
              placeholder="Where to?"
              point={dropoff}
              excludeSlug={pickup && !pickup.pinned ? pickup.slug : undefined}
              onFocusField={() => {
                setTarget("dropoff");
                wakeMap();
              }}
              onClear={() => setPoint("dropoff", null)}
              onChoose={(c) => choose("dropoff", c)}
            />
          )}

          {later && (
            <div className="grid gap-1.5 rounded-lg bg-[#f3f3f3] px-4 pb-3 pt-3.5">
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

        {(routeInfo || mapFailed) && (
          <div className="pt-3 text-[0.8rem] text-ink-soft">
            {routeInfo && needsDropoff && (
              <p>
                {routeInfo.source === "road" ? "By road: " : "About "}
                <strong className="text-ink">{routeInfo.distanceKm} km</strong> · about {routeInfo.durationMin} min
                {routeInfo.source === "estimate" ? " (estimate)" : ""}
              </p>
            )}
            {mapFailed && <p className="text-muted">The map could not load. You can still type places and send your request.</p>}
          </div>
        )}

        {step === "form" && (
          <button type="submit" className="mt-4 inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-ink px-8 text-base font-semibold text-white transition hover:bg-black active:scale-[0.99] max-sm:w-full">
            Find riders <ArrowIcon className="h-4 w-4" />
          </button>
        )}

        {step === "details" && (
          <div className="mt-2.5 border-t border-dashed border-line px-3 pb-2 pt-4">
            <div className="mb-3.5 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <span className="label block">Your ride</span>
                <strong className="font-display text-[1.05rem] leading-snug tracking-tight">{routeText}</strong>
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
                <Link href="/#reviews" className="btn btn-outline btn-sm">Rate your ride</Link>
              </div>
            </div>
          </div>
        )}
      </form>

      {!inHero && mapActive && mapNode}

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
          <Link href="/#reviews" className="font-semibold text-green underline decoration-green/40 underline-offset-4">
            Rate your ride
          </Link>
        </p>
      )}
    </div>
  );
}
