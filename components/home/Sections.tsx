import Link from "next/link";
import { CheckIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "../Icons";
import { PLACES } from "@/lib/places";
import { CONTACT_NAME, PHONE_DISPLAY, PHONE_HREF, whatsappLink, PHONE_E164 } from "@/lib/config";

function SectionHead({ eyebrow, title, sub, id }: { eyebrow: string; title: string; sub?: string; id?: string }) {
  return (
    <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id} className="section-title mt-3.5 max-w-[640px]">
          {title}
        </h2>
      </div>
      {sub && <p className="max-w-[430px] text-[0.95rem] leading-relaxed text-ink-soft">{sub}</p>}
    </div>
  );
}
export { SectionHead };

export function HowItWorks() {
  const steps = [
    { n: "01", t: "Choose your pickup", d: "Your hotel, a temple, the bus stand, the airport or the station. Pick it from the list and tap Find riders.", icon: <PinIcon className="h-6 w-6" /> },
    {
      n: "02",
      t: "Contact a rider",
      d: "See which riders are available. Call or WhatsApp one, or leave your number and a rider calls you.",
      icon: <PhoneIcon className="h-6 w-6" />,
    },
    {
      n: "03",
      t: "Agree the price, then ride",
      d: "You and the rider agree the price on the call. Pay cash or UPI at the end.",
      icon: <CheckIcon className="h-6 w-6" strokeWidth={2} />,
    },
  ];
  return (
    <section id="how" className="section" aria-labelledby="how-title">
      <div className="container-x">
        <SectionHead id="how-title" eyebrow="How it works" title="Booked before your chai cools." sub="No app to download and no haggling at the gate. Book here, and a local rider comes to you." />
        <ol className="grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="card relative overflow-hidden p-7 transition hover:-translate-y-1 hover:shadow-soft">
              <span aria-hidden className="absolute right-6 top-4 font-display text-5xl font-bold text-[#efe6d3]">
                {s.n}
              </span>
              <span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-ink text-sun">{s.icon}</span>
              <h3 className="mb-2 text-[1.3rem] font-bold tracking-tight">{s.t}</h3>
              <p className="max-w-[300px] text-[0.92rem] leading-relaxed text-ink-soft">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Why() {
  const items = [
    { t: "A price you agree", d: "Talk to the rider before you ride and agree the price together. No meter, no surprises.", tone: "bg-sun-soft text-[#7a5600]" },
    { t: "Riders who know the temples", d: "Local riders who know the gates, the timings and the quiet corners.", tone: "bg-green-soft text-green" },
    { t: "Waits while you explore", d: "On tours your rider waits at each stop, so you never hunt for a ride back.", tone: "bg-[#ffe7e0] text-[#b23a1d]" },
    { t: "Talk to a real person", d: `Call or WhatsApp ${CONTACT_NAME} on ${PHONE_DISPLAY} before, during or after your ride.`, tone: "bg-[#f2e9d6] text-[#7a5a22]" },
  ];
  return (
    <section id="why" className="section bg-paper" aria-labelledby="why-title">
      <div className="container-x">
        <SectionHead id="why-title" eyebrow="Why Indo Tuk Tuk" title="Small wheels. Big peace of mind." />
        <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          {items.map((i) => (
            <article key={i.t} className="card bg-cream p-6 transition hover:-translate-y-1 hover:shadow-soft">
              <span className={`mb-5 grid h-12 w-12 place-items-center rounded-2xl ${i.tone}`}>
                <CheckIcon className="h-6 w-6" strokeWidth={2} />
              </span>
              <h3 className="mb-2 text-[1.12rem] font-bold tracking-tight">{i.t}</h3>
              <p className="text-[0.88rem] leading-relaxed text-ink-soft">{i.d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Safety() {
  const points = ["Rider name and number shared before pickup", "Price agreed before you ride", "Your auto is yours, no sharing with strangers", "A real person on the phone if you need help"];
  return (
    <section id="safety" className="section" aria-labelledby="safety-title">
      <div className="container-x">
        <div className="grid items-center gap-10 overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_85%_10%,#14705a_0%,#0b2f27_55%)] p-7 text-white sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:p-14">
          <div>
            <p className="eyebrow eyebrow-light">Safety first, always</p>
            <h2 id="safety-title" className="mt-3.5 text-[clamp(1.85rem,3.4vw,2.8rem)] font-bold">
              Every ride has a safety net built in.
            </h2>
            <p className="mt-4 max-w-[480px] text-[0.97rem] leading-relaxed text-white/70">
              From the moment you book to the moment you step out, you know who is driving and who to call.
            </p>
            <ul className="mt-6 grid gap-3.5">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[0.95rem] text-white/90">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sun/20 text-sun">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <Link href="/#faq" className="btn btn-light mt-8">
              Read common questions
            </Link>
          </div>

          <div className="mx-auto w-full max-w-[380px] rounded-[26px] bg-paper p-6 text-ink shadow-2xl">
            <p className="label">Questions before you ride?</p>
            <div className="mt-4 flex items-center gap-3.5">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-sun font-display text-xl font-bold">M</span>
              <div>
                <strong className="block text-lg">{CONTACT_NAME}</strong>
                <span className="font-display text-xl font-bold tracking-tight">{PHONE_DISPLAY}</span>
              </div>
            </div>
            <p className="mt-4 text-[0.88rem] leading-relaxed text-ink-soft">Call or message to book directly, change a ride, or ask about temple timings.</p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <a href={PHONE_HREF} className="btn btn-dark">
                <PhoneIcon className="h-4 w-4" /> Call
              </a>
              <a href={whatsappLink(PHONE_E164, "Hi Mahi, I'd like to book a tuk tuk in Khajuraho.")} target="_blank" rel="noopener" className="btn btn-outline">
                <WhatsAppIcon className="h-4 w-4 text-[#1a9e55]" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Places() {
  return (
    <section id="places" className="section border-y border-line bg-paper" aria-labelledby="places-title">
      <div className="container-x grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-12">
        <div>
          <p className="eyebrow">Where we go</p>
          <h2 id="places-title" className="mb-3.5 mt-3.5 text-[clamp(2rem,3.4vw,2.8rem)] font-bold">
            All of Khajuraho, from hotel door to temple gate.
          </h2>
          <p className="max-w-[380px] text-[0.93rem] leading-relaxed text-ink-soft">
            These are our regular pickup and drop-off points. Staying somewhere else in town? Pick &quot;Khajuraho town&quot; and add your hotel name.
          </p>
        </div>
        <div>
          <ul className="flex flex-wrap gap-2.5">
            {PLACES.filter((p) => p.slug !== "khajuraho-town").map((p) => (
              <li key={p.slug} className="rounded-full border border-line bg-cream px-4 py-2 text-[0.85rem] font-medium transition hover:-translate-y-0.5 hover:border-green/35 hover:bg-green-soft hover:text-green">
                {p.name.replace(/ \(.*\)$/, "")}
              </li>
            ))}
            <li className="rounded-full border border-line bg-cream px-4 py-2 text-[0.85rem] font-medium">Your hotel or homestay</li>
          </ul>
          <p className="mt-5 text-[0.85rem] text-muted">
            Going further? See our <Link href="/raneh-falls-tuk-tuk" className="font-semibold text-green underline decoration-green/40 underline-offset-4">Raneh Falls</Link>,{" "}
            <Link href="/panna-national-park-tuk-tuk" className="font-semibold text-green underline decoration-green/40 underline-offset-4">Panna</Link> and{" "}
            <Link href="/pandav-falls-tuk-tuk" className="font-semibold text-green underline decoration-green/40 underline-offset-4">Pandav Falls</Link> day trips.
          </p>
        </div>
      </div>
    </section>
  );
}
