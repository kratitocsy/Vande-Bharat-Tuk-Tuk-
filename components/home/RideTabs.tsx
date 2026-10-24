"use client";

import Link from "next/link";
import { useState } from "react";
import { useBooking } from "../Providers";
import { TRIPS, type Trip } from "@/lib/places";

const TABS = [
  { id: "ride", label: "Rides" },
  { id: "tour", label: "Temple tours" },
  { id: "daytrip", label: "Day trips" },
] as const;

const TAG_STYLES = ["bg-[#f3efe5] text-[#5d6a63]", "bg-green-soft text-[#0c6350]", "bg-[#ffe7e0] text-[#b23a1d]", "bg-[#f2e9d6] text-[#7a5a22]"];
const ICON_STYLES = ["bg-sun-soft text-[#7a5600]", "bg-green-soft text-green", "bg-[#ffe7e0] text-[#b23a1d]", "bg-[#f2e9d6] text-[#7a5a22]"];

function Card({ trip, index }: { trip: Trip; index: number }) {
  const { openBooking } = useBooking();
  const dropoff = trip.name === "Airport transfer" ? "airport" : trip.name === "Railway station transfer" ? "railway-station" : undefined;
  return (
    <article className="card flex flex-col gap-2.5 p-6 transition duration-300 hover:-translate-y-1.5 hover:border-green/35 hover:shadow-soft">
      <div className="mb-1.5 flex items-start justify-between gap-2.5">
        <span className={`grid h-[46px] w-[46px] place-items-center rounded-[14px] ${ICON_STYLES[index % 4]}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[25px] w-[25px]" aria-hidden>
            {trip.category === "ride" ? (
              <>
                <path d="M4 14h16v4H4z" />
                <path d="M5 14c0-3 2-5 5-5h4c3 0 5 2 5 5" />
                <circle cx="7.5" cy="18.5" r="2" />
                <circle cx="16.5" cy="18.5" r="2" />
                <path d="M9 9V6h6v3" />
              </>
            ) : trip.category === "tour" ? (
              <>
                <path d="M12 2l3 6H9l3-6Z" />
                <path d="M8 8h8l2 5H6l2-5Z" />
                <path d="M5 13h14v8H5z" />
              </>
            ) : (
              <>
                <path d="M4 4h16" />
                <path d="M8 4v9M12 4v12M16 4v9" />
                <path d="M3 20c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" />
              </>
            )}
          </svg>
        </span>
        <span className={`whitespace-nowrap rounded-full px-2.5 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.07em] ${TAG_STYLES[index % 4]}`}>{trip.tag}</span>
      </div>
      <h3 className="text-xl font-bold tracking-tight">{trip.name}</h3>
      <p className="flex-1 text-[0.87rem] leading-relaxed text-ink-soft">{trip.blurb}</p>
      <ul className="flex flex-wrap gap-2">
        {trip.meta.map((m) => (
          <li key={m} className="rounded-[7px] bg-cream px-2 py-1 text-[0.68rem] font-medium text-[#6b766f]">
            {m}
          </li>
        ))}
      </ul>
      <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-line pt-4">
        <span className="grid font-display text-[0.92rem] font-bold leading-tight">
          Agree by phone
          <small className="mt-0.5 font-sans text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-muted">with your rider</small>
        </span>
        <div className="flex items-center gap-2">
          {trip.page && (
            <Link href={trip.page} className="text-[0.78rem] font-semibold text-green underline decoration-green/40 underline-offset-4">
              Details
            </Link>
          )}
          <button type="button" onClick={() => openBooking(trip.slug, dropoff)} className="btn btn-dark btn-sm">
            Find a rider
          </button>
        </div>
      </div>
    </article>
  );
}

export function RideTabs() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("ride");
  const trips = TRIPS.filter((t) => t.category === tab);
  return (
    <div>
      <div role="tablist" aria-label="Ride types" className="mb-8 flex w-full gap-1 rounded-full bg-cream-2 p-1 sm:inline-flex sm:w-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="ride-panel"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-full px-5 py-2.5 text-[0.82rem] font-semibold transition sm:flex-none sm:text-[0.9rem] ${
              tab === t.id ? "bg-paper text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div id="ride-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="grid gap-[18px] md:grid-cols-2 lg:grid-cols-3">
        {trips.map((t, i) => (
          <Card key={t.name} trip={t} index={i} />
        ))}
      </div>
    </div>
  );
}
