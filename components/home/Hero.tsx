import Image from "next/image";
import { BookingForm } from "../BookingForm";
import { HeroShell } from "../HeroShell";

// On phones the headline steps aside once the map is open, so the map has room.
const hideOnMobileWhenMap = "group-data-[active=true]:max-lg:hidden";

function Illustration() {
  return (
    <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-[#ffe9bd] lg:aspect-[3/2.3]">
      <Image
        src="/images/khajuraho-hero.webp"
        alt="A green and yellow tuk tuk on a Khajuraho road in front of the carved sandstone temples at sunset"
        fill
        priority
        sizes="(min-width: 1024px) 560px, (min-width: 640px) 580px, 100vw"
        className="object-cover"
      />
    </div>
  );
}

export function Hero() {
  return (
    <HeroShell illustration={<Illustration />}>
      <p className={`flex items-center gap-2 text-[0.95rem] font-medium ${hideOnMobileWhenMap}`}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
          <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
        </svg>
        Khajuraho, MP <span className="text-muted">· tuk tuks only here</span>
      </p>
      <h1 className={`mb-6 mt-4 text-[clamp(2.4rem,11vw,3.4rem)] font-bold leading-[1.02] tracking-tight sm:text-[clamp(2.8rem,5vw,4.2rem)] ${hideOnMobileWhenMap}`}>
        Request a ride
      </h1>
      <div className="group-data-[active=true]:max-lg:mt-0">
        <BookingForm showQuickPicks />
      </div>
    </HeroShell>
  );
}
