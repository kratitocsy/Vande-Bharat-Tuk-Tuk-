import Link from "next/link";
import { LogoMark } from "./Logo";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/config";

const TOUR_LINKS = [
  { path: "/khajuraho-temple-tour", label: "Full temple circuit" },
  { path: "/western-group-of-temples-tuk-tuk", label: "Western Group of Temples" },
  { path: "/light-and-sound-show-khajuraho", label: "Light & Sound Show" },
  { path: "/raneh-falls-tuk-tuk", label: "Raneh Falls" },
  { path: "/panna-national-park-tuk-tuk", label: "Panna National Park" },
  { path: "/pandav-falls-tuk-tuk", label: "Pandav Falls" },
];

export function Footer() {
  const year = new Date().getFullYear();
  const col = "grid content-start gap-3 text-sm";
  const h = "mb-1 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-white/60";
  const a = "text-white/75 transition hover:text-sun";
  return (
    <footer className="bg-[#0b0f0d] pb-10 pt-16 text-white/80">
      <div className="container-x">
        <div className="grid gap-10 border-b border-white/10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-semibold text-white" aria-label="Indo Tuk Tuk home">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
                <LogoMark light />
              </span>
              <span>
                Indo<strong className="ml-1 text-sun">Tuk Tuk</strong>
              </span>
            </Link>
            <p className="mt-4 max-w-[260px] text-sm text-white/60">Khajuraho, three wheels at a time.</p>
          </div>

          <nav className={col} aria-label="Rides">
            <h3 className={h}>Rides</h3>
            <Link className={a} href="/#rides">City rides</Link>
            <Link className={a} href="/khajuraho-airport-transfer">Airport transfer</Link>
            <Link className={a} href="/khajuraho-railway-station-transfer">Railway station transfer</Link>
          </nav>
          <nav className={col} aria-label="Tours">
            <h3 className={h}>Tours</h3>
            {TOUR_LINKS.map((l) => (
              <Link key={l.path} className={a} href={l.path}>
                {l.label}
              </Link>
            ))}
          </nav>
          <nav className={col} aria-label="Help">
            <h3 className={h}>Help</h3>
            <a className={a} href={PHONE_HREF}>Call Mahi: {PHONE_DISPLAY}</a>
            <Link className={a} href="/#faq">Questions</Link>
            <Link className={a} href="/#safety">Safety</Link>
            <Link className={a} href="/#places">Where we go</Link>
          </nav>
          <nav className={col} aria-label="Partner">
            <h3 className={h}>Partner</h3>
            <Link className={a} href="/#drive">Drive with us</Link>
            <Link className={a} href="/#drive">Hotels &amp; homestays</Link>
            <Link className={a} href="/rider">Rider login</Link>
          </nav>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 text-[0.8rem] text-white/50">
          <p>&copy; {year} Indo Tuk Tuk, Khajuraho, Madhya Pradesh.</p>
          <Link href="/" className="hover:text-sun">Back to home</Link>
        </div>
      </div>
    </footer>
  );
}
