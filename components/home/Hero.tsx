import Image from "next/image";
import { BookingForm } from "../BookingForm";
import { HeroShell } from "../HeroShell";

// On phones the headline steps aside once the map is open, so the map has room.
const hideOnMobileWhenMap = "group-data-[active=true]:max-lg:hidden";

function Illustration() {
  return (
    <div className="relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-[#ffe9bd] shadow-[0_40px_80px_-50px_rgb(80_50_0/0.55)]">
        <Image
          src="/images/khajuraho-hero.webp"
          alt="A green and yellow tuk tuk on a Khajuraho road in front of the carved sandstone temples at sunset"
          fill
          priority
          sizes="(min-width: 1024px) 560px, (min-width: 640px) 580px, 100vw"
          className="object-cover"
        />
        <div className="absolute left-3 top-3 flex items-center gap-2.5 rounded-2xl bg-paper px-3.5 py-2.5 text-xs shadow-[0_14px_30px_-14px_rgb(60_35_0/0.45)] sm:left-5 sm:top-5">
          <span aria-hidden className="h-2.5 w-2.5 animate-ping-soft rounded-full bg-[#12846a]" />
          <div>
            <strong className="block text-[0.82rem]">Riders nearby</strong>
            <span className="text-[0.7rem] text-muted">Call and agree your price</span>
          </div>
        </div>
      </div>
      {/* A small map card, in the style of the ride app */}
      <div className="absolute -bottom-5 right-3 w-[40%] max-w-[230px] overflow-hidden rounded-2xl border-4 border-paper bg-[#e9f0e7] shadow-[0_24px_50px_-26px_rgb(40_30_0/0.6)] sm:-right-4">
        <div className="relative aspect-[10/9]">
          <Image src="/images/hero-map.svg" alt="" fill sizes="250px" className="object-cover" />
          <span className="absolute bottom-2 left-2 rounded-full bg-paper px-2.5 py-1 text-[0.66rem] font-bold shadow">Khajuraho</span>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <HeroShell illustration={<Illustration />}>
      <p className={`inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1.5 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-green ${hideOnMobileWhenMap}`}>
        <span aria-hidden className="h-2 w-2 rounded-full bg-green" />
        Tuk tuks in Khajuraho
      </p>
      <h1 className={`mb-4 mt-5 text-[clamp(2.4rem,11vw,3.4rem)] font-bold leading-[1] tracking-tight sm:text-[clamp(2.8rem,5vw,4.4rem)] ${hideOnMobileWhenMap}`}>
        Khajuraho.
        <br />
        One tap <span className="bg-[linear-gradient(transparent_58%,#ffc928_58%,#ffc928_94%,transparent_94%)] px-1">away.</span>
      </h1>
      <p className={`mb-7 max-w-[500px] text-base leading-relaxed text-ink-soft ${hideOnMobileWhenMap}`}>
        Local tuk tuk riders at your fingertips. Tell us where you&apos;re going and a rider calls you to agree the price.
      </p>
      <div className="group-data-[active=true]:max-lg:mt-0">
        <BookingForm showQuickPicks />
      </div>
    </HeroShell>
  );
}
