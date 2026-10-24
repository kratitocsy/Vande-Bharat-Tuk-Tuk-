import Image from "next/image";
import { BookingForm } from "../BookingForm";
import { HeroShell } from "../HeroShell";
import { StarIcon } from "../Icons";

// On phones the headline steps aside once the map is open, so the map has room.
const hideOnMobileWhenMap = "group-data-[active=true]:max-lg:hidden";

function Illustration() {
  return (
    <div className="relative aspect-[797/653] overflow-hidden rounded-[28px] border border-[#f0debb] bg-[#ffe9bd] shadow-[0_50px_90px_-60px_rgb(80_50_0/0.55)] sm:rounded-[36px]">
      <Image
        src="/images/khajuraho-hero.webp"
        alt="A green and yellow tuk tuk on a Khajuraho road in front of the carved sandstone temples at sunset"
        fill
        priority
        sizes="(min-width: 1024px) 560px, (min-width: 640px) 580px, 100vw"
        className="object-cover"
      />
      <div className="absolute left-4 top-4 z-[3] flex animate-float items-center gap-2.5 rounded-2xl bg-paper px-3.5 py-3 text-xs shadow-[0_14px_30px_-14px_rgb(60_35_0/0.45)] sm:left-6 sm:top-6">
        <span aria-hidden className="h-2.5 w-2.5 animate-ping-soft rounded-full bg-[#12846a]" />
        <div>
          <strong className="block text-[0.82rem]">Tuk Tuk nearby</strong>
          <span className="text-[0.7rem] text-muted">Riders available now</span>
        </div>
      </div>
      <div className="absolute left-3 top-[76px] z-[3] flex animate-float items-center gap-3 rounded-2xl bg-paper px-3 py-2.5 text-xs shadow-[0_14px_30px_-14px_rgb(60_35_0/0.45)] [animation-delay:-1.2s] sm:left-5 sm:top-[88px] sm:px-3.5">
        <div className="pr-3">
          <span className="label block text-[0.55rem]">You decide</span>
          <strong className="font-display text-[1.05rem] leading-tight tracking-tight sm:text-[1.2rem]">Your price</strong>
        </div>
        <div className="border-l border-line pl-3">
          <strong className="block text-[0.68rem] sm:text-[0.78rem]">Call a rider, agree the fare</strong>
          <span className="text-[0.62rem] text-muted sm:text-[0.7rem]">No meter, no surprises</span>
        </div>
      </div>
      <div className="absolute right-5 top-5 z-[3] hidden animate-float items-center gap-2 rounded-2xl bg-paper px-3.5 py-3 shadow-[0_14px_30px_-14px_rgb(60_35_0/0.45)] [animation-delay:-2.2s] sm:right-6 sm:top-6 sm:flex">
        <StarIcon className="h-[17px] w-[17px] text-[#e9a500]" />
        <div>
          <strong className="block text-[0.82rem]">Temple tours</strong>
          <span className="text-[0.62rem] text-muted">Ask a rider</span>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <HeroShell illustration={<Illustration />}>
      <p className={`eyebrow ${hideOnMobileWhenMap}`}>
        Khajuraho&apos;s three-wheeled way to move
        <svg className="ml-0.5 h-8 w-6 text-[#c98a55]" viewBox="0 0 40 52" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20 2v4M17 8h6M16 10h8l-1 5H17zM14 15h12l-1 5H15zM12 20h16l-1 6H13zM10 26h20l-1 7H11zM7 33h26v4H7zM4 37h32v13H4z" />
          <path d="M16 50V41h8v9" />
        </svg>
      </p>
      <h1 className={`mb-5 mt-4 text-[clamp(2.3rem,10.5vw,3.2rem)] font-bold leading-[0.96] sm:text-[clamp(2.7rem,5vw,4.6rem)] sm:whitespace-nowrap ${hideOnMobileWhenMap}`}>
        Hop in.
        <br />
        <span className="bg-[linear-gradient(transparent_62%,#ffd15c_62%,#ffd15c_92%,transparent_92%)] px-0.5">Explore Khajuraho.</span>
      </h1>
      <p className={`max-w-[520px] text-base leading-relaxed text-ink-soft sm:text-[1.05rem] ${hideOnMobileWhenMap}`}>
        Tuk tuks at your fingertips. Visit temples, museums, local markets and nearby attractions. Tell us where you&apos;re going, and a local
        rider calls you to agree the price.
      </p>
      <div className="mt-7 group-data-[active=true]:max-lg:mt-0">
        <BookingForm showQuickPicks />
      </div>
      <ul className="mt-7 flex max-w-[540px] flex-wrap gap-x-9 gap-y-4 border-t border-line pt-6 group-data-[active=true]:max-lg:hidden">
        {[
          ["Call", "Agree your price"],
          ["3", "Temple groups"],
          ["Cash · UPI", "Pay the rider"],
        ].map(([big, small]) => (
          <li key={small}>
            <strong className="block font-display text-[1.3rem] leading-none tracking-tight sm:text-[1.55rem]">{big}</strong>
            <span className="mt-1 block text-[0.7rem] font-medium uppercase tracking-[0.1em] text-muted">{small}</span>
          </li>
        ))}
      </ul>
    </HeroShell>
  );
}
