"use client";

import { useState } from "react";
import { ArrowIcon } from "../Icons";
import { useToast } from "../Providers";
import { friendlyError, getSupabase } from "@/lib/supabase";

type Role = "driver" | "hotel";

export function Partner() {
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("driver");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function start(r: Role) {
    setRole(r);
    setOpen(true);
    window.setTimeout(() => document.getElementById("partner-form")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return show("Add your name");
    if (phone.replace(/\D/g, "").length < 10) return show("Add a phone number we can call");
    setBusy(true);
    const { error } = await getSupabase().rpc("submit_partner_enquiry", {
      p_role: role,
      p_name: name,
      p_phone: phone,
      p_message: message || null,
    });
    setBusy(false);
    if (error) return show(friendlyError(error));
    show(`Thanks ${name.trim().split(" ")[0]}. We'll call you soon.`);
    setName("");
    setPhone("");
    setMessage("");
    setOpen(false);
  }

  return (
    <section id="drive" className="section pt-0 md:pt-0" aria-label="Partner with Indo Tuk Tuk">
      <div className="container-x grid gap-5 md:grid-cols-2">
        <article className="relative flex min-h-[320px] flex-col items-start overflow-hidden rounded-[28px] bg-[#ffd15c] bg-[radial-gradient(rgb(11_47_39/0.13)_1.2px,transparent_1.2px)] [background-size:24px_24px] p-7 sm:p-10">
          <p className="eyebrow">Drive with us</p>
          <h2 className="relative z-[2] mb-3 mt-3 max-w-[360px] text-[clamp(1.75rem,2.6vw,2.3rem)] font-bold">Own an auto in Khajuraho? Ride with us.</h2>
          <p className="relative z-[2] mb-6 max-w-[330px] text-[0.9rem] leading-relaxed text-[#34453d]">
            Get bookings from visitors and locals, keep your own hours, and earn a fair price on every trip.
          </p>
          <button type="button" onClick={() => start("driver")} className="btn btn-dark relative z-[2] mt-auto">
            Apply to drive <ArrowIcon className="h-4 w-4" />
          </button>
          <svg viewBox="0 0 240 150" fill="none" aria-hidden className="pointer-events-none absolute -bottom-2 -right-3.5 w-[210px] opacity-60 sm:w-[250px] sm:opacity-90">
            <circle cx="170" cy="54" r="44" fill="#ffc53d" opacity=".5" />
            <path d="M30 108c0-16 8-24 22-24h78c12 0 20 8 22 22l4 14H30v-12Z" fill="#0b2f27" />
            <path d="M52 84c0-22 12-34 30-36l52-4c16-1 26 7 30 22l8 26H60l-8-8Z" fill="#ffc53d" />
            <rect x="66" y="58" width="44" height="18" rx="6" fill="#cdeee8" />
            <rect x="118" y="56" width="30" height="20" rx="6" fill="#cdeee8" />
            <circle cx="74" cy="110" r="17" fill="#15191b" />
            <circle cx="74" cy="110" r="8" fill="#f5e9cf" />
            <circle cx="176" cy="110" r="17" fill="#15191b" />
            <circle cx="176" cy="110" r="8" fill="#f5e9cf" />
          </svg>
        </article>

        <article className="card relative flex min-h-[320px] flex-col items-start overflow-hidden rounded-[28px] p-7 sm:p-10">
          <p className="eyebrow">Hotels &amp; homestays</p>
          <h2 className="relative z-[2] mb-3 mt-3 max-w-[360px] text-[clamp(1.75rem,2.6vw,2.3rem)] font-bold">Give your guests a ride they can trust.</h2>
          <p className="relative z-[2] mb-6 max-w-[330px] text-[0.9rem] leading-relaxed text-ink-soft">
            Book autos for your guests for station pickups, temple days and everything in between.
          </p>
          <button type="button" onClick={() => start("hotel")} className="btn btn-outline relative z-[2] mt-auto">
            Partner with us <ArrowIcon className="h-4 w-4" />
          </button>
          <svg viewBox="0 0 240 150" fill="none" aria-hidden className="pointer-events-none absolute -bottom-2 -right-3.5 w-[210px] opacity-50 sm:w-[250px] sm:opacity-90">
            <rect x="36" y="36" width="168" height="92" rx="12" fill="#fffdf7" stroke="#dcd3c3" />
            <rect x="36" y="36" width="168" height="24" rx="12" fill="#0b2f27" />
            <circle cx="52" cy="48" r="4" fill="#ffc53d" />
            <rect x="54" y="74" width="64" height="8" rx="4" fill="#dcd3c3" />
            <rect x="54" y="90" width="100" height="8" rx="4" fill="#ece5d7" />
            <rect x="150" y="74" width="36" height="40" rx="8" fill="#ffc53d" />
          </svg>
        </article>

        {open && (
          <form id="partner-form" onSubmit={submit} noValidate className="card grid gap-4 rounded-[28px] p-6 sm:p-8 md:col-span-2">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">{role === "hotel" ? "Partner with us" : "Apply to drive"}</h3>
              <p className="mt-1 text-sm text-ink-soft">Leave your number and we&apos;ll call you back.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="grid gap-1">
                <label htmlFor="partner-role" className="label">I am</label>
                <select id="partner-role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="input">
                  <option value="driver">An auto driver</option>
                  <option value="hotel">A hotel or homestay</option>
                </select>
              </div>
              <div className="grid gap-1">
                <label htmlFor="partner-name" className="label">Name</label>
                <input id="partner-name" value={name} onChange={(e) => setName(e.target.value)} type="text" autoComplete="name" maxLength={80} className="input" />
              </div>
              <div className="grid gap-1">
                <label htmlFor="partner-phone" className="label">Phone</label>
                <input id="partner-phone" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" autoComplete="tel" inputMode="tel" placeholder="98765 43210" maxLength={20} className="input" />
              </div>
              <div className="grid gap-1 md:col-span-3">
                <label htmlFor="partner-message" className="label">Anything we should know? (optional)</label>
                <input id="partner-message" value={message} onChange={(e) => setMessage(e.target.value)} type="text" maxLength={500} placeholder="e.g. auto number, hotel name, best time to call" className="input" />
              </div>
            </div>
            <button type="submit" disabled={busy} className="btn btn-dark w-full justify-self-start sm:w-auto">
              {busy ? "Sending…" : "Send"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
