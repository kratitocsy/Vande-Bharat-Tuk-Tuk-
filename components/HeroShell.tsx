"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type HeroApi = { active: boolean; setActive: (v: boolean) => void; slot: HTMLElement | null };
const HeroContext = createContext<HeroApi>({ active: false, setActive: () => {}, slot: null });
export const useHero = () => useContext(HeroContext);

/**
 * The home page hero. The temple picture is shown at first. As soon as someone starts typing a
 * pickup or drop-off, the map fades in behind the whole hero and the picture fades out.
 * The booking form puts the map into `slot` (see BookingForm).
 */
export function HeroShell({ illustration, children }: { illustration: ReactNode; children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const api = useMemo(() => ({ active, setActive, slot }), [active, slot]);

  return (
    <HeroContext.Provider value={api}>
      <section
        id="book"
        data-active={active}
        className="group relative isolate overflow-hidden pb-16 pt-9 transition-[padding] duration-500 sm:pb-20 sm:pt-12 lg:min-h-[720px] lg:pb-24 lg:pt-14 max-lg:data-[active=true]:pb-[380px]"
      >
        {/* The map, behind everything */}
        <div
          ref={setSlot}
          className={`absolute inset-0 -z-20 bg-[#e9efe6] transition-opacity duration-500 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
        />
        {/* Soft cream wash so the text stays readable over the map */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 -z-10 transition-opacity duration-500 ${
            active ? "opacity-100" : "opacity-0"
          } bg-[linear-gradient(90deg,rgba(251,248,241,.97)_0%,rgba(251,248,241,.86)_36%,rgba(251,248,241,0)_60%)] max-lg:bg-[linear-gradient(180deg,rgba(251,248,241,.97)_0%,rgba(251,248,241,.7)_45%,rgba(251,248,241,0)_100%)]`}
        />
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,#ffe39a_0%,transparent_65%)] opacity-70" />

        <div className="container-x pointer-events-none relative grid items-center gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-14">
          <div className="pointer-events-auto min-w-0">{children}</div>
          <div
            className={`pointer-events-none mx-auto w-full max-w-[580px] min-w-0 transition-opacity duration-500 lg:max-w-none ${
              active ? "opacity-0 max-lg:hidden" : "opacity-100"
            }`}
          >
            {illustration}
          </div>
        </div>
      </section>
    </HeroContext.Provider>
  );
}
