"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Header } from "@/components/Header";
import { PhoneIcon, WhatsAppIcon } from "@/components/Icons";
import { useToast } from "@/components/Providers";
import { PHONE_DISPLAY, PHONE_HREF, formatPhone, whatsappLink } from "@/lib/config";
import { friendlyError, getSupabase } from "@/lib/supabase";

type Me = { id: string; name: string; phone: string; is_available: boolean };
type Req = {
  id: string;
  booking_code: string;
  status: "new" | "confirmed" | "driver_assigned" | "completed" | "cancelled";
  trip_name: string;
  pickup_name: string;
  dropoff_name: string | null;
  scheduled_at: string | null;
  passengers: number;
  customer_name: string;
  customer_phone: string;
  pickup_note: string | null;
  budget: number | null;
  agreed_fare: number | null;
  created_at: string;
  mine: boolean;
};

const REFRESH_MS = 15000;

function when(r: Req) {
  const d = new Date(r.scheduled_at ?? r.created_at);
  const text = d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
  return r.scheduled_at ? `Pickup ${text}` : `Asked ${text}`;
}

function route(r: Req) {
  return r.dropoff_name ? `${r.pickup_name} → ${r.dropoff_name}` : `${r.trip_name} from ${r.pickup_name}`;
}

export default function RiderPage() {
  const { show } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<Me | null | undefined>(undefined); // undefined = not loaded yet
  const [requests, setRequests] = useState<Req[]>([]);
  const [tab, setTab] = useState<"new" | "mine" | "done">("new");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [fares, setFares] = useState<Record<string, string>>({});

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session ------------------------------------------------------------------
  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const loadMe = useCallback(async () => {
    const { data, error } = await getSupabase().rpc("rider_me");
    if (error) {
      show(friendlyError(error));
      setMe(null);
      return;
    }
    setMe(Array.isArray(data) && data.length ? (data[0] as Me) : null);
  }, [show]);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getSupabase().rpc("rider_requests");
    setLoading(false);
    if (error) {
      if (error.code === "42501") setMe(null);
      else show(friendlyError(error));
      return;
    }
    setRequests((data ?? []) as Req[]);
  }, [show]);

  useEffect(() => {
    if (!session) {
      setMe(undefined);
      setRequests([]);
      return;
    }
    loadMe();
  }, [session, loadMe]);

  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (!me) return;
    loadRequests();
    timer.current = setInterval(loadRequests, REFRESH_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [me, loadRequests]);

  // Auth ---------------------------------------------------------------------
  async function submitAuth(e: React.FormEvent) {
    e.preventDefault();
    setNotice("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return show("Enter a valid email address");
    if (password.length < 6) return show("Password must be at least 6 characters");
    setAuthBusy(true);
    const supabase = getSupabase();
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) show(/invalid/i.test(error.message) ? "Wrong email or password" : /confirm/i.test(error.message) ? "Confirm your email first. Check your inbox." : error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) show(error.message);
      else if (!data.session) setNotice("Account created. Check your email and tap the confirmation link, then log in here.");
    }
    setAuthBusy(false);
  }

  async function signOut() {
    await getSupabase().auth.signOut();
    setMe(undefined);
    setRequests([]);
  }

  // Actions ------------------------------------------------------------------
  async function act(id: string, fn: string, args: Record<string, unknown>, ok: string) {
    setBusyId(id);
    const { error } = await getSupabase().rpc(fn, args);
    setBusyId(null);
    if (error) show(friendlyError(error));
    else show(ok);
    loadRequests();
  }

  async function toggleAvailable() {
    if (!me) return;
    const next = !me.is_available;
    const { error } = await getSupabase().rpc("rider_set_available", { p_available: next });
    if (error) return show(friendlyError(error));
    setMe({ ...me, is_available: next });
    show(next ? "You are shown as available" : "You are hidden from the public list");
  }

  const lists = {
    new: requests.filter((r) => r.status === "new"),
    mine: requests.filter((r) => r.mine && r.status === "driver_assigned"),
    done: requests.filter((r) => r.mine && (r.status === "completed" || r.status === "cancelled")),
  };
  const shown = lists[tab];

  // Screens ------------------------------------------------------------------
  const shell = (children: React.ReactNode) => (
    <>
      <Header />
      <main id="main" className="min-h-[70vh] py-10 sm:py-14">
        <div className="container-x max-w-[760px]">{children}</div>
      </main>
    </>
  );

  if (!ready) return shell(<p className="text-ink-soft">Loading…</p>);

  if (!session) {
    return shell(
      <div className="card mx-auto max-w-[440px] p-7 sm:p-9">
        <p className="eyebrow">Riders</p>
        <h1 className="mb-2 mt-3 text-3xl font-bold">{mode === "login" ? "Rider login" : "Create rider account"}</h1>
        <p className="mb-6 text-[0.92rem] leading-relaxed text-ink-soft">
          See ride requests in Khajuraho, accept them and call the customer. Your account must be approved by Mahi before requests show up.
        </p>
        <form onSubmit={submitAuth} noValidate className="grid gap-3.5">
          <div className="grid gap-1">
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          </div>
          <div className="grid gap-1">
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>
          <button type="submit" disabled={authBusy} className="btn btn-dark btn-block mt-1 py-3.5">
            {authBusy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
        {notice && <p className="mt-4 rounded-xl bg-green-soft p-3 text-sm text-green">{notice}</p>}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setNotice("");
          }}
          className="mt-5 text-sm font-semibold text-green underline underline-offset-4"
        >
          {mode === "login" ? "New rider? Create an account" : "Already have an account? Log in"}
        </button>
        <p className="mt-6 border-t border-line pt-4 text-[0.82rem] text-muted">
          Want to ride with us? Call Mahi on <a href={PHONE_HREF} className="font-semibold text-green">{PHONE_DISPLAY}</a> to get approved.
        </p>
      </div>,
    );
  }

  if (me === undefined) return shell(<p className="text-ink-soft">Loading your account…</p>);

  if (me === null) {
    return shell(
      <div className="card mx-auto max-w-[480px] p-7 sm:p-9">
        <p className="eyebrow">Almost there</p>
        <h1 className="mb-3 mt-3 text-3xl font-bold">Waiting for approval</h1>
        <p className="mb-4 text-[0.95rem] leading-relaxed text-ink-soft">
          You are signed in as <strong className="text-ink">{session.user.email}</strong>, but this email is not approved as a rider yet. Call Mahi on{" "}
          <a href={PHONE_HREF} className="font-semibold text-green">{PHONE_DISPLAY}</a> and ask to be added with this email. Make sure you have confirmed your email too.
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={loadMe} className="btn btn-dark">Check again</button>
          <button type="button" onClick={signOut} className="btn btn-outline">Log out</button>
        </div>
      </div>,
    );
  }

  return shell(
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Rider view</p>
          <h1 className="mt-2 text-3xl font-bold">Hi {me.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleAvailable}
            aria-pressed={me.is_available}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
              me.is_available ? "border-green/40 bg-green-soft text-green" : "border-line bg-paper text-ink-soft"
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${me.is_available ? "bg-[#12846a]" : "bg-[#b9b3a5]"}`} />
            {me.is_available ? "Available" : "Not available"}
          </button>
          <button type="button" onClick={signOut} className="text-sm font-semibold text-ink-soft underline underline-offset-4">Log out</button>
        </div>
      </div>

      <div role="tablist" aria-label="Requests" className="mb-6 flex gap-1 rounded-full bg-cream-2 p-1">
        {([
          ["new", "New", lists.new.length],
          ["mine", "My rides", lists.mine.length],
          ["done", "Done", lists.done.length],
        ] as const).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex-1 rounded-full px-3 py-2.5 text-sm font-semibold transition ${tab === id ? "bg-paper text-ink shadow-sm" : "text-ink-soft"}`}
          >
            {label} <span className="ml-1 rounded-full bg-sun px-2 py-0.5 text-[0.7rem] text-ink">{count}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between text-xs text-muted">
        <span>{loading ? "Refreshing…" : "Updates every 15 seconds"}</span>
        <button type="button" onClick={loadRequests} className="font-semibold text-green underline underline-offset-4">Refresh now</button>
      </div>

      {shown.length === 0 ? (
        <div className="card p-8 text-center text-ink-soft">
          {tab === "new" ? "No new requests right now. Keep this page open and we will show them here." : tab === "mine" ? "You have no active rides." : "Nothing finished yet."}
        </div>
      ) : (
        <ul className="grid gap-4">
          {shown.map((r) => {
            const msg = `Hi ${r.customer_name}, this is ${me.name} from Indo Tuk Tuk about your request ${r.booking_code} (${route(r)}). Please let me know when you are ready, and we can agree the price.`;
            const busy = busyId === r.id;
            return (
              <li key={r.id} className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="label">{r.booking_code} · {r.trip_name}</span>
                    <h2 className="mt-1 font-display text-[1.15rem] font-bold leading-snug tracking-tight">{route(r)}</h2>
                  </div>
                  <span className="rounded-full bg-sun-soft px-3 py-1 text-xs font-semibold">{when(r)}</span>
                </div>
                <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-[0.9rem] sm:grid-cols-2">
                  <div className="flex gap-2"><dt className="text-muted">Customer</dt><dd className="font-medium">{r.customer_name}</dd></div>
                  <div className="flex gap-2"><dt className="text-muted">People</dt><dd className="font-medium">{r.passengers}</dd></div>
                  <div className="flex gap-2"><dt className="text-muted">Budget</dt><dd className="font-medium">{r.budget ? `₹${r.budget}` : "Not given"}</dd></div>
                  {r.agreed_fare !== null && (
                    <div className="flex gap-2"><dt className="text-muted">Agreed</dt><dd className="font-medium">₹{r.agreed_fare}</dd></div>
                  )}
                  {r.pickup_note && (
                    <div className="flex gap-2 sm:col-span-2"><dt className="text-muted">Note</dt><dd className="font-medium">{r.pickup_note}</dd></div>
                  )}
                </dl>

                {r.status === "new" && (
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <button type="button" disabled={busy} onClick={() => act(r.id, "rider_accept", { p_booking: r.id }, "Accepted. Call the customer now.")} className="btn btn-dark">
                      {busy ? "Please wait…" : "Accept this ride"}
                    </button>
                  </div>
                )}

                {r.status === "driver_assigned" && r.mine && (
                  <div className="mt-4 grid gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <a href={`tel:${r.customer_phone}`} className="btn btn-dark btn-sm"><PhoneIcon className="h-4 w-4" /> Call {formatPhone(r.customer_phone)}</a>
                      <a href={whatsappLink(r.customer_phone, msg)} target="_blank" rel="noopener" className="btn btn-outline btn-sm">
                        <WhatsAppIcon className="h-4 w-4 text-[#1a9e55]" /> WhatsApp
                      </a>
                    </div>
                    <div className="flex flex-wrap items-end gap-2.5 border-t border-dashed border-line pt-3">
                      <div className="grid gap-1">
                        <label htmlFor={`fare-${r.id}`} className="label">Agreed price (₹)</label>
                        <input
                          id={`fare-${r.id}`}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={fares[r.id] ?? ""}
                          onChange={(e) => setFares({ ...fares, [r.id]: e.target.value })}
                          className="input w-36"
                          placeholder="e.g. 150"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          const fare = Number(fares[r.id]);
                          if (!Number.isFinite(fare) || fares[r.id] === undefined || fares[r.id] === "") return show("Enter the price you agreed");
                          act(r.id, "rider_complete", { p_booking: r.id, p_fare: Math.round(fare) }, "Ride marked as done");
                        }}
                        className="btn btn-sun btn-sm"
                      >
                        Mark done
                      </button>
                      <button type="button" disabled={busy} onClick={() => act(r.id, "rider_release", { p_booking: r.id }, "Given back to other riders")} className="btn btn-outline btn-sm">
                        Give back
                      </button>
                      <button type="button" disabled={busy} onClick={() => act(r.id, "rider_cancel", { p_booking: r.id }, "Ride cancelled")} className="btn btn-outline btn-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {r.mine && (r.status === "completed" || r.status === "cancelled") && (
                  <p className="mt-3 text-sm font-semibold text-ink-soft">{r.status === "completed" ? "Completed" : "Cancelled"}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        <Link href="/" className="underline underline-offset-4">Back to the website</Link>
      </p>
    </div>,
  );
}
